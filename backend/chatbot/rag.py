import os
import re

import chromadb
import requests

client = chromadb.PersistentClient(path='./chroma_db')
collection = client.get_or_create_collection('documents_gemini')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_BASE_URL = os.getenv('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta').rstrip('/')
GEMINI_MODEL_ID = os.getenv('GEMINI_MODEL_ID', 'models/gemini-flash-lite-latest').strip()
GEMINI_EMBEDDING_MODEL = os.getenv('GEMINI_EMBEDDING_MODEL', 'models/gemini-embedding-001').strip()
GEMINI_CONNECT_TIMEOUT = float(os.getenv('GEMINI_CONNECT_TIMEOUT', '10'))
GEMINI_READ_TIMEOUT = float(os.getenv('GEMINI_READ_TIMEOUT', '120'))
IDENTITY_QUESTION_PATTERNS = (
    r'\bwhose resume\b',
    r'\bwho(?:m)? does this resume belong to\b',
    r'\bwhat is the name(?: of (?:this|the) resume)?\b',
    r'\bresume owner\b',
    r'\bwhose document\b',
)


def _normalize_chunks(text_chunks):
    normalized_chunks = []

    for index, chunk in enumerate(text_chunks):
        if isinstance(chunk, dict):
            text = str(chunk.get('text', '')).strip()
            section = chunk.get('section', 'general')
            source = chunk.get('source', 'resume')
        else:
            text = str(chunk).strip()
            section = 'general'
            source = 'resume'

        if not text:
            continue

        normalized_chunks.append({
            'text': text,
            'section': section,
            'source': source,
            'chunk_index': index,
        })

    return normalized_chunks


def _gemini_model_name(model_id):
    return model_id.split('/', 1)[1] if model_id.startswith('models/') else model_id


def _gemini_request(model_id, action, payload):
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY is not configured.')

    url = f'{GEMINI_BASE_URL}/models/{_gemini_model_name(model_id)}:{action}'

    try:
        response = requests.post(
            url,
            params={'key': GEMINI_API_KEY},
            json=payload,
            timeout=(GEMINI_CONNECT_TIMEOUT, GEMINI_READ_TIMEOUT),
        )
        response.raise_for_status()
    except requests.RequestException as error:
        detail = None
        response = getattr(error, 'response', None)
        if response is not None:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text

        if detail:
            raise RuntimeError(f'Gemini request failed: {detail}') from error

        raise RuntimeError(f'Gemini request failed: {error}') from error

    try:
        return response.json()
    except ValueError as error:
        raise RuntimeError('Gemini returned an invalid JSON response.') from error


def _embed_text(text):
    payload = {
        'content': {
            'parts': [{'text': text}],
        },
    }
    response = _gemini_request(GEMINI_EMBEDDING_MODEL, 'embedContent', payload)
    embedding = response.get('embedding') or {}
    values = embedding.get('values') or embedding.get('value')

    if not values:
        raise RuntimeError('Gemini embedding response did not include vector values.')

    return values


def _generate_with_gemini(prompt):
    payload = {
        'systemInstruction': {
            'parts': [
                {
                    'text': (
                        'You answer questions strictly from the provided document context. '
                        'If the answer is not present, say exactly: "I could not find that information in the document." '
                        'Do not invent facts.'
                    ),
                },
            ],
        },
        'contents': [
            {
                'role': 'user',
                'parts': [{'text': prompt}],
            },
        ],
        'generationConfig': {
            'temperature': 0,
            'topP': 1,
            'maxOutputTokens': 512,
        },
    }

    response = _gemini_request(GEMINI_MODEL_ID, 'generateContent', payload)
    candidates = response.get('candidates') or []

    if not candidates:
        prompt_feedback = response.get('promptFeedback') or {}
        raise RuntimeError(prompt_feedback.get('blockReasonMessage') or 'Gemini did not return an answer.')

    content = candidates[0].get('content') or {}
    parts = content.get('parts') or []
    answer = ''.join(part.get('text', '') for part in parts if isinstance(part, dict)).strip()

    if not answer:
        raise RuntimeError('Gemini returned an empty answer.')

    return answer


def store_document(document_id, text_chunks):
    normalized_chunks = _normalize_chunks(text_chunks)
    chunk_texts = [chunk['text'] for chunk in normalized_chunks]
    if not chunk_texts:
        return

    embeddings = [_embed_text(chunk_text) for chunk_text in chunk_texts]
    ids = [f'doc_{document_id}_chunk_{chunk["chunk_index"]}' for chunk in normalized_chunks]
    metadatas = [
        {
            'document_id': document_id,
            'chunk_index': chunk['chunk_index'],
            'section': chunk['section'],
            'source': chunk['source'],
        }
        for chunk in normalized_chunks
    ]

    collection.add(
        documents=chunk_texts,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas,
    )


def remove_document(document_id):
    chunk_ids = collection.get(where={'document_id': document_id}).get('ids', [])

    if chunk_ids:
        collection.delete(ids=chunk_ids)


def _gemini_unavailable_message(error):
    return (
        f'Gemini is unavailable: {error}. '
        'Check GEMINI_API_KEY, GEMINI_MODEL_ID, and GEMINI_EMBEDDING_MODEL.'
    )


def _tokenize(text):
    return set(re.findall(r'[a-z0-9]+', text.lower()))


def _score_chunk(question_tokens, chunk):
    chunk_text = chunk['text']
    chunk_tokens = _tokenize(chunk_text)
    section = chunk.get('section', 'general')
    section_tokens = _tokenize(section)

    overlap = len(question_tokens.intersection(chunk_tokens))
    exact_phrase_bonus = 10 if question_tokens and ' '.join(sorted(question_tokens)) in chunk_text.lower() else 0
    section_bonus = len(question_tokens.intersection(section_tokens))

    keyword_boost = 0
    question_text = ' '.join(sorted(question_tokens))
    if any(keyword in question_text for keyword in ('skill', 'technolog', 'tool', 'language')):
        if section in {'technical skills', 'skills', 'technologies', 'tools'}:
            keyword_boost += 8

    return overlap + exact_phrase_bonus + section_bonus + keyword_boost


def _is_identity_question(question):
    normalized_question = question.lower().strip()
    return any(re.search(pattern, normalized_question) for pattern in IDENTITY_QUESTION_PATTERNS)


def _document_chunks(document_id):
    results = collection.get(where={'document_id': document_id}, include=['documents', 'metadatas'])
    documents = results.get('documents', []) or []
    metadatas = results.get('metadatas', []) or []

    chunks = []
    for document, metadata in zip(documents, metadatas):
        if not document:
            continue

        chunks.append({
            'text': document,
            'metadata': metadata or {},
        })

    return sorted(chunks, key=lambda chunk: chunk['metadata'].get('chunk_index', 0))


def _looks_like_name_line(line):
    normalized = re.sub(r'\s+', ' ', line).strip()
    if not normalized:
        return False

    if len(normalized) > 60:
        return False

    if any(char.isdigit() for char in normalized):
        return False

    word_count = len(normalized.split())
    if word_count < 2 or word_count > 5:
        return False

    if normalized.lower().startswith(('email', 'phone', 'linkedin', 'github', 'contact', 'objective', 'summary')):
        return False

    return normalized == normalized.title() or normalized.isupper()


def _extract_resume_owner(text):
    lines = [re.sub(r'\s+', ' ', line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]

    for line in lines[:12]:
        match = re.search(r'\bname\s*[:\-]\s*([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){1,3})', line, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()

    for line in lines[:8]:
        if _looks_like_name_line(line):
            return line

    joined_head = ' '.join(lines[:6])
    match = re.search(r'\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\b', joined_head)
    if match:
        candidate = match.group(1).strip()
        if _looks_like_name_line(candidate):
            return candidate

    return None


def _rank_chunks(question, chunks):
    question_tokens = _tokenize(question)
    scored_chunks = [(_score_chunk(question_tokens, chunk), chunk) for chunk in chunks]

    scored_chunks.sort(key=lambda item: item[0], reverse=True)
    return [chunk for score, chunk in scored_chunks]


def _select_context_chunks(question, chunks):
    ranked_chunks = _rank_chunks(question, chunks)

    if not ranked_chunks:
        return []

    question_text = question.lower().strip()
    exact_matches = [chunk for chunk in ranked_chunks if question_text and question_text in chunk['text'].lower()]

    if exact_matches:
        return exact_matches[:2]

    return ranked_chunks[:4]


def _hybrid_document_chunks(question, document_id=None):
    documents, metadatas = _query_chunks(question, document_id=document_id)

    paired_chunks = [
        {'text': document, 'metadata': metadata or {}}
        for document, metadata in zip(documents, metadatas)
        if document
    ]

    if document_id is None or not paired_chunks:
        return paired_chunks

    all_document_chunks = _document_chunks(document_id)
    if not all_document_chunks:
        return paired_chunks

    question_tokens = _tokenize(question)
    lexical_ranked = sorted(
        all_document_chunks,
        key=lambda chunk: _score_chunk(question_tokens, chunk),
        reverse=True,
    )

    combined = []
    seen_texts = set()

    for chunk in paired_chunks + lexical_ranked:
        text = chunk['text']
        if text in seen_texts:
            continue
        seen_texts.add(text)
        combined.append(chunk)

    return combined[:8]


def _build_context_from_chunks(chunks):
    selected_documents = [chunk['text'] for chunk in chunks]
    return '\n\n'.join(selected_documents)


def _query_chunks(question, document_id=None):
    query_embedding = _embed_text(question)
    base_where = {'document_id': document_id} if document_id is not None else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=8,
        include=['documents', 'metadatas'],
        where=base_where,
    )
    documents = results.get('documents', [[]])
    metadatas = results.get('metadatas', [[]])
    documents = documents[0] if documents else []
    metadatas = metadatas[0] if metadatas else []
    return documents, metadatas


def ask_question(question, document_id=None):
    if _is_identity_question(question) and document_id is not None:
        document_chunks = _document_chunks(document_id)
        owner_text = _build_context_from_chunks(document_chunks[:3])
        owner_name = _extract_resume_owner(owner_text)

        if owner_name:
            return f'This appears to be {owner_name}\'s resume.'

        return 'I could not determine the resume owner from the document.'

    paired_chunks = _hybrid_document_chunks(question, document_id=document_id)
    ranked_chunks = _select_context_chunks(
        question,
        [
            {
                'text': chunk['text'],
                'section': chunk['metadata'].get('section', 'general'),
                'source': chunk['metadata'].get('source', 'resume'),
            }
            for chunk in paired_chunks
        ],
    ) if paired_chunks else []
    selected_documents = [chunk['text'] for chunk in ranked_chunks]
    if not selected_documents:
        return 'I could not find that information in the document.'

    context = '\n\n'.join(selected_documents)

    prompt = f"""
Use only the document context below to answer the question.
If the answer is not present in the context, say exactly:
I could not find that information in the document.
If the question asks whose resume/document this is, answer only when the name is clearly present in the context.

Context:
{context}

Question:
{question}

Answer:
"""

    try:
        return _generate_with_gemini(prompt)
    except RuntimeError as error:
        raise RuntimeError(_gemini_unavailable_message(error)) from error

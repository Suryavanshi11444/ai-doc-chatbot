import os
import re

import chromadb
import requests
from sentence_transformers import SentenceTransformer

client = chromadb.PersistentClient(path='./chroma_db')
collection = client.get_or_create_collection('documents')
model = SentenceTransformer('all-MiniLM-L6-v2')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434').rstrip('/')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3')
OLLAMA_CONNECT_TIMEOUT = float(os.getenv('OLLAMA_CONNECT_TIMEOUT', '5'))
OLLAMA_READ_TIMEOUT = float(os.getenv('OLLAMA_READ_TIMEOUT', '120'))


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


def store_document(document_id, text_chunks):
    normalized_chunks = _normalize_chunks(text_chunks)
    chunk_texts = [chunk['text'] for chunk in normalized_chunks]
    embeddings = model.encode(chunk_texts).tolist()
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


def _ollama_unavailable_message(error):
    return (
        f'Ollama is unavailable at {OLLAMA_BASE_URL}: {error}. '
        'Start Ollama, confirm the model is available, or set OLLAMA_BASE_URL to the correct host.'
    )


def _fallback_answer(context):
    sentences = re.split(r'(?<=[.!?])\s+', context.strip())
    if sentences and sentences[0]:
        return ' '.join(sentences[:4]).strip()

    return context[:1000].strip()


def _tokenize(text):
    return set(re.findall(r'[a-z0-9]+', text.lower()))


def _rank_chunks(question, chunks):
    question_tokens = _tokenize(question)
    scored_chunks = []

    for chunk in chunks:
        chunk_text = chunk['text']
        chunk_tokens = _tokenize(chunk_text)

        overlap = len(question_tokens.intersection(chunk_tokens))
        exact_phrase_bonus = 10 if question.lower() in chunk_text.lower() else 0
        score = overlap + exact_phrase_bonus
        scored_chunks.append((score, chunk))

    scored_chunks.sort(key=lambda item: item[0], reverse=True)
    return [chunk for score, chunk in scored_chunks if score > 0]


def _select_context_chunks(question, chunks):
    ranked_chunks = _rank_chunks(question, chunks)

    if not ranked_chunks:
        return []

    question_text = question.lower().strip()
    exact_matches = [chunk for chunk in ranked_chunks if question_text and question_text in chunk['text'].lower()]

    if exact_matches:
        return exact_matches[:2]

    return ranked_chunks[:2]


def _query_chunks(question, document_id=None):
    query_embedding = model.encode([question]).tolist()[0]
    base_where = {'document_id': document_id} if document_id is not None else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3,
        include=['documents', 'metadatas'],
        where=base_where,
    )
    documents = results.get('documents', [[]])
    metadatas = results.get('metadatas', [[]])
    documents = documents[0] if documents else []
    metadatas = metadatas[0] if metadatas else []
    return documents, metadatas


def ask_question(question, document_id=None):
    documents, metadatas = _query_chunks(question, document_id=document_id)

    paired_chunks = [
        {'text': document, 'metadata': metadata or {}}
        for document, metadata in zip(documents, metadatas)
        if document
    ]
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
    context = '\n\n'.join(selected_documents) if selected_documents else 'No matching document context was found.'

    prompt = f"""
You are a resume assistant.

Answer ONLY from the provided context.

If the answer is not found, say:
"I could not find that information in the document."

Keep answers concise and professional.

Context:
{context}

Question:
{question}

Answer:
"""

    try:
        response = requests.post(
            f'{OLLAMA_BASE_URL}/api/generate',
            json={
                'model': OLLAMA_MODEL,
                'prompt': prompt,
                'stream': False,
            },
            timeout=(OLLAMA_CONNECT_TIMEOUT, OLLAMA_READ_TIMEOUT),
        )
        response.raise_for_status()
    except requests.ConnectionError as error:
        return _fallback_answer(context)
    except requests.Timeout as error:
        return _fallback_answer(context)
    except requests.RequestException as error:
        return _fallback_answer(context)

    try:
        payload = response.json()
    except ValueError as error:
        return _fallback_answer(context)

    if 'response' not in payload:
        return _fallback_answer(context)

    return payload['response']

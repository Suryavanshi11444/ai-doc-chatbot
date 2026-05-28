from pathlib import Path

from pypdf import PdfReader

try:
    from docx import Document as DocxDocument
except ImportError:  # pragma: no cover - optional dependency
    DocxDocument = None


def extract_text(file_path):
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == '.pdf':
        reader = PdfReader(str(path))

        text = []

        for page in reader.pages:
            page_text = page.extract_text() or ''
            if page_text:
                text.append(page_text)

        return '\n\n'.join(text).strip()

    if suffix in {'.txt', '.md', '.csv'}:
        return path.read_text(encoding='utf-8', errors='ignore').strip()

    if suffix == '.docx':
        if DocxDocument is None:
            raise ValueError('DOCX support requires python-docx to be installed.')

        document = DocxDocument(str(path))
        paragraphs = [
            paragraph.text.strip()
            for paragraph in document.paragraphs
            if paragraph.text and paragraph.text.strip()
        ]
        return '\n\n'.join(paragraphs).strip()

    raise ValueError(f'Unsupported document type: {suffix or "unknown"}')


def _is_heading(line):
    normalized = line.strip()
    if not normalized:
        return False

    if len(normalized) > 80:
        return False

    if normalized.endswith(('.', '!', '?', ':', ';')):
        return False

    word_count = len(normalized.split())
    if word_count > 10:
        return False

    return normalized.isupper() or normalized == normalized.title()


def _chunk_text_with_overlap(text, chunk_size=400, overlap=80):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += max(chunk_size - overlap, 1)

    return chunks


def chunk_text(text, chunk_size=400, overlap=80):
    chunks = []
    current_section = 'general'
    section_paragraphs = []
    paragraph_lines = []

    def flush_paragraph():
        nonlocal paragraph_lines, section_paragraphs

        if not paragraph_lines:
            return

        paragraph_text = ' '.join(paragraph_lines).strip()
        if paragraph_text:
            section_paragraphs.append(paragraph_text)

        paragraph_lines = []

    def flush_section():
        nonlocal section_paragraphs, current_section

        flush_paragraph()

        if not section_paragraphs:
            return

        section_text = '\n\n'.join(section_paragraphs).strip()
        for chunk in _chunk_text_with_overlap(section_text, chunk_size=chunk_size, overlap=overlap):
            chunks.append({
                'text': chunk,
                'section': current_section,
                'source': 'document',
            })

        section_paragraphs = []

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line:
            flush_paragraph()
            continue

        if _is_heading(line):
            flush_section()
            current_section = line.lower()
            continue

        paragraph_lines.append(line)

    flush_section()

    return chunks

from pypdf import PdfReader


SECTION_HEADINGS = {
    'education',
    'technical skills',
    'achievements & training',
    'professional experience',
    'projects',
}


def extract_text(pdf_path):
    reader = PdfReader(pdf_path)

    text = []

    for page in reader.pages:
        page_text = page.extract_text() or ''
        if page_text:
            text.append(page_text)

    return '\n\n'.join(text)


def _is_heading(line):
    normalized = line.strip()
    if not normalized:
        return False

    if normalized.lower() in SECTION_HEADINGS:
        return True

    return normalized.isupper() and len(normalized) <= 40


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
    section_lines = []

    def flush_section():
        nonlocal section_lines, current_section

        if not section_lines:
            return

        section_text = ' '.join(section_lines).strip()
        for chunk in _chunk_text_with_overlap(section_text, chunk_size=chunk_size, overlap=overlap):
            chunks.append({
                'text': chunk,
                'section': current_section,
                'source': 'project' if current_section == 'projects' else 'resume',
            })

        section_lines = []

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        if _is_heading(line):
            flush_section()
            current_section = line.lower()
            continue

        section_lines.append(line)

    flush_section()

    return chunks

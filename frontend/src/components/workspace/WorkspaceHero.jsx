export default function WorkspaceHero({
  activeDocument,
  formatTime,
  fileNameFromUrl,
  openFilePicker,
  setPreviewDocument,
  authMessage,
  authError,
}) {
  return (
    <article className="panel hero-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Upload and preview</p>
          <h2>Document ingestion pipeline</h2>
        </div>
        <button type="button" className="theme-toggle" onClick={openFilePicker}>
          Upload PDF
        </button>
      </div>

      <div className="hero-copy">
        <p>
          PDF uploads are extracted, chunked, embedded, and stored in ChromaDB. Use the chat panel to ask semantic
          questions against the active document.
        </p>
        <div className="pill-row">
          <span className="pill">Dark mode</span>
          <span className="pill">Light mode</span>
          <span className="pill">RAG search</span>
          <span className="pill">SQLite history</span>
        </div>
      </div>

      <div className="preview-card">
        <div>
          <span className="section-label">Focused document</span>
          <strong>{activeDocument ? fileNameFromUrl(activeDocument.file) : 'No document selected'}</strong>
          <p>{activeDocument ? formatTime(activeDocument.uploaded_at) : 'Pick a PDF to scope the chat.'}</p>
        </div>
        <button type="button" className="primary-button secondary" onClick={() => setPreviewDocument(activeDocument)}>
          Open preview
        </button>
      </div>

      {authMessage ? <div className="alert success">{authMessage}</div> : null}
      {authError ? <div className="alert error">{authError}</div> : null}
    </article>
  )
}
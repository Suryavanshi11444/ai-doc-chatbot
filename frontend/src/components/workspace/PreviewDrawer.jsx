export default function PreviewDrawer({ previewDocument, setPreviewDocument, formatTime, readableSize, mediaBase }) {
  if (!previewDocument) return null

  return (
    <div className="drawer-overlay" onClick={() => setPreviewDocument(null)}>
      <aside className="preview-drawer panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">PDF preview</p>
            <h2>{previewDocument.file.split('/').pop()}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={() => setPreviewDocument(null)}>
            Close
          </button>
        </div>

        <div className="preview-meta">
          <span>{formatTime(previewDocument.uploaded_at)}</span>
          <span>{previewDocument.file_size ? readableSize(previewDocument.file_size) : 'PDF file'}</span>
        </div>

        <iframe className="pdf-frame" src={`${mediaBase}${previewDocument.file}`} title="PDF preview" />
        <a className="primary-button secondary" href={`${mediaBase}${previewDocument.file}`} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </aside>
    </div>
  )
}
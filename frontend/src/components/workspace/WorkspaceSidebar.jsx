import TypingDots from '../TypingDots'

export default function WorkspaceSidebar({
  theme,
  toggleTheme,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  isUploading,
  dragActive,
  setDragActive,
  fileInputRef,
  handleUpload,
  handleDrop,
  openFilePicker,
  documentList,
  selectedDocumentId,
  setSelectedDocumentId,
  previewDocument,
  setPreviewDocument,
  handleDeleteDocument,
  user,
  handleLogout,
  activeDocument,
  formatTime,
  fileNameFromUrl,
}) {
  return (
    <aside className={sidebarCollapsed ? 'sidebar collapsed' : mobileSidebarOpen ? 'sidebar open' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="brand-mark">AI</div>
        <div className="brand-copy">
          <strong>Doc Orbit</strong>
          <span>Chat with your PDFs</span>
        </div>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="ghost-button" onClick={() => setSidebarCollapsed((value) => !value)}>
          {sidebarCollapsed ? 'Expand' : 'Collapse'}
        </button>
        <button type="button" className="ghost-button" onClick={() => setMobileSidebarOpen(false)}>
          Close
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Theme</div>
        <button type="button" className="theme-toggle full-width" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Upload document</div>
        <div
          className={dragActive ? 'dropzone active' : 'dropzone'}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf,.docx,.txt,.md,.csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleUpload(file)
              event.target.value = ''
            }}
          />
          <span className="dropzone-title">Drag & drop documents here</span>
          <span className="dropzone-subtitle">or click to browse PDF, DOCX, TXT, MD, or CSV files</span>
          {isUploading ? <TypingDots /> : null}
        </div>
      </div>

      <div className="sidebar-section grow">
        <div className="section-row">
          <div className="section-label">Documents</div>
          <button type="button" className="text-button" onClick={() => setPreviewDocument(activeDocument)}>
            Preview
          </button>
        </div>
        <div className="side-list">
          {documentList.length ? (
            documentList.map((document) => (
              <article
                key={document.id}
                className={document.id === selectedDocumentId ? 'list-card active' : 'list-card'}
                onClick={() => setSelectedDocumentId(document.id)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <strong>{fileNameFromUrl(document.file)}</strong>
                  <span>{formatTime(document.uploaded_at)}</span>
                </div>
                <div className="card-actions">
                  <span>{document.id === selectedDocumentId ? 'Active' : 'Ready'}</span>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setPreviewDocument(document)
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="mini-button danger"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDeleteDocument(document.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No documents uploaded yet.</div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="section-label">Account</div>
        <div className="account-card">
          <strong>{user.username}</strong>
          <span>Signed in</span>
        </div>
        <button type="button" className="ghost-button danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}
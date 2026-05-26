import MarkdownBlock from '../MarkdownBlock'

export default function HistoryDrawer({
  historyDrawerOpen,
  setHistoryDrawerOpen,
  historySearch,
  setHistorySearch,
  historyList,
  selectedHistoryId,
  setSelectedHistoryId,
  activeHistory,
  handleDeleteHistory,
  handleClearHistory,
  formatTime,
}) {
  if (!historyDrawerOpen) return null

  return (
    <div className="drawer-overlay" onClick={() => setHistoryDrawerOpen(false)}>
      <aside className="history-drawer panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">History</p>
            <h2>Conversation history</h2>
          </div>
          <button type="button" className="ghost-button" onClick={() => setHistoryDrawerOpen(false)}>
            Close
          </button>
        </div>

        <input
          className="search-input"
          value={historySearch}
          onChange={(event) => setHistorySearch(event.target.value)}
          placeholder="Search history"
        />

        <div className="history-shell">
          <div className="history-list">
            {historyList.length ? (
              historyList.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={selectedHistoryId === entry.id ? 'history-item active' : 'history-item'}
                  onClick={() => setSelectedHistoryId(entry.id)}
                >
                  <strong>{entry.question}</strong>
                  <span>{formatTime(entry.created_at)}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">No saved conversations found.</div>
            )}
          </div>

          <div className="history-detail">
            {activeHistory ? (
              <>
                <div className="detail-row">
                  <div>
                    <span className="section-label">Question</span>
                    <p>{activeHistory.question}</p>
                  </div>
                  <button type="button" className="ghost-button danger" onClick={() => handleDeleteHistory(activeHistory.id)}>
                    Delete chat
                  </button>
                </div>
                <div className="detail-answer">
                  <span className="section-label">Answer</span>
                  <MarkdownBlock text={activeHistory.answer} />
                </div>
              </>
            ) : (
              <div className="empty-chat">
                <h3>Select a conversation</h3>
                <p>Use the list on the left to inspect a saved response.</p>
              </div>
            )}

            <button type="button" className="ghost-button danger full-width" onClick={handleClearHistory}>
              Clear all history
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
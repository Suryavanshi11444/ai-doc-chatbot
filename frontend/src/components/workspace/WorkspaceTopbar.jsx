export default function WorkspaceTopbar({ theme, toggleTheme, setMobileSidebarOpen, setHistoryDrawerOpen }) {
  return (
    <header className="workspace-topbar panel">
      <div>
        <p className="eyebrow">AI document workspace</p>
        <h1>Chat with uploaded documents</h1>
      </div>

      <div className="topbar-actions">
        <button type="button" className="ghost-button mobile-only" onClick={() => setMobileSidebarOpen(true)}>
          Menu
        </button>
        <button type="button" className="ghost-button" onClick={() => setHistoryDrawerOpen(true)}>
          Conversation history
        </button>
        <button type="button" className="ghost-button" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </header>
  )
}
import WorkspaceSidebar from './workspace/WorkspaceSidebar'
import WorkspaceTopbar from './workspace/WorkspaceTopbar'
import WorkspaceHero from './workspace/WorkspaceHero'
import WorkspaceChat from './workspace/WorkspaceChat'
import HistoryDrawer from './workspace/HistoryDrawer'
import PreviewDrawer from './workspace/PreviewDrawer'

export default function Workspace(props) {
  return (
    <div className={`app-shell theme-${props.theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <WorkspaceSidebar {...props} />

      <main className={props.sidebarCollapsed ? 'workspace collapsed' : 'workspace'}>
        <WorkspaceTopbar
          theme={props.theme}
          toggleTheme={props.toggleTheme}
          setMobileSidebarOpen={props.setMobileSidebarOpen}
          setHistoryDrawerOpen={props.setHistoryDrawerOpen}
        />

        <section className="stats-grid">
          <article className="stat-card panel">
            <span>Documents</span>
            <strong>{props.documents.length}</strong>
          </article>
          <article className="stat-card panel">
            <span>Conversations</span>
            <strong>{props.history.length}</strong>
          </article>
          <article className="stat-card panel">
            <span>Selected doc</span>
            <strong>{props.activeDocument ? props.fileNameFromUrl(props.activeDocument.file) : 'All documents'}</strong>
          </article>
        </section>

        <section className="content-grid">
          <WorkspaceHero
            activeDocument={props.activeDocument}
            formatTime={props.formatTime}
            fileNameFromUrl={props.fileNameFromUrl}
            openFilePicker={props.openFilePicker}
            setPreviewDocument={props.setPreviewDocument}
            authMessage={props.authMessage}
            authError={props.authError}
          />

          <WorkspaceChat
            activeDocument={props.activeDocument}
            messages={props.messages}
            formatTime={props.formatTime}
            selectedDocumentId={props.selectedDocumentId}
            isSending={props.isSending}
            chatEndRef={props.chatEndRef}
            chatForm={props.chatForm}
            setChatForm={props.setChatForm}
            handleSendMessage={props.handleSendMessage}
          />
        </section>
      </main>

      <HistoryDrawer
        historyDrawerOpen={props.historyDrawerOpen}
        setHistoryDrawerOpen={props.setHistoryDrawerOpen}
        historySearch={props.historySearch}
        setHistorySearch={props.setHistorySearch}
        historyList={props.historyList}
        selectedHistoryId={props.selectedHistoryId}
        setSelectedHistoryId={props.setSelectedHistoryId}
        activeHistory={props.activeHistory}
        handleDeleteHistory={props.handleDeleteHistory}
        handleClearHistory={props.handleClearHistory}
        formatTime={props.formatTime}
      />

      <PreviewDrawer
        previewDocument={props.previewDocument}
        setPreviewDocument={props.setPreviewDocument}
        formatTime={props.formatTime}
        readableSize={props.readableSize}
        mediaBase={props.mediaBase}
      />
    </div>
  )
}
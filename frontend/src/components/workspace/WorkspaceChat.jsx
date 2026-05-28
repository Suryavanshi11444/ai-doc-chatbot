import MarkdownBlock from '../MarkdownBlock'
import TypingDots from '../TypingDots'

export default function WorkspaceChat({
  activeDocument,
  messages,
  formatTime,
  selectedDocumentId,
  isSending,
  chatEndRef,
  chatForm,
  setChatForm,
  handleSendMessage,
}) {
  return (
    <article className="panel chat-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Chat interface</p>
          <h2>Ask questions from your PDFs</h2>
        </div>
        <div className="panel-chip">{activeDocument ? activeDocument.file.split('/').pop() : 'All documents'}</div>
      </div>

      <div className="chat-feed">
        {messages.length ? (
          messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'bubble user' : 'bubble assistant'}>
              <div className="bubble-meta">
                <span>{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <div className="bubble-content">
                {message.role === 'assistant' ? <MarkdownBlock text={message.content} /> : <p>{message.content}</p>}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-chat">
            <h3>Start the conversation</h3>
            <p>Upload a document and ask a question to generate a grounded answer.</p>
          </div>
        )}

        {isSending ? (
          <div className="bubble assistant pending">
            <div className="bubble-meta">
              <span>AI Assistant</span>
              <span>Thinking</span>
            </div>
            <TypingDots />
          </div>
        ) : null}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSendMessage}>
        <textarea
          value={chatForm.question}
          onChange={(event) => setChatForm({ question: event.target.value })}
          placeholder="Ask a question about the selected PDF..."
          rows="3"
        />
        <div className="form-actions">
          <div className="helper-text">
            {selectedDocumentId ? 'Chat scoped to the selected document.' : 'No document selected; searching all uploads.'}
          </div>
          <button className="primary-button" type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send question'}
          </button>
        </div>
      </form>
    </article>
  )
}
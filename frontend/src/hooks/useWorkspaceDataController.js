import { useEffect, useMemo, useRef, useState } from 'react'

export default function useWorkspaceDataController(requestJson, session) {
  const [documents, setDocuments] = useState([])
  const [history, setHistory] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [messages, setMessages] = useState([])
  const [documentSearch, setDocumentSearch] = useState('')
  const [historySearch, setHistorySearch] = useState('')

  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  const activeDocument = documents.find((document) => document.id === selectedDocumentId) || null
  const activeHistory = history.find((entry) => entry.id === selectedHistoryId) || null

  const documentList = useMemo(() => {
    const query = documentSearch.trim().toLowerCase()
    if (!query) return documents
    return documents.filter((document) => (document.file || '').split('/').pop().toLowerCase().includes(query))
  }, [documentSearch, documents])

  const historyList = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    if (!query) return history
    return history.filter((entry) => `${entry.question} ${entry.answer}`.toLowerCase().includes(query))
  }, [history, historySearch])

  function historyToMessages(entries) {
    return [...entries]
      .sort((left, right) => new Date(left.created_at) - new Date(right.created_at))
      .flatMap((entry) => [
        {
          id: `question-${entry.id}`,
          role: 'user',
          content: entry.question,
          createdAt: entry.created_at,
        },
        {
          id: `answer-${entry.id}`,
          role: 'assistant',
          content: entry.answer,
          createdAt: entry.created_at,
        },
      ])
  }

  async function hydrateWorkspace() {
    if (!session.accessToken) {
      session.setBooting(false)
      return
    }

    try {
      const [me, docs, chatHistory] = await Promise.all([requestJson('/me/'), requestJson('/documents/'), requestJson('/history/')])

      session.setUser(me)
      setDocuments(Array.isArray(docs) ? docs : [])
      setHistory(Array.isArray(chatHistory) ? chatHistory : [])
      setMessages(historyToMessages(Array.isArray(chatHistory) ? chatHistory : []))

      if (!selectedDocumentId && Array.isArray(docs) && docs.length > 0) {
        setSelectedDocumentId(docs[0].id)
      }
    } catch (error) {
      session.setAuthError(error.message)
      session.clearSession()
    } finally {
      session.setBooting(false)
    }
  }

  useEffect(() => {
    if (session.accessToken) {
      hydrateWorkspace()
    }
  }, [session.accessToken])

  useEffect(() => {
    if (documents.length > 0 && !selectedDocumentId) {
      setSelectedDocumentId(documents[0].id)
    }
  }, [documents, selectedDocumentId])

  return {
    documents,
    history,
    messages,
    selectedDocumentId,
    selectedHistoryId,
    documentSearch,
    historySearch,
    fileInputRef,
    chatEndRef,
    activeDocument,
    activeHistory,
    documentList,
    historyList,
    setDocuments,
    setHistory,
    setMessages,
    setSelectedDocumentId,
    setSelectedHistoryId,
    setDocumentSearch,
    setHistorySearch,
  }
}
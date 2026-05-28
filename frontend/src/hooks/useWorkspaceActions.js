import { useState } from 'react'

const emptyChatForm = {
  question: '',
}

export default function useWorkspaceActions(requestJson, session, data) {
  const [chatForm, setChatForm] = useState(emptyChatForm)
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)

  function isSupportedDocument(file) {
    if (!file) return false

    const fileName = (file.name || '').toLowerCase()
    const mimeType = (file.type || '').toLowerCase()

    return (
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('text') ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.csv')
    )
  }

  async function loadDocumentsAndHistory() {
    const [docs, chatHistory] = await Promise.all([requestJson('/documents/'), requestJson('/history/')])
    data.setDocuments(Array.isArray(docs) ? docs : [])
    data.setHistory(Array.isArray(chatHistory) ? chatHistory : [])
    data.setMessages(
      [...(Array.isArray(chatHistory) ? chatHistory : [])]
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
        ]),
    )
  }

  async function handleUpload(file) {
    if (!isSupportedDocument(file)) {
      session.setAuthError('Please upload a supported document file such as PDF, DOCX, TXT, MD, or CSV.')
      return
    }

    try {
      setIsUploading(true)
      session.setAuthError('')

      const formData = new FormData()
      formData.append('file', file)

      const uploadedDocument = await requestJson('/upload/', { method: 'POST', body: formData }, true)

      await loadDocumentsAndHistory()
      if (uploadedDocument?.id) {
        data.setSelectedDocumentId(uploadedDocument.id)
      }
      session.setAuthMessage('Document uploaded and indexed successfully.')
    } catch {
      session.setAuthError('Upload failed. Confirm the backend is running and the file is a supported document.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteDocument(documentId) {
    await requestJson(`/documents/${documentId}/`, { method: 'DELETE' })
    await loadDocumentsAndHistory()
    if (data.selectedDocumentId === documentId) {
      const nextDocument = data.documents.find((document) => document.id !== documentId) || null
      data.setSelectedDocumentId(nextDocument?.id || null)
    }
  }

  async function handleDeleteHistory(historyId) {
    await requestJson(`/history/${historyId}/`, { method: 'DELETE' })
    await loadDocumentsAndHistory()
    if (data.selectedHistoryId === historyId) {
      data.setSelectedHistoryId(null)
    }
  }

  async function handleClearHistory() {
    await requestJson('/history/clear/', { method: 'DELETE' })
    await loadDocumentsAndHistory()
    data.setSelectedHistoryId(null)
  }

  async function handleSendMessage(event) {
    event.preventDefault()
    const trimmedQuestion = chatForm.question.trim()
    if (!trimmedQuestion || isSending) return

    const userBubble = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    }

    data.setMessages((current) => [...current, userBubble])
    setChatForm(emptyChatForm)
    setIsSending(true)

    try {
      const response = await requestJson('/chat/', {
        method: 'POST',
        body: {
          question: trimmedQuestion,
          document_id: data.selectedDocumentId,
        },
      })

      const assistantBubble = {
        id: `temp-answer-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        createdAt: response.created_at || new Date().toISOString(),
      }

      data.setMessages((current) => [...current, assistantBubble])
      await loadDocumentsAndHistory()
    } catch (error) {
      session.setAuthError(error.message || 'Chat request failed. Make sure your Gemini API key is configured and the backend can reach Google.')
      data.setMessages((current) => current.slice(0, -1))
    } finally {
      setIsSending(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      handleUpload(droppedFile)
    }
  }

  function openFilePicker() {
    data.fileInputRef.current?.click()
  }

  return {
    chatForm,
    isUploading,
    isSending,
    dragActive,
    sidebarCollapsed,
    mobileSidebarOpen,
    historyDrawerOpen,
    previewDocument,
    setChatForm,
    setSidebarCollapsed,
    setMobileSidebarOpen,
    setHistoryDrawerOpen,
    setPreviewDocument,
    setDragActive,
    setIsUploading,
    setIsSending,
    handleUpload,
    handleDeleteDocument,
    handleDeleteHistory,
    handleClearHistory,
    handleSendMessage,
    handleDrop,
    openFilePicker,
  }
}
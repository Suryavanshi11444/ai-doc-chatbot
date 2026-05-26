function inlineMarkdown(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>
    }

    if (segment.startsWith('`') && segment.endsWith('`')) {
      return <code key={index}>{segment.slice(1, -1)}</code>
    }

    return <span key={index}>{segment}</span>
  })
}

export default function MarkdownBlock({ text }) {
  const lines = text.split('\n')
  const nodes = []
  let listItems = []

  const flushList = () => {
    if (!listItems.length) return

    nodes.push(
      <ul key={`list-${nodes.length}`} className="markdown-list">
        {listItems.map((item) => item)}
      </ul>,
    )
    listItems = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(<li key={`item-${index}`}>{inlineMarkdown(trimmed.slice(2))}</li>)
      return
    }

    flushList()

    if (trimmed.startsWith('### ')) {
      nodes.push(<h4 key={`h4-${index}`}>{inlineMarkdown(trimmed.slice(4))}</h4>)
      return
    }

    if (trimmed.startsWith('## ')) {
      nodes.push(<h3 key={`h3-${index}`}>{inlineMarkdown(trimmed.slice(3))}</h3>)
      return
    }

    if (trimmed.startsWith('# ')) {
      nodes.push(<h2 key={`h2-${index}`}>{inlineMarkdown(trimmed.slice(2))}</h2>)
      return
    }

    nodes.push(<p key={`p-${index}`}>{inlineMarkdown(trimmed)}</p>)
  })

  flushList()

  return <>{nodes}</>
}
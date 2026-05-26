export function formatTime(value) {
  if (!value) return ''

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fileNameFromUrl(value) {
  if (!value) return 'Document'

  return value.split('/').pop()
}

export function readableSize(bytes) {
  if (!bytes) return '0 KB'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** index

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}
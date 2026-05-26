import './App.css'
import AuthScreen from './components/AuthScreen'
import Workspace from './components/Workspace'
import useAppController from './hooks/useAppController'
import { fileNameFromUrl, formatTime, readableSize } from './utils/formatters'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL || ''

function App() {
  const app = useAppController()

  if (app.booting) {
    return (
      <div className={`app-shell theme-${app.theme}`}>
        <div className="boot-screen">
          <div className="boot-card">
            <div className="boot-mark" />
            <p>Starting workspace</p>
            <span className="typing-dots" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!app.accessToken || !app.user) {
    return (
      <AuthScreen
        theme={app.theme}
        toggleTheme={app.toggleTheme}
        authMode={app.authMode}
        setAuthMode={app.setAuthMode}
        authForm={app.authForm}
        setAuthForm={app.setAuthForm}
        authError={app.authError}
        authMessage={app.authMessage}
        handleAuthSubmit={app.handleAuthSubmit}
      />
    )
  }

  return (
    <Workspace
      {...app}
      fileNameFromUrl={fileNameFromUrl}
      formatTime={formatTime}
      readableSize={readableSize}
      mediaBase={MEDIA_BASE}
    />
  )
}

export default App

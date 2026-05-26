export default function AuthScreen({
  theme,
  toggleTheme,
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authError,
  authMessage,
  handleAuthSubmit,
}) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="auth-background" />
      <div className="auth-screen">
        <section className="auth-hero panel">
          <div className="eyebrow">AI Document Chat</div>
          <h1>Modern document intelligence for PDFs, history, and AI chat.</h1>
          <p>
            Upload documents, ask questions, and keep every conversation stored in SQLite with a polished interface
            built for demos.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <span>Auth</span>
              <strong>JWT sign in</strong>
            </div>
            <div className="feature-card">
              <span>Search</span>
              <strong>RAG retrieval</strong>
            </div>
            <div className="feature-card">
              <span>UI</span>
              <strong>Dark and light themes</strong>
            </div>
            <div className="feature-card">
              <span>History</span>
              <strong>Stored in SQLite</strong>
            </div>
          </div>
        </section>

        <section className="panel auth-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workspace access</p>
              <h2>{authMode === 'login' ? 'Login' : 'Create account'}</h2>
            </div>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div className="tab-row">
            <button
              type="button"
              className={authMode === 'login' ? 'tab active' : 'tab'}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'signup' ? 'tab active' : 'tab'}
              onClick={() => setAuthMode('signup')}
            >
              Signup
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              Username or email
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
                placeholder="yourname or name@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Enter password"
              />
            </label>

            {authMode === 'signup' && (
              <label>
                Confirm password
                <input
                  type="password"
                  value={authForm.confirmPassword}
                  onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })}
                  placeholder="Repeat password"
                />
              </label>
            )}

            {authError ? <div className="alert error">{authError}</div> : null}
            {authMessage ? <div className="alert success">{authMessage}</div> : null}

            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Enter dashboard' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
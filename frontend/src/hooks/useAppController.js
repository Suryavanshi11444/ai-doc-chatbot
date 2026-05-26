import useApiClient from './useApiClient'
import useAuthActions from './useAuthActions'
import useSessionController from './useSessionController'
import useWorkspaceController from './useWorkspaceController'

export default function useAppController() {
  const session = useSessionController()
  const { requestJson } = useApiClient({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    onRefreshToken: session.setAccessToken,
    onClearSession: session.clearSession,
  })
  const authActions = useAuthActions(requestJson, session)
  const workspace = useWorkspaceController(requestJson, session)

  return {
    ...session,
    ...workspace,
    ...authActions,
  }
}
import useWorkspaceDataController from './useWorkspaceDataController'
import useWorkspaceActions from './useWorkspaceActions'

export default function useWorkspaceController(requestJson, session) {
  const data = useWorkspaceDataController(requestJson, session)
  const actions = useWorkspaceActions(requestJson, session, data)

  return {
    ...data,
    ...actions,
  }
}
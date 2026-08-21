import API from '@/api/api'

export interface LogoutRequest {
  refresh: string
}

export interface LogoutResponse {
  detail?: string
}

export const logoutService = async (
  refresh: string,
): Promise<LogoutResponse> => {
  const response = await API.post<LogoutResponse>(
    '/auth/logout/',
    {
      refresh,
    },
  )

  return response.data
}

export default logoutService
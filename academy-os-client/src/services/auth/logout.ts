import API from '@/api/api'

export const logoutService = async (
  refresh: string,
): Promise<void> => {
  await API.post(
      'auth/logout/',
    {
      refresh,
    },
  )
}

export default logoutService
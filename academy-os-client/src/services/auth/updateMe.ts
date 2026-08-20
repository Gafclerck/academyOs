
import API from '@/api/api'

export interface UpdateMeRequest {
  first_name: string
  last_name: string
  phone_number: string
}

export interface UpdateMeResponse {
  detail?: string
}

export const updateMe = async (
  data: UpdateMeRequest,
): Promise<UpdateMeResponse> => {
  const response = await API.patch<UpdateMeResponse>(
    '/auth/me/',
    data,
  )

  return response.data
}


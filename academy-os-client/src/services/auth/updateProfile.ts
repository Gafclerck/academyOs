
import API from '@/api/api'

export interface UpdateProfileRequest {
  first_name: string
  last_name: string
  phone_number: string
}

export interface UpdateProfileResponse {
  id: number
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: string
}

export const updateProfile = async (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  const response = await API.patch(
    '/v1/auth/me/',
    data,
  )

  return response.data
}


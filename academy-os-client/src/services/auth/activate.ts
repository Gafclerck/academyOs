import API from '@/api/api'

export interface ActivateAccountRequest {
  email: string
  code: string
  first_name: string
  last_name: string
  phone_number: string
  new_password: string
}

export interface ActivateAccountResponse {
  detail?: string
  message?: string
  [key: string]: unknown
}

export const activateAccount = async (
  request: ActivateAccountRequest,
): Promise<ActivateAccountResponse> => {
  const response = await API.post(
    '/auth/activate/',
    request,
  )

  return response.data
}
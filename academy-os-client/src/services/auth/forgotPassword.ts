import API from '@/api/api'

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  detail?: string
}

export const forgotPassword = async (
  data: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  const response = await API.post<ForgotPasswordResponse>(
    '/auth/forgot-password/',
    data,
  )

  return response.data
}


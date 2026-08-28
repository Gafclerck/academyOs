import api from '@/api/api'
import { parseApiError } from '@/lib/errorUtils'
import {
  normalizePaginatedResponse,
} from '@/lib/pagination'

import type {
  CertificateAdminItem,
  CertificateSendPayload,
  CertificateSendResult,
  StatutCertificat,
} from '@/types/programme'

export interface CertificatListParams {
  status?: StatutCertificat
  program?: string
  cohort?: string
  search?: string
  page?: number
  page_size?: number
}

export interface CertificatListResponse {
  count: number
  next: string | null
  previous: string | null
  results: CertificateAdminItem[]
}

export async function getCertificats(
  params: CertificatListParams = {},
): Promise<CertificatListResponse> {
  try {
    const { data } = await api.get<
      CertificatListResponse | CertificateAdminItem[]
    >('/certificates/', { params })
    return normalizePaginatedResponse<CertificateAdminItem>(data)
  } catch (err) {
    throw new Error(
      parseApiError(err, 'Impossible de charger les certificats.').message,
    )
  }
}

export async function sendCertificats(
  payload: CertificateSendPayload,
): Promise<CertificateSendResult[]> {
  try {
    const { data } = await api.post<{ results: CertificateSendResult[] }>(
      '/certificates/send/',
      payload,
    )
    return data.results
  } catch (err) {
    throw new Error(
      parseApiError(err, "Impossible d'envoyer les certificats.").message,
    )
  }
}

import axios from 'axios'
import api from '@/api/api'
import { parseApiError } from '@/lib/errorUtils'
import {
  normalizePaginatedResponse,
} from '@/lib/pagination'

import type {
  CertificateAdminItem,
  CertificatePublic,
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

/**
 * Récupère les informations publiques de vérification d'un certificat.
 *
 * Utilise un client axios dédié (sans les intercepteurs de `api`) afin que
 * la page publique reste accessible sans authentification et ne soit jamais
 * redirigée vers /login (y compris si un jeton expiré traîne en localStorage).
 */
export async function getCertificatPublic(
  id: string,
): Promise<CertificatePublic> {
  const publicClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
  try {
    const { data } = await publicClient.get<CertificatePublic>(
      `/certificates/${id}/`,
    )
    return data
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status ?? null : null
    const error = new Error(
      parseApiError(err, 'Certificat introuvable ou non émis.').message,
    )
    ;(error as Error & { status?: number | null }).status = status
    throw error
  }
}

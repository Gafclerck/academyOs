import api from '@/api/api'
import { parseApiError } from '@/lib/errorUtils'

import type {
  Certificat,
  CreateCertificatDTO,
} from '@/types/programme'

export async function getCertificatsByCohorte(
  cohorteId: string,
): Promise<Certificat[]> {
  try {
    const { data } = await api.get<Certificat[]>(
      `cohortes/${cohorteId}/certificats/`,
    )
    return Array.isArray(data) ? data : (data as { results?: Certificat[] }).results ?? []
  } catch (err) {
    throw new Error(
      parseApiError(err, 'Impossible de charger les certificats.').message,
    )
  }
}

export async function createCertificat(
  payload: CreateCertificatDTO,
): Promise<Certificat> {
  try {
    const { data } = await api.post<Certificat>(
      '/certificats/',
      payload,
    )
    return data
  } catch (err) {
    throw new Error(
      parseApiError(err, "Impossible de créer le certificat.").message,
    )
  }
}

export async function downloadCertificat(
  certificatId: string,
): Promise<Blob> {
  try {
    const response = await api.get(
      `certificats/${certificatId}/download/`,
      { responseType: 'blob' },
    )
    return response.data
  } catch (err) {
    throw new Error(
      parseApiError(err, 'Impossible de télécharger le certificat.').message,
    )
  }
}

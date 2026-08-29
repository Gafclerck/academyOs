// src/services/claims/claimService.ts

import API from '@/api/api'

/* ============================================================
   TYPES
============================================================ */

export type ClaimStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected'

export interface Claim {
  id: string

  certificate: string
  certificate_id_display: string

  learner: string
  learner_email: string
  learner_name: string

  program_title: string
  cohort_name: string

  message: string

  status: ClaimStatus
  status_display: string
  status_transitions: Array<{ value: ClaimStatus; label: string }>

  admin_response: string

  handled_by: string | null
  handled_by_email: string | null
  handled_at: string | null

  created_at: string
  updated_at: string
}

/* ============================================================
   PAGINATION
============================================================ */

export interface ClaimsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Claim[]
}

/* ============================================================
   FILTRES
============================================================ */

export interface GetClaimsParams {
  page?: number
  page_size?: number
  status?: ClaimStatus | ClaimStatus[]
}

/* ============================================================
   CRÉATION
============================================================ */

export interface CreateClaimDTO {
  certificate: string
  message: string
}

/* ============================================================
   MISE À JOUR
============================================================ */

export interface UpdateClaimDTO {
  status: ClaimStatus
  admin_response?: string
}

export interface PatchClaimDTO {
  status?: ClaimStatus
  admin_response?: string
}

/* ============================================================
   GET — LISTE DES RÉCLAMATIONS
   GET /api/v1/claims/
============================================================ */

export const getClaims = async (
  params?: GetClaimsParams,
): Promise<ClaimsResponse> => {
  const response = await API.get<ClaimsResponse>('/claims/', {
    params,
  })

  return response.data
}

/* ============================================================
   GET — DÉTAIL
   GET /api/v1/claims/{id}/
============================================================ */

export const getClaimById = async (
  id: string,
): Promise<Claim> => {
  const response = await API.get<Claim>(
    `/claims/${id}/`,
  )

  return response.data
}

/* ============================================================
   POST — CRÉER UNE RÉCLAMATION
   POST /api/v1/claims/
============================================================ */

export const createClaim = async (
  data: CreateClaimDTO,
): Promise<Claim> => {
  const response = await API.post<Claim>(
    '/claims/',
    data,
  )

  return response.data
}

/* ============================================================
   PUT — MODIFIER COMPLÈTEMENT
   PUT /api/v1/claims/{id}/
============================================================ */

export const updateClaim = async (
  id: string,
  data: UpdateClaimDTO,
): Promise<Claim> => {
  const response = await API.put<Claim>(
    `/claims/${id}/`,
    data,
  )

  return response.data
}

/* ============================================================
   PATCH — MODIFIER PARTIELLEMENT
   PATCH /api/v1/claims/{id}/
============================================================ */

export const patchClaim = async (
  id: string,
  data: PatchClaimDTO,
): Promise<Claim> => {
  const response = await API.patch<Claim>(
    `/claims/${id}/`,
    data,
  )

  return response.data
}

/* ============================================================
   STATS — COMPTEURS PAR STATUT
   GET /api/v1/claims/stats/
============================================================ */

export interface ClaimStats {
  pending: number
  in_progress: number
  resolved: number
  rejected: number
  total: number
  active: number
}

export const getClaimsStats = async (): Promise<ClaimStats> => {
  const response = await API.get<ClaimStats>('/claims/stats/')
  return response.data
}

/* ============================================================
   DELETE
   DELETE /api/v1/claims/{id}/
============================================================ */

export const deleteClaim = async (
  id: string,
): Promise<void> => {
  await API.delete(`/claims/${id}/`)
}

/* ============================================================
   EXPORT PAR DÉFAUT
============================================================ */

const claimService = {
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  patchClaim,
  deleteClaim,
  getClaimsStats,
}

export default claimService
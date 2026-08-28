
import api from '@/api/api'
import { extractList } from '@/lib/pagination'

import type {
  ProjectAssignment,
  EvaluationCriterion,
  Deliverable,
  CreateAssignmentDTO,
  SubmitDeliverableDTO,
  ReviewDeliverableDTO,
} from '@/types/evaluation'

// =====================================================
// ASSIGNATIONS
// =====================================================

export const getAssignments = async (params?: {
  cohort?: string
  project?: string
  user?: string
  status?: string
}): Promise<ProjectAssignment[]> => {
  const response = await api.get('/assignments/', {
    params,
  })

  return extractList<ProjectAssignment>(response.data)
}

export const getAssignment = async (
  id: string,
): Promise<ProjectAssignment> => {
  const response = await api.get(`/assignments/${id}/`)

  return response.data
}

export const createAssignment = async (
  data: CreateAssignmentDTO,
): Promise<ProjectAssignment> => {
  const response = await api.post('/assignments/', data)

  return response.data
}

export const updateAssignment = async (
  id: string,
  data: Partial<CreateAssignmentDTO>,
): Promise<ProjectAssignment> => {
  const response = await api.patch(
    `/assignments/${id}/`,
    data,
  )

  return response.data
}

export const deleteAssignment = async (
  id: string,
): Promise<void> => {
  await api.delete(`/assignments/${id}/`)
}

// =====================================================
// LIVRABLES
// =====================================================

export const getDeliverables = async (params?: {
  status?: string
  cohort?: string
  project?: string
  assignment?: string
  user?: string
}): Promise<Deliverable[]> => {
  const response = await api.get('/deliverables/', {
    params,
  })

  return extractList<Deliverable>(response.data)
}

export const getAssignmentDeliverables = async (
  assignmentId: string,
): Promise<Deliverable[]> => {
  const response = await api.get(
    `/assignments/${assignmentId}/deliverables/`,
  )

  return extractList<Deliverable>(response.data)
}

export const submitDeliverable = async (
  assignmentId: string,
  data: SubmitDeliverableDTO,
): Promise<Deliverable> => {
  const formData = new FormData()

  if (data.repo_url) {
    formData.append('repo_url', data.repo_url)
  }

  if (data.live_url) {
    formData.append('live_url', data.live_url)
  }

  if (data.comments) {
    formData.append('comments', data.comments)
  }

  data.files?.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.post(
    `/assignments/${assignmentId}/deliverables/submit/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

export const getDeliverable = async (
  id: string,
): Promise<Deliverable> => {
  const response = await api.get(
    `/deliverables/${id}/`,
  )

  return response.data
}

// =====================================================
// CORRECTION
// =====================================================

export const reviewDeliverable = async (
  deliverableId: string,
  data: ReviewDeliverableDTO,
): Promise<Deliverable> => {
  const response = await api.post(
    `/deliverables/${deliverableId}/review/`,
    data,
  )

  return response.data
}

// =====================================================
// CRITÈRES
// =====================================================

export const getCriteria = async (params?: {
  project?: string
  competency_name?: string
}): Promise<EvaluationCriterion[]> => {
  const response = await api.get('/criteria/', {
    params,
  })

  return extractList<EvaluationCriterion>(response.data)
}

export const getCriterion = async (
  id: string,
): Promise<EvaluationCriterion> => {
  const response = await api.get(`/criteria/${id}/`)

  return response.data
}

export const createCriterion = async (
  data: Omit<EvaluationCriterion, 'id'>,
): Promise<EvaluationCriterion> => {
  const response = await api.post('/criteria/', data)

  return response.data
}

export const updateCriterion = async (
  id: string,
  data: Partial<Omit<EvaluationCriterion, 'id'>>,
): Promise<EvaluationCriterion> => {
  const response = await api.patch(
    `/criteria/${id}/`,
    data,
  )

  return response.data
}

export const deleteCriterion = async (
  id: string,
): Promise<void> => {
  await api.delete(`/criteria/${id}/`)
}

import API from '@/api/api'

import { normalizePaginatedResponse } from '@/lib/pagination'

import type {
  Projet,
  ProjetStatus,
  CreateProjetDTO,
  PatchProjetDTO,
  ProjetAttachment,
  PaginatedResponse,
} from '@/types/projet'

export interface AttachmentResponse {
  id: string
  url: string
  original_filename: string
  uploaded_by: string
  uploaded_at: string
}

type ApiProjetResponse =
  | PaginatedResponse<Projet>
  | Projet[]

/* ============================================================
   SERVICE PROJET
============================================================ */

const projetService = {

  /* ==========================================================
     GET /projects/
  ========================================================== */

  async getProjets(
    params?: {
      page?: number
      page_size?: number
      program?: string
      status?: ProjetStatus
      search?: string
    },
  ): Promise<PaginatedResponse<Projet>> {
    const response =
      await API.get<ApiProjetResponse>(
        '/projects/',
        {
          params,
        },
      )

    return normalizePaginatedResponse<Projet>(
      response.data,
    )
  },

  /* ==========================================================
     GET TOUS LES PROJETS
  ========================================================== */

  async getAllProjets(): Promise<Projet[]> {
    const allProjects: Projet[] = []

    let nextUrl: string | null =
      '/projects/'

    while (nextUrl) {
      const response: { data: ApiProjetResponse } =
        await API.get<ApiProjetResponse>(
          nextUrl,
        )

      const normalized =
        normalizePaginatedResponse<Projet>(
          response.data,
        )

      allProjects.push(
        ...normalized.results,
      )

      nextUrl = normalized.next
    }

    return allProjects
  },

  /* ==========================================================
     GET /projects/{id}/
  ========================================================== */

  async getProjetById(
    id: string,
  ): Promise<Projet> {
    const response =
      await API.get<Projet>(
        `/projects/${id}/`,
      )

    return response.data
  },

  /* ==========================================================
     POST /projects/
  ========================================================== */

  async createProjet(
    payload: CreateProjetDTO,
  ): Promise<Projet> {
    const response =
      await API.post<Projet>(
        '/projects/',
        payload,
      )

    return response.data
  },

  /* ==========================================================
     PUT /projects/{id}/
  ========================================================== */

  async updateProjet(
    id: string,
    payload: CreateProjetDTO,
  ): Promise<Projet> {
    const response =
      await API.put<Projet>(
        `/projects/${id}/`,
        payload,
      )

    return response.data
  },

  /* ==========================================================
     PATCH /projects/{id}/
  ========================================================== */

  async patchProjet(
    id: string,
    payload: PatchProjetDTO,
  ): Promise<Projet> {
    const response =
      await API.patch<Projet>(
        `/projects/${id}/`,
        payload,
      )

    return response.data
  },

  /* ==========================================================
     DELETE /projects/{id}/
  ========================================================== */

  async deleteProjet(
    id: string,
  ): Promise<void> {
    await API.delete(
      `/projects/${id}/`,
    )
  },

  /* ==========================================================
     POST /attachments/
  ========================================================== */

  async uploadAttachment(
    file: File,
  ): Promise<AttachmentResponse> {
    const formData = new FormData()

    formData.append(
      'file',
      file,
    )

    const response =
      await API.post<AttachmentResponse>(
        '/attachments/',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        },
      )

    return response.data
  },

  /* ==========================================================
     GET /projects/{project_id}/attachments/
  ========================================================== */

  async getProjectAttachments(
    projectId: string,
  ): Promise<ProjetAttachment[]> {
    const response =
      await API.get<ProjetAttachment[]>(
        `/projects/${projectId}/attachments/`,
      )

    return response.data
  },

  /* ==========================================================
     POST /projects/{project_id}/attachments/
  ========================================================== */

  async addAttachment(
    projectId: string,
    file: File,
  ): Promise<Projet> {
    const formData = new FormData()

    formData.append(
      'file',
      file,
    )

    const response =
      await API.post<Projet>(
        `/projects/${projectId}/attachments/`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        },
      )

    return response.data
  },

  /* ==========================================================
     DELETE /projects/{project_id}/attachments/{attachment_id}/
  ========================================================== */

  async removeAttachment(
    projectId: string,
    attachmentId: string,
  ): Promise<void> {
    await API.delete(
      `/projects/${projectId}/attachments/${attachmentId}/`,
    )
  },
}

export default projetService

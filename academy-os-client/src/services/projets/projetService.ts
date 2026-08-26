import API from '@/api/api'
import axios from 'axios'

/* ============================================================
   STATUT
============================================================ */

export type ProjetStatus =
  | 'draft'
  | 'published'
  | 'archived'

/* ============================================================
   PIÈCE JOINTE
============================================================ */

export interface ProjetAttachment {
  id: string
  url: string
  original_filename: string
  uploaded_by: string
  uploaded_at: string
}

export interface AttachmentResponse {
  id: string
  url: string
  original_filename: string
  uploaded_by: string
  uploaded_at: string
}

/* ============================================================
   PROJET
============================================================ */

export interface Projet {
  id: string
  program: string
  program_title: string
  title: string
  description: string
  status: ProjetStatus
  order: number
  attachments: ProjetAttachment[]
  created_at: string
  updated_at: string
}

/* ============================================================
   DTO CRÉATION
============================================================ */

export interface CreateProjetDTO {
  program: string
  title: string
  description?: string
  status: ProjetStatus
  order: number
}

/* ============================================================
   DTO MODIFICATION
============================================================ */

export interface UpdateProjetDTO {
  program?: string
  title?: string
  description?: string
  status?: ProjetStatus
  order?: number
}

/* ============================================================
   PAGINATION
============================================================ */

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type ApiProjetResponse =
  | PaginatedResponse<Projet>
  | Projet[]

/* ============================================================
   NORMALISATION PAGINATION
============================================================ */

const normalizePaginatedResponse = (
  data: ApiProjetResponse,
): PaginatedResponse<Projet> => {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    }
  }

  return {
    count:
      typeof data.count === 'number'
        ? data.count
        : data.results?.length ?? 0,

    next:
      typeof data.next === 'string'
        ? data.next
        : null,

    previous:
      typeof data.previous === 'string'
        ? data.previous
        : null,

    results:
      Array.isArray(data.results)
        ? data.results
        : [],
  }
}

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

    return normalizePaginatedResponse(
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
      const response =
        await API.get<ApiProjetResponse>(
          nextUrl,
        )

      const normalized =
        normalizePaginatedResponse(
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

     CRÉATION DU PROJET

     Aucun fichier ici.
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
    payload: UpdateProjetDTO,
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

     UPLOAD GLOBAL D'UN ATTACHMENT

     Cet endpoint crée uniquement l'attachment.
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

     LISTE DES ATTACHMENTS DU PROJET
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

     AJOUTER UN FICHIER AU PROJET

     IMPORTANT :
     Le backend attend :
     
       file: <fichier>

     et NON :

       attachment: <id>
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

     RETIRER UNE PIÈCE JOINTE DU PROJET
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

/* ============================================================
   GESTION DES ERREURS API
============================================================ */

export const getProjetApiError = (
  error: unknown,
): string => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return error.message
    }

    return 'Une erreur est survenue.'
  }

  if (!error.response) {
    return (
      error.message ||
      'Impossible de contacter le serveur.'
    )
  }

  const data =
    error.response.data

  if (typeof data === 'string') {
    return data
  }

  if (
    data &&
    typeof data === 'object'
  ) {
    const responseData =
      data as Record<string, unknown>

    if (
      typeof responseData.detail === 'string'
    ) {
      return responseData.detail
    }

    if (
      typeof responseData.message === 'string'
    ) {
      return responseData.message
    }

    const messages: string[] = []

    Object.entries(
      responseData,
    ).forEach(
      ([field, value]) => {
        if (Array.isArray(value)) {
          messages.push(
            `${field}: ${value
              .map(item =>
                typeof item === 'string'
                  ? item
                  : JSON.stringify(item),
              )
              .join(', ')}`,
          )

          return
        }

        if (
          typeof value === 'string'
        ) {
          messages.push(
            `${field}: ${value}`,
          )

          return
        }

        if (
          value !== null &&
          typeof value === 'object'
        ) {
          messages.push(
            `${field}: ${JSON.stringify(value)}`,
          )
        }
      },
    )

    if (messages.length > 0) {
      return messages.join(' | ')
    }
  }

  return (
    error.message ||
    'Une erreur est survenue.'
  )
}

export default projetService
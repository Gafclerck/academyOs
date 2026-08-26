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
   CRÉATION
============================================================ */

export interface CreateProjetDTO {
  program: string
  title: string
  description?: string
  status: ProjetStatus
  order: number
}

/* ============================================================
   MODIFICATION COMPLÈTE
============================================================ */

export interface UpdateProjetDTO {
  program: string
  title: string
  description?: string
  status: ProjetStatus
  order: number
}

/* ============================================================
   MODIFICATION PARTIELLE
============================================================ */

export interface PatchProjetDTO {
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

/* ============================================================
   ATTACHMENT
============================================================ */

export interface AddAttachmentDTO {
  attachment: string
}
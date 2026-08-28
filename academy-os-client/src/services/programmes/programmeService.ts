import axios from 'axios'

import type {
  Programme,
  CreateProgrammeDTO,
  RentreeProgramme,
  CreateRentreeDTO,
  CohorteRentree,
  CreateCohorteDTO,
  ProjetCohorte,
  Membre,
  ProgrammeKPIs,
  ProgrammeDetailKPIs,
  RentreeDetailKPIs,
  CohorteDetailKPIs,
  StatutRentree,
  StatutCohorte,
} from '../../types/programme'

import { tokenStore } from '@/lib/tokenStore'
import api from '@/api/api'


/* ============================================================
   AUTH
============================================================ */

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('API ERROR', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        payload: error.config?.data,
        response: error.response?.data,
      })
    }

    return Promise.reject(error)
  },
)

/* ============================================================
   HELPERS
============================================================ */

const extractList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray(
      (data as { results: unknown }).results,
    )
  ) {
    return (data as { results: T[] }).results
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray(
      (data as { data: unknown }).data,
    )
  ) {
    return (data as { data: T[] }).data
  }

  return []
}

/* ============================================================
   PROGRAMMES
============================================================ */

/**
 * API -> Frontend
 */
const mapProgrammeFromApi = (
  raw: any,
): Programme => ({
  id: String(raw.id),

  nom:
    raw.name ??
    raw.title ??
    raw.nom ??
    '',

  description:
    raw.description ??
    '',

  statut:
    raw.status === 'active' ||
    raw.status === 'actif' ||
    raw.statut === 'actif'
      ? 'actif'
      : 'inactif',

  nb_rentrees:
    raw.nb_rentrees ??
    raw.intakes_count ??
    0,

  created_at:
    raw.created_at,

  updated_at:
    raw.updated_at,
})

/**
 * Frontend -> API
 */
const mapProgrammeToApi = (
  dto: CreateProgrammeDTO,
) => ({
  title: dto.nom.trim(),

  description:
    dto.description?.trim() ?? '',

  status:
    dto.statut === 'actif'
      ? 'active'
      : 'inactive',
})

/* ============================================================
   RENTREES
============================================================ */

const mapStatutRentreeFromApi = (
  status: unknown,
): StatutRentree => {
  const value = String(
    status ?? '',
  ).toLowerCase()

  if (
    [
      'upcoming',
      'a_venir',
      'planned',
      'draft',
    ].includes(value)
  ) {
    return 'a_venir'
  }

  if (
    [
      'ongoing',
      'in_progress',
      'en_cours',
      'active',
    ].includes(value)
  ) {
    return 'en_cours'
  }

  if (
    [
      'completed',
      'terminee',
      'closed',
      'done',
    ].includes(value)
  ) {
    return 'terminee'
  }

  return 'a_venir'
}

/**
 * Récupérer l'ID du programme depuis l'API
 */
const getProgramIdFromApi = (
  raw: any,
): string => {
  if (
    raw.program !== undefined &&
    raw.program !== null
  ) {
    if (
      typeof raw.program === 'object'
    ) {
      return String(
        raw.program.id ?? '',
      )
    }

    return String(raw.program)
  }

  if (
    raw.program_id !== undefined &&
    raw.program_id !== null
  ) {
    return String(raw.program_id)
  }

  if (
    raw.programme_id !== undefined &&
    raw.programme_id !== null
  ) {
    return String(raw.programme_id)
  }

  return ''
}

/**
 * API -> Frontend
 */
const mapRentreeFromApi = (
  raw: any,
): RentreeProgramme => {
  const programmeId =
    getProgramIdFromApi(raw)

  let programmeNom = ''

  if (
    raw.program &&
    typeof raw.program === 'object'
  ) {
    programmeNom =
      raw.program.name ??
      raw.program.title ??
      ''
  }

  if (!programmeNom) {
    programmeNom =
      raw.program_name ??
      raw.program_title ??
      raw.programme_nom ??
      ''
  }

  return {
    id: String(raw.id),

    programme_id:
      programmeId,

    programme_nom:
      programmeNom,

    nom:
      raw.name ??
      raw.title ??
      raw.nom ??
      '',

    description:
      raw.description ??
      '',

    date_debut:
      raw.start_date ??
      raw.date_debut ??
      '',

    date_fin:
      raw.end_date ??
      raw.date_fin ??
      '',

    statut:
      mapStatutRentreeFromApi(
        raw.status ??
        raw.statut,
      ),

    nb_cohortes:
      raw.nb_cohortes ??
      raw.cohorts_count ??
      raw.cohortes_count ??
      0,

    nb_membres:
      raw.nb_membres ??
      raw.members_count ??
      0,

    nb_projets:
      raw.nb_projets ??
      raw.projects_count ??
      0,

    created_at:
      raw.created_at,

    updated_at:
      raw.updated_at,
  }
}

/**
 * Frontend -> API
 */
const mapRentreeToApi = (
  dto: CreateRentreeDTO,
) => {
  const programId =
    String(
      dto.programme_id ?? '',
    ).trim()

  if (!programId) {
    throw new Error(
      'Impossible de créer la rentrée : le programme est obligatoire.',
    )
  }

  return {
    program: programId,

    name:
      dto.nom.trim(),

    description:
      dto.description?.trim() ?? '',

    start_date:
      dto.date_debut,

    end_date:
      dto.date_fin,
  }
}

/* ============================================================
   COHORTES
============================================================ */

const mapStatutCohorteFromApi = (
  status: unknown,
): StatutCohorte => {
  const value = String(
    status ?? '',
  ).toLowerCase()

  if (
    [
      'completed',
      'terminee',
      'closed',
    ].includes(value)
  ) {
    return 'terminee'
  }

  if (
    [
      'upcoming',
      'a_venir',
      'planned',
      'draft',
    ].includes(value)
  ) {
    return 'upcoming'
  }

  if (
    [
      'ongoing',
      'in_progress',
      'en_cours',
      'active',
    ].includes(value)
  ) {
    return 'ongoing'
  }

  return 'inactive'
}

const mapCohorteFromApi = (
  raw: any,
): CohorteRentree => {
  /* ============================================================
     PROGRAMME
  ============================================================ */

  const programmeId =
    raw.programme_id ??
    raw.program_id ??
    (
      typeof raw.program === 'object'
        ? raw.program?.id
        : raw.program
    )

  const programmeNom =
    raw.program_name ??
    raw.programme_nom ??
    (
      typeof raw.program === 'object'
        ? (
            raw.program?.title ??
            raw.program?.name
          )
        : undefined
    )

  /* ============================================================
     RENTRÉE
  ============================================================ */

  const rentreeId =
    raw.rentree_id ??
    raw.intake_id ??
    (
      typeof raw.intake === 'object'
        ? raw.intake?.id
        : raw.intake
    )

  const rentreeNom =
    raw.intake_name ??
    raw.rentree_nom ??
    (
      typeof raw.intake === 'object'
        ? (
            raw.intake?.name ??
            raw.intake?.title
          )
        : undefined
    )

  return {
    id: String(raw.id),

    rentree_id:
      rentreeId
        ? String(rentreeId)
        : '',

    rentree_nom:
      rentreeNom ?? '',

    programme_id:
      programmeId
        ? String(programmeId)
        : undefined,

    programme_nom:
      programmeNom ?? '',

    nom:
      raw.name ??
      raw.title ??
      raw.nom ??
      '',

    description:
      raw.description ??
      '',

    date_debut:
      raw.start_date ??
      raw.date_debut ??
      '',

    date_fin:
      raw.end_date ??
      raw.date_fin ??
      '',

    statut:
      mapStatutCohorteFromApi(
        raw.status ??
        raw.statut,
      ),

    nb_membres:
      raw.nb_membres ??
      raw.members_count ??
      raw.enrollments_count ??
      0,

    nb_projets:
      raw.nb_projets ??
      raw.projects_count ??
      0,

    created_at:
      raw.created_at,

    updated_at:
      raw.updated_at,
  }
}

/* ============================================================
   SERVICE
============================================================ */

export const programmeService = {

  /* ==========================================================
     PROGRAMMES
  ========================================================== */

  async getProgrammes(): Promise<Programme[]> {
    const response =
      await api.get('/programs/')

    return extractList<any>(
      response.data,
    ).map(
      mapProgrammeFromApi,
    )
  },

  async getProgrammeById(
    id: string,
  ): Promise<Programme | null> {
    try {
      const response =
        await api.get(
          `/programs/${id}/`,
        )

      return mapProgrammeFromApi(
        response.data,
      )
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null
      }

      throw error
    }
  },

  /* ==========================================================
     CRÉER UN PROGRAMME
  ========================================================== */

  async createProgramme(
    dto: CreateProgrammeDTO,
  ): Promise<Programme> {
    const payload =
      mapProgrammeToApi(dto)

    console.log(
      '[programmeService] POST /programs/',
      payload,
    )

    const response =
      await api.post(
        '/programs/',
        payload,
      )

    return mapProgrammeFromApi(
      response.data,
    )
  },

  /* ==========================================================
     MODIFIER UN PROGRAMME
  ========================================================== */

  async updateProgramme(
    id: string,
    dto: CreateProgrammeDTO,
  ): Promise<Programme> {
    if (!id) {
      throw new Error(
        'L’identifiant du programme est obligatoire.',
      )
    }

    const payload =
      mapProgrammeToApi(dto)

    console.log(
      '[programmeService] PUT /programs/' +
        id +
        '/',
      payload,
    )

    const response =
      await api.put(
        `/programs/${id}/`,
        payload,
      )

    return mapProgrammeFromApi(
      response.data,
    )
  },

  /* ==========================================================
     MODIFICATION PARTIELLE
  ========================================================== */

  async patchProgramme(
    id: string,
    data: Partial<CreateProgrammeDTO>,
  ): Promise<Programme> {
    if (!id) {
      throw new Error(
        'L’identifiant du programme est obligatoire.',
      )
    }

    const payload: Record<
      string,
      unknown
    > = {}

    if (data.nom !== undefined) {
      payload.title =
        data.nom.trim()
    }

    if (
      data.description !==
      undefined
    ) {
      payload.description =
        data.description.trim()
    }

    if (data.statut !== undefined) {
      payload.status =
        data.statut === 'actif'
          ? 'active'
          : 'inactive'
    }

    console.log(
      '[programmeService] PATCH /programs/' +
        id +
        '/',
      payload,
    )

    const response =
      await api.patch(
        `/programs/${id}/`,
        payload,
      )

    return mapProgrammeFromApi(
      response.data,
    )
  },

  /* ==========================================================
     SUPPRIMER UN PROGRAMME
  ========================================================== */

  async deleteProgramme(
    id: string,
  ): Promise<void> {
    if (!id) {
      throw new Error(
        'L’identifiant du programme est obligatoire.',
      )
    }

    await api.delete(
      `/programs/${id}/`,
    )
  },

  /* ==========================================================
     KPI PROGRAMMES
  ========================================================== */

  async getProgrammeKPIs(): Promise<ProgrammeKPIs> {
    const programmes =
      await this.getProgrammes()

    const rentrees =
      await this.getAllRentrees()

    return {
      total_programmes:
        programmes.length,

      programmes_actifs:
        programmes.filter(
          (p) =>
            p.statut === 'actif',
        ).length,

      total_rentrees:
        rentrees.length,

      total_etudiants:
        0,
    }
  },

  async getProgrammeDetailKPIs(
    programmeId: string,
  ): Promise<ProgrammeDetailKPIs> {
    const rentrees =
      await this.getRentreesByProgramme(
        programmeId,
      )

    const rentreeIds =
      rentrees.map(
        (r) => r.id,
      )

    const cohortes =
      await this.getAllCohortes()

    const programmeCohortes =
      cohortes.filter(
        (c) =>
          rentreeIds.includes(
            c.rentree_id,
          ),
      )

    return {
      nb_rentrees:
        rentrees.length,

      nb_cohortes_totales:
        programmeCohortes.length,

      nb_etudiants:
        programmeCohortes.reduce(
          (total, c) =>
            total +
            (c.nb_membres ?? 0),
          0,
        ),
    }
  },

  /* ==========================================================
     RENTRÉES
  ========================================================== */

  async getAllRentrees(): Promise<
    RentreeProgramme[]
  > {
    const response =
      await api.get(
        '/intakes/',
      )

    return extractList<any>(
      response.data,
    ).map(
      mapRentreeFromApi,
    )
  },

  async getRentreesByProgramme(
    programmeId: string,
  ): Promise<RentreeProgramme[]> {
    if (!programmeId) {
      return []
    }

    const response =
      await api.get(
        '/intakes/',
        {
          params: {
            program:
              programmeId,
          },
        },
      )

    return extractList<any>(
      response.data,
    ).map(
      mapRentreeFromApi,
    )
  },

  async getRentreeById(
    id: string,
  ): Promise<RentreeProgramme | null> {
    try {
      const response =
        await api.get(
          `/intakes/${id}/`,
        )

      return mapRentreeFromApi(
        response.data,
      )
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null
      }

      throw error
    }
  },

  async createRentree(
    dto: CreateRentreeDTO,
  ): Promise<RentreeProgramme> {
    const payload =
      mapRentreeToApi(dto)

    const response =
      await api.post(
        '/intakes/',
        payload,
      )

    return mapRentreeFromApi(
      response.data,
    )
  },

  /* ==========================================================
     KPI RENTRÉE
  ========================================================== */

  async getRentreeDetailKPIs(
    rentreeId: string,
  ): Promise<RentreeDetailKPIs> {
    const cohortes =
      await this.getCohortesByRentree(
        rentreeId,
      )

    return {
      nb_cohortes:
        cohortes.length,

      nb_membres:
        cohortes.reduce(
          (total, c) =>
            total +
            (c.nb_membres ?? 0),
          0,
        ),

      nb_projets:
        cohortes.reduce(
          (total, c) =>
            total +
            (c.nb_projets ?? 0),
          0,
        ),
    }
  },

  /* ==========================================================
     COHORTES
  ========================================================== */

  async getAllCohortes(): Promise<
    CohorteRentree[]
  > {
    const response =
      await api.get(
        '/cohortes/',
      )

    return extractList<any>(
      response.data,
    ).map(
      mapCohorteFromApi,
    )
  },

  async getCohortesByRentree(
    rentreeId: string,
  ): Promise<CohorteRentree[]> {
    const response =
      await api.get(
        '/cohortes/',
        {
          params: {
            rentree_id:
              rentreeId,
          },
        },
      )

    return extractList<any>(
      response.data,
    ).map(
      mapCohorteFromApi,
    )
  },

async getCohorteById(
  id: string,
): Promise<CohorteRentree | null> {
  if (!id) {
    throw new Error(
      'L’identifiant de la cohorte est obligatoire.',
    )
  }

  try {
    const response =
      await api.get(
        `/cohorts/${id}/`,
      )

    console.log(
      '🔎 COHORTE DETAIL API:',
      response.data,
    )

    return mapCohorteFromApi(
      response.data,
    )
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return null
    }

    throw error
  }
},

  async createCohorte(
    dto: CreateCohorteDTO,
  ): Promise<CohorteRentree> {
    const response =
      await api.post(
        '/cohortes/',
        dto,
      )

    return mapCohorteFromApi(
      response.data,
    )
  },

  async getCohorteDetailKPIs(
    cohorteId: string,
  ): Promise<CohorteDetailKPIs> {
    const cohorte =
      await this.getCohorteById(
        cohorteId,
      )

    if (!cohorte) {
      throw new Error(
        'Cohorte introuvable.',
      )
    }

    return {
      rentree_nom:
        cohorte.rentree_nom ?? '',

      programme_nom:
        cohorte.programme_nom ?? '',

      nb_membres:
        cohorte.nb_membres ?? 0,

      nb_projets:
        cohorte.nb_projets ?? 0,
    }
  },

  /* ==========================================================
     PROJETS
  ========================================================== */

  async getProjetsByCohorte(
    cohorteId: string,
  ): Promise<ProjetCohorte[]> {
    const response =
      await api.get(
        '/projets/',
        {
          params: {
            cohorte_id:
              cohorteId,
          },
        },
      )

    return extractList<ProjetCohorte>(
      response.data,
    )
  },

  /* ==========================================================
     MEMBRES
  ========================================================== */

  async getMembresByCohorte(
    cohorteId: string,
  ): Promise<Membre[]> {
    const response =
      await api.get(
        '/membres/',
        {
          params: {
            cohorte_id:
              cohorteId,
          },
        },
      )

    return extractList<Membre>(
      response.data,
    )
  },

  
}

export default programmeService
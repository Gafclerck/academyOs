import axios from 'axios'

import type {
  Programme,
  CreateProgrammeDTO,
  ProgrammeKPIs,
} from '../../types/programme'

import api from '@/api/api'
import { extractList } from '@/lib/pagination'
import { getRentrees } from '@/services/rentrees/rentreeService'

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
     KPI PROGRAMMES
  ========================================================== */

  async getProgrammeKPIs(): Promise<ProgrammeKPIs> {
    const programmes =
      await this.getProgrammes()

    const rentrees =
      await getRentrees()

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
}

export default programmeService

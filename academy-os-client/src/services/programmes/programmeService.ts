import axios from 'axios';

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
} from '../../types/programme';

import { tokenStore } from '@/lib/tokenStore';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    'http://localhost:8000/api/v1',

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  timeout: 10000,
});

/* ============================================================
   AUTH
============================================================ */

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

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
      });
    }

    return Promise.reject(error);
  },
);

/* ============================================================
   HELPERS
============================================================ */

const extractList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray(
      (data as { results: unknown }).results,
    )
  ) {
    return (data as { results: T[] }).results;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray(
      (data as { data: unknown }).data,
    )
  ) {
    return (data as { data: T[] }).data;
  }

  return [];
};

/* ============================================================
   PROGRAMMES
============================================================ */

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
});

const mapProgrammeToApi = (
  dto: CreateProgrammeDTO,
) => ({
  title: dto.nom,

  description:
    dto.description,

  status:
    dto.statut === 'actif'
      ? 'active'
      : 'inactive',


});

/* ============================================================
   RENTREES
============================================================ */

const mapStatutRentreeFromApi = (
  status: unknown,
): StatutRentree => {
  const value = String(
    status ?? '',
  ).toLowerCase();

  if (
    [
      'upcoming',
      'a_venir',
      'planned',
      'draft',
    ].includes(value)
  ) {
    return 'a_venir';
  }

  if (
    [
      'ongoing',
      'in_progress',
      'en_cours',
      'active',
    ].includes(value)
  ) {
    return 'en_cours';
  }

  if (
    [
      'completed',
      'terminee',
      'closed',
      'done',
    ].includes(value)
  ) {
    return 'terminee';
  }

  return 'a_venir';
};

/**
 * Récupère l'ID du programme depuis l'API.
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
      );
    }

    return String(
      raw.program,
    );
  }

  if (
    raw.program_id !== undefined &&
    raw.program_id !== null
  ) {
    return String(
      raw.program_id,
    );
  }

  if (
    raw.programme_id !== undefined &&
    raw.programme_id !== null
  ) {
    return String(
      raw.programme_id,
    );
  }

  return '';
};

/**
 * Mapping API -> Frontend
 */
const mapRentreeFromApi = (
  raw: any,
): RentreeProgramme => {
  const programmeId =
    getProgramIdFromApi(raw);

  let programmeNom = '';

  if (
    raw.program &&
    typeof raw.program === 'object'
  ) {
    programmeNom =
      raw.program.name ??
      raw.program.title ??
      '';
  }

  if (!programmeNom) {
    programmeNom =
      raw.program_name ??
      raw.program_title ??
      raw.programme_nom ??
      '';
  }

  return {
    id: String(raw.id),

    // IMPORTANT
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
  };
};

/**
 * Mapping Frontend -> API
 *
 * Backend attendu :
 *
 * {
 *   program: UUID,
 *   name: string,
 *   description: string,
 *   start_date: string,
 *   end_date: string
 * }
 */
const mapRentreeToApi = (
  dto: CreateRentreeDTO,
) => {
  const programId =
    String(
      dto.programme_id ?? '',
    ).trim();

  if (!programId) {
    throw new Error(
      'Impossible de créer la rentrée : le programme est obligatoire.',
    );
  }

  const payload = {
    program: programId,

    name:
      dto.nom.trim(),

    description:
      dto.description?.trim() ?? '',

    start_date:
      dto.date_debut,

    end_date:
      dto.date_fin,
  };

  console.log(
    '[programmeService] POST /intakes/ payload:',
    payload,
  );

  return payload;
};

/* ============================================================
   COHORTES
============================================================ */

const mapStatutCohorteFromApi = (
  status: unknown,
): StatutCohorte => {
  const value = String(
    status ?? '',
  ).toLowerCase();

  if (
    [
      'completed',
      'terminee',
      'closed',
    ].includes(value)
  ) {
    return 'terminee';
  }

  return 'active';
};

const mapCohorteFromApi = (
  raw: any,
): CohorteRentree => ({
  id: String(raw.id),

  rentree_id: String(
    raw.intake ??
    raw.intake_id ??
    raw.rentree_id ??
    '',
  ),

  rentree_nom:
    raw.intake_name ??
    raw.rentree_nom ??
    (
      typeof raw.intake === 'object'
        ? (
            raw.intake?.name ??
            raw.intake?.title
          )
        : undefined
    ),

  programme_id:
    raw.program ??
    raw.program_id ??
    raw.programme_id
      ? String(
          raw.program ??
          raw.program_id ??
          raw.programme_id,
        )
      : undefined,

  programme_nom:
    raw.program_name ??
    raw.programme_nom ??
    (
      typeof raw.program === 'object'
        ? (
            raw.program?.name ??
            raw.program?.title
          )
        : undefined
    ),

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
});

/* ============================================================
   SERVICE
============================================================ */

export const programmeService = {

  /* ==========================================================
     PROGRAMMES
  ========================================================== */

  async getProgrammes(): Promise<Programme[]> {
    const response =
      await api.get('/programs/');

    return extractList<any>(
      response.data,
    ).map(
      mapProgrammeFromApi,
    );
  },

  async getProgrammeById(
    id: string,
  ): Promise<Programme | null> {
    try {
      const response =
        await api.get(
          `/programs/${id}/`,
        );

      return mapProgrammeFromApi(
        response.data,
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null;
      }

      throw error;
    }
  },

  async createProgramme(
    dto: CreateProgrammeDTO,
  ): Promise<Programme> {
    const response =
      await api.post(
        '/programs/',
        mapProgrammeToApi(dto),
      );

    return mapProgrammeFromApi(
      response.data,
    );
  },

  async updateProgramme(
    id: string,
    dto: CreateProgrammeDTO,
  ): Promise<Programme> {
    const response =
      await api.put(
        `/programs/${id}/`,
        mapProgrammeToApi(dto),
      );

    return mapProgrammeFromApi(
      response.data,
    );
  },

  async patchProgramme(
    id: string,
    data: Partial<CreateProgrammeDTO>,
  ): Promise<Programme> {
    const payload: Record<
      string,
      unknown
    > = {};

    if (data.nom !== undefined) {
      payload.title = data.nom;
    }

    if (
      data.description !==
      undefined
    ) {
      payload.description =
        data.description;
    }

 

    if (data.statut !== undefined) {
      payload.status =
        data.statut === 'actif'
          ? 'active'
          : 'inactive';
    }

    const response =
      await api.patch(
        `/programs/${id}/`,
        payload,
      );

    return mapProgrammeFromApi(
      response.data,
    );
  },

  async deleteProgramme(
    id: string,
  ): Promise<void> {
    await api.delete(
      `/programs/${id}/`,
    );
  },

  /* ==========================================================
     KPI PROGRAMMES
  ========================================================== */

  async getProgrammeKPIs(): Promise<ProgrammeKPIs> {
    const programmes =
      await this.getProgrammes();

    const rentrees =
      await this.getAllRentrees();

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
    };
  },

  async getProgrammeDetailKPIs(
    programmeId: string,
  ): Promise<ProgrammeDetailKPIs> {
    const rentrees =
      await this.getRentreesByProgramme(
        programmeId,
      );

    const rentreeIds =
      rentrees.map(
        (r) => r.id,
      );

    const cohortes =
      await this.getAllCohortes();

    const programmeCohortes =
      cohortes.filter(
        (c) =>
          rentreeIds.includes(
            c.rentree_id,
          ),
      );

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
    };
  },

  /* ==========================================================
     RENTREES
  ========================================================== */

  async getAllRentrees(): Promise<
    RentreeProgramme[]
  > {
    const response =
      await api.get(
        '/intakes/',
      );

    return extractList<any>(
      response.data,
    ).map(
      mapRentreeFromApi,
    );
  },

  async getRentreesByProgramme(
    programmeId: string,
  ): Promise<RentreeProgramme[]> {
    if (!programmeId) {
      return [];
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
      );

    return extractList<any>(
      response.data,
    ).map(
      mapRentreeFromApi,
    );
  },

  async getRentreeById(
    id: string,
  ): Promise<RentreeProgramme | null> {
    try {
      const response =
        await api.get(
          `/intakes/${id}/`,
        );

      return mapRentreeFromApi(
        response.data,
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null;
      }

      throw error;
    }
  },

  async createRentree(
    dto: CreateRentreeDTO,
  ): Promise<RentreeProgramme> {
    const payload =
      mapRentreeToApi(dto);

    const response =
      await api.post(
        '/intakes/',
        payload,
      );

    return mapRentreeFromApi(
      response.data,
    );
  },

  /* ==========================================================
     KPI RENTREE
  ========================================================== */

  async getRentreeDetailKPIs(
    rentreeId: string,
  ): Promise<RentreeDetailKPIs> {
    const cohortes =
      await this.getCohortesByRentree(
        rentreeId,
      );

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
    };
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
      );

    return extractList<any>(
      response.data,
    ).map(
      mapCohorteFromApi,
    );
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
      );

    return extractList<any>(
      response.data,
    ).map(
      mapCohorteFromApi,
    );
  },

  async getCohorteById(
    id: string,
  ): Promise<CohorteRentree | null> {
    try {
      const response =
        await api.get(
          `/cohortes/${id}/`,
        );

      return mapCohorteFromApi(
        response.data,
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null;
      }

      throw error;
    }
  },

  async createCohorte(
    dto: CreateCohorteDTO,
  ): Promise<CohorteRentree> {
    const response =
      await api.post(
        '/cohortes/',
        dto,
      );

    return mapCohorteFromApi(
      response.data,
    );
  },

  async getCohorteDetailKPIs(
    cohorteId: string,
  ): Promise<CohorteDetailKPIs> {
    const cohorte =
      await this.getCohorteById(
        cohorteId,
      );

    if (!cohorte) {
      throw new Error(
        'Cohorte introuvable.',
      );
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
    };
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
      );

    return extractList<ProjetCohorte>(
      response.data,
    );
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
      );

    return extractList<Membre>(
      response.data,
    );
  },
};

export default programmeService;


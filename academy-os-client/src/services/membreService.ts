import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Types
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface BackendEnrollment {
  id: string;
  user: User;
  role: "student" | "mentor" | "team_lead" | "admin";
  mentor: string | null;
  cohorte: string;
}

export interface BackendTrainerAssignment {
  id: string;
  user: User;
  cohorte: string;
}

export interface MemberBatchResult {
  email: string;
  status: "success" | "error";
  message: string;
}

// API Calls
export const getCohorteMembers = async (cohorteId: string) => {
  const [enrollmentsRes, trainersRes] = await Promise.all([
    api.get<BackendEnrollment[]>(`/cohorts/${cohorteId}/enrollments/`),
    api.get<BackendTrainerAssignment[]>(`/cohorts/${cohorteId}/trainer-assignments/`)
  ]);
  return { students: enrollmentsRes.data, trainers: trainersRes.data };
};

export const inviteStudents = async (cohorteId: string, emails: string[]): Promise<MemberBatchResult[]> => {
  const res = await api.post(`/cohorts/${cohorteId}/enrollments/invite/`, { emails });
  return res.data.results;
};

export const inviteTrainers = async (cohorteId: string, emails: string[]): Promise<MemberBatchResult[]> => {
  const res = await api.post(`/cohorts/${cohorteId}/trainer-assignments/invite/`, { emails });
  return res.data.results;
};

export const assignMentor = async (enrollmentId: string, mentorId: string | null) => {
  const res = await api.patch(`/enrollments/${enrollmentId}/`, { mentor: mentorId });
  return res.data;
};

export const removeMember = async (enrollmentId: string) => {
  await api.delete(`/enrollments/${enrollmentId}/`);
};

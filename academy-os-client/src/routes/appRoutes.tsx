import { Routes, Route, Navigate } from "react-router-dom"

import Login from "@/pages/auth/login"
import Register from "@/pages/auth/register"
import ForgotPassword from "@/pages/auth/ForgotPassword"

import { ProgrammeLayout } from "@/modules/programme/components/layout/ProgrammeLayout"
import { ProgrammeListPage } from "@/modules/programme/pages/ProgrammeListPage"
import { ProgrammeCreatePage } from "@/modules/programme/pages/ProgrammeCreatePage"
import { ProgrammeDetailPage } from "@/modules/programme/pages/ProgrammeDetailPage"
import { SessionCreatePage } from "@/modules/programme/pages/SessionCreatePage"
import { SessionListPage } from "@/modules/programme/pages/SessionListPage"
import { SessionDetailPage } from "@/modules/programme/pages/SessionDetailPage"
import { CohorteCreatePage } from "@/modules/programme/pages/CohorteCreatePage"
import { CohorteDetailPage } from "@/modules/programme/pages/CohorteDetailPage"
import { ProjetListPage } from "@/modules/programme/pages/ProjetListPage"

import CohortListPage from "@/pages/CohortListPage"

const AppRoutes = () => {
    return (
        <Routes>

            {/* ── AUTHENTIFICATION ──────────────────────────────── */}

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />


            {/* ── MODULE PROGRAMME ─────────────────────────────── */}

            <Route element={<ProgrammeLayout />}>

                {/* Accueil → Login */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Programmes */}
                <Route
                    path="/programmes"
                    element={<ProgrammeListPage />}
                />

                <Route
                    path="/programmes/new"
                    element={<ProgrammeCreatePage />}
                />

                <Route
                    path="/programmes/:id"
                    element={<ProgrammeDetailPage />}
                />


                {/* Sessions */}
                <Route
                    path="/programmes/:programmeId/sessions/new"
                    element={<SessionCreatePage />}
                />

                <Route
                    path="/sessions"
                    element={<SessionListPage />}
                />

                <Route
                    path="/sessions/:id"
                    element={<SessionDetailPage />}
                />


                {/* Cohortes */}
                <Route
                    path="/sessions/:sessionId/cohortes/new"
                    element={<CohorteCreatePage />}
                />

                <Route
                    path="/cohortes"
                    element={<CohortListPage />}
                />

                <Route
                    path="/cohortes/:id"
                    element={<CohorteDetailPage />}
                />


                {/* Projets */}
                <Route
                    path="/projets"
                    element={<ProjetListPage />}
                />

            </Route>


            {/* ── FALLBACK ─────────────────────────────────────── */}

            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />

        </Routes>
    )
}

export default AppRoutes
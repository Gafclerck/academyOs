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
            {/* ── MODULE PROGRAMME & HIERARCHIE COMPLETE ─────────── */}
            <Route element={<ProgrammeLayout />}>
                {/* 1. Programmes */}
                <Route path="/" element={<Navigate to="/programmes" replace />} />
                <Route path="/programmes" element={<ProgrammeListPage />} />
                <Route path="/programmes/new" element={<ProgrammeCreatePage />} />
                <Route path="/programmes/:id" element={<ProgrammeDetailPage />} />

                {/* 2. Sessions */}
                <Route path="/programmes/:programmeId/sessions/new" element={<SessionCreatePage />} />
                <Route path="/sessions" element={<SessionListPage />} />
                <Route path="/sessions/:id" element={<SessionDetailPage />} />

                {/* 3. Cohortes */}
                <Route path="/sessions/:sessionId/cohortes/new" element={<CohorteCreatePage />} />
                <Route path="/cohortes" element={<CohortListPage />} />
                <Route path="/cohortes/:id" element={<CohorteDetailPage />} />

                {/* 4. Projets */}
                <Route path="/projets" element={<ProjetListPage />} />
            </Route>

            {/* ── AUTHENTIFICATION ──────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── FALLBACK ───────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/programmes" replace />} />
        </Routes>
    )
}

export default AppRoutes;

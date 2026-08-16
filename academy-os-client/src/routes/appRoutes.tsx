import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/auth/login"
import Register from "@/pages/auth/register"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import Home from "@/pages/home/home"
import CohortListPage from "@/pages/CohortListPage"
import CohortDetailPage from "@/pages/CohortDetailPage"
import PrivateRoutes from "./privateRoutes"

const AppRoutes = () => {
    return (
        <Routes>
            {/* ── Module Cohortes (Accessible directement) ───────── */}
            <Route path="/cohortes" element={<CohortListPage />} />
            <Route path="/cohortes/:id" element={<CohortDetailPage />} />

            {/* ── Routes Protégées ──────────────────────────────── */}
            <Route element={<PrivateRoutes/>}>
                <Route path="/" element={<Home />} />
            </Route>

            {/* ── Auth ──────────────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/cohortes" replace />} />
        </Routes>
    )
}

export default AppRoutes;

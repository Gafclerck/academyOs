import { Routes, Route, Navigate } from 'react-router-dom'

import Login from '@/pages/auth/login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import InviteResetPassword from '@/pages/auth/InviteResetPassword'

import PrivateRoutes from '@/routes/privateRoutes'

import { ProgrammeLayout } from '@/components/layouts/ProgrammeLayout'

/* ============================================================
   PROGRAMMES
============================================================ */

import { ProgrammeListPage } from '@/pages/programme/ProgrammeListPage'
import { ProgrammeCreatePage } from '@/pages/programme/ProgrammeCreatePage'
import { ProgrammeDetailPage } from '@/pages/programme/ProgrammeDetailPage'
import { ProgrammeEditPage } from '@/pages/programme/ProgrammeEditPage'

/* ============================================================
   RENTRÉES
============================================================ */

import { RentreeCreatePage } from '@/pages/rentrees/RentreeCreatePage'
import { RentreeDetailPage } from '@/pages/rentrees/RentreeDetailPage'
import { RentreeListPage } from '@/pages/rentrees/RentreeListPage'
import RentreeEditPage from '@/pages/rentrees/RentreeEditPage'

/* ============================================================
   COHORTES
============================================================ */

import { CohorteCreatePage } from '@/pages/cohortes/CohorteCreatePage'
import CohorteEditPage from '@/pages/cohortes/CohorteEditPage'
import CohortListPage from '@/pages/cohortes/CohortListPage'
import CohorteDetailPage from '@/pages/cohortes/CohorteDetailPage'

import InviterApprenant from '@/pages/cohortes/InviterApprenant'
import InviterFormateur from '@/pages/cohortes/InviterFormateur'

/* ============================================================
   PROJETS
============================================================ */

import { ProjetListPage } from '@/pages/projets/ProjetListPage'
import ProjetCreatePage from '@/pages/projets/ProjetCreatePage'
import ProjetDetailPage from '@/pages/projets/ProjetDetailPage'

/* ============================================================
   UTILISATEURS
============================================================ */

import UsersPage from '@/pages/users/UsersPage'
import AddUserPage from '@/pages/users/AddUserPage'
import EditUserPage from '@/pages/users/EditUserPage'
import Profile from '@/pages/users/Profile'

/* ============================================================
   DASHBOARD
============================================================ */

import AdminDashboard from '@/pages/dashboard/AdminDashboard'
import ProjetEditPage from '@/pages/projets/ProjetEditPage'
import EvaluationsPage from '@/pages/evaluations/EvaluationsPage'

const AppRoutes = () => {
  return (
    <Routes>

      {/* ======================================================
          AUTHENTIFICATION
      ====================================================== */}

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite-reset-password" element={<InviteResetPassword />} />

      {/* ======================================================
          ROUTES PROTÉGÉES
      ====================================================== */}

      <Route element={<PrivateRoutes />}>
        <Route element={<ProgrammeLayout />}>

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ==================================================
              1. PROGRAMMES
          ================================================== */}

          <Route path="/programmes" element={<ProgrammeListPage />} />
          <Route path="/programmes/new" element={<ProgrammeCreatePage />} />
          <Route path="/programmes/:id" element={<ProgrammeDetailPage />} />
          <Route path="/programmes/:id/edit" element={<ProgrammeEditPage />} />

          {/* ==================================================
              2. RENTRÉES
          ================================================== */}

          <Route path="/rentrees" element={<RentreeListPage />} />
          <Route path="/rentrees/new" element={<RentreeCreatePage />} />
          <Route path="/rentrees/:id" element={<RentreeDetailPage />} />
          <Route path="/rentrees/:id/edit" element={<RentreeEditPage />} />

          {/* ==================================================
              COMPATIBILITÉ ANCIENNES URLS
          ================================================== */}

          <Route path="/sessions" element={<Navigate to="/rentrees" replace />} />
          <Route path="/sessions/:id" element={<Navigate to="/rentrees" replace />} />

          {/* ==================================================
              3. COHORTES
          ================================================== */}

          <Route path="/cohortes" element={<CohortListPage />} />
          <Route path="/cohortes/new" element={<CohorteCreatePage />} />
          <Route path="/cohortes/:id" element={<CohorteDetailPage />} />
          <Route path="/cohortes/:id/edit" element={<CohorteEditPage />} />

          {/* ==================================================
              4. INVITATIONS
          ================================================== */}

          <Route path="/cohortes/:id/inviter-apprenant" element={<InviterApprenant />} />
          <Route path="/cohortes/:id/inviter-formateur" element={<InviterFormateur />} />

          {/* ==================================================
              5. PROJETS
          ================================================== */}

          <Route path="/projets" element={<ProjetListPage />} />
          <Route path="/programmes/:id/projets" element={<ProjetListPage />} />
          <Route path="/programmes/:id/projets/new" element={<ProjetCreatePage />} />
          <Route path="/projets/new" element={<ProjetCreatePage />} />
          <Route path="/projets/:id" element={<ProjetDetailPage />} />
          <Route path="/projets/:id/edit" element={<ProjetEditPage />} />


          {/* ÉVALUATIONS */}
          <Route path="/evaluations/*" element={<EvaluationsPage />} />

          

          {/* ==================================================
              6. UTILISATEURS
          ================================================== */}

          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<AddUserPage />} />
          <Route path="/users/:id/edit" element={<EditUserPage />} />
          <Route path="/profile" element={<Profile />} />

        </Route>
      </Route>

      {/* ======================================================
          FALLBACK
      ====================================================== */}

      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}

export default AppRoutes
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/auth/login';
import ForgotPassword from '@/pages/auth/ForgotPassword';

import PrivateRoutes from '@/routes/privateRoutes';


import { ProgrammeLayout } from '@/components/layouts/ProgrammeLayout';
import { ProgrammeListPage } from '@/pages/programme/ProgrammeListPage';
import { ProgrammeCreatePage } from '@/pages/programme/ProgrammeCreatePage';
import { ProgrammeDetailPage } from '@/pages/programme/ProgrammeDetailPage';
import { RentreeCreatePage } from '@/pages/rentrees/RentreeCreatePage';
import { RentreeDetailPage } from '@/pages/rentrees/RentreeDetailPage';
import { RentreeListPage } from '@/pages/rentrees/RentreeListPage';
import { CohorteCreatePage } from '@/pages/cohortes/CohorteCreatePage';
import { CohorteDetailPage } from '@/pages/cohortes/CohorteDetailPage';
import InviterApprenant from '@/pages/cohortes/InviterApprenant';
import InviterFormateur from '@/pages/cohortes/InviterFormateur';
import UsersPage from '@/pages/users/UsersPage';
import AddUserPage from '@/pages/users/AddUserPage'
import ResetPassword from '@/pages/auth/ResetPassword'
import CohortListPage from '@/pages/cohortes/CohortListPage';
import InviteResetPassword from '@/pages/auth/InviteResetPassword'
import Profile from '@/pages/users/Profile'
import AdminDashboard from '@/pages/dashboard/AdminDashboard'
import EditUserPage from '@/pages/users/EditUserPage';
import { ProjetListPage } from '@/pages/projets/ProjetListPage';


const AppRoutes = () => {
  return (
    <Routes>
      {/* ── AUTHENTIFICATION ──────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite-reset-password" element={<InviteResetPassword />} />

      {/* ── MODULE PROGRAMME & HIERARCHIE COMPLETE (PROTÉGÉ) ── */}
      <Route element={<PrivateRoutes />}>

        <Route element={<ProgrammeLayout />}>

          <Route path="/dashboard" element={<AdminDashboard />} />

          {/* 1. Programmes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/programmes" element={<ProgrammeListPage />} />
          <Route path="/programmes/new" element={<ProgrammeCreatePage />} />
          <Route path="/programmes/:id" element={<ProgrammeDetailPage />} />

          {/* 2. Rentrées */}
          <Route path="/rentrees/new" element={<RentreeCreatePage />} />
          <Route path="/programmes/:programmeId/rentrees/new" element={<RentreeCreatePage />} />
          <Route path="/rentrees" element={<RentreeListPage />} />
          <Route path="/rentrees/:id" element={<RentreeDetailPage />} />

          {/* Redirections compatibilité anciennes URLs Sessions */}
          <Route path="/sessions/:id" element={<Navigate to="/rentrees/:id" replace />} />
          <Route path="/sessions" element={<Navigate to="/rentrees" replace />} />

          {/* 3. Cohortes */}
          <Route path="/rentrees/:rentreeId/cohortes/new" element={<CohorteCreatePage />} />
          <Route path="/cohortes" element={<CohortListPage />} />
          <Route path="/cohortes/:id" element={<CohorteDetailPage />} />

          {/* 4. Invitations */}
          <Route path="/cohortes/:id/inviter-apprenant" element={<InviterApprenant />} />
          <Route path="/cohortes/:id/inviter-formateur" element={<InviterFormateur />} />

          {/* 5. Projets */}
          <Route path="/projets" element={<ProjetListPage />} />

          {/* 6. Utilisateurs */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<AddUserPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:id/edit" element={<EditUserPage />} />


        </Route>
      </Route>

      {/* ── FALLBACK ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

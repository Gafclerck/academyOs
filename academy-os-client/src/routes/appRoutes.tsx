import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/auth/login';
import ForgotPassword from '@/pages/auth/ForgotPassword';

import PrivateRoutes from '@/routes/privateRoutes';


import { ProgrammeLayout } from '@/modules/programme/components/layout/ProgrammeLayout';
import { ProgrammeListPage } from '@/modules/programme/pages/ProgrammeListPage';
import { ProgrammeCreatePage } from '@/modules/programme/pages/ProgrammeCreatePage';
import { ProgrammeDetailPage } from '@/modules/programme/pages/ProgrammeDetailPage';
import { RentreeCreatePage } from '@/modules/programme/pages/RentreeCreatePage';
import { RentreeDetailPage } from '@/modules/programme/pages/RentreeDetailPage';
import { RentreeListPage } from '@/modules/programme/pages/RentreeListPage';
import { CohorteCreatePage } from '@/modules/programme/pages/CohorteCreatePage';
import { CohorteDetailPage } from '@/modules/programme/pages/CohorteDetailPage';
import InviterApprenant from '@/modules/programme/pages/InviterApprenant';
import InviterFormateur from '@/modules/programme/pages/InviterFormateur';
import UsersPage from '@/modules/programme/pages/UsersPage';
import { ProjetListPage } from '@/modules/programme/pages/ProjetListPage';
import AddUserPage from '@/modules/programme/pages/AddUserPage'
import ResetPassword from '@/pages/auth/ResetPassword'
import CohortListPage from '@/pages/CohortListPage';
import InviteResetPassword from '@/pages/auth/InviteResetPassword'
import Profile from '@/pages/Profile'


const AppRoutes = () => {
  return (
    <Routes>
      {/* ── AUTHENTIFICATION ──────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite-reset-password"element={<InviteResetPassword />}/>

      {/* ── MODULE PROGRAMME & HIERARCHIE COMPLETE (PROTÉGÉ) ── */}
      <Route element={<PrivateRoutes />}>
        <Route element={<ProgrammeLayout />}>
          {/* 1. Programmes */}
          <Route path="/" element={<Navigate to="/programmes" replace />} />
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

        </Route>
      </Route>

      {/* ── FALLBACK ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

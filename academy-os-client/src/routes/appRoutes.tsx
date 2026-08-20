import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
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
import { ProjetListPage } from '@/pages/programme/ProjetListPage';
import { ProjetDetailPage } from '@/pages/programme/ProjetDetailPage';
import CertificatListPage from '@/pages/programme/CertificatListPage';

import CohortListPage from '@/pages/CohortListPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── AUTHENTIFICATION ──────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

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
          <Route path="/projets/:id" element={<ProjetDetailPage />} />
          <Route path="/cohortes/:cohorteId/certificats" element={<CertificatListPage />} />
        </Route>
      </Route>

      {/* ── FALLBACK ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from '@/pages/auth/login'
import Register from '@/pages/auth/register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

import { ProgrammeLayout } from '@/modules/programme/components/layout/ProgrammeLayout'

import { ProgrammeListPage } from '@/modules/programme/pages/ProgrammeListPage'
import { ProgrammeCreatePage } from '@/modules/programme/pages/ProgrammeCreatePage'
import { ProgrammeDetailPage } from '@/modules/programme/pages/ProgrammeDetailPage'

import { SessionCreatePage } from '@/modules/programme/pages/SessionCreatePage'
import { SessionListPage } from '@/modules/programme/pages/SessionListPage'
import { SessionDetailPage } from '@/modules/programme/pages/SessionDetailPage'

import { CohorteCreatePage } from '@/modules/programme/pages/CohorteCreatePage'
import { CohorteDetailPage } from '@/modules/programme/pages/CohorteDetailPage'

import InviterApprenant from '@/modules/programme/pages/InviterApprenant'
import InviterFormateur from '@/modules/programme/pages/InviterFormateur'

import { ProjetListPage } from '@/modules/programme/pages/ProjetListPage'

import CohortListPage from '@/pages/CohortListPage'

const AppRoutes = () => {
  return (
    <Routes>

      {/* ================= AUTH ================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* ================= APPLICATION ================= */}

      <Route element={<ProgrammeLayout />}>

        {/* ACCUEIL */}

        <Route
          path="/"
          element={
            <Navigate
              to="/programmes"
              replace
            />
          }
        />

        {/* ================= PROGRAMMES ================= */}

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

        {/* ================= SESSIONS ================= */}

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

        {/* ================= COHORTES ================= */}

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

        {/* ================= INVITER APPRENANT ================= */}

        <Route
          path="/cohortes/:id/inviter-apprenant"
          element={<InviterApprenant />}
        />

        {/* ================= INVITER FORMATEUR ================= */}

        <Route
          path="/cohortes/:id/inviter-formateur"
          element={<InviterFormateur />}
        />

        {/* ================= PROJETS ================= */}

        <Route
          path="/projets"
          element={<ProjetListPage />}
        />

      </Route>

      {/* ================= FALLBACK ================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/programmes"
            replace
          />
        }
      />

    </Routes>
  )
}

export default AppRoutes





// import {
//   Routes,
//   Route,
//   Navigate,
// } from 'react-router-dom'

// import Login from '@/pages/auth/login'
// import Register from '@/pages/auth/register'
// import ForgotPassword from '@/pages/auth/ForgotPassword'

// import PrivateRoutes from '@/routes/privateRoutes'

// import { ProgrammeLayout } from '@/modules/programme/components/layout/ProgrammeLayout'
// import { ProgrammeListPage } from '@/modules/programme/pages/ProgrammeListPage'
// import { ProgrammeCreatePage } from '@/modules/programme/pages/ProgrammeCreatePage'
// import { ProgrammeDetailPage } from '@/modules/programme/pages/ProgrammeDetailPage'
// import { SessionCreatePage } from '@/modules/programme/pages/SessionCreatePage'
// import { SessionListPage } from '@/modules/programme/pages/SessionListPage'
// import { SessionDetailPage } from '@/modules/programme/pages/SessionDetailPage'
// import { CohorteCreatePage } from '@/modules/programme/pages/CohorteCreatePage'
// import { CohorteDetailPage } from '@/modules/programme/pages/CohorteDetailPage'
// import { ProjetListPage } from '@/modules/programme/pages/ProjetListPage'

// import CohortListPage from '@/pages/CohortListPage'

// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* ───────── AUTH ───────── */}

//       <Route
//         path="/login"
//         element={<Login />}
//       />

//       <Route
//         path="/register"
//         element={<Register />}
//       />

//       <Route
//         path="/forgot-password"
//         element={<ForgotPassword />}
//       />

//       {/* ───────── PRIVATE APP ───────── */}

//       <Route element={<PrivateRoutes />}>
//         <Route element={<ProgrammeLayout />}>

//           <Route
//             path="/"
//             element={
//               <Navigate
//                 to="/programmes"
//                 replace
//               />
//             }
//           />

//           {/* Programmes */}

//           <Route
//             path="/programmes"
//             element={<ProgrammeListPage />}
//           />

//           <Route
//             path="/programmes/new"
//             element={<ProgrammeCreatePage />}
//           />

//           <Route
//             path="/programmes/:id"
//             element={<ProgrammeDetailPage />}
//           />

//           {/* Sessions */}

//           <Route
//             path="/programmes/:programmeId/sessions/new"
//             element={<SessionCreatePage />}
//           />

//           <Route
//             path="/sessions"
//             element={<SessionListPage />}
//           />

//           <Route
//             path="/sessions/:id"
//             element={<SessionDetailPage />}
//           />

//           {/* Cohortes */}

//           <Route
//             path="/sessions/:sessionId/cohortes/new"
//             element={<CohorteCreatePage />}
//           />

//           <Route
//             path="/cohortes"
//             element={<CohortListPage />}
//           />

//           <Route
//             path="/cohortes/:id"
//             element={<CohorteDetailPage />}
//           />

//           {/* Projets */}

//           <Route
//             path="/projets"
//             element={<ProjetListPage />}
//           />

//         </Route>
//       </Route>

//       {/* ───────── FALLBACK ───────── */}

//       <Route
//         path="*"
//         element={
//           <Navigate
//             to="/login"
//             replace
//           />
//         }
//       />
//     </Routes>
//   )
// }

// export default AppRoutes

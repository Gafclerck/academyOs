import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

const PrivateRoutes = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

export default PrivateRoutes
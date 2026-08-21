import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'
import { parseApiError } from '@/lib/errorUtils'
import type { LoginCredentials } from '@/types/auth'

const useLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loading, setLoading] = useState(false)

  const handleLogin = async (
    credentials: LoginCredentials,
  ): Promise<void> => {
    setLoading(true)

    try {
      await login(credentials)

      toast.success('Connexion réussie', {
        description:
          'Bienvenue sur votre espace Xarala.',
      })

      // Après connexion → Dashboard
      navigate('/admin/dashboard', {
        replace: true,
      })
    } catch (error) {
      const parsedError = parseApiError(error)

      toast.error('Échec de la connexion', {
        description: parsedError.message,
      })

      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    handleLogin,
    loading,
  }
}

export default useLogin
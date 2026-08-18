import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { registerService } from '@/services/auth/register'
import { parseApiError } from '@/lib/errorUtils'

import type { RegisterFormValues } from '@/lib/schemas'
import type { RegisterRequest } from '@/types/auth'

const useRegister = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleRegister = async (
    data: RegisterFormValues,
  ): Promise<void> => {
    setLoading(true)

    try {
      // On extrait explicitement les champs attendus par le backend.
      // confirm_password ne doit jamais être envoyé à l'API.
      const payload: RegisterRequest = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        ...(data.phone_number
          ? { phone_number: data.phone_number }
          : {}),
      }

      await registerService(payload)

      toast.success('Compte créé avec succès !', {
        description: 'Vous pouvez maintenant vous connecter.',
      })

      navigate('/login', { replace: true })
    } catch (error) {
      const parsedError = parseApiError(error)

      toast.error('Inscription échouée', {
        description: parsedError.message,
      })

      console.error('[useRegister]', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    handleRegister,
    loading,
  }
}

export default useRegister
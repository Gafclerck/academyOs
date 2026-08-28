import axios from 'axios'

interface DRFErrorResponse {
  detail?: string
  message?: string
  error?: string
  non_field_errors?: string[]
  [key: string]: unknown
}

interface ParsedApiError {
  message: string
  fieldErrors?: Record<string, string>
}

export function parseApiError(
  error: unknown,
  fallback = 'Une erreur inattendue est survenue.',
): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return {
        message: error.message,
      }
    }

    return {
      message: fallback,
    }
  }

  if (!error.response) {
    return {
      message:
        'Impossible de contacter le serveur. Vérifiez votre connexion.',
    }
  }

  const raw = error.response.data

  if (typeof raw === 'string') {
    return {
      message: raw,
    }
  }

  if (Array.isArray(raw)) {
    const first = raw.find(
      (item): item is string => typeof item === 'string',
    )

    if (first) {
      return { message: first }
    }

    return { message: fallback }
  }

  const data = raw as DRFErrorResponse

  if (typeof data?.detail === 'string') {
    return {
      message: data.detail,
    }
  }

  const fieldErrors: Record<string, string> = {}

  Object.entries(data ?? {}).forEach(
    ([field, value]) => {
      if (Array.isArray(value)) {
        const firstMessage = value.find(
          (item): item is string =>
            typeof item === 'string',
        )

        if (firstMessage) {
          fieldErrors[field] = firstMessage
        }
      } else if (typeof value === 'string') {
        fieldErrors[field] = value
      }
    },
  )

  if (fieldErrors.non_field_errors) {
    return {
      message: fieldErrors.non_field_errors,
      fieldErrors,
    }
  }

  if (typeof data?.message === 'string') {
    return {
      message: data.message,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    }
  }

  const firstError = Object.values(fieldErrors)[0]

  return {
    message:
      firstError ||
      fallback,
    fieldErrors:
      Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : undefined,
  }
}
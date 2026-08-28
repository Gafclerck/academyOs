import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  reviewDeliverable,
} from '@/services/evaluations/evaluationService'
import type { Deliverable } from '@/types/evaluation'
import type { ReviewDeliverableDTO } from '@/types/evaluation'
import { toast } from 'sonner'
import { trainerDashboardKeys } from './useTrainerDashboard'

export function useDeliverableReview(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()

  return useMutation<
    Deliverable,
    Error,
    { deliverableId: string; data: ReviewDeliverableDTO }
  >({
    mutationFn: ({ deliverableId, data }) =>
      reviewDeliverable(deliverableId, data),
    onSuccess: (_, { data }) => {
      const isApproved = data.status === 'validated'
      toast.success(
        isApproved
          ? 'Livrable validé avec succès !'
          : 'Livrable renvoyé pour correction.',
      )

      queryClient.invalidateQueries({ queryKey: trainerDashboardKeys.all })
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })

      onSuccessCallback?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l’enregistrement de l’évaluation.')
    },
  })
}

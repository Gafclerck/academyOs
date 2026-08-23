import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getRentrees,
  createRentree,
} from '@/services/rentrees/rentreeService'

import type {
  Rentree,
  CreateRentreeDTO,
} from '@/types/rentree'

export const useRentrees = () => {
  return useQuery<Rentree[]>({
    queryKey: ['rentrees'],
    queryFn: getRentrees,
  })
}

export const useCreateRentree = () => {
  const queryClient =
    useQueryClient()

  return useMutation<
    Rentree,
    Error,
    CreateRentreeDTO
  >({
    mutationFn: createRentree,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rentrees'],
      })
    },
  })
}

export default useRentrees
import React from 'react'
import { GraduationCap, Users, UserCheck, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { TrainerDashboardStats } from '@/services/dashboard/dashboardService'

interface TrainerStatsCardsProps {
  stats: TrainerDashboardStats
  isLoading?: boolean
}

export const TrainerStatsCards: React.FC<TrainerStatsCardsProps> = ({
  stats,
  isLoading,
}) => {
  const cards = [
    {
      title: 'Livrables en attente',
      value: stats.pending_reviews_count,
      description: 'Soumissions à corriger',
      icon: Clock,
      highlight: stats.pending_reviews_count > 0,
      iconBg: stats.pending_reviews_count > 0 ? 'bg-[#FF6B0B]/10 text-[#FF6B0B]' : 'bg-slate-100 text-slate-500',
    },
    {
      title: 'Étudiants suivis',
      value: stats.total_students,
      description: 'Dans toutes vos cohortes',
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Mentorés directs',
      value: stats.direct_mentees_count,
      description: 'Assignés personnellement',
      icon: UserCheck,
      iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Cohortes actives',
      value: stats.total_assigned_cohorts,
      description: 'Promotions en cours',
      icon: GraduationCap,
      iconBg: 'bg-purple-500/10 text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className={`bg-white p-5 transition-all duration-200 shadow-sm hover:shadow-md dark:bg-[#1f1f38] ${
              card.highlight
                ? 'border-[#FF6B0B]/40'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {isLoading ? '...' : card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>
              <div className={`flex size-12 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <Icon className="size-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

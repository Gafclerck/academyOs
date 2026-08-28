import React from 'react'
import { useAuth } from '@/context/AuthContext'
import AdminDashboard from './AdminDashboard'
import TrainerDashboard from './TrainerDashboard'
import LearnerDashboard from './LearnerDashboard'

export const DashboardDispatcher: React.FC = () => {
  const { user } = useAuth()

  if (user?.role === 'trainer') {
    return <TrainerDashboard />
  }

  if (user?.role === 'learner') {
    return <LearnerDashboard />
  }

  return <AdminDashboard />
}

export default DashboardDispatcher

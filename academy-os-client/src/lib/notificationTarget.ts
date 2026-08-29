/**
 * Résout la page vers laquelle naviguer à partir d'une notification.
 *
 * La cible dépend du `notification_type` (sémantique métier) et peut
 * porter l'`object_id` (entité source) en paramètre de requête afin
 * que la page de destination puisse ouvrir directement le détail.
 */

import type { AppNotification } from '@/types/notification'

export function notificationTargetPath(
  notification: AppNotification,
): string | null {
  switch (notification.notification_type) {
    case 'claim_created':
      // Réclamation créée → admin / organisateur, ouverte sur le détail.
      return notification.object_id
        ? `/reclamations?reclamation=${encodeURIComponent(
            notification.object_id,
          )}`
        : '/reclamations'

    case 'claim_updated':
      // Réclamation mise à jour → apprenant, page des certificats.
      return '/certificats'

    default:
      return null
  }
}
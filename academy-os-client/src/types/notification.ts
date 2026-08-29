/**
 * Types TypeScript pour le module Notification
 * Xarala Academy OS
 *
 * La forme de données reflète `NotificationSerializer` côté backend
 * (apps/notifications/serializers.py). Le payload WebSocket doit rester
 * aligné sur cette interface (voir `_notification_payload` côté backend).
 */

/* ============================================================
   1. NOTIFICATION
============================================================ */

export interface AppNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  content_type: number | null;
  object_id: string | null;
  created_at: string;
}

/* ============================================================
   2. RÉPONSES
============================================================ */

export interface UnreadNotificationCount {
  unread_count: number;
}

export interface MarkAllAsReadResponse {
  updated_count: number;
}
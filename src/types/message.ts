export type MessageStatus = 'unread' | 'read' | 'replied';

export type EmailDeliveryStatus = 'sent' | 'failed' | 'not_configured' | 'pending' | 'sending';

export interface ContactMessage {
  id: string;
  userId?: string;
  idempotencyKey?: string;
  name: string;
  email: string;
  phone?: string | null;
  topic?: string;
  message: string;
  status: MessageStatus;
  emailDeliveryStatus?: EmailDeliveryStatus;
  emailDeliveryError?: string | null;
  emailRecipient?: string;
  emailDeliveryId?: string | null;
  emailSentAt?: string | null;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

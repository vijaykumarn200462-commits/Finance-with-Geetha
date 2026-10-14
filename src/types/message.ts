export type MessageStatus = 'unread' | 'read' | 'replied';

export type EmailDeliveryStatus = 'sent' | 'failed' | 'not_configured' | 'pending';

export interface ContactMessage {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string | null;
  topic?: string;
  message: string;
  status: MessageStatus;
  emailDeliveryStatus?: EmailDeliveryStatus;
  emailDeliveryError?: string | null;
  emailRecipient?: string;
  emailDeliveryId?: string;
  emailSentAt?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

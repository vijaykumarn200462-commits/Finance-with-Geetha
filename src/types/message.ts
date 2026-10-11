export type MessageStatus = 'unread' | 'read' | 'replied';

export interface ContactMessage {
  id: string;
  userId?: string;
  name: string;
  email: string;
  topic?: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
}

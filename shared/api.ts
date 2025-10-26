/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type EmailActionType = "reply" | "archive" | "delete";

export interface EmailRecord {
  id: string | number;
  subject?: string | null;
  body?: string | null;
  from_name?: string | null;
  from_email?: string | null;
  received_date?: string | null;
  is_read?: boolean | null;
  is_archived?: boolean | null;
  message_id?: string | number | null;
  [key: string]: unknown;
}

import { apiGet } from "./api";

export function getUnreadCount() {
  return apiGet("/api/notifications/unread-count");
}

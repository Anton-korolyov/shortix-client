import { apiGet } from "./api";

export function getUnreadCount() {
  return apiGet("/notifications/unread-count");
}

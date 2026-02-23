import { useEffect, useState } from "react";
import { getNotificationConnection } from "../api/notificationHub";

export type Notification = {
  type: string;
  message: string;
  link?: string;
};

export function useNotifications() {

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {

    const conn = getNotificationConnection();
    if (!conn) return;

    const handler = (n: Notification) => {

      // добавляем уведомление
      setItems(prev => [n, ...prev]);

      // 🔔 увеличиваем счётчик
      setUnreadCount(prev => prev + 1);
    };

    conn.off("ReceiveNotification");
    conn.on("ReceiveNotification", handler);

    return () => {
      conn.off("ReceiveNotification", handler);
    };

  }, []);

  function markAllRead() {
    setUnreadCount(0);
  }

  return {
    notifications: items,
    unreadCount,
    markAllRead
  };
}

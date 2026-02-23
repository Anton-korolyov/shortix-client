import { useEffect, useState } from "react";
import { getMyNotifications, markAllNotificationsRead } from "../api/api";
import "./notifications.css";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
};

export default function Notifications() {

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function load() {
      try {
        const data = await getMyNotifications();
        setItems(data);

        // 🔥 сразу помечаем как прочитанные
        await markAllNotificationsRead();
      } catch (e) {
        console.error("Load notifications error", e);
      } finally {
        setLoading(false);
      }
    }

    load();

  }, []);

  return (
    <div className="notifications-page">

      <div className="notifications-header">
        Notifications
                <button
    className="notif-back"
    onClick={() => window.history.back()}
  >
    Back →
  </button>
      </div>

      <div className="notifications-list">

        {loading && (
          <div className="notif-empty">
            Loading...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="notif-empty">
            No notifications yet
          </div>
        )}

        {items.map(n => (
          <div
            key={n.id}
            className={
              n.isRead
                ? "notification-item"
                : "notification-item unread"
            }
          >
            {n.message}
          </div>
        ))}

      </div>

    </div>
  );
}

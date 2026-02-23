import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { getMyNotifications } from "../api/api";
import "./notificationBell.css";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
};

/* ⚡ WHITE LIGHTNING ICON */
function LightningIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

export default function NotificationBell() {

  const nav = useNavigate();
  const { count } = useUnreadCount();

  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notification[]>([]);

  async function toggle() {
    if (!open) {
      const data = await getMyNotifications();
      setList(data);
    }
    setOpen(x => !x);
  }

  return (
    <div style={{ position: "relative" }}>

      {/* ⚡ */}
      <div className="lightning-wrap" onClick={toggle}>
        <LightningIcon />

        {count > 0 && (
          <span className="lightning-badge">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>

      {/* POPUP */}
      {open && (
        <div className="notif-popup">

          {list.slice(0, 5).map(n => (
            <div
              key={n.id}
              className={
                "notif-item " +
                (n.isRead ? "" : "unread")
              }
            >
              {n.message}
            </div>
          ))}

      <div
  className="notif-seeall"
  onClick={() => {

    // 🔔 говорим хуку: уведомления прочитаны
    window.dispatchEvent(
      new Event("notificationsRead")
    );

    setOpen(false);
    nav("/notifications");
  }}
>
  See all notifications →
</div>

        </div>
      )}

    </div>
  );
}

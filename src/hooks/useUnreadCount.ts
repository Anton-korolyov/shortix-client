import { useEffect, useState } from "react";
import { getUnreadCount } from "../api/notifications";

export function useUnreadCount() {

  const [count, setCount] = useState(0);

  async function load() {
    const res = await getUnreadCount();
    setCount(res.count);
  }

  useEffect(() => {

    // initial load
    load();

    // когда пришло новое уведомление
    const onReceived = () => load();

    // когда открыли Notifications
    const onRead = () => setCount(0);

    window.addEventListener(
      "notification-received",
      onReceived
    );

    window.addEventListener(
      "notificationsRead",
      onRead
    );

    return () => {
      window.removeEventListener(
        "notification-received",
        onReceived
      );

      window.removeEventListener(
        "notificationsRead",
        onRead
      );
    };

  }, []);

  return { count };
}

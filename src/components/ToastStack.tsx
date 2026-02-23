import "./toast.css";

export type ToastItem = {
  id: string;
  type: "follow" | "like" | "comment" | string;
  message: string;
  link?: string;
};

type Props = {
  items: ToastItem[];
  onClose: (id: string) => void;
  onClick?: (t: ToastItem) => void;
};

export default function ToastStack({ items, onClose, onClick }: Props) {
  return (
    <div className="toast-stack">
      {items.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onClick?.(t)}
          role="button"
        >
          <div className="toast-row">
            <div className="toast-icon">
              {t.type === "follow" ? "➕" : t.type === "like" ? "❤️" : "💬"}
            </div>

            <div className="toast-body">
              <div className="toast-title">
                {t.type === "follow" ? "New follower" :
                 t.type === "like" ? "New like" :
                 t.type === "comment" ? "New comment" : "Notification"}
              </div>
              <div className="toast-msg">{t.message}</div>
            </div>

            <button
              className="toast-close"
              onClick={(e) => { e.stopPropagation(); onClose(t.id); }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

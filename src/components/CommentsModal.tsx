import { useEffect, useState } from "react";
import { addComment, getComments } from "../api/api";
import "./comments.css";
import LoginRegisterModal from "../components/LoginRegisterModal";
type Props = {
  nodeId: string;
  onClose: () => void;
};

type Comment = {
  id: string;
  text: string;
  userName: string;
};

export default function CommentsModal({ nodeId, onClose }: Props) {

  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  // ================= LOAD COMMENTS =================

  useEffect(() => {
    load();
  }, [nodeId]);

  async function load() {
    try {
      const data = await getComments(nodeId);
      console.log("COMMENTS:", data);
      setComments(data);
    } catch (e) {
      console.error("Comments load error", e);
    }
  }

  // ================= SEND COMMENT =================

async function send() {
  if (!text.trim()) return;

  try {
    await addComment(nodeId, text);
    setText("");
    load();
  } catch {
  setShowAuth(true);
}
}


  // ================= UI =================

  return (
    <>
      <div className="comments-backdrop" onClick={onClose}>

        <div
          className="comments-sheet"
          onClick={(e) => e.stopPropagation()}
        >

          <div className="comments-header">
            <span>Comments</span>
            <button onClick={onClose}>✕</button>
          </div>

          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment">
                <b>@{c.userName}</b>
                <span>{c.text}</span>
              </div>
            ))}
          </div>

          <div className="comments-input">
            <input
              placeholder="Add comment..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button onClick={send}>Send</button>
          </div>

        </div>

      </div>

   {showAuth && (
  <LoginRegisterModal
    onClose={() => setShowAuth(false)}
    onSuccess={() => setShowAuth(false)}
  />
)}
    </>
  );
}

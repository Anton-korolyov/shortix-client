import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFollowing, toggleFollow } from "../api/api";
import "./FollowersFollowing.css";
type UserItem = {
  username: string;
  avatarUrl?: string;
};

export default function FollowingPage() {

  const { username } = useParams();
  const nav = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    if (!username) return;

    getFollowing(username)
      .then(setUsers);
  }, [username]);

  async function unfollow(u: UserItem) {
    await toggleFollow(u.username);
    setUsers(prev =>
      prev.filter(x => x.username !== u.username)
    );
  }
return (
  <div className="follow-root">
    <div className="follow-phone">

      {/* HEADER */}
      <div className="follow-header">
        <button
          className="follow-back"
          onClick={() => nav(-1)}
        >
          ← Back
        </button>

        <div className="follow-title">
          Following
        </div>
      </div>

      {/* LIST */}
      <div className="follow-list">

        {users.map(u => (
          <div
            key={u.username}
            className="follow-row"
            onClick={() =>
              nav(`/profile/${u.username}`)
            }
          >

            <img
              className="follow-avatar"
              src={
                u.avatarUrl
                  ? `${API}${u.avatarUrl}`
                  : "/avatar.png"
              }
            />

            <div className="follow-user">
              <div className="follow-username">
                @{u.username}
              </div>
              <div className="follow-sub">
                Following
              </div>
            </div>

            <button
              className="follow-action"
              onClick={e => {
                e.stopPropagation();
                unfollow(u);
              }}
            >
              Unfollow
            </button>

          </div>
        ))}

      </div>

    </div>
  </div>
);
}
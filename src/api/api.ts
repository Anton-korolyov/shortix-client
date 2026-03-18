const API = import.meta.env.VITE_API_URL;
// ===========================
// BASE REQUEST WITH REFRESH
// ===========================
async function request(url: string, options: RequestInit = {}) {

  let accessToken = localStorage.getItem("accessToken");

  let res = await fetch(API + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: accessToken ? `Bearer ${accessToken}` : ""
    }
  });

  // ===========================
  // ACCESS TOKEN EXPIRED
  // ===========================
  if (res.status === 401) {

    const refreshToken =
      localStorage.getItem("refreshToken");

    if (!refreshToken) {
     
      throw new Error("Unauthorized");
    }

    const refreshRes = await fetch(
      API + "/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      }
    );

    if (!refreshRes.ok) {
      logout();
      throw new Error("Unauthorized");
    }

    const data = await refreshRes.json();

    // 💾 SAVE NEW TOKENS
    localStorage.setItem(
      "accessToken",
      data.accessToken
    );
    localStorage.setItem(
      "refreshToken",
      data.refreshToken
    );

    // 🔁 RETRY ORIGINAL REQUEST
    res = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization:
          `Bearer ${data.accessToken}`
      }
    });
  }

  // ===========================

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  const text = await res.text();
return text ? JSON.parse(text) : null;
 
}

// ===========================
// AUTH HELPERS
// ===========================

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/";
}

// ===========================
// GET
// ===========================
export function apiGet(url: string) {
  return request(url);
}

// ===========================
// POST JSON
// ===========================
export function apiPost(url: string, body: any) {
  return request(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ===========================
// PUT
// ===========================
export function apiPut(url: string, body: any) {
  return request(url, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

// ===========================
// DELETE
// ===========================
export function apiDelete(url: string) {
  return request(url, {
    method: "DELETE"
  });
}

// ===========================
// UPLOAD FILE (with refresh)
// ===========================
export async function apiUpload(url: string, file: File) {

  let accessToken = localStorage.getItem("accessToken");

  const form = new FormData();
  form.append("file", file);

  let res = await fetch(API + url, {
    method: "POST",
    headers: {
      Authorization: accessToken
        ? `Bearer ${accessToken}`
        : ""
    },
    body: form
  });

  // ACCESS DEAD
  if (res.status === 401) {

    const refreshToken =
      localStorage.getItem("refreshToken");

    const refreshRes = await fetch(
      API + "/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      }
    );

    if (!refreshRes.ok) {
      logout();
      throw new Error("Unauthorized");
    }

    const data = await refreshRes.json();

    localStorage.setItem(
      "accessToken",
      data.accessToken
    );
    localStorage.setItem(
      "refreshToken",
      data.refreshToken
    );

    // retry upload
    res = await fetch(API + url, {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${data.accessToken}`
      },
      body: form
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  const text = await res.text();
return text ? JSON.parse(text) : null;
}

// ===========================
// AUTH
// ===========================
export function register(email: string, password: string) {
  return apiPost("/api/auth/register", { email, password });
}

export function login(email: string, password: string) {
  return apiPost("/api/auth/login", { email, password });
}

// ===========================
// FEED
// ===========================
export function getFeed(
  page = 1,
  following = false
) {
  return apiGet(
    `/api/feed?page=${page}&following=${following}`
  );
}

// ===========================
// VIDEO
// ===========================
export function canContinue(nodeId: string) {
  return apiGet(`/api/video/node/${nodeId}/can-continue`);
}
export async function uploadVideo(
  file: File,
  parentNodeId?: string | null,
  videoCategoryId?: string,
  tags?: string[]
) {
  let accessToken = localStorage.getItem("accessToken");
console.log("TAGS TO SEND:", tags);
const form = new FormData();

form.append("File", file);

if (parentNodeId)
  form.append("ParentNodeId", parentNodeId);

if (videoCategoryId)
  form.append("VideoCategoryId", videoCategoryId);

tags?.forEach((t, i) => {
  form.append(`Tags[${i}]`, t);
});

  let res = await fetch(API + "/api/video/upload", {
    method: "POST",
    headers: {
      Authorization: accessToken
        ? `Bearer ${accessToken}`
        : ""
    },
    body: form
  });

  // ===========================
  // ACCESS TOKEN EXPIRED
  // ===========================
  if (res.status === 401) {

    const refreshToken =
      localStorage.getItem("refreshToken");

    const refreshRes = await fetch(
      API + "/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      }
    );

    if (!refreshRes.ok) {
      logout();
      throw new Error("Unauthorized");
    }

    const data = await refreshRes.json();

    localStorage.setItem(
      "accessToken",
      data.accessToken
    );
    localStorage.setItem(
      "refreshToken",
      data.refreshToken
    );

    // 🔁 RETRY
    res = await fetch(API + "/api/video/upload", {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${data.accessToken}`
      },
      body: form
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function deleteVideo(id: string) {
  return apiDelete(`/api/video/${id}`);
}

// ===========================
// LIKES
// ===========================
export function toggleLike(nodeId: string) {
  return apiPost(`/api/like/${nodeId}`, {});
}

export function getLikeCount(nodeId: string) {
  return apiGet(`/api/like/${nodeId}/count`);
}

// ===========================
// COMMENTS
// ===========================
export function addComment(nodeId: string, text: string) {
  return apiPost("/api/comment", {
    storyNodeId: nodeId,
    text
  });
}

export function getComments(nodeId: string) {
  return apiGet(`/api/comment/${nodeId}`);
}

export function getCommentTree(nodeId: string) {
  return apiGet(`/api/comment/${nodeId}/tree`);
}

// ===========================
// VIEW
// ===========================
export function addView(videoId: string) {
  return apiPost(`/api/view/${videoId}`, {});
}

// ===========================
// WATCH TIME
// ===========================
export function saveWatchTime(
  videoId: string,
  seconds: number
) {
  return apiPost("/api/watch/watchtime", {
    videoId,
    seconds
  });
}

// ===========================
// FLOW
// ===========================
export function getFlow(nodeId: string) {
  return apiGet(`/api/flow/${nodeId}`);
}

// ===========================
// PROFILE
// ===========================
export function getMyVideos() {
  return apiGet("/api/profile/my-videos");
}

// ===========================
// PROFILE (PAGED)
// ===========================
export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type ProfileVideoItem = {
  id: string;
  previewUrl: string;
  createdAt: string;
};

export function getMyVideosPaged(page = 1, pageSize = 18, q = ""): Promise<Paged<ProfileVideoItem>> {
  return apiGet(`/api/profile/my-videos?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`);
}

export function getUserVideosPaged(username: string, page = 1, pageSize = 18, q = ""): Promise<Paged<ProfileVideoItem>> {
  return apiGet(`/api/profile/${encodeURIComponent(username)}/videos?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`);
}

export function getProfile(username: string) {
  return apiGet(`/api/profile/${username}`);
}

export function getMyProfile() {
  return apiGet("/api/profile/me");
}

export function updateProfile(data: {
  bio?: string;
  avatarUrl?: string;
}) {
  return apiPut("/api/profile/me", data);
}

export function uploadAvatar(file: File) {
  return apiUpload("/api/profile/avatar", file);
}
export function toggleFollow(username: string) {
  return apiPost(`/api/follow/${username}`, {});
}

export function getFollowCount(username: string) {
  return apiGet(`/api/follow/${username}/count`);
}

export function isFollowing(username: string) {
  return apiGet(`/api/follow/${username}/is-following`);
}
export function getMyNotifications() {
  return apiGet("/api/notifications");
}

export function markAllNotificationsRead() {
  return apiPost("/api/notifications/mark-read", {});
}
export async function getExplore(
  page: number,
  q: string = "",
  category: string = ""
) {
  const params = new URLSearchParams();
  params.append("page", page.toString());

  if (q) params.append("q", q);
  if (category) params.append("category", category);

  const res = await fetch(
  `${API}/api/feed/explore?${params.toString()}`
  );

  return await res.json();
}
export function getVideoCategories() {
  return apiGet("/api/video/categories");
}
export function getFollowers(username: string) {
  return apiGet(`/api/follow/${username}/followers`);
}

export function getFollowing(username: string) {
  return apiGet(`/api/follow/${username}/following`);
}
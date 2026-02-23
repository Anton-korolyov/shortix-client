import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate
} from "react-router-dom";
import { useSwipeable } from "react-swipeable";

import { getFlow, toggleLike } from "../api/api";

import LoginRegisterModal from "../components/LoginRegisterModal";
import CommentsModal from "../components/CommentsModal";
import { useAuth } from "../context/AuthContext";

import "./Flow.css";

/* ===========================
   TYPES
=========================== */

type FlowVideo = {
  id: string;
  url: string;
  hasChildren: boolean;
  likes: number;
  comments: number;
  isLiked: boolean;
  username: string;
  avatarUrl?: string;
};

type FlowLevel = {
  videos: FlowVideo[];
  index: number;
};

type FlowResponse = {
  defaultVideo: FlowVideo | null;
  alternatives: FlowVideo[];
};

/* ===========================
   STORAGE
=========================== */

// цепочка должна быть ПОД КАЖДЫЙ rootId отдельно
function chainKey(rootId: string) {
  return `flowChain:${rootId}`;
}

type ChainMap = Record<string, string>; // parentId -> chosenChildId

function readChain(rootId: string): ChainMap {
  try {
    return JSON.parse(sessionStorage.getItem(chainKey(rootId)) || "{}");
  } catch {
    return {};
  }
}

function writeChain(rootId: string, chain: ChainMap) {
  sessionStorage.setItem(chainKey(rootId), JSON.stringify(chain));
}

// удалить хвост после изменения ветки на parentId
function pruneTail(chain: ChainMap, parentId: string) {
  const oldChild = chain[parentId];
  if (!oldChild) return;

  // удаляем связь parent->oldChild
  delete chain[parentId];

  // и дальше по цепочке удаляем все потомки старой ветки
  let cur = oldChild;
  while (chain[cur]) {
    const next = chain[cur];
    delete chain[cur];
    cur = next;
  }
}

// сохранить шаг parent -> nextChild (и перезаписать если надо)
function saveStep(rootId: string, parentId: string, nextChildId: string, pruneFromParent: boolean) {
  const chain = readChain(rootId);

  // если меняем ветку вручную (Variants) — обрезаем хвост старой ветки
  if (pruneFromParent) {
    pruneTail(chain, parentId);
  }

  chain[parentId] = nextChildId;
  writeChain(rootId, chain);
}

/* ===========================
   FLOW
=========================== */

export default function Flow() {

  const { nodeId } = useParams();
  const navigate = useNavigate();

  const { isAuth, username } = useAuth();

  const [paused, setPaused] = useState(false);

  const [videos, setVideos] = useState<FlowVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [stack, setStack] = useState<FlowLevel[]>([]);
  const [chosenMap, setChosenMap] =
    useState<{ [parentId: string]: FlowVideo }>({});

  const [branchOptions, setBranchOptions] =
    useState<FlowVideo[]>([]);

  const [selectMode, setSelectMode] = useState(false);

  const [showAuth, setShowAuth] = useState(false);

  const [commentsNodeId, setCommentsNodeId] =
    useState<string | null>(null);

  const [likeBurst, setLikeBurst] =
    useState<{ [k: number]: boolean }>({});

  const [canContinueMap, setCanContinueMap] =
    useState<{ [id: string]: boolean }>({});

  /* ===========================
     HELPERS
  =========================== */

  async function loadVariantsFor(videoId: string) {
    const res: FlowResponse = await getFlow(videoId);

    setBranchOptions(res.alternatives);

    const map: { [id: string]: boolean } = {};
    for (const v of res.alternatives) {
      map[v.id] = v.hasChildren;
    }
    setCanContinueMap(map);
  }

  async function loadChildren(parentId: string) {

    setBranchOptions([]);

    const res: FlowResponse = await getFlow(parentId);
    const def = res.defaultVideo;

    if (def) {
      setVideos(prev =>
        prev.length === 0 ? [def] : prev
      );
      setCurrentIndex(0);
    }

    setBranchOptions(res.alternatives);

    const map: { [id: string]: boolean } = {};
    for (const v of res.alternatives) {
      map[v.id] = v.hasChildren;
    }
    setCanContinueMap(map);
  }

  /* ===========================
     RESTORE FULL STATE (stack + current)
  =========================== */

  async function restoreFullChain(rootId: string) {

    const chain = readChain(rootId);
    if (!chain[rootId]) {
      // цепочки нет — обычная загрузка
      await loadChildren(rootId);
      return;
    }

    // строим stack так же, как если бы юзер реально шёл вперёд
    const builtStack: FlowLevel[] = [];

    let parent = rootId;
    let currentVideo: FlowVideo | null = null;

    while (true) {

      const res: FlowResponse = await getFlow(parent);

      // что показывалось на уровне parent:
      // либо выбранная ветка, либо defaultVideo (если вдруг сохранили default)
      const chosenId = chain[parent];
      let next: FlowVideo | null =
        res.alternatives.find(v => v.id === chosenId) ||
        (res.defaultVideo && res.defaultVideo.id === chosenId ? res.defaultVideo : null);

      // если сохранённый id не найден — прекращаем восстановление
      if (!next) break;

      // то, что было "текущим видео" до перехода дальше
      // (в твоей логике на экране всегда 1 видео)
      currentVideo = next;

      // если у next есть продолжение, и в цепочке есть следующий шаг — значит мы шли глубже
      if (chain[next.id]) {
        builtStack.push({ videos: [next], index: 0 });
        parent = next.id;
        continue;
      }

      // дальше шагов нет — значит это финальная точка восстановления
      break;
    }

    if (currentVideo) {
      setStack(builtStack);
      setVideos([currentVideo]);
      setCurrentIndex(0);
      setSelectMode(false);

      // подгрузим варианты для текущего видео (если есть дети)
      if (currentVideo.hasChildren) {
        await loadVariantsFor(currentVideo.id);
      } else {
        setBranchOptions([]);
      }
    } else {
      await loadChildren(rootId);
    }
  }

  /* ===========================
     INITIAL LOAD
  =========================== */

  useEffect(() => {

    if (!nodeId) return;

    // ВАЖНО: при каждом входе в root восстанавливаем целиком
    setStack([]);
    setChosenMap({});
    setVideos([]);
    setCurrentIndex(0);
    setSelectMode(false);

    restoreFullChain(nodeId);

  }, [nodeId]);

  /* ===========================
     PLAY / PAUSE
  =========================== */

  function togglePlay() {

    const video =
      document.querySelector(".flow-video") as
      HTMLVideoElement | null;

    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  /* ===========================
     LIKE
  =========================== */

  async function likeVideo(id: string, index: number) {

    if (!isAuth) {
      setShowAuth(true);
      return;
    }

    setVideos(vs =>
      vs.map(v =>
        v.id === id
          ? {
              ...v,
              isLiked: !v.isLiked,
              likes: v.isLiked
                ? v.likes - 1
                : v.likes + 1
            }
          : v
      )
    );

    try {

      const res = await toggleLike(id);

      setVideos(vs =>
        vs.map(v =>
          v.id === id
            ? {
                ...v,
                isLiked: res.liked,
                likes: res.count
              }
            : v
        )
      );

      if (res.liked) {
        setLikeBurst(p => ({
          ...p,
          [index]: true
        }));

        setTimeout(() => {
          setLikeBurst(p => ({
            ...p,
            [index]: false
          }));
        }, 400);
      }

    } catch {
      setShowAuth(true);
    }
  }

  function openVariants() {
    setSelectMode(true);
  }

  /* ===========================
     NAVIGATION
  =========================== */

  function goBack() {

    if (selectMode) {
      setSelectMode(false);
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      return;
    }

    if (stack.length > 0) {
      const last = stack[stack.length - 1];

      setStack(s => s.slice(0, -1));
      setVideos(last.videos);
      setCurrentIndex(last.index);
      return;
    }

    navigate(-1);
  }

  async function goContinue() {

    const rootId = nodeId;
    const current = videos[currentIndex];

    if (!rootId || !current?.hasChildren) return;

    // 1) сначала пытаемся взять из chosenMap (внутри текущей сессии)
    const remembered = chosenMap[current.id];

    if (remembered) {

      // ВАЖНО: сохраняем шаг В ЛЮБОМ СЛУЧАЕ
      saveStep(rootId, current.id, remembered.id, false);

      setStack(prev => [
        ...prev,
        { videos, index: currentIndex }
      ]);

      setVideos([remembered]);
      setCurrentIndex(0);

      // чтобы варианты подгрузились сразу
      if (remembered.hasChildren) {
        await loadVariantsFor(remembered.id);
      } else {
        setBranchOptions([]);
      }

      return;
    }

    // 2) если chosenMap пуст, пробуем chain из sessionStorage (после возврата из Feed)
    const chain = readChain(rootId);
    const chainNextId = chain[current.id];

    if (chainNextId) {

      const res: FlowResponse = await getFlow(current.id);

      const nextFromChain =
        res.alternatives.find(v => v.id === chainNextId) ||
        (res.defaultVideo && res.defaultVideo.id === chainNextId ? res.defaultVideo : null);

      if (nextFromChain) {

        setStack(prev => [
          ...prev,
          { videos, index: currentIndex }
        ]);

        setVideos([nextFromChain]);
        setCurrentIndex(0);

        if (nextFromChain.hasChildren) {
          await loadVariantsFor(nextFromChain.id);
        } else {
          setBranchOptions([]);
        }

        return;
      }
    }

    // 3) иначе — идём по дефолту и ТОЖЕ сохраняем этот шаг
    const res: FlowResponse = await getFlow(current.id);

    setStack(prev => [
      ...prev,
      { videos, index: currentIndex }
    ]);

    if (res.defaultVideo) {

      // сохраняем дефолтный переход как часть выбранной цепочки
      saveStep(rootId, current.id, res.defaultVideo.id, false);

      setVideos([res.defaultVideo]);
      setCurrentIndex(0);

      if (res.defaultVideo.hasChildren) {
        await loadVariantsFor(res.defaultVideo.id);
      } else {
        setBranchOptions([]);
      }
    } else {
      setBranchOptions(res.alternatives);
    }
  }

  function chooseBranch(i: number) {

    const rootId = nodeId;
    const chosen = branchOptions[i];
    const parent = videos[currentIndex];

    if (!rootId || !chosen || !parent) return;

    // SAVE CHAIN + PRUNE TAIL (важно!)
    saveStep(rootId, parent.id, chosen.id, true);

    setChosenMap(prev => ({
      ...prev,
      [parent.id]: chosen
    }));

    setStack(prev => [
      ...prev,
      { videos, index: currentIndex }
    ]);

    setVideos([chosen]);
    setCurrentIndex(0);
    setSelectMode(false);
  }

  /* ===========================
     SWIPE
  =========================== */

  const swipeHandlers =
    useSwipeable({

      onSwipedRight: () => {
        if (selectMode) return;
        goContinue();
      },

      onSwipedLeft: () => {
        if (selectMode) return;
        goBack();
      },

      preventScrollOnSwipe: true,
      trackTouch: true,
      trackMouse: true,
      delta: 60
    });

  const v = videos[currentIndex];

  /* ===========================
     LOAD VARIANTS WHEN VIDEO CHANGES
  =========================== */

  useEffect(() => {

    if (!v || !v.hasChildren) {
      setBranchOptions([]);
      return;
    }

    getFlow(v.id).then((res: FlowResponse) => {

      setBranchOptions(res.alternatives);

      const map: { [id: string]: boolean } = {};
      for (const video of res.alternatives) {
        map[video.id] = video.hasChildren;
      }
      setCanContinueMap(map);
    });

  }, [v?.id]);

  /* ===========================
     UI
  =========================== */

  return (
    <div {...swipeHandlers} className="flow">

      {selectMode && (

        <div className="branch-overlay">

          <div className="branch-selector">

            <div className="branch-top-bar">

              <h3>Choose next path</h3>

              <div className="branch-actions">

                <button onClick={goBack}>
                  Back
                </button>

                <button
                  onClick={() =>
                    navigate("/feed")
                  }
                >
                  Feed
                </button>

              </div>

            </div>

            <div className="branch-grid">

              {branchOptions.map((b, i) => (

                <div
                  key={b.id}
                  className="branch-item"
                  onClick={() =>
                    chooseBranch(i)
                  }
                >

                  <video
                    src={`https://localhost:7247${b.url}`}
                    muted
                  />

                  <span>@{b.username}</span>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

      {v && !selectMode && (

        <div className="video-slide">

          {paused && (
            <div className="play-overlay">▶</div>
          )}

          <div className="flow-top-bar">

            <button
              className="feed-round-btn"
              onClick={() =>
                navigate("/feed")
              }
            >
              Feed
            </button>

          </div>

          <video
            className="flow-video"
            src={`https://localhost:7247${v.url}`}
            loop
            playsInline
            autoPlay
            onClick={togglePlay}
          />

          {likeBurst[currentIndex] && (
            <div className="like-burst">❤️</div>
          )}

          <div className="flow-user">

            <img
              className="flow-avatar"
              src={
                v.avatarUrl
                  ? `https://localhost:7247${v.avatarUrl}`
                  : "/avatar.png"
              }
            />

            <span className="flow-username">
              @{v.username}
            </span>

          </div>

          <div className="bottom-actions">

            <div className="bottom-right">

              <div>
                <button
                  disabled={v.username === username}
                  onClick={() =>
                    likeVideo(v.id, currentIndex)
                  }
                >
                  {v.isLiked ? "❤️" : "🤍"}
                </button>

                <span>{v.likes}</span>
              </div>

              <div>
                <button
                  onClick={() =>
                    setCommentsNodeId(v.id)
                  }
                >
                  💬
                </button>

                <span>{v.comments}</span>
              </div>

              <div>
                <button
                  onClick={() =>
                    navigate(`/create?parent=${v.id}`)
                  }
                >
                  ➕
                </button>

                <span>Create</span>
              </div>

              <div>
                <button onClick={goBack}>⬅</button>
                <span>Back</span>
              </div>

              {v.hasChildren && (
                <>
                  <div>
                    <button onClick={goContinue}>➜</button>
                    <span>Continue</span>
                  </div>

                  {branchOptions.length > 0 && (
                    <div>
                      <button onClick={openVariants}>☰</button>
                      <span>Variants</span>
                    </div>
                  )}
                </>
              )}

            </div>

          </div>

        </div>

      )}

      {showAuth && (
        <LoginRegisterModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}

      {commentsNodeId && (
        <CommentsModal
          nodeId={commentsNodeId}
          onClose={() =>
            setCommentsNodeId(null)
          }
        />
      )}

    </div>
  );
}
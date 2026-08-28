"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import {
  CoachForumPost,
  deleteCoachForumPost,
  fetchCoachForumPosts,
  publishCoachForumPost,
} from "@/lib/coach-forum";
import { getCurrentUser, getToken, isCoach } from "@/lib/auth";

function formatForumDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name?: string | null) {
  return (name || "Coach")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CoachForumPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<CoachForumPost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  async function loadPosts() {
    try {
      setLoading(true);
      setError("");
      setPosts(await fetchCoachForumPosts());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger le forum."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getCurrentUser();
      setCurrentUser(user);

      if (!getToken()) {
        router.replace("/auth/login?redirect=%2Fforum-coachs");
        return;
      }

      if (!isCoach(user)) {
        setError("Ce forum est réservé aux coachs Gotfit.");
        setLoading(false);
        return;
      }

      void loadPosts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = content.trim();

    if (!message || publishing) return;

    try {
      setPublishing(true);
      setError("");
      const post = await publishCoachForumPost(message);
      setPosts((current) => [post, ...current]);
      setContent("");
    } catch (publishError) {
      setError(getErrorMessage(publishError, "Impossible de publier le message."));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(postId: number) {
    if (deletingId !== null) return;

    try {
      setDeletingId(postId);
      setError("");
      await deleteCoachForumPost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le message."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-20 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-5xl">
          <section className="grid gap-6 rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
                <ShieldCheck size={16} /> Espace privé
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                Le forum des coachs.
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
                Échangez des conseils, des bonnes pratiques et des informations
                utiles avec les autres professionnels Gotfit.
              </p>
            </div>
            <UsersRound className="text-orange-400" size={54} />
          </section>

          {isCoach(currentUser) && (
            <form
              onSubmit={handlePublish}
              className="mt-7 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7"
            >
              <label htmlFor="coach-forum-message" className="text-lg font-black">
                Partager avec les coachs
              </label>
              <textarea
                id="coach-forum-message"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="Votre message…"
                className="mt-4 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-400"
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400">
                  {content.length}/3000
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || publishing}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Send size={17} />
                  )}
                  Publier
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <section className="mt-7 grid gap-4" aria-live="polite">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-[2rem] bg-white py-14 text-sm font-black text-orange-700">
                <Loader2 className="animate-spin" size={20} />
                Chargement des échanges…
              </div>
            ) : posts.length === 0 && isCoach(currentUser) ? (
              <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
                <MessageCircleMore className="mx-auto text-orange-500" size={38} />
                <h2 className="mt-4 text-xl font-black">Lancez la discussion</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Le premier message du forum peut être le vôtre.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-100 text-sm font-black text-orange-700">
                      {initials(post.author?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-black text-slate-950">
                            {post.author?.name || "Coach Gotfit"}
                          </h2>
                          <p className="text-xs font-bold text-slate-400">
                            {post.author?.coach_title || "Coach"} · {formatForumDate(post.created_at)}
                          </p>
                        </div>
                        {currentUser?.id === post.user_id && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(post.id)}
                            disabled={deletingId !== null}
                            aria-label="Supprimer ce message"
                            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            {deletingId === post.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Loader2,
  MessageCircleMore,
  Pin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ChannelNav, ForumAvatar, ForumTopLinks, MentionComposer, ReactionBar } from "@/components/forum/ForumUi";
import {
  type ForumChannel,
  type ForumDiscussion,
  type ForumPagination,
  type ForumReaction,
  createForumDiscussion,
  fetchForumChannels,
  fetchForumDiscussions,
  fetchForumUnreadCount,
  formatForumDate,
  getForumError,
  reactToForumDiscussion,
} from "@/lib/coach-forum";
import { getCurrentUser, getToken, isAdmin, isCoach } from "@/lib/auth";

export default function CoachForumPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [ready, setReady] = useState(false);
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [discussions, setDiscussions] = useState<ForumDiscussion[]>([]);
  const [pagination, setPagination] = useState<ForumPagination | null>(null);
  const [channel, setChannel] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mentionIds, setMentionIds] = useState<number[]>([]);
  const [composeChannelId, setComposeChannelId] = useState<number | null>(null);

  const admin = isAdmin(user);
  const allowed = isCoach(user) || admin;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = getCurrentUser();
      if (!getToken()) {
        router.replace("/auth/login?redirect=%2Fforum-coachs");
        return;
      }
      setUser(current);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!ready || !allowed) {
      return;
    }
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const [channelData, discussionData, count] = await Promise.all([
          fetchForumChannels(),
          fetchForumDiscussions({ channel, q: searchTerm, sort, page }),
          fetchForumUnreadCount(),
        ]);
        if (!active) return;
        setChannels(channelData);
        setDiscussions(discussionData.discussions);
        setPagination(discussionData.pagination);
        setUnreadCount(count);
        setComposeChannelId((current) => current || channelData.find((item) => item.slug === "general")?.id || channelData.find((item) => !item.is_official)?.id || null);
      } catch (loadError) {
        if (active) setError(getForumError(loadError, "Impossible de charger le forum."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [allowed, channel, page, ready, searchTerm, sort]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(query.trim());
  }

  async function submitDiscussion(event: FormEvent) {
    event.preventDefault();
    if (!composeChannelId || !title.trim() || !body.trim()) return;
    try {
      setCreating(true);
      setError("");
      const discussion = await createForumDiscussion({
        channel_id: composeChannelId,
        title: title.trim(),
        body: body.trim(),
        mention_ids: mentionIds,
      });
      router.push(`/forum-coachs/${discussion.id}`);
    } catch (createError) {
      setError(getForumError(createError, "Impossible de créer la discussion."));
    } finally {
      setCreating(false);
    }
  }

  async function react(discussionId: number, reaction: ForumReaction) {
    try {
      const updated = await reactToForumDiscussion(discussionId, reaction);
      setDiscussions((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reactionError) {
      setError(getForumError(reactionError, "Impossible d’enregistrer la réaction."));
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7f6f2] px-4 pb-24 pt-28 text-slate-950 sm:pt-32">
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-[2.25rem] bg-slate-950 px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.16)] sm:px-9 sm:py-10 lg:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.3),transparent_28%),radial-gradient(circle_at_65%_120%,rgba(255,255,255,0.08),transparent_34%)]" />
            <div className="absolute -right-8 top-10 hidden h-40 w-40 rounded-full border border-white/10 lg:block" />
            <div className="absolute -right-20 -top-16 hidden h-72 w-72 rounded-full border border-white/5 lg:block" />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-300">
                  <ShieldCheck size={16} /> Coachs validés uniquement
                </span>
                <h1 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl">Le collectif des coachs.</h1>
                <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
                  Un espace professionnel pour partager vos méthodes, demander conseil et suivre les actualités GotFit.
                </p>
              </div>
              <div className="grid gap-4">
                <ForumTopLinks unreadCount={unreadCount} admin={admin} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <strong className="block text-2xl font-black">{channels.length}</strong>
                    <span className="text-xs font-bold text-slate-400">Canaux thématiques</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <strong className="block text-2xl font-black">{pagination?.total || 0}</strong>
                    <span className="text-xs font-bold text-slate-400">Discussions</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {ready && !allowed && (
            <section className="mt-7 rounded-[2rem] border border-amber-200 bg-amber-50 p-7 text-amber-900">
              <h2 className="text-xl font-black">Accès professionnel requis</h2>
              <p className="mt-2 text-sm font-semibold leading-6">Le forum est réservé aux coachs dont le compte a été validé par GotFit.</p>
            </section>
          )}

          {allowed && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
                  <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    <UsersRound size={16} /> Canaux
                  </div>
                  <ChannelNav channels={channels} selected={channel} onSelect={(slug) => { setChannel(slug); setPage(1); }} />
                </div>
              </aside>

              <div className="min-w-0">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-3 xl:flex-row">
                  <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
                    <label className="relative min-w-0 flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <span className="sr-only">Rechercher une discussion</span>
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans le forum…" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <button type="submit" className="rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800">Chercher</button>
                  </form>
                  <select aria-label="Trier les discussions" value={sort} onChange={(event) => { setSort(event.target.value as "recent" | "popular"); setPage(1); }} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                    <option value="recent">Plus récentes</option>
                    <option value="popular">Plus actives</option>
                  </select>
                  <button type="button" onClick={() => setShowComposer((current) => !current)} aria-expanded={showComposer} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-sm font-black text-white shadow-[0_10px_25px_rgba(234,88,12,0.2)] transition hover:-translate-y-0.5 hover:bg-orange-700">
                    {showComposer ? <X size={17} /> : <Plus size={17} />} Nouvelle discussion
                  </button>
                  </div>
                </div>

                {showComposer && (
                  <form onSubmit={submitDiscussion} className="mt-4 overflow-hidden rounded-[1.75rem] border border-orange-200 bg-white shadow-[0_18px_50px_rgba(234,88,12,0.08)]">
                    <div className="flex items-center gap-3 border-b border-orange-100 bg-orange-50/60 px-5 py-4 sm:px-7"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-600 text-white"><Sparkles size={19} /></span><div><h2 className="text-lg font-black">Lancer une discussion</h2><p className="text-xs font-semibold text-slate-500">Partagez une question claire avec la communauté.</p></div></div>
                    <div className="p-5 sm:p-7">
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-black text-slate-700">
                        Canal
                        <select value={composeChannelId || ""} onChange={(event) => setComposeChannelId(Number(event.target.value))} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" required>
                          {channels.map((item) => <option key={item.id} value={item.id} disabled={item.is_official && !admin}>{item.name}{item.is_official ? " · officiel" : ""}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-black text-slate-700">
                        Titre
                        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" placeholder="Un titre précis" required />
                      </label>
                    </div>
                    <div className="mt-4">
                      <MentionComposer value={body} onChange={setBody} mentionIds={mentionIds} onMentionIdsChange={setMentionIds} placeholder="Décrivez votre question ou votre retour d’expérience…" />
                    </div>
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                      <button type="submit" disabled={creating || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                        {creating ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Publier
                      </button>
                    </div>
                    </div>
                  </form>
                )}

                {error && <div role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}

                <section className="mt-5 grid gap-3" aria-live="polite">
                  {loading ? (
                    <div className="flex items-center justify-center gap-3 rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700"><Loader2 className="animate-spin" size={20} /> Chargement des discussions…</div>
                  ) : !discussions.length ? (
                    <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm"><MessageCircleMore className="mx-auto text-orange-500" size={38} /><h2 className="mt-4 text-xl font-black">Aucune discussion trouvée</h2><p className="mt-2 text-sm font-semibold text-slate-500">Changez de canal ou lancez le premier échange.</p></div>
                  ) : discussions.map((discussion) => (
                    <article key={discussion.id} className="group/card rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
                      <div className="flex items-start gap-4">
                        <ForumAvatar author={discussion.author} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">{discussion.channel?.name || "Forum"}</span>
                            {discussion.is_pinned && <span className="inline-flex items-center gap-1 text-amber-700"><Pin size={13} /> Épinglée</span>}
                            {discussion.is_locked && <span className="inline-flex items-center gap-1 text-slate-500"><Lock size={13} /> Verrouillée</span>}
                          </div>
                          <Link href={`/forum-coachs/${discussion.id}`} className="group mt-3 block">
                            <h2 className="text-xl font-black tracking-tight text-slate-950 group-hover:text-orange-700 sm:text-2xl">{discussion.title}</h2>
                            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600">{discussion.body}</p>
                          </Link>
                          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-slate-400">{discussion.author?.name || "Coach GotFit"} · {formatForumDate(discussion.last_activity_at || discussion.created_at)} · {discussion.comments_count || 0} réponses · {discussion.views_count || 0} vues</p>
                            <div className="flex items-center gap-3">
                              <ReactionBar compact counts={discussion.reaction_counts} active={discussion.viewer_reaction} onReact={(reaction) => void react(discussion.id, reaction)} />
                              <Link href={`/forum-coachs/${discussion.id}`} aria-label="Ouvrir la discussion" className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white transition group-hover/card:bg-orange-600"><ArrowRight size={16} /></Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                {pagination && pagination.last_page > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black disabled:opacity-40">Précédent</button>
                    <span className="text-sm font-bold text-slate-500">Page {pagination.current_page} / {pagination.last_page}</span>
                    <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => current + 1)} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black disabled:opacity-40">Suivant</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

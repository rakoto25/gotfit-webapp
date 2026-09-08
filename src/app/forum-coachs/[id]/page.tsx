"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Flag, Loader2, Lock, LockOpen, MessageCircleReply, Pin, PinOff, Send, Trash2 } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ForumAvatar, MentionComposer, ReactionBar } from "@/components/forum/ForumUi";
import {
  type ForumComment,
  type ForumDiscussion,
  type ForumReaction,
  createForumComment,
  deleteForumComment,
  deleteForumDiscussion,
  fetchForumDiscussion,
  formatForumDate,
  getForumError,
  moderateForumDiscussion,
  reactToForumComment,
  reactToForumDiscussion,
  reportForumTarget,
  updateForumComment,
  updateForumDiscussion,
} from "@/lib/coach-forum";
import { getCurrentUser, getToken, isAdmin, isCoach } from "@/lib/auth";

type CommentNodeProps = {
  comment: ForumComment;
  depth?: number;
  locked: boolean;
  onReply: (comment: ForumComment) => void;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
};

function CommentNode({ comment, depth = 0, locked, onReply, onRefresh, onError }: CommentNodeProps) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!body.trim()) return;
    try {
      setBusy(true);
      await updateForumComment(comment.id, body.trim());
      setEditing(false);
      await onRefresh();
    } catch (error) {
      onError(getForumError(error, "Impossible de modifier la réponse."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer cette réponse ?")) return;
    try {
      setBusy(true);
      await deleteForumComment(comment.id);
      await onRefresh();
    } catch (error) {
      onError(getForumError(error, "Impossible de supprimer la réponse."));
    } finally {
      setBusy(false);
    }
  }

  async function react(type: ForumReaction) {
    try {
      await reactToForumComment(comment.id, type);
      await onRefresh();
    } catch (error) {
      onError(getForumError(error, "Impossible d’enregistrer la réaction."));
    }
  }

  async function report() {
    const details = window.prompt("Précisez brièvement le motif du signalement (facultatif) :") ?? "";
    try {
      await reportForumTarget("comments", comment.id, details);
      window.alert("Signalement transmis à l’équipe de modération.");
    } catch (error) {
      onError(getForumError(error, "Impossible d’envoyer le signalement."));
    }
  }

  return (
    <div className={depth ? "ml-3 border-l-2 border-orange-100 pl-3 sm:ml-8 sm:pl-5" : ""}>
      <article className="rounded-[1.7rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <ForumAvatar author={comment.author} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <strong className="block text-sm text-slate-950">{comment.author?.name || "Coach GotFit"}</strong>
                <span className="text-xs font-semibold text-slate-400">{comment.author?.coach_title || "Coach"} · {formatForumDate(comment.created_at)}</span>
              </div>
              {busy && <Loader2 className="animate-spin text-orange-600" size={16} />}
            </div>
            {editing ? (
              <div className="mt-3">
                <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} className="w-full rounded-2xl border border-orange-200 p-3 text-sm font-semibold outline-none focus:border-orange-400" />
                <div className="mt-2 flex gap-2"><button type="button" onClick={() => void save()} className="rounded-full bg-orange-600 px-4 py-2 text-xs font-black text-white">Enregistrer</button><button type="button" onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-xs font-black text-slate-500">Annuler</button></div>
              </div>
            ) : <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700">{comment.body}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <ReactionBar compact counts={comment.reaction_counts} active={comment.viewer_reaction} onReact={(type) => void react(type)} />
              {!locked && <button type="button" onClick={() => onReply(comment)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-slate-500 hover:bg-orange-50 hover:text-orange-700"><MessageCircleReply size={14} /> Répondre</button>}
              {comment.can_edit && !locked && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100"><Edit3 size={14} /> Modifier</button>}
              {comment.can_edit && <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"><Trash2 size={14} /> Supprimer</button>}
              <button type="button" onClick={() => void report()} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-slate-400 hover:bg-red-50 hover:text-red-600"><Flag size={14} /> Signaler</button>
            </div>
          </div>
        </div>
      </article>
      {comment.children?.length > 0 && <div className="mt-3 grid gap-3">{comment.children.map((child) => <CommentNode key={child.id} comment={child} depth={depth + 1} locked={locked} onReply={onReply} onRefresh={onRefresh} onError={onError} />)}</div>}
    </div>
  );
}

export default function ForumDiscussionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [discussion, setDiscussion] = useState<ForumDiscussion | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [mentionIds, setMentionIds] = useState<number[]>([]);
  const [replyTo, setReplyTo] = useState<ForumComment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    try {
      setError("");
      const data = await fetchForumDiscussion(id);
      setDiscussion(data.discussion);
      setComments(data.comments);
      setEditTitle(data.discussion.title);
      setEditBody(data.discussion.body);
    } catch (loadError) {
      setError(getForumError(loadError, "Impossible de charger la discussion."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = getCurrentUser();
      if (!getToken()) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(`/forum-coachs/${id}`)}`);
        return;
      }
      if (!isCoach(current) && !isAdmin(current)) {
        setError("Cette discussion est réservée aux coachs GotFit validés.");
        setLoading(false);
        return;
      }
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, load, router]);

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!discussion || !replyBody.trim()) return;
    try {
      setBusy(true);
      setError("");
      await createForumComment(discussion.id, { body: replyBody.trim(), parent_id: replyTo?.id, mention_ids: mentionIds });
      setReplyBody("");
      setReplyTo(null);
      setMentionIds([]);
      await load();
    } catch (replyError) {
      setError(getForumError(replyError, "Impossible de publier la réponse."));
    } finally {
      setBusy(false);
    }
  }

  async function saveDiscussion(event: FormEvent) {
    event.preventDefault();
    if (!discussion) return;
    try {
      setBusy(true);
      await updateForumDiscussion(discussion.id, { title: editTitle.trim(), body: editBody.trim() });
      setEditing(false);
      await load();
    } catch (updateError) {
      setError(getForumError(updateError, "Impossible de modifier la discussion."));
    } finally {
      setBusy(false);
    }
  }

  async function removeDiscussion() {
    if (!discussion || !window.confirm("Supprimer définitivement cette discussion ?")) return;
    try {
      setBusy(true);
      await deleteForumDiscussion(discussion.id);
      router.push("/forum-coachs");
    } catch (deleteError) {
      setError(getForumError(deleteError, "Impossible de supprimer la discussion."));
      setBusy(false);
    }
  }

  async function react(type: ForumReaction) {
    if (!discussion) return;
    try {
      setDiscussion(await reactToForumDiscussion(discussion.id, type));
    } catch (reactionError) {
      setError(getForumError(reactionError, "Impossible d’enregistrer la réaction."));
    }
  }

  async function reportDiscussion() {
    if (!discussion) return;
    const details = window.prompt("Précisez brièvement le motif du signalement (facultatif) :") ?? "";
    try {
      await reportForumTarget("discussions", discussion.id, details);
      window.alert("Signalement transmis à l’équipe de modération.");
    } catch (reportError) {
      setError(getForumError(reportError, "Impossible d’envoyer le signalement."));
    }
  }

  async function moderate(kind: "pin" | "lock") {
    if (!discussion) return;
    try {
      setBusy(true);
      await moderateForumDiscussion(discussion.id, kind === "pin" ? { is_pinned: !discussion.is_pinned } : { is_locked: !discussion.is_locked });
      await load();
    } catch (moderationError) {
      setError(getForumError(moderationError, "Impossible d’appliquer la modération."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fff7ed] px-4 pb-24 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-5xl">
          <Link href="/forum-coachs" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm hover:text-orange-700"><ArrowLeft size={16} /> Retour au forum</Link>
          {error && <div role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}
          {loading ? (
            <div className="mt-5 flex items-center justify-center gap-3 rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700"><Loader2 className="animate-spin" /> Chargement de la discussion…</div>
          ) : discussion && (
            <>
              <article className="mt-5 rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-xl sm:p-9">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded-full bg-orange-500 px-3 py-1.5">{discussion.channel?.name || "Forum"}</span>
                  {discussion.is_pinned && <span className="inline-flex items-center gap-1 text-amber-300"><Pin size={14} /> Épinglée</span>}
                  {discussion.is_locked && <span className="inline-flex items-center gap-1 text-slate-300"><Lock size={14} /> Verrouillée</span>}
                </div>
                {editing ? (
                  <form onSubmit={saveDiscussion} className="mt-5 grid gap-3">
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={180} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xl font-black outline-none focus:border-orange-400" required />
                    <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} rows={6} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold leading-7 outline-none focus:border-orange-400" required />
                    <div className="flex gap-2"><button disabled={busy} className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-black">Enregistrer</button><button type="button" onClick={() => setEditing(false)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-black">Annuler</button></div>
                  </form>
                ) : (
                  <>
                    <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{discussion.title}</h1>
                    <p className="mt-5 whitespace-pre-wrap break-words text-base font-medium leading-8 text-slate-200">{discussion.body}</p>
                  </>
                )}
                <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3"><ForumAvatar author={discussion.author} size="sm" /><span><strong className="block text-sm">{discussion.author?.name || "Coach GotFit"}</strong><small className="font-semibold text-slate-400">{formatForumDate(discussion.created_at)} · {discussion.views_count} vues</small></span></div>
                  <div className="flex flex-wrap gap-2">
                    {discussion.can_edit && (!discussion.is_locked || discussion.can_moderate) && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-black"><Edit3 size={14} /> Modifier</button>}
                    {discussion.can_edit && <button type="button" onClick={() => void removeDiscussion()} className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-2 text-xs font-black text-red-200"><Trash2 size={14} /> Supprimer</button>}
                    <button type="button" onClick={() => void reportDiscussion()} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-black"><Flag size={14} /> Signaler</button>
                  </div>
                </div>
              </article>

              <div className="mt-5 flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <ReactionBar counts={discussion.reaction_counts} active={discussion.viewer_reaction} onReact={(type) => void react(type)} />
                {discussion.can_moderate && <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void moderate("pin")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-black">{discussion.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}{discussion.is_pinned ? "Désépingler" : "Épingler"}</button><button type="button" disabled={busy} onClick={() => void moderate("lock")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-black">{discussion.is_locked ? <LockOpen size={14} /> : <Lock size={14} />}{discussion.is_locked ? "Déverrouiller" : "Verrouiller"}</button></div>}
              </div>

              {!discussion.is_locked ? (
                <form onSubmit={submitReply} className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Répondre</h2>{replyTo && <p className="mt-1 text-xs font-bold text-orange-700">Réponse à {replyTo.author?.name || "un coach"}</p>}</div>{replyTo && <button type="button" onClick={() => setReplyTo(null)} className="rounded-full px-3 py-2 text-xs font-black text-slate-500">Annuler</button>}</div>
                  <MentionComposer value={replyBody} onChange={setReplyBody} mentionIds={mentionIds} onMentionIdsChange={setMentionIds} placeholder="Partagez une réponse constructive…" />
                  <div className="mt-3 flex justify-end"><button disabled={busy || !replyBody.trim()} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Publier la réponse</button></div>
                </form>
              ) : <div className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-100 p-6 text-center text-sm font-black text-slate-600"><Lock className="mx-auto mb-2" /> Cette discussion est verrouillée par la modération.</div>}

              <section className="mt-8">
                <h2 className="mb-4 text-2xl font-black">{discussion.comments_count || comments.length} réponses</h2>
                <div className="grid gap-4">{comments.length ? comments.map((comment) => <CommentNode key={comment.id} comment={comment} locked={discussion.is_locked} onReply={(target) => { setReplyTo(target); document.getElementById("forum-reply")?.scrollIntoView({ behavior: "smooth" }); }} onRefresh={load} onError={setError} />) : <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-slate-500">Soyez le premier à répondre.</div>}</div>
              </section>
              <span id="forum-reply" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

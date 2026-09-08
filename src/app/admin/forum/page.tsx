"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleSlash2, Flag, Loader2, Plus, Power, Trash2 } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import {
  type ForumChannel,
  type ForumReport,
  createForumChannel,
  deleteForumChannel,
  fetchForumChannels,
  fetchForumReports,
  formatForumDate,
  getForumError,
  updateForumChannel,
  updateForumReport,
} from "@/lib/coach-forum";
import { getCurrentUser, getToken, isAdmin } from "@/lib/auth";

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  harassment: "Harcèlement",
  misinformation: "Information trompeuse",
  inappropriate: "Contenu inapproprié",
  other: "Autre motif",
};

export default function ForumAdminPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ea580c");

  const load = useCallback(async () => {
    try {
      setError("");
      const [channelData, reportData] = await Promise.all([fetchForumChannels(), fetchForumReports()]);
      setChannels(channelData);
      setReports(reportData);
    } catch (loadError) {
      setError(getForumError(loadError, "Impossible de charger la modération."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getCurrentUser();
      if (!getToken()) {
        router.replace("/auth/login?redirect=%2Fadmin%2Fforum");
        return;
      }
      if (!isAdmin(user)) {
        router.replace("/forum-coachs");
        return;
      }
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, router]);

  async function addChannel(event: FormEvent) {
    event.preventDefault();
    try {
      setBusyId(0);
      await createForumChannel({ name: name.trim(), description: description.trim(), color });
      setName("");
      setDescription("");
      await load();
    } catch (requestError) {
      setError(getForumError(requestError, "Impossible de créer le canal."));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleChannel(channel: ForumChannel) {
    try {
      setBusyId(channel.id);
      await updateForumChannel(channel.id, {
        name: channel.name,
        slug: channel.slug,
        description: channel.description,
        icon: channel.icon,
        color: channel.color,
        is_official: channel.is_official,
        is_active: !channel.is_active,
        sort_order: channel.sort_order,
      });
      await load();
    } catch (requestError) {
      setError(getForumError(requestError, "Impossible de modifier le canal."));
    } finally {
      setBusyId(null);
    }
  }

  async function removeChannel(channel: ForumChannel) {
    if (!window.confirm(`Supprimer le canal « ${channel.name} » ?`)) return;
    try {
      setBusyId(channel.id);
      await deleteForumChannel(channel.id);
      await load();
    } catch (requestError) {
      setError(getForumError(requestError, "Impossible de supprimer le canal."));
    } finally {
      setBusyId(null);
    }
  }

  async function resolveReport(report: ForumReport, status: "resolved" | "dismissed") {
    try {
      setBusyId(report.id);
      await updateForumReport(report.id, status, status === "resolved" ? "Signalement traité depuis l’interface de modération." : "Signalement classé sans suite.");
      await load();
    } catch (requestError) {
      setError(getForumError(requestError, "Impossible de traiter le signalement."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fff7ed] px-4 pb-24 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link href="/forum-coachs" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm"><ArrowLeft size={16} /> Retour au forum</Link>
          <section className="mt-5 rounded-[2.5rem] bg-slate-950 p-7 text-white sm:p-10">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300"><Flag size={16} /> Administration GotFit</span>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Modération du forum</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">Gérez les canaux, traitez les signalements, puis épinglez ou verrouillez directement depuis la page de chaque discussion.</p>
          </section>
          {error && <div role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          {loading ? <div className="mt-5 flex items-center justify-center gap-2 rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700"><Loader2 className="animate-spin" /> Chargement de la modération…</div> : (
            <div className="mt-7 grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
              <section>
                <h2 className="text-2xl font-black">Canaux thématiques</h2>
                <form onSubmit={addChannel} className="mt-4 rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-black"><Plus size={17} className="text-orange-600" /> Nouveau canal</div>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom du canal" maxLength={100} required className="mt-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-orange-400" />
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" maxLength={500} rows={3} className="mt-3 w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-orange-400" />
                  <div className="mt-3 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-black text-slate-500">Couleur <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-9 w-12 rounded border-0" /></label><button disabled={busyId === 0} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white">{busyId === 0 && <Loader2 className="animate-spin" size={15} />} Créer</button></div>
                </form>
                <div className="mt-4 grid gap-3">{channels.map((channel) => (
                  <article key={channel.id} className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: channel.color || "#ea580c" }} /><div><strong className="block text-sm">{channel.name}</strong><span className="text-xs font-semibold text-slate-400">{channel.discussions_count || 0} discussion(s){channel.is_official ? " · officiel" : ""}</span></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${channel.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{channel.is_active ? "Actif" : "Masqué"}</span></div>
                    <div className="mt-3 flex gap-2"><button type="button" disabled={busyId === channel.id || channel.is_official} onClick={() => void toggleChannel(channel)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-black disabled:opacity-40"><Power size={13} /> {channel.is_active ? "Masquer" : "Activer"}</button><button type="button" disabled={busyId === channel.id || channel.is_official || Boolean(channel.discussions_count)} onClick={() => void removeChannel(channel)} className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-2 text-xs font-black text-red-600 disabled:opacity-40"><Trash2 size={13} /> Supprimer</button></div>
                  </article>
                ))}</div>
              </section>
              <section>
                <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Signalements en attente</h2><span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black text-orange-800">{reports.length}</span></div>
                <div className="mt-4 grid gap-4">{reports.length ? reports.map((report) => {
                  const discussionId = report.discussion?.id || report.comment?.discussion_id;
                  return (
                    <article key={report.id} className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">{reasonLabels[report.reason] || report.reason}</span><h3 className="mt-3 text-lg font-black">{report.discussion?.title || "Réponse signalée"}</h3><p className="mt-1 text-xs font-semibold text-slate-400">Signalé par {report.reporter?.name || "un coach"} · {formatForumDate(report.created_at)}</p></div>{discussionId && <Link href={`/forum-coachs/${discussionId}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Voir le contenu</Link>}</div>
                      {report.comment?.body && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">{report.comment.body}</p>}
                      {report.details && <p className="mt-3 text-sm font-semibold leading-6 text-slate-600"><strong>Motif détaillé :</strong> {report.details}</p>}
                      <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busyId === report.id} onClick={() => void resolveReport(report, "resolved")} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white"><CheckCircle2 size={14} /> Marquer traité</button><button type="button" disabled={busyId === report.id} onClick={() => void resolveReport(report, "dismissed")} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600"><CircleSlash2 size={14} /> Classer sans suite</button></div>
                    </article>
                  );
                }) : <div className="rounded-[2rem] bg-white p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={36} /><h3 className="mt-3 text-xl font-black">Aucun signalement en attente</h3><p className="mt-2 text-sm font-semibold text-slate-500">La file de modération est à jour.</p></div>}</div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

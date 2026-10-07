"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MessageCircleMore,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  UserX,
  WalletCards,
  XCircle,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentUser, getToken } from "@/lib/auth";
import {
  cancelPackSession,
  completePackSession,
  declarePackSessionNoShow,
  disputePackSession,
  fetchPacks,
  fetchWallet,
  formatMinorMoney,
  schedulePackSession,
  validatePackSession,
  type Pack,
  type PackSession,
  type Wallet,
  type WalletTransaction,
} from "@/lib/marketplace";

const statusLabels: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  disputed: "Contesté",
  refunded: "Remboursé",
  partially_refunded: "Remboursé partiellement",
  pending: "Disponible",
  awaiting_client_confirmation: "À valider par le client",
  validated: "Validée",
  paid: "Coach payé",
  cancelled: "Annulée",
};

const transactionLabels: Record<string, string> = {
  cashback_credit: "Cashback 1 %",
  cashback_reversal: "Cashback annulé",
  purchase_debit: "Utilisation sur un achat",
  purchase_release: "Réservation de cagnotte libérée",
  purchase_refund: "Remboursement cagnotte",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Non planifiée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function localDateTimeMinimum() {
  const date = new Date(Date.now() + 60_000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function sessionTone(status: string) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "disputed") return "border-red-200 bg-red-50 text-red-800";
  if (status === "awaiting_client_confirmation") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "cancelled") return "border-slate-200 bg-slate-100 text-slate-500";
  return "border-orange-100 bg-orange-50 text-slate-800";
}

function PacksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [scheduleValues, setScheduleValues] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const actionsInFlight = useRef(new Set<number>());
  const highlightedPackId = Number(searchParams.get("pack") || 0) || null;

  const sortedPacks = useMemo(() => {
    if (!highlightedPackId) return packs;
    return [...packs].sort((a, b) => Number(b.id === highlightedPackId) - Number(a.id === highlightedPackId));
  }, [highlightedPackId, packs]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [packItems, walletResult] = await Promise.all([fetchPacks(), fetchWallet()]);
      setPacks(packItems);
      setWallet(walletResult.wallet);
      setTransactions(walletResult.transactions);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger vos packs."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getToken()) {
        router.replace(`/auth/login?redirect=${encodeURIComponent("/packs")}`);
        return;
      }
      setCurrentUserId(getCurrentUser()?.id || null);
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  async function runAction(sessionId: number, action: () => Promise<{ message?: string }>, fallback: string) {
    if (actionsInFlight.current.has(sessionId)) return;

    try {
      actionsInFlight.current.add(sessionId);
      setActionLoadingIds((ids) => new Set(ids).add(sessionId));
      setError("");
      setSuccess("");
      const result = await action();
      setSuccess(result.message || fallback);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de modifier cette séance."));
    } finally {
      actionsInFlight.current.delete(sessionId);
      setActionLoadingIds((ids) => {
        const nextIds = new Set(ids);
        nextIds.delete(sessionId);
        return nextIds;
      });
    }
  }

  function handleSchedule(session: PackSession) {
    const value = scheduleValues[session.id];
    if (!value) {
      setError("Choisissez la date et l’heure de la séance.");
      return;
    }
    void runAction(
      session.id,
      () => schedulePackSession(session.id, new Date(value).toISOString()),
      "Séance planifiée."
    );
  }

  function handleCancel(session: PackSession) {
    const reason = window.prompt("Motif de l’annulation (optionnel) :", "") ?? undefined;
    if (reason === undefined) return;
    void runAction(session.id, () => cancelPackSession(session.id, reason), "Séance annulée.");
  }

  function handleDispute(session: PackSession) {
    const reason = window.prompt("Expliquez la contestation (10 caractères minimum) :", "");
    if (reason === null) return;
    if (reason.trim().length < 10) {
      setError("Le motif de contestation doit contenir au moins 10 caractères.");
      return;
    }
    void runAction(session.id, () => disputePackSession(session.id, reason.trim()), "Contestation enregistrée.");
  }

  function handleNoShow(session: PackSession) {
    if (!window.confirm("Confirmer l’absence du client ? Cette action peut déclencher le paiement de la séance au coach selon les règles GotFit.")) return;
    const reason = window.prompt("Motif de l’absence (optionnel) :", "Client absent") ?? undefined;
    if (reason === undefined) return;
    void runAction(session.id, () => declarePackSessionNoShow(session.id, reason), "Absence déclarée.");
  }

  function handleValidation(session: PackSession) {
    if (!window.confirm("Valider cette séance réalisée ? Le reversement au coach sera déclenché et cette action ne pourra pas être répétée.")) return;
    void runAction(session.id, () => validatePackSession(session.id), "Séance validée; le reversement coach est lancé.");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-24 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-700 shadow-sm"><PackageCheck size={16} /> Packs GotFit</span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Mes séances et paiements.</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Planification, validation, contestation et versement coach séance par séance.</p>
            </div>
            <button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-orange-700 shadow-sm"><RefreshCw size={17} /> Actualiser</button>
          </div>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div>
              {(error || success) && <div className={`mb-5 rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{error || success}</div>}

              {loading ? (
                <div className="flex items-center justify-center rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700 shadow-sm"><Loader2 className="mr-3 animate-spin" size={20} /> Chargement…</div>
              ) : sortedPacks.length === 0 ? (
                <div className="rounded-[2.5rem] bg-white p-9 text-center shadow-sm"><PackageCheck className="mx-auto text-orange-600" size={48} /><h2 className="mt-4 text-2xl font-black">Aucun pack actif</h2><p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-slate-500">Les packs achetés depuis une offre dans le chat apparaîtront ici.</p><Link href="/messages" className="mt-6 inline-flex rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white">Ouvrir la messagerie</Link></div>
              ) : (
                <div className="grid gap-6">
                  {sortedPacks.map((pack) => {
                    const isCoach = currentUserId === pack.coach_id;
                    const otherUser = isCoach ? pack.client : pack.coach;
                    const paidSessions = (pack.sessions || []).filter((session) => session.status === "paid").length;

                    return (
                      <article key={pack.id} className={`rounded-[2.5rem] bg-white p-6 shadow-[0_20px_70px_rgba(249,115,22,0.1)] sm:p-8 ${pack.id === highlightedPackId ? "ring-2 ring-orange-500" : ""}`}>
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div>
                            <span className="text-xs font-black uppercase tracking-[0.15em] text-orange-700">Pack #{pack.id} · {statusLabels[pack.status] || pack.status}</span>
                            <h2 className="mt-2 text-2xl font-black">{pack.offer?.title || `${pack.session_count} séances de coaching`}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-500">{isCoach ? "Client" : "Coach"} : {otherUser?.name || "Utilisateur GotFit"}</p>
                          </div>
                          <div className="text-right"><strong className="block text-2xl font-black">{formatMinorMoney(pack.amount_total, pack.currency)}</strong><span className="text-xs font-bold text-slate-400">{paidSessions}/{pack.session_count} séance{pack.session_count > 1 ? "s" : ""} payée{paidSessions > 1 ? "s" : ""}</span></div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pack.session_count ? (paidSessions / pack.session_count) * 100 : 0}%` }} /></div>

                        <div className="mt-6 grid gap-4">
                          {(pack.sessions || []).map((session) => {
                            const busy = actionLoadingIds.has(session.id);
                            const scheduledTime = session.scheduled_at ? new Date(session.scheduled_at).getTime() : null;
                            const sessionPassed = scheduledTime !== null && scheduledTime <= Date.now();
                            const noShowCanBeRequested = sessionPassed;

                            return (
                              <section key={session.id} className={`rounded-[1.7rem] border p-5 ${sessionTone(session.status)}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div><span className="text-xs font-black uppercase tracking-[0.13em]">Séance {session.sequence}</span><strong className="mt-1 block text-lg font-black">{statusLabels[session.status] || session.status}</strong><span className="mt-1 inline-flex items-center gap-2 text-xs font-bold opacity-75"><CalendarClock size={14} />{formatDateTime(session.scheduled_at)}</span></div>
                                  {isCoach && <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-black">Net coach : {formatMinorMoney(session.amount_due, pack.currency)}</span>}
                                </div>

                                {session.dispute_reason && <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-xs font-bold">Motif : {session.dispute_reason}</p>}
                                {session.cancellations?.[0] && <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-xs font-bold">Dernier événement : {session.cancellations[0].kind === "no_show" ? "absence" : "annulation"}{session.cancellations[0].is_late ? " tardive" : ""} — {session.cancellations[0].reason || "sans motif"}</p>}

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {isCoach && session.status === "pending" && !session.scheduled_at && (
                                    <><input type="datetime-local" min={localDateTimeMinimum()} value={scheduleValues[session.id] || ""} onChange={(event) => setScheduleValues((values) => ({ ...values, [session.id]: event.target.value }))} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" /><button type="button" onClick={() => handleSchedule(session)} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-black text-white"><Clock3 size={15} /> Planifier</button></>
                                  )}
                                  {isCoach && session.status === "pending" && session.scheduled_at && sessionPassed && <button type="button" onClick={() => void runAction(session.id, () => completePackSession(session.id), "Séance déclarée réalisée.")} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"><CheckCircle2 size={15} /> Déclarer réalisée</button>}
                                  {isCoach && session.status === "pending" && session.scheduled_at && noShowCanBeRequested && <button type="button" onClick={() => handleNoShow(session)} disabled={busy} title="L’API applique le délai de grâce configuré par GotFit." className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700"><UserX size={15} /> Client absent</button>}
                                  {!isCoach && session.status === "awaiting_client_confirmation" && <button type="button" onClick={() => handleValidation(session)} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"><CheckCircle2 size={15} /> Valider la séance</button>}
                                  {!isCoach && ["awaiting_client_confirmation", "validated"].includes(session.status) && !session.stripe_transfer_id && <button type="button" onClick={() => handleDispute(session)} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700"><ShieldAlert size={15} /> Contester</button>}
                                  {session.status === "pending" && session.scheduled_at && <button type="button" onClick={() => handleCancel(session)} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700"><XCircle size={15} /> Annuler</button>}
                                  {busy && <Loader2 className="animate-spin" size={18} />}
                                </div>
                              </section>
                            );
                          })}
                        </div>

                        {pack.offer?.conversation_id && <Link href={`/messages?conversation_id=${pack.offer.conversation_id}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"><MessageCircleMore size={17} /> Ouvrir la conversation</Link>}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="h-fit rounded-[2.5rem] bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-orange-700"><WalletCards size={24} /></span><div><span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Ma cagnotte</span><strong className="block text-3xl font-black">{formatMinorMoney(wallet?.balance || 0, wallet?.currency || "eur")}</strong></div></div>
              <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Le cashback de 1 % est crédité après confirmation Stripe et utilisable sur une prochaine offre.</p>
              <div className="mt-6 border-t border-slate-100 pt-5"><h2 className="font-black">Derniers mouvements</h2><div className="mt-3 grid gap-3">{transactions.length === 0 ? <p className="text-sm font-semibold text-slate-400">Aucun mouvement.</p> : transactions.slice(0, 8).map((transaction) => { const positive = ["cashback_credit", "purchase_release", "purchase_refund"].includes(transaction.type); return <div key={transaction.id} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex gap-2"><CircleDollarSign className={positive ? "text-emerald-600" : "text-orange-600"} size={17} /><div><strong className="block text-xs font-black">{transactionLabels[transaction.type] || transaction.type}</strong><span className="text-[10px] font-bold text-slate-400">{formatDateTime(transaction.created_at)}</span></div></div><strong className={`text-xs font-black ${positive ? "text-emerald-700" : "text-slate-700"}`}>{positive ? "+" : "−"}{formatMinorMoney(transaction.amount, wallet?.currency || "eur")}</strong></div>; })}</div></div>
              <div className="mt-6 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={16} />Une annulation client à moins de 24 h ou une absence peut consommer la séance selon les règles GotFit.</div>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function PacksPage() {
  return <Suspense fallback={<><Header /><main className="flex min-h-screen items-center justify-center bg-[#FFF7ED]"><Loader2 className="animate-spin text-orange-600" size={28} /></main></>}><PacksContent /></Suspense>;
}

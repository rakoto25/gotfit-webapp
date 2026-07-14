"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  Users,
  Video,
  X,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentUser, getToken, hasRole } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/marketplace";
import {
  endVisioSession,
  fetchVisioSession,
  getParticipantStatusLabel,
  getPaymentStatusLabel,
  getVisioStatusLabel,
  joinVisioSession,
  markVisioParticipantPaid,
  reserveVisioSession,
  startVisioSession,
  type VisioJoinPayload,
  type VisioParticipant,
  type VisioSession,
} from "@/lib/visio";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getStatusClass(status?: string | null) {
  if (status === "live" || status === "paid" || status === "joined") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "confirmed" || status === "reserved" || status === "pending") {
    return "border-orange-100 bg-orange-50 text-orange-700";
  }

  if (status === "cancelled" || status === "no_show" || status === "unpaid") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function isLiveKitJoinPayload(payload?: VisioJoinPayload | null) {
  const provider = payload?.provider?.toLowerCase() || "";
  const serverUrl = payload?.server_url?.toLowerCase() || "";

  return (
    Boolean(payload?.token) &&
    Boolean(payload?.server_url) &&
    (provider === "livekit" ||
      serverUrl.startsWith("wss://") ||
      serverUrl.includes("livekit.cloud"))
  );
}

export default function VisioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const [session, setSession] = useState<VisioSession | null>(null);
  const [joinData, setJoinData] = useState<VisioJoinPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  const user = useMemo(() => getCurrentUser(), []);
  const isClient = hasRole(user, "client");
  const isCoach = Boolean(user && session && Number(session.coach_id) === Number(user.id));
  const isParticipant = Boolean(
    user &&
      session?.participants?.some(
        (item) =>
          Number(item.user_id) === Number(user.id) &&
          item.role === "participant" &&
          !["cancelled", "no_show"].includes(item.status)
      )
  );
  const currentParticipant = session?.participants?.find(
    (item) => user && Number(item.user_id) === Number(user.id)
  );
  const clientParticipants =
    session?.participants?.filter((item) => item.role === "participant") || [];

  async function loadSession() {
    try {
      setLoading(true);
      setError("");

      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }

      setSession(await fetchVisioSession(sessionId));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger la séance visio."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSession();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function runAction(label: string, callback: () => Promise<void>) {
    try {
      setActionLoading(label);
      setError("");
      setSuccess("");
      await callback();
    } catch (err) {
      setError(getErrorMessage(err, "Action impossible pour le moment."));
    } finally {
      setActionLoading("");
    }
  }

  async function handleReserve() {
    await runAction("reserve", async () => {
      const payload = await reserveVisioSession(sessionId);
      setSuccess(
        payload.participant?.payment_status === "paid"
          ? "Inscription confirmée."
          : "Place réservée. Le paiement devra être confirmé pour rejoindre la visio."
      );
      await loadSession();
    });
  }

  async function handleMarkPaid(participantId: number) {
    await runAction(`paid-${participantId}`, async () => {
      await markVisioParticipantPaid(sessionId, participantId);
      setSuccess("Paiement participant validé pour le test.");
      await loadSession();
    });
  }

  async function handleStart() {
    await runAction("start", async () => {
      const updated = await startVisioSession(sessionId);
      if (updated) setSession(updated);

      const payload = await joinVisioSession(sessionId);
      setJoinData(payload);
      setIsRoomOpen(isLiveKitJoinPayload(payload));
      setSuccess("Séance visio démarrée. La salle vidéo est prête.");

      await loadSession();
    });
  }

  async function handleEnd() {
    await runAction("end", async () => {
      const updated = await endVisioSession(sessionId);
      if (updated) setSession(updated);
      setJoinData(null);
      setIsRoomOpen(false);
      setSuccess("Séance visio terminée.");
      await loadSession();
    });
  }

  async function handleJoin() {
    await runAction("join", async () => {
      const payload = await joinVisioSession(sessionId);
      setJoinData(payload);
      setIsRoomOpen(isLiveKitJoinPayload(payload));
      setSuccess("Accès visio autorisé. Vous pouvez rejoindre la salle.");

      await loadSession();
    });
  }

  const canReserve =
    isClient &&
    session &&
    !isCoach &&
    !isParticipant &&
    ["open", "confirmed"].includes(session.status);

  const canJoin =
    session &&
    (isCoach || currentParticipant?.payment_status === "paid") &&
    ["confirmed", "live"].includes(session.status);

  const canOpenLiveKitRoom = isLiveKitJoinPayload(joinData);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-36 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/visio"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
          >
            <ArrowLeft size={17} />
            Retour aux visios
          </Link>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              <X className="mt-0.5 shrink-0" size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700 shadow-sm">
              <Loader2 className="mr-3 animate-spin" size={20} />
              Chargement de la séance visio...
            </div>
          ) : !session ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
              <AlertTriangle className="mx-auto mb-4 text-orange-600" size={34} />
              <h1 className="text-2xl font-black">Séance introuvable</h1>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr]">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm md:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                      <Video size={15} />
                      Séance visio
                    </span>
                    <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                      {session.title}
                    </h1>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-black ${getStatusClass(session.status)}`}
                  >
                    {getVisioStatusLabel(session.status)}
                  </span>
                </div>

                <p className="max-w-3xl text-base font-semibold leading-8 text-slate-600">
                  {session.description || "Séance visio GotFit."}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] bg-orange-50 p-5">
                    <Clock className="mb-3 text-orange-700" size={22} />
                    <strong className="block text-lg font-black">
                      {formatDate(session.start_at)}
                    </strong>
                    <span className="text-xs font-bold text-slate-500">
                      Date de séance
                    </span>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <Clock className="mb-3 text-orange-700" size={22} />
                    <strong className="block text-lg font-black">
                      {session.duration_minutes} min
                    </strong>
                    <span className="text-xs font-bold text-slate-500">Durée</span>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <Users className="mb-3 text-orange-700" size={22} />
                    <strong className="block text-lg font-black">
                      {session.paid_participants_count || 0}/
                      {session.min_participants}
                    </strong>
                    <span className="text-xs font-bold text-slate-500">
                      Minimum validé
                    </span>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <CreditCard className="mb-3 text-orange-700" size={22} />
                    <strong className="block text-lg font-black">
                      {formatMoney(session.price, session.currency || "EUR")}
                    </strong>
                    <span className="text-xs font-bold text-slate-500">Prix</span>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {canReserve && (
                    <button
                      type="button"
                      onClick={handleReserve}
                      disabled={actionLoading === "reserve"}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:opacity-70"
                    >
                      {actionLoading === "reserve" ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <Users size={17} />
                      )}
                      Réserver ma place
                    </button>
                  )}

                  {isCoach && (
                    <>
                      <button
                        type="button"
                        onClick={handleStart}
                        disabled={actionLoading === "start" || session.status === "live"}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-70"
                      >
                        {actionLoading === "start" ? (
                          <Loader2 className="animate-spin" size={17} />
                        ) : (
                          <Play size={17} />
                        )}
                        Démarrer
                      </button>

                      {session.status === "live" && (
                        <button
                          type="button"
                          onClick={handleEnd}
                          disabled={actionLoading === "end"}
                          className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-6 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 disabled:opacity-70"
                        >
                          {actionLoading === "end" ? (
                            <Loader2 className="animate-spin" size={17} />
                          ) : (
                            <Square size={17} />
                          )}
                          Terminer
                        </button>
                      )}
                    </>
                  )}

                  {canJoin && (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={actionLoading === "join"}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-70"
                    >
                      {actionLoading === "join" ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <Video size={17} />
                      )}
                      Rejoindre la visio
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={loadSession}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    <RefreshCw size={17} />
                    Actualiser
                  </button>
                </div>

                {session.status === "open" && (
                  <div className="mt-6 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
                    La séance est ouverte, mais elle ne peut pas démarrer tant que{" "}
                    {session.min_participants} participants clients ne sont pas
                    validés/payés.
                  </div>
                )}

                {joinData && (
                  <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-emerald-950">
                          Accès visio autorisé
                        </h2>
                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          {canOpenLiveKitRoom
                            ? "La salle est prête. Autorisez la caméra et le micro pour rejoindre la séance."
                            : "La séance est prête, mais la salle vidéo n'a pas retourné une configuration valide."}
                        </p>
                      </div>

                      {canOpenLiveKitRoom && (
                        <button
                          type="button"
                          onClick={() => setIsRoomOpen((value) => !value)}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white"
                        >
                          {isRoomOpen ? "Masquer la salle" : "Afficher la salle"}
                          <Video size={16} />
                        </button>
                      )}
                    </div>

                    {canOpenLiveKitRoom && isRoomOpen ? (
                      <div className="overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-slate-950">
                        <LiveKitRoom
                          serverUrl={joinData.server_url || undefined}
                          token={joinData.token || undefined}
                          connect={true}
                          video={true}
                          audio={true}
                          onDisconnected={() => setIsRoomOpen(false)}
                          data-lk-theme="default"
                          style={{ height: "68vh", minHeight: 520 }}
                        >
                          <VideoConference />
                        </LiveKitRoom>
                      </div>
                    ) : (
                      <div className="rounded-[1.5rem] bg-white p-5 text-sm font-bold leading-7 text-emerald-800">
                        Cliquez sur “Afficher la salle” pour ouvrir la visio dans
                        cette page. Les informations techniques de connexion ne
                        sont pas affichées aux utilisateurs.
                      </div>
                    )}
                  </div>
                )}
              </section>

              <aside className="grid gap-5 self-start">
                <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                    <ShieldCheck className="text-orange-700" size={22} />
                    Coach
                  </h2>
                  <strong className="block text-lg font-black">
                    {session.coach?.name || "Coach GotFit"}
                  </strong>
                  <span className="mt-1 block text-sm font-semibold text-slate-500">
                    {session.coach?.email || "Email non renseigné"}
                  </span>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-xl font-black">
                      <Users className="text-orange-700" size={22} />
                      Participants
                    </h2>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                      {clientParticipants.length}
                    </span>
                  </div>

                  {clientParticipants.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                      Aucun participant client pour le moment.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {clientParticipants.map((participant: VisioParticipant) => (
                        <div
                          key={participant.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <strong className="block text-sm font-black">
                            {participant.user?.name || `Client #${participant.user_id}`}
                          </strong>
                          <span className="mt-1 block text-xs font-bold text-slate-500">
                            {participant.user?.email || "Email non renseigné"}
                          </span>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-black ${getStatusClass(participant.status)}`}
                            >
                              {getParticipantStatusLabel(participant.status)}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-black ${getStatusClass(participant.payment_status)}`}
                            >
                              {getPaymentStatusLabel(participant.payment_status)}
                            </span>
                          </div>

                          {isCoach && participant.payment_status !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(participant.id)}
                              disabled={actionLoading === `paid-${participant.id}`}
                              className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
                            >
                              {actionLoading === `paid-${participant.id}` ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <CreditCard size={14} />
                              )}
                              Valider paiement test
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
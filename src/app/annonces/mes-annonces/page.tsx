"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  Clock3,
  Edit3,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCurrentUser, getToken, hasRole } from "@/lib/auth";
import {
  type Annonce,
  deleteAnnonce,
  fetchMyAnnonces,
  formatMoney,
  getAnnonceDescription,
  getAnnonceTitle,
  getMaxParticipants,
} from "@/lib/marketplace";

const statusLabels: Record<string, string> = {
  valide: "Publiée",
  approved: "Publiée",
  active: "Publiée",
  en_attente: "En validation",
  pending: "En validation",
  brouillon: "Brouillon",
  refuse: "Refusée",
  rejected: "Refusée",
};

function statusLabel(value?: string | null) {
  const key = String(value || "en_attente").toLowerCase();
  return statusLabels[key] || value || "En validation";
}

function isCoachOffer(annonce: Annonce) {
  return annonce.announcement_type === "coach_service";
}

export default function MyAnnouncementsPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coachAccount, setCoachAccount] = useState(false);

  const createHref = coachAccount
    ? "/intervenant/annonces/nouvelle"
    : "/annonces/nouvelle";

  const load = useCallback(async () => {
    if (!getToken()) {
      window.location.assign(
        `/auth/login?redirect=${encodeURIComponent("/annonces/mes-annonces")}`
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnnonces(await fetchMyAnnonces());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger vos annonces."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCoachAccount(hasRole(getCurrentUser(), "intervenant"));
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function removeAnnonce(annonce: Annonce) {
    if (
      !window.confirm(
        `Supprimer définitivement l’annonce « ${getAnnonceTitle(annonce)} » ?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(annonce.id);
      setError("");
      setSuccess("");
      await deleteAnnonce(annonce.id);
      setAnnonces((items) => items.filter((item) => item.id !== annonce.id));
      setSuccess("Annonce supprimée avec succès.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Impossible de supprimer l’annonce."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--canvas)] px-4 pb-20 pt-32 text-[var(--ink)] sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href={coachAccount ? "/intervenant/dashboard" : "/client/dashboard"}
                className="inline-flex items-center gap-2 text-sm font-black text-[var(--brand-strong)]"
              >
                <ArrowLeft size={17} /> Retour à mon espace
              </Link>
              <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-strong)]">
                <Megaphone size={15} /> Gestion des annonces
              </span>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Mes annonces
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                Consultez le statut de vos publications et modifiez-les. Toute modification
                renvoie l’annonce en validation avant sa nouvelle publication.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void load()}
                className="gotfit-button bg-white px-5"
              >
                <RefreshCw size={17} /> Actualiser
              </button>
              <Link href={createHref} className="gotfit-button gotfit-button-brand px-5">
                <Plus size={17} /> Nouvelle annonce
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              <X className="mt-0.5 shrink-0" size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex items-center justify-center rounded-[2rem] bg-white py-16 text-sm font-black text-[var(--brand-strong)] shadow-sm">
              <Loader2 className="mr-3 animate-spin" size={20} /> Chargement de vos annonces...
            </div>
          ) : annonces.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {annonces.map((annonce) => (
                <article
                  key={annonce.id}
                  className="flex min-h-[300px] flex-col rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(21,33,27,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                        {statusLabel(annonce.status)}
                      </span>
                      <h2 className="mt-4 text-xl font-black tracking-tight">
                        {getAnnonceTitle(annonce)}
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
                      {isCoachOffer(annonce)
                        ? formatMoney(annonce.price)
                        : Number(annonce.price || 0) > 0
                          ? `Budget ${formatMoney(annonce.price)}`
                          : "Budget à discuter"}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-slate-500">
                    {getAnnonceDescription(annonce) || "Aucune description."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                      <CircleDollarSign size={14} />
                      {isCoachOffer(annonce) ? "Tarif coach" : "Demande client"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                      <Clock3 size={14} /> {annonce.duration || 60} min
                    </span>
                    {isCoachOffer(annonce) && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                        <Users size={14} /> {getMaxParticipants(annonce)} coaché{getMaxParticipants(annonce) > 1 ? "s" : ""} max
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-7">
                    <Link
                      href={`/annonces/${annonce.id}/modifier`}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white"
                    >
                      <Edit3 size={15} /> Modifier
                    </Link>
                    <Link
                      href={`/annonces/${annonce.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700"
                    >
                      Voir l’annonce
                    </Link>
                    <button
                      type="button"
                      onClick={() => void removeAnnonce(annonce)}
                      disabled={deletingId === annonce.id}
                      className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-black text-red-700 disabled:opacity-60"
                    >
                      {deletingId === annonce.id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-sm">
              <Megaphone className="mx-auto text-orange-500" size={42} />
              <h2 className="mt-4 text-2xl font-black">Aucune annonce pour le moment</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-slate-500">
                Publiez votre première annonce puis retrouvez-la ici pour la consulter ou la modifier.
              </p>
              <Link href={createHref} className="gotfit-button gotfit-button-brand mt-6 px-6">
                <Plus size={17} /> Créer une annonce
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

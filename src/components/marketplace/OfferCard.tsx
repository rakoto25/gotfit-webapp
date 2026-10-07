"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, CreditCard, Loader2, PackageCheck, XCircle } from "lucide-react";
import { useState } from "react";

import { cancelOffer, formatMinorMoney, type Offer } from "@/lib/marketplace";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "À régler",
  paid: "Payée · pack actif",
  expired: "Expirée",
  cancelled: "Annulée",
};

type OfferCardProps = {
  offer: Offer;
  currentUserId?: number | null;
  onChanged?: () => void | Promise<void>;
};

export default function OfferCard({ offer, currentUserId, onChanged }: OfferCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const isClient = currentUserId === offer.client_id;
  const isCoach = currentUserId === offer.coach_id;
  const payable = offer.status === "sent" && !offer.is_expired;
  const paid = offer.status === "paid";
  const displayedStatus = offer.is_expired && offer.status === "sent" ? "expired" : offer.status;

  async function handleCancel() {
    if (cancelling || !window.confirm("Annuler cette offre ? Le client ne pourra plus la payer.")) {
      return;
    }

    try {
      setCancelling(true);
      setError("");
      await cancelOffer(offer.id);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’annuler l’offre.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="min-w-[280px] overflow-hidden rounded-[1.5rem] border border-orange-200 bg-white text-slate-950 shadow-lg shadow-orange-950/10 sm:min-w-[360px]">
      <div className="flex items-center justify-between gap-3 bg-slate-950 px-5 py-4 text-white">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
          <PackageCheck size={17} className="text-orange-300" />
          Offre GotFit
        </span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${paid ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white"}`}>
          {statusLabels[displayedStatus] || displayedStatus}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-black leading-tight">{offer.title}</h3>
        {offer.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-500">
            {offer.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-orange-50 p-3">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">Séances</span>
            <strong className="mt-1 block text-lg font-black">{offer.session_count}</strong>
          </div>
          <div className="rounded-2xl bg-orange-50 p-3">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">Total</span>
            <strong className="mt-1 block text-lg font-black">{formatMinorMoney(offer.amount_total, offer.currency)}</strong>
          </div>
        </div>

        {offer.expires_at && !paid && (
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <CalendarClock size={15} />
            Valable jusqu’au {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(offer.expires_at))}
          </p>
        )}

        {paid && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span>Le paiement est confirmé. Le pack de {offer.session_count} séance{offer.session_count > 1 ? "s" : ""} est actif.</span>
          </div>
        )}

        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {isClient && payable && (
            <Link
              href={`/offres/${offer.id}/paiement`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
            >
              <CreditCard size={17} />
              Vérifier et payer
            </Link>
          )}
          {paid && offer.pack?.id && (
            <Link
              href={`/packs?pack=${offer.pack.id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <PackageCheck size={17} />
              Ouvrir le pack
            </Link>
          )}
          {isCoach && payable && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {cancelling ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />}
              Annuler
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

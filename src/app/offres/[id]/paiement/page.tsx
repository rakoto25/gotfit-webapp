"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircleMore,
  PackageCheck,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentUser, getToken } from "@/lib/auth";
import {
  createOfferCheckout,
  fetchOffer,
  fetchWallet,
  formatMinorMoney,
  type Offer,
  type Wallet,
} from "@/lib/marketplace";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function OfferPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletAmount, setWalletAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!getToken()) {
        const target = `/offres/${params.id}/paiement`;
        router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [offerResult, walletResult] = await Promise.all([
          fetchOffer(params.id),
          fetchWallet(),
        ]);
        const currentUser = getCurrentUser();

        if (currentUser?.id !== offerResult.client_id) {
          throw new Error("Seul le client destinataire peut accéder au paiement de cette offre.");
        }

        setOffer(offerResult);
        setWallet(walletResult.wallet);
        setWalletAmount(String((offerResult.wallet_amount_applied || 0) / 100));
      } catch (err) {
        setError(getErrorMessage(err, "Impossible de charger cette offre."));
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params.id, router]);

  const checkoutLocked = Boolean(offer?.stripe_checkout_session_id);

  const maxWalletAmount = useMemo(() => {
    if (!offer || !wallet) return 0;
    if (offer.stripe_checkout_session_id) return (offer.wallet_amount_applied || 0) / 100;
    return Math.max(0, Math.min(wallet.balance, offer.amount_total - 50)) / 100;
  }, [offer, wallet]);

  const selectedWalletCents = useMemo(() => {
    if (offer?.stripe_checkout_session_id) return offer.wallet_amount_applied || 0;
    const parsed = Number(walletAmount.replace(",", "."));
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(Math.max(Math.round(parsed * 100), 0), Math.round(maxWalletAmount * 100));
  }, [maxWalletAmount, offer, walletAmount]);

  const stripeDue = offer ? Math.max(offer.amount_total - selectedWalletCents, 0) : 0;

  async function handleCheckout() {
    if (!offer || checkoutInFlight.current) return;

    try {
      checkoutInFlight.current = true;
      setPaying(true);
      setError("");
      const result = await createOfferCheckout(offer.id, selectedWalletCents / 100);

      if (result.already_paid) {
        router.replace(`/packs${result.offer?.pack?.id ? `?pack=${result.offer.pack.id}` : ""}`);
        return;
      }

      if (!result.checkout_url) {
        throw new Error("Stripe n’a pas fourni de lien de paiement.");
      }

      window.location.assign(result.checkout_url);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d’ouvrir le paiement Stripe."));
      setPaying(false);
      checkoutInFlight.current = false;
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-24 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <Link
            href={offer ? `/messages?conversation_id=${offer.conversation_id}` : "/messages"}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
          >
            <ArrowLeft size={17} />
            Retour à la conversation
          </Link>

          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700 shadow-sm">
              <Loader2 className="mr-3 animate-spin" size={20} />
              Chargement de l’offre…
            </div>
          ) : error && !offer ? (
            <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-black">Paiement indisponible</h1>
              <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            </div>
          ) : offer ? (
            <div className="grid gap-7 lg:grid-cols-[1fr_420px]">
              <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(249,115,22,0.14)] sm:p-9">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-700">
                  <PackageCheck size={16} />
                  Étape avant paiement
                </span>
                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Vérifiez votre offre.</h1>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
                  Vous pouvez encore contacter le coach avant d’ouvrir la page de paiement sécurisée Stripe.
                </p>

                <div className="mt-8 rounded-[2rem] border border-orange-100 bg-orange-50 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{offer.title}</h2>
                      {offer.description && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-600">{offer.description}</p>}
                    </div>
                    <strong className="rounded-full bg-slate-950 px-5 py-3 text-xl font-black text-white">
                      {formatMinorMoney(offer.amount_total, offer.currency)}
                    </strong>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Pack</span>
                      <strong className="mt-1 block text-lg font-black">{offer.session_count} séance{offer.session_count > 1 ? "s" : ""}</strong>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Coach</span>
                      <strong className="mt-1 block text-lg font-black">{offer.coach?.name || "Coach GotFit"}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-orange-700"><UserRound size={23} /></span>
                    <div>
                      <strong className="block font-black">Une question avant de payer ?</strong>
                      <span className="text-sm font-semibold text-slate-500">La conversation GotFit reste ouverte.</span>
                    </div>
                  </div>
                  <Link
                    href={`/messages?conversation_id=${offer.conversation_id}&user_id=${offer.coach_id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                  >
                    <MessageCircleMore size={18} />
                    Contacter le coach
                  </Link>
                </div>
              </section>

              <aside className="h-fit rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(249,115,22,0.14)] lg:sticky lg:top-28">
                {offer.status === "paid" ? (
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
                    <h2 className="mt-4 text-2xl font-black">Offre déjà payée</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Votre pack est actif et ses séances sont disponibles.</p>
                    <Link href="/packs" className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white">Voir mes packs</Link>
                  </div>
                ) : offer.status !== "sent" || offer.is_expired ? (
                  <div className="rounded-2xl bg-amber-50 p-5 text-sm font-bold text-amber-800">Cette offre n’est plus payable.</div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <WalletCards className="text-orange-700" size={25} />
                      <div>
                        <h2 className="text-xl font-black">Utiliser ma cagnotte</h2>
                        <p className="text-xs font-bold text-slate-500">Solde : {formatMinorMoney(wallet?.balance || 0, wallet?.currency || offer.currency)}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-black text-slate-700" htmlFor="wallet-amount">Montant à déduire</label>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <input
                          id="wallet-amount"
                          type="number"
                          min="0"
                          max={maxWalletAmount}
                          step="0.01"
                          value={walletAmount}
                          onChange={(event) => setWalletAmount(event.target.value)}
                          disabled={checkoutLocked}
                          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-bold outline-none disabled:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setWalletAmount(maxWalletAmount.toFixed(2))}
                          disabled={checkoutLocked || maxWalletAmount <= 0}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-orange-700 shadow-sm disabled:opacity-50"
                        >
                          Maximum
                        </button>
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Stripe doit encaisser au minimum 0,50 €. La cagnotte ne peut pas être retirée en espèces.</p>
                    </div>

                    <div className="my-6 grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
                      <div className="flex justify-between text-sm font-semibold text-white/65"><span>Prix de l’offre</span><span>{formatMinorMoney(offer.amount_total, offer.currency)}</span></div>
                      <div className="flex justify-between text-sm font-semibold text-emerald-300"><span>Cagnotte utilisée</span><span>− {formatMinorMoney(selectedWalletCents, offer.currency)}</span></div>
                      <div className="h-px bg-white/10" />
                      <div className="flex items-end justify-between"><span className="text-sm font-black">À payer par Stripe</span><strong className="text-3xl font-black">{formatMinorMoney(stripeDue, offer.currency)}</strong></div>
                    </div>

                    {checkoutLocked && <p className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">Une session Stripe existe déjà. Le montant de cagnotte est verrouillé pour éviter un double débit.</p>}
                    {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={paying}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:opacity-60"
                    >
                      {paying ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                      {paying ? "Ouverture de Stripe…" : "Continuer vers Stripe"}
                    </button>
                    <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={16} />Le paiement est traité sur la page sécurisée Stripe. GotFit active le pack uniquement après confirmation du paiement.</p>
                  </>
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

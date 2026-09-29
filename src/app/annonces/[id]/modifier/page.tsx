"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Save,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getToken } from "@/lib/auth";
import {
  type Annonce,
  fetchMyAnnonces,
  getAnnonceDescription,
  getAnnonceTitle,
  getMaxParticipants,
  updateAnnonce,
} from "@/lib/marketplace";

const days = [
  ["monday", "Lundi"],
  ["tuesday", "Mardi"],
  ["wednesday", "Mercredi"],
  ["thursday", "Jeudi"],
  ["friday", "Vendredi"],
  ["saturday", "Samedi"],
  ["sunday", "Dimanche"],
] as const;

const categories = [
  "Coaching sportif",
  "Fitness",
  "Musculation",
  "Yoga",
  "Pilates",
  "Running",
  "Nutrition",
  "Bien-être",
  "Remise en forme",
  "Autre",
];

function rangesToText(annonce: Annonce) {
  return (annonce.available_hours || []).join("\n");
}

export default function EditAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : String(params?.id || "");

  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxParticipants, setMaxParticipants] = useState("2");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [hoursText, setHoursText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCoachOffer = annonce?.announcement_type === "coach_service";

  const timeRanges = useMemo(
    () =>
      hoursText
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    [hoursText]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!getToken()) {
        router.replace(
          `/auth/login?redirect=${encodeURIComponent(`/annonces/${id}/modifier`)}`
        );
        return;
      }

      try {
        setLoading(true);
        const items = await fetchMyAnnonces();
        const found = items.find((item) => String(item.id) === String(id));

        if (!found) {
          throw new Error("Cette annonce est introuvable ou ne vous appartient pas.");
        }

        if (!mounted) return;
        setAnnonce(found);
        setTitle(getAnnonceTitle(found));
        setDescription(getAnnonceDescription(found));
        setCategory(found.category || "");
        setPrice(found.price === null || found.price === undefined ? "" : String(found.price));
        setDuration(String(found.duration || 60));
        setMaxParticipants(String(getMaxParticipants(found)));
        setSelectedDays(found.available_days || []);
        setHoursText(rangesToText(found));
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Impossible de charger l’annonce.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  function toggleDay(day: string) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!annonce || saving) return;

    if (title.trim().length < 5 || description.trim().length < 20) {
      setError("Renseignez un titre et une description suffisamment détaillés.");
      return;
    }

    if (isCoachOffer) {
      if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
        setError("Le tarif coach doit être supérieur à 0 €.");
        return;
      }
      if (!Number.isInteger(Number(maxParticipants)) || Number(maxParticipants) < 1 || Number(maxParticipants) > 4) {
        setError("Choisissez entre 1 et 4 coachés maximum par créneau.");
        return;
      }
      if (!selectedDays.length) {
        setError("Sélectionnez au moins un jour disponible.");
        return;
      }
      if (!timeRanges.length || timeRanges.some((range) => !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(range))) {
        setError("Indiquez les créneaux coach au format HH:MM-HH:MM, un par ligne.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body = new FormData();
      body.append("titre", title.trim());
      body.append("contenu", description.trim());
      body.append("category", category.trim());
      body.append("type_prestation", "visio");
      body.append("is_online", "1");
      body.append("location", "Visio GotFit");
      body.append("duration", String(Math.max(15, Number(duration) || 60)));
      if (isCoachOffer) body.append("max_participants", maxParticipants);

      if (price.trim()) body.append("price", Number(price).toFixed(2));
      selectedDays.forEach((day) => body.append("available_days[]", day));
      timeRanges.forEach((range) => body.append("available_hours[]", range));

      const result = await updateAnnonce(annonce.id, body);
      setAnnonce(result.annonce);
      setSuccess(result.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de modifier l’annonce.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--canvas)] px-4 pb-20 pt-32 text-[var(--ink)] sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/annonces/mes-annonces"
            className="inline-flex items-center gap-2 text-sm font-black text-[var(--brand-strong)]"
          >
            <ArrowLeft size={17} /> Mes annonces
          </Link>

          <div className="mt-7 rounded-[2.5rem] bg-white p-6 shadow-[0_22px_70px_rgba(21,33,27,0.07)] sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
              <ShieldCheck size={15} /> Modification sécurisée
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Modifier mon annonce
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Après enregistrement, l’annonce repasse en validation afin que les nouvelles informations soient contrôlées avant publication.
            </p>

            {error && (
              <div className="mt-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                <X size={18} className="shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {success}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm font-black text-orange-700">
                <Loader2 className="mr-3 animate-spin" size={20} /> Chargement de l’annonce...
              </div>
            ) : annonce ? (
              <form onSubmit={submit} className="mt-8 grid gap-5">
                <label>
                  <span className="mb-2 block text-sm font-black">Titre</span>
                  <input className="gotfit-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black">Description</span>
                  <textarea className="gotfit-input min-h-36 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black">Catégorie</span>
                    <select className="gotfit-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Choisir une catégorie</option>
                      {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-black">{isCoachOffer ? "Prix de la prestation (€)" : "Budget indicatif (€)"}</span>
                    <input className="gotfit-input" type="number" min={isCoachOffer ? 0.01 : 0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required={isCoachOffer} />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black">Durée estimée (minutes)</span>
                    <input className="gotfit-input" type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </label>
                  {isCoachOffer && (
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-sm font-black">
                        <UsersRound size={17} /> Coachés maximum par créneau
                      </span>
                      <select className="gotfit-input" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)}>
                        <option value="1">1 coaché</option>
                        <option value="2">2 coachés</option>
                        <option value="3">3 coachés</option>
                        <option value="4">4 coachés</option>
                      </select>
                    </label>
                  )}
                </div>

                <div>
                  <span className="mb-3 flex items-center gap-2 text-sm font-black"><CalendarDays size={17} /> Jours préférés / disponibles</span>
                  <div className="flex flex-wrap gap-2">
                    {days.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleDay(value)}
                        className={`rounded-full px-4 py-2 text-xs font-black transition ${selectedDays.includes(value) ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span className="mb-2 flex items-center gap-2 text-sm font-black"><Clock3 size={17} /> {isCoachOffer ? "Créneaux proposés" : "Créneaux ou précisions"}</span>
                  <textarea
                    className="gotfit-input min-h-28 resize-y"
                    value={hoursText}
                    onChange={(e) => setHoursText(e.target.value)}
                    placeholder={isCoachOffer ? "09:00-12:00\n14:00-18:00" : "Ex. Après 18 h en semaine"}
                  />
                  <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">
                    {isCoachOffer
                      ? "Un créneau par ligne, au format HH:MM-HH:MM. Les clients ne pourront réserver qu’à l’intérieur de ces créneaux."
                      : "Indiquez vos préférences de disponibilité pour aider le coach à vous répondre."}
                  </span>
                </label>

                <div className="flex flex-wrap gap-3 pt-3">
                  <button type="submit" disabled={saving} className="gotfit-button gotfit-button-brand px-6 disabled:opacity-60">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                  <Link href="/annonces/mes-annonces" className="gotfit-button bg-slate-100 px-6">Annuler</Link>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

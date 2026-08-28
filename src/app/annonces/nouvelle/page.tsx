"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Euro,
  ImagePlus,
  Loader2,
  MonitorPlay,
  Send,
  Sparkles,
  UserSearch,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import {
  getPostAuthRoute,
  getStoredAuth,
  isClient,
  isCoach,
} from "@/lib/auth";
import { createAnnonce } from "@/lib/marketplace";

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

const weekDays = [
  ["monday", "Lun"],
  ["tuesday", "Mar"],
  ["wednesday", "Mer"],
  ["thursday", "Jeu"],
  ["friday", "Ven"],
  ["saturday", "Sam"],
  ["sunday", "Dim"],
] as const;

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewClientAnnoncePage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef("");

  const [authReady, setAuthReady] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("60");
  const [availability, setAvailability] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const auth = getStoredAuth();

      if (!auth) {
        router.replace(
          `/auth/login?redirect=${encodeURIComponent("/annonces/nouvelle")}`
        );
        return;
      }

      if (isCoach(auth.user)) {
        router.replace("/intervenant/annonces/nouvelle");
        return;
      }

      if (!isClient(auth.user)) {
        router.replace(getPostAuthRoute(auth.user));
        return;
      }

      setAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function toggleDay(day: string) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const nextImage = event.target.files?.[0];
    event.target.value = "";
    if (!nextImage) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(nextImage.type)) {
      setError("Choisissez une image JPG, PNG ou WebP.");
      return;
    }

    if (nextImage.size > MAX_IMAGE_SIZE) {
      setError("L’image ne doit pas dépasser 4 Mo.");
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(nextImage);
    setImage(nextImage);
    setImagePreview(previewUrlRef.current);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (title.trim().length < 5) {
      setError("Le titre doit contenir au moins 5 caractères.");
      return;
    }

    if (description.trim().length < 30) {
      setError("Décrivez votre recherche en au moins 30 caractères.");
      return;
    }

    if (!category) {
      setError("Choisissez la spécialité recherchée.");
      return;
    }

    if (budget && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      setError("Indiquez un budget valide ou laissez le champ vide.");
      return;
    }

    const formData = new FormData();
    formData.append("titre", title.trim());
    formData.append("contenu", description.trim());
    formData.append("category", category);
    formData.append("type_prestation", "visio");
    formData.append("is_online", "1");
    formData.append("location", "Visio GotFit");
    formData.append("duration", String(Math.max(15, Number(duration) || 60)));

    if (budget) formData.append("price", Number(budget).toFixed(2));
    selectedDays.forEach((day) => formData.append("available_days[]", day));
    if (availability.trim()) {
      formData.append("available_hours[]", availability.trim());
    }
    if (image) formData.append("image", image);

    try {
      setSubmitting(true);
      const result = await createAnnonce(formData);
      setSuccess(result.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d’envoyer l’annonce."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FFF7ED]">
        <div className="flex items-center gap-3 text-sm font-black text-orange-700">
          <Loader2 className="animate-spin" size={22} />
          Ouverture du formulaire…
        </div>
      </main>
    );
  }

  return (
    <>
      <Header showMobileShortcuts={false} />

      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-16 pt-32 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/annonces"
            className="mb-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm"
          >
            <ArrowLeft size={17} />
            Retour aux annonces
          </Link>

          {success ? (
            <section className="mx-auto max-w-3xl rounded-[2.5rem] bg-white p-8 text-center shadow-[0_24px_80px_rgba(249,115,22,0.14)] sm:p-12">
              <CheckCircle2 className="mx-auto text-emerald-600" size={52} />
              <h1 className="mt-5 text-3xl font-black">Votre recherche est envoyée</h1>
              <p className="mt-4 font-semibold leading-7 text-slate-600">{success}</p>
              <Link href="/annonces" className="gotfit-button gotfit-button-dark mt-8">
                Voir les annonces
              </Link>
            </section>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_80px_rgba(249,115,22,0.12)] sm:p-9">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-700">
                  <UserSearch size={16} />
                  Recherche de coach
                </span>
                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  Publier votre besoin
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
                  Décrivez votre objectif, votre disponibilité et votre budget. Les
                  coachs pourront découvrir votre demande et vous contacter.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid gap-6" noValidate>
                  <label>
                    <span className="mb-2 block text-sm font-black">Titre de la recherche</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="gotfit-input"
                      placeholder="Ex. Je cherche un coach pour reprendre le running"
                      maxLength={255}
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black">Spécialité recherchée</span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="gotfit-input"
                    >
                      <option value="">Choisir une spécialité</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black">Votre besoin</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={7}
                      className="gotfit-input resize-none leading-7"
                      placeholder="Objectif, niveau actuel, contraintes, fréquence souhaitée…"
                    />
                  </label>

                  <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                    <MonitorPlay className="mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="font-black">Accompagnement 100 % en visio</p>
                      <p className="mt-1 font-semibold text-orange-800">
                        Toutes les séances GotFit se déroulent directement dans la salle vidéo sécurisée de la webapp.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-black">Budget par séance (optionnel)</span>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={budget}
                          onChange={(event) => setBudget(event.target.value)}
                          className="gotfit-input pl-11"
                          placeholder="40"
                        />
                      </div>
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-black">Durée souhaitée</span>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        className="gotfit-input"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-3 block text-sm font-black">Jours préférés</span>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {weekDays.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleDay(value)}
                          className={`rounded-xl border px-2 py-3 text-xs font-black ${
                            selectedDays.includes(value)
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label>
                    <span className="mb-2 block text-sm font-black">Créneaux ou précisions (optionnel)</span>
                    <input
                      value={availability}
                      onChange={(event) => setAvailability(event.target.value)}
                      className="gotfit-input"
                      placeholder="Ex. Après 18 h en semaine"
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-sm font-black">Photo (optionnelle)</span>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm font-black text-slate-600"
                    >
                      <ImagePlus size={20} />
                      {image ? image.name : "Ajouter une image JPG, PNG ou WebP"}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                      <X className="mt-0.5 shrink-0" size={18} /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="gotfit-button gotfit-button-dark min-h-14"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={19} /> : <Send size={18} />}
                    {submitting ? "Envoi en cours…" : "Envoyer pour validation"}
                  </button>
                </form>
              </section>

              <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-50">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Aperçu" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-orange-500"><Sparkles size={42} /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">
                      Recherche de coach · {category || "Spécialité"}
                    </span>
                    <h2 className="mt-3 text-xl font-black">{title || "Votre titre apparaîtra ici"}</h2>
                    <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-slate-500">
                      {description || "Décrivez votre objectif pour recevoir des propositions pertinentes."}
                    </p>
                  </div>
                </section>
                <section className="rounded-[2rem] bg-slate-950 p-6 text-white">
                  <UserSearch className="text-orange-300" size={26} />
                  <h2 className="mt-4 font-black">Comment ça marche ?</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
                    Après validation Gotfit, votre demande apparaît dans les annonces.
                    Les coachs intéressés peuvent vous contacter dans la messagerie.
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

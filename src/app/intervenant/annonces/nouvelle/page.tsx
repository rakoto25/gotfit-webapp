"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Euro,
  ImageIcon,
  Info,
  Loader2,
  MapPin,
  MonitorPlay,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import {
  getPostAuthRoute,
  getStoredAuth,
  isCoach,
} from "@/lib/auth";
import { createAnnonce } from "@/lib/marketplace";

type SessionFormat = "presentiel" | "visio";

type TimeSlot = {
  id: number;
  start: string;
  end: string;
};

type FormErrors = Partial<
  Record<
    | "title"
    | "description"
    | "category"
    | "price"
    | "duration"
    | "city"
    | "address"
    | "days"
    | "slots"
    | "image",
    string
  >
>;

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  { value: "monday", short: "Lun", label: "Lundi" },
  { value: "tuesday", short: "Mar", label: "Mardi" },
  { value: "wednesday", short: "Mer", label: "Mercredi" },
  { value: "thursday", short: "Jeu", label: "Jeudi" },
  { value: "friday", short: "Ven", label: "Vendredi" },
  { value: "saturday", short: "Sam", label: "Samedi" },
  { value: "sunday", short: "Dim", label: "Dimanche" },
];

function FieldError({ children }: { children?: string }) {
  if (!children) return null;

  return (
    <p className="mt-2 text-xs font-bold text-red-700" role="alert">
      {children}
    </p>
  );
}

function FieldLabel({
  children,
  optional = false,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <span className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-[var(--ink)]">
      {children}
      {optional && (
        <span className="text-[11px] font-bold text-slate-400">Optionnel</span>
      )}
    </span>
  );
}

function validateImage(file: File): string {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Choisissez une image JPG, PNG ou WebP.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "L’image ne doit pas dépasser 4 Mo.";
  }

  return "";
}

function formatPrice(value: string): string {
  const price = Number(value);

  if (!Number.isFinite(price)) return "0 €";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function NewCoachAnnoncePage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewRef = useRef("");
  const nextSlotId = useRef(2);

  const [authReady, setAuthReady] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [format, setFormat] = useState<SessionFormat>("presentiel");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: 1, start: "09:00", end: "12:00" },
  ]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const auth = getStoredAuth();

      if (!auth) {
        router.replace(
          `/auth/login?redirect=${encodeURIComponent(
            "/intervenant/annonces/nouvelle"
          )}`
        );
        return;
      }

      if (!isCoach(auth.user)) {
        router.replace(getPostAuthRoute(auth.user));
        return;
      }

      setAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
    };
  }, []);

  const completion = useMemo(() => {
    const checks = [
      title.trim().length >= 5,
      description.trim().length >= 30,
      Boolean(category),
      Number(price) >= 0 && price !== "",
      Number(duration) >= 15,
      selectedDays.length > 0,
      slots.some((slot) => slot.start && slot.end && slot.end > slot.start),
      format === "visio" || (Boolean(city.trim()) && Boolean(address.trim())),
      Boolean(image),
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [address, category, city, description, duration, format, image, price, selectedDays, slots, title]);

  const validSlots = useMemo(
    () =>
      slots.filter(
        (slot) => slot.start && slot.end && slot.end > slot.start
      ),
    [slots]
  );

  function updateFieldError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function selectImage(file?: File) {
    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setErrors((current) => ({ ...current, image: validationError }));
      return;
    }

    setImage(file);
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    imagePreviewRef.current = objectUrl;
    setImagePreview(objectUrl);
    updateFieldError("image");
  }

  function removeImage() {
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
    }
    imagePreviewRef.current = "";
    setImage(null);
    setImagePreview("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function toggleDay(day: string) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
    updateFieldError("days");
  }

  function addSlot() {
    setSlots((current) => [
      ...current,
      { id: nextSlotId.current++, start: "14:00", end: "18:00" },
    ]);
    updateFieldError("slots");
  }

  function updateSlot(id: number, field: "start" | "end", value: string) {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
    updateFieldError("slots");
  }

  function removeSlot(id: number) {
    setSlots((current) => current.filter((slot) => slot.id !== id));
  }

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    if (title.trim().length < 5) {
      nextErrors.title = "Le titre doit contenir au moins 5 caractères.";
    }

    if (description.trim().length < 30) {
      nextErrors.description =
        "Décrivez la séance en au moins 30 caractères.";
    }

    if (!category) {
      nextErrors.category = "Choisissez une catégorie.";
    }

    if (price === "" || Number(price) < 0 || !Number.isFinite(Number(price))) {
      nextErrors.price = "Indiquez un tarif valide.";
    }

    if (
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 15 ||
      Number(duration) > 480
    ) {
      nextErrors.duration = "La durée doit être comprise entre 15 et 480 minutes.";
    }

    if (format === "presentiel" && !city.trim()) {
      nextErrors.city = "Indiquez la ville de la séance.";
    }

    if (format === "presentiel" && !address.trim()) {
      nextErrors.address = "Indiquez l’adresse de la séance.";
    }

    if (selectedDays.length === 0) {
      nextErrors.days = "Sélectionnez au moins un jour disponible.";
    }

    if (validSlots.length === 0) {
      nextErrors.slots = "Ajoutez au moins un créneau avec une heure de fin valide.";
    }

    if (!image) {
      nextErrors.image = "Ajoutez une photo de couverture à votre annonce.";
    } else {
      const imageError = validateImage(image);
      if (imageError) nextErrors.image = imageError;
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setSubmitError("");
    setSuccess("");

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById("annonce-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const formData = new FormData();
    formData.append("titre", title.trim());
    formData.append("contenu", description.trim());
    formData.append("category", category);
    formData.append("type_prestation", format);
    formData.append("price", Number(price).toFixed(2));
    formData.append("duration", String(Number(duration)));
    formData.append("is_online", format === "visio" ? "1" : "0");

    if (format === "visio") {
      formData.append("location", "Séance en ligne Gotfit");
    } else {
      formData.append("location", location.trim() || address.trim());
      formData.append("city", city.trim());
      formData.append("address", address.trim());
    }

    selectedDays.forEach((day) => formData.append("available_days[]", day));
    validSlots.forEach((slot) =>
      formData.append("available_hours[]", `${slot.start}-${slot.end}`)
    );

    if (image) formData.append("image", image);

    setSubmitting(true);

    try {
      const result = await createAnnonce(formData);
      setSuccess(result.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer l’annonce. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("");
    setFormat("presentiel");
    setPrice("");
    setDuration("60");
    setCity("");
    setAddress("");
    setLocation("");
    setSelectedDays([]);
    setSlots([{ id: nextSlotId.current++, start: "09:00", end: "12:00" }]);
    removeImage();
    setErrors({});
    setSubmitError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-4">
        <div className="flex items-center gap-3 text-sm font-black text-[var(--ink)]">
          <Loader2 className="animate-spin text-[var(--brand-strong)]" size={22} />
          Ouverture de votre espace coach…
        </div>
      </main>
    );
  }

  return (
    <>
      <Header showMobileShortcuts={false} />

      <main className="min-h-screen bg-[var(--canvas)] px-4 pb-16 pt-28 sm:px-6 lg:pb-20 lg:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <Link
              href="/intervenant/dashboard"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-[var(--ink)]"
            >
              <ArrowLeft size={18} />
              Tableau de bord
            </Link>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <ShieldCheck size={17} className="text-[var(--brand-strong)]" />
              Publication après validation Gotfit
            </div>
          </nav>

          {success ? (
            <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={34} />
              </div>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                Annonce envoyée
              </p>
              <h1 className="mt-3 text-3xl font-black text-[var(--ink)] sm:text-4xl">
                Votre séance est en cours de validation
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {success} Vous pourrez la retrouver dans votre espace dès que
                l’équipe Gotfit aura terminé sa vérification.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/intervenant/dashboard"
                  className="gotfit-button gotfit-button-dark"
                >
                  Ouvrir le tableau de bord
                </Link>
                <button
                  type="button"
                  onClick={resetForm}
                  className="gotfit-button border border-slate-300 bg-white text-[var(--ink)] hover:border-[var(--brand)]"
                >
                  <Plus size={18} />
                  Créer une autre annonce
                </button>
              </div>
            </section>
          ) : (
            <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10 xl:gap-14">
              <div>
                <div className="max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                    Espace intervenant
                  </p>
                  <h1 className="mt-3 text-3xl font-black leading-tight text-[var(--ink)] sm:text-4xl">
                    Créer une nouvelle annonce
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Présentez une séance claire, choisissez vos disponibilités et
                    donnez aux clients toutes les informations nécessaires pour
                    réserver.
                  </p>
                </div>

                <form
                  id="annonce-form"
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-10 space-y-12"
                >
                  <section aria-labelledby="section-presentation">
                    <div className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                        01
                      </span>
                      <div>
                        <h2 id="section-presentation" className="text-xl font-black text-[var(--ink)]">
                          Présentation de la séance
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Ces informations apparaîtront dans la marketplace Gotfit.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <FieldLabel>Titre de l’annonce</FieldLabel>
                        <input
                          value={title}
                          onChange={(event) => {
                            setTitle(event.target.value);
                            updateFieldError("title");
                          }}
                          maxLength={255}
                          className="gotfit-input"
                          placeholder="Ex. Coaching remise en forme personnalisé"
                          aria-invalid={Boolean(errors.title)}
                        />
                        <div className="flex justify-between gap-3">
                          <FieldError>{errors.title}</FieldError>
                          <span className="ml-auto mt-2 text-[11px] font-bold text-slate-400">
                            {title.length}/255
                          </span>
                        </div>
                      </label>

                      <label>
                        <FieldLabel>Catégorie</FieldLabel>
                        <select
                          value={category}
                          onChange={(event) => {
                            setCategory(event.target.value);
                            updateFieldError("category");
                          }}
                          className="gotfit-input"
                          aria-invalid={Boolean(errors.category)}
                        >
                          <option value="">Choisir une catégorie</option>
                          {categories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <FieldError>{errors.category}</FieldError>
                      </label>

                      <div>
                        <FieldLabel>Format de la séance</FieldLabel>
                        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Format de la séance">
                          {([
                            { value: "presentiel" as const, label: "Présentiel", icon: UsersRound },
                            { value: "visio" as const, label: "En visio", icon: MonitorPlay },
                          ]).map(({ value, label, icon: Icon }) => {
                            const active = format === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => {
                                  setFormat(value);
                                  setErrors((current) => ({
                                    ...current,
                                    city: undefined,
                                    address: undefined,
                                  }));
                                }}
                                className={`flex min-h-12 items-center justify-center gap-2 border px-3 text-sm font-black transition ${
                                  active
                                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-[var(--brand)]"
                                }`}
                              >
                                <Icon size={18} />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="sm:col-span-2">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                          value={description}
                          onChange={(event) => {
                            setDescription(event.target.value);
                            updateFieldError("description");
                          }}
                          maxLength={3000}
                          rows={7}
                          className="gotfit-input min-h-40 resize-y leading-6"
                          placeholder="Expliquez l’objectif de la séance, son déroulement, le niveau attendu et ce que le client doit prévoir."
                          aria-invalid={Boolean(errors.description)}
                        />
                        <div className="flex justify-between gap-3">
                          <FieldError>{errors.description}</FieldError>
                          <span className="ml-auto mt-2 text-[11px] font-bold text-slate-400">
                            {description.length}/3000
                          </span>
                        </div>
                      </label>
                    </div>
                  </section>

                  <section aria-labelledby="section-tarif">
                    <div className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                        02
                      </span>
                      <div>
                        <h2 id="section-tarif" className="text-xl font-black text-[var(--ink)]">
                          Tarif et durée
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Le paiement sera sécurisé par Stripe au moment de la réservation.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <label>
                        <FieldLabel>Prix de la séance</FieldLabel>
                        <div className="relative">
                          <Euro className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={price}
                            onChange={(event) => {
                              setPrice(event.target.value);
                              updateFieldError("price");
                            }}
                            className="gotfit-input pl-11"
                            placeholder="45,00"
                            aria-invalid={Boolean(errors.price)}
                          />
                        </div>
                        <FieldError>{errors.price}</FieldError>
                      </label>

                      <label>
                        <FieldLabel>Durée</FieldLabel>
                        <div className="relative">
                          <Clock3 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="number"
                            min="15"
                            max="480"
                            step="5"
                            value={duration}
                            onChange={(event) => {
                              setDuration(event.target.value);
                              updateFieldError("duration");
                            }}
                            className="gotfit-input pl-11 pr-24"
                            aria-invalid={Boolean(errors.duration)}
                          />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            minutes
                          </span>
                        </div>
                        <FieldError>{errors.duration}</FieldError>
                      </label>
                    </div>
                  </section>

                  {format === "presentiel" && (
                    <section aria-labelledby="section-lieu">
                      <div className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                          03
                        </span>
                        <div>
                          <h2 id="section-lieu" className="text-xl font-black text-[var(--ink)]">
                            Lieu de la séance
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            L’adresse permet au client de préparer son déplacement.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        <label>
                          <FieldLabel>Ville</FieldLabel>
                          <input
                            value={city}
                            onChange={(event) => {
                              setCity(event.target.value);
                              updateFieldError("city");
                            }}
                            maxLength={100}
                            className="gotfit-input"
                            placeholder="Ex. Lyon"
                            aria-invalid={Boolean(errors.city)}
                          />
                          <FieldError>{errors.city}</FieldError>
                        </label>

                        <label>
                          <FieldLabel optional>Nom du lieu</FieldLabel>
                          <input
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            maxLength={255}
                            className="gotfit-input"
                            placeholder="Ex. Studio Gotfit Centre"
                          />
                        </label>

                        <label className="sm:col-span-2">
                          <FieldLabel>Adresse complète</FieldLabel>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-4 top-4 text-slate-400" size={18} />
                            <input
                              value={address}
                              onChange={(event) => {
                                setAddress(event.target.value);
                                updateFieldError("address");
                              }}
                              maxLength={255}
                              className="gotfit-input pl-11"
                              placeholder="12 rue des Sports, 69002 Lyon"
                              aria-invalid={Boolean(errors.address)}
                            />
                          </div>
                          <FieldError>{errors.address}</FieldError>
                        </label>
                      </div>
                    </section>
                  )}

                  <section aria-labelledby="section-disponibilites">
                    <div className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                        {format === "presentiel" ? "04" : "03"}
                      </span>
                      <div>
                        <h2 id="section-disponibilites" className="text-xl font-black text-[var(--ink)]">
                          Disponibilités habituelles
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Indiquez les jours et plages sur lesquels vous acceptez des demandes.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <FieldLabel>Jours disponibles</FieldLabel>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {weekDays.map((day) => {
                          const selected = selectedDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              aria-pressed={selected}
                              title={day.label}
                              className={`relative min-h-12 border text-xs font-black transition ${
                                selected
                                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-[var(--brand)]"
                              }`}
                            >
                              {selected && <Check className="absolute right-1 top-1" size={12} />}
                              {day.short}
                            </button>
                          );
                        })}
                      </div>
                      <FieldError>{errors.days}</FieldError>
                    </div>

                    <div className="mt-7">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <FieldLabel>Plages horaires</FieldLabel>
                        <button
                          type="button"
                          onClick={addSlot}
                          disabled={slots.length >= 6}
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={16} />
                          Ajouter
                        </button>
                      </div>

                      <div className="space-y-3">
                        {slots.map((slot, index) => (
                          <div key={slot.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 border border-slate-200 bg-white p-3">
                            <label>
                              <span className="sr-only">Début de la plage {index + 1}</span>
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(event) => updateSlot(slot.id, "start", event.target.value)}
                                className="gotfit-input min-h-11 py-2"
                              />
                            </label>
                            <span className="text-xs font-black text-slate-400">à</span>
                            <label>
                              <span className="sr-only">Fin de la plage {index + 1}</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(event) => updateSlot(slot.id, "end", event.target.value)}
                                className="gotfit-input min-h-11 py-2"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeSlot(slot.id)}
                              disabled={slots.length === 1}
                              className="grid h-10 w-10 place-items-center text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Supprimer la plage ${index + 1}`}
                              title="Supprimer cette plage"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <FieldError>{errors.slots}</FieldError>
                    </div>
                  </section>

                  <section aria-labelledby="section-image">
                    <div className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--ink)] text-sm font-black text-white">
                        {format === "presentiel" ? "05" : "04"}
                      </span>
                      <div>
                        <h2 id="section-image" className="text-xl font-black text-[var(--ink)]">
                          Photo de couverture
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Une image nette aide les clients à comprendre votre offre.
                        </p>
                      </div>
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <div
                      className="mt-6 border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[var(--brand)]"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        selectImage(event.dataTransfer.files?.[0]);
                      }}
                    >
                      <Upload className="mx-auto text-[var(--brand-strong)]" size={28} />
                      <p className="mt-3 text-sm font-black text-[var(--ink)]">
                        Déposez une image ici
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        JPG, PNG ou WebP · 4 Mo maximum
                      </p>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="mt-4 inline-flex min-h-10 items-center justify-center border border-slate-300 bg-white px-4 text-xs font-black text-[var(--ink)] transition hover:border-[var(--brand)]"
                      >
                        Choisir une image
                      </button>
                    </div>
                    <FieldError>{errors.image}</FieldError>
                  </section>

                  {submitError && (
                    <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800" role="alert">
                      <X className="mt-0.5 shrink-0" size={18} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/intervenant/dashboard"
                      className="inline-flex min-h-12 items-center justify-center px-4 text-sm font-black text-slate-500 transition hover:text-[var(--ink)]"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="gotfit-button gotfit-button-dark min-w-52"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={19} />
                      ) : (
                        <Send size={18} />
                      )}
                      {submitting ? "Envoi en cours…" : "Envoyer pour validation"}
                    </button>
                  </div>
                </form>
              </div>

              <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                <section className="overflow-hidden border border-[var(--line)] bg-white">
                  <div className="relative aspect-[4/3] bg-[#e9ede9]">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt="Aperçu de l’annonce"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-center text-slate-400">
                        <div>
                          <ImageIcon className="mx-auto" size={36} />
                          <p className="mt-2 text-xs font-bold">Aperçu de la photo</p>
                        </div>
                      </div>
                    )}

                    {image && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-red-50 hover:text-red-700"
                        aria-label="Retirer l’image"
                        title="Retirer l’image"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--brand-strong)]">
                        {category || "Votre catégorie"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-500">
                        {format === "visio" ? <MonitorPlay size={14} /> : <MapPin size={14} />}
                        {format === "visio" ? "Visio" : city || "Votre ville"}
                      </span>
                    </div>
                    <h2 className="mt-3 break-words text-lg font-black leading-snug text-[var(--ink)]">
                      {title.trim() || "Titre de votre nouvelle séance"}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                      {description.trim() ||
                        "La description de votre accompagnement apparaîtra ici."}
                    </p>
                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock3 size={15} />
                        {duration || "60"} min
                      </span>
                      <strong className="text-lg font-black text-[var(--ink)]">
                        {formatPrice(price)}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="bg-[var(--ink)] p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--brand)]">
                        Préparation
                      </p>
                      <p className="mt-1 text-sm font-black">Annonce complétée</p>
                    </div>
                    <strong className="text-2xl font-black text-[var(--brand)]">
                      {completion}%
                    </strong>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--brand)] transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </section>

                <section className="border border-amber-200 bg-amber-50 p-5">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 shrink-0 text-amber-700" size={19} />
                    <div>
                      <h2 className="text-sm font-black text-amber-950">Avant la publication</h2>
                      <p className="mt-2 text-xs font-semibold leading-5 text-amber-900">
                        Votre profil doit être validé. L’annonce restera en attente jusqu’à sa vérification par l’administration.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="flex items-start gap-3 border border-[var(--line)] bg-white p-5">
                  <Sparkles className="mt-0.5 shrink-0 text-[var(--brand-strong)]" size={19} />
                  <p className="text-xs font-semibold leading-5 text-slate-600">
                    Utilisez une photo lumineuse et décrivez précisément le niveau, le matériel et les objectifs de la séance.
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

import Link from "next/link";

import CoachDocumentsManager from "@/components/coach/CoachDocumentsManager";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.gotfit.tech/api"
).replace(/\/+$/, "");

const DOCUMENT_ENDPOINTS = [
  `${API_URL}/intervenant/documents`,
  `${API_URL}/intervenant/profile/documents`,
  `${API_URL}/coach/documents`,
] as const;

/* =========================================================
   ICÔNES
========================================================= */

type IconProps = {
  className?: string;
};

function ArrowLeftIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ShieldIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 3 5 6v5c0 4.7 2.8 8.7 7 10 4.2-1.3 7-5.3 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function InformationIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function DocumentIcon({
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function IntervenantDocumentsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* =================================================
            FIL D’ARIANE
        ================================================= */}

        <nav
          aria-label="Fil d’Ariane"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400"
        >
          <Link
            href="/intervenant/dashboard"
            className="transition hover:text-orange-600"
          >
            Tableau de bord
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href="/intervenants/profile"
            className="transition hover:text-orange-600"
          >
            Mon profil
          </Link>

          <span aria-hidden="true">/</span>

          <span className="text-slate-600">
            Justificatifs
          </span>
        </nav>

        {/* =================================================
            EN-TÊTE
        ================================================= */}

        <header className="mb-7 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-orange-950/30">
                  <DocumentIcon className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    Espace intervenant
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    Mes justificatifs professionnels
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Ajoutez et gérez les documents nécessaires
                    à la vérification de votre profil Gotfit.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/intervenants/profile"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:border-white/25 hover:bg-white/15"
                >
                  <ArrowLeftIcon className="h-4 w-4" />

                  Retour au profil
                </Link>

                <Link
                  href="/intervenant/dashboard"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-5 text-sm font-black text-slate-950 shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            INFORMATIONS IMPORTANTES
        ================================================= */}

        <section
          aria-label="Informations sur les justificatifs"
          className="mb-7 grid gap-4 md:grid-cols-2"
        >
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <ShieldIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-emerald-950">
                  Documents protégés
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Vos justificatifs sont utilisés uniquement
                  pour la vérification de votre profil
                  professionnel par l’équipe Gotfit.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <InformationIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-blue-950">
                  Conditions d’envoi
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Vous pouvez transmettre entre un et cinq
                  documents aux formats PDF, JPG, PNG ou WEBP,
                  avec une taille maximale de 8 Mo par fichier.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* =================================================
            GESTIONNAIRE DE DOCUMENTS
        ================================================= */}

        <CoachDocumentsManager
          endpoints={DOCUMENT_ENDPOINTS}
          maxDocuments={5}
          maxFileSizeMb={8}
          fileFieldName="documents[]"
          typeFieldName="document_types[]"
          loginHref="/auth/login"
        />

        {/* =================================================
            AIDE
        ================================================= */}

        <aside className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
            Documents recommandés
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Quels justificatifs transmettre ?
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <strong className="text-sm font-black text-slate-950">
                Diplômes
              </strong>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Diplômes sportifs, titres professionnels ou
                formations reconnues.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <strong className="text-sm font-black text-slate-950">
                Certifications
              </strong>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Certifications liées au coaching, à la santé,
                au bien-être ou à votre spécialité.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <strong className="text-sm font-black text-slate-950">
                Documents professionnels
              </strong>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Carte professionnelle, licence, assurance ou
                justificatif d’activité.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
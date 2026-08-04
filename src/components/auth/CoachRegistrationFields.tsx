"use client";

import {
  ChangeEvent,
  useMemo,
} from "react";
import {
  BadgeCheck,
  Building2,
  FileCheck2,
  FileText,
  FileUp,
  Info,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const MAX_COACH_DOCUMENTS = 5;
export const MAX_COACH_DOCUMENT_SIZE =
  8 * 1024 * 1024;

const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ACCEPTED_DOCUMENT_EXTENSIONS =
  ".pdf,.jpg,.jpeg,.png,.webp";

type RegistrationMethod = "google" | "form";

type CoachRegistrationFieldsProps = {
  method: RegistrationMethod;

  companyName: string;
  onCompanyNameChange: (value: string) => void;

  siret: string;
  onSiretChange: (value: string) => void;

  documents: File[];
  onDocumentsChange: (documents: File[]) => void;

  error?: string;
  onError?: (message: string) => void;

  disabled?: boolean;
};

export function normalizeSiret(
  value: string
): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14);
}

export function formatSiret(
  value: string
): string {
  const normalizedValue =
    normalizeSiret(value);

  return normalizedValue
    .replace(
      /^(\d{3})(\d{3})?(\d{3})?(\d{5})?$/,
      (
        _,
        first,
        second,
        third,
        fourth
      ) =>
        [
          first,
          second,
          third,
          fourth,
        ]
          .filter(Boolean)
          .join(" ")
    )
    .trim();
}

export function isValidSiret(
  value: string
): boolean {
  return /^\d{14}$/.test(
    normalizeSiret(value)
  );
}

export function formatFileSize(
  size: number
): string {
  if (size < 1024) {
    return `${size} octets`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(
      size / 1024
    )} Ko`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

export function validateCoachDocuments(
  files: File[]
): string | null {
  if (
    files.length >
    MAX_COACH_DOCUMENTS
  ) {
    return `Vous pouvez ajouter au maximum ${MAX_COACH_DOCUMENTS} documents.`;
  }

  const invalidTypeFile =
    files.find(
      (file) =>
        !ACCEPTED_DOCUMENT_TYPES.includes(
          file.type
        )
    );

  if (invalidTypeFile) {
    return `Le fichier « ${invalidTypeFile.name} » n’est pas accepté. Utilisez un PDF, JPG, PNG ou WEBP.`;
  }

  const oversizedFile =
    files.find(
      (file) =>
        file.size >
        MAX_COACH_DOCUMENT_SIZE
    );

  if (oversizedFile) {
    return `Le fichier « ${oversizedFile.name} » dépasse la taille maximale de 8 Mo.`;
  }

  return null;
}

export default function CoachRegistrationFields({
  method,
  companyName,
  onCompanyNameChange,
  siret,
  onSiretChange,
  documents,
  onDocumentsChange,
  error = "",
  onError,
  disabled = false,
}: CoachRegistrationFieldsProps) {
  const totalDocumentSize =
    useMemo(
      () =>
        documents.reduce(
          (total, document) =>
            total + document.size,
          0
        ),
      [documents]
    );

  function clearError() {
    onError?.("");
  }

  function handleDocumentSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    clearError();

    const selectedFiles =
      Array.from(
        event.target.files ?? []
      );

    event.target.value = "";

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const nextDocuments = [
      ...documents,
      ...selectedFiles,
    ];

    if (
      nextDocuments.length >
      MAX_COACH_DOCUMENTS
    ) {
      onError?.(
        `Vous pouvez ajouter au maximum ${MAX_COACH_DOCUMENTS} documents.`
      );
      return;
    }

    const duplicateFile =
      selectedFiles.find(
        (selectedFile) =>
          documents.some(
            (existingFile) =>
              existingFile.name ===
                selectedFile.name &&
              existingFile.size ===
                selectedFile.size &&
              existingFile.lastModified ===
                selectedFile.lastModified
          )
      );

    if (duplicateFile) {
      onError?.(
        `Le fichier « ${duplicateFile.name} » a déjà été ajouté.`
      );
      return;
    }

    const validationError =
      validateCoachDocuments(
        nextDocuments
      );

    if (validationError) {
      onError?.(
        validationError
      );
      return;
    }

    onDocumentsChange(
      nextDocuments
    );
  }

  function removeDocument(
    indexToRemove: number
  ) {
    const nextDocuments =
      documents.filter(
        (_, index) =>
          index !== indexToRemove
      );

    onDocumentsChange(
      nextDocuments
    );

    clearError();
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--brand)]">
          <ShieldCheck size={21} />
        </span>

        <div>
          <h2 className="font-black text-[var(--ink)]">
            Vérification
            professionnelle
          </h2>

          <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
            Ces informations
            permettent à Gotfit de
            vérifier votre activité
            avant la publication de
            votre profil coach.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Nom de l’activité ou de
          l’entreprise

          <span className="gotfit-field bg-white">
            <Building2
              size={18}
              aria-hidden="true"
            />

            <input
              type="text"
              value={companyName}
              onChange={(event) => {
                onCompanyNameChange(
                  event.target.value
                );
                clearError();
              }}
              autoComplete="organization"
              placeholder="Ex. Coaching Forme Paris"
              maxLength={255}
              disabled={disabled}
              required
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Numéro SIRET

          <span className="gotfit-field bg-white">
            <BadgeCheck
              size={18}
              aria-hidden="true"
            />

            <input
              type="text"
              inputMode="numeric"
              value={formatSiret(
                siret
              )}
              onChange={(event) => {
                onSiretChange(
                  normalizeSiret(
                    event.target.value
                  )
                );
                clearError();
              }}
              autoComplete="off"
              placeholder="123 456 789 00012"
              maxLength={17}
              disabled={disabled}
              required
              aria-describedby="coach-siret-help"
            />
          </span>

          <span
            id="coach-siret-help"
            className="text-xs font-medium text-slate-500"
          >
            Le numéro SIRET contient
            exactement 14 chiffres.
          </span>
        </label>
      </div>

      {method === "form" ? (
        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Diplômes et
                certifications
              </h3>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Ajoutez jusqu’à{" "}
                {
                  MAX_COACH_DOCUMENTS
                }{" "}
                fichiers PDF ou
                images, de 8 Mo
                maximum chacun.
              </p>
            </div>

            {documents.length >
              0 && (
              <span className="text-xs font-bold text-slate-500">
                {
                  documents.length
                }
                /
                {
                  MAX_COACH_DOCUMENTS
                }{" "}
                document
                {documents.length >
                1
                  ? "s"
                  : ""}{" "}
                ·{" "}
                {formatFileSize(
                  totalDocumentSize
                )}
              </span>
            )}
          </div>

          <label
            className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${
              disabled ||
              documents.length >=
                MAX_COACH_DOCUMENTS
                ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                : "cursor-pointer border-slate-300 bg-white hover:border-[var(--brand)] hover:bg-amber-50/40"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-[var(--ink)]">
              <FileUp
                size={22}
                aria-hidden="true"
              />
            </span>

            <strong className="mt-3 text-sm font-black text-[var(--ink)]">
              Ajouter mes
              justificatifs
            </strong>

            <span className="mt-1 text-xs font-medium text-slate-500">
              PDF, JPG, PNG ou WEBP
            </span>

            <input
              type="file"
              multiple
              accept={
                ACCEPTED_DOCUMENT_EXTENSIONS
              }
              onChange={
                handleDocumentSelection
              }
              disabled={
                disabled ||
                documents.length >=
                  MAX_COACH_DOCUMENTS
              }
              className="sr-only"
            />
          </label>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          {documents.length >
            0 && (
            <ul className="mt-4 grid gap-2">
              {documents.map(
                (
                  document,
                  index
                ) => (
                  <li
                    key={`${document.name}-${document.size}-${document.lastModified}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      {document.type ===
                      "application/pdf" ? (
                        <FileText
                          size={
                            19
                          }
                          aria-hidden="true"
                        />
                      ) : (
                        <FileCheck2
                          size={
                            19
                          }
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-800">
                        {
                          document.name
                        }
                      </p>

                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                        {formatFileSize(
                          document.size
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeDocument(
                          index
                        )
                      }
                      disabled={
                        disabled
                      }
                      aria-label={`Supprimer ${document.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-900">
          <Info
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p>
            Après la création de
            votre compte Google, vous
            pourrez ajouter vos
            diplômes et
            certifications depuis
            votre profil
            professionnel.
          </p>
        </div>
      )}
    </section>
  );
}
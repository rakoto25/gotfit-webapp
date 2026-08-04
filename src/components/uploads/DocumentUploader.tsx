"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileImage,
  FileText,
  FileUp,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";

export const DEFAULT_MAX_DOCUMENTS = 5;

export const DEFAULT_MAX_DOCUMENT_SIZE =
  8 * 1024 * 1024;

export const DEFAULT_ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const DEFAULT_ACCEPTED_DOCUMENT_EXTENSIONS =
  ".pdf,.jpg,.jpeg,.png,.webp";

export type ExistingDocument = {
  id: string | number;
  name: string;
  url?: string | null;
  size?: number | null;
  mime_type?: string | null;
  status?: "pending" | "approved" | "rejected" | null;
};

export type DocumentUploaderProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;

  existingDocuments?: ExistingDocument[];

  onRemoveExistingDocument?: (
    document: ExistingDocument
  ) => void | Promise<void>;

  label?: string;
  description?: string;

  inputName?: string;
  accept?: string;
  acceptedMimeTypes?: string[];

  maxFiles?: number;
  maxFileSize?: number;

  required?: boolean;
  disabled?: boolean;
  loading?: boolean;

  error?: string;
  onError?: (message: string) => void;

  className?: string;
};

type FileValidationResult = {
  validFiles: File[];
  error: string | null;
};

function normalizeMimeType(value: string): string {
  return value.trim().toLowerCase();
}

function getFileExtension(fileName: string): string {
  const extension = fileName
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();

  return extension ? `.${extension}` : "";
}

function getAcceptedExtensions(
  accept: string
): string[] {
  return accept
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.startsWith("."));
}

export function formatDocumentFileSize(
  size?: number | null
): string {
  if (
    typeof size !== "number" ||
    Number.isNaN(size) ||
    size < 0
  ) {
    return "";
  }

  if (size < 1024) {
    return `${size} octet${size > 1 ? "s" : ""}`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} Ko`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

export function isSameDocumentFile(
  firstFile: File,
  secondFile: File
): boolean {
  return (
    firstFile.name === secondFile.name &&
    firstFile.size === secondFile.size &&
    firstFile.lastModified === secondFile.lastModified
  );
}

export function validateDocumentFiles({
  selectedFiles,
  currentFiles = [],
  existingDocumentsCount = 0,
  maxFiles = DEFAULT_MAX_DOCUMENTS,
  maxFileSize = DEFAULT_MAX_DOCUMENT_SIZE,
  acceptedMimeTypes = DEFAULT_ACCEPTED_DOCUMENT_TYPES,
  accept = DEFAULT_ACCEPTED_DOCUMENT_EXTENSIONS,
}: {
  selectedFiles: File[];
  currentFiles?: File[];
  existingDocumentsCount?: number;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedMimeTypes?: string[];
  accept?: string;
}): FileValidationResult {
  const normalizedAcceptedMimeTypes =
    acceptedMimeTypes.map(normalizeMimeType);

  const acceptedExtensions =
    getAcceptedExtensions(accept);

  if (selectedFiles.length === 0) {
    return {
      validFiles: [],
      error: null,
    };
  }

  const totalFiles =
    currentFiles.length +
    existingDocumentsCount +
    selectedFiles.length;

  if (totalFiles > maxFiles) {
    return {
      validFiles: [],
      error: `Vous pouvez ajouter au maximum ${maxFiles} document${
        maxFiles > 1 ? "s" : ""
      }.`,
    };
  }

  const duplicateFile = selectedFiles.find(
    (selectedFile) =>
      currentFiles.some((currentFile) =>
        isSameDocumentFile(
          selectedFile,
          currentFile
        )
      )
  );

  if (duplicateFile) {
    return {
      validFiles: [],
      error: `Le fichier « ${duplicateFile.name} » a déjà été ajouté.`,
    };
  }

  const duplicatedSelection =
    selectedFiles.find(
      (selectedFile, selectedIndex) =>
        selectedFiles.some(
          (comparedFile, comparedIndex) =>
            selectedIndex !== comparedIndex &&
            isSameDocumentFile(
              selectedFile,
              comparedFile
            )
        )
    );

  if (duplicatedSelection) {
    return {
      validFiles: [],
      error: `Le fichier « ${duplicatedSelection.name} » apparaît plusieurs fois dans la sélection.`,
    };
  }

  const oversizedFile = selectedFiles.find(
    (file) => file.size > maxFileSize
  );

  if (oversizedFile) {
    return {
      validFiles: [],
      error: `Le fichier « ${
        oversizedFile.name
      } » dépasse la taille maximale de ${formatDocumentFileSize(
        maxFileSize
      )}.`,
    };
  }

  const invalidTypeFile = selectedFiles.find(
    (file) => {
      const mimeType =
        normalizeMimeType(file.type);

      const extension =
        getFileExtension(file.name);

      const mimeTypeAccepted =
        mimeType &&
        normalizedAcceptedMimeTypes.includes(
          mimeType
        );

      const extensionAccepted =
        acceptedExtensions.includes(extension);

      return (
        !mimeTypeAccepted &&
        !extensionAccepted
      );
    }
  );

  if (invalidTypeFile) {
    return {
      validFiles: [],
      error: `Le fichier « ${invalidTypeFile.name} » n’est pas accepté. Formats autorisés : PDF, JPG, JPEG, PNG et WEBP.`,
    };
  }

  const emptyFile = selectedFiles.find(
    (file) => file.size === 0
  );

  if (emptyFile) {
    return {
      validFiles: [],
      error: `Le fichier « ${emptyFile.name} » est vide.`,
    };
  }

  return {
    validFiles: selectedFiles,
    error: null,
  };
}

function getDocumentIcon(
  mimeType?: string | null,
  fileName?: string
) {
  const normalizedMimeType =
    normalizeMimeType(mimeType ?? "");

  const extension = getFileExtension(
    fileName ?? ""
  );

  if (
    normalizedMimeType ===
      "application/pdf" ||
    extension === ".pdf"
  ) {
    return FileText;
  }

  if (
    normalizedMimeType.startsWith(
      "image/"
    ) ||
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ].includes(extension)
  ) {
    return FileImage;
  }

  return FileCheck2;
}

function getStatusLabel(
  status?: ExistingDocument["status"]
): {
  label: string;
  className: string;
} | null {
  if (status === "approved") {
    return {
      label: "Validé",
      className:
        "bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "rejected") {
    return {
      label: "Refusé",
      className:
        "bg-red-50 text-red-700",
    };
  }

  if (status === "pending") {
    return {
      label: "En attente",
      className:
        "bg-amber-50 text-amber-700",
    };
  }

  return null;
}

export default function DocumentUploader({
  files,
  onFilesChange,
  existingDocuments = [],
  onRemoveExistingDocument,
  label = "Documents",
  description = "Ajoutez vos documents au format PDF ou image.",
  inputName = "documents[]",
  accept = DEFAULT_ACCEPTED_DOCUMENT_EXTENSIONS,
  acceptedMimeTypes = DEFAULT_ACCEPTED_DOCUMENT_TYPES,
  maxFiles = DEFAULT_MAX_DOCUMENTS,
  maxFileSize = DEFAULT_MAX_DOCUMENT_SIZE,
  required = false,
  disabled = false,
  loading = false,
  error = "",
  onError,
  className = "",
}: DocumentUploaderProps) {
  const inputId = useId();

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [dragging, setDragging] =
    useState(false);

  const [
    removingDocumentId,
    setRemovingDocumentId,
  ] = useState<string | number | null>(
    null
  );

  const totalFilesCount =
    files.length +
    existingDocuments.length;

  const maximumReached =
    totalFilesCount >= maxFiles;

  const uploaderDisabled =
    disabled || loading || maximumReached;

  const totalNewFilesSize = useMemo(
    () =>
      files.reduce(
        (total, file) =>
          total + file.size,
        0
      ),
    [files]
  );

  function clearError(): void {
    onError?.("");
  }

  function addFiles(
    selectedFiles: File[]
  ): void {
    clearError();

    const validation =
      validateDocumentFiles({
        selectedFiles,
        currentFiles: files,
        existingDocumentsCount:
          existingDocuments.length,
        maxFiles,
        maxFileSize,
        acceptedMimeTypes,
        accept,
      });

    if (validation.error) {
      onError?.(validation.error);
      return;
    }

    onFilesChange([
      ...files,
      ...validation.validFiles,
    ]);
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    event.target.value = "";

    addFiles(selectedFiles);
  }

  function removeNewFile(
    indexToRemove: number
  ): void {
    onFilesChange(
      files.filter(
        (_, index) =>
          index !== indexToRemove
      )
    );

    clearError();
  }

  async function removeExistingDocument(
    document: ExistingDocument
  ): Promise<void> {
    if (
      !onRemoveExistingDocument ||
      disabled ||
      loading
    ) {
      return;
    }

    clearError();

    setRemovingDocumentId(document.id);

    try {
      await onRemoveExistingDocument(
        document
      );
    } catch (removeError) {
      onError?.(
        removeError instanceof Error
          ? removeError.message
          : "Le document n’a pas pu être supprimé."
      );
    } finally {
      setRemovingDocumentId(null);
    }
  }

  function handleDragEnter(
    event: DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (!uploaderDisabled) {
      setDragging(true);
    }
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (!uploaderDisabled) {
      event.dataTransfer.dropEffect =
        "copy";
      setDragging(true);
    }
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null
      )
    ) {
      return;
    }

    setDragging(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    if (uploaderDisabled) {
      return;
    }

    const droppedFiles = Array.from(
      event.dataTransfer.files ?? []
    );

    addFiles(droppedFiles);
  }

  function openFileDialog(): void {
    if (uploaderDisabled) {
      return;
    }

    inputRef.current?.click();
  }

  function handleUploaderKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ): void {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openFileDialog();
    }
  }

  return (
    <div
      className={`space-y-4 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor={inputId}
            className="text-sm font-black text-slate-800"
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500">
                *
              </span>
            )}
          </label>

          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500">
          {totalFilesCount}/{maxFiles}{" "}
          document
          {totalFilesCount > 1
            ? "s"
            : ""}

          {totalNewFilesSize > 0 && (
            <>
              {" "}
              ·{" "}
              {formatDocumentFileSize(
                totalNewFilesSize
              )}
            </>
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={
          uploaderDisabled ? -1 : 0
        }
        aria-disabled={uploaderDisabled}
        aria-describedby={`${inputId}-help`}
        onClick={openFileDialog}
        onKeyDown={
          handleUploaderKeyDown
        }
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${
          uploaderDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
            : dragging
            ? "cursor-copy border-[var(--brand)] bg-amber-50"
            : "cursor-pointer border-slate-300 bg-white hover:border-[var(--brand)] hover:bg-amber-50/40"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={inputName}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelection}
          disabled={uploaderDisabled}
          className="sr-only"
        />

        <span
          className={`grid h-14 w-14 place-items-center rounded-2xl ${
            dragging
              ? "bg-[var(--brand)] text-[var(--ink)]"
              : "bg-slate-100 text-[var(--ink)]"
          }`}
        >
          {loading ? (
            <LoaderCircle
              size={25}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : dragging ? (
            <UploadCloud
              size={25}
              aria-hidden="true"
            />
          ) : (
            <FileUp
              size={25}
              aria-hidden="true"
            />
          )}
        </span>

        <strong className="mt-4 text-sm font-black text-[var(--ink)]">
          {maximumReached
            ? "Nombre maximum de documents atteint"
            : dragging
            ? "Déposez les fichiers ici"
            : "Ajouter des documents"}
        </strong>

        {!maximumReached && (
          <span
            id={`${inputId}-help`}
            className="mt-2 max-w-md text-xs font-medium leading-5 text-slate-500"
          >
            Cliquez ou glissez-déposez vos
            fichiers ici. PDF, JPG, PNG ou
            WEBP, avec une taille maximale de{" "}
            {formatDocumentFileSize(
              maxFileSize
            )}{" "}
            par fichier.
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold leading-5 text-red-700"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <span>{error}</span>
        </div>
      )}

      {existingDocuments.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
            Documents déjà enregistrés
          </h3>

          <ul className="grid gap-2">
            {existingDocuments.map(
              (document) => {
                const DocumentIcon =
                  getDocumentIcon(
                    document.mime_type,
                    document.name
                  );

                const status =
                  getStatusLabel(
                    document.status
                  );

                const removing =
                  removingDocumentId ===
                  document.id;

                return (
                  <li
                    key={document.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                      <DocumentIcon
                        size={20}
                        aria-hidden="true"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      {document.url ? (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-xs font-black text-slate-800 hover:underline"
                        >
                          {document.name}
                        </a>
                      ) : (
                        <p className="truncate text-xs font-black text-slate-800">
                          {document.name}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {document.size ? (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatDocumentFileSize(
                              document.size
                            )}
                          </span>
                        ) : null}

                        {status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {onRemoveExistingDocument && (
                      <button
                        type="button"
                        onClick={() =>
                          void removeExistingDocument(
                            document
                          )
                        }
                        disabled={
                          disabled ||
                          loading ||
                          removing
                        }
                        aria-label={`Supprimer ${document.name}`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {removing ? (
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2
                            size={17}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )}
                  </li>
                );
              }
            )}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
            Nouveaux documents
          </h3>

          <ul className="grid gap-2">
            {files.map((file, index) => {
              const DocumentIcon =
                getDocumentIcon(
                  file.type,
                  file.name
                );

              return (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <DocumentIcon
                      size={20}
                      aria-hidden="true"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-800">
                      {file.name}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDocumentFileSize(
                          file.size
                        )}
                      </span>

                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                        <CheckCircle2
                          size={11}
                          aria-hidden="true"
                        />

                        Prêt
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeNewFile(index)
                    }
                    disabled={
                      disabled || loading
                    }
                    aria-label={`Supprimer ${file.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2
                      size={17}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
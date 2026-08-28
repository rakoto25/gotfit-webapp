"use client";

import type { ReactNode } from "react";

import {
  Loader2,
  LogOut,
  Play,
  Square,
  Video,
} from "lucide-react";

export type VisioControlAction =
  | ""
  | "start"
  | "join"
  | "reserve"
  | "end";

type VisioControlsProps = {
  canStart?: boolean;
  canJoin?: boolean;
  canEnd?: boolean;

  inRoom?: boolean;

  busyAction?: VisioControlAction;

  onStart?: () => void | Promise<void>;
  onJoin?: () => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
  onLeave?: () => void;

  className?: string;
};

type ControlButtonProps = {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  icon: ReactNode;
  className: string;
  onClick?: () => void | Promise<void>;
};

function ControlButton({
  label,
  loadingLabel,
  loading,
  disabled,
  icon,
  className,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (onClick) {
          void onClick();
        }
      }}
      className={className}
    >
      {loading ? (
        <Loader2
          size={16}
          className="animate-spin"
        />
      ) : (
        icon
      )}

      {loading
        ? loadingLabel
        : label}
    </button>
  );
}

export default function VisioControls({
  canStart = false,
  canJoin = false,
  canEnd = false,
  inRoom = false,
  busyAction = "",
  onStart,
  onJoin,
  onEnd,
  onLeave,
  className = "",
}: VisioControlsProps) {
  const busy =
    busyAction !== "";

  const hasControls =
    canStart ||
    canJoin ||
    canEnd ||
    (inRoom && Boolean(onLeave));

  if (!hasControls) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap gap-3 ${className}`}
    >
      {inRoom && onLeave && (
        <ControlButton
          label="Quitter la salle"
          loadingLabel="Déconnexion..."
          loading={false}
          disabled={busy}
          onClick={onLeave}
          icon={<LogOut size={16} />}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
        />
      )}

      {!inRoom && canStart && (
        <ControlButton
          label="Démarrer la séance"
          loadingLabel="Démarrage..."
          loading={
            busyAction === "start"
          }
          disabled={busy}
          onClick={onStart}
          icon={<Play size={16} />}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        />
      )}

      {!inRoom && canJoin && (
        <ControlButton
          label="Rejoindre la visio"
          loadingLabel="Connexion..."
          loading={
            busyAction === "join"
          }
          disabled={busy}
          onClick={onJoin}
          icon={<Video size={16} />}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
        />
      )}

      {canEnd && (
        <ControlButton
          label={
            inRoom
              ? "Terminer pour tous"
              : "Terminer la séance"
          }
          loadingLabel="Fermeture..."
          loading={
            busyAction === "end"
          }
          disabled={busy}
          onClick={onEnd}
          icon={<Square size={16} />}
          className={
            inRoom
              ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              : "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          }
        />
      )}
    </div>
  );
}
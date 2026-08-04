"use client";

import ParticipantCard from "@/components/visio/ParticipantCard";
import type { VisioParticipant } from "@/lib/visio";
import type { ApiId } from "@/types/auth";

type VisioParticipantsProps = {
  participants: VisioParticipant[];
  currentUserId?: ApiId | null;
  isOrganizer?: boolean;
  showPaymentStatus?: boolean;
  emptyMessage?: string;
};

export default function VisioParticipants({
  participants,
  currentUserId = null,
  isOrganizer = false,
  showPaymentStatus = true,
  emptyMessage = "Les coachés seront ajoutés automatiquement après leur réservation et leur paiement.",
}: VisioParticipantsProps) {
  if (participants.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {participants.map((participant) => (
        <ParticipantCard
          key={`${String(participant.id)}-${String(
            participant.user_id,
          )}`}
          participant={participant}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          showPaymentStatus={showPaymentStatus}
        />
      ))}
    </div>
  );
}
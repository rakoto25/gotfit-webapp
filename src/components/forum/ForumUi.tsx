"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AtSign, Bell, Heart, Lightbulb, Loader2, PartyPopper, ThumbsUp } from "lucide-react";

import {
  type CoachForumAuthor,
  type ForumChannel,
  type ForumReaction,
  forumInitials,
  searchForumCoaches,
} from "@/lib/coach-forum";

export function ForumAvatar({ author, size = "md" }: { author?: CoachForumAuthor | null; size?: "sm" | "md" }) {
  const image = author?.photo_url || author?.google_avatar_url || author?.photo;
  const classes = size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";

  if (image) {
    // L'API peut renvoyer un domaine média configurable à l'exécution.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`${classes} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${classes} grid shrink-0 place-items-center rounded-full bg-orange-100 font-black text-orange-700`}>
      {forumInitials(author?.name)}
    </span>
  );
}

export function ChannelNav({ channels, selected, onSelect }: {
  channels: ForumChannel[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav aria-label="Canaux du forum" className="grid gap-2">
      <button type="button" onClick={() => onSelect("")} className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition ${!selected ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-orange-50"}`}>
        Toutes les discussions
      </button>
      {channels.map((channel) => (
        <button key={channel.id} type="button" onClick={() => onSelect(channel.slug)} className={`rounded-2xl border px-4 py-3 text-left transition ${selected === channel.slug ? "border-orange-300 bg-orange-50" : "border-transparent bg-white hover:border-orange-100"}`}>
          <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-900">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: channel.color || "#ea580c" }} />
              <span className="truncate">{channel.name}</span>
            </span>
            <span className="text-xs text-slate-400">{channel.discussions_count || 0}</span>
          </span>
          {channel.description && <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{channel.description}</span>}
        </button>
      ))}
    </nav>
  );
}

const reactions: { type: ForumReaction; label: string; icon: typeof ThumbsUp }[] = [
  { type: "like", label: "J’aime", icon: ThumbsUp },
  { type: "love", label: "J’adore", icon: Heart },
  { type: "helpful", label: "Utile", icon: Lightbulb },
  { type: "celebrate", label: "Bravo", icon: PartyPopper },
];

export function ReactionBar({ counts = {}, active, onReact, compact = false }: {
  counts?: Partial<Record<ForumReaction, number>>;
  active?: ForumReaction | null;
  onReact: (type: ForumReaction) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Réactions">
      {reactions.map(({ type, label, icon: Icon }) => (
        <button key={type} type="button" onClick={() => onReact(type)} aria-pressed={active === type} title={label} className={`inline-flex items-center gap-1.5 rounded-full border font-black transition ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"} ${active === type ? "border-orange-300 bg-orange-100 text-orange-800" : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-700"}`}>
          <Icon size={compact ? 13 : 15} />
          {!compact && label}
          {Number(counts[type] || 0) > 0 && <span>{counts[type]}</span>}
        </button>
      ))}
    </div>
  );
}

export function MentionComposer({ value, onChange, mentionIds, onMentionIdsChange, placeholder, rows = 4, id }: {
  value: string;
  onChange: (value: string) => void;
  mentionIds: number[];
  onMentionIdsChange: (ids: number[]) => void;
  placeholder: string;
  rows?: number;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coaches, setCoaches] = useState<CoachForumAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setCoaches(await searchForumCoaches(query));
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  function addMention(coach: CoachForumAuthor) {
    const token = `@${coach.name}`;
    if (!value.includes(token)) onChange(`${value}${value.trim() ? " " : ""}${token} `);
    onMentionIdsChange([...new Set([...mentionIds, coach.id])]);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={rows} maxLength={10000} placeholder={placeholder} className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-orange-400 focus:bg-white" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-50">
          <AtSign size={15} /> Mentionner un coach
        </button>
        <span className="text-xs font-bold text-slate-400">{value.length}/10 000</span>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un coach validé" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-400" />
          <div className="mt-2 max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-xs font-bold text-slate-500"><Loader2 className="animate-spin" size={15} /> Recherche…</div>
            ) : coaches.length ? coaches.map((coach) => (
              <button key={coach.id} type="button" onClick={() => addMention(coach)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-orange-50">
                <ForumAvatar author={coach} size="sm" />
                <span><strong className="block text-sm">{coach.name}</strong><small className="text-slate-500">{coach.coach_title || "Coach GotFit"}</small></span>
              </button>
            )) : <p className="p-3 text-xs font-semibold text-slate-500">Aucun coach trouvé.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function ForumTopLinks({ unreadCount = 0, admin = false }: { unreadCount?: number; admin?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/forum-coachs/notifications" className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15">
        <Bell size={16} /> Notifications
        {unreadCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px]">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </Link>
      {admin && <Link href="/admin/forum" className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600">Modération</Link>}
    </div>
  );
}

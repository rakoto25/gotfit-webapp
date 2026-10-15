"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, MessageCircle, Trash2 } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getToken } from "@/lib/auth";
import {
  AppNotification,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/marketplace";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await fetchNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/notifications")}`);
      return;
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  async function openNotification(item: AppNotification) {
    try {
      if (!item.read_at) {
        await markNotificationRead(item.id);
        setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      router.push(item.data?.url || "/profile");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible d’ouvrir la notification.");
    }
  }

  async function markAll() {
    try {
      setBusy(true);
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de marquer les notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: AppNotification) {
    try {
      await deleteNotification(item.id);
      setNotifications((current) => current.filter((entry) => entry.id !== item.id));
      if (!item.read_at) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de supprimer la notification.");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-28 pt-32 text-slate-950 lg:pb-16">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300"><Bell size={16} /> Centre de notifications</span>
                <h1 className="mt-3 text-4xl font-black">Vos alertes Gotfit</h1>
                <p className="mt-2 text-sm font-semibold text-slate-300">{unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}</p>
              </div>
              <button type="button" onClick={() => void markAll()} disabled={!unreadCount || busy} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black disabled:opacity-50">
                {busy ? <Loader2 className="animate-spin" size={17} /> : <CheckCheck size={17} />} Tout marquer comme lu
              </button>
            </div>
          </section>

          {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

          <section className="mt-6 grid gap-3">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-[2rem] bg-white py-16 font-black text-orange-700"><Loader2 className="animate-spin" /> Chargement…</div>
            ) : notifications.length ? notifications.map((item) => (
              <article key={item.id} className={`flex items-start gap-3 rounded-[1.6rem] border p-4 shadow-sm ${item.read_at ? "border-transparent bg-white" : "border-orange-200 bg-orange-50"}`}>
                <button type="button" onClick={() => void openNotification(item)} className="flex min-w-0 flex-1 items-start gap-4 text-left">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.data?.type === "message" ? "bg-orange-600 text-white" : "bg-slate-950 text-white"}`}>
                    {item.data?.type === "message" ? <MessageCircle size={19} /> : <Bell size={19} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-black">{item.data?.title || "Notification Gotfit"}</strong>
                    {item.data?.body && <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">{item.data.body}</span>}
                    <small className="mt-2 block font-bold text-slate-400">{formatDate(item.created_at)}</small>
                  </span>
                  {!item.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-600" />}
                </button>
                <button type="button" onClick={() => void remove(item)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Supprimer la notification">
                  <Trash2 size={17} />
                </button>
              </article>
            )) : (
              <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
                <Bell className="mx-auto text-orange-600" size={40} />
                <h2 className="mt-4 text-2xl font-black">Aucune notification</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">Les nouveaux messages et changements importants apparaîtront ici.</p>
                <Link href="/annonces" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">Explorer Gotfit</Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

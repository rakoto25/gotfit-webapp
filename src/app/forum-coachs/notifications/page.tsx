"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, Loader2 } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ForumAvatar } from "@/components/forum/ForumUi";
import {
  type ForumNotification,
  fetchForumNotifications,
  formatForumDate,
  getForumError,
  markAllForumNotificationsRead,
  markForumNotificationRead,
} from "@/lib/coach-forum";
import { getCurrentUser, getToken, isAdmin, isCoach } from "@/lib/auth";

export default function ForumNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const user = getCurrentUser();
      if (!getToken()) {
        router.replace("/auth/login?redirect=%2Fforum-coachs%2Fnotifications");
        return;
      }
      if (!isCoach(user) && !isAdmin(user)) {
        setError("Cet espace est réservé aux coachs validés.");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchForumNotifications();
        setNotifications(data.notifications);
        setUnread(data.unreadCount);
      } catch (loadError) {
        setError(getForumError(loadError, "Impossible de charger les notifications."));
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  async function openNotification(notification: ForumNotification) {
    if (!notification.read_at) {
      await markForumNotificationRead(notification.id);
      setUnread((current) => Math.max(0, current - 1));
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    }
    if (notification.url) router.push(notification.url);
  }

  async function markAll() {
    try {
      setBusy(true);
      await markAllForumNotificationsRead();
      setUnread(0);
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch (requestError) {
      setError(getForumError(requestError, "Impossible de marquer les notifications."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fff7ed] px-4 pb-24 pt-32 text-slate-950 sm:pt-36">
        <div className="mx-auto max-w-4xl">
          <Link href="/forum-coachs" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm"><ArrowLeft size={16} /> Retour au forum</Link>
          <section className="mt-5 rounded-[2.5rem] bg-slate-950 p-7 text-white sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300"><Bell size={16} /> Activité du forum</span><h1 className="mt-3 text-4xl font-black">Notifications</h1><p className="mt-2 text-sm font-semibold text-slate-300">{unread} notification{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}</p></div>
              <button type="button" disabled={!unread || busy} onClick={() => void markAll()} className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <CheckCheck size={17} />} Tout marquer comme lu</button>
            </div>
          </section>
          {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          <section className="mt-5 grid gap-3">
            {loading ? <div className="flex items-center justify-center gap-2 rounded-[2rem] bg-white py-16 text-sm font-black text-orange-700"><Loader2 className="animate-spin" /> Chargement…</div> : notifications.length ? notifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`flex w-full items-start gap-4 rounded-[1.7rem] border p-5 text-left shadow-sm transition hover:border-orange-200 ${notification.read_at ? "border-transparent bg-white" : "border-orange-200 bg-orange-50"}`}>
                <ForumAvatar author={notification.actor} size="sm" />
                <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-950">{notification.title}</strong>{notification.body && <span className="mt-1 line-clamp-2 block text-sm font-medium leading-6 text-slate-600">{notification.body}</span>}<small className="mt-2 block font-bold text-slate-400">{formatForumDate(notification.created_at)}</small></span>
                {!notification.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />}
              </button>
            )) : <div className="rounded-[2rem] bg-white p-10 text-center"><Bell className="mx-auto text-orange-500" size={34} /><h2 className="mt-3 text-xl font-black">Tout est calme</h2><p className="mt-2 text-sm font-semibold text-slate-500">Les mentions et nouvelles réponses apparaîtront ici.</p></div>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

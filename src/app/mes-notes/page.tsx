"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LockKeyhole, NotebookPen, Pin, UserRound } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentUser, getToken, hasRole } from "@/lib/auth";
import { fetchClientNotes, type ClientNote } from "@/lib/client-journey";
import { formatDate } from "@/lib/marketplace";

export default function MySharedNotesPage() {
  const user = useMemo(() => getCurrentUser(), []);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadNotes() {
      try {
        if (!getToken() || !user) throw new Error("Connectez-vous pour consulter vos notes.");
        if (!hasRole(user, "client")) throw new Error("Cet espace est réservé aux comptes clients.");
        const items = await fetchClientNotes(user.id);
        if (mounted) setNotes(items.filter((note) => note.visibility === "shared"));
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "Impossible de charger vos notes.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadNotes();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-20 pt-36 text-slate-950">
        <div className="mx-auto max-w-5xl">
          <Link href="/client/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-orange-700 shadow-sm"><ArrowLeft size={17} />Tableau de bord</Link>
          <section className="mt-6 rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-200"><NotebookPen size={16} />Mon suivi</span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Notes de mes coachs</h1>
            <p className="mt-4 max-w-2xl font-semibold leading-8 text-slate-300">Seules les notes que vos coachs ont choisi de partager avec vous apparaissent ici.</p>
          </section>

          {loading ? (
            <div className="mt-6 rounded-[2rem] bg-white p-10 text-center font-black text-orange-700">Chargement des notes...</div>
          ) : error ? (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">{error}</div>
          ) : notes.length ? (
            <div className="mt-6 grid gap-5">
              {notes.map((note) => (
                <article key={note.id} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700"><UserRound size={15} />{note.author?.name || note.intervenant?.name || "Votre coach"}</div>
                      <h2 className="mt-3 text-2xl font-black">{note.title || "Note de suivi"}</h2>
                    </div>
                    {note.is_pinned && <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700"><Pin size={14} />Épinglée</span>}
                  </div>
                  <p className="mt-5 whitespace-pre-line font-semibold leading-8 text-slate-600">{note.content}</p>
                  <p className="mt-5 text-xs font-bold text-slate-400">Partagée le {formatDate(note.created_at)}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] bg-white p-10 text-center shadow-sm"><LockKeyhole className="mx-auto text-orange-500" size={36} /><h2 className="mt-4 text-2xl font-black">Aucune note partagée</h2><p className="mt-2 font-semibold text-slate-500">Vos coachs peuvent partager une note avec vous depuis votre parcours client.</p></div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

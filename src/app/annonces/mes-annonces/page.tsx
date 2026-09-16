"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getStoredAuth, isCoach } from "@/lib/auth";
import { type Annonce, fetchMyAnnonces, formatMoney, getAnnonceTitle } from "@/lib/marketplace";

export default function MyAnnouncementsPage() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [createUrl, setCreateUrl] = useState("/annonces/nouvelle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const auth = getStoredAuth();
      if (!auth) {
        router.replace("/auth/login?redirect=%2Fannonces%2Fmes-annonces");
        return;
      }
      setCreateUrl(isCoach(auth.user) ? "/intervenant/annonces/nouvelle" : "/annonces/nouvelle");
      try { const items = await fetchMyAnnonces(); if (active) setAnnonces(items); }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { if (active) setLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [router]);
  return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-32">
    <h1 className="text-3xl font-black">Mes annonces</h1>
    <p className="my-4 text-[var(--muted)]">Retrouvez et modifiez vos annonces, y compris celles en attente de validation.</p>
    <Link className="gotfit-button gotfit-button-dark mb-6" href={createUrl}>Créer une annonce</Link>
    {loading && <p role="status">Chargement…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !annonces.length && <p>Vous n’avez pas encore publié d’annonce.</p>}
    <div className="grid gap-4">{annonces.map(a => <article key={a.id} className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <h2 className="break-words text-xl font-bold">{getAnnonceTitle(a)}</h2>
      <p className="my-3">{a.price == null ? "Tarif à préciser" : formatMoney(a.price)} · {a.status === "valide" ? "Publiée" : a.status === "refuse" ? "Refusée" : "En attente de validation"}</p>
      <div className="flex flex-wrap gap-4"><Link className="font-bold underline" href={`/annonces/${a.id}`}>Voir</Link>
      <Link className="font-bold underline" href={`/annonces/${a.id}/modifier`}>Modifier</Link></div>
    </article>)}</div>
  </main><Footer /></>;
}

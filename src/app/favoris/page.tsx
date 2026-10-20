"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Loader2, MapPin, UserRound } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getCurrentUser, getToken, hasRole } from "@/lib/auth";
import { fetchCoachFavorites, type CoachFavorite } from "@/lib/coach-favorites";
import {
  getCoachSpeciality,
  getIntervenantName,
  getIntervenantPhoto,
  getLocation,
} from "@/lib/intervenants";

export default function CoachFavoritesPage() {
  const [favorites, setFavorites] = useState<CoachFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      try {
        if (!getToken()) {
          throw new Error("Connectez-vous pour retrouver vos coachs favoris.");
        }
        if (!hasRole(getCurrentUser(), "client")) {
          throw new Error("Les favoris de coach sont réservés aux comptes clients.");
        }

        const items = await fetchCoachFavorites();
        if (mounted) setFavorites(items.filter((item) => Boolean(item.coach)));
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Impossible de charger vos favoris.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadFavorites();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFF7ED] px-4 pb-20 pt-36 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-200">
              <Heart className="fill-rose-400" size={16} /> Mes favoris
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Mes coachs favoris</h1>
            <p className="mt-4 max-w-2xl font-semibold leading-8 text-slate-300">
              Retrouvez ici les coachs que vous avez enregistrés pour les contacter ou réserver plus tard.
            </p>
          </section>

          {loading ? (
            <div className="mt-6 flex justify-center rounded-[2rem] bg-white py-16 font-black text-orange-700">
              <Loader2 className="mr-3 animate-spin" /> Chargement des favoris...
            </div>
          ) : error ? (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">
              {error}
              {!getToken() && (
                <Link href="/auth/login?redirect=%2Ffavoris" className="ml-2 underline">Se connecter</Link>
              )}
            </div>
          ) : favorites.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => {
                const coach = favorite.coach!;
                const photo = getIntervenantPhoto(coach);
                return (
                  <article key={favorite.id} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-3xl bg-orange-100 text-orange-700">
                        {photo ? <img src={photo} alt={getIntervenantName(coach)} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><UserRound size={34} /></div>}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-black">{getIntervenantName(coach)}</h2>
                        <p className="mt-1 text-sm font-bold text-orange-700">{getCoachSpeciality(coach)}</p>
                      </div>
                    </div>
                    <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-500"><MapPin size={16} />{getLocation(coach)}</p>
                    <Link href={`/intervenants/${coach.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white">
                      Voir le profil <ArrowRight size={17} />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] bg-white p-10 text-center shadow-sm">
              <Heart className="mx-auto text-rose-400" size={36} />
              <h2 className="mt-4 text-2xl font-black">Aucun coach favori</h2>
              <p className="mt-2 font-semibold text-slate-500">Ajoutez un coach depuis sa fiche avec le bouton cœur.</p>
              <Link href="/intervenants" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white">Découvrir les coachs <ArrowRight size={17} /></Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

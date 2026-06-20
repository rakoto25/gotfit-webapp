"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  UserRound,
  LogIn,
  Search,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/types/auth";

const navLinks = [
  {
    label: "Accueil",
    href: "/",
  },
  {
    label: "Services",
    href: "/services",
  },
  {
    label: "Intervenants",
    href: "/intervenants",
  },
  {
    label: "Comment ça marche",
    href: "/#fonctionnement",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

const LOGO_URL = "http://187.77.181.212/images/logo.png";
const PROFILE_URL = "/profile";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <>
      <header className="fixed left-0 right-0 top-4 z-50 px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/85 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <Link href="/" className="flex items-center">
            <img
              src={LOGO_URL}
              alt="Logo Gotfit"
              className="h-auto w-[120px] max-w-full object-contain sm:w-[135px]"
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-slate-50 p-1 lg:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link
                href={PROFILE_URL}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <UserRound size={18} />
                Mon profil
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950"
                >
                  <LogIn size={18} />
                  Connexion
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  S’inscrire
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm lg:hidden">
          <div className="ml-auto flex h-full w-[88%] max-w-sm flex-col bg-[#FAF8F3] p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center"
              >
                <img
                  src={LOGO_URL}
                  alt="Logo Gotfit"
                  className="h-auto w-[135px] max-w-full object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 rounded-[2rem] bg-white p-4 shadow-sm">
              <div className="mb-4 rounded-[1.5rem] bg-gradient-to-br from-emerald-50 to-orange-50 p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                  <Sparkles size={22} />
                </div>

                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  Réserve ton prochain accompagnement bien-être.
                </h3>
              </div>

              <div className="grid gap-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.label}
                    <span className="text-slate-300">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-2 rounded-[1.6rem] bg-white p-2 shadow-sm">
              <Link
                href="/services"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 py-3 text-xs font-bold text-slate-600"
              >
                <Search size={18} />
                Chercher
              </Link>

              <Link
                href={user ? PROFILE_URL : "/auth/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white"
              >
                <CalendarCheck size={18} />
                Réserver
              </Link>

              <Link
                href={user ? PROFILE_URL : "/auth/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 py-3 text-xs font-bold text-slate-600"
              >
                {user ? <UserRound size={18} /> : <LogIn size={18} />}
                {user ? "Profil" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-3 gap-2 rounded-[1.7rem] border border-white/80 bg-white/90 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl lg:hidden">
        <Link
          href="/services"
          className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[11px] font-bold text-slate-500"
        >
          <Search size={18} />
          Services
        </Link>

        <Link
          href={user ? PROFILE_URL : "/auth/login"}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950 py-3 text-[11px] font-bold text-white"
        >
          <CalendarCheck size={18} />
          Réserver
        </Link>

        <Link
          href={user ? PROFILE_URL : "/auth/login"}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[11px] font-bold text-slate-500"
        >
          {user ? <UserRound size={18} /> : <LogIn size={18} />}
          {user ? "Profil" : "Login"}
        </Link>
      </nav>
    </>
  );
}
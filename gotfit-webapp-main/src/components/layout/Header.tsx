"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  LogIn,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/api-config";
import type { User } from "@/types/auth";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Annonces", href: "/annonces" },
  { label: "Intervenants", href: "/intervenants" },
  { label: "Parcours", href: "/parcours-client" },
  { label: "Visio", href: "/visio" },
  { label: "Planning", href: "/planning" },
  { label: "Comment ça marche", href: "/#fonctionnement" },
  { label: "Contact", href: "/contact" },
];

const PROFILE_URL = "/profile";
const MESSAGES_URL = "/messages";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getCurrentUser());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#eadfce]/80 bg-[#fffaf0]/92 px-4 py-3 shadow-[0_18px_55px_rgba(33,23,11,0.08)] backdrop-blur-2xl">
        <div className="flex w-full items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src={LOGO_URL}
              alt="Logo Gotfit"
              className="h-auto w-[118px] object-contain xl:w-[138px]"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            <div className="flex items-center gap-1 rounded-full border border-[#eadfce] bg-white/75 p-1 shadow-inner shadow-[#21170b]/[0.03]">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-extrabold text-[#4b3820] transition hover:bg-[#fff3d6] hover:text-[#b9872b] 2xl:px-4 2xl:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            {user ? (
              <>
                <Link
                  href={MESSAGES_URL}
                  className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2.5 text-sm font-extrabold text-[#21170b] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9872b]/45 hover:bg-[#fff8e9]"
                >
                  <MessageCircle size={17} />
                  Messages
                </Link>

                <Link
                  href={PROFILE_URL}
                  className="inline-flex items-center gap-2 rounded-full bg-[#21170b] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(33,23,11,0.20)] transition hover:-translate-y-0.5 hover:bg-[#3a2812]"
                >
                  <UserRound size={17} />
                  Mon profil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2.5 text-sm font-extrabold text-[#21170b] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9872b]/45 hover:bg-[#fff8e9]"
                >
                  <LogIn size={17} />
                  Connexion
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex items-center rounded-full bg-[#21170b] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(33,23,11,0.20)] transition hover:-translate-y-0.5 hover:bg-[#3a2812]"
                >
                  S’inscrire
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#21170b] text-white shadow-lg shadow-[#21170b]/15 xl:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] bg-[#21170b]/45 backdrop-blur-sm xl:hidden">
          <div className="ml-auto flex h-full w-[90%] max-w-sm flex-col bg-[#fffaf0] p-5 shadow-2xl">
            <div className="mb-7 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center"
              >
                <img
                  src={LOGO_URL}
                  alt="Logo Gotfit"
                  className="h-auto w-[138px] object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#21170b] shadow-sm"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 rounded-[1.6rem] border border-[#eadfce] bg-white p-4 shadow-sm">
              <div className="mb-4 rounded-[1.35rem] bg-[#fff3d6] p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
                  <Sparkles size={21} />
                </div>

                <h3 className="text-lg font-black leading-tight tracking-tight text-[#21170b]">
                  Réserve ton prochain accompagnement bien-être.
                </h3>
              </div>

              <div className="grid gap-1.5">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-extrabold text-[#4b3820] transition hover:bg-[#fff8e9] hover:text-[#b9872b]"
                  >
                    {item.label}
                    <span className="text-[#c8ad7d]">→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-4 gap-2 rounded-[1.5rem] border border-[#eadfce] bg-white p-2 shadow-sm">
              <Link
                href="/services"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#fff8e9] py-3 text-[11px] font-extrabold text-[#6f5d43]"
              >
                <Search size={17} />
                Chercher
              </Link>

              <Link
                href={user ? "/planning" : "/auth/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#21170b] py-3 text-[11px] font-extrabold text-white"
              >
                <CalendarCheck size={17} />
                Planning
              </Link>

              <Link
                href={user ? MESSAGES_URL : "/auth/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#fff8e9] py-3 text-[11px] font-extrabold text-[#6f5d43]"
              >
                <MessageCircle size={17} />
                Messages
              </Link>

              <Link
                href={user ? PROFILE_URL : "/auth/login"}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#fff8e9] py-3 text-[11px] font-extrabold text-[#6f5d43]"
              >
                {user ? <UserRound size={17} /> : <LogIn size={17} />}
                {user ? "Profil" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-4 gap-2 rounded-[1.6rem] border border-white/80 bg-white/92 p-2 shadow-[0_20px_60px_rgba(33,23,11,0.16)] backdrop-blur-2xl xl:hidden">
        <Link
          href="/annonces"
          className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[11px] font-extrabold text-[#6f5d43]"
        >
          <Search size={17} />
          Annonces
        </Link>

        <Link
          href={user ? "/planning" : "/auth/login"}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#21170b] py-3 text-[11px] font-extrabold text-white"
        >
          <CalendarCheck size={17} />
          Planning
        </Link>

        <Link
          href={user ? MESSAGES_URL : "/auth/login"}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[11px] font-extrabold text-[#6f5d43]"
        >
          <MessageCircle size={17} />
          Messages
        </Link>

        <Link
          href={user ? PROFILE_URL : "/auth/login"}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[11px] font-extrabold text-[#6f5d43]"
        >
          {user ? <UserRound size={17} /> : <LogIn size={17} />}
          {user ? "Profil" : "Login"}
        </Link>
      </nav>
    </>
  );
}
import Link from "next/link";
import { Mail, MapPin, Phone, ArrowUpRight, Heart, ShieldCheck } from "lucide-react";

const footerPages = [
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
    label: "Contact",
    href: "/contact",
  },
  {
    label: "Connexion",
    href: "/auth/login",
  },
  {
    label: "Inscription",
    href: "/auth/register",
  },
];

const footerLegal = [
  {
    label: "Conditions générales",
    href: "/cgu",
  },
  {
    label: "Politique de confidentialité",
    href: "/confidentialite",
  },
  {
    label: "Mentions légales",
    href: "/mentions-legales",
  },
];

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.4 8.6V6.9c0-.8.5-1 1-1h2V2.7c-.3 0-1.5-.2-2.9-.2-3 0-5 1.8-5 5v1.1H6.2v3.7h3.3V22h4.1v-9.7H17l.6-3.7h-3.2Z" />
    </svg>
  );
}

function LinkedinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.9 8.9H3.2V21h3.7V8.9ZM5.1 3C3.9 3 3 3.9 3 5.1s.9 2.1 2.1 2.1 2.1-.9 2.1-2.1S6.3 3 5.1 3ZM21 14.1c0-3.3-1.8-5.4-4.6-5.4-2 0-3.1 1.1-3.6 2V8.9H9.1V21h3.7v-6.3c0-1.7.9-2.8 2.3-2.8 1.3 0 2.1.9 2.1 2.8V21H21v-6.9Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-[#fffaf0] px-4 pb-28 pt-20 text-[#21170b] lg:pb-10"
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#f2d58d]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-[#b9872b]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-[#b9872b]/15 bg-white/80 p-5 shadow-[0_24px_70px_rgba(65,42,12,0.08)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b9872b]/20 bg-[#fff3d6] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#9b6b19]">
                <ShieldCheck size={15} />
                Plateforme GotFit
              </span>

              <h2 className="max-w-2xl text-2xl font-black tracking-[-0.04em] text-[#21170b] md:text-4xl">
                Bougez mieux, réservez plus simplement, progressez avec les bons
                intervenants.
              </h2>
            </div>

            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2d58d] to-[#b9872b] px-6 text-sm font-black text-[#1b1206] shadow-[0_18px_45px_rgba(185,135,43,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(185,135,43,0.3)]"
            >
              Nous contacter
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div className="rounded-[2rem] border border-[#b9872b]/15 bg-white p-7 shadow-[0_24px_70px_rgba(65,42,12,0.08)]">
            <Link href="/" className="mb-6 inline-flex items-center">
              <img
                src="http://187.77.181.212/images/logo.png"
                alt="Logo Gotfit"
                className="h-auto w-[150px] max-w-full object-contain md:w-[175px]"
              />
            </Link>

            <p className="max-w-sm text-sm leading-7 text-[#6f5d43]">
              Plateforme digitale spécialisée dans le mouvement et le bien-être :
              recherche, réservation, paiement, messagerie et suivi des séances.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Coaching", "Pilates", "Yoga", "Nutrition"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#b9872b]/15 bg-[#fff8e9] px-4 py-2 text-xs font-black text-[#9b6b19]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#b9872b]/15 bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#b9872b] hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#b9872b]/15 bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#b9872b] hover:text-white"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#b9872b]/15 bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#b9872b] hover:text-white"
              >
                <LinkedinIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#b9872b]/15 bg-white/70 p-7 shadow-[0_18px_50px_rgba(65,42,12,0.06)]">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-[#b9872b]">
              Pages
            </h3>

            <div className="grid gap-3">
              {footerPages.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold text-[#5d4b2f] transition hover:bg-[#fff3d6] hover:text-[#9b6b19]"
                >
                  {item.label}
                  <ArrowUpRight
                    size={15}
                    className="opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#b9872b]/15 bg-white/70 p-7 shadow-[0_18px_50px_rgba(65,42,12,0.06)]">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-[#b9872b]">
              Légal
            </h3>

            <div className="grid gap-3">
              {footerLegal.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold text-[#5d4b2f] transition hover:bg-[#fff3d6] hover:text-[#9b6b19]"
                >
                  {item.label}
                  <ArrowUpRight
                    size={15}
                    className="opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#b9872b]/15 bg-white/70 p-7 shadow-[0_18px_50px_rgba(65,42,12,0.06)]">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-[#b9872b]">
              Contact
            </h3>

            <div className="grid gap-4">
              <div className="flex gap-3 rounded-2xl bg-[#fff8e9] p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
                  <Mail size={18} />
                </span>
                <div>
                  <strong className="block text-sm text-[#21170b]">Email</strong>
                  <span className="text-sm text-[#6f5d43]">
                    contact@gotfit.com
                  </span>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl bg-[#fff8e9] p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
                  <Phone size={18} />
                </span>
                <div>
                  <strong className="block text-sm text-[#21170b]">
                    Téléphone
                  </strong>
                  <span className="text-sm text-[#6f5d43]">
                    +33 6 00 00 00 00
                  </span>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl bg-[#fff8e9] p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
                  <MapPin size={18} />
                </span>
                <div>
                  <strong className="block text-sm text-[#21170b]">Zone</strong>
                  <span className="text-sm text-[#6f5d43]">
                    France, DOM-TOM et francophonie
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#b9872b]/15 pt-6 text-sm text-[#7b6848] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Gotfit. Tous droits réservés.</p>

          <p className="inline-flex items-center gap-1">
            Fait avec <Heart size={14} className="text-[#b9872b]" /> pour le
            mouvement et le bien-être.
          </p>
        </div>
      </div>
    </footer>
  );
}
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LOGO_URL } from "@/lib/api-config";

const footerPages = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Annonces", href: "/annonces" },
  { label: "Intervenants", href: "/intervenants" },
  { label: "Mes réservations", href: "/reservations" },
  { label: "Parcours client", href: "/parcours-client" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Visio", href: "/visio" },
  { label: "Contact", href: "/contact" },
  { label: "Connexion", href: "/auth/login" },
  { label: "Inscription", href: "/auth/register" },
];

const footerLegal = [
  { label: "Conditions générales", href: "/cgu" },
  { label: "Politique de confidentialité", href: "/confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

const services = ["Coaching", "Pilates", "Yoga", "Nutrition"];

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
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
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
      className="relative overflow-hidden border-t border-[#eadfce] bg-[#fffaf0] px-4 pb-28 pt-16 text-[#21170b] lg:pb-10 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b9872b]/40 to-transparent" />
      <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-[#f2d58d]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-12 h-96 w-96 rounded-full bg-[#b9872b]/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1500px]">
        <section className="mb-10 overflow-hidden rounded-[2rem] border border-[#eadfce] bg-white/80 shadow-[0_24px_80px_rgba(33,23,11,0.08)] backdrop-blur-2xl">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#b9872b]/20 bg-[#fff3d6] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#9b6b19]">
                <ShieldCheck size={15} />
                Plateforme GotFit
              </span>

              <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-[#21170b] md:text-5xl">
                Bougez mieux, réservez plus simplement, progressez avec les bons
                intervenants.
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#6f5d43] md:text-base">
                Une expérience fluide pour trouver un coach, réserver une
                séance, échanger, payer et suivre votre parcours bien-être.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#21170b] px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(33,23,11,0.22)] transition hover:-translate-y-0.5 hover:bg-[#3a2812]"
            >
              Nous contacter
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr_0.75fr_1fr]">
          <div className="rounded-[2rem] border border-[#eadfce] bg-white/85 p-6 shadow-[0_18px_55px_rgba(33,23,11,0.06)] md:p-7">
            <Link href="/" className="mb-6 inline-flex items-center">
              <img
                src={LOGO_URL}
                alt="Logo Gotfit"
                className="h-auto w-[155px] max-w-full object-contain md:w-[180px]"
              />
            </Link>

            <p className="max-w-md text-sm font-semibold leading-7 text-[#6f5d43]">
              GotFit connecte les clients, coachs et intervenants autour du
              mouvement, du bien-être et du suivi personnalisé.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {services.map((item) => (
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfce] bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#21170b] hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfce] bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#21170b] hover:text-white"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfce] bg-[#fff8e9] text-[#9b6b19] transition hover:-translate-y-0.5 hover:bg-[#21170b] hover:text-white"
              >
                <LinkedinIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#eadfce] bg-white/70 p-6 shadow-[0_18px_55px_rgba(33,23,11,0.05)] md:p-7">
            <h3 className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#b9872b]">
              <Sparkles size={15} />
              Pages
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {footerPages.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-extrabold text-[#5d4b2f] transition hover:bg-[#fff3d6] hover:text-[#9b6b19]"
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

          <div className="rounded-[2rem] border border-[#eadfce] bg-white/70 p-6 shadow-[0_18px_55px_rgba(33,23,11,0.05)] md:p-7">
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-[#b9872b]">
              Légal
            </h3>

            <div className="grid gap-2">
              {footerLegal.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-extrabold text-[#5d4b2f] transition hover:bg-[#fff3d6] hover:text-[#9b6b19]"
                >
                  {item.label}
                  <ArrowUpRight
                    size={15}
                    className="opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#21170b] p-5 text-white">
              <p className="text-sm font-black">Réservation sécurisée</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-white/65">
                Paiement, suivi, messagerie et parcours client centralisés dans
                une seule webapp.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#eadfce] bg-white/70 p-6 shadow-[0_18px_55px_rgba(33,23,11,0.05)] md:p-7">
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-[#b9872b]">
              Contact
            </h3>

            <div className="grid gap-3">
              <ContactItem
                icon={<Mail size={18} />}
                label="Email"
                value="contact@gotfit.com"
                href="mailto:contact@gotfit.com"
              />

              <ContactItem
                icon={<Phone size={18} />}
                label="Téléphone"
                value="+33 6 00 00 00 00"
                href="tel:+33600000000"
              />

              <ContactItem
                icon={<MapPin size={18} />}
                label="Zone"
                value="France, DOM-TOM et francophonie"
              />
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#eadfce] pt-6 text-sm font-semibold text-[#7b6848] md:flex-row md:items-center md:justify-between">
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

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex gap-3 rounded-[1.4rem] border border-[#eadfce] bg-[#fff8e9] p-3 transition hover:border-[#b9872b]/35 hover:bg-[#fff3d6]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
        {icon}
      </span>

      <div>
        <strong className="block text-sm text-[#21170b]">{label}</strong>
        <span className="text-sm font-semibold leading-6 text-[#6f5d43]">
          {value}
        </span>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}
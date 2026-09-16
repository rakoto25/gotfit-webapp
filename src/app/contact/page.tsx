"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { sendContactMessage } from "@/lib/contact";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      if (!response.success) {
        throw new Error(response.message || "Impossible d’envoyer le message.");
      }

      setSuccessMessage(
        response.message || "Votre message a bien été envoyé. Notre équipe vous répondra rapidement."
      );
      setForm(initialForm);
    } catch (caught) {
      setErrorMessage(
        caught instanceof Error
          ? caught.message
          : "Impossible d’envoyer le message pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <section className="relative overflow-hidden px-4 pb-16 pt-36 sm:px-6 lg:pb-20 lg:pt-44">
          <div className="pointer-events-none absolute right-[-9rem] top-16 h-[30rem] w-[30rem] rounded-full bg-[var(--brand)]/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-strong)] shadow-sm">
                <MessageCircleMore size={16} /> Contact Gotfit
              </span>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                Une question ? Parlons-en.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600">
                Réservation, paiement, compte coach ou fonctionnement de la plateforme : envoyez-nous votre demande et donnez-nous les informations utiles pour vous répondre précisément.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contact-form" className="gotfit-button gotfit-button-brand px-6">
                  Envoyer un message <ArrowRight size={17} />
                </a>
                <a href="mailto:contact@gotfit.com" className="gotfit-button bg-white px-6">
                  <Mail size={17} /> contact@gotfit.com
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[2rem] bg-white p-6 shadow-[0_18px_55px_rgba(21,33,27,0.06)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                  <Video size={22} />
                </span>
                <h2 className="mt-5 text-lg font-black">Prestations en ligne</h2>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                  Gotfit est conçu pour des prestations réalisées en visioconférence.
                </p>
              </article>
              <article className="rounded-[2rem] bg-white p-6 shadow-[0_18px_55px_rgba(21,33,27,0.06)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                  <ShieldCheck size={22} />
                </span>
                <h2 className="mt-5 text-lg font-black">Support utilisateur</h2>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                  Décrivez votre problème et notre équipe pourra retrouver plus facilement le parcours concerné.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:pb-32">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="h-fit rounded-[2.25rem] bg-slate-950 p-7 text-white sm:p-9">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                Pour une réponse efficace
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight">
                Donnez-nous le bon contexte.
              </h2>
              <div className="mt-7 grid gap-4 text-sm font-semibold leading-7 text-slate-300">
                {["Indiquez l’adresse email de votre compte.", "Précisez s’il s’agit d’une réservation, d’un paiement ou de votre profil.", "Décrivez ce que vous faisiez juste avant le problème."].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 shrink-0 text-orange-300" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>

            <form
              id="contact-form"
              onSubmit={handleSubmit}
              className="rounded-[2.5rem] bg-white p-6 shadow-[0_22px_70px_rgba(21,33,27,0.07)] sm:p-9"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                Formulaire de contact
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Envoyer un message</h2>

              {successMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  <X className="mt-0.5 shrink-0" size={18} /> {errorMessage}
                </div>
              )}

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black">Nom complet *</span>
                  <input className="gotfit-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} autoComplete="name" required placeholder="Votre nom" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Adresse email *</span>
                  <input className="gotfit-input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} autoComplete="email" required placeholder="vous@exemple.com" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Téléphone</span>
                  <input className="gotfit-input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} autoComplete="tel" placeholder="Optionnel" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Sujet *</span>
                  <input className="gotfit-input" value={form.subject} onChange={(e) => updateField("subject", e.target.value)} required placeholder="Ex. Paiement ou compte coach" />
                </label>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black">Message *</span>
                <textarea className="gotfit-input min-h-40 resize-y" value={form.message} onChange={(e) => updateField("message", e.target.value)} required placeholder="Décrivez votre demande..." />
              </label>

              <button type="submit" disabled={loading} className="gotfit-button gotfit-button-brand mt-6 px-7 disabled:opacity-60">
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Send size={18} />}
                {loading ? "Envoi..." : "Envoyer le message"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Video,
  WalletCards,
  Zap,
} from "lucide-react";

const audiences = [
  {
    title: "Clients particuliers",
    text: "Recherchez, comparez, réservez et payez des séances avec des intervenants qualifiés.",
    icon: UsersRound,
  },
  {
    title: "Intervenants certifiés",
    text: "Publiez vos prestations, gérez vos créneaux, recevez des réservations et développez votre visibilité.",
    icon: BadgeCheck,
  },
  {
    title: "Structures professionnelles",
    text: "Publiez des besoins ponctuels ou récurrents et sélectionnez les meilleurs profils.",
    icon: ShieldCheck,
  },
];

const features = [
  {
    title: "Recherche intelligente",
    text: "Trouvez rapidement un coach, un cours ou une prestation selon votre besoin, votre zone et votre disponibilité.",
    icon: Search,
  },
  {
    title: "Réservation fluide",
    text: "Sélectionnez un créneau, confirmez votre séance et retrouvez votre suivi dans votre espace personnel.",
    icon: CalendarCheck,
  },
  {
    title: "Paiement sécurisé",
    text: "Paiement en ligne, gestion des commissions et frais de service automatisés côté plateforme.",
    icon: CreditCard,
  },
  {
    title: "Messagerie interne",
    text: "Échangez directement avec les clients, intervenants ou structures sans sortir de la plateforme.",
    icon: MessageCircle,
  },
  {
    title: "Visio & séances à distance",
    text: "Préparez des séances accessibles en ligne avec lien sécurisé associé à la réservation.",
    icon: Video,
  },
  {
    title: "Avis & visibilité",
    text: "Collectez des avis après les séances et améliorez la visibilité des annonces avec les boosts.",
    icon: Star,
  },
];

const steps = [
  {
    number: "01",
    title: "Je trouve mon besoin",
    text: "Coaching sportif, yoga, Pilates, mobilité, récupération ou nutrition.",
  },
  {
    number: "02",
    title: "Je réserve un créneau",
    text: "L’utilisateur sélectionne la prestation, le lieu, le format et la disponibilité.",
  },
  {
    number: "03",
    title: "Je paie en ligne",
    text: "La réservation est confirmée avec paiement sécurisé et calcul automatique des frais.",
  },
  {
    number: "04",
    title: "Je suis ma séance",
    text: "Messagerie, notifications, avis et suivi sont centralisés dans l’espace GotFit.",
  },
];

const categories = [
  "Coaching sportif",
  "Pilates",
  "Yoga",
  "Mobilité",
  "Récupération",
  "Nutrition",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf0] text-[#21170b]">
      <Header />

      <section className="relative px-4 pb-20 pt-32 lg:pb-28 lg:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-[#f2d58d]/40 blur-3xl" />
          <div className="absolute -right-28 top-24 h-[28rem] w-[28rem] rounded-full bg-[#b9872b]/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b9872b]/20 bg-white/80 px-4 py-2 text-sm font-black text-[#9b6b19] shadow-[0_12px_35px_rgba(65,42,12,0.08)] backdrop-blur-xl">
              <Sparkles size={17} className="text-[#b9872b]" />
              Plateforme digitale mouvement & bien-être
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.065em] text-[#21170b] sm:text-6xl lg:text-7xl">
              Trouvez le bon accompagnement pour{" "}
              <span className="text-[#b9872b]">bouger mieux.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6f5d43]">
              GotFit connecte les clients, intervenants certifiés et structures
              professionnelles autour de prestations encadrées, sécurisées et
              réservables en ligne.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2d58d] to-[#b9872b] px-7 py-4 text-sm font-black text-[#1b1206] shadow-[0_18px_45px_rgba(185,135,43,0.24)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(185,135,43,0.34)]"
              >
                Trouver une séance
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b9872b]/20 bg-white px-7 py-4 text-sm font-black text-[#21170b] shadow-[0_14px_35px_rgba(65,42,12,0.06)] transition hover:-translate-y-1 hover:border-[#b9872b]/50 hover:text-[#9b6b19]"
              >
                Devenir intervenant
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] border border-[#b9872b]/10 bg-white/85 p-4 shadow-[0_16px_35px_rgba(65,42,12,0.06)] backdrop-blur-xl">
                <strong className="block text-2xl font-black text-[#21170b]">
                  3
                </strong>
                <span className="text-xs font-bold text-[#7b6848]">
                  profils utilisateurs
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-[#b9872b]/10 bg-white/85 p-4 shadow-[0_16px_35px_rgba(65,42,12,0.06)] backdrop-blur-xl">
                <strong className="block text-2xl font-black text-[#21170b]">
                  6+
                </strong>
                <span className="text-xs font-bold text-[#7b6848]">
                  activités bien-être
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-[#b9872b]/10 bg-white/85 p-4 shadow-[0_16px_35px_rgba(65,42,12,0.06)] backdrop-blur-xl">
                <strong className="block text-2xl font-black text-[#21170b]">
                  100%
                </strong>
                <span className="text-xs font-bold text-[#7b6848]">
                  parcours digital
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-md rounded-[3rem] border border-[#b9872b]/16 bg-white p-4 shadow-[0_35px_100px_rgba(65,42,12,0.16)]">
              <div className="overflow-hidden rounded-[2.35rem] bg-[#fffaf0] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b9872b]">
                      GotFit
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-[#21170b]">
                      Découvrir
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#b9872b] shadow-sm">
                    <Dumbbell size={20} />
                  </div>
                </div>

                <div className="rounded-[2rem] bg-gradient-to-br from-[#fff8e9] via-white to-[#f2d58d]/45 p-5 shadow-inner">
                  <div className="mb-20 inline-flex rounded-full border border-[#b9872b]/10 bg-white/85 px-3 py-1 text-xs font-black text-[#9b6b19]">
                    Séance recommandée
                  </div>

                  <h3 className="text-3xl font-black leading-tight tracking-tight text-[#21170b]">
                    Pilates Reformer
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-[#6f5d43]">
                    Mobilité · Renforcement · Respiration
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                    <CalendarCheck className="mb-5 text-[#b9872b]" size={22} />
                    <p className="text-xs font-bold text-[#9b8a6b]">
                      Prochain créneau
                    </p>
                    <strong className="text-sm text-[#21170b]">
                      Aujourd’hui 18:30
                    </strong>
                  </div>

                  <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                    <WalletCards className="mb-5 text-[#b9872b]" size={22} />
                    <p className="text-xs font-bold text-[#9b8a6b]">
                      Paiement
                    </p>
                    <strong className="text-sm text-[#21170b]">Sécurisé</strong>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-black text-[#21170b]">
                      Intervenant certifié
                    </span>
                    <BadgeCheck size={18} className="text-[#b9872b]" />
                  </div>
                  <div className="h-2 rounded-full bg-[#f3ead8]">
                    <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-[#f2d58d] to-[#b9872b]" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#7b6848]">
                    Profil validé, avis vérifiés et réservation suivie.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden rounded-[1.7rem] border border-[#b9872b]/10 bg-white p-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3d6] text-[#b9872b]">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <strong className="block text-sm text-[#21170b]">
                    Messagerie active
                  </strong>
                  <span className="text-xs font-semibold text-[#7b6848]">
                    Échange centralisé
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-12 hidden rounded-[1.7rem] border border-[#b9872b]/10 bg-white p-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3d6] text-[#b9872b]">
                  <Zap size={20} />
                </div>
                <div>
                  <strong className="block text-sm text-[#21170b]">
                    Boost visibilité
                  </strong>
                  <span className="text-xs font-semibold text-[#7b6848]">
                    Annonces mises en avant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#b9872b]">
                Pour qui ?
              </p>
              <h2 className="max-w-2xl text-4xl font-black tracking-[-0.04em] text-[#21170b] md:text-5xl">
                Une plateforme pour chaque acteur du bien-être.
              </h2>
            </div>

            <p className="max-w-md text-base leading-7 text-[#6f5d43]">
              GotFit organise les parcours selon le profil : client,
              intervenant ou structure professionnelle.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-[#b9872b]/12 bg-white p-7 shadow-[0_18px_50px_rgba(65,42,12,0.07)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(65,42,12,0.12)]"
                >
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3d6] text-[#b9872b]">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-2xl font-black tracking-tight text-[#21170b]">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#6f5d43]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#b9872b]">
              Fonctionnalités
            </p>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#21170b] md:text-5xl">
              Tout le parcours réuni dans une seule webapp.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group rounded-[2rem] border border-[#b9872b]/10 bg-[#fffaf0] p-7 transition hover:-translate-y-1 hover:bg-[#21170b] hover:text-white hover:shadow-2xl"
                >
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b9872b] shadow-sm transition group-hover:bg-white/10 group-hover:text-[#f2d58d]">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-xl font-black tracking-tight">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#6f5d43] transition group-hover:text-white/65">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#b9872b]">
                Comment ça marche ?
              </p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#21170b] md:text-5xl">
                Un parcours simple, de la recherche au suivi.
              </h2>
            </div>

            <p className="text-base leading-8 text-[#6f5d43]">
              La webapp guide l’utilisateur étape par étape : recherche,
              sélection, réservation, paiement, puis interactions après la
              séance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.number}
                className="rounded-[2rem] border border-[#b9872b]/12 bg-white p-7 shadow-[0_18px_50px_rgba(65,42,12,0.06)]"
              >
                <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#f2d58d] to-[#b9872b] text-sm font-black text-[#1b1206]">
                  {item.number}
                </span>

                <h3 className="text-xl font-black tracking-tight text-[#21170b]">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[#6f5d43]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[3rem] border border-[#b9872b]/14 bg-gradient-to-br from-white via-[#fffaf0] to-[#fff3d6] p-8 shadow-[0_30px_90px_rgba(65,42,12,0.09)] md:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-16">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#b9872b]">
              Activités
            </p>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#21170b] md:text-5xl">
              Des prestations adaptées au mouvement et au bien-être.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#6f5d43]">
              GotFit peut accueillir différentes spécialités : coaching,
              mobilité, yoga, Pilates, récupération, nutrition et missions
              professionnelles.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#b9872b]/15 bg-white px-4 py-2 text-sm font-bold text-[#9b6b19]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-7 shadow-[0_16px_40px_rgba(65,42,12,0.06)]">
              <Dumbbell className="mb-12 text-[#b9872b]" size={30} />
              <h3 className="text-2xl font-black text-[#21170b]">
                Coaching & forme
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6f5d43]">
                Accompagnement individuel ou collectif, en présentiel ou en
                ligne.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-[0_16px_40px_rgba(65,42,12,0.06)]">
              <Video className="mb-12 text-[#b9872b]" size={30} />
              <h3 className="text-2xl font-black text-[#21170b]">
                Séances à distance
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6f5d43]">
                Visio, lien sécurisé, notifications et historique des séances.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-[0_16px_40px_rgba(65,42,12,0.06)]">
              <MessageCircle className="mb-12 text-[#b9872b]" size={30} />
              <h3 className="text-2xl font-black text-[#21170b]">
                Messagerie
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6f5d43]">
                Échanges centralisés entre clients, structures et intervenants.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-[0_16px_40px_rgba(65,42,12,0.06)]">
              <Star className="mb-12 text-[#b9872b]" size={30} />
              <h3 className="text-2xl font-black text-[#21170b]">
                Avis vérifiés
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6f5d43]">
                Les avis sont liés aux réservations effectuées sur la
                plateforme.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl rounded-[2.7rem] border border-[#b9872b]/14 bg-gradient-to-br from-[#fff8e9] via-white to-[#f2d58d]/40 p-8 shadow-[0_30px_90px_rgba(65,42,12,0.09)] md:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#b9872b]">
                Rejoindre GotFit
              </p>

              <h2 className="max-w-3xl text-4xl font-black tracking-[-0.05em] text-[#21170b] md:text-6xl">
                Lancez votre parcours bien-être ou développez votre activité.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#6f5d43]">
                Inscrivez-vous comme client pour réserver des séances, ou comme
                intervenant pour publier vos prestations et recevoir des
                réservations.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f2d58d] to-[#b9872b] px-7 py-4 text-sm font-black text-[#1b1206] shadow-[0_18px_45px_rgba(185,135,43,0.22)] transition hover:-translate-y-1"
              >
                Créer un compte
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b9872b]/20 bg-white px-7 py-4 text-sm font-black text-[#21170b] transition hover:-translate-y-1 hover:border-[#b9872b]/50 hover:text-[#9b6b19]"
              >
                Voir les services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
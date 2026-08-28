# GotFit Webapp — version 100 % visio

## Variables frontend

Créer `.env.local` à partir de `.env.example` et renseigner :

```dotenv
NEXT_PUBLIC_API_URL=https://api.votre-domaine.tld/api
NEXT_PUBLIC_SITE_URL=https://votre-domaine.tld
NEXT_PUBLIC_STRIPE_KEY=pk_...
```

La webapp n'a pas besoin du secret Stripe ni des secrets LiveKit. L'URL LiveKit et le token participant sont fournis par Laravel après contrôle d'accès.

## Build

```bash
npm ci
npm run build
npm run start
```

## Parcours visio

- aucune création d'annonce en présentiel ;
- annonces et calendrier affichés en **Visio GotFit** ;
- paiement Stripe des prestations via réservation marketplace ;
- retour Stripe/3DS resynchronisé sur `/reservations` ;
- accès LiveKit récupéré depuis Laravel ;
- sortie/déconnexion de salle enregistrée côté API ;
- visios autonomes gratuites et réservables directement.

Consulter aussi le guide backend `DEPLOIEMENT_VISIO_PAIEMENT_2026-08-28.md` pour les variables Stripe/LiveKit et la migration.

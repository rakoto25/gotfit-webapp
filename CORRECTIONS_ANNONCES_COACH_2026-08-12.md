# Correctif webapp Gotfit — annonces coach

## Fonctionnalités ajoutées

- nouvelle page `/intervenant/annonces/nouvelle` ;
- formulaire complet relié à `POST /api/annonces` ;
- prise en charge du présentiel et de la visio ;
- tarif, durée, ville, adresse, jours et plages horaires ;
- image JPG, PNG ou WebP limitée à 4 Mo ;
- aperçu en direct et validation avant envoi ;
- états de chargement, d’erreur et de succès ;
- accès depuis le profil et le tableau de bord coach.

## Flux d’authentification corrigé

- après une inscription classique ou Google, l’utilisateur arrive sur `/profile` ;
- la connexion conserve la redirection habituelle selon le rôle ;
- le tableau de bord coach utilise les clés de session communes du webapp ;
- il charge les routes Laravel existantes `/profile` et
  `/reservation/intervenant` au lieu d’un endpoint de dashboard absent.

## Vérifications

- TypeScript : réussi ;
- ESLint sur les fichiers modifiés : aucune erreur ;
- build Next.js 16.2.12 : réussi ;
- rendu vérifié sur ordinateur et mobile ;
- soumission multipart testée avec interception locale, sans écriture sur l’API.

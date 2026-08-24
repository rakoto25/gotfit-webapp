# Mise à jour notes assignées et annonces clients

## Fonctionnalités incluses

- Sélecteur « coach assigné » dans `/parcours-client/[id]`.
- Affichage du coach assigné sur chaque note.
- Bouton « Publier une annonce » dans la marketplace.
- Nouveau formulaire client `/annonces/nouvelle`.
- Redirection automatique d’un coach vers son formulaire de prestation existant.
- Filtre entre prestations coach et recherches clients.
- Présentation spécifique des demandes clients et réponse par la messagerie.
- Raccourci « Publier » dans le tableau de bord client.

## Déploiement webapp

```bash
npm ci
npm run build
npm run start
```

Vérifier que `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_STRIPE_KEY` conservent les
valeurs du serveur de production avant le build.

## Ordre conseillé

1. Déployer l’API et exécuter `php artisan migrate --force`.
2. Déployer et reconstruire la webapp.
3. Valider une annonce client depuis le tableau de bord administrateur.
4. Vérifier son affichage avec le filtre « Recherches clients ».

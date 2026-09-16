# Corrections du retour client GotFit — 16 septembre 2026

Les sources corrigées correspondent aux archives fournies et aux dépôts GitHub au début de l'intervention.

| Retour PDF | Correction |
| --- | --- |
| Affichage du prix coach | Espacement corrigé entre l'icône euro et la saisie ; conservation des décimales dans l'API et l'édition. |
| Voir et modifier une annonce client/coach | Pages « Mes annonces » et « Modifier mon annonce », liens dans les tableaux de bord et la liste publique. Formulaire prérempli, image conservée sans remplacement, retour en modération après modification. |
| Affichage du pseudo/profil | Nom complet conservé dans le menu ; titre du profil déplacé hors du chevauchement de la couverture et retour à la ligne sur les noms longs. |
| Créneaux limités au coach | Choix des heures parmi les plages et jours publiés, durée entière respectée, impossibilité de soumettre une date sans disponibilité ; validation également côté serveur. |
| E-mail après validation coach | Notification ajoutée dans le projet API, avec accès à l'espace coach ; indication dans l'admin. |
| Page Contact | Police héritée du site et palette, titres, boutons harmonisés. |
| Prestations EN LIGNE | Mention visible dès la connexion. |
| Cashback | Encadré visible à la connexion avec accès au contact pour les conditions. Le PDF ne fournit ni taux ni règles d'éligibilité ; aucun taux ni mécanisme de cashback n'a été inventé. |
| Coach perdu après connexion | Destination conservée pour Google, connexion classique et passage entre inscription et connexion. Redirections externes refusées. |
| Comprendre le paiement | Explication dépliable sur la réservation : prix, frais, récapitulatif Stripe, confirmation coach, séance et validation. |
| Inscription coach | Redirection immédiate vers `/intervenant/dashboard`, y compris avec Google. |

## Installation

Déployer d'abord l'API corrigée. Conserver la configuration `.env.local` du serveur, installer avec `npm ci`, compiler avec `npm run build`, puis redémarrer le service Next.js. Les ZIP contiennent les sources ; `node_modules` et `.next` sont à générer sur le serveur. Configurer notamment l'URL API, Google et Stripe avec les valeurs de l'environnement cible.

Les annonces historiques sans jours/plages horaires restent consultables mais ne sont pas réservables tant que leur coach n'a pas renseigné ses disponibilités.

## Vérification

- Compilation Next.js et TypeScript réussie.
- 16 tests Vitest réussis, dont callback Google simulé, conservation du coach et de l'annonce, redirection coach, sécurité de la destination et calcul des disponibilités.
- ESLint : aucune erreur ; avertissements préexistants sur images et variables inutilisées.
- Parcours navigateur testés avec API simulée : connexion classique puis retour à l'annonce choisie, sélection des horaires, date non disponible, explication de paiement, édition préremplie et envoi multipart, nom complet, affichage mobile Contact et connexion.

Les essais navigateur ne constituent pas un paiement Stripe réel ni une connexion Google réelle. La livraison SMTP et les services externes doivent être vérifiés avec les identifiants de l'environnement de déploiement.

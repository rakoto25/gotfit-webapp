# Offres, packs, paiements et cagnotte dans la webapp

Le parcours implémenté est :

`Messagerie → carte d’offre → récapitulatif/contact coach → Stripe Checkout → messagerie → pack actif`

## Messagerie

- Un coach peut créer une offre depuis une conversation avec le bouton
  **Créer une offre**.
- La carte contient l’intitulé, la description, le nombre de séances, le prix,
  l’expiration et le statut.
- Le client passe par `/offres/{id}/paiement`; il n’est jamais envoyé
  directement vers Stripe depuis la carte.
- Après Stripe, `conversation_id` dans l’URL rouvre automatiquement la bonne
  conversation et affiche le résultat du retour.

## Étape avant paiement

La page de récapitulatif permet au client :

- de vérifier le coach, le pack et le montant ;
- de retourner dans la messagerie avec **Contacter le coach** ;
- d’appliquer tout ou partie de sa cagnotte ;
- d’ouvrir ensuite Stripe Checkout.

Une session Stripe existante verrouille le montant de cagnotte pour éviter un
double débit. Le pack n’est affiché comme actif qu’après confirmation API.

## Packs

La route `/packs` affiche les packs des clients et des coachs :

- planification par le coach ;
- déclaration de réalisation ;
- validation ou contestation côté client ;
- annulation anticipée ou tardive ;
- déclaration d’absence après le délai de grâce ;
- statut du reversement par séance ;
- solde et historique de la cagnotte.

## Configuration

La webapp utilise les variables existantes :

```dotenv
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_KEY=
```

L’API doit définir `FRONTEND_URL` avec l’origine publique de cette webapp et
configurer les webhooks Stripe documentés dans le dépôt `gotfit-api`.

# EatsCM Frontend v2.0 — Angular 21

Application de livraison de repas au Cameroun (Douala & Yaoundé)

## 🚀 Installation

```bash
npm install
ng serve
```

Ouvre http://localhost:4200

## 🔑 Google Maps

Dans `src/index.html`, remplace `YOUR_API_KEY` par ta vraie clé Google Maps.

Pour autoriser le GPS en local (Chrome) :
- Va dans l'URL bar → clic sur le cadenas → Paramètres du site → Localisation → Autoriser

## 👥 Connexion rapide (dev sans backend)

Sur la page Login, utilise les boutons :
- **🛒 Client** → accueil pour commander
- **🍽️ Restaurant** → dashboard restaurant
- **🛵 Livreur** → dashboard livreur
- **⚙️ Admin** → dashboard admin

## ✅ Corrections v2 par rapport à v1

1. **JWT en mémoire** — token jamais stocké en localStorage (sessionStorage pour l'user uniquement)
2. **Son vidéo** — toggle via DOM direct (querySelectorAll), plus de problème de binding Angular
3. **GPS** — messages d'erreur clairs selon le type d'erreur (refus, indisponible, timeout)
4. **Frais livraison** — calculés par distance réelle (0-3km=1000, 3-6km=1500, 6-10km=2500 FCFA)
5. **Restaurant bloqué du panier** — guard `clientOnlyGuard` sur /panier et /checkout
6. **Badge rôle visible** — partout (navbar, profil, dashboard, register)
7. **Mot de passe oublié** — fonctionnel avec message feedback
8. **Search** — vraiment fonctionnel avec filtre en temps réel
9. **Chatbot** — assistant EatsCM avec API Anthropic intégré
10. **Photo maison** — upload photo de l'entrée au checkout pour aider le livreur

## 🆕 Nouvelles fonctionnalités v2

- **Chatbot IA** — assistant EatsCM powered by Claude
- **Favoris** — cœur sur les restaurants en home
- **Dashboard Livreur complet** — courses disponibles, en cours, livrées + wallet + cash dû
- **Dashboard Admin complet** — restaurants, livreurs (validation CNI), commandes, finances, litiges
- **Litiges** — système de réclamations client
- **Livreur interne vs pool** — modèle TypeLivreur dans les models
- **Frais dynamiques** — selon distance GPS réelle

## 📁 Structure

```
src/app/
├── core/
│   ├── models/        — Types complets (User, Restaurant, Plat, Commande, Litige...)
│   ├── services/      — auth (JWT mémoire), commande, maps, notification, favoris
│   ├── guards/        — auth, role, clientOnly (nouveau)
│   └── interceptors/  — JWT automatique sur les requêtes
├── shared/
│   └── components/    — navbar, bottom-nav, toast, map-picker, chatbot, loader
├── features/
│   ├── auth/          — login (mdp oublié), register (badges rôles)
│   ├── home/          — hero + catégories + restaurants + favoris
│   ├── discover/      — feed vidéo TikTok (son corrigé)
│   ├── restaurant/    — detail + search (fonctionnel)
│   ├── commande/      — panier + checkout (GPS + photo maison) + suivi
│   ├── profil/        — badge rôle visible
│   ├── favoris/       — liste des favoris
│   ├── dashboard-restaurant/ — commandes + menu + stats
│   ├── dashboard-livreur/    — courses + wallet
│   └── dashboard-admin/      — restaurants + livreurs + commandes + finances + litiges
└── layout/
    ├── main-layout/      — navbar + bottomnav + toast + chatbot
    └── dashboard-layout/ — sidebar + topbar (badge rôle visible)
```

## 🔌 Connexion backend (quand prêt)

Dans chaque service, remplacer le `loginMock()` par l'appel HTTP réel :

```typescript
// auth.service.ts — remplacer loginMockEmail() par :
this.auth.login(email, password).subscribe(...)

// commande.service.ts — remplacer setTimeout() par :
this.passerCommande(data).subscribe(...)
```

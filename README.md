# OBNAR VACANCES

Plateforme de découverte et de réservation d'hébergements de vacances à **Ouled Bounar et dans la wilaya de Jijel**.

واجهة عربية باتجاه RTL، مع دعم المحتوى الفرنسي، للبحث عن الإقامات ومتابعة الحجوزات ودليل الأنشطة المحلية.

## Fonctionnalités principales

- Recherche d'hébergements approuvés par zone, capacité et catégorie.
- Fiches détaillées, galerie photos et calendrier de disponibilité.
- Comptes voyageurs et propriétaires, avec vérification du propriétaire avant publication d'un logement.
- Demandes de réservation, suivi des réponses, dépôt de justificatif de paiement et validation par l'administration.
- Gestion des demandes d'annulation et de remboursement selon les règles de la plateforme.
- Annuaire des commerces, artisans et prestataires de services locaux, publié après validation.
- Espace d'administration pour les vérifications, les logements, les réservations et les activités.

## Architecture technique

- **Frontend :** HTML, CSS et JavaScript.
- **Hébergement frontend :** GitHub Pages.
- **Backend :** Supabase.
- **Base de données :** PostgreSQL avec Row Level Security (RLS).
- **Authentification :** Supabase Auth.
- **Fichiers :** Supabase Storage avec des buckets privés et des règles d'accès par rôle.

Le frontend est actuellement servi depuis `index.html`. Il n'y a pas d'étape de compilation nécessaire pour la version statique actuelle.

## Rôles et séparation des accès

- **Voyageur :** recherche, demandes de réservation, suivi et avis autorisés.
- **Propriétaire :** vérification du compte, gestion de ses hébergements et traitement des demandes qui le concernent.
- **Prestataire d'activité :** soumission et suivi de ses commerces, métiers ou services locaux.
- **Administrateur principal :** validation des dossiers et supervision des opérations de la plateforme.

Les droits effectifs sont contrôlés côté base de données par RLS, les privilèges SQL et les fonctions sécurisées. Le masquage d'une section dans l'interface ne remplace jamais un contrôle côté serveur.

## Sécurité — règles de contribution

- Ne jamais placer une clé `service_role`, un mot de passe ou un secret serveur dans le frontend ou dans le dépôt.
- La clé publique Supabase utilisée côté navigateur n'est pas un secret ; elle doit toujours être associée à des politiques RLS correctes.
- Les documents de vérification, reçus de paiement et preuves de remboursement doivent rester dans des buckets privés.
- Toute modification touchant aux rôles, aux réservations, aux paiements, aux annulations ou aux remboursements doit être vérifiée avec les politiques RLS et les fonctions SQL correspondantes.
- Les données de test doivent rester isolées des vues publiques et des opérations réelles.

## Déploiement

1. Mettre à jour le frontend sur la branche de travail.
2. Vérifier les changements et ouvrir une Pull Request vers `main`.
3. Après revue et fusion, GitHub Pages publie la version de `main` selon la configuration du dépôt.
4. Les changements de base de données doivent être appliqués séparément sous forme de migrations Supabase, puis vérifiés avec les Security, Performance et Health Advisors.

## Principes du produit

OBNAR VACANCES doit rester simple à utiliser : découvrir les logements, consulter les informations essentielles, vérifier les disponibilités, réserver et suivre sa demande. Les nouvelles fonctions doivent répondre à un besoin réel sans compliquer inutilement le parcours.

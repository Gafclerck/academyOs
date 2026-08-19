# Contexte de l'application

## 1. Présentation générale

L'application est une plateforme de gestion de cohortes destinée à une institution qui organise des formations.

L'organisation repose sur quatre rôles principaux :

- **Administrateur** : gérant de l'institution.
- **Gestionnaire / Organisatrice** : responsable de la gestion opérationnelle des cohortes.
- **Formateur** : intervient dans la formation et le suivi pédagogique.
- **Apprenant** : participe à une formation au sein d'une cohorte.

## 2. Organisation des programmes

L'**Administrateur** crée et gère les programmes de formation.

Un programme représente une formation, par exemple **Développement Web**.

Chaque programme est directement associé à plusieurs **projets**.

```text
Programme : Développement Web
├── Projet 1
├── Projet 2
├── Projet 3
└── ...
```

Les projets constituent les travaux autour desquels s'organise la formation.

## 3. Organisation des sessions de formation

L'institution organise des **sessions de formation** correspondant à une période globale.

Exemple :

```text
Session : Été
Début : Juin
Fin : Octobre
```

Une même session de formation peut contenir plusieurs cohortes appartenant à différents programmes.

```text
Session d'été
├── Cohorte Développement Web
├── Cohorte Data
├── Cohorte Intelligence Artificielle
└── ...
```

Les cohortes d'une même session peuvent avoir des dates de début et de fin différentes, mais leur période doit être comprise dans l'intervalle de la session de formation.

```text
Session de formation
Juin ───────────────────────── Octobre
       │                    │
       ├── Cohorte A ───────┤
       ├──── Cohorte B ─────┤
       └── Cohorte C ───────┘
```

## 4. Gestion des cohortes

Une **cohorte** représente un groupe d'apprenants suivant un programme donné au cours d'une session de formation.

Une fois la cohorte créée, sa gestion opérationnelle est assurée par le **Gestionnaire / Organisatrice**.

Le gestionnaire est notamment chargé de :

- ajouter les formateurs à la cohorte ;
- ajouter les apprenants à la cohorte.

### 4.1 Affectation des formateurs

Les formateurs sont ajoutés à une cohorte via des **affectations**.

```text
Cohorte
   │
   └── Affectations
          ├── Formateur 1
          ├── Formateur 2
          └── ...
```

### 4.2 Inscription des apprenants

Les apprenants sont ajoutés à une cohorte via des **inscriptions**.

```text
Cohorte
   │
   └── Inscriptions
          ├── Apprenant 1
          ├── Apprenant 2
          ├── Apprenant 3
          └── ...
```

## 5. Attribution des mentors

Une fois les apprenants inscrits et les formateurs affectés à la cohorte, chaque apprenant est associé à un **mentor**.

Le mentor d'un apprenant est un formateur donné appartenant à la cohorte.

```text
Cohorte
│
├── Formateurs
│   ├── Formateur A
│   └── Formateur B
│
└── Apprenants
    ├── Apprenant 1 → Mentor : Formateur A
    ├── Apprenant 2 → Mentor : Formateur A
    └── Apprenant 3 → Mentor : Formateur B
```

## 6. Déroulement pédagogique

La formation est organisée autour de **sessions pédagogiques**, qui correspondent à des cours.

Une session pédagogique est créée par un formateur.

Chaque session pédagogique est liée à un **projet** du programme auquel appartient la cohorte.

```text
Programme : Développement Web
│
├── Projet 1
├── Projet 2
└── Projet 3

Cohorte Développement Web
│
├── Session pédagogique 1 ──→ Projet 1
├── Session pédagogique 2 ──→ Projet 1
├── Session pédagogique 3 ──→ Projet 1
├── Session pédagogique 4 ──→ Projet 2
└── ...
```

Plusieurs sessions pédagogiques peuvent donc être consacrées au même projet afin d'expliquer les concepts nécessaires à sa réalisation.

## 7. Gestion des absences

À la fin de chaque session pédagogique, les présences sont relevées.

Le système permet d'identifier :

- les apprenants présents ;
- les apprenants absents.

Les absences sont enregistrées pour la session pédagogique concernée et peuvent comporter un motif ainsi qu'une indication permettant de savoir si l'absence est justifiée.

```text
Session pédagogique
        │
        └── Présences / Absences
                ├── Apprenant 1 → Présent
                ├── Apprenant 2 → Absent
                └── Apprenant 3 → Présent
```

## 8. Réalisation et soumission des projets

Une fois que suffisamment de sessions pédagogiques ont été réalisées autour d'un projet et que les concepts nécessaires ont été abordés, les apprenants réalisent le projet.

À la fin de leur travail, les apprenants soumettent leur projet.

Les projets soumis sont ensuite **corrigés par les formateurs**.

```text
Projet
   ↓
Sessions pédagogiques
   ↓
Apprentissage des concepts
   ↓
Réalisation du projet
   ↓
Soumission
   ↓
Correction par un formateur
```

## 9. Certification

À la fin de la formation, un **certificat** est généré pour l'apprenant.

Le certificat possède notamment un fichier permettant de consulter le document généré ainsi qu'un statut et une date d'envoi.

```text
Formation
   ↓
Projets réalisés
   ↓
Projets soumis et corrigés
   ↓
Fin de formation
   ↓
Génération du certificat
   ↓
Mise à disposition du certificat
```

## 10. Vue d'ensemble

```text
Administrateur
      │
      ├── crée les programmes
      │
      └── associe les projets aux programmes
                    │
                    ▼
          Session de formation
          (période globale)
                    │
                    ├── Cohorte Programme A
                    ├── Cohorte Programme B
                    └── Cohorte Programme C
                           │
                           ▼
                    Gestionnaire
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
          Affectation des       Inscription des
            formateurs            apprenants
                 │                   │
                 └─────────┬─────────┘
                           ▼
                    Attribution des
                       mentors
                           │
                           ▼
                  Sessions pédagogiques
                         (cours)
                           │
                           ▼
                    Projet du programme
                           │
                           ▼
                  Suivi des présences
                           │
                           ▼
                  Réalisation du projet
                           │
                           ▼
                       Soumission
                           │
                           ▼
                    Correction par
                      les formateurs
                           │
                           ▼
                   Fin de formation
                           │
                           ▼
                    Génération du
                       certificat
```

## 11. Distinction entre les deux types de sessions

L'application distingue clairement deux concepts.

### Session de formation

C'est une **période globale** organisée par l'institution.

Exemple :

```text
Session d'été
Juin → Octobre
```

Elle peut contenir plusieurs cohortes de différents programmes.

### Session pédagogique

C'est un **cours** dispensé par un formateur à une cohorte.

Elle est liée à un projet précis du programme de la cohorte et permet notamment de suivre les présences.

```text
Session de formation
        │
        └── Cohorte
              │
              ├── Session pédagogique → Projet 1
              ├── Session pédagogique → Projet 1
              ├── Session pédagogique → Projet 2
              └── ...
```

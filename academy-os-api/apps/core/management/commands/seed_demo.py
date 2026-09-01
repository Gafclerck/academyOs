"""Injecte un jeu de données de démonstration (idempotent) pour tester tous les écrans.

Commande de gestion destinée au développement / recette (jamais en production) :

    python manage.py seed_demo
    python manage.py seed_demo --password "AutreMotDePasse!"
    python manage.py seed_demo --purge-demo

Ce que la commande crée (si absent) :
- des utilisateurs `demo.*@xarala.academy` (admin, organizer, formateurs, apprenants),
- 3 programmes, 3 rentrées (intakes), 5 cohortes (terminée / 3 en cours / à venir),
- 15 projets publiés avec critères d'évaluation détaillés,
- inscriptions, mentors, assignations, livrables corrigés (validés / rejetés / multi-versions),
- dates et chronologie parfaitement cohérentes (enrolled_at <= assigned_at <= submitted_at <= reviewed_at),
- certificats déclenchés (dont certains déjà émis 'ENVOYE' et un en attente 'EN_ATTENTE'),
- réclamations de certificats résolues ou en attente + notifications associées avec état lu/non-lu.

Idempotence : tous les objets sont récupérés par email / nom (get_or_create) ;
un second run ne modifie rien. `--purge-demo` supprime l'intégralité des données de
démonstration et nettoie les fichiers générés.
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone as tz

from apps.certificates.models import Certificate
from apps.certificates.services import generate_certificate_pdf
from apps.claims.models import Claim
from apps.claims.services import create_claim, update_claim_status
from apps.cohorts.models import Cohort, Enrollment, Intake, TrainerAssignment
from apps.cohorts.services import assign_mentor
from apps.evaluations.models import CriterionScore, Deliverable, EvaluationCriterion, ProjectAssignment
from apps.evaluations.services import create_assignments_for_enrollment, review_deliverable
from apps.notifications.models import Notification
from apps.programs.models import Program
from apps.projects.models import Project
from apps.users.models import User

USER_PREFIX = "demo."
DOMAIN = "xarala.academy"
DEFAULT_PASSWORD = "DemoPass123!"

# Noms exacts créés par le seed (déterministes) : ils servent de marqueur au purge.
DEMO_PROGRAM_TITLES = [
    "Développement Web Fullstack (JS)",
    "Data & Intelligence Artificielle",
    "UI/UX Design",
]
DEMO_INTAKE_NAMES = [
    "Rentrée Janvier 2025",
    "Rentrée Février 2026",
    "Rentrée Octobre 2026",
]
DEMO_COHORT_NAMES = [
    "Promo Janvier 2025 Fullstack",
    "Promo Février 2026 Fullstack",
    "Promo Février 2026 Data",
    "Promo Mars 2026 UI/UX Design",
    "Promo Octobre 2026 Fullstack",
]

FEEDBACKS = {
    CriterionScore.LevelEnum.MASTERED: "Maîtrise parfaite, livrable exemplaire et code très bien structuré.",
    CriterionScore.LevelEnum.ACQUIRED: "Compétence acquise, travail solide avec quelques optimisations possibles.",
    CriterionScore.LevelEnum.IN_PROGRESS: "Compétence en cours d'acquisition, plusieurs notions restent à consolider.",
    CriterionScore.LevelEnum.NOT_ACQUIRED: "Compétence non acquise, les attendus principaux ne sont pas remplis.",
}


def _dt(year, month, day, hour=9, minute=30):
    """Datetime naïf→aware dans le fuseau Django courant."""
    return tz.make_aware(
        datetime(year, month, day, hour, minute),
        tz.get_current_timezone(),
    )


def _email(slug):
    return f"{USER_PREFIX}{slug}@{DOMAIN}"


class Command(BaseCommand):
    help = "Injecte un jeu de données de démonstration (idempotent), voir le docstring."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Mot de passe commun des comptes de démo (défaut : {DEFAULT_PASSWORD}).",
        )
        parser.add_argument(
            "--purge-demo",
            action="store_true",
            help="Supprime toutes les données de démo (comptes demo.* + entités du seed) puis s'arrête.",
        )

    # ──────────────────────────────────────────────────────────────
    # Helpers de création
    # ──────────────────────────────────────────────────────────────

    def _user(self, slug, first, last, role, status=User.Status.ACTIVE, phone=None):
        email = _email(slug)
        user = User.objects.filter(email__iexact=email).first()
        if user:
            return user
        return User.objects.create_user(
            email=email,
            password=self.password,
            first_name=first,
            last_name=last,
            role=role,
            status=status,
            phone_number=phone,
        )

    def _program(self, name):
        return Program.objects.get_or_create(
            title=name,
            defaults={
                "description": f"Programme complet de formation professionnelle en {name}.",
                "status": Program.StatusProgramEnum.ACTIVE,
            },
        )[0]

    def _intake(self, name, start_date, status):
        return Intake.objects.get_or_create(
            name=name,
            defaults={"start_date": start_date, "status": status},
        )[0]

    def _cohort(self, name, program, intake, start, end, status):
        return Cohort.objects.get_or_create(
            name=name,
            defaults={
                "description": f"Cohorte de démonstration {name}.",
                "program": program,
                "intake": intake,
                "start_date": start,
                "end_date": end,
                "status": status,
            },
        )[0]

    def _enroll(self, cohort, user, status=Enrollment.StatusEnum.ACTIVE, enrolled_at=None):
        enrollment = Enrollment.objects.get_or_create(
            cohort=cohort,
            user=user,
            defaults={"status": status},
        )[0]
        if enrollment.status != status:
            enrollment.status = status
            Enrollment.objects.filter(pk=enrollment.pk).update(status=status, updated_at=tz.now())
        if enrolled_at:
            Enrollment.objects.filter(pk=enrollment.pk).update(enrolled_at=enrolled_at)
        create_assignments_for_enrollment(enrollment)
        if enrolled_at:
            ProjectAssignment.objects.filter(enrollment=enrollment).update(assigned_at=enrolled_at)
        return enrollment

    def _add_project(self, program, order, title, description, criteria):
        """Crée (si absent) un projet publié + ses critères d'évaluation."""
        project = Project.objects.get_or_create(
            program=program,
            order=order,
            defaults={
                "title": title,
                "description": description,
                "status": Project.StatusProjectEnum.PUBLISHED,
            },
        )[0]
        for idx, (competency, c_title) in enumerate(criteria, start=1):
            EvaluationCriterion.objects.get_or_create(
                project=project,
                order=idx,
                defaults={
                    "title": c_title,
                    "competency_name": competency,
                    "max_score": Decimal("20.00"),
                    "weight": Decimal("1.00"),
                    "description": FEEDBACKS[CriterionScore.LevelEnum.ACQUIRED],
                },
            )
        return project

    def _criterion_scores(self, project, seed, baseline):
        """Génère un jeu de notes par critère déterministe autour d'une moyenne."""
        rng = random.Random(seed)
        data = []
        for criterion in EvaluationCriterion.objects.filter(project=project).order_by("order"):
            ratio = max(0.1, min(1.0, baseline + rng.uniform(-0.10, 0.10)))
            score = Decimal(str(criterion.max_score)) * Decimal(str(round(ratio, 2)))
            if ratio >= 0.85:
                level = CriterionScore.LevelEnum.MASTERED
            elif ratio >= 0.70:
                level = CriterionScore.LevelEnum.ACQUIRED
            elif ratio >= 0.50:
                level = CriterionScore.LevelEnum.IN_PROGRESS
            else:
                level = CriterionScore.LevelEnum.NOT_ACQUIRED
            data.append(
                {
                    "criterion": str(criterion.id),
                    "score": str(score),
                    "level": level,
                    "feedback": FEEDBACKS[level],
                }
            )
        return data

    def _overall_score(self, project, criterion_scores_data):
        """Note globale en /20 = moyenne des ratios score/max_score des critères."""
        max_by_crit = {
            str(c.id): c.max_score
            for c in EvaluationCriterion.objects.filter(project=project)
        }
        ratios = []
        for item in criterion_scores_data:
            max_score = max_by_crit.get(item["criterion"])
            if max_score and max_score > 0:
                ratios.append(Decimal(item["score"]) / max_score)
        if not ratios:
            return None
        return round((sum(ratios) / Decimal(len(ratios))) * Decimal("20.00"), 2)

    def _spread(self, cohort, idx, count, offset_days=0):
        """Date échelonnée et strictement dans le passé par rapport à la date de fin / date courante."""
        span = (cohort.end_date - cohort.start_date).days
        day_offset = int(span * idx / (count + 1)) + offset_days
        day = cohort.start_date + timedelta(days=max(1, day_offset))
        dt = _dt(day.year, day.month, day.day, hour=10 + (idx % 6), minute=15)
        
        # Plafonne strictement dans le passé pour les cohortes en cours
        cap = tz.now() - timedelta(days=1)
        if cohort.status == Cohort.StatusEnum.ONGOING and dt > cap:
            return cap - timedelta(days=(count - idx) * 3)
        return dt

    def _submit_and_review(
        self,
        assignment,
        learner,
        trainer,
        baseline,
        seed,
        cohort,
        idx,
        count,
        submitted_at=None,
        reviewed_at=None,
        feedback="",
    ):
        """Crée un livrable validé avec historique de dates réaliste."""
        if assignment.deliverables.filter(status=Deliverable.StatusEnum.VALIDATED).exists():
            return None
        slug = learner.email.split("@")[0].replace(".", "-")
        sub_time = submitted_at or self._spread(cohort, idx, count, offset_days=0)
        rev_time = reviewed_at or self._spread(cohort, idx, count, offset_days=3)
        if rev_time <= sub_time:
            rev_time = sub_time + timedelta(days=2, hours=3)

        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=assignment.deliverables.count() + 1,
            submitted_by=learner,
            submitted_at=sub_time,
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Soumission du projet {assignment.project.order} : {assignment.project.title}.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        criterion_scores_data = self._criterion_scores(assignment.project, seed, baseline)
        review_deliverable(
            deliverable=deliverable,
            trainer=trainer,
            status_decision=Deliverable.StatusEnum.VALIDATED,
            score=self._overall_score(assignment.project, criterion_scores_data),
            feedback=feedback or "Excellent travail dans l'ensemble. Les objectifs du projet sont atteints.",
            criterion_scores_data=criterion_scores_data,
        )
        Deliverable.objects.filter(pk=deliverable.pk).update(
            submitted_at=sub_time,
            reviewed_at=rev_time,
            updated_at=rev_time,
        )
        return deliverable

    def _submit_pending(self, assignment, learner, cohort, idx, count, submitted_at=None):
        """Crée un livrable soumis en attente de correction."""
        if assignment.deliverables.exists():
            return None
        slug = learner.email.split("@")[0].replace(".", "-")
        sub_time = submitted_at or self._spread(cohort, idx, count)
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=learner,
            submitted_at=sub_time,
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Projet {assignment.project.order} terminé et prêt pour revue.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        ProjectAssignment.objects.filter(pk=assignment.pk).update(
            status=ProjectAssignment.StatusEnum.SUBMITTED,
            updated_at=sub_time,
        )
        return deliverable

    def _reject(self, assignment, learner, trainer, cohort, idx, count, feedback, submitted_at=None, reviewed_at=None):
        """Crée un livrable puis le rejette (assignation repasse en IN_PROGRESS)."""
        slug = learner.email.split("@")[0].replace(".", "-")
        sub_time = submitted_at or self._spread(cohort, idx, count, offset_days=0)
        rev_time = reviewed_at or self._spread(cohort, idx, count, offset_days=2)
        if rev_time <= sub_time:
            rev_time = sub_time + timedelta(days=2)

        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=assignment.deliverables.count() + 1,
            submitted_by=learner,
            submitted_at=sub_time,
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Version {assignment.deliverables.count() + 1} du projet {assignment.project.order}.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        review_deliverable(
            deliverable=deliverable,
            trainer=trainer,
            status_decision=Deliverable.StatusEnum.REJECTED,
            feedback=feedback,
        )
        Deliverable.objects.filter(pk=deliverable.pk).update(
            submitted_at=sub_time,
            reviewed_at=rev_time,
            updated_at=rev_time,
        )
        return deliverable

    def _ensure_pdf(self, cert):
        """S'assure qu'un fichier PDF valide est présent sur le storage pour le certificat."""
        if cert.file_path and default_storage.exists(cert.file_path):
            return
        try:
            generate_certificate_pdf(cert)
        except Exception:
            file_name = f"certificates/{cert.id}.pdf"
            dummy_pdf = (
                b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
                b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
                b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n"
                b"0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
            )
            saved = default_storage.save(file_name, ContentFile(dummy_pdf))
            Certificate.objects.filter(pk=cert.pk).update(file_path=saved)

    def _assignments(self, enrollment):
        """Assignations de l'inscription triées par ordre du projet."""
        return list(
            ProjectAssignment.objects.filter(enrollment=enrollment)
            .select_related("project", "project__program", "enrollment__cohort")
            .order_by("project__order")
        )

    # ──────────────────────────────────────────────────────────────
    # Purge
    # ──────────────────────────────────────────────────────────────

    @transaction.atomic
    def _purge_demo(self):
        # Suppression physique complète et ordonnée pour éviter tout blocage FK PROTECT
        for cert in Certificate.all_objects.filter(inscription__user__email__startswith=USER_PREFIX):
            if cert.file_path and default_storage.exists(cert.file_path):
                try:
                    default_storage.delete(cert.file_path)
                except Exception:
                    pass
            cert.hard_delete()

        Notification.all_objects.filter(recipient__email__startswith=USER_PREFIX).hard_delete()
        Claim.all_objects.filter(learner__email__startswith=USER_PREFIX).hard_delete()
        CriterionScore.all_objects.filter(
            deliverable__assignment__enrollment__user__email__startswith=USER_PREFIX
        ).hard_delete()
        Deliverable.all_objects.filter(submitted_by__email__startswith=USER_PREFIX).hard_delete()
        Deliverable.all_objects.filter(
            assignment__enrollment__user__email__startswith=USER_PREFIX
        ).hard_delete()
        ProjectAssignment.all_objects.filter(
            enrollment__user__email__startswith=USER_PREFIX
        ).hard_delete()
        Enrollment.all_objects.filter(user__email__startswith=USER_PREFIX).hard_delete()
        TrainerAssignment.all_objects.filter(user__email__startswith=USER_PREFIX).hard_delete()

        deleted_users = User.objects.filter(email__startswith=USER_PREFIX).count()
        for user in User.objects.filter(email__startswith=USER_PREFIX):
            user.hard_delete()

        deleted_cohorts = Cohort.all_objects.filter(name__in=DEMO_COHORT_NAMES).count()
        Cohort.all_objects.filter(name__in=DEMO_COHORT_NAMES).hard_delete()

        deleted_criteria = EvaluationCriterion.all_objects.filter(
            project__program__title__in=DEMO_PROGRAM_TITLES
        ).count()
        EvaluationCriterion.all_objects.filter(
            project__program__title__in=DEMO_PROGRAM_TITLES
        ).hard_delete()

        deleted_projects = Project.all_objects.filter(program__title__in=DEMO_PROGRAM_TITLES).count()
        Project.all_objects.filter(program__title__in=DEMO_PROGRAM_TITLES).hard_delete()

        deleted_programs = Program.all_objects.filter(title__in=DEMO_PROGRAM_TITLES).count()
        Program.all_objects.filter(title__in=DEMO_PROGRAM_TITLES).hard_delete()

        deleted_intakes = Intake.all_objects.filter(name__in=DEMO_INTAKE_NAMES).count()
        Intake.all_objects.filter(name__in=DEMO_INTAKE_NAMES).hard_delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Purge terminée : {deleted_users} utilisateurs, {deleted_cohorts} cohortes, "
                f"{deleted_criteria} critères, {deleted_projects} projets, {deleted_programs} programmes, "
                f"{deleted_intakes} rentrées (intakes)."
            )
        )

    # ──────────────────────────────────────────────────────────────
    # Seed
    # ──────────────────────────────────────────────────────────────

    @transaction.atomic
    def _seed(self):
        # 1. Utilisateurs
        admin = self._user("admin", "Admin", "Xarala", User.Role.ADMIN, phone="+221 33 825 00 00")
        organizer = self._user("organizer", "Organisation", "Academy", User.Role.ORGANIZER, phone="+221 33 825 00 01")

        trainers = {
            "t1": self._user("trainer1", "Moussa", "Diallo", User.Role.TRAINER, phone="+221 77 100 10 01"),
            "t2": self._user("trainer2", "Aïssatou", "Ndiaye", User.Role.TRAINER, phone="+221 76 200 20 02"),
            "t3": self._user("trainer3", "Ibrahima", "Fall", User.Role.TRAINER, phone="+221 70 300 30 03"),
            "t4": self._user("trainer4", "Fatou", "Sow", User.Role.TRAINER, phone="+221 78 400 40 04"),
        }

        learners = {
            "s1": self._user("student1", "Awa", "Diop", User.Role.LEARNER, phone="+221 77 111 11 11"),
            "s2": self._user("student2", "Ousmane", "Ba", User.Role.LEARNER, phone="+221 77 222 22 22"),
            "s3": self._user("student3", "Mariama", "Cissé", User.Role.LEARNER, phone="+221 76 333 33 33"),
            "s4": self._user("student4", "Cheikh", "Gueye", User.Role.LEARNER, phone="+221 70 444 44 44"),
            "s5": self._user("student5", "Fatou", "Ndiaye", User.Role.LEARNER, phone="+221 78 555 55 55"),
            "s6": self._user("student6", "Ibrahima", "Sarr", User.Role.LEARNER, phone="+221 77 666 66 66"),
            "s7": self._user("student7", "Khady", "Fall", User.Role.LEARNER, phone="+221 76 777 77 77"),
            "s8": self._user("student8", "Abdoulaye", "Kane", User.Role.LEARNER, phone="+221 70 888 88 88"),
            "s9": self._user("student9", "Ndeye", "Sow", User.Role.LEARNER, phone="+221 78 999 99 99"),
            "s10": self._user("student10", "Moussa", "Camara", User.Role.LEARNER, phone="+221 77 123 45 67"),
            "s11": self._user("student11", "Aïda", "Ndiaye", User.Role.LEARNER, phone="+221 76 234 56 78"),
            "s12": self._user("student12", "Modou", "Thiam", User.Role.LEARNER, phone="+221 70 345 67 89"),
            "s13": self._user("student13", "Rokhaya", "Gaye", User.Role.LEARNER, status=User.Status.SUSPENDED),
            "s14": self._user("student14", "Mar", "Sall", User.Role.LEARNER, status=User.Status.ARCHIVED),
        }

        # 2. Programmes & Projets
        p_fullstack = self._program("Développement Web Fullstack (JS)")
        p_data = self._program("Data & Intelligence Artificielle")
        p_ux = self._program("UI/UX Design")

        self._add_project(
            p_fullstack, 1, "Site vitrine responsive",
            "Conception et intégration d'un site vitrine moderne et responsive.",
            [
                ("Design", "Qualité de l'intégration et fidélité à la maquette"),
                ("Frontend", "HTML5 sémantique et CSS responsive (Flexbox/Grid)"),
                ("Frontend", "Interactivité JavaScript native"),
                ("Software", "Organisation des assets et clarté du code"),
            ],
        )
        self._add_project(
            p_fullstack, 2, "API REST & Base de données PostgreSQL",
            "Création d'une API REST complète avec gestion des transactions.",
            [
                ("Backend", "Modélisation relationnelle PostgreSQL"),
                ("Backend", "Endpoints CRUD et codes de réponse HTTP standard"),
                ("Software", "Validation des schémas et gestion des erreurs"),
                ("DevOps", "Variables d'environnement et documentation Swagger"),
            ],
        )
        self._add_project(
            p_fullstack, 3, "Authentification sécurisée JWT & RBAC",
            "Mise en place d'un système d'authentification robuste avec rôles.",
            [
                ("Backend", "Authentification JWT avec rotation de refresh token"),
                ("Backend", "Contrôle d'accès basé sur les rôles (RBAC)"),
                ("DevOps", "Sécurité applicative (hashing argon2, CORS, rate limit)"),
                ("Software", "Tests unitaires et d'intégration de l'API"),
            ],
        )
        self._add_project(
            p_fullstack, 4, "Application Full Stack React & Node.js",
            "Développement d'une application dynamique avec état complexe.",
            [
                ("Frontend", "Composants React, hooks personnalisés et formulaires"),
                ("Frontend", "Gestion du cache et requêtes asynchrones"),
                ("Software", "Typage TypeScript et gestion des erreurs UI"),
                ("DevOps", "Déploiement continu sur plateforme cloud"),
            ],
        )
        self._add_project(
            p_fullstack, 5, "Pipeline CI/CD & Déploiement Cloud",
            "Industrialisation, containerisation Docker et pipeline automatisé.",
            [
                ("DevOps", "Containerisation multi-stage Docker"),
                ("DevOps", "Pipeline GitHub Actions (lint, tests, build)"),
                ("DevOps", "Monitoring, logs centralisés et haute disponibilité"),
                ("Software", "Documentation d'exploitation et soutenance finale"),
            ],
        )

        self._add_project(
            p_data, 1, "Analyse exploratoire et nettoyage de données",
            "Exploration statistique approfondie et préparation d'un jeu de données complexe.",
            [
                ("Data", "Nettoyage des valeurs manquantes et imputation"),
                ("Data", "Analyse descriptive et visualisations pertinentes"),
                ("Software", "Reproductibilité du pipeline (Notebooks/Scripts)"),
                ("Software", "Synthèse analytique et présentation des conclusions"),
            ],
        )
        self._add_project(
            p_data, 2, "Modélisation Machine Learning supervisée",
            "Entraînement, optimisation et évaluation de modèles de classification/régression.",
            [
                ("Data", "Feature engineering et sélection de variables"),
                ("Data", "Entraînement et validation croisée des modèles"),
                ("Data", "Analyse des métriques (F1-score, ROC-AUC, matrice de confusion)"),
                ("Software", "Versionnement du code et des artefacts de modèle"),
            ],
        )
        self._add_project(
            p_data, 3, "Pipeline d'ingestion & API de prédiction FastAPI",
            "Mise en production d'un modèle via une API REST rapide et documentée.",
            [
                ("DevOps", "Pipeline d'ingestion et transformation automatisée"),
                ("Backend", "Endpoints FastAPI d'inférence en temps réel"),
                ("Software", "Validation des payloads Pydantic et tests unitaires"),
                ("DevOps", "Conteneurisation et documentation OpenAPI"),
            ],
        )
        self._add_project(
            p_data, 4, "Tableau de bord décisionnel interactif",
            "Création d'un dashboard de pilotage pour les décideurs métiers.",
            [
                ("Data", "Modélisation en étoile et mesures analytiques DAX"),
                ("Data", "Pertinence des KPIs et ergonomie de restitution"),
                ("Software", "Actualisation automatique et gouvernance des données"),
                ("Software", "Restitution orale et storytelling data"),
            ],
        )
        self._add_project(
            p_data, 5, "Projet IA End-to-End en conditions réelles",
            "Solution complète d'intelligence artificielle déployée en production.",
            [
                ("Data", "Cadrage du cas d'usage et choix des algorithmes"),
                ("Backend", "Architecture robuste du service d'inférence"),
                ("DevOps", "Monitoring du data drift et réentraînement"),
                ("Software", "Rapport final d'ingénierie et soutenance devant jury"),
            ],
        )

        self._add_project(
            p_ux, 1, "Recherche utilisateur & Audit ergonomique",
            "Conduite d'interviews utilisateurs et audit heuristique d'une application existante.",
            [
                ("Research", "Protocole d'interviews et personas"),
                ("Design", "Audit ergonomique selon les critères de Bastien & Scapin"),
                ("Research", "User journey map et opportunités d'amélioration"),
            ],
        )
        self._add_project(
            p_ux, 2, "Architecture de l'information & Wireframes",
            "Définition de l'arborescence et prototypage basse fidélité.",
            [
                ("Design", "Structure de navigation et hiérarchie visuelle"),
                ("Design", "Wireframes basse fidélité des flux clés"),
                ("Research", "Tests d'utilisabilité sur les schémas de parcours"),
            ],
        )
        self._add_project(
            p_ux, 3, "Design System complet sur Figma",
            "Création d'un système de composants cohérent et accessible.",
            [
                ("Design", "Tokens (couleurs, typographie, espacements) et accessibilité"),
                ("Design", "Composants avec variantes et auto-layout"),
                ("Software", "Documentation des guidelines d'utilisation"),
            ],
        )
        self._add_project(
            p_ux, 4, "Prototype haute fidélité & Micro-interactions",
            "Conception d'un prototype interactif riche prêt pour les tests.",
            [
                ("Design", "Rendu visuel haute fidélité et animations"),
                ("Design", "Interactivité complète des scénarios d'usage"),
                ("Research", "Documentation des spécifications pour développeurs"),
            ],
        )
        self._add_project(
            p_ux, 5, "Tests d'utilisabilité & Restitution finale",
            "Évaluation du prototype avec un panel d'utilisateurs et synthèse des itérations.",
            [
                ("Research", "Passation des tests utilisateurs et métriques SUS"),
                ("Research", "Analyse des retours et recommandations priorisées"),
                ("Design", "Itérations finales et soutenance du projet"),
            ],
        )

        # 3. Rentrées (Intakes) & Cohortes
        intake_2025 = self._intake("Rentrée Janvier 2025", _dt(2025, 1, 6).date(), Intake.StatusEnum.COMPLETED)
        intake_2026 = self._intake("Rentrée Février 2026", _dt(2026, 2, 9).date(), Intake.StatusEnum.ONGOING)
        intake_oct = self._intake("Rentrée Octobre 2026", _dt(2026, 10, 5).date(), Intake.StatusEnum.UPCOMING)

        c_2025 = self._cohort(
            "Promo Janvier 2025 Fullstack", p_fullstack, intake_2025,
            _dt(2025, 1, 13).date(), _dt(2025, 8, 29).date(), Cohort.StatusEnum.COMPLETED,
        )
        c_2026_fs = self._cohort(
            "Promo Février 2026 Fullstack", p_fullstack, intake_2026,
            _dt(2026, 2, 9).date(), _dt(2026, 11, 27).date(), Cohort.StatusEnum.ONGOING,
        )
        c_2026_data = self._cohort(
            "Promo Février 2026 Data", p_data, intake_2026,
            _dt(2026, 2, 9).date(), _dt(2026, 11, 27).date(), Cohort.StatusEnum.ONGOING,
        )
        c_2026_ux = self._cohort(
            "Promo Mars 2026 UI/UX Design", p_ux, intake_2026,
            _dt(2026, 3, 2).date(), _dt(2026, 10, 30).date(), Cohort.StatusEnum.ONGOING,
        )
        c_2026_oct = self._cohort(
            "Promo Octobre 2026 Fullstack", p_fullstack, intake_oct,
            _dt(2026, 10, 12).date(), _dt(2027, 5, 28).date(), Cohort.StatusEnum.UPCOMING,
        )

        # 4. Affectations Formateurs
        ta_c2025 = TrainerAssignment.objects.get_or_create(
            cohort=c_2025, user=trainers["t1"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_fs1 = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_fs, user=trainers["t1"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_fs2 = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_fs, user=trainers["t2"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_data = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_data, user=trainers["t3"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_ux = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_ux, user=trainers["t4"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_oct = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_oct, user=trainers["t4"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]

        # 5. Inscriptions, Mentors & Horodatages initiaux
        # --- Cohorte 1 (Terminée en 2025) ---
        t_enr_2025 = _dt(2025, 1, 13, 9, 0)
        en_s1_c1 = self._enroll(c_2025, learners["s1"], Enrollment.StatusEnum.COMPLETED, enrolled_at=t_enr_2025)
        en_s2_c1 = self._enroll(c_2025, learners["s2"], Enrollment.StatusEnum.COMPLETED, enrolled_at=t_enr_2025)
        en_s3_c1 = self._enroll(c_2025, learners["s3"], Enrollment.StatusEnum.COMPLETED, enrolled_at=t_enr_2025)
        self._enroll(c_2025, learners["s14"], Enrollment.StatusEnum.DROPPED, enrolled_at=t_enr_2025)
        assign_mentor(en_s1_c1, ta_c2025)
        assign_mentor(en_s2_c1, ta_c2025)
        assign_mentor(en_s3_c1, ta_c2025)

        # --- Cohorte 2 (Fullstack 2026 en cours) ---
        t_enr_2026 = _dt(2026, 2, 9, 9, 0)
        en_s4_c2 = self._enroll(c_2026_fs, learners["s4"], enrolled_at=t_enr_2026)
        en_s5_c2 = self._enroll(c_2026_fs, learners["s5"], enrolled_at=t_enr_2026)
        en_s6_c2 = self._enroll(c_2026_fs, learners["s6"], enrolled_at=t_enr_2026)
        en_s7_c2 = self._enroll(c_2026_fs, learners["s7"], enrolled_at=t_enr_2026)
        assign_mentor(en_s4_c2, ta_c2026_fs1)
        assign_mentor(en_s5_c2, ta_c2026_fs2)
        assign_mentor(en_s6_c2, ta_c2026_fs1)
        assign_mentor(en_s7_c2, ta_c2026_fs2)

        # --- Cohorte 3 (Data 2026 en cours - Multi-formation S1 et S3 diplômés 2025) ---
        en_s1_c3 = self._enroll(c_2026_data, learners["s1"], enrolled_at=t_enr_2026)
        en_s3_c3 = self._enroll(c_2026_data, learners["s3"], enrolled_at=t_enr_2026)
        en_s8_c3 = self._enroll(c_2026_data, learners["s8"], enrolled_at=t_enr_2026)
        en_s9_c3 = self._enroll(c_2026_data, learners["s9"], enrolled_at=t_enr_2026)
        en_s10_c3 = self._enroll(c_2026_data, learners["s10"], enrolled_at=t_enr_2026)
        assign_mentor(en_s1_c3, ta_c2026_data)
        assign_mentor(en_s3_c3, ta_c2026_data)
        assign_mentor(en_s8_c3, ta_c2026_data)
        assign_mentor(en_s9_c3, ta_c2026_data)
        assign_mentor(en_s10_c3, ta_c2026_data)

        # --- Cohorte 4 (UI/UX 2026 en cours) ---
        t_enr_ux = _dt(2026, 3, 2, 9, 0)
        en_s11_c4 = self._enroll(c_2026_ux, learners["s11"], enrolled_at=t_enr_ux)
        en_s12_c4 = self._enroll(c_2026_ux, learners["s12"], enrolled_at=t_enr_ux)
        assign_mentor(en_s11_c4, ta_c2026_ux)
        assign_mentor(en_s12_c4, ta_c2026_ux)

        # --- Cohorte 5 (Octobre 2026 à venir) ---
        t_enr_oct = _dt(2026, 8, 15, 10, 0)
        en_s4_c5 = self._enroll(c_2026_oct, learners["s4"], enrolled_at=t_enr_oct)
        self._enroll(c_2026_oct, learners["s13"], Enrollment.StatusEnum.SUSPENDED, enrolled_at=t_enr_oct)
        assign_mentor(en_s4_c5, ta_c2026_oct)

        # 6. Historique des Livrables et Corrections
        t1, t2, t3, t4 = trainers["t1"], trainers["t2"], trainers["t3"], trainers["t4"]

        # C1 (2025) : Validation complète 5/5 pour S1, S2, S3
        for i, a in enumerate(self._assignments(en_s1_c1), start=1):
            self._submit_and_review(a, learners["s1"], t1, 0.88, f"s1-c1-{a.project.order}", c_2025, i, 5)

        for i, a in enumerate(self._assignments(en_s2_c1), start=1):
            self._submit_and_review(a, learners["s2"], t1, 0.78, f"s2-c1-{a.project.order}", c_2025, i, 5)

        for i, a in enumerate(self._assignments(en_s3_c1), start=1):
            self._submit_and_review(a, learners["s3"], t1, 0.72, f"s3-c1-{a.project.order}", c_2025, i, 5)

        # C2 (2026 FS) :
        # S4 : 4/5 validés (seuil 80% atteint, projet 5 en cours avec échéance)
        for i, a in enumerate(self._assignments(en_s4_c2), start=1):
            if a.project.order <= 4:
                self._submit_and_review(a, learners["s4"], t2, 0.85, f"s4-c2-{a.project.order}", c_2026_fs, i, 5)
            else:
                ProjectAssignment.objects.filter(pk=a.pk).update(
                    deadline_override=tz.now() + timedelta(days=20),
                )

        # S5 : 2/5 validés, projet 3 soumis en attente (délai dépassé)
        for i, a in enumerate(self._assignments(en_s5_c2), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s5"], t2, 0.70, f"s5-c2-{a.project.order}", c_2026_fs, i, 5)
            elif a.project.order == 3:
                self._submit_pending(
                    a, learners["s5"], c_2026_fs, i, 5,
                    submitted_at=tz.now() - timedelta(days=5),
                )
                ProjectAssignment.objects.filter(pk=a.pk).update(
                    deadline_override=tz.now() - timedelta(days=2),
                )

        # S6 : 1/5 validé + Projet 2 avec historique multi-versions (V1 rejetée, V2 validée)
        a1_s6, a2_s6 = self._assignments(en_s6_c2)[:2]
        self._submit_and_review(
            a1_s6, learners["s6"], t1, 0.65, "s6-c2-1", c_2026_fs, 1, 5,
            submitted_at=_dt(2026, 3, 10), reviewed_at=_dt(2026, 3, 15),
        )
        self._reject(
            a2_s6, learners["s6"], t1, c_2026_fs, 2, 5,
            "Il manque la gestion des erreurs HTTP et la documentation Swagger. Merci de compléter ces points avant de resoumettre.",
            submitted_at=_dt(2026, 4, 10), reviewed_at=_dt(2026, 4, 15),
        )
        self._submit_and_review(
            a2_s6, learners["s6"], t1, 0.76, "s6-c2-2-v2", c_2026_fs, 2, 5,
            submitted_at=_dt(2026, 4, 22), reviewed_at=_dt(2026, 4, 26),
            feedback="Excellente reprise du livrable. Les remarques ont été appliquées et l'API est maintenant complète.",
        )

        # S7 : 0/5 validé (apprenant à risque de décrochage)

        # C3 (2026 Data) :
        # S1 (multi-formation) : 2/5 validés
        for i, a in enumerate(self._assignments(en_s1_c3), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s1"], t3, 0.88, f"s1-c3-{a.project.order}", c_2026_data, i, 5)

        # S3 (multi-formation) : 3/5 validés
        for i, a in enumerate(self._assignments(en_s3_c3), start=1):
            if a.project.order <= 3:
                self._submit_and_review(a, learners["s3"], t3, 0.74, f"s3-c3-{a.project.order}", c_2026_data, i, 5)

        # S8 : 2/5 validés
        for i, a in enumerate(self._assignments(en_s8_c3), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s8"], t3, 0.72, f"s8-c3-{a.project.order}", c_2026_data, i, 5)

        # S9 : 1/5 validé + Projet 2 soumis en attente
        for i, a in enumerate(self._assignments(en_s9_c3), start=1):
            if a.project.order == 1:
                self._submit_and_review(a, learners["s9"], t3, 0.62, "s9-c3-1", c_2026_data, 1, 5)
            elif a.project.order == 2:
                self._submit_pending(
                    a, learners["s9"], c_2026_data, 2, 5,
                    submitted_at=tz.now() - timedelta(days=3),
                )

        # S10 : 0/5 validé (apprenant à risque)

        # C4 (2026 UI/UX) :
        # S11 : 2/5 validés
        for i, a in enumerate(self._assignments(en_s11_c4), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s11"], t4, 0.82, f"s11-c4-{a.project.order}", c_2026_ux, i, 5)

        # S12 : 1/5 validé + Projet 2 soumis en attente
        for i, a in enumerate(self._assignments(en_s12_c4), start=1):
            if a.project.order == 1:
                self._submit_and_review(a, learners["s12"], t4, 0.75, "s12-c4-1", c_2026_ux, 1, 5)
            elif a.project.order == 2:
                self._submit_pending(
                    a, learners["s12"], c_2026_ux, 2, 5,
                    submitted_at=tz.now() - timedelta(days=2),
                )

        # 7. Certificats & Fichiers PDF
        # 7. Certificats & Fichiers PDF initiaux
        cert_s1 = Certificate.objects.filter(inscription=en_s1_c1).first()
        cert_s2 = Certificate.objects.filter(inscription=en_s2_c1).first()
        cert_s3 = Certificate.objects.filter(inscription=en_s3_c1).first()
        cert_s4 = Certificate.objects.filter(inscription=en_s4_c2).first()

        # Certificat S1 : en attente de remise (objet de la réclamation 1)
        if cert_s1:
            Certificate.objects.filter(pk=cert_s1.pk).update(
                status=Certificate.StatusCertificateEnum.PENDING,
                date_generation=_dt(2025, 8, 29, 16, 0),
            )
            cert_s1.refresh_from_db()
            self._ensure_pdf(cert_s1)

        # Certificat S2 : initialisé en attente (avant réclamation)
        if cert_s2:
            Certificate.objects.filter(pk=cert_s2.pk).update(
                status=Certificate.StatusCertificateEnum.PENDING,
                date_generation=_dt(2025, 8, 29, 16, 0),
            )
            cert_s2.refresh_from_db()
            self._ensure_pdf(cert_s2)

        # Certificat S3 : délivré normalement à la fin de la formation
        if cert_s3:
            Certificate.objects.filter(pk=cert_s3.pk).update(
                status=Certificate.StatusCertificateEnum.SENT,
                sent_by=admin,
                date_generation=_dt(2025, 8, 29, 16, 0),
                date_envoi=_dt(2025, 9, 5, 10, 0),
            )
            cert_s3.refresh_from_db()
            self._ensure_pdf(cert_s3)

        # Certificat S4 : généré en cours de parcours (80%)
        if cert_s4:
            Certificate.objects.filter(pk=cert_s4.pk).update(
                status=Certificate.StatusCertificateEnum.PENDING,
                date_generation=tz.now() - timedelta(days=10),
            )
            cert_s4.refresh_from_db()
            self._ensure_pdf(cert_s4)

        # 8. Réclamations de Certificats & Notifications associées
        # Réclamation 1 : S1 sur son certificat non reçu (En attente PENDING)
        if cert_s1 and not Claim.objects.filter(certificate=cert_s1).exists():
            c1_time = tz.now() - timedelta(days=6)
            claim1 = create_claim(
                learners["s1"],
                cert_s1.id,
                "Bonjour, j'ai validé l'ensemble de mes projets en août 2025 mais je n'ai toujours pas reçu mon certificat officiel. Pourriez-vous vérifier son émission ?",
            )
            Claim.objects.filter(pk=claim1.pk).update(created_at=c1_time, updated_at=c1_time)
            # Notification apprenant lue, notification admin non lue (badge dashboard)
            Notification.objects.filter(object_id=claim1.id, recipient=learners["s1"]).update(
                is_read=True, read_at=c1_time + timedelta(minutes=5), created_at=c1_time,
            )
            Notification.objects.filter(object_id=claim1.id, recipient__in=[admin, organizer]).update(
                is_read=False, created_at=c1_time,
            )

        # Réclamation 2 : S2 sur l'orthographe de son nom (Résolue RESOLVED)
        if cert_s2 and not Claim.objects.filter(certificate=cert_s2).exists():
            c2_time = _dt(2025, 9, 10, 14, 0)
            res_time = _dt(2025, 9, 15, 11, 0)
            claim2 = create_claim(
                learners["s2"],
                cert_s2.id,
                "Bonjour, une coquille s'est glissée sur l'orthographe de mon prénom sur le document de synthèse. Pouvez-vous actualiser mon certificat ?",
            )
            update_claim_status(claim2, Claim.StatusEnum.IN_PROGRESS, handled_by=admin)
            update_claim_status(
                claim2,
                Claim.StatusEnum.RESOLVED,
                admin_response="Bonjour Ousmane, la correction a été effectuée avec succès. Votre certificat officiel actualisé est disponible dans votre espace.",
                handled_by=admin,
            )
            Claim.objects.filter(pk=claim2.pk).update(
                created_at=c2_time,
                handled_at=res_time,
                updated_at=res_time,
            )
            # Toutes les notifications relatives à cette ancienne réclamation sont marquées lues
            Notification.objects.filter(object_id=claim2.id).update(
                is_read=True,
                read_at=res_time + timedelta(minutes=15),
                created_at=res_time,
            )
            # Le certificat S2 est passé au statut SENT suite à la résolution
            Certificate.objects.filter(pk=cert_s2.pk).update(
                status=Certificate.StatusCertificateEnum.SENT,
                sent_by=admin,
                date_envoi=res_time,
                updated_at=res_time,
            )
            cert_s2.refresh_from_db()

    # ──────────────────────────────────────────────────────────────
    # Entry point
    # ──────────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        if options["purge_demo"]:
            self._purge_demo()
            return

        self.password = options["password"]
        if not self.password or len(self.password) < 8:
            raise CommandError("Le mot de passe doit contenir au moins 8 caractères.")

        from unittest.mock import patch
        with patch("apps.certificates.tasks.generate_certificate_pdf_task.delay"), \
             patch("apps.certificates.tasks.send_certificate_email_task.delay"):
            self._seed()

        self.stdout.write(self.style.SUCCESS("Jeu de démonstration à jour (idempotent) ✓"))
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Comptes de démonstration"))
        self.stdout.write(f"  Admin     : {_email('admin')}  / {self.password}")
        self.stdout.write(f"  Organizer : {_email('organizer')}  / {self.password}")
        for slug in ("trainer1", "trainer2", "trainer3", "trainer4"):
            self.stdout.write(f"  Formateur : {_email(slug)}  / {self.password}")
        self.stdout.write(
            "  Apprenants : "
            + ", ".join(_email(f"student{i}") for i in range(1, 15))
            + f"  / tous : {self.password}"
        )
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Volumétrie"))
        counts = {
            "Utilisateurs": User.objects.filter(email__startswith=USER_PREFIX).count(),
            "Programmes": Program.objects.filter(title__in=DEMO_PROGRAM_TITLES).count(),
            "Rentrées (Intakes)": Intake.objects.filter(name__in=DEMO_INTAKE_NAMES).count(),
            "Cohortes": Cohort.objects.filter(name__in=DEMO_COHORT_NAMES).count(),
            "Inscriptions": Enrollment.objects.filter(user__email__startswith=USER_PREFIX).count(),
            "Affectations formateurs": TrainerAssignment.objects.filter(
                user__email__startswith=USER_PREFIX
            ).count(),
            "Projets": Project.objects.filter(program__title__in=DEMO_PROGRAM_TITLES).count(),
            "Critères": EvaluationCriterion.objects.filter(
                project__program__title__in=DEMO_PROGRAM_TITLES
            ).count(),
            "Assignations projet": ProjectAssignment.objects.filter(
                enrollment__user__email__startswith=USER_PREFIX
            ).count(),
            "Livrables": Deliverable.objects.filter(
                assignment__enrollment__user__email__startswith=USER_PREFIX
            ).count(),
            "Notes par critère": CriterionScore.objects.filter(
                deliverable__assignment__enrollment__user__email__startswith=USER_PREFIX
            ).count(),
            "Certificats": Certificate.objects.filter(
                inscription__user__email__startswith=USER_PREFIX
            ).count(),
            "Réclamations": Claim.objects.filter(learner__email__startswith=USER_PREFIX).count(),
            "Notifications": Notification.objects.filter(
                recipient__email__startswith=USER_PREFIX
            ).count(),
        }
        for label, value in counts.items():
            self.stdout.write(f"  {label:<26} : {value}")
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("Fichiers PDF de certificats synchronisés dans le stockage de démonstration ✓")
        )
"""Injecte un jeu de données de démonstration (idempotent) pour tester tous les écrans.

Commande de gestion destinée au développement / recette (jamais en production) :

    python manage.py seed_demo
    python manage.py seed_demo --password "AutreMotDePasse!"
    python manage.py seed_demo --purge-demo

Ce que la commande crée (si absent) :
- des utilisateurs `demo.*@xarala.academy` (admin, organizer, formateurs, apprenants),
- 3 programmes, 3 intakes, 4 cohortes (terminée / 2 en cours / à venir),
- 15 projets publiés avec critères d'évaluation,
- inscriptions + mentors + assignations + livrables corrigés (validés / rejetés /
  en attente) via les services métier (invariants du parcours respectés),
- certificats déclenchés à 80 % (PDF généré par Celery),
- 2 réclamations de certificat + notifications associées.

Idempotence : tous les objets sont récupérés par email / nom (get_or_create) ;
un second run ne modifie rien. `--purge-demo` supprime uniquement les données de
démonstration : comptes `demo.*` + programmes/intakes/cohortes dont les noms
figurent dans les listes DEMO_*_TITLES/NAMES (les noms affichés ne portent aucun
préfixe « DÉMO »).

Aucun email n'est envoyé : les comptes sont créés directement avec un mot de
passe utilisable (pas le flux invite/reset).
"""

import random
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone as tz

from apps.certificates.models import Certificate
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
    "Promo Octobre 2026 Fullstack",
]

FEEDBACKS = {
    CriterionScore.LevelEnum.MASTERED: "Maîtrise parfaite, livrable exemplaire.",
    CriterionScore.LevelEnum.ACQUIRED: "Compétence acquise, quelques axes d'amélioration possibles.",
    CriterionScore.LevelEnum.IN_PROGRESS: "Compétence en cours d'acquisition, à consolider.",
    CriterionScore.LevelEnum.NOT_ACQUIRED: "Compétence non acquise, à retravailler.",
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
    # Helpers
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
                "description": "Programme de démonstration.",
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
                "description": "Cohorte de démonstration.",
                "program": program,
                "intake": intake,
                "start_date": start,
                "end_date": end,
                "status": status,
            },
        )[0]

    def _enroll(self, cohort, user, status=Enrollment.StatusEnum.ACTIVE):
        enrollment = Enrollment.objects.get_or_create(
            cohort=cohort,
            user=user,
            defaults={"status": status},
        )[0]
        if enrollment.status != status:
            enrollment.status = status
            Enrollment.objects.filter(pk=enrollment.pk).update(status=status, updated_at=tz.now())
        create_assignments_for_enrollment(enrollment)
        return enrollment

    def _add_project(self, program, order, title, criteria):
        """Crée (si absent) un projet publié + ses critères d'évaluation.

        `criteria` : liste de (competency_name, title).
        """
        project = Project.objects.get_or_create(
            program=program,
            order=order,
            defaults={
                "title": title,
                "description": "Énoncé et consignes du projet de démonstration.",
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
            ratio = max(0.1, min(1.0, baseline + rng.uniform(-0.15, 0.15)))
            score = Decimal(str(criterion.max_score)) * Decimal(str(round(ratio, 3)))
            if ratio >= 0.9:
                level = CriterionScore.LevelEnum.MASTERED
            elif ratio >= 0.75:
                level = CriterionScore.LevelEnum.ACQUIRED
            elif ratio >= 0.5:
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

    def _spread(self, cohort, idx, count):
        """Date échelonnée (debut→fin de cohorte) pour la version `idx`/`count`."""
        span = (cohort.end_date - cohort.start_date).days
        day = cohort.start_date + timedelta(days=int(span * idx / (count + 1)))
        return _dt(day.year, day.month, day.day)

    def _submit_and_review(self, assignment, learner, trainer, baseline, seed, cohort, idx, count):
        """Crée le livrable v1, le corrige en 'validated' et revient en arrière.

        Idempotent : ne fait rien si l'assignation a déjà un livrable. Retourne le
        livrable corrigé (les dates submitted_at/reviewed_at sont forcées dans le
        passé pour un historique réaliste).
        """
        if assignment.deliverables.exists() or assignment.status == ProjectAssignment.StatusEnum.VALIDATED:
            return None
        slug = learner.email.split("@")[0]
        submitted_at = self._spread(cohort, idx, count)
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=learner,
            submitted_at=submitted_at,
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Livrable version 1 du projet {assignment.project.order}.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        review_deliverable(
            deliverable=deliverable,
            trainer=trainer,
            status_decision=Deliverable.StatusEnum.VALIDATED,
            criterion_scores_data=self._criterion_scores(assignment.project, seed, baseline),
        )
        reviewed_at = self._spread(cohort, idx + 1, count + 1)
        Deliverable.objects.filter(pk=deliverable.pk).update(
            reviewed_at=reviewed_at,
            updated_at=reviewed_at,
        )
        return deliverable

    def _submit_pending(self, assignment, learner, cohort, idx, count, submitted_at=None):
        """Crée un livrable soumis en attente de correction (aucune review)."""
        if assignment.deliverables.exists():
            return None
        slug = learner.email.split("@")[0]
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=learner,
            submitted_at=submitted_at or self._spread(cohort, idx, count),
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Livrable version 1 du projet {assignment.project.order}.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        ProjectAssignment.objects.filter(pk=assignment.pk).update(
            status=ProjectAssignment.StatusEnum.SUBMITTED,
            updated_at=tz.now(),
        )
        return deliverable

    def _reject(self, assignment, learner, trainer, cohort, idx, count, feedback):
        """Crée un livrable puis le rejette (assignation repasse en IN_PROGRESS)."""
        if assignment.deliverables.exists():
            return None
        slug = learner.email.split("@")[0]
        deliverable = Deliverable.objects.create(
            assignment=assignment,
            version=1,
            submitted_by=learner,
            submitted_at=self._spread(cohort, idx, count),
            repo_url=f"https://github.com/{slug}/projet-{assignment.project.order}",
            live_url=f"https://{slug}-projet-{assignment.project.order}.vercel.app",
            comments=f"Livrable version 1 du projet {assignment.project.order}.",
            status=Deliverable.StatusEnum.SUBMITTED,
        )
        review_deliverable(
            deliverable=deliverable,
            trainer=trainer,
            status_decision=Deliverable.StatusEnum.REJECTED,
            feedback=feedback,
        )
        Deliverable.objects.filter(pk=deliverable.pk).update(
            reviewed_at=self._spread(cohort, idx + 1, count + 1),
        )
        return deliverable

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
        # Suppression physique (all_objects + hard_delete) : le `.delete()` classique
        # est un soft-delete (deleted_at), or les lignes « supprimées » restent visibles
        # du collector Django (FK PROTECT) et cassent la purge (ProtectedError) ainsi
        # que le get_or_create du re-seed (uniques).
        Deliverable.all_objects.filter(submitted_by__email__startswith=USER_PREFIX).hard_delete()
        Deliverable.all_objects.filter(
            assignment__enrollment__user__email__startswith=USER_PREFIX
        ).hard_delete()
        Notification.all_objects.filter(recipient__email__startswith=USER_PREFIX).hard_delete()
        Claim.all_objects.filter(learner__email__startswith=USER_PREFIX).hard_delete()

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
                f"{deleted_intakes} intakes."
            )
        )

    # ──────────────────────────────────────────────────────────────
    # Seed
    # ──────────────────────────────────────────────────────────────

    @transaction.atomic
    def _seed(self):
        password = self.password

        # --- Utilisateurs -------------------------------------------------
        admin = self._user("admin", "Admin", "Xarala", User.Role.ADMIN, phone="+221 33 825 00 00")
        organizer = self._user("organizer", "Organisation", "Academy", User.Role.ORGANIZER)

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

        # --- Programmes / intakes / cohortes ------------------------------
        p_fullstack = self._program("Développement Web Fullstack (JS)")
        p_data = self._program("Data & Intelligence Artificielle")
        p_ux = self._program("UI/UX Design")

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
        c_2026_oct = self._cohort(
            "Promo Octobre 2026 Fullstack", p_fullstack, intake_oct,
            _dt(2026, 10, 12).date(), _dt(2027, 5, 28).date(), Cohort.StatusEnum.UPCOMING,
        )

        # --- Projets + critères ------------------------------------------
        fs_projects = 5
        self._add_project(p_fullstack, 1, "Site vitrine statique", [
            ("Design", "Qualité de l'interface et cohérence visuelle"),
            ("Frontend", "Intégration HTML/CSS responsive"),
            ("Frontend", "Comportements JavaScript (menu, carrousel, filtres)"),
            ("Software", "Organisation des fichiers et qualité du code"),
        ])
        self._add_project(p_fullstack, 2, "Application CRUD (Express + PostgreSQL)", [
            ("Backend", "Conception du schéma de base de données"),
            ("Backend", "API CRUD complète et cohérente"),
            ("Software", "Validation des entrées et gestion des erreurs"),
            ("DevOps", "Configuration et documentation"),
        ])
        self._add_project(p_fullstack, 3, "API REST avec authentification JWT", [
            ("Backend", "Implémentation de l'authentification JWT"),
            ("DevOps", "Sécurité (hashing, rate limiting, secrets)"),
            ("Software", "Architecture de l'API (router, couches)"),
            ("Backend", "Tests unitaires et couverture"),
        ])
        self._add_project(p_fullstack, 4, "Application Full Stack (React + API)", [
            ("Frontend", "Utilisation de React (composants, hooks, état)"),
            ("Frontend", "Appels API et gestion des erreurs"),
            ("Software", "Qualité du code (typage, lint, organisation)"),
            ("DevOps", "Déploiement réel de l'application"),
        ])
        self._add_project(p_fullstack, 5, "Déploiement CI/CD d'une application web", [
            ("DevOps", "Pipeline CI/CD complet (lint, tests, build)"),
            ("DevOps", "Déploiement automatisé vers un environnement"),
            ("Software", "Monitoring et gestion des logs"),
        ])

        self._add_project(p_data, 1, "Analyse exploratoire des données", [
            ("Data", "Qualité de l'analyse et pertinence des insights"),
            ("Data", "Prétraitement et nettoyage des données"),
            ("Software", "Reproductibilité du code (notebook, scripts)"),
            ("Software", "Communication et visualisation des résultats"),
        ])
        self._add_project(p_data, 2, "Modélisation Machine Learning (Scikit-learn)", [
            ("Data", "Choix et entraînement du modèle"),
            ("Data", "Évaluation et comparaison des métriques"),
            ("Software", "Reproductibilité et versionnement du code"),
            ("Software", "Interprétation des résultats (feature importance)"),
        ])
        self._add_project(p_data, 3, "Pipeline de données & API FastAPI", [
            ("DevOps", "Orchestration du pipeline (ingestion → traitement)"),
            ("Backend", "Exposition des résultats via FastAPI"),
            ("Software", "Qualité du code et tests"),
            ("DevOps", "Documentation et automatisation"),
        ])
        self._add_project(p_data, 4, "Dashboard de visualisation (Power BI)", [
            ("Data", "Modélisation et mesures DAX"),
            ("Data", "Pertinence et lisibilité des indicateurs"),
            ("Software", "Actualisation et fiabilité de la source"),
            ("Software", "Présentation et storytelling"),
        ])
        self._add_project(p_data, 5, "Projet de fin d'études ML end-to-end", [
            ("Data", "Cadrage du problème et choix méthodologiques"),
            ("Backend", "Industrialisation (API, pipeline, monitoring)"),
            ("DevOps", "Déploiement et robustesse en conditions réelles"),
            ("Software", "Soutenance et documentation"),
        ])

        self._add_project(p_ux, 1, "Audit UX d'un site existant", [
            ("Research", "Méthodologie d'audit (heuristics, parcours)"),
            ("Design", "Identification des problèmes de clarté et cohérence"),
            ("Research", "Recommandations priorisées et actionnables"),
        ])
        self._add_project(p_ux, 2, "Wireframes & prototype basse fidélité", [
            ("Design", "Structure et hiérarchie de l'information"),
            ("Design", "Cohérence des gabarits et composants"),
            ("Research", "Court-circuit des utilisateurs dans les décisions"),
        ])
        self._add_project(p_ux, 3, "Design system sur Figma", [
            ("Design", "Tokens, couleurs, typographie et espacements"),
            ("Design", "Composants réutilisables et documentés"),
            ("Software", "Gestion des variantes et bonnes pratiques Figma"),
        ])
        self._add_project(p_ux, 4, "Prototype haute fidélité interactif", [
            ("Design", "Fidélité visuelle (spacing, styles, états)"),
            ("Design", "Interactions et micro-animations cohérentes"),
            ("Research", "Parcours utilisateur testés et documentés"),
        ])
        self._add_project(p_ux, 5, "Tests utilisateurs & itérations", [
            ("Research", "Protocole de test et recrutement"),
            ("Research", "Analyse des résultats et verbatims"),
            ("Design", "Itérations intégrées au prototype final"),
        ])

        # --- Formateurs affectés ------------------------------------------
        ta_c2025 = TrainerAssignment.objects.get_or_create(
            cohort=c_2025, user=trainers["t1"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_fs = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_fs, user=trainers["t1"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        TrainerAssignment.objects.get_or_create(
            cohort=c_2026_fs, user=trainers["t2"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )
        ta_c2026_data = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_data, user=trainers["t3"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]
        ta_c2026_oct = TrainerAssignment.objects.get_or_create(
            cohort=c_2026_oct, user=trainers["t4"],
            defaults={"status": TrainerAssignment.StatusEnum.ACTIVE},
        )[0]

        # --- Inscriptions + mentors ---------------------------------------
        # C1 (terminée) : 3 apprenants à 100 %
        en_s1_c1 = self._enroll(c_2025, learners["s1"], Enrollment.StatusEnum.COMPLETED)
        en_s2_c1 = self._enroll(c_2025, learners["s2"], Enrollment.StatusEnum.COMPLETED)
        en_s3_c1 = self._enroll(c_2025, learners["s3"], Enrollment.StatusEnum.COMPLETED)
        assign_mentor(en_s1_c1, ta_c2025)
        assign_mentor(en_s2_c1, ta_c2025)
        assign_mentor(en_s3_c1, ta_c2025)

        # C2 (en cours) : 5 apprenants + S1 en multi-formation
        en_s1_c2 = self._enroll(c_2026_fs, learners["s1"])
        en_s4_c2 = self._enroll(c_2026_fs, learners["s4"])
        en_s5_c2 = self._enroll(c_2026_fs, learners["s5"])
        en_s6_c2 = self._enroll(c_2026_fs, learners["s6"])
        en_s7_c2 = self._enroll(c_2026_fs, learners["s7"])
        assign_mentor(en_s1_c2, ta_c2026_fs)
        assign_mentor(en_s4_c2, ta_c2026_fs)
        ta_c2026_fs2 = TrainerAssignment.objects.get(cohort=c_2026_fs, user=trainers["t2"])
        assign_mentor(en_s5_c2, ta_c2026_fs2)
        assign_mentor(en_s6_c2, ta_c2026_fs)
        assign_mentor(en_s7_c2, ta_c2026_fs2)

        # C3 (en cours) : 3 apprenants + S3 en multi-formation
        en_s3_c3 = self._enroll(c_2026_data, learners["s3"])
        en_s8_c3 = self._enroll(c_2026_data, learners["s8"])
        en_s9_c3 = self._enroll(c_2026_data, learners["s9"])
        en_s10_c3 = self._enroll(c_2026_data, learners["s10"])
        assign_mentor(en_s3_c3, ta_c2026_data)
        assign_mentor(en_s8_c3, ta_c2026_data)
        assign_mentor(en_s9_c3, ta_c2026_data)
        assign_mentor(en_s10_c3, ta_c2026_data)

        # C4 (à venir) : 2 apprenants + S4 en multi-formation + 1 suspendue
        en_s4_c4 = self._enroll(c_2026_oct, learners["s4"])
        en_s11_c4 = self._enroll(c_2026_oct, learners["s11"])
        en_s12_c4 = self._enroll(c_2026_oct, learners["s12"])
        self._enroll(c_2026_oct, learners["s13"], Enrollment.StatusEnum.SUSPENDED)
        assign_mentor(en_s4_c4, ta_c2026_oct)
        assign_mentor(en_s11_c4, ta_c2026_oct)
        assign_mentor(en_s12_c4, ta_c2026_oct)

        # --- Historique de correction -------------------------------------
        t1, t2, t3 = trainers["t1"], trainers["t2"], trainers["t3"]

        # S1 → C1 : 5/5 validés (certificat auto)
        for i, a in enumerate(self._assignments(en_s1_c1), start=1):
            self._submit_and_review(a, learners["s1"], t1, 0.88, f"s1-c1-{a.project.order}", c_2025, i, fs_projects)

        # S2 → C1 : 5/5 validés
        for i, a in enumerate(self._assignments(en_s2_c1), start=1):
            self._submit_and_review(a, learners["s2"], t1, 0.80, f"s2-c1-{a.project.order}", c_2025, i, fs_projects)

        # S3 → C1 : 5/5 validés
        for i, a in enumerate(self._assignments(en_s3_c1), start=1):
            self._submit_and_review(a, learners["s3"], t1, 0.72, f"s3-c1-{a.project.order}", c_2025, i, fs_projects)

        # S4 → C2 : 4/5 validés (seuil 80 % atteint → certificat, projet 5 IN_PROGRESS)
        for i, a in enumerate(self._assignments(en_s4_c2), start=1):
            if a.project.order <= 4:
                self._submit_and_review(a, learners["s4"], t2, 0.84, f"s4-c2-{a.project.order}", c_2026_fs, i, 5)
            else:
                ProjectAssignment.objects.filter(pk=a.pk).update(
                    deadline_override=self._spread(c_2026_fs, 4, 5) + timedelta(days=7),
                )

        # S1 → C2 : 3/5 validés (projet 4 IN_PROGRESS, échéance dépassée)
        for i, a in enumerate(self._assignments(en_s1_c2), start=1):
            if a.project.order <= 3:
                self._submit_and_review(a, learners["s1"], t1, 0.86, f"s1-c2-{a.project.order}", c_2026_fs, i + 1, 5)
            else:
                ProjectAssignment.objects.filter(pk=a.pk).update(
                    deadline_override=tz.now() - timedelta(days=1),
                )

        # S5 → C2 : 2/5 validés, projet 3 soumis (en attente, échéance dépassée)
        for i, a in enumerate(self._assignments(en_s5_c2), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s5"], t2, 0.68, f"s5-c2-{a.project.order}", c_2026_fs, i + 1, 5)
            elif a.project.order == 3:
                self._submit_pending(
                    a, learners["s5"], c_2026_fs, i + 1, 5,
                    submitted_at=tz.now() - timedelta(days=6),
                )
                ProjectAssignment.objects.filter(pk=a.pk).update(
                    deadline_override=tz.now() - timedelta(days=2),
                )

        # S6 → C2 : 1/5 validé + 1 rejet (à réviser)
        a1 = self._assignments(en_s6_c2)[0]
        self._submit_and_review(a1, learners["s6"], t1, 0.62, "s6-c2-1", c_2026_fs, 1, 5)
        a2 = self._assignments(en_s6_c2)[1]
        self._reject(
            a2, learners["s6"], t1, c_2026_fs, 2, 5,
            "Le projet est incomplet : il manque la partie API et plusieurs critères de la grille ne sont pas adressés. Reprenez la consigne puis resoumettez.",
        )

        # S7 → C2 : 0/5 validé (aucun livrable → apprenant à risque)
        # (assignations créées à l'inscription, rien d'autre)

        # S3 → C3 : 2/5 validés
        for i, a in enumerate(self._assignments(en_s3_c3), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s3"], t3, 0.75, f"s3-c3-{a.project.order}", c_2026_data, i + 1, 5)

        # S8 → C3 : 2/5 validés
        for i, a in enumerate(self._assignments(en_s8_c3), start=1):
            if a.project.order <= 2:
                self._submit_and_review(a, learners["s8"], t3, 0.70, f"s8-c3-{a.project.order}", c_2026_data, i + 1, 5)

        # S9 → C3 : 1/5 validé + soumis en attente
        for i, a in enumerate(self._assignments(en_s9_c3), start=1):
            if a.project.order == 1:
                self._submit_and_review(a, learners["s9"], t3, 0.60, "s9-c3-1", c_2026_data, 1, 5)
            elif a.project.order == 2:
                self._submit_pending(a, learners["s9"], c_2026_data, 2, 5)

        # S10 → C3 : 0/5 validé (apprenant à risque)

        # --- Réclamations certificat + notifications -----------------------
        cert_s1 = Certificate.objects.filter(inscription=en_s1_c1).first()
        cert_s2 = Certificate.objects.filter(inscription=en_s2_c1).first()

        if cert_s1 and not Claim.objects.filter(certificate=cert_s1).exists():
            create_claim(
                learners["s1"],
                cert_s1.id,
                "Bonjour, j'ai terminé ma formation en janvier 2025 mais je ne retrouve toujours pas "
                "mon certificat dans mon espace. Pouvez-vous vérifier son statut ?",
            )
        if cert_s2 and not Claim.objects.filter(certificate=cert_s2).exists():
            claim2 = create_claim(
                learners["s2"],
                cert_s2.id,
                "Le prénom sur mon certificat est mal orthographié, puis-je le faire corriger ?",
            )
            update_claim_status(claim2, Claim.StatusEnum.IN_PROGRESS, handled_by=admin)
            update_claim_status(
                claim2,
                Claim.StatusEnum.RESOLVED,
                admin_response="Merci pour votre retour, l'orthographe a été corrigée. Le certificat actualisé est disponible dans votre espace.",
                handled_by=admin,
            )

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
            "Intakes": Intake.objects.filter(name__in=DEMO_INTAKE_NAMES).count(),
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
            self.style.SUCCESS("Rappel : certificats PDF générés de façon asynchrone (Celery).")
        )
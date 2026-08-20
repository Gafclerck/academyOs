"""Service de génération de certificat, isolé pour rester modifiable
sans casser les vues qui l'appellent (voir Mémoire de projet v12)."""

from .models import Certificate


def is_eligible_for_certificate(enrollment):
    """Vérifie si un apprenant est éligible à la génération de son certificat.

    Placeholder en attente de la confirmation de la règle exacte avec Malick
    (comptage simple des projets validés vs pondération par points).
    Retourne toujours True pour l'instant : l'admin garde la responsabilité
    de la décision via le déclenchement manuel de /generate/.
    """
    return True


def generate_certificate(enrollment):
    """Crée (ou récupère) le certificat lié à une inscription.

    Ne génère pas encore le fichier PDF ni n'envoie l'email : ces étapes
    seront branchées ici une fois le service PDF et la tâche Celery écrits
    (sous-tâches suivantes).
    """
    certificate, created = Certificate.objects.get_or_create(
        inscription=enrollment,
        defaults={"status": Certificate.StatusCertificateEnum.PENDING},
    )
    return certificate, created

from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Pagination par défaut de l'API (liste paginée par pages numérotées)."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
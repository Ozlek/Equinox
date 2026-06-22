from django.urls import path
from . import views

# All frontend routing is handled by the React SPA.
# These URL patterns are kept for structural compatibility.
urlpatterns = [
    # The React app serves as the root; no Django template routes needed.
]
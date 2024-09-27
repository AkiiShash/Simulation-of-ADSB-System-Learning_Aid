from django.urls import re_path
from rest_framework_simplejwt import views as jwt_views
from aircraft import views as aircraft_views

from .views import UserRegisterView, UserMeView, UserLoginView, UsersView

urlpatterns = [
    re_path(r"register/?$", UserRegisterView.as_view({"post": "create"})),
    re_path(r"login/?$", UserLoginView.as_view({"post": "create"})),
    re_path(r"me/?$", UserMeView.as_view()),
    re_path(r"refresh/?$", jwt_views.TokenRefreshView.as_view()),
    # session
    re_path(
        r"session/?$",
        aircraft_views.SessionView.as_view({"get": "list"}),
    ),
    re_path(
        r"session/(?P<pk>\d+)/?$",
        aircraft_views.SessionView.as_view({"get": "retrieve"}),
    ),
    #
    re_path(r"", UsersView.as_view({"get": "list"})),
]

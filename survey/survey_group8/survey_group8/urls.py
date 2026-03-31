"""
URL configuration for survey_group8 project.
"""
from urllib.parse import urlencode
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from dashboard import views
from django.conf.urls.static import static


def gateway_login_redirect(request):
    if request.user.is_authenticated:
        return redirect('home')
    base = settings.GATEWAY_LOGIN_URL
    query = urlencode({"app": "survey", "next": request.get_full_path()})
    separator = '&' if '?' in base else '?'
    return redirect(f"{base}{separator}{query}")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', gateway_login_redirect, name='login'),
    path("accounts/", include("accounts.urls")),
    path("dashboard/", include("dashboard.urls")),
    path('', views.home, name='home'),
    path('create/', views.survey_create, name='survey_create'),
    path('deletesurvey/<int:id>', views.survey_delete, name='survey_delete'),
    path('publishsurvey/<int:id>', views.survey_publish, name='survey_publish'),
    path('closesurvey/<int:id>', views.survey_close, name='survey_close'),
    path('draftsurvey/<int:id>', views.survey_draft, name='survey_draft'),
    path('republishsurvey/<int:id>', views.survey_republish, name='survey_republish'),
    path('edit/<int:id>', views.survey_edit, name='survey_edit'),
    path("results/", include("results.urls")),
    path('survey_take/', views.survey_take, name='survey_take'),
    path('qa/<int:id>/', views.qa_view, name='qa_view'),
    path('qa_submit/', views.qa_submit, name='qa_submit'),
    path('thankyou/<int:id>/', views.thankyou, name='thankyou'),
    path('complete/', views.complete, name='complete'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.ENABLE_LOCAL_AUTH_FALLBACK:
    urlpatterns.insert(2, path("accounts/", include("django.contrib.auth.urls")))

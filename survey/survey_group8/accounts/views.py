from django.contrib.auth import login
from django.contrib.auth.models import Group, User
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView

import base64
import hashlib
import hmac
import json
import os
import time
from .forms import CustomUserCreationForm


class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"

    def form_valid(self, form):
        user = form.save()
        user_type = form.cleaned_data.get('user_type')

        if user_type == 'Taker':
            group = Group.objects.get(name='Taker')
        elif user_type == 'Creator':
            group = Group.objects.get(name='Creator')
        else:
            group = None

        if group:
            user.groups.add(group)

        login(self.request, user)
        return super().form_valid(form)


def _b64_decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _validate_gateway_token(raw_token: str):
    try:
        payload_b64, sig_b64 = raw_token.split('.', 1)
    except ValueError:
        return None

    secret = os.getenv("GATEWAY_SESSION_SECRET")
    if not secret:
        return None

    expected_sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")
    if not hmac.compare_digest(sig_b64, expected_sig):
        return None

    try:
        payload = json.loads(_b64_decode(payload_b64))
    except Exception:  # noqa: BLE001
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    if not payload.get("email") or not payload.get("sub"):
        return None
    return payload


def sso_login(request):
    next_url = request.GET.get('next', '/survey/')
    gateway_base = os.getenv("GATEWAY_BASE_URL", "")
    if not gateway_base:
        return HttpResponseBadRequest('Missing GATEWAY_BASE_URL configuration')
    callback_url = f"{gateway_base}/auth/google/start?next=/survey/accounts/sso/callback/?next={next_url}"
    return redirect(callback_url)


def sso_callback(request):
    next_url = request.GET.get('next', '/survey/')
    gateway_token = request.GET.get('gateway_token')
    if not gateway_token:
        return HttpResponseBadRequest('Missing gateway_token query parameter')

    trusted_identity = _validate_gateway_token(gateway_token)
    if trusted_identity is None:
        return HttpResponseBadRequest('Invalid gateway_token')

    email = trusted_identity["email"]
    full_name = trusted_identity.get("name", "")
    name_parts = full_name.split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    username = email.split('@')[0][:150]

    user = User.objects.filter(email=email).first()
    if user is None:
        base_username = username or 'user'
        candidate = base_username
        counter = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f"{base_username}{counter}"[:150]
            counter += 1
        user = User.objects.create_user(
            username=candidate,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=None,
        )

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    request.session['gateway_sub'] = trusted_identity.get('sub')
    request.session['gateway_login_timestamp'] = trusted_identity.get('login_timestamp')
    return redirect(next_url or '/survey/')

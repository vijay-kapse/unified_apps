from django.contrib.auth import login
from django.contrib.auth.models import Group, User
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView
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


def sso_login(request):
    mock_email = request.GET.get('email')
    next_url = request.GET.get('next', '/survey/')
    if not mock_email:
        return HttpResponseBadRequest('Missing email query parameter')
    callback_url = f"/survey/accounts/sso/callback/?email={mock_email}&next={next_url}"
    return redirect(callback_url)


def sso_callback(request):
    email = request.GET.get('email')
    next_url = request.GET.get('next', '/survey/')
    if not email:
        return HttpResponseBadRequest('Missing email query parameter')

    first_name = request.GET.get('first_name', '')
    last_name = request.GET.get('last_name', '')
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
    return redirect(next_url or '/survey/')

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

USER_TYPE_CHOICES = [
    ('student', 'Student'),
    ('instructor', 'Instructor'),
]

class RegisterForm(UserCreationForm):

    email = forms.EmailField()
    user_type = forms.ChoiceField(choices=USER_TYPE_CHOICES, initial='student')

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password1',
            'password2',
            'user_type',
        ]


class InstructorRegisterForm(UserCreationForm):
    """Extended registration form for instructors with assignment fields."""

    email = forms.EmailField()
    grade_level_min = forms.IntegerField(min_value=1, max_value=10, required=True)
    grade_level_max = forms.IntegerField(min_value=1, max_value=10, required=True)
    instructional_scope = forms.CharField(
        max_length=200,
        required=False,
        help_text="E.g. 'Elementary Mathematics Specialist'"
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password1',
            'password2',
        ]

    def clean(self):
        cleaned_data = super().clean()
        grade_min = cleaned_data.get('grade_level_min')
        grade_max = cleaned_data.get('grade_level_max')
        if grade_min and grade_max and grade_min > grade_max:
            raise forms.ValidationError(
                "Minimum grade level cannot be greater than maximum grade level."
            )
        return cleaned_data
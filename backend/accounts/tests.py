from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework import status
from .models import UserProfile


class UserAuthenticationTests(TestCase):
    """Test user login and registration"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='securepass123',
            email='test@example.com'
        )
    
    def test_user_creation(self):
        """Test that user is created correctly"""
        self.assertEqual(self.user.username, 'testuser')
        self.assertTrue(self.user.check_password('securepass123'))
    
    def test_user_password_hashing(self):
        """Test that passwords are hashed, not plain text"""
        self.assertNotEqual(self.user.password, 'securepass123')
        self.assertTrue(self.user.check_password('securepass123'))
    
    def test_duplicate_username_prevention(self):
        """Test that duplicate usernames are prevented"""
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='testuser',
                password='different123'
            )
    
    def test_user_profile_creation(self):
        """Test UserProfile auto-creation or retrieval"""
        profile, created = UserProfile.objects.get_or_create(user=self.user)
        self.assertEqual(profile.user.username, 'testuser')
    
    def test_user_str_representation(self):
        """Test user string representation"""
        profile, created = UserProfile.objects.get_or_create(user=self.user)
        self.assertIn('testuser', str(profile))


class UserProfileTests(TestCase):
    """Test UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.profile, created = UserProfile.objects.get_or_create(user=self.user)
    
    def test_profile_fields_exist(self):
        """Test that profile has expected fields"""
        self.assertIsNotNone(self.profile.user)
        self.assertTrue(hasattr(self.profile, 'user'))

from django.contrib import admin
from .models import Question, UserSkillProfile, ResponseLog, GamifiedModifier, UserInventory

@admin.register(GamifiedModifier)
class GamifiedModifierAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'modifier_type', 'multiplier_value')
    prepopulated_fields = {'slug': ('name',)}  # Auto-generates slug from name typing

@admin.register(UserInventory)
class UserInventoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'modifier', 'quantity')
    list_filter = ('modifier',)
    search_fields = ('user__username',)
    
admin.site.register(Question)
admin.site.register(UserSkillProfile)
admin.site.register(ResponseLog)
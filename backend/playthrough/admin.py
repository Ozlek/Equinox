from django.contrib import admin
from .models import Question, UserSkillProfile, ResponseLog, GamifiedModifier, UserInventory, PlaythroughSession


@admin.register(GamifiedModifier)
class GamifiedModifierAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'modifier_type', 'multiplier_value')
    prepopulated_fields = {'slug': ('name',)}  # Auto-generates slug from name typing


@admin.register(UserInventory)
class UserInventoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'modifier', 'quantity')
    list_filter = ('modifier',)
    search_fields = ('user__username',)


@admin.register(PlaythroughSession)
class PlaythroughSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'questions_served', 'score', 'gamified_score', 'created_at', 'updated_at')
    list_filter = ('topic',)
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')


admin.site.register(Question)
admin.site.register(UserSkillProfile)
admin.site.register(ResponseLog)
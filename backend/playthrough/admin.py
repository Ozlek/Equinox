from django.contrib import admin
from .models import Question, DomainRating, UserSkillProfile, ResponseLog, ResponseLogArchive, GamifiedModifier, UserInventory, PlaythroughSession, ShopItem, Lesson


@admin.register(DomainRating)
class DomainRatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'domain_name', 'rating')
    list_filter = ('domain_name',)
    search_fields = ('user__username', 'domain_name')
    ordering = ('user', 'domain_name')


@admin.register(GamifiedModifier)
class GamifiedModifierAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'modifier_type', 'multiplier_value')
    prepopulated_fields = {'slug': ('name',)}  # Auto-generates slug from name typing


@admin.register(UserInventory)
class UserInventoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'modifier', 'quantity')
    list_filter = ('modifier',)
    search_fields = ('user__username',)


@admin.register(ShopItem)
class ShopItemAdmin(admin.ModelAdmin):
    list_display = ('modifier', 'price', 'is_available')
    list_filter = ('is_available',)
    search_fields = ('modifier__name',)


@admin.register(PlaythroughSession)
class PlaythroughSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'questions_served', 'score', 'gamified_score', 'created_at', 'updated_at')
    list_filter = ('topic',)
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ResponseLog)
class ResponseLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'domain', 'question', 'is_correct', 'timestamp')
    list_filter = ('domain', 'is_correct', 'timestamp')
    search_fields = ('user__username',)
    date_hierarchy = 'timestamp'


@admin.register(ResponseLogArchive)
class ResponseLogArchiveAdmin(admin.ModelAdmin):
    list_display = ('user', 'domain', 'date', 'total_attempts', 'correct_attempts', 'avg_difficulty')
    list_filter = ('domain', 'date')
    search_fields = ('user__username',)
    date_hierarchy = 'date'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'topic', 'grade_level', 'order')
    list_filter = ('topic', 'grade_level')
    search_fields = ('title', 'topic__name')
    ordering = ('topic', 'grade_level', 'order')


admin.site.register(Question)
admin.site.register(UserSkillProfile)

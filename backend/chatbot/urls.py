from django.urls import path

from .views import (
    chat,
    clear_history,
    document_detail,
    documents,
    history,
    history_detail,
    me,
    register,
    upload_pdf,
)

urlpatterns = [
    path('register/', register),
    path('me/', me),
    path('documents/', documents),
    path('documents/<int:pk>/', document_detail),
    path('history/', history),
    path('history/clear/', clear_history),
    path('history/<int:pk>/', history_detail),
    path('upload/', upload_pdf),
    path('chat/', chat),
]

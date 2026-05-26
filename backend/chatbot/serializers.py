from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ChatHistory, Document


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )
        return user


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'user', 'file', 'uploaded_at']
        read_only_fields = ['user', 'uploaded_at']


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ['id', 'user', 'question', 'answer', 'created_at']
        read_only_fields = ['user', 'created_at']

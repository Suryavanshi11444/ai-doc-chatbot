from django.db import models
from django.contrib.auth.models import User


class Document(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	file = models.FileField(upload_to='documents/')
	uploaded_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.file.name


class ChatHistory(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	question = models.TextField()
	answer = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'{self.user.username}: {self.question[:40]}'

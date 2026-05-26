from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ChatHistory, Document
from .rag import ask_question, remove_document, store_document
from .serializers import ChatSerializer, DocumentSerializer, RegisterSerializer
from .utils import chunk_text, extract_text


@api_view(['POST'])
def register(request):
	serializer = RegisterSerializer(data=request.data)

	if serializer.is_valid():
		serializer.save()
		return Response({'message': 'User created'})

	return Response(serializer.errors)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
	return Response({
		'username': request.user.username,
		'id': request.user.id,
	})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def documents(request):
	items = Document.objects.filter(user=request.user).order_by('-uploaded_at')
	return Response(DocumentSerializer(items, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def document_detail(request, pk):
	try:
		document = Document.objects.get(pk=pk, user=request.user)
	except Document.DoesNotExist:
		return Response({'detail': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

	remove_document(document.id)
	document.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history(request):
	items = ChatHistory.objects.filter(user=request.user).order_by('-created_at')
	return Response(ChatSerializer(items, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def history_detail(request, pk):
	try:
		item = ChatHistory.objects.get(pk=pk, user=request.user)
	except ChatHistory.DoesNotExist:
		return Response({'detail': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

	item.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_history(request):
	ChatHistory.objects.filter(user=request.user).delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pdf(request):
	pdf = request.FILES['file']

	doc = Document.objects.create(
		user=request.user,
		file=pdf,
	)

	text = extract_text(doc.file.path)
	chunks = chunk_text(text)
	store_document(doc.id, chunks)

	return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
	question = request.data['question']
	document_id = request.data.get('document_id')
	try:
		answer = ask_question(question, document_id=document_id)
	except RuntimeError as error:
		return Response({'detail': str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

	chat_history = ChatHistory.objects.create(
		user=request.user,
		question=question,
		answer=answer,
	)

	return Response(ChatSerializer(chat_history).data, status=status.HTTP_201_CREATED)

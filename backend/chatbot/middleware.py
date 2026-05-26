from django.conf import settings
from django.http import HttpResponse


class DevCORSMiddleware:
    allowed_origins = {
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS':
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        origin = request.headers.get('Origin')

        if settings.DEBUG:
            response['Access-Control-Allow-Origin'] = origin if origin else '*'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-requested-with'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Vary'] = 'Origin'

        return response
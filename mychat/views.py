from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
import os
from dotenv import load_dotenv
import random
import time
import json
from .models import RoomMember
load_dotenv()

# Create your views here.

from django.views.decorators.csrf import csrf_exempt

def lobby(request):
    return render(request,'mychat/lobby.html')

def room(request):
    return render(request,'mychat/room.html')

# Generates a token each time a user creates or joins a room
def getToken(request):
    appId = str(os.getenv('appId'))
    appCertificate = str(os.getenv('appCertificate'))
    channelName = request.GET.get('channel')
    # Generating a random user ID between 1 and 232
    uid = random.randint(1,230)
    # Expiry date for token
    expirationTimeInSeconds = 3600 * 24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    # 1 = Host, 2 = Guest
    role = 1

    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token,'uid':uid}, safe=False)

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)

    member, created = RoomMember.objects.get_or_create(
        name = data['name'],
        uid = data['UID'],
        room_name = data['room_name']

    )
    return JsonResponse({'name':data['name']},safe=False)


@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)

    member = RoomMember.objects.get(
        name = data['name'],
        uid = data['UID'],
        room_name = data['room_name'],
    )
    member.delete()
    return JsonResponse('Member was deleted',safe=False)

def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name,
    )
    name = member.name
    return JsonResponse({'name':member.name},safe=False)

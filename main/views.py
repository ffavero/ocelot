from __future__ import with_statement
from django.template.context import RequestContext
from django.shortcuts import render_to_response
from xml.etree import ElementTree as ET
from ocelot.main.models import Datasets, Ocelotqueue
from django.http import HttpResponseRedirect, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.context_processors import csrf
from django.contrib.auth.decorators import login_required
from django.core import serializers
from settings import ROOT_PATH
import os

@login_required
def admin(request):
   payload = {}
   return render_to_response('admin.html', payload)

@login_required
def Queue(request):
   '''
   Show the runnning processes in a table
   '''
   tasks = list(Ocelotqueue.objects.all())
   payload = dict( tasks = tasks)
   payload.update(csrf(request))
   return render_to_response('queue.html', payload)

def index(request):
   payload = {}
   payload.update(csrf(request))
   return render_to_response('index.html', payload)

def help(request):
   payload = {}
   return render_to_response('help.html', payload)

def export_csv(request):
   '''
   Create the HttpResponse object with the appropriate TXT header.
   '''
   data = None
   if request.method == 'POST':
      data = request.POST
   response = HttpResponse(data['csv_download'], content_type='text/plain')
   response['Content-Disposition'] = 'attachment; filename='+data['file_name']+'.txt'
   return response

def export_png(request):
   '''
   Create the HttpResponse object with the appropriate png header.
   '''
   data = None
   if request.method == 'POST':
      data = request.POST
   path_name = ROOT_PATH + data['img_name']
   img_name  =  path_name.split('/')[-1]
   if os.path.isfile(path_name):
      with open(path_name, "rb") as img:
         tmp = img.read()
      response = HttpResponse(tmp, content_type='image/png')
      response['Content-Disposition'] = 'attachment; filename=' +img_name
      return response
   else:
      return HttpResponse("Not Found",mimetype="text/plain")

def Datasets2XML(request):
   '''
   Dump the Datasets model in to an XML file
   to be use as index of the main page or with
   other programs (API).
   '''
   datasets = list(Datasets.objects.all())
   xml = serializers.serialize('xml', datasets)
   return HttpResponse(xml, content_type='text/xml')


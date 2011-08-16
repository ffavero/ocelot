from __future__ import with_statement
from django.utils import simplejson
from settings import ROOT_PATH
import os, gzip, contextlib
from django.http import HttpResponseRedirect, HttpResponse
from django.core.context_processors import csrf
from ocelot.Platforms.models import Platform
from ocelot.Platforms.utils import geo_annot_tab
from ocelot.main.queue import send_to_queue
from django.shortcuts import render_to_response
from django.utils.datastructures import MultiValueDictKeyError
from django.contrib.auth.decorators import login_required

def get_annot_json(request):
   '''
   Just show the JSON annotation to serve it
   to a POST call (to ajax for example)
   '''
   if request.is_ajax():
      if request.method == 'POST':
         acc = request.POST['gpl']
         try:
            purpose = request.POST['purpose']
         except MultiValueDictKeyError:
            purpose = 'metainfo'
         
         filename = ROOT_PATH +'/data/annotations/' + acc + '_'+ purpose + '.json.gz'
         if os.path.isfile(filename):
            with contextlib.closing(gzip.GzipFile(filename,'rb')) as json_file:
               return HttpResponse(json_file.read(),mimetype="text/javascript")
         else:
            return HttpResponse("Not Found",mimetype="text/plain")

@login_required(login_url='/accounts/login/')
def index_annot(request):
   '''
   List the present annotation in the database:
   '''
   platforms = list(Platform.objects.all())
   platforms_info = []
   for platform in platforms:
      status = ''
      if os.path.isfile(ROOT_PATH +'/data/annotations/' + platform.platform_id + '_metainfo.json.gz'):
         status = 'OK'
      else:
         status = 'NO'
      platforms_info.append({'platform_id':platform.platform_id, 'name':platform.name,'status':status})
   payload = dict( platforms=platforms_info)
   payload.update(csrf(request))
   return render_to_response('platform_admin.html', payload)

@login_required(login_url='/accounts/login/')
def page_platform(request,platform_id):
   '''
   Download the Platform file from geo and display
   the first 10 line, in order to select the right
   column(s) for the small annotation file to save
   '''
   payload = dict(platform_id=platform_id)
   payload.update(csrf(request))
   return render_to_response('platform_table.html', payload)

@login_required(login_url='/accounts/login/')
def table_platform(request):
   '''
   Display the div table of the
   first 10 line of the given platform
   '''
   if request.is_ajax():
      if request.method == 'POST':
         try:
            list_annot = request.POST['list_annot']
         except MultiValueDictKeyError:
            list_annot = ''
         platform_id = request.POST['platform_id']
         if list_annot == '':
            table = geo_annot_tab(platform_id,10)
            return HttpResponse(table,mimetype="text/html")
         else:
            args =  simplejson.dumps(platform_id)+','+list_annot
            send_to_queue('ocelot.Platforms.utils','get_geo_annot_split',args)
            return HttpResponse('The request was sent to the queue.',mimetype="text/html")
            #return HttpResponseRedirect('/admin/chip/')
      else:
         return HttpResponse("Not Found",mimetype="text/plain")
   else:
      return HttpResponse("Not Found",mimetype="text/plain")

@login_required(login_url='/accounts/login/')
def edit_platform(request,platform_id):
   '''
   Download the Platform file from geo and display
   the first 10 line, in order to select the right
   column(s) for the small annotation file to save
   '''   
   payload = dict( platform_id=platform_id)
   payload.update(csrf(request))
   return render_to_response('platform_edit.html', payload)


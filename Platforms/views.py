from __future__ import with_statement
from django.utils import simplejson
from settings import ROOT_PATH
import os, gzip, contextlib
from django.http import HttpResponseRedirect, HttpResponse 

def view_annot(request):
   '''
   Just show the JSON annotation to serve it
   to a POST call (to ajax for example)
   '''
   if request.is_ajax():
      if request.method == 'POST':
         acc = request.POST['gpl']
         filename = ROOT_PATH +'/data/annotations/' + acc + '.json.gz'
         if os.path.isfile(filename):
            with contextlib.closing(gzip.GzipFile(filename,'rb')) as json_file:
               return HttpResponse(json_file.read(),mimetype="text/javascript")
         else:
            return HttpResponse("Not Found",mimetype="text/plain")
      

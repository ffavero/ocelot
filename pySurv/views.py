from __future__ import with_statement
from django.utils import simplejson
from django.http import HttpResponseRedirect, HttpResponse

def analyze(request):
   '''
   Analyze posted data, parse the respective
   file to integrate the expression data, and 
   generate the images.
   '''  
   if request.is_ajax():
      data = None
      if request.method == 'POST':
         data = request.POST
      file_name = data['file_code'].strip()+'_series_matrix.txt'
      id_ref    = data['id_ref']
      json_data = simplejson.loads(data['data_json'])
      test      = data['test']
      format    = data['format']
      res = file_name
      return HttpResponse(res, content_type='text/html')
   else:
      return HttpResponseRedirect('/')


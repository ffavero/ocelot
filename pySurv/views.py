from __future__ import with_statement
from django.utils import simplejson
from django.http import HttpResponseRedirect, HttpResponse
from settings import ROOT_PATH
import rpy2.robjects as robjects
from   rpy2.robjects.packages import importr
import io, re, gzip, contextlib

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
      file_name = data['file_code'].strip()+'_series_matrix.txt.gz'
      id_ref    = data['id_ref']
      json_data = simplejson.loads(data['data_json'])
      test      = data['test']
      format    = data['format']
      outPATH   = '/media/tmp/'
      expr_PATH = '/data/expressions/'
      out_file = test + data['file_code'] + id_ref +'.' +format
      # Parse the expression data
      find_id = re.compile('^' + id_ref + '\t')
      merged_data = {}
      with contextlib.closing(gzip.GzipFile(ROOT_PATH + expr_PATH + file_name,'rb')) as fexpr:
         samples = fexpr.readline().strip().split('\t')[1:]
         for line in fexpr.readlines():
            if find_id.match(line):
               expr = line.strip().split('\t')[1:]
               for position, sample in enumerate(samples):
                  if json_data[sample]:
                     merged_data[sample] = json_data[sample]
                     merged_data[sample]['expression'] = expr[position]
               break 
      if test == 'kmlines':
         kmlines(merged_data,ROOT_PATH + outPATH + out_file)
      res = '<img src="'+outPATH+out_file+'"/>'
      return HttpResponse(res, content_type='text/html')
   #else:
   #   return HttpResponseRedirect('/')


def kmlines(data,filename):
   '''
   Kaplan Meier estimation
   '''
   survplot = importr('survplot')
   Cairo = importr('Cairo')
   time    = []
   event   = []
   expr    = [] 
   names = data.keys()
   for name in names:
      time.append(data[name]['surv_tot'])
      event.append(data[name]['event_tot'])
      expr.append(data[name]['expression'])
   robjects.r ('''
      KMLines <- function(filename,time,event,expr) {
       CairoPNG(filename=filename)
       time  = as.numeric(time)
       event = as.numeric(event)
       expr  = as.numeric(expr)       
       surv <- Surv(time,event)
       survplot(surv ~ cutn(t(expr)))
       dev.off()
      }
   ''')
   robjects.r['KMLines'](filename = filename, time = time , event = event, expr = expr)


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
      time.append(data[name]['surv'])
      event.append(data[name]['even'])
      expr.append(data[name]['expression'])
   robjects.r ('''
      KMLines <- function(filename,time,event,expr,separator=0.5, main='') {
       CairoPNG(filename=filename,width = 1280, height = 800)
       time  = as.numeric(time)
       event = as.numeric(event)
       expr  = as.numeric(expr)       
       surv <- Surv(time,event)
       separator = 1/separator
       ord = expr[order(expr)]
       mid = as.integer(length(expr)/separator)
       par(mfrow=c(1,2),omi=c(1,1,1,0))
       plot(y = ord, x = c(1:length(ord)),type='n',xlab='Samples',ylab='eV')
       lines(y=ord[1:mid],x=c(1:mid),col='red')
       lines(y=ord[mid:length(ord)],x=c(mid:length(ord)),col='green')
       segments(x0 = mid, y0=ord[1], x1=mid,y1=ord[mid],lty=4,lwd=0.5)
       segments(x0 = 0, y0=ord[mid], x1=mid,y1=ord[mid],lty=4,lwd=0.5)
       groups = as.numeric(expr >= ord[mid])
       groups[groups==0] <- "Group A"
       groups[groups==1] <- "Group B"
       groups <-as.factor(groups)
       survplot (Surv(time,event) ~ groups, col=c('red','green'),xlab = 'Time', ylab = 'Fraction')
       title(main,outer=TRUE)
       #survplot(surv ~ cutn(t(expr)))
       dev.off()
      }
   ''')
   robjects.r['KMLines'](filename = filename, time = time , event = event, expr = expr)


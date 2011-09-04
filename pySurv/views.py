from __future__ import with_statement
from django.utils import simplejson
from django.http import HttpResponseRedirect, HttpResponse
from settings import ROOT_PATH
import rpy2.robjects as robjects
from   rpy2.robjects.packages import importr
import io, os, re, gzip, contextlib

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
      title     = data['title']
      opts      = data['opts']
      toggle    = data['toggle']
      outPATH   = '/media/tmp/'
      expr_PATH = '/data/expressions/'
      out_file  = test + '_' + toggle +'_' + opts.replace(':','').replace('.','').replace(' ','').strip() + '_' + data['file_code'] + '_' + id_ref + '.' + format;
      # Parse the expression data
      find_id = re.compile('^' + id_ref + '\t')
      merged_data = {}
      if os.path.isfile(ROOT_PATH + '/media/tmp/' + out_file):
         res = '<img src="'+ outPATH + out_file + '"/>'
         res += '<div id="image_actions">'
         res += ' <button type="button" onclick="downloadIMG(\''+ outPATH+out_file + '\')" class="ui-button ui-button-text-icons ui-state-default ui-corner-all" title="Download image">'
         res += '  <span class="ui-button-icon-secondary ui-icon ui-icon-disk"></span>'
         res += '  <span class="ui-button-text">Download image</span>'
         res += ' </button>'
         res += '</div><!--image_actions-->'
         return HttpResponse(res, content_type='text/html')
      else:
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
         argvs = {'file' : out_file, 'data' : merged_data, 'title' : title, 'opts' :opts}
         if test == 'kmlines':
            res = kmlines(argvs)
         if test == 'rocbees':
            res = rocbees(argvs)
         if test == 'groupanalysis':
            res = groupanalysis(argvs)
         if res == out_file:
            res = '<img src="'+ outPATH + out_file + '"/>'
            res += '<div id="image_actions">'
            res += ' <button type="button" onclick="downloadIMG(\''+ outPATH+out_file + '\')" class="ui-button ui-button-text-icons ui-state-default ui-corner-all" title="Download image">'
            res += '  <span class="ui-button-icon-secondary ui-icon ui-icon-disk"></span>'
            res += '  <span class="ui-button-text">Download image</span>'
            res += ' </button>'
            res += '</div><!--image_actions-->'
         else:
            res = '<div class="ui-state-error ui-corner-all" style="padding: 0 .7em;">'
            res += '<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>'
            res += '<strong>Error:</strong> Sorry something went wrong while processing. The error might be due to the poor results for the selected probe. Try another gene/probe or contact us to investigate further the problem.</p></div>'
         return HttpResponse(res, content_type='text/html')
   else:
      response = HttpResponse('Access Forbidden', content_type='text/html')
      response.status_code = 403
      return response

def kmlines(ARGVS):
   '''
   Kaplan Meier estimation
   '''
   survplot = importr('survplot')
   Cairo = importr('Cairo')
   filename = ARGVS['file']
   data     = ARGVS['data']
   title    = ARGVS['title']
   cutpoint = ARGVS['opts']
   filewrite = ROOT_PATH + '/media/tmp/' + filename 
   time    = []
   event   = []
   expr    = []
   names = data.keys()
   for name in names:
      time.append(data[name]['surv'])
      event.append(data[name]['even'])
      expr.append(data[name]['expression'])
   robjects.r ('''
    plotdistA <- function (filename,expr,event,time,cutpoint = 0.5, main='') {
     time  = as.numeric(time)
     event = as.numeric(event)
     expr  = as.numeric(expr)
     cutpoint = as.numeric(cutpoint) 
     CairoPNG(filename=filename,width = 800, height = 400)
     myCols <- c('black', 'red')
     ord = order(expr)
     cutpoint = expr[ord][as.integer(length(expr)*cutpoint)]
     mid = as.integer(length(expr)/cutpoint)
     xlim <- range(time, na.rm = TRUE)
     ylim <- range(expr, na.rm = TRUE)
     groups <- cut(expr, 
      breaks = c(ylim[1], cutpoint, ylim[2]),
      include.lowest = TRUE)
     par(oma = c(0, 0, 1, 8), mar = c(5,4,2,2)+0.1, las = 1)
     layout(matrix(1:2, nrow = 1), widths = c(1,1.5))
     plot(expr[ord],
      col = myCols[as.numeric(groups)][ord],
      xlab='Samples',ylab='Expression')
     abline(h = cutpoint, lty = 4)
     par(xpd = NA)
     survplot (Surv(time,event) ~ groups, 
      col=myCols,
      legend.pos = list(x = xlim[2], y = 0.25),
      hr.pos = list(x = xlim[2], y = 1),
      xlab = 'Time', ylab = 'Fraction')
     title(main,outer=TRUE)
     dev.off()
    }
   ''')
   try:
      robjects.r['plotdistA'](filename = filewrite, time = time , event = event, expr = expr, cutpoint = cutpoint, main = title)
      return filename
   except:
      return 'Error'

def rocbees(ARGVS):
   '''
   ROC curves and the beeswarm plot 
   from beeswarm R package
   '''
   beeswarm = importr('beeswarm')
   Cairo = importr('Cairo')
   ROC   = importr('ROC')
   filename = ARGVS['file']
   data     = ARGVS['data']
   title    = ARGVS['title']
   category = ARGVS['opts']
   filewrite = ROOT_PATH + '/media/tmp/' + filename 
   resp    = []
   expr    = []
   names = data.keys()
   for name in names:
      resp.append(data[name]['resp'])
      expr.append(data[name]['expression'])
   robjects.r ('''
    approx3 <- function(x, y = NULL, theta = 0.001) {
     xy <- xy.coords(x, y)
     dx <- diff(xy$x)/(max(xy$x) - min(xy$x))
     dy <- diff(xy$y)/(max(xy$y) - min(xy$y))
     angle <- atan2(dy, dx)
     diff.angle <- diff(angle)%%pi
     abs.diff.angle <- pmin(diff.angle, pi - diff.angle)
     keep <- c(TRUE, abs.diff.angle > theta, TRUE)
     xy$x <- xy$x[keep]
     xy$y <- xy$y[keep]
     xy
    }
    aronroc <- function(x, truth, type = "l", xlab = expression(1 -
     specificity), ylab = "Sensitivity", ...) {
     require(ROC)
     r <- rocdemo.sca(truth, x)
     xy <- list(x = 1 - r@spec, y = r@sens)
     xy.trimmed <- approx3(xy)
     plot(xy.trimmed, type = type, xlab = xlab, ylab = ylab, ...)
     invisible(xy.trimmed)
    }
    plotResps <- function (filename,expr,resp,category, main='') {
     expr  = as.numeric(expr)
     resp  = as.character(resp)
     CairoPNG(filename=filename,width = 800, height = 400)
     par(oma = c(0,0,1,0))
     layout(matrix(1:2, nrow = 1), widths = c(1,1))
     beeswarm(expr ~ resp,col=c(1:length(unique(resp))),
      pch=16,xlab='Response Categories', ylab='Expression')
     par(xpd = NA)
     aronroc (expr, resp == category)
     title(main,outer=TRUE)
     dev.off()
    }    
   ''')
   try:
      robjects.r['plotResps'](filename = filewrite, expr = expr, resp = resp, category = category, main = title)
      return filename
   except:
      return 'Error'

def groupanalysis(ARGVS):
   '''
   Grouping analysis, makes beeswarm,
   ROC curves, boxplot and scatterplots. 
   '''
   beeswarm = importr('beeswarm')
   Cairo = importr('Cairo')
   ROC   = importr('ROC')
   filename = ARGVS['file']
   data     = ARGVS['data']
   title    = ARGVS['title']
   try:
      opts, dataname = ARGVS['opts'].split(':')
   except ValueError:
      opts = ARGVS['opts']
   filewrite = ROOT_PATH + '/media/tmp/' + filename 
   cats    = []
   expr    = []
   names = data.keys()
   for name in names:
      cats.append(data[name]['data'])
      expr.append(data[name]['expression'])
   robjects.r ('''
    approx3 <- function(x, y = NULL, theta = 0.001) {
     xy <- xy.coords(x, y)
     dx <- diff(xy$x)/(max(xy$x) - min(xy$x))
     dy <- diff(xy$y)/(max(xy$y) - min(xy$y))
     angle <- atan2(dy, dx)
     diff.angle <- diff(angle)%%pi
     abs.diff.angle <- pmin(diff.angle, pi - diff.angle)
     keep <- c(TRUE, abs.diff.angle > theta, TRUE)
     xy$x <- xy$x[keep]
     xy$y <- xy$y[keep]
     xy
    }
    aronroc <- function(x, truth, type = "l", xlab = expression(1 -
     specificity), ylab = "Sensitivity", ...) {
     require(ROC)
     r <- rocdemo.sca(truth, x)
     xy <- list(x = 1 - r@spec, y = r@sens)
     xy.trimmed <- approx3(xy)
     plot(xy.trimmed, type = type, xlab = xlab, ylab = ylab, ...)
     invisible(xy.trimmed)
    }
    plotRoc <- function (filename,expr,data,category, main='') {
     expr  = as.numeric(expr)
     data  = as.character(data)
     CairoPNG(filename=filename,width = 800, height = 400)
     par(oma = c(0,0,1,0))
     layout(matrix(1:2, nrow = 1), widths = c(1,1))
     beeswarm(expr ~ data,col=c(1:length(unique(data))),
      pch=16,xlab='Categories', ylab='Expression')
     par(xpd = NA)
     aronroc (expr, data == category)
     title(main,outer=TRUE)
     dev.off()
    }
    plotPoints <- function(filename, expr, data, dataname, main='') {
     expr  = as.numeric(expr)
     data  = as.character(data)
     CairoPNG(filename=filename,width = 800, height = 400)
     #plot(x=data,y=expr,col=rgb(0,100,0,50,maxColorValue=255), pch=16,ylab='Expression', xlab=dataname)
     plot(x=data,y=expr,pch=16,ylab='Expression', xlab=dataname)
     title(main)
     dev.off()
    }
    plotBoxes <- function(filename, expr, data, dataname, main='') {
     expr  = as.numeric(expr)
     data  = as.character(data)
     CairoPNG(filename=filename,width = 800, height = 400)
     boxplot(expr ~ data, ylab='Expression', xlab=dataname)
     title(main)
     dev.off()
    }
   ''')
   try:
      if opts == 'scatterplot':
         robjects.r['plotPoints'](filename = filewrite, expr = expr, data = cats, dataname = dataname, main = title)
      elif opts == 'boxplot':
         robjects.r['plotBoxes'](filename = filewrite, expr = expr, data = cats, dataname = dataname, main = title)
      else:
         robjects.r['plotRoc'](filename = filewrite, expr = expr, data = cats, category = opts, main = title + ' ' +opts)
      return filename
   except:
      return 'Error'

from __future__ import with_statement
from ocelot.pyGEO.models import Dictionary, MetaInfo
from ocelot.Platforms.models import Platform
from ocelot.main.models import Datasets
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import simplejson
from xml.etree import ElementTree as ET
from django.utils.encoding import smart_str, smart_unicode
from urllib2 import urlopen, Request
from urllib import urlencode
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt
import contextlib, bz2, gzip, re, os, io, zlib
from django.contrib.auth.decorators import login_required
from StringIO import StringIO
from settings import ROOT_PATH

def getGEOurl(acc,purpose):
   '''
   Get the url of a dataset for a given purpose, we will narrow
   down the purpose to expr: (get big file withthe samples 
   gene expression), meta: for the small dataset info, data:
   for the survival, events respond file for each sample(in the
   charachteristics)
   '''
   url = 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi'
   if purpose == 'data':
      values = {'acc' : acc,
                'form' : 'xml',
                'view' : 'brief',
                'targ' : 'gsm' }
   if purpose == 'meta':
      values = {'acc' : acc,
                'form' : 'xml',
                'view' : 'quick',
                'targ' : 'gse'  }
   if purpose == 'expr':
      values = {'acc' : acc,
                'form' : 'text',
                'view' : 'data',
                'targ' : 'gsm' }
   if purpose == 'platform':
      values = {'acc' : acc,
                'form' : 'xml',
                'view' : 'brief',
                'targ' : 'gpl'  }
   data = urlencode(values)
   req = Request(url, data)
   return req

def GEOdsParse(f):
   '''
   Parse the given GEO XML dataset file and retrieve some
   Metadata information
   '''
   tree = ET.parse(f)
   
   def geElmText(et,pattern):
      xmlNS = '//{http://www.ncbi.nlm.nih.gov/geo/info/MINiML}'
      res = ''
      target = xmlNS + pattern
      elts = et.findall(target) 
      for x in elts:
         res  = res + x.text.strip() + " "
      return res.strip()
   title =  smart_unicode(geElmText(tree,'Title'))
   pm =  smart_unicode(geElmText(tree,'Pubmed-ID'))
   released = smart_unicode(geElmText(tree,'Release-Date'))
   summ =  smart_unicode(geElmText(tree,'Summary'))
   acc=  smart_unicode(geElmText(tree,'Accession'))
   results = dict(title = title, pubmed = pm, released = released, summary = summ, accessions = acc)
   return results
'''
def doGSMtable(gsms,tag):
   
   Take some xml from NCBI and build the Char
   table (still to be improve... look at the 
   javascript version)
   
   NS = '//{http://www.ncbi.nlm.nih.gov/geo/info/MINiML}'
   tagname = NS + tag
   with contextlib.closing(urlopen(getGEOurl(gsms[0],'data'))) as GSMfirst:
      geo = ET.parse(GSMfirst)
   elts = geo.findall(tagname)
   table = []
   try:
      if elts[0].get('tag') is not None:
         table.append( mark_safe('<div id="char_table">') )
         table.append( mark_safe('<div class="tab_row">') )
         for x in elts:
            table.append( mark_safe('<div class="cellTitle">'+x.get('tag')+'</div>') )
         table.append( mark_safe('</div>') )
         for gsm in gsms:
            with contextlib.closing(urlopen(getGEOurl(gsm,'data'))) as GSMth:
               geo = ET.parse(GSMth)
            elts = geo.findall(tagname)
            table.append( mark_safe('<div class="tab_row">') )
            for x in elts:
               table.append( mark_safe('<div class="cell">'+x.text.strip()+'</div>') )
            table.append( mark_safe('</div>') ) 
         table.append( mark_safe('</div>') )
   except:
      pass
   return table
'''
def doGSMtable(gsms):
   '''
   Take the xml from NCBI and build the Char
   table (still to be improve... look at the 
   javascript version)
   '''
   NS = '{http://www.ncbi.nlm.nih.gov/geo/info/MINiML}'
   samples         = '//'+NS + 'Sample'
   chars_from_root = '//'+NS + 'Characteristics'
   characts        =      NS + 'Characteristics'
   channels        =      NS + 'Channel'
   with contextlib.closing(urlopen(getGEOurl(gsms,'data'))) as xml:
      geo = ET.parse(xml)
   elts = geo.findall(chars_from_root)
   # Collect all the tags:
   tags = []
   for elem in elts:
      content = elem.get('tag')
      if content is not None:
         content = content.strip()
      if content not in tags:
         tags.append(content)
   table = ''   
   if len(tags) > 0:
      table += '<div id="char_table">'
      #Create the cell titles from the collected tags
      table +=  '<div class="tab_row">'
      for tag in tags:
         if tag is not None:
            table += '<div class="cellTitle">'+tag+'</div>'
         else:
            table += '<div class="cellTitle"></div>'
      table +=  '</div><!--tab_row-->'                     
      elts = geo.findall(samples)
      for elem in elts:
         channs   = elem.findall(channels)
         elemdict = {}
         for chann in channs:
            chars = chann.findall(characts)
            for char in chars:
               chartag = char.get('tag')
               chartex = char.text
               if chartag is not None:
                  if chartex is not None:
                     elemdict[chartag.strip()] = chartex.strip()
         elemkeys = elemdict.keys()
         table += '<div class="tab_row">'
         for tag in tags:
            if tag in elemkeys:
               table += '<div class="cell">'+elemdict[tag]+'</div>'
            else:
               table += '<div class="cell"></div>'
         table += '</div><!--tab_row-->'                     
      table += '</div><!--char_table-->'   
   else:
      table = '<div></div>'
   return mark_safe(table)


def eUtilsNCBI(acc,convto):
   '''
   Use the eUtils from NCBI to convert a GDS from GSE and 
   vice versa if possible. 
   '''
   eSearchUrl   = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi' 
   eSummaryUrl  = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
   searchValues = {'db' : 'gds',
                   'term' : acc,
                   'retmode' : 'xml'}
   with contextlib.closing(urlopen(Request(eSearchUrl,urlencode(searchValues)))) as eUtil:
      eTree = ET.parse(eUtil)
   idList = eTree.find('IdList')
   if convto == 'GDS':
      for item in idList:
         if item.text.startswith('2000'):
            uId = item.text
            break
   else:
      uId = idList[0].text
   summValues = {'db' : 'gds',
                 'id' : uId,
                 'retmode' : 'xml'}
   with contextlib.closing(urlopen(Request(eSummaryUrl,urlencode(summValues)))) as eUtil:
      eTree = ET.parse(eUtil)
   if convto == 'GDS':
      for i in eTree.getiterator():
         if i.get('Name') == 'GDS':
            result = i.text
            if result:
               result = result.split(";")
               result[:] = ['GDS'+i for i in result]
            break
   if convto == 'GSE':
      for i in eTree.getiterator():
         if i.get('Name') == 'GSE':
            result =  'GSE'+i.text
         break
   return result

def RegisterGSE(Dict,MetaI):
   '''
   Register the dictionary for a GSE in the main Datasets
   Models. Exposing the dataset to the public view.  
   '''
   dataset  = list(Datasets.objects.raw("SELECT * FROM main_datasets WHERE dataset_id = %s", [Dict.dataset_id]))
   if not dataset:
      dataset = Datasets(dataset_id = Dict.dataset_id)
   else:
      dataset = dataset[0]
   dataset.have_response = Dict.response != ''
   dataset.have_surv_rec = Dict.surv_rec != '' and Dict.event_rec != ''
   dataset.have_surv_tot = Dict.surv_tot != '' and Dict.event_tot != ''
   dataset.plugin        = 'geo'
   ''' Metainfo part'''
   dataset.samples_count = MetaI.samples_count
   dataset.incl_criteria = MetaI.incl_criteria
   dataset.treatment     = MetaI.treatment
   dataset.subtype       = MetaI.subtype
   dataset.disease       = MetaI.disease
   dataset.saved         = MetaI.saved
   dataset.released      = MetaI.released
   platform_id = []
   platform_name = []
   platforms = MetaI.platform.split(',')
   for p in platforms:
      platform_id.append(p)
      plt = list(Platform.objects.filter(platform_id = p))[0]
      platform_name.append(plt.name) 
   alias_gds = eUtilsNCBI(Dict.dataset_id,'GDS')
   dataset.platform_id = ",".join(platform_id)
   dataset.platform_name = ",".join(platform_name)
   if alias_gds:
      dataset.alias_gds = "".join(alias_gds)
   dataset.save()

def GPL2title(acc):
   '''
   Return just the name of the platform(s) given the GPL id or the GSE id
   '''
   with contextlib.closing(urlopen(getGEOurl(acc,'platform'))) as platform:
      gpl = ET.parse(platform)
   NS = '//{http://www.ncbi.nlm.nih.gov/geo/info/MINiML}'
   gplList = []
   
   Ptag = NS+'Platform'
   Ttag = '.'+NS+'Title'
   platforms = gpl.findall(Ptag)
   for elem in platforms:
      p_id    = elem.get('iid')
      title = elem.find(Ttag).text
      gplList.append({'id': p_id, 'title':title})
   return gplList

@login_required(login_url='/accounts/login/')
def addDS(request):
   '''
   Add dataset entry list to the database
   '''
   if request.is_ajax():
      if request.method == 'POST':
         location =  request.POST['location']
         if location == 'geo':
            dslist   =  simplejson.loads(request.POST['data'])
            for ds in dslist:
               if not list(Dictionary.objects.filter(dataset_id__exact = ds)):
                  dataset  = Dictionary(dataset_id = ds)
                  dataset.save()
            return HttpResponse('Dataset saved',mimetype="text/html")
         elif location == 'index':
            ds = request.POST['data']
            dictionary  = Dictionary.objects.get(dataset_id__exact = ds)
            metainfo    = MetaInfo.objects.get(dataset_id__exact = ds)            
            RegisterGSE(dictionary,metainfo)
            return HttpResponse('Dataset saved',mimetype="text/html")   
         else:
            return HttpResponse('Nothing Done',mimetype="text/html")
@login_required(login_url='/accounts/login/')
def rmDS(request):
   '''
   Remove a dataset from the database
   '''
   if request.is_ajax():
      if request.method == 'POST':
         ds =  request.raw_post_data
         dataset = Dictionary.objects.filter(dataset_id = ds)
         metainf = MetaInfo.objects.filter(dataset_id = ds)
         indexed = Datasets.objects.filter(dataset_id = ds)
         if list(dataset):
            dataset.delete()
         if list(metainf):
            metainf.delete()
         if list(indexed):
            indexed.delete()
         return HttpResponse('Dataset removed',mimetype="text/html")

def platformFreqs(platID):
   mat = list(MetaInfo.objects.all())
   plat_list = []
   for m in mat:
      local_p = m.platform.split(',')
      for p in local_p:
         plat_list.append(p)
   count = 0
   for p in plat_list:
      if p == platID:
         count += 1
   return count

def get_express(acc):
   gpls = GPL2title(acc)
   if len(gpls) == 1:
      series_file = acc + '_series_matrix.txt.gz'
      if not os.path.isfile(ROOT_PATH + '/data/expressions/' + series_file):
         getGEOexpr(acc,series_file)
   else:
      for gpl in gpls:
         series_file = acc + '-'+ gpl['id'] +'_series_matrix.txt.gz'
         if not os.path.isfile(ROOT_PATH + '/data/expressions/' + series_file):
            getGEOexpr(acc,series_file)

def getGEOexpr(acc,filename):
   geo_expr_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SeriesMatrix/' + acc + '/' + filename
   out_path = '/data/expressions/'
   out_file = ROOT_PATH + out_path + filename
   print 'downloading ' + geo_expr_url
   find_start = re.compile('!series_matrix_table_begin')
   switch = 'OFF'
   tmp = ''
   with contextlib.closing(urlopen(geo_expr_url)) as serie_matrix:
      with contextlib.closing(StringIO(serie_matrix.read())) as fbuffer:
         with contextlib.closing(gzip.GzipFile(fileobj=fbuffer)) as unzipped:
            for line in unzipped.readlines():
               if re.search('!series_matrix_table_end',line):
                  switch = 'OFF'
                  print 'End of File'
               if switch == 'ON':
                  if line.startswith('"ID_REF"'):
                     tmp += line.replace('\"','')
                  else:
                     line  = line.strip().split('\t')
                     probe = line[0]
                     expr  = line[1:]
                     probe  = probe.replace('\"','')
                     for index,num in enumerate(expr):
                       try:
                          expr[index] = str(round(float(num),2))
                       except ValueError:
                          expr[index] = 'NA'
                     expr = '\t'.join(expr)
                     line = probe + '\t' + expr + '\n'
                     tmp += line
               if switch == 'OFF':
                  if find_start.match(line):
                     switch = 'ON'
   with contextlib.closing(gzip.GzipFile(out_file,'wb')) as outfile:
      with contextlib.closing(StringIO(tmp)) as shorter:
         outfile.write(shorter.read())
   os.chmod(out_file,0664)   
   print 'Done\n'

def geoXml(request,dataset_id):
   '''
   Check if the file is alredy been downloaded,
   if not retrieve the xml from geo
   '''
   filename = ROOT_PATH +'/data/gsms/' + dataset_id + '_gsms.xml.gz'
   if os.path.isfile(filename):
      with contextlib.closing(gzip.GzipFile(filename,'rb')) as geo:
         return HttpResponse(geo.read(),mimetype="text/xml")
   else:
      req = getGEOurl(dataset_id,'data')
      with contextlib.closing(urlopen(req)) as geo:
         tmp = geo.read()
      with contextlib.closing(gzip.GzipFile(filename,'wb')) as filein:
         filein.write(str(tmp))
      os.chmod(filename,0664)
      return HttpResponse(str(tmp),mimetype="text/xml")

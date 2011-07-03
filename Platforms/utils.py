from __future__ import with_statement
from settings import ROOT_PATH
from urllib2 import urlopen, URLError
import contextlib, gzip, re
from django.utils import simplejson
from StringIO import StringIO

def getGEOannot(acc,fields):
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   out_path = '/data/annotations/'
   out_file = ROOT_PATH + out_path + acc +'.json.gz'
   def annot_parse(annot_platform,fields):
      find_start = re.compile('!platform_table_begin')
      switch = 'OFF'        
      annot_lookup = {}         
      for field in fields:
         annot_lookup[field] = ''
      tmp_dict = {}
      with contextlib.closing(StringIO(annot_platform.read())) as fbuffer:
         with contextlib.closing(gzip.GzipFile(fileobj=fbuffer)) as unzipped:
            for line in unzipped.readlines():
               if re.search('!platform_table_end',line):
                  switch = 'OFF'
                  break
               if switch == 'ON':
                  if line.startswith('ID'):
                     line  = line.strip().replace('\"','').split('\t')
                     names = line[1:]                  
                     for position, name in enumerate(names):
                        for item in annot_lookup.keys():
                           if name == item:
                              annot_lookup[item] = position
                  else:
                     line  = line.replace('\"','').split('\t')
                     idref = line[0]
                     accessions = line[1:]
                     tmp_dict[idref] = {}
                     for item in annot_lookup.keys():
                        tmp_dict[idref][item] = accessions[annot_lookup[item]]
               if switch == 'OFF':
                  if find_start.match(line):
                     switch = 'ON'
      return tmp_dict
   '''
   Sometimes the annotation is not in the annotation folder,
   So we are going to take it in the much bigger file with all the 
   experiments data also, and we just parse the annotation table
   '''
   tmp_dict = {}
   print 'downloading ' + geo_annot_url
   try:
      with contextlib.closing(urlopen(geo_annot_url)) as annot_platform:
         tmp_dict = annot_parse(annot_platform,fields)
   except URLError:
      with contextlib.closing(urlopen(alternative_url)) as annot_platform:
         tmp_dict = annot_parse(annot_platform,fields)
   with contextlib.closing(StringIO(simplejson.dumps(tmp_dict))) as json_annot:
      with contextlib.closing(gzip.GzipFile(out_file,'wb')) as outfile:
         outfile.write(json_annot.read())   
   print 'Done\n'


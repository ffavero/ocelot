from __future__ import with_statement
from settings import ROOT_PATH
from urllib2 import urlopen, Request
from urllib import urlencode
import contextlib, bz2, gzip, re, os, io
from django.utils import simplejson
from StringIO import StringIO


def getGEOannot(acc,fields):
   geoDATAurl = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   outPATH = '/data/annotations/'
   outFILE = ROOT_PATH + outPATH + acc +'.json'
   print 'downloading ' + geoDATAurl
   with contextlib.closing(urlopen(geoDATAurl)) as annotation_file:
      print 'Done downloading...'
      print annotation_file.info().gettype()
      if annotation_file.info().gettype() == 'text/plain':
         f_buffer = StringIO(annotation_file.read())
         ftmp = gzip.GzipFile(fileobj=f_buffer)
         print 'Parsing...'
         switch = 'OFF'
         find_start = re.compile('!platform_table_begin')
         annot_lookup = {}
         tmp_dict = {}
         for field in fields:
            annot_lookup[field] = ''
         for line in ftmp:
            if re.search('!platform_table_end',line):
               switch = 'OFF'
               print 'End of File'            
            if switch == 'ON':
               if line.startswith('ID'):
                  tmpline  = line.replace('\"','').split('\t')
                  names = tmpline[1:]                  
                  for position, name in enumerate(names):
                     for item in annot_lookup.keys():
                        if name == item:
                           annot_lookup[item] = position
               else:
                  tmpline       = line.replace('\"','').split('\t')
                  idref     = tmpline[0]
                  accessions = tmpline[1:]
                  tmp_dict[idref] = {}
                  for item in annot_lookup.keys():
                     tmp_dict[idref][item] = accessions[annot_lookup[item]] 
            if find_start.match(line):
               switch = 'ON'
         ftmp.close()
         f_buffer.close()
         json_annot = simplejson.dumps(tmp_dict)
         f = io.open(outFILE, 'wb')
         f.write(json_annot)
         f.close()
   print 'Done\n'


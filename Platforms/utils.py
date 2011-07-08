from __future__ import with_statement
from settings import ROOT_PATH
from urllib2 import urlopen, URLError
import contextlib, gzip, re
from django.utils import simplejson
from StringIO import StringIO
from xml.etree import ElementTree as ET
from xml.dom import minidom
from django.utils.safestring import mark_safe

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
                     line  = line.strip().replace('\"','').split('\t')
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


def getGEOannotXML(acc,fields):
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   out_path = '/data/annotations/'
   out_file = ROOT_PATH + out_path + acc +'.xml.gz'
   def annot_parse(annot_platform,fields):
      find_start = re.compile('!platform_table_begin')
      switch = 'OFF'        
      annot_lookup = {}         
      for field in fields:
         annot_lookup[field] = ''
      tmp_xml = ET.Element('ocelot-annotation')
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
                     line  = line.strip().replace('\"','').split('\t')
                     idref = line[0]
                     accessions = line[1:]
                     probe = ET.SubElement(tmp_xml, 'probe',{'id':idref})
                     for item in annot_lookup.keys():
                        annot      = ET.SubElement(probe, 'annotation',{'name':item})
                        annot.text = accessions[annot_lookup[item]]
               if switch == 'OFF':
                  if find_start.match(line):
                     switch = 'ON'
      return tmp_xml
   def prettify(elem):
      rough_string = ET.tostring(elem, 'utf-8')
      reparsed = minidom.parseString(rough_string)
      return reparsed.toprettyxml(indent="  ")
   '''
   Sometimes the annotation is not in the annotation folder,
   So we are going to take it in the much bigger file with all the 
   experiments data also, and we just parse the annotation table
   '''
   print 'downloading ' + geo_annot_url
   try:
      with contextlib.closing(urlopen(geo_annot_url)) as annot_platform:
         xml = annot_parse(annot_platform,fields)
         with contextlib.closing(gzip.GzipFile(out_file,'wb')) as outfile:
            outfile.write(prettify(xml))
   except URLError:
      with contextlib.closing(urlopen(alternative_url)) as annot_platform:
         xml = annot_parse(annot_platform,fields)
         with contextlib.closing(gzip.GzipFile(out_file,'wb')) as outfile:
            outfile.write(ET.tostring(xml))
   print 'Done\n'

def geo_annot_tab(acc,lines):
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   def annot_to_html(annot_platform,lines):
      find_start = re.compile('!platform_table_begin')
      switch  = 'OFF'
      counter = 0
      tmp_html = '<div id="annot_tab">'
      with contextlib.closing(StringIO(annot_platform.read())) as fbuffer:
         with contextlib.closing(gzip.GzipFile(fileobj=fbuffer)) as unzipped:
            for line in unzipped.readlines():
               if counter >= lines:
                  switch = 'OFF'
                  tmp_html += '</div><!--annot_tab-->'
                  break
               if switch == 'ON':
                  if line.startswith('ID'):
                     line      = line.strip().replace('\"','').split('\t')
                     tmp_html += '<div class="tab_row">'
                     for name in line:
                        tmp_html += '<div class="cellTitle" title="'+name+'">'+name+'</div>'
                     tmp_html += '</div>'
                  else:
                     counter += 1
                     line  = line.strip().replace('\"','').split('\t')
                     tmp_html += '<div class="tab_row">'
                     for name in line:
                        tmp_html += '<div class="cell">'
                        if len(name) >= 14:
                           tmp_html += name[:10]+' ...</div>'
                        else:
                           tmp_html += name + '</div>'
                     tmp_html += '</div>'
               if switch == 'OFF':
                  if find_start.match(line):
                     switch = 'ON'
      return tmp_html
   '''
   Sometimes the annotation is not in the annotation folder,
   So we are going to take it in the much bigger file with all the 
   experiments data also, and we just parse the annotation table
   '''
   print 'downloading ' + geo_annot_url
   try:
      with contextlib.closing(urlopen(geo_annot_url)) as annot_platform:
         res = annot_to_html(annot_platform,lines)
         return mark_safe(res)
   except URLError:
      with contextlib.closing(urlopen(alternative_url)) as annot_platform:
         res = annot_to_html(annot_platform,lines)
         return mark_safe(res)
   print 'Done\n'



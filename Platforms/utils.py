from __future__ import with_statement
from urllib2 import urlopen, URLError
import contextlib, gzip, re, os, settings
from django.utils import simplejson
from StringIO import StringIO
from xml.etree import ElementTree as ET
from xml.dom import minidom
from django.utils.safestring import mark_safe

def getGEOannot(acc,fields):
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   out_path = '/data/annotations/'
   out_file = settings.ROOT_PATH + out_path + acc +'.json.gz'
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
   if settings.FILE_UPLOAD_PERMISSIONS is not None:
      os.chmod(out_file, settings.FILE_UPLOAD_PERMISSIONS)
   print 'Done\n'

def geo_annot_tab(acc,lines):
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   #alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   alternative_url = 'http://www.ncbi.nlm.nih.gov/projects/geo/query/acc.cgi?view=data&acc=' + acc + '&form=text'
   def annot_to_html(annot_platform,lines):
      find_start = re.compile('!platform_table_begin')
      switch  = 'OFF'
      counter = 0
      tmp_html = '<div id="annot_tab">'
      with contextlib.closing(StringIO(annot_platform.read())) as fbuffer:
         try:
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
         except IOError:
            for line in fbuffer.readlines():
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

def get_geo_annot_split(acc,fields):
   '''
   Again the same function, but instead to save one json file
   with all the info, we save a file for each chose annotation,
   so the server or the client don't have to turn over the file
   to have the desired info, but the server will have just to 
   "serve" the file (since the client with PHP4 is not happy on 
   parsing big json or XML file)
   '''
   geo_annot_url   = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/annotation/platforms/' + acc + '.annot.gz'
   #alternative_url = 'ftp://ftp.ncbi.nih.gov/pub/geo/DATA/SOFT/by_platform/' + acc + '/'+ acc  + '_family.soft.gz'
   alternative_url = 'http://www.ncbi.nlm.nih.gov/projects/geo/query/acc.cgi?view=data&acc=' + acc + '&form=text'
   out_path = '/data/annotations/'
   out_dict = {}
   non_lit = re.compile(r'[\W]+')
   for field in fields:
      suffix = non_lit.sub('',field)
      out_dict[field] = suffix
   meta_dict = {}
   meta_dict['indexes'] = out_dict
   meta_dict['default'] = out_dict[fields[0]]
   if 'ID' in fields:
      fields.remove('ID')
   def annot_parse(annot_platform,fields):
      find_start = re.compile('!platform_table_begin')
      switch = 'OFF'        
      annot_lookup = {}         
      for field in fields:
         annot_lookup[field] = ''
      tmp_dict = {}
      with contextlib.closing(StringIO(annot_platform.read())) as fbuffer:
         try:
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
         except IOError:
            for line in fbuffer.readlines():
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
                        if len(accessions) >= annot_lookup[item]:
                           tmp_dict[idref][item] = accessions[annot_lookup[item]]
               if switch == 'OFF':
                  if find_start.match(line):
                     switch = 'ON'
      return tmp_dict
   def parse_single_key(json,key):
      tmp = {}
      if key == 'ID':
         index   = json.keys()
         for item in json:
            tmp[item] = [item]
         reverse = tmp 
      else:
         tmp     = {}
         index   = []
         reverse = {}
         for item in json:
            tmp[item] = {}
            keysidx = json[item].keys()
            for idx in keysidx:
               if idx == key:
                  value = json[item][idx]
                  tmp[item][idx] = value
                  if value not in index:
                     if value != '':
                        reverse[value] = []
                        reverse[value].append(item)
                        index.append(value)
                  else:
                     reverse[value].append(item)                
      res = {}
      res['turnd'] = reverse
      res['index'] = index
      res['annot'] = tmp
      return res      
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
   out_keys = out_dict.keys()
   for out in out_keys:
      tmp_json = tmp_dict
      res = parse_single_key(tmp_json,out)
      with contextlib.closing(StringIO(simplejson.dumps(res))) as json_annot:
         output = settings.ROOT_PATH + out_path + acc + '_' + out_dict[out] + '.json.gz'
         with contextlib.closing(gzip.GzipFile(output,'wb')) as outfile:
            outfile.write(json_annot.read())
         if settings.FILE_UPLOAD_PERMISSIONS is not None:
            os.chmod(output, settings.FILE_UPLOAD_PERMISSIONS)
   with contextlib.closing(StringIO(simplejson.dumps(meta_dict))) as json_meta:
      output = settings.ROOT_PATH + out_path + acc + '_metainfo.json.gz'
      with contextlib.closing(gzip.GzipFile(output,'wb')) as outfile:
         outfile.write(json_meta.read())
   if settings.FILE_UPLOAD_PERMISSIONS is not None:
      os.chmod(output, settings.FILE_UPLOAD_PERMISSIONS)

   print 'Done\n'



from __future__ import with_statement
from django.template.context import RequestContext
from django.shortcuts import render_to_response
from ocelot.pyGEO.models import Dictionary, MetaInfo, Platform
from ocelot.main.models import Datasets
from ocelot.pyGEO.utils import GEOdsParse, getGEOurl, doGSMtable, RegisterGSE, GPL2title, platformFreqs
from ocelot.pyGEO import forms as geoforms
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import simplejson
from urllib2 import urlopen
import contextlib
from django.core.context_processors import csrf
from django.contrib.auth.decorators import login_required
import datetime

@login_required(login_url='/accounts/login/')
def admin(request):
   '''
   Just pass the list of items inside the Dictionary
   and the Platforms present in the database
   '''
   datasets = list(Dictionary.objects.order_by('dataset_id'))
   d_saved = []
   for dataset in datasets:
      if list(Datasets.objects.filter(dataset_id = dataset.dataset_id)):
         d_saved.append([dataset.dataset_id, 'OK'])
      else:
         d_saved.append([dataset.dataset_id, 'NO'])
   platforms = list(Platform.objects.all())
   for p in platforms:
      p.used = platformFreqs(p.platform_id)
   payload = dict( d_saved = d_saved, platforms=platforms)
   payload.update(csrf(request))
   return render_to_response('geo_admin.html', payload)

@login_required(login_url='/accounts/login/')
def DSparse(request,dataset_id):
   '''
   Parse the XML and display the various information
   of the dataset...might be dismiss in order to do it
   client side with JavaSrcipt
   '''
   dictionary = list(Dictionary.objects.filter(dataset_id = dataset_id))
   metainfo = list(MetaInfo.objects.filter(dataset_id = dataset_id))
   if not dictionary:
      return HttpResponseRedirect('/admin/geo/')
   else:
      dictionary = dictionary[0]
      metainfo   = metainfo[0]
   datasets = list(Datasets.objects.all())
   platforms = GPL2title(dataset_id)
   platform_list = []
   for platform in platforms:
      plt = list(Platform.objects.raw("SELECT * FROM pyGEO_platform WHERE platform_id = %s", [platform['id']]))
      if not plt:
         plt = Platform(platform_id = platform['id'], name = platform['title'] )
         plt.save()
      platform_list.append(platform['id'])
   metainfo.platform = ",".join(platform_list)
   treatments = []
   subtypes  = []
   diseases  = []
   for dataset in datasets:
      treatments.append(dataset.treatment)
      diseases.append(dataset.disease)
      subtypes.append(dataset.subtype)
   treatments = simplejson.dumps(treatments)
   subtypes   = simplejson.dumps(subtypes)
   diseases   = simplejson.dumps(diseases)

   req = getGEOurl(dataset_id,'meta')
   '''url = req.get_full_url() + '?' + req.get_data()'''
   with contextlib.closing(urlopen(req)) as geo:
      DS = GEOdsParse(geo)
   acc = DS['accessions'].split()
   for a in acc:
      if not a.startswith('GSM'):
         acc.remove(a)
   released = DS['released'].split('-')
   metainfo.released = datetime.date(int(released[0].strip()),int(released[1].strip()),int(released[2].strip()))
   metainfo.saved = datetime.date.today()
   del DS['released']
   del DS['accessions']
   acclen = len(acc)
   doGSMtable.needs_autoescape = True
   GSMtable = doGSMtable(acc[0:3],'Characteristics')
   
   if request.method == 'GET':
      dictform = geoforms.GEOForm(instance=dictionary)
      metaform = geoforms.GEOMetaForm(instance=metainfo)
   if request.method == 'POST':
      dictform = geoforms.GEOForm(data=request.POST,instance=dictionary)
      metaform = geoforms.GEOMetaForm(data=request.POST,instance=metainfo)
      if dictform.is_valid() and metaform.is_valid():
         dictform.save()
         metaform.save()
         dictionary = list(Dictionary.objects.raw("SELECT * FROM pyGEO_dictionary WHERE dataset_id = %s", [dataset_id]))[0]
         metainfo = list(MetaInfo.objects.raw("SELECT * FROM pyGEO_metainfo WHERE dataset_id = %s", [dataset_id]))[0]
         metainfo.samples_count = acclen
         RegisterGSE(dictionary,metainfo)
         return HttpResponseRedirect('/admin/geo/')
   payload = dict(platforms=platforms, dictform=dictform, metaform=metaform, DS=DS, GSMtable=GSMtable, dataset_id=dataset_id, acclen=acclen, treatments=treatments, diseases=diseases, subtypes=subtypes)
   return render_to_response('geo_parse.html',payload,RequestContext(request))

def DSview(request,dataset_id):
   '''
   View the Dataset and relative data
   '''
   dataset = Dictionary.objects.raw("SELECT * FROM pyGEO_dictionary WHERE dataset_id = %s", [dataset_id])
   if not dataset:
      return HttpResponseRedirect('/')
   payload = dict( dataset_id = dataset_id )
   return render_to_response('geo_view.html', payload)    

def Dict2XML(request,dataset_id):
   '''
   Dump the selected dictionary  model in to an 
   XML file to be use as index of the main page 
   or with other programs (API).
   '''
   from django.core import serializers
   dictionary = list(Dictionary.objects.filter(dataset_id = dataset_id))
   xml = serializers.serialize('xml', dictionary)
   return HttpResponse(xml, content_type='text/xml')
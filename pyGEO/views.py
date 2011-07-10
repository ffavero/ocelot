from __future__ import with_statement
from django.template.context import RequestContext
from django.shortcuts import render_to_response
from ocelot.pyGEO.models import Dictionary, MetaInfo
from ocelot.main.queue import send_to_queue
from ocelot.Platforms.models import Platform
from ocelot.main.models import Datasets
from ocelot.pyGEO.utils import GEOdsParse, getGEOurl, doGSMtable, RegisterGSE, GPL2title, platformFreqs, get_express
from ocelot.pyGEO import forms as geoforms
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import simplejson
from urllib2 import urlopen
import contextlib, datetime
from django.core.context_processors import csrf
from django.contrib.auth.decorators import login_required
from django.forms import model_to_dict

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
   metainfo   = list(MetaInfo.objects.filter(dataset_id = dataset_id))
   if not dictionary:
      return HttpResponseRedirect('/admin/geo/')
   else:
      dictionary = dictionary[0]
      metainfo   = metainfo[0]
   datasets = list(Datasets.objects.all())
   platforms = GPL2title(dataset_id)
   platform_list = []
   for platform in platforms:
      platform_list.append(platform['id'])
   metainfo.platform = ",".join(platform_list)
   # Collect the metainfo to pass to the
   # Autocomplete
   treatments = []
   subtypes   = []
   diseases   = []
   for dataset in datasets:
      treats = dataset.treatment.split(',')
      for treatment in treats:
         treatments.append(treatment.strip())
      dis = dataset.disease.split(',')
      for disease in dis:
         diseases.append(disease.strip())
      subtps = dataset.subtype.split(',')
      for subtype in subtps:
         subtypes.append(subtype.strip())
   treatments = simplejson.dumps(treatments)
   subtypes   = simplejson.dumps(subtypes)
   diseases   = simplejson.dumps(diseases)
   req = getGEOurl(dataset_id,'meta')
   with contextlib.closing(urlopen(req)) as geo:
      DS = GEOdsParse(geo)
   acc = DS['accessions'].split(' ')
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
   # Form part:
   if request.method == 'GET':
      dictform = geoforms.GEOForm(instance=dictionary)
      metaform = geoforms.GEOMetaForm(instance=metainfo)
   if request.method == 'POST':
      dictform = geoforms.GEOForm(data=request.POST,instance=dictionary)
      metaform = geoforms.GEOMetaForm(data=request.POST,instance=metainfo)
      if dictform.is_valid() and metaform.is_valid():
         ## This is going to be long but only
         ## the first time... for now is ok.
         ## But it need to be fixed, with a proper
         ## queue....
         #p = Process(target = get_express, args = (dataset_id,))
         #p.start()
         send_to_queue('ocelot.pyGEO.utils','get_express',dataset_id)
         dictform.save()
         metaform.save()
         dictionary = list(Dictionary.objects.filter(dataset_id = dataset_id))[0]
         metainfo   = list(MetaInfo.objects.filter(dataset_id = dataset_id))[0]
         metainfo.samples_count = acclen
         for platform in platforms:
            plt = list(Platform.objects.filter(platform_id = platform['id']))
            if not plt:
               plt = Platform(platform_id = platform['id'], name = platform['title'] )
               plt.save()
         RegisterGSE(dictionary,metainfo)
         return HttpResponseRedirect('/admin/geo/')
   payload = dict(platforms=platforms, dictform=dictform, metaform=metaform, DS=DS, GSMtable=GSMtable, dataset_id=dataset_id, acclen=acclen, treatments=treatments, diseases=diseases, subtypes=subtypes)
   return render_to_response('geo_parse.html',payload,RequestContext(request))

def DSview(request,dataset_id):
   '''
   View the Dataset and relative data
   '''
   dictionary = list(Dictionary.objects.filter(dataset_id__exact = dataset_id))
   if not dictionary:
      return HttpResponseRedirect('/')
   metainfo = MetaInfo.objects.get(dataset_id__exact = dataset_id)
   platforms=[]
   platform_list = metainfo.platform.split(',')
   for p in platform_list:
      platform = Platform.objects.get(platform_id__exact = p)
      platforms.append(platform)
   payload = dict( dictionary = model_to_dict(dictionary[0]) , platforms = platforms)
   payload.update(csrf(request))
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

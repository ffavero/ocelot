#from google.appengine.ext import db

from django.db import models
"""
Main datastore objects. Each plugin would end up
write the finded information in those classes
"""

class Datasets(models.Model):
   """
   Define the existing datasets in the database and
   resume the status of the available information
   """
   dataset_id    = models.CharField(max_length=50)
   samples_count = models.IntegerField()
   have_surv_tot = models.BooleanField()
   have_surv_rec = models.BooleanField()
   have_response = models.BooleanField()
   saved         = models.DateField()
   released      = models.DateField()
   plugin        = models.CharField(max_length=50)
   treatment     = models.CharField(max_length=1000)
   subtype       = models.CharField(max_length=1000)
   disease       = models.CharField(max_length=500)
   alias_gds     = models.CharField(max_length=50)
   platform_id   = models.CharField(max_length=200)
   platform_name = models.CharField(max_length=1000)

class Ocelotqueue(models.Model):
   '''
   A place to write the process running in the background
   In case of failuse notice that the process have fail and
   avoid the multiple request of the same action
   '''
   process_id   = models.CharField(max_length=200)
   function     = models.CharField(max_length=200)
   argument     = models.CharField(max_length=1000)
   status       = models.CharField(max_length=50)
   date_stored  = models.DateTimeField()
   date_start   = models.DateTimeField(null=True)
   date_end     = models.DateTimeField(null=True)

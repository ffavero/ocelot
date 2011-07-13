#from google.appengine.ext import db
from django.db import models


class Dictionary(models.Model):
   """
   Definition of the field to match the right
   path in the Soft (or XML) file
   """
   dataset_id  = models.CharField(max_length=50)
   response    = models.CharField(max_length=500,blank=True)
   event_tot   = models.CharField(max_length=500,blank=True)
   surv_tot    = models.CharField(max_length=500,blank=True)
   event_rec   = models.CharField(max_length=500,blank=True)
   surv_rec    = models.CharField(max_length=500,blank=True)
   grade       = models.CharField(max_length=500,blank=True)
   stage       = models.CharField(max_length=500,blank=True)
   age         = models.CharField(max_length=500,blank=True)
   cell_type   = models.CharField(max_length=500,blank=True)
   gender      = models.CharField(max_length=500,blank=True)


class MetaInfo(models.Model):
   """
   Information related to the Dataset, but not 
   suited to be in the Dictionary
   """
   dataset_id    = models.CharField(max_length=200)
   samples_count = models.IntegerField(null=True)
   treatment     = models.CharField(max_length=1000,blank=True)
   subtype       = models.CharField(max_length=1000,blank=True)
   disease       = models.CharField(max_length=500,blank=True)
   platform      = models.CharField(max_length=200,blank=True)
   saved         = models.DateField(auto_now=True,null=True)
   released      = models.DateField(null=True)


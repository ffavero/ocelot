from django.db import models

class Imported(models.Model):
   """
   Definition of the field to match the right
   to describe the dataset
   """
   dataset_id  = models.CharField(max_length=50)
   samples_count = models.IntegerField(null=True)
   incl_criteria = models.CharField(max_length=1000,blank=True)
   treatment     = models.CharField(max_length=1000,blank=True)
   subtype       = models.CharField(max_length=1000,blank=True)
   disease       = models.CharField(max_length=500,blank=True)
   platform      = models.CharField(max_length=200,blank=True)
   notes         = models.CharField(max_length=500,blank=True)
   saved         = models.DateField(auto_now=True,null=True)
   released      = models.DateField(null=True)


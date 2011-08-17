from django.db import models

# Create your models here.

   
class Platform(models.Model):
   """
   GEO GPL platform ID and Information
   """
   platform_id = models.CharField(max_length=50)
   name        = models.CharField(max_length=200)

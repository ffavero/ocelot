from django import forms
from ocelot.pyGEO import models

class GEOForm(forms.ModelForm):
    class Meta:
        model = models.Dictionary
        exclude = ('dataset_id','added')
        
class GEOMetaForm(forms.ModelForm):
    class Meta:
        model = models.MetaInfo
        exclude = ('dataset_id','platform','saved','released','samples_count')


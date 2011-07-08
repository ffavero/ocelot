from django.conf.urls.defaults import *
import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()


urlpatterns = patterns('',
   (r'^appadmin/', include(admin.site.urls)),
   (r'^accounts/login/$', 'django.contrib.auth.views.login'),
   (r'^media/(?P<path>.*)$','django.views.static.serve',{'document_root': settings.MEDIA_ROOT}),
   (r'^admin/geo/addDS/$','ocelot.pyGEO.utils.addDS'),
   (r'^admin/geo/rmDS/$','ocelot.pyGEO.utils.rmDS'),
   (r'^admin/geo/(?P<dataset_id>[^/]+)/$','ocelot.pyGEO.views.DSparse'),
   (r'^admin/geo/$', 'ocelot.pyGEO.views.admin'),
   (r'^admin/$', 'ocelot.main.views.admin'),
   (r'^api/index/$', 'ocelot.main.views.Datasets2XML'),
   (r'^api/geo/(?P<dataset_id>[^/]+)/$', 'ocelot.pyGEO.views.Dict2XML'),
   (r'^$', 'ocelot.main.views.index'),
   (r'^geo/(?P<dataset_id>[^/]+)/$','ocelot.pyGEO.views.DSview'),
   (r'^geo/(?P<dataset_id>[^/]+)/xml/$','ocelot.pyGEO.utils.geoXml'),
   (r'^help/$', 'ocelot.main.views.help'),
   (r'^exportCSV/$', 'ocelot.main.views.export_csv'),
   (r'^microarrpy/$', 'ocelot.pySurv.views.analyze'),
   (r'^annotation/$', 'ocelot.Platforms.views.get_annot_json'),
   (r'^admin/chip/$', 'ocelot.Platforms.views.index_annot'),
   (r'^admin/chip/table/(?P<platform_id>[^/]+)/$', 'ocelot.Platforms.views.page_platform'),
   (r'^admin/chip/table/$', 'ocelot.Platforms.views.table_platform'),
   (r'^admin/chip/edit/(?P<platform_id>[^/]+)/$', 'ocelot.Platforms.views.edit_platform'),
)

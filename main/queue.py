from ocelot.main.models import Ocelotqueue
from datetime import datetime
from multiprocessing import Process
import re, sys

def send_to_queue(funcpath,func,args):
   '''
   Just use the multiprocessing functions
   to send the job in the background
   '''
   p = Process(target = Queuefy, args = (funcpath,func,args,))
   p.start()

def Queuefy(funcpath,func,args):
   '''
   Register the function on the model execute 
   it and if succesful it delete the item and
   exit, otherwise rgister the "failed" status 
   and exit.
   '''
   non_lit = re.compile(r'[\W]+')
   process_id = func + non_lit.sub('',args)
   if checkqueue(func,args) == False:
      task  = Ocelotqueue(process_id=process_id,function=funcpath+'.'+func,argument=args,status='Waiting',date_stored=datetime.now())
      task.save()
      try:
         imp = 'from '+funcpath+' import '+func
         exe = func +'('+args+')'
         task.status = 'Active'
         task.date_start = datetime.now()
         task.save()
         exec(imp)
         exec(exe)
         task.delete()
      except:
         print sys.exc_info()
         task.status   = 'Error'
         task.date_end = datetime.now()
         task.save()
   else:
      return 'Task already in queue'

def checkqueue(func,args):
   '''
   Just check if a task is already in the list
   '''
   non_lit = re.compile(r'[\W]+')
   queue = list(Ocelotqueue.objects.filter(process_id = func + non_lit.sub('',args)))
   if len(queue) == 1:
      return queue[0].status
   if len(queue) == 0:
      return False
   

from ocelot.main.models import Ocelotqueue
from datetime import datetime
from multiprocessing import Process
import re, sys

def send_to_queue(funcpath,func,args):
   '''
   Just use the multiprocessing class
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
      consume_queue()
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

def consume_queue():
   '''
   Consume slowly the queue in order to have a defined
   number of process running at the same time, the rest 
   of them will stay on queue.
   '''
   queue_active = len(list(Ocelotqueue.objects.filter(status = 'Active')))
   if queue_active < 3:
      task = Ocelotqueue.objects.filter(status__exact = 'Waiting').order_by('date_stored')
      if len(task) >= 1:
         task     = task[0]
         funcpath = task.function
         funcpath = funcpath.split('.')
         func     = funcpath.pop()
         funcpath = '.'.join(funcpath)
         args     = task.argument
         try:
            imp = 'from '+funcpath+' import '+func
            exe = func +'('+args+')'
            task.status = 'Active'
            task.date_start = datetime.now()
            task.save()
            exec(imp)
            exec(exe)
            task.delete()
            consume_queue()
         except:
            print sys.exc_info()
            task.status   = 'Error'
            task.date_end = datetime.now()
            task.save()
      else:
         print 'Queue emptied'
   else:
      print 'Queue Full'

   

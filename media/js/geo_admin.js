function initGEO() {
 $('#loading').ajaxStart(function(){
   $(this).fadeIn();
   $('#overlay').width($(document).width());
   $('#overlay').height($(document).height());
 });
 $('#loading').ajaxStop(function(){
      $(this).fadeOut();
 });
 $('#loading').ajaxError(function(){
      $(this).fadeOut();
 });

 //add hover states on the static buttons
 $('.ui-button').hover(
  function(){ $(this).addClass('ui-state-hover'); }, 
  function(){ $(this).removeClass('ui-state-hover'); }
 );
 //handle bkg color change on hover with jquery (FF4 problem) 
 $('.DSLine').hover(
  function() {
   $(this).addClass('ui-state-active');
  },
  function() {
   $(this).removeClass('ui-state-active');
  }
 )
 //ok
 $('#addDS').button({
  icons: {
   primary: 'ui-icon-circle-plus',
  }
 });

 $('html').ajaxSend(function(event, xhr, settings) {
  function getCookie(name) {
   var cookieValue = null;
   if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
     var cookie = jQuery.trim(cookies[i]);
     // Does this cookie string begin with the name we want?
     if (cookie.substring(0, name.length + 1) == (name + '=')) {
      cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
      break;
     }
    }
   }
   return cookieValue;
  }
  if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
   // Only send the token to relative URLs i.e. locally.
   xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
  }
 });
}

function addDS() {
 $('#DSdialog').dialog({
  modal: true,
  "width": 400,
  "height":400,
  resizable : false,
  buttons: {
   Add : function(){
    var text = $('textarea#DSin').val();
    text = text.replace(/[^a-z|0-9]/ig,'');
    text = text.replace(/GDS/ig,'\nGDS');
    text = text.replace(/GSE/ig,'\nGSE');
    text = text.replace(/^\n/,'');
    text = text.split('\n');
    var dslist = JSON.stringify(text)
    //alert(dslist);
    $.ajax({
     url:'/admin/geo/addDS/',
     type:'post',
     data:{data:dslist,location:'geo'},
     dataType:'html',
     async:true,
     success: function(){
      $(this).dialog("close");
      location.reload();
     }
    });
   }
  }
 })
};
 
function removeDS(dataset) {
 $('#DSrmDialog').text('Do you really want to remove the selected '+dataset+' dataset?');
 $('#DSrmDialog').dialog({
  modal: true,
  "width": 200,
  "height":150,
  resizable : false,
  buttons: {
   Remove : function(){
     $.ajax({
      url:'/admin/geo/rmDS/',
      type:'post',
      data:dataset,
      dataType:'html',
      async:true,
      success: function(){
       $(this).dialog("close");
       location.reload();
      }
     });
   },
   No : function(){
    $(this).dialog("close");
   }
  }
 })
};

function goToGSE(gse) {
 $('#loading').fadeIn();
 $('#overlay').width($(document).width());
 $('#overlay').height($(document).height());
 window.location='/admin/geo/'+gse+'/';
}

function publishGSE(gse) {
  $.ajax({
  url:'/admin/geo/addDS/',
  type:'post',
  data:{data:gse,location:'index'},
  dataType:'html',
  async:true,
  success: function(){
   location.reload();
  },
  error: function() {
   alert('Sorry an error occurred.');
  }
 });
}



function initGEO() {

 //add hover states on the static buttons
 $('.ui-button').hover(
  function(){ $(this).addClass('ui-state-hover'); }, 
  function(){ $(this).removeClass('ui-state-hover'); }
 );
 //handle bkg color change on hover with jquery (FF4 problem) 
 $('.DSLine').hover(
  function() {
   $(this).css('background-color', '#baf7a6');
  },
  function() {
   $(this).css('background-color', '#fff');
  }
 )
 //ok
 $('#addDS').button({
  icons: {
   primary: 'ui-icon-circle-plus',
  }
 });

 $('#savedict').button({
  icons: {
   primary: 'ui-icon-disk',
   secondary: 'ui-icon-circle-check'
  }
 });
 
 $('#backToList').button({
  icons: {
   primary: 'ui-icon-circle-triangle-w',
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
    spinnerON();
    var text = $('textarea#DSin').val();
    text = text.replace(/[^a-z|0-9]/ig,'');
    text = text.replace(/GDS/ig,'\nGDS');
    text = text.replace(/GSE/ig,'\nGSE');
    text = text.replace(/^\n/,'');
    text = text.split('\n');
    var dslist = JSON.stringify(text)
    //alert(dslist);
     $.post('/admin/geo/addDS/',dslist, function(){alert("Data Saved")},'json');
    spinnerOFF();
    $(this).dialog("close");
    location.reload();
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
     $.post('/admin/geo/rmDS/',dataset);
    $(this).dialog("close");
    location.reload();
   },
   No : function(){
    $(this).dialog("close");
   }
  }
 })
};

function spinnerON() {
 $('#loadingDiv').css('display', 'block');
};

function spinnerOFF() {
 $('#loadingDiv').css('display', 'none');
};

function goToGSE(gse) {
 spinnerON();
 window.location='/admin/geo/'+gse+'/';
}

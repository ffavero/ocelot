

function initGEO() {
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

 $('.GSEremove').button({
  icons: {
   text: false, 
   primary: 'ui-icon-minus',
  }
 });

 $('.GSEgoTo').button({
  icons: {
   text: false, 
   primary: 'ui-icon-circle-zoomin',
  }
 });
 
 $('#backToList').button({
  icons: {
   primary: 'ui-icon-circle-triangle-w',
  }
 });

 $('#id_treatment ').autocomplete({
  source: treatments
 });

 $('#id_subtype').autocomplete({
  source: subtypes
 });
 
 $('#id_disease').autocomplete({
  source: diseases
 });
 
 $('input:text').each(function(index){
   /* $(this).attr('disabled',true); */
   var IDexcluded = ['id_disease','id_subtype','id_treatment'];
   if ($.inArray($(this).attr('id'),IDexcluded) == -1) {
    $('#Dictmenu').append("<li><a href='#'>"+$(this).attr('id')+"</a></li>")
   }
 });
 
 $('.cellTitle').click(function() {
  var DictStr = $(this).text()
  var status = $('#Dictmenu').css('display');
  if (status == 'none') {
   var position = $(this).position();
   var scrLeft  = $('#CharTab').scrollLeft();
   $('#Dictmenu').css('position','absolute');
   $('#Dictmenu').css('top',position.top + $(this).outerHeight());
   $('#Dictmenu').css('left',position.left + scrLeft);
   $('#Dictmenu').insertAfter($(this));
   $('#Dictmenu').css('display','block');  
   $('#Dictmenu').menu({
    selected: function(event, ui) {
     $('input:text').each(function(index){
      if ($(this).val() == DictStr) {
       $(this).val('') 
      }
     });
     $('#'+ ui.item.text()).val(DictStr);
    }
   });
  } else {
   $('#Dictmenu').css('display','none');  
  }
 });
 $('.cell').click(function() {
  alert($(this).text());
 });
 
 jQuery.fn.exists = function(){return jQuery(this).length>0;}
 
 if (!$('.cellTitle').exists()) {
  $('#viewChar').attr({ 'src' : '/media/css/img/warn.png' });
  $('#viewChar').attr({ 'title' : 'No Characheristic Table Present. Click to remove the Dataset' });
  $('#viewChar').click(      
  function(){
   $.post('/admin/geo/rmDS/',datasetID);
   $(this).dialog("close");
   location.reload('/admin/geo/');
  });
 } else {
  $('#viewChar').attr({ 'src' : '/media/css/img/table.png' })

  $('#viewChar').hover(
   function (){ 
    $('#viewChar').attr({ 'src' : '/media/css/img/tablehover.png' });
   },
   function (){
    $('#viewChar').attr({ 'src' : '/media/css/img/table.png' });
   }
  );
  $('#viewChar').attr({ 'title' : 'View Characteristics Table' })
  
  $('#viewChar').click(
   function() {
    $('#CharTab').dialog(
    {
     width: 800,
     height:400,
     resizable:true,
     modal:false,
    })
   });
 }

 //handle bkg color change on hover with jquery (FF4 problem) 
 $('.cellTitle').hover(
  function() {
   $(this).css('background-color', '#f0e68c');
  },
  function() {
   $(this).css('background-color', '#eee8aa');
  }
 )
 //ok

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

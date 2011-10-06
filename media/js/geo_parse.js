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

 $('#savedict').button({
  icons: {
   primary: 'ui-icon-disk',
   secondary: 'ui-icon-circle-check'
  }
 });

 $('#savedict').click(function(){
   $(this).fadeIn();
   $('#overlay').width($(document).width());
   $('#overlay').height($(document).height());
   });
 });

 $('#backToList').button({
  icons: {
   primary: 'ui-icon-circle-triangle-w',
  }
 });

 $('#id_treatment ').bind( "keydown", function( event ) {
 if ( event.keyCode === $.ui.keyCode.TAB &&
 $( this ).data( "autocomplete" ).menu.active ) {
  event.preventDefault();
 }}).autocomplete({
  source: function( request, response ) {
   response( $.ui.autocomplete.filter(
   treatments, extractLast( request.term ) ) );
  },
  focus: function() {
  // prevent value inserted on focus
   return false;
  },
  select: function( event, ui ) {
   var terms = split( this.value );
   // remove the current input
   terms.pop();
   // add the selected item
   terms.push( ui.item.value );
   // add placeholder to get the comma-and-space at the end
   terms.push( "" );
   this.value = terms.join( ", " );
   return false;
  }
 });

 $('#id_subtype ').bind( "keydown", function( event ) {
 if ( event.keyCode === $.ui.keyCode.TAB &&
 $( this ).data( "autocomplete" ).menu.active ) {
  event.preventDefault();
 }}).autocomplete({
  source: function( request, response ) {
   response( $.ui.autocomplete.filter(
   subtypes, extractLast( request.term ) ) );
  },
  focus: function() {
  // prevent value inserted on focus
   return false;
  },
  select: function( event, ui ) {
   var terms = split( this.value );
   // remove the current input
   terms.pop();
   // add the selected item
   terms.push( ui.item.value );
   // add placeholder to get the comma-and-space at the end
   terms.push( "" );
   this.value = terms.join( ", " );
   return false;
  }
 });

 $('#id_disease ').bind( "keydown", function( event ) {
 if ( event.keyCode === $.ui.keyCode.TAB &&
 $( this ).data( "autocomplete" ).menu.active ) {
  event.preventDefault();
 }}).autocomplete({
  source: function( request, response ) {
   response( $.ui.autocomplete.filter(
   diseases, extractLast( request.term ) ) );
  },
  focus: function() {
  // prevent value inserted on focus
   return false;
  },
  select: function( event, ui ) {
   var terms = split( this.value );
   // remove the current input
   terms.pop();
   // add the selected item
   terms.push( ui.item.value );
   // add placeholder to get the comma-and-space at the end
   terms.push( "" );
   this.value = terms.join( ", " );
   return false;
  }
 });

 /*
 $('#id_treatment').autocomplete({
  source: treatments
 });
 $('#id_subtype').autocomplete({
  source: subtypes
 });
 
 $('#id_disease').autocomplete({
  source: diseases
 });*/
 
 $('input:text').each(function(index){
   /* $(this).attr('disabled',true); */
   var IDexcluded = ['id_disease','id_subtype','id_treatment','id_incl_criteria','id_notes'];
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
  var clumncount = 0;
  $('#char_table').find('.cellTitle').each(function(){
   clumncount = clumncount + 1;
  });
  $('#char_table').css({'width': 20 + (clumncount*125) });
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

function split( val ) {
 return val.split( /,\s*/ );
}

function extractLast( term ) {
 return split( term ).pop();
}




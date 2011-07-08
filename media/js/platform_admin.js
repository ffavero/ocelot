// Get the CSRF Token and send it whithin the ajax calls
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


function Platforms() {

 //minor style things:
 $('.plt_line').hover(
  function() {
   $(this).addClass('ui-state-active');
  // $(this).find('button').addClass('ui-state-active');
  },
  function() {
   $(this).removeClass('ui-state-active');
  // $(this).find('button').removeClass('ui-state-active');
  });
  
 $('button').hover(  
  function() {
   $(this).addClass('ui-state-focus');
  },
  function() {
   $(this).removeClass('ui-state-focus');
  });
}

function goToPlatform(platform) {
 $('#loading').fadeIn();
 $(window).resize(function () {
  $('#loading').width($(document).width());
  $('#loading').height($(document).height());
 });
 window.location='/admin/chip/table/'+platform+'/';
}

function editPlatform(platform) {
 $('#loading').fadeIn();
 $(window).resize(function () {
  $('#loading').width($(document).width());
  $('#loading').height($(document).height());
 });
 window.location='/admin/chip/edit/'+platform+'/';
}

function PlatformTable(platform_id) {
 
 $('#loading').ajaxStart(function(){
   $(this).fadeIn();
   $(window).resize(function () {
    $(this).width($(document).width());
    $(this).height($(document).height());
   });
 });
 $('#loading').ajaxStop(function(){
      $(this).fadeOut();
 });
 $('#loading').ajaxError(function(){
      $(this).fadeOut();
 });
 $('#backToList').button();
 $('#get_annotation_file').button();
 $('#get_annotation_file').click(function(){
  columns = [];
  $('#id_good_list').find('.span_id_good').each(function(){
   columns.push($(this).attr('title'));
  });
   if (columns.length > 0) {
  $.ajax({
   url:'/admin/chip/save/',
   type: 'post',
   data: {platform_id:platform_id, fields : JSON.stringify(columns)},
   dataType:'html',
   async:true,
   success: function(html) {},
   error: function(){
    alert('Sorry could not send the request');
   },
  });
  } else {
   alert('You have to select at least one column');
  }
 });

 $.ajax({
  url:'/admin/chip/table/',
  type: 'post',
  data: {platform_id:platform_id},
  dataType:'html',
  async:true,
  success: function(html) {
   columncount = 0;
   $(html).find('.cellTitle').each( function() {
    columncount = columncount + 1;
   });
   $(html).appendTo('#platform_table');
   $('#annot_tab').css({'width': 20 + (columncount*105) });
   $('.cellTitle').click(function(){
    spancount = 1;
    $('#id_good_list').find('.span_id_good').each(function() { 
     spancount += 1;
    });
    if (spancount <=2 ) {
     var span = $('<span>').text($(this).text()).attr({
      title:$(this).text()
     }).addClass('ui-corner-all ui-state-active span_id_good');  
     var a = $('<a>').addClass('remove').attr({
      href: 'javascript:',  
      title: 'Remove culumn ' + $(this).text()
     }).text("x").hover(
     function(){
      $(this).css('color', 'red');
     },
     function(){
      $(this).css('color', 'black');
     }
     ).css('margin-left','5px').click(
     function(){
      $(this).parent().remove();
     }).appendTo(span);
     $(span).appendTo('#id_good_list');
    } else {
     alert('Sorry is possible to select a maximum tof wo coumn for now');
    }
   });
  },
  error: function() {
   alert ("Sorry we could not get the clinical data!");
  }
 });
}

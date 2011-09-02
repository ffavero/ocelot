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
 $('#overlay').width($(document).width());
 $('#overlay').height($(document).height());
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
   $('#overlay').width($(document).width());
   $('#overlay').height($(document).height());
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
   url:'/admin/chip/table/',
   type: 'post',
   data: {platform_id:platform_id, list_annot : JSON.stringify(columns)},
   dataType:'html',
   async:true,
   success: function(html) {
    msg = '<div id="succes_message" class="ui-corner-all ui-state-highlight">' +
           '<span class="ui-icon ui-icon-info"></span><p>'+
           html+' </br>You can follow the queue activity <a href="/admin/queue/">here</a>.'+
           '</p></div>';

    $('#platform_table').fadeOut();
    $('#platform_table').empty();
    $('#platform_table').append(msg);
    $('#platform_table').fadeIn();
    $('#get_annotation_file').remove();
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
     $('#id_good_list').find('.span_id_good').each(function() { 
      $(this).addClass('ui-state-highlight');
      return false;
     });
    }).appendTo(span);
    $(span).appendTo('#id_good_list');
    $('#id_good_list').find('.span_id_good').each(function() { 
     $(this).addClass('ui-state-highlight');
     return false;
    });
   });
  },
  error: function() {
   alert ("Sorry we could not get the annotation data, probably the donnection is too slow, so the connection timed out while processing");
  }
 });
}

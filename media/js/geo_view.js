
function view() {
 $('#choose_plat').menu({
    selected: function(event, ui) {
     //remove the style of previously selected item, if any.
     ui.item.parents().find('li').each(function(){
      $(this).removeClass('ui-state-active ui-corner-all');
     });
     // set a different style to the selected item
     ui.item.addClass('ui-state-active ui-corner-all');
     // do something
     loadAnnotation(ui.item.text(),ui.item.find('a').attr('title'))
    }
   });
  // If there is only one platform set it automatically:
  var platformNumber = $('#choose_plat > li').size();
  if (platformNumber ==1 ){
   $('#choose_plat').find('li').addClass('ui-state-active ui-corner-all');
   loadAnnotation($('#choose_plat').find('li').text(),$('#choose_plat').find('a').attr('title') );
  }
}

function loadAnnotation(gpl,longname) {
 // load annotation file and then set it
 // to be used in the autocomplete
 $('#selected_chip').html('<b>Using platform:</b></br>'+longname);
 $('#choose_gene').autocomplete();
}

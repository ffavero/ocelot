
function view(dataset) {
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


 //asyc call the xml to populate the Dictionary table:
 dictTags = [];
 $('#dictTable').find('.cellTitle').each( function() {
   if ($(this).text()!='GSM') {
    dictTags.push($(this).attr('title'));
   }
  }
 );
 // style the hover action on the table button
 // and give him a proper onClick function
 $('#viewDict').hover(
  function() {
   $(this).attr({'src':'/media/css/img/tablehover.png'});
  },
  function() {
   $(this).attr({'src':'/media/css/img/table.png'});   
  } 
 );
 $('#viewDict').click(
  function() {
    $('#dictTable').dialog(
  {
   title: 'Clinical data for '+dataset,
   width: 800,
   height:400,
   resizable:true,
   modal:false,
   buttons: {
    Close: function() {
         $( this ).dialog( 'close' );
      },
   'Downlad as CSV': function() {
     var tmpCsv = '';
     $('#dictTable').find('.tab_row').each(function(){
      $(this).find('div').each(function(){
       tmpthis = $(this).text();
       tmpCsv += tmpthis.replace(/\n/g,'')+'\t';
      });
      tmpCsv += '\n'
     });
     $('#csv_download').val(tmpCsv);
     $('#file_name').val(dataset+'_data_table');
     $('#csv_form').submit();
    }
   }
  })
 });
 $.ajax({
  url:'/geo/'+dataset+'/xml/',
  type: 'get',
  dataType:'xml',
  async:true,
  success: function(xml) {
   dictDivTable = geodicttab(xml,dictTags);
   //$('#dictTable').append(dictDivTable);
   $('#dict_table').append(dictDivTable);
  },
  error: function() {
   alert ("Sorry we could not get the clinical data!");
  }
 }); 
}

function loadAnnotation(gpl,longname) {
 // load annotation file and then set it
 // to be used in the autocomplete
 $('#selected_chip').html('<b>Using platform:</b></br>'+longname);
 $('#choose_gene').autocomplete();
}


function geodicttab(xml,dicttags) {
  dictTable = '';
 // We can parse the xml and start to populate the file 
 // with know tags from the Dictionary. Also while we parse 
 // the file we add the number of samples for platform
 $(xml).find('Sample').each(function(){
  var plat_ref = $(this).find('Platform-Ref').attr('ref');
  $('#samples_'+plat_ref).text(parseInt($('#samples_'+plat_ref).text())+1);
  dictTable += "<div class='tab_row'>";
   dictTable += "<div class='cell'>" + $(this).attr('iid')+ "</div>";
   var tmptext = [];
   var tmpattr = [];
   $(this).find('Characteristics').each(function(){
    tmptext.push($(this).text());
    tmpattr.push($(this).attr('tag'));
   });
   $(dicttags).each(function(x) {
    idx = jQuery.inArray(dicttags[x], tmpattr);
    if (idx >= 0 ) {
     dictTable += "<div class='cell' title='" + tmptext[idx] + "'>" + tmptext[idx] + "</div>";
    } else {
     dictTable += "<div class='cell'></div>";
    }
   });
  dictTable += "</div>";
 });  
 dictTable += "</div>";
 return dictTable;
}



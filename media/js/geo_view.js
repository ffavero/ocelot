
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
 // and give it a proper onClick function
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
    $('#dictTable').dialog({
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
 // Ok now call the xml
 $.ajax({
  url:'/geo/'+dataset+'/xml/',
  type: 'get',
  dataType:'xml',
  async:true,
  success: function(xml) {
   dictDivTable = geodicttab(xml,dictTags);
   $('#dict_table').append(dictDivTable);
  },
  error: function() {
   alert ("Sorry we could not get the clinical data!");
  }
 });
 // set the style for the do_analysis button, disabled by default
 $('#do_analysis').button({
  icons: {
   secondary: "ui-icon-triangle-1-e"
  },
  text: true,
  disabled: true,
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

function dictTabtoJSON (table,fields) {
// Collect all the select field from the table
// and put it in a dictionary-like object

 results = new Object();
 paths = [];
 $('#'+table).find('.cellTitle').each( function(){
  paths.push($(this).text());
 });
 $('#'+table).find('.tab_row').each(function(){
  vat = sampleID = '';
  $(this).find('.cell').each(function(index){
      if (index == 0) {
       sampleID = $(this).text();
       results[sampleID] = new Object();
      } else {
       if ($.inArray(paths[index], fields) >= 0) {
        // Clean a bit the text from spaces tabs...
        tmptxt = $(this).text().replace(/\n/g,'');
        tmptxt = tmptxt.replace(/\s/g,'');
        tmptxt = tmptxt.replace(/\t/g,'');
        results[sampleID][paths[index]] = new Object();
        results[sampleID][paths[index]] = tmptxt;
       }
      }  
  });
 });
// Return the Object in JSON, ready to be sended
// to the server.
 return JSON.stringify(results);
}


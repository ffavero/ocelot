function index() {
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

 var atucompTxt = new Array;
 $(xmlindex).find('object').each(function(index) {
  $(this).find('field').each(function(index) { 
   commaSplit = $(this).text().split(',');
   for (j = 0; j < commaSplit.length; j++) {   
    atucompTxt.push(commaSplit[j].replace(/^\s/,''));
   }
  });
 });
 atucompTxt = _.uniq(atucompTxt);
 $('#tabFilter').autocomplete({
  source: atucompTxt,
  minLength : 3
 });
 $('#addFilter').button({
  icons: {
   secondary: "ui-icon-triangle-1-e"
  },
  text: true
 });
 applyFilter(xmlindex);
 $('#downloadTable').attr({ 'src' : '/media/css/img/csv.png' });
 $('#downloadTable').hover(
  function (){ 
   $('#downloadTable').attr({ 'src' : '/media/css/img/csv_hover.png' });
  },
  function (){
   $('#downloadTable').attr({ 'src' : '/media/css/img/csv.png' });
  }
 );
 $('#downloadTable').attr({ 'title' : 'Downlad the table \nin CSV format' });
 $('#downloadTable').click(
  function() {
   $('#csv_download').val(xml2File(xmlINmemory));
   $('#file_name').val('ocelot_index');
   $('#csv_form').submit();
  }
 );
}

function getXml() {
 var res = [];
 $.ajax({
  url: window.location + 'api/index/',
  type: 'get',
  dataType:'xml',
  async:false,
  success: function(xml) {
   res = xml;
  }
 });
 return(res);
}

function xmlFiler(xml,filt) {
 var tmp = new(Array);
 // collect of the object matching the filter 
 $(xml).find('object').each(function(index) {
  for (i = 0; i < filt.length; i++) {
   var matchArr = ($(this).contents().text());
   if (matchArr.indexOf(filt[i]) > -1 ) {
    // Index of element to keep
    tmp.push(index);
   }
  }
 });
 //remove the redundant indexes
 tmp = _.unique(tmp);
 if (tmp.length != 0) {
  var goodXmlEl = new Array(tmp.length);
  for (i = 0; i <= (tmp.length -1); i++) {
   // Clone the object that have passed the filter 
   goodXmlEl[i] = $(xml).find('object').eq(tmp[i]).clone();
  };
  // Start a new barebone XML
  newXML = $.parseXML( '<django-objects></django-objects>');
  for (i = 0; i <= (goodXmlEl.length-1); i++) {
  // repopulate the xml
   $(newXML).find('django-objects').append(goodXmlEl[i]);
  }
  return(newXML);
 } else {
  return(xml);
 }
};

function applyFilter(xml) {
 var filt = new Array();
 $('#filterContainer').find('span').each(function(index) {
  var conts = $(this).text().replace(/x$/,'');
  filt.push(conts);
 });
 xml = xmlFiler(xml,filt);
 //update the temporary changable xml in memory
 xmlINmemory = xml;
 var XMLArr =  xml2div(xml);
 //remove the old table
 $('#idxTable').find('.tabRow').remove();
 //append the new one
 $(XMLArr).appendTo('#idxTable');

 //apply attributes to the table
 $('.link2Geo').hover(
  function() {
   $(this).attr({'src':'/media/css/img/geo_logo_small_hover.png'});
  },
  function() {
   $(this).attr({'src':'/media/css/img/geo_logo_small.png'});   
  } 
 );

 $('.tabRow').hover(
  function() {
   $('.charTrigger', this).css("display","inline");
  },
  function() {
   $('.charTrigger', this).css("display","none");
  }  
 );

 $('.charTrigger').hover(
  function() {
   $(this).attr({'src':'/media/css/img/tablehover.png'});
  },
  function() {
   $(this).attr({'src':'/media/css/img/table.png'});   
  } 
 );
 $('.charTrigger').click(
  function() {
   $('.charTrigger').attr({'disabled':'true'});
   $(this).attr({'src':'/media/css/img/loading.gif'});
   $('.tabRow').unbind('mouseenter mouseleave');
   geoCharTable($(this).val());
  } 
 );
};

function add2Filter() {
 var textFilt = $('#tabFilter').val();
 var span = $('<span>').text(textFilt).addClass('ui-corner-all spanFilt');  
 var a = $('<a>').addClass('remove').attr({
  href: 'javascript:',  
  title: 'Remove filter' + textFilt
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
   //refresh the tab
   applyFilter(xmlindex);
  }).trigger('FiltIsChanged').appendTo(span);  
 span.appendTo('#filterContainer');
 //clean the input
 $('#tabFilter').val('');
 //refresh the tab
 applyFilter(xmlindex);
};

function xml2div(xml) {
 // Empty array
 var xmlArr = '';
 $(xml).find('object').each(function() {
  // Empty default variables
  var alias     = '';
  var dataset   = '';
  var disease   = '';
  var survTot   = '';
  var response  = '';
  var survRec   = '';
  var saved     = '';
  var released  = '';
  var plugin    = '';
  var samples   = '';
  var subtype   = '';
  var treatment = '';
  // Starting the raw   
  xmlArr += "<div class='tabRow'>";

  $(this).find('field').each(function(){
   // save all the field values we have 
   if ($(this).attr('name') == 'alias_gds'){alias = $(this).text()};
   if ($(this).attr('name') == 'dataset_id'){dataset = $(this).text()};
   if ($(this).attr('name') == 'disease'){disease = $(this).text()};
   if ($(this).attr('name') == 'have_surv_tot'){survTot = $(this).text()};
   if ($(this).attr('name') == 'have_response'){response = $(this).text()};
   if ($(this).attr('name') == 'have_surv_rec'){survRec = $(this).text()};
   if ($(this).attr('name') == 'saved'){saved = $(this).text()};
   if ($(this).attr('name') == 'released'){released = $(this).text()};
   if ($(this).attr('name') == 'plugin'){plugin = $(this).text()};
   if ($(this).attr('name') == 'samples_count'){samples = $(this).text()};
   if ($(this).attr('name') == 'subtype'){subtype = $(this).text()};
   if ($(this).attr('name') == 'treatment'){treatment = $(this).text()};
  });
  // Alias
  xmlArr += "<div class='tabCell alias'>";
  xmlArr += alias;
  //end of the cell 
  xmlArr += '</div>';
  // Dataset
  xmlArr += "<div class='tabCell dataset'>";
  xmlArr += "<a href='/"+ plugin + "/" + dataset + "' title='Look details for " + dataset + "' >" + dataset + "</a>";
  //xmlArr += dataset;
  //end of the cell 
  xmlArr += '</div>';

  // Saved time
  saved = saved.replace(/-/g,',');
  saved = saved.replace(/\s/g,',');
  saved = saved.replace(/:/g,',');
  saved = saved.split(',');
  sdate = new Date(saved[0],saved[1],saved[2])
  xmlArr += "<div class='tabCell saved'>";
  xmlArr += sdate.getDate()+'/'+sdate.getMonth()+'/'+sdate.getFullYear();
  //end of the cell 
  xmlArr += '</div>';
  // Release time
  released = released.replace(/-/g,',');
  released = released.replace(/\s/g,',');
  released = released.replace(/:/g,',');
  released = released.split(',');
  rdate = new Date(released[0],released[1],released[2]);
  xmlArr += "<div class='tabCell released'>";
  xmlArr += rdate.getDate()+'/'+rdate.getMonth()+'/'+rdate.getFullYear();
  //end of the cell 
  xmlArr += '</div>';
    
  // Plugin
  xmlArr += "<div class='tabCell plugin'>";
  
  if (plugin == 'geo') {
   xmlArr += "<a href='http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc="+ dataset + "' target='_blank' title='Go to the dataset original page'><img class='link2Geo' src='/media/css/img/geo_logo_small.png' /></a>";
  } else {
   xmlArr += plugin;
  }
  //end of the cell 
  xmlArr += '</div>';
  
  // Samples
  xmlArr += "<div class='tabCell samples'>";
  xmlArr += samples;
  //end of the cell 
  xmlArr += '</div>';
  
  // Separator Space
  xmlArr += "<div class='tabCellSeparator'></div>"; 

  // Disease

  diseasetitle = disease.replace(/,/g,'\n');
  xmlArr += "<div class='tabCell disease' title='" + diseasetitle + "'>";
  xmlArr += disease;
  //end of the cell
  xmlArr += '</div>';

  // Response
  xmlArr += "<div class='tabCell response'>";
  if (response =='True') {
   xmlArr += "<img src='/media/css/img/OK.png' />";
  } else {
   xmlArr += "<img src='/media/css/img/NO.png' />";
  };
  //end of the cell 
  xmlArr += '</div>';
  // Survival  double cell
  xmlArr += "<div class='tabCell survival' title='Overall Survival'>";
  // Survival Total
  xmlArr += "<div class='subCell suvivalTot'>";
  if (survTot =='True') {
   xmlArr += "<img src='/media/css/img/OK.png' />";
  } else {
   xmlArr += "<img src='/media/css/img/NO.png' />";
  };
  //end of the subcell 
  xmlArr += '</div>';  
  // Survival Recurrence
  xmlArr += "<div class='subCell survivalRec' title='Recurrence Survival'>";
  if (survRec =='True') {
   xmlArr += "<img src='/media/css/img/OK.png' />";
  } else {
   xmlArr += "<img src='/media/css/img/NO.png' />";
  };
  //end of the subcell 
  xmlArr += '</div>';
  //end of the cell 
  xmlArr += '</div>';  
  
  // subtype
  subtypeTitle = subtype.replace(/,/g,'\n');  
  xmlArr += "<div class='tabCell subtype' title='" + subtypeTitle + "'>";
  xmlArr += subtype;
  //end of the cell 
  xmlArr += '</div>';
  // treatment
  treatmentTitle = treatment.replace(/,/g,'\n');  
  xmlArr += "<div class='tabCell treatment' title='"+ treatmentTitle +"'>";
  xmlArr += treatment;
  //end of the cell 
  xmlArr += '</div>';

  //last cell with Char table option
  xmlArr += "<div class='tabCellChar'><input type='image' class='charTrigger' src='/media/css/img/table.png'/ title='Display Char table for dataset "+ dataset +"' value='"+ dataset +"'/></div>";
  
  //end of the row 
  xmlArr += '</div>';
 });
 return(xmlArr);
}

function xml2File (xml) {
 // First line with cell names taken 
 // from the first xml object
  var xmlToStr = '';
  $(xml).find('object').eq(0).each(function() {
   //A Line
   $(this).find('field').each(function(){
    //Cells field
    xmlToStr += $(this).attr('name')+'\t';
   });
   xmlToStr += '\n';
  });
 // Now all the other lines 
  $(xml).find('object').each(function() {
   //A Line
   $(this).find('field').each(function(){
    //Cells field
    xmlToStr += $(this).text()+'\t';
   });
   xmlToStr += '\n';
  });
 return(xmlToStr);
}

function geoCharTable(dataset) {
 var res = [];
 $.ajax({
  url:'/geo/'+dataset+'/xml/',
  type: 'get',
  dataType:'xml',
  async:true,
  success: function(xml) {
   geoCharTableShowUp(xml,dataset);
  },
  error: function() {
   alert ("Sorry we could not get the file!");
  }
 });

/* 
 // Have to solve the CORS issues
 // For the moment we will use the page 
 // retrived and provided by the sarver side
 $.ajax({
  url:'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='+dataset+'&form=xml&view=brief&targ=gsm',
  type: 'get',
  dataType:'xml',
  async:false,
  success: function(xml) {
   res = xml;
  }
 });*/
}

function geoCharTableShowUp(xml,ds) {
 attachTable(xml,'char_table','CharTab');
 columncount = 0;
 $('#char_table').find('.cellTitle').each(function(){
  columncount = columncount + 1;
 });
 $('#char_table').css({'width': 20 + (columncount*125) })
 //refresh the main table to reset to default the icons
 applyFilter(xmlindex);
 $('#CharTab').dialog(
  {
   title: 'Characteristics table of '+ds,
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
     $('#char_table').find('.tab_row').each(function(){
      $(this).find('div').each(function(){
       tmpthis = $(this).text();
       tmpCsv += tmpthis.replace(/\n/g,'')+'\t';
      });
      tmpCsv += '\n'
     });
     $('#csv_download').val(tmpCsv);
     $('#file_name').val(ds+'_char_table');
     $('#csv_form').submit();
    }
   }
 });
}



function geochartab(xml) {
 //Going over the XML once to retrive the possible tags
 var charheader = ['GSM'];
 $(xml).find('Characteristics').each(function(){
   charheader.push($(this).attr('tag'));
 });
 //remove all the duplicate in order to have unique headers identifiers
 charheader = _.uniq(charheader)
 //Start create the div table
 charTable = "<div id='char_table'>";
 charTable += "<div class='tab_row'>";
 $(charheader).each(function(x) {
  charTable += "<div class='cellTitle' title='" + charheader[x] + "'>" + charheader[x] + "</div>";
 });
 charTable += "</div>";
 //Done table header
 //We can parse again the xml and start to populate the table

 $(xml).find('Sample').each(function(){
  charTable += "<div class='tab_row'>";
   charTable += "<div class='cell'>" + $(this).attr('iid')+ "</div>";
   var tmptext = [];
   var tmpattr = []; 
   $(this).find('Characteristics').each(function(){
    tmptext.push($(this).text());
    tmpattr.push($(this).attr('tag'));
   });
   $(charheader).each(function(x) {
    if (charheader[x] != 'GSM') {
      idx = jQuery.inArray(charheader[x], tmpattr);
     if (idx >= 0 ) {
      charTable += "<div class='cell' title='" + tmptext[idx] + "'>" + tmptext[idx] + "</div>";
     } else {
      charTable += "<div class='cell'></div>";
     }
    }
   });
  charTable += "</div>";
 });  
 charTable += "</div>";
 return charTable;
}

function attachTable(xml,id,to) { 
 jQuery.fn.exists = function(){return jQuery(this).length>0;};
 if ($('#'+id).exists()) { 
  $('#'+id).remove();
 }
 xml = geochartab(xml);
 $('#'+to).append(xml);
}

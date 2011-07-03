function view(dataset) {
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

 // Bind an event when select 
 // an item from the menu
 $('#annot_column').change(function() {
  annotAutocomplete(jsonAnnot,$(this).val())
 });
 $('#choose_plat').menu({
    selected: function(event, ui) {
     //remove the style of previously selected item, if any.
     ui.item.parents().find('li').each(function(){
      $(this).removeClass('ui-state-active ui-corner-all');
     });
     // set a different style to the selected item
     ui.item.addClass('ui-state-active ui-corner-all');
     // do something
     selPlatform = ui.item.clone();
     $(selPlatform).find('div').remove();
     loadAnnotation($(selPlatform).text().replace(/\s/g,''),ui.item.find('a').attr('title'));
    }
   });
  // If there is only one platform set it automatically:
  var platformNumber = $('#choose_plat > li').size();
  if (platformNumber ==1 ) {
   $('#choose_plat').find('li').addClass('ui-state-active ui-corner-all');
   selPlatform = $('#choose_plat').find('.ui-state-active').clone();
   $(selPlatform).find('div').remove();
   doAfter(300, function () {
   loadAnnotation($(selPlatform).text().replace(/\s/g,''),$('#choose_plat').find('a').attr('title'));
   });
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
 }); 
 // disabled: true,

 $('#do_analysis').click(function() {
  doItbutton(dataset);
 });
}

function loadAnnotation(acc,longname) {
 // load annotation file and then set it
 // to be used in the autocomplete
 $.ajax({
  url:'/annotation/',
  type: 'post',
  data: {gpl : acc},
  dataType:'json',
  async:true,
  success: function(json) {
   //set the annotation in the page
   jsonAnnot = json;
   // Empty the existing options
   // in the menu
   $('#annot_column').empty();
   // take the first node and
   // collect the keys to put 
   // in the annotation menu
   $.each(json, function(item,values){
    $.each(values, function(key,value) {
     $('#annot_column').append($("<option></option>").
          attr("value",key).
          text(key));
    });
    return false 
   });
   // Set the default value for the 
   // annotation to pick
   $('#annot_column').val('Gene symbol');
   annotAutocomplete(json,$('#annot_column').val());
  },
  error: function() {
   $('#annot_column').empty();
   alert ("Sorry, we could not load this annotation");
  }
 });
 $('#selected_chip').html('<b>Using platform:</b></br>'+longname);
}

function annotAutocomplete(json,annot) {
 // Traversing the JSON file
 autocompleteAnnot = [];
 jsonTMP  = new Object();
 $.each(json, function(item,values) {
  $.each(values, function(key,value){
   if (key == annot) {
    if (jsonTMP[value]) {
     jsonTMP[value].push(item);
    } else {
     jsonTMP[value] = [];
     jsonTMP[value].push(item);
    } 
    autocompleteAnnot.push(value);
   }
  })
 });
 level = 3;
 var re=/Platform/g;
 if (annot.match(re)) {
  level = 9;
 };
 autocompleteAnnot = _.unique(autocompleteAnnot);
 $('#gene_id').autocomplete({
  minLength: level,
  source : autocompleteAnnot,
  select: function(event, ui){
   alert(jsonTMP[ui.item.value])
  },
 });
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

function dictTabtoJSON (fields) {
// Collect all the select field from the table
// and put it in a dictionary-like object

 results = new Object();
 paths = [];
 $('#dict_table').find('.cellTitle').each( function(){
  paths.push($(this).text());
 });
 $('#dict_table').find('.tab_row').each(function(){
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

function doItbutton (dataset) {
 // collect the 3 info (filename, probe name and
 // selected clinical data) to pass to theserver

 // ID_REF:
 idRef =  $('#gene_id').val();

 //File name
 var filename='';
 var platformNumber = $('#choose_plat > li').size();
 if (platformNumber ==1 ){
   filename = dataset;
 } else {
   selPlatform = $('#choose_plat').find('.ui-state-active').clone();
   $(selPlatform).find('div').remove();
   filename = dataset+'-'+$(selPlatform).text().replace(/\s/g,'');
 }
 fields = ['surv_tot','event_tot'];
 dataJSON = dictTabtoJSON (fields);
 //Now we can submit the data to the server
 // with an AJAX call (and see the results on the same page):
 $.ajax({
  url:'/microarrpy/',
  data: {
   data_json : dataJSON,
   file_code : filename,
   id_ref : idRef,
   test : 'kmlines',
   format: 'png'
  },
  type: 'post',
  dataType:'html',
  async:true,
  success: function(res) {
   $('#results_viewer').empty();
   $('#results_viewer').append(res);
  },
  error: function() {
   alert ("Sorry we could't analyze the data!");
  }
 });
}


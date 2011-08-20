function view(dataset) {
 jQuery.fn.exists = function(){return jQuery(this).length>0;};
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

 // Bind an event when select 
 // an item from the menu
 $('#annot_column').change(function() {
//  annotAutocomplete(jsonAnnot,$(this).val())
    setAutocomplete(currentAnnot,$(this).val());
 });

 $('#analysis_menu').change(function() {
  // annotAutocomplete(jsonAnnot,$(this).val())
    setAnalysisField($(this).val(),dataset);
 });
 $('#choose_plat').menu({
  selected: function(event, ui) {
   //remove the style of previously selected item, if any.
   ui.item.parents().find('li').each(function(){
    $(this).removeClass('ui-state-active ui-corner-all');
   });
   // set a different style to the selected item
   ui.item.addClass('ui-state-active ui-corner-all');
   // do something else..
   selPlatform = ui.item.clone();
   $(selPlatform).find('div').remove();
   loadAnnotation($(selPlatform).text().replace(/\s/g,''),ui.item.find('a').attr('title'));
  }
 });
 // If there is only one platform set it automatically:
 var platformNumber = $('#choose_plat > li').size();
 if (platformNumber ==1 ){
  $('#choose_plat').find('li').addClass('ui-state-active ui-corner-all');
  selPlatform = $('#choose_plat').find('.ui-state-active').clone();
  $(selPlatform).find('div').remove();
  loadAnnotation($(selPlatform).text().replace(/\s/g,''),$('#choose_plat').find('a').attr('title') );
 }

 // Check which and how many  fields are present 
 // in the  dict_table and set the dialog width and
 // the analysis menu according to it.
 columncount = 0;
 dictTags = [];
 analysisMenu = { surv  :false,
                  resp  :false,
                  groups:true};
 $('#dictTable').find('.cellTitle').each( function() {
  columncount = columncount + 1;
  if ($(this).text()!='GSM') {
   dictTags.push($(this).attr('title'));
   if ($(this).text().substring(0,4) == 'surv'){
    analysisMenu['surv'] = true; 
   };
   if ($(this).text() == 'response'){
    analysisMenu['resp'] = true; 
   };
  }
 });
 $('#dict_table').css({'width': 20 + (columncount*125) });
 

 if (analysisMenu['groups']){
  $('#analysis_menu').append($("<option></option>").
   attr("value",'grouplots').
   text('Compare and analyze groups'));
 };

 if (analysisMenu['surv']){
  $('#analysis_menu').append($("<option></option>").
   attr("value",'kmlines').
   text('Kaplan Meier Survival analysis'));
  $('#analysis_menu').val('kmlines')
 };
 if (analysisMenu['resp']){
  $('#analysis_menu').append($("<option></option>").
   attr("value",'rocbees').
   text('Response/non-response ROC curves and scatterplots'));
  $('#analysis_menu').val('rocbees')
 };
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
   'Downlad as TXT': function() {
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
 // asyc call the xml to populate the Dictionary table:

 customWarn = '<p>' +
               '<span class="ui-icon ui-icon-info"></span>' +
               '<strong>Please Wait</strong> while loading the dataset details <img src="/media/css/img/loading.gif" />' +
              '</p>';
 $('#waiting_warn').html(customWarn);
 $.ajax({
  url:'/geo/'+dataset+'/xml/',
  type: 'get',
  dataType:'xml',
  async:true,
  success: function(xml) {
   dictDivTable    = geodicttab(xml,dictTags);
   selectDivTab    = selectorchartab(xml); 
   $('#group_table').append(selectDivTab);
   $('#dict_table').append(dictDivTable);
   setAnalysisField($('#analysis_menu').val(),dataset);
  },
  error: function() {
   $('#loading').hide();
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

function setAnalysisField(analysis,dataset){
  $('#analysis_snippet').remove(); 
  if (analysis == 'kmlines'){
   kmlineActions(dataset);
  }
  if (analysis == 'rocbees'){
   ROCbeeswarm(dataset);
  }
  if (analysis == 'grouplots'){
   GroupsAnalysis(dataset);
  }
  $('#analysis_snippet').fadeIn('slow');

}

function kmlineActions(dataset) {
 prepareAnalysis = function()  {}
 kmlineSnippet ='<div id="analysis_snippet"> ' +
                 '<div id="kmlines"> ' +
                  '<div id="field_selector">'+
                  ' <button id="kmlines_tot"></button>' +
                  ' <button id="kmlines_rec"></button> '+
                  '</div>'+
                  '<div id="show_opts" class="ui-corner-all ui-widget-content"><b>Options</b>' +
                  ' <span id="add_options" '+
                  '  class="ui-icon ui-icon-circle-plus">'+
                  ' </span>'+
                  ' <div id="kmlines_opts">'+
                  '  <div class="ui-corner-all ui-widget-content kmlines_opt">'+
                  '   <div id="group_cutoff" class="kmlines_opt_title">Groups cutoff</div>'+
                  '   <div id="slider_val">0.5</div>'+
                  '   <div id="prop_slider"></div>'+
                  '  </div>'+
                  ' </div>'+
                  '</div>'+
                 '</div><!--kmlines-->'+
                '</div><!--analysis_snippet-->'
 // Append the kmlines snippet (silently) 
 // in the right place and enable the functionality... 
 paths = [];
 $('#dict_table').find('.cellTitle').each( function(){
  paths.push($(this).text());
 });
 $(kmlineSnippet).appendTo('#choose_analysis').hide();
 $('#kmlines_tot').button({
  label: "Overall Survival"
 });
 $('#kmlines_rec').button({
  label: "Rec. free Surv."
 });
 fields = ['surv_tot','event_tot'];
 // hmm.. the active class have problem
 // when hover on the button... so the error
 // class suits better, even if it might be
 // confusing.. __it's not an error, just for the
 // style__
 $('#kmlines_tot').addClass('ui-state-error'); 
 if ($.inArray('surv_rec',paths) < 0){
  $('#kmlines_rec').button("disable")
 }
 if ($.inArray('surv_tot',paths) < 0){
  fields = ['surv_rec','event_rec'];
  $('#kmlines_tot').button("disable");
  $('#kmlines_rec').addClass('ui-state-error');
 }
 $('#kmlines_rec').click(function() {
   fields = ['surv_rec','event_rec'];
   $('#kmlines_tot').removeClass('ui-state-error');
   $('#kmlines_rec').addClass('ui-state-error');
 });
 $('#kmlines_tot').click(function() {
  fields = ['surv_tot','event_tot'];
  $('#kmlines_rec').removeClass('ui-state-error');
  $('#kmlines_tot').addClass('ui-state-error');
 });
 $('#add_options').click(function(){
  $(this).toggleClass('ui-icon-circle-minus')
  $('#kmlines_opts').slideToggle("fast");
 });
 $('#prop_slider').slider({
  min:0,
  max:1,
  step:0.01,
  value:0.5,
  slide: function( event, ui ) {
   $( '#slider_val' ).text( ui.value );
  }   
 });

 $('#do_analysis').click(function() {
  idRef =  $('#selected_id').text().replace(/\n/g,'');
  idRef =  idRef.replace(/\"/g,'');
  idRef =  idRef.replace(/ /g,'');
  title = '';
  if (fields[0].substring(5)=='tot') {
   title = 'Overall';
  } else {
   title = 'Recurrence free';
  }
  title += ' survival: '+dataset +' probe: ';
  title += $('#selected_id').text();
  doItbutton(dataset,idRef,"kmlines",fields,title,$('#slider_val').text(),fields[0].substring(5));
 });
}

function ROCbeeswarm(dataset) {
 //redefine the prepareAnalysis function to
 //populate the analysis menu once a gene/probe
 // have been selected
 prepareAnalysis = function()  {
  indexResponse = '';
  $('#dict_table').find('.cellTitle').each( function(index){
   if ($(this).text() == 'response') {
    indexResponse = index
   };
  });
  responseCategories = [];
  $('#dict_table').find('.tab_row').each(function(index){
   $(this).find('.cell').each(function(index){
    if (index == indexResponse) {
     respText = $(this).text();
     respText = respText.replace(/\n/g,'').replace(/^\s+/g, "").replace(/\s+$/g, "");
     responseCategories.push(respText);
    }
   });
  });
  responseCategories = _.unique(responseCategories);
  $('#roc_info').find('option').remove();
  if (responseCategories.length > 1 ) {
   $(responseCategories).each(function(index){
    $('#roc_info').append($("<option></option>").
           attr("value",responseCategories[index]).
           text(responseCategories[index]));   
   });
  } else {
   $('#roc_info').append($("<option></option>").
           attr("value",'No Categories').
           text('Select a probe first'));   
  }
 }

 ROCbeesSnippet ='<div id="analysis_snippet"> ' +
                  '<div id="ROCbees"> ' +
                   '<div id="field_selector">'+
                   '</div>'+
                   '<div id="show_opts" class="ui-corner-all ui-widget-content"><b>ROC curves</b>' +
                   ' <div id="ROC_infos">Chose a response category:'+
                   '  <select id="roc_info" class="ui-widget-content ui-corner-all">' +
                   '  </select>' +
                   '  </div>'+
                   ' </div>'+
                   '</div>'+
                  '</div><!--ROCbees-->'+
                 '</div><!--analysis_snippet-->'
 // Append the kmlines snippet (silently) 
 // in the right place and enable the functionality... 
 fields = ['response'];
 $(ROCbeesSnippet).appendTo('#choose_analysis').hide();
 prepareAnalysis();
 $('#do_analysis').click(function() {
  idRef =  $('#selected_id').text().replace(/\n/g,'');
  idRef =  idRef.replace(/\"/g,'');
  idRef =  idRef.replace(/ /g,'');
  choiceResp = $('#roc_info').val();
  title  = ' Response: '+dataset +' for category '+choiceResp+'; probe: ';
  title += $('#selected_id').text();
  toggleResp = choiceResp.replace(/\s/g,'');
  doItbutton(dataset,idRef,"rocbees",fields,title,choiceResp,toggleResp);
 });
}


function GroupsAnalysis(dataset) {
 //redefine the prepareAnalysis function to
 //populate the analysis menu once a gene/probe
 // have been selected
 prepareAnalysis = function()  {
   //just take the first column after GSM (to not leave it blank)
   groupText = $('#group_table').find('.cellTitle').eq(1).text();
   handleGroupdata(groupText);
 }

 GroupingSnippet ='<div id="analysis_snippet"> ' +
                   '<div id="Grouping">' +
                    '<div id="field_selector">'+
                    '<input type="image" id="sel_group" src="/media/css/img/table.png" title="Select the column containing the groups to split the experiments"/>' +
                    '</div>' +
                    '<div id="show_opts" class="ui-corner-all ui-widget-content">' +
                    '</div>' +
                   '</div><!--Grouping-->' +
                  '</div><!--analysis_snippet-->'
 // Append the kmlines snippet (silently) 
 // in the right place and enable the functionality... 
 $(GroupingSnippet).appendTo('#choose_analysis').hide();
 $('#sel_group').hover(
  function() {
   $(this).attr({'src':'/media/css/img/tablehover.png'});
  },
  function() {
   $(this).attr({'src':'/media/css/img/table.png'});   
  } 
 );
 prepareAnalysis();

 $('#sel_group').click(function(){
  clumnClass = '';
  chosenCol  = '';
  groupText  = '';
  $('.selectColumn').hover(
   function(){
    // find the column class
    classes = $(this).attr('class');
    classes = classes.split(' ');
    $(classes).each(function(x) {
     if (classes[x].indexOf('col') === 0) {
      clumnClass = classes[x];
     }
    });
    $('.'+clumnClass).addClass('ui-state-hover');
    },
   function(){
    $('.'+clumnClass).removeClass('ui-state-hover');
   }
  );
  $('.selectColumn').click(function(x) {
   if (chosenCol != '') {
    $('.'+chosenCol).removeClass('ui-state-active');
   }
   groupText = $(this).text();
   classes   = $(this).attr('class');
   classes   = classes.split(' ');
   $(classes).each(function(x) {
    if (classes[x].indexOf('col') === 0) {
     chosenCol = classes[x];
    }
   });
   $('.'+chosenCol).addClass('ui-state-active');
  });
  columncount = 0;
  $('#group_table').find('.cellTitle').each(function(){
   columncount = columncount + 1;
  });
  $('#group_table').css({'width': 20 + (columncount*125) })
  $('#selctorTable').dialog({
   title: 'Select the column to grab the groups from',
   width: 800,
   height:400,
   resizable:true,
   modal:false,
   buttons: {
    Close: function() {
     $( this ).dialog( 'close' );
    },
    'Grab the selected column'   : function() {
     if (groupText != '') {
      handleGroupdata(groupText);
     } else {
      alert ('No culumn selected, please select a clumn first');
     }
    }
   }
  });
 });

 $('#do_analysis').click(function() {

 });
}

function loadAnnotation(gpl,longname) {
 // load annotation file and then set it
 // to be used in the autocomplete
 autocompletearr = [];
 if (currentAnnot != gpl) {
 customWarn = '<p>' +
               '<span class="ui-icon ui-icon-info"></span>' +
               '<strong>Please Wait</strong> while loading the platform annotation<img src="/media/css/img/loading.gif" />' +
              '</p>';
 $('#waiting_warn').html(customWarn);
  $.ajax({
   url:'/annotation/',
   type: 'post',
   data: {gpl : gpl},
   dataType:'json',
   async:true,
   success: function(json) {
    //set the annotation in the page
    currentAnnot = gpl;
    // Empty the existing options
    // in the menu
    $('#annot_column').empty();
    // take the first node and
    // collect the keys to put 
    // in the annotation menu
    $.each(json['indexes'], function(item,values){
     $('#annot_column').append($("<option></option>").
      attr("value",values).text(item));
    });
    // Set the default value for the 
    // annotation to pick
   $('#annot_column').val(json['default']);
   // Call the function to set the autocomplete
   setAutocomplete(gpl,$('#annot_column').val());
   },
   error: function() {
    $('#loading').hide();
    // Empty the existing options
    $('#annot_column').empty();
    alert ("Sorry, we could not load this annotation");
   }
  });
 }
 $('#selected_chip').html('<b>Using platform:</b></br>'+longname);
}

function setAutocomplete(gpl,annot){
 customWarn = '<p>' +
               '<span class="ui-icon ui-icon-info"></span>' +
               '<strong>Please Wait</strong> while loading the selected annotation details<img src="/media/css/img/loading.gif" />' +
              '</p>';
 $('#waiting_warn').html(customWarn);
  $.ajax({
   url:'/annotation/',
   type: 'post',
   data: {gpl : gpl,purpose: annot},
   dataType:'json',
   async:true,
   success: function(json) {
    $('#gene_id').autocomplete({
     source: json['index'],
     minLength:3,
     select: function(event, ui){
      $('#selected_warning').remove();
      $('#results_viewer').fadeOut('slow');
      $('#results_viewer').empty();
      //$('#results_viewer').find('img').remove();
      $('#unique_probe_menu').remove();
      $('#selected_probe').remove();
      listFromJson = json['turnd'][ui.item.value];  
      // Check if the chosen ID have multiple 
      // identifiers or it is unique.
      if (listFromJson.length > 1) {
       uniqueGeneMenu(json['annot'],listFromJson);
      } else {
       $('#gene_id').val('');
       selectedID = listFromJson[0];  
       text = JSON.stringify(json['annot'][selectedID]);
       text = text.replace(/\{/g,' ');
       text = text.replace(/\}/g,' ');
       text = text.replace(/\"/g,'');
       text = text.replace(/\n/g,'');
       text = text.replace(/:/g,'=>');
       selectedProbe = '<div id="selected_probe" class="ui-corner-all ui-state-highlight"><span class="ui-icon ui-icon-info"></span>Selected gene is: <div id="selected_id">'+selectedID+'</div> ( '+text+' )</div>';
       $(selectedProbe).appendTo('#unique_probe');
       $('#do_analysis').button('enable');
       prepareAnalysis();
      }
      ui.item.value = '';
     },
     change: function(event, ui) {
      if ($('#selected_probe').exists() || $('#unique_probe_menu').exists()) {
      // Do nothing
      } else {
       $('#selected_warning').remove();
       selectWarn = '<div id="selected_warning" class="ui-corner-all ui-state-error"><span class="ui-icon ui-icon-alert"></span><strong>Warning</strong> You have to select a probe/gene in order to proceed</div>';
       $(selectWarn).appendTo('#unique_probe');
      }
     },
    })
   },
   error: function() {
    $('#loading').hide();
    // Empty the existing options
    $('#annot_column').empty();
    alert ("Sorry, we could not load this annotation");
   }
  });
}


function annotAutocomplete(json,annot) {
 // This function were used "before" when the wole
 // annotation file were provided, so the parsing 
 // and reversing the annotation file was left to 
 // compute from the browser. Good for new cpu, but
 // slow in others, so now we provide pre-parsed 
 // json files, and we work on ajax requests instead
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
   $('#selected_warning').remove();
   $('#unique_probe_menu').remove();
   $('#selected_probe').remove();
   listFromJson = jsonTMP[ui.item.value];   
   // Check if the chosen ID have multiple 
   // identifiers or it is unique.
   if (listFromJson.length > 1) {
    uniqueGeneMenu(json,listFromJson);
   } else {
    $('#gene_id').val('');
    selectedID = listFromJson[0];  
    text = JSON.stringify(json[selectedID]);
    text = text.replace(/\{/g,' ');
    text = text.replace(/\}/g,' ');
    text = text.replace(/\"/g,'');
    text = text.replace(/\n/g,'');
    text = text.replace(/:/g,'=>');
    selectedProbe = '<div id="selected_probe" class="ui-corner-all ui-state-highlight"><span class="ui-icon ui-icon-info"></span>Selected gene is: <div id="selected_id">'+selectedID+'</div> ( '+text+' )</div>';
    $(selectedProbe).appendTo('#unique_probe');
    $('#do_analysis').button('enable');
   }
   ui.item.value = '';
  },
  change: function(event, ui) {
   if ($('#selected_probe').exists() || $('#unique_probe_menu').exists()) {
    // Do nothing
   } else {
    $('#selected_warning').remove();
    selectWarn = '<div id="selected_warning" class="ui-corner-all ui-state-error"><span class="ui-icon ui-icon-alert"></span><strong>Warning</strong> You have to select a probe/gene in order to proceed</div>';
    $(selectWarn).appendTo('#unique_probe');
   }
  },
 });
}

function uniqueGeneMenu(json,list) {
 var itemList = '<div id="unique_probe_menu">';
 $(list).each(function(index){
  lineConts = JSON.stringify(json[list[index]]);
  lineConts = lineConts.replace(/\{/g,' ');
  lineConts = lineConts.replace(/\}/g,' ');
  lineConts = lineConts.replace(/\"/g,'');
  lineConts = lineConts.replace(/\n/g,'');
  lineConts = lineConts.replace(/:/g,'=>');
  itemList += '<li><a href="#" title="'+list[index]+'">'+list[index]+': '+lineConts+'</a></li>';
 })
 itemList += '</div>';
 $(itemList).appendTo('#unique_probe');
 $('#unique_probe_menu').menu({
   selected: function(event, ui) {
//    alert( ui.item.find('a').attr('title'));
    selectedID = ui.item.find('a').attr('title');
    text       = ui.item.text();
    $('#toggleProbes').remove();
    $('#selected_probe').remove();
    //$('#unique_probe_menu').remove();
    //$('#unique_probe_menu').slideUp("fast");
    //toggleProbesMenu = '<button id="toggleProbes">Probes Menu</button>'; 
    selectedProbe    = '<div id="selected_probe" class="ui-corner-all ui-state-highlight"><span class="ui-icon ui-icon-info"></span>Selected gene is: <div id="selected_id">'+selectedID+'</div> ( '+text+' )</div>';
    /*$(toggleProbesMenu).appendTo('#unique_probe');
    $('#toggleProbes').button({
     icons: {
             secondary: "ui-icon-circle-triangle-e"
            }
    });
    $('#toggleProbes').click(function(){
     $('#unique_probe_menu').slideToggle("slow");
     $('#toggleProbes').hide();
    });
    $('#unique_probe_menu').slideUp("slow",function(){
     $(selectedProbe).appendTo('#unique_probe');
    });   
    */
    $(selectedProbe).appendTo('#unique_probe');
    
    $('#gene_id').val('');
    $('#do_analysis').button('enable');
    prepareAnalysis();
   }, 
 });
}

function geodicttab(xml,dicttags) {
  dictTable = '';
 //We can parse the xml and start to populate the file 
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

function divTabtoJSON (divid,fields,abbreviation) {
// Collect all the select field in the
// fields Array from the table and
// put it in a dictionary-like object
 results = new Object();
 paths = [];
 $('#'+divid).find('.cellTitle').each( function(){
  paths.push($(this).text());
 });
 $('#'+divid).find('.tab_row').each(function(){
  sampleID = '';
  $(this).find('.cell').each(function(index){
      if (index == 0) {
       sampleID = $(this).text();
       results[sampleID] = new Object();
      } else {
       if ($.inArray(paths[index], fields) >= 0) {
        // Clean a bit the text from spaces tabs...
        tmptxt = $(this).text().replace(/\n/g,'');
        tmptxt = $.trim(tmptxt);
        if (abbreviation == true){
         results[sampleID][paths[index].substring(0,4)] = new Object();
         results[sampleID][paths[index].substring(0,4)] = tmptxt;
        } else {
         results[sampleID][paths[index]] = new Object();
         results[sampleID][paths[index]] = tmptxt;
        }
       }
      }  
  });
 });
// Return the Object in JSON, ready to be sended
// to the server.
 return results;
}

function doItbutton (dataset,idRef,analysis,fields,title,options,toggle) {
 $('#results_viewer').fadeIn('slow');
 // collect the 3 info (filename, probe name and
 // selected clinical data) to pass to theserver
 //File name
 var filename='';
 var platformNumber = $('#choose_plat > li').size();
 if (platformNumber == 1 ){
   filename = dataset;
 } else {
   selPlatform = $('#choose_plat').find('.ui-state-active').clone();
   $(selPlatform).find('div').remove();
   filename = dataset+'-'+$(selPlatform).text().replace(/\s/g,'');
 }

 dataJSON = divTabtoJSON('dict_table',fields,true);
 dataJSON = JSON.stringify(dataJSON);
 //Now we can submit the data to the server
 // with an AJAX call (and see the results on the same page):

 customWarn = '<p>' +
               '<span class="ui-icon ui-icon-info"></span>' +
               '<strong>Please Wait</strong> while performing the analysis<img src="/media/css/img/loading.gif" />' +
              '</p>';
 $('#waiting_warn').html(customWarn);
 $.ajax({
  url:'/microarrpy/',
  data: {
   data_json : dataJSON,
   file_code : filename,
   id_ref : idRef,
   test: analysis,
   format:'png',
   title:title,
   opts:options,
   toggle:toggle
  },
  type: 'post',
  dataType:'html',
  async:true,
  success: function(res) {
   $('#results_viewer').hide();
   $('#results_viewer').empty();
   //$('#results_viewer').find('img').remove();
   $('#results_viewer').append(res);
   $('#results_viewer').fadeIn('slow');
   $(document).scrollTop($(document).height());
  },
  error: function() {
   alert ("Sorry we could't analyze the data!");
  }
 });
}

function prepareAnalysis() {
 //Empty function replaced with
 //some operation "analysis specific"
}


function downloadIMG(imgName) {
 $('#img_name').val(imgName);
 $('#download_image').submit();
}

function selectorchartab(xml) {
 //Make a table analogue to the one in the index page
 //But with the availability to select a specific column
 var charheader = ['GSM'];
 $(xml).find('Characteristics').each(function(){
   charheader.push($(this).attr('tag'));
 });
 //remove all the duplicate in order to have unique headers identifiers
 charheader = _.uniq(charheader)
 //Start create the div table
 charTable = "<div id='group_table_main'>";
 charTable += "<div class='tab_row'>";
 $(charheader).each(function(x) {
  if (charheader[x] != 'GSM') {
   charTable += "<div class='cellTitle selectColumn col"+x+"' title='" + charheader[x] + "'>" + charheader[x] + "</div>";
  } else {
    charTable += "<div class='cellTitle' title='" + charheader[x] + "'>" + charheader[x] + "</div>";
  }
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
      charTable += "<div class='cell col"+x+"' title='" + tmptext[idx] + "'>" + tmptext[idx] + "</div>";
     } else {
      charTable += "<div class='cell col"+x+"'></div>";
     }
    }
   });
  charTable += "</div>";
 });  
 charTable += "</div>";
 return charTable;
}


function handleGroupdata(groupText) {
 dataJSON = divTabtoJSON ('group_table',[groupText],false);
 // check if there are more then 4 groups, 
 // if is a numeric or literallist
 listOfvalues = []
 $.each(dataJSON, function(sample,values) {
  $.each(values, function(title,value) {
   listOfvalues.push(value);
  });
 });
 listOfvalues = _.uniq(listOfvalues);
 if (listOfvalues.length >= 4) {
 //Chech if is numeric
  arenumbers = [];
  $(listOfvalues).each(function(index){
   if (isAnumber(listOfvalues[index])) {
    arenumbers.push(listOfvalues[index]);
   }
  });
  // R will transform chars in numbers, but I just check if 
  // at least the half of the vector is really numbers
  if (arenumbers.length >= listOfvalues.length/2) {
   //is big and Numeric.. a scatterplot might be a good start
   alert('bignum');
  } else {
   //is big and Charachters... boxplot
   alert('bigch');
  }
 } else {
  //Chech if is numeric
  arenumbers = [];
  $(listOfvalues).each(function(index){
   if (isAnumber(listOfvalues[index])) {
    arenumbers.push(listOfvalues[index]);
   }
  });
  if (arenumbers.length >= listOfvalues.length/2) {
   //is small and Numeric... mostly useless
   alert('smalnu');
  } else {
   //is small and Charachters. Can do something like beeswarm
   alert('smalch');
  }
 };
}

function isAnumber(n) {
 return !isNaN(parseFloat(n)) && isFinite(n);
}


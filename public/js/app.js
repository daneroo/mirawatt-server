
// TODO: include initializr/plugin.js or RIM-boilerplate/common-utils.js - for console|log shim
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/

function hideURLBar(){
  MBP.hideUrlBar();
}

// this update the graph from the model, for the app.currentScope
function updateGraphFromCurrentModel(){
  console.log('updateGraphFromCurrentModel')
  var model=app.models[app.currentScope];
  var opts =  $.extend({}, { 
      labels:model.labels,
      file: model.data ,
      colors: model.colors ,
      stackedGraph: true,
      includeZero: false
  },model.options);
  app.graph.updateOptions( opts );
}

// This is a handler for the incoming feeds.
// It updates the model, then refreshes the graph
function updateFromFeeds(feeds){
  // console.log('updateFromFeeds')  
  $.each(feeds,function(i,feed){    
    app.feed.toModel(feed,function(summary,labels,modelData){
      var scopeId=feed.scopeId;        
      $('.scopepicker li[data-scope-id='+scopeId+'] span .metric').text(summary);
      app.models[scopeId].labels=['Time'].concat(labels);
      app.models[scopeId].data=modelData;
    });
  });
  
  updateGraphFromCurrentModel();
}

function fetchFeeds(){
  var options = {
    // method: 'jsonrpc' // 'dnode'
    method: 'dnode'
  };
  app.feed.fetchAll(options,updateFromFeeds);  
}

function refreshAccounts(){
  if (!app.svc) {
    // console.log('skip refreshAccounts - no connection');
    return;
  }
  // this is the dnode fetch - all scopes
  app.svc.accounts(function(err,accountIds){
    // console.log('accounts',accountIds);
    if (app.accountId==null && accountIds && accountIds.length>0){
      app.accountId=accountIds[0];
    }
    if (err) {
      console.log('dnode err',err);
      return;
    }
    var $feedList = $('.feedpicker ul');
    $feedList.html(''); // empty the list
    $.each(accountIds,function(i,accountId){
      var icon = (app.accountId===accountId)?'check':'grid';
      $feedList.append('<li data-icon="'+icon+'"><a data-feed="'+accountId+'" href="#">'+accountId+'</a></li>');
    });
    $feedList.listview('refresh');        
  });
}

setInterval(fetchFeeds, 3000);

var app = app || {};
app.svc=null;
app.currentScope=2;
// app.accountId is set on first refreshAccounts
app.accountId = null;// 'sample';

$(function(){
  hideURLBar();
  $('html').bind('touchmove',function(e){
    e.preventDefault();
  });
  
  // orientation change
  function orientationChange(){
    MBP.viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";    
    hideURLBar();
    app.graph.resize();
  }
  $(window).bind('orientationchange', orientationChange);
  orientationChange();
  
  $('#home ul.scopepicker li').click(function(){
      var scopeId = $(this).jqmData('scope-id');
      if (typeof scopeId !='undefined'){
          console.log('change scopeId',scopeId);
          app.currentScope=scopeId%app.models.length;
          lastFetch=null; // till we get push from dnode
          updateGraphFromCurrentModel();
      }
  });
  $('#dygraph').click(function(){
      app.currentScope=(app.currentScope+1)%app.models.length;
      lastFetch=null; // till we get push from dnode
      console.log('change scope',app.currentScope);
      updateGraphFromCurrentModel();
  });
  
  $('.feedpickershow').click(function(){
    refreshAccounts();
    $('#home .feedpickerwrapper').toggleClass('showing');
  });  
  $('.feedpicker li a').live('click',function(){
    app.accountId=$(this).data('feed');
    console.log('about to subscribe',app.accountId,app.currentScope);
    app.svc.subscribe({
       accountId:app.accountId,
       scopeId:app.currentScope
    });
    // console.log($('.feedpicker li'));
    // $('.feedpicker li').attr('data-icon','home');
    $('.feedpicker li span.ui-icon').removeClass('ui-icon-check')
    $('.feedpicker li span.ui-icon').addClass('ui-icon-grid')
    $(this).closest('li').find('span.ui-icon').removeClass('ui-icon-grid')
    $(this).closest('li').find('span.ui-icon').addClass('ui-icon-check')
    // $('.feedpicker ul').listview('refresh');
    // hide the picker
    $('#home .feedpickerwrapper').toggleClass('showing');
  });


  //anchorZoomSetup();
  app.graph.init(); //  drawGraph();
  updateGraphFromCurrentModel();
  
  DNode(function(remote,conn){
    this.type='viewer';
    conn.on('ready',function(){
      console.log('viewer ready',conn.id);
      app.svc=remote; // global!
      refreshAccounts();
    });
    conn.on('end',function(){
      app.svc=null; // global!
      console.log('viewer end',conn.id);
    });
  }).connect({reconnect:5000});
});


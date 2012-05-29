
// Application Context
var app = app || {};
app.svc=null;

// app.accountId is set on first refreshAccounts, when Dnode client is ready.
app.accountId = null; // 'sample';
app.currentScope=2;

// setInterval(fetchFeeds, 3000);

// TODO: include initializr/plugin.js or RIM-boilerplate/common-utils.js - for console.log shim
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/

function hideURLBar(){
  MBP.hideUrlBar();
}

// this update the graph from the model, for the app.currentScope
function updateGraphFromCurrentModel(){
  // console.log('updateGraphFromCurrentModel');
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

// This is the client invocation of the feed fetch
function fetchFeeds(){
  var options = {
    // method: 'jsonrpc' // 'dnode'
    method: 'dnode'
  };
  app.feed.fetchAll(options,updateFromFeeds);  
}

function refreshAccounts(){
  app.feed.getAccounts(function(accountIds){
    // console.log('accounts',accountIds);
    if (app.accountId==null && accountIds && accountIds.length>0){
      changeAccount(accountIds[0]);
    }
    var $feedList = $('.feedpicker ul');
    $feedList.html(''); // empty the list
    $.each(accountIds,function(i,accountId){
      var icon = (app.accountId===accountId)?'check':'grid';
      $feedList.append('<li data-icon="'+icon+'"><a data-account="'+accountId+'" href="#">'+accountId+'</a></li>');
    });
    $feedList.listview('refresh');        
  });
}

function changeAccount(accountId){
  console.log('changeAccount - clear Graphs?');
  // TODO:  reset the graphs.

  app.accountId = accountId;

  // this part is for fetch
  app.feed.lastFetch=null; // till we get push from dnode
  fetchFeeds();

  // this is for dnode/subscription
  console.log('about to subscribe',app.accountId,app.currentScope);
  app.svc.subscribe({
     accountId:app.accountId,
     scopeId:app.currentScope
  });
  
}

function changeScope(scopeId){
  console.log('change scopeId',scopeId);
  app.currentScope=scopeId%app.models.length;

  // this part is for fetch
  app.feed.lastFetch=null; // till we get push from dnode
  updateGraphFromCurrentModel();

  // this is for dnode/subscription
  console.log('about to subscribe',app.accountId,app.currentScope);
  app.svc.subscribe({
     accountId:app.accountId,
     scopeId:app.currentScope
  });

}

// Application initialisation and bindings
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
        changeScope(scopeId);
      }
  });
  $('#dygraph').click(function(){
      var scopeId = app.currentScope+1; // will be modulo'd in changeScope
      changeScope(scopeId);
  });
  
  $('.feedpickershow').click(function(){
    refreshAccounts();
    $('#home .feedpickerwrapper').toggleClass('showing');
  });  
  $('.feedpicker li a').live('click',function(){
    var accountId = $(this).data('account');
    changeAccount(accountId);
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
    this.set = function(accountId,feeds,cb){
      console.log('set',accountId,feeds);
      if (cb) cb(null,'ok');
      
      // TODO 
      updateFromFeeds(feeds)
    }
    conn.on('ready',function(){
      console.log('viewer ready',conn.id);
      app.svc=remote; // global!
      // TODO subscribe is account/scope available
      refreshAccounts();      
    });
    conn.on('end',function(){
      app.svc=null; // global!
      console.log('viewer end',conn.id);
    });
  }).connect({reconnect:5000});
});



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

var fetchCount=0;
var lastFetch=null; // till we get push from dnode (reset fomr scope change)
function fetchFeeds(){
  if (!app.svc) {
    // console.log('skip update - no connection yet');
    return;
  }
  // if scope is not Live, punt on update < 5,10 seconds
  if (lastFetch){
    var delay=+new Date()-lastFetch;
    var minDelayForScope=[900,5000,10000,10000,10000][app.currentScope];
    if (delay<minDelayForScope) return;
  }
  lastFetch=+new Date();

  var useJSON = ( fetchCount++ % 2 )==0; 
  if (useJSON){ // fetchFeeds-json
    console.log('fetchFeeds-json')
    jsonRPC(app.endpoint,"get",[app.accountId],function(response){
      if (response.error) {
        console.log('jsonrpc-error',response.error);
        return;
      }
      var feeds = response.result;
      console.log('json',app.accountId,feeds);
      updateFromFeeds(feeds);
    });
  } else { // fetchFeeds-dnode
    console.log('fetchFeeds-dnode')
    app.svc.get(app.accountId,function(err,feeds){
      if (err) {
        console.log('dnode-error',err);
        return;
      }
      console.log('dnode',app.accountId,feeds);
      updateFromFeeds(feeds);
    }); 
  }
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
app.endpoint='/jsonrpc';

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

function info(msg,clear){
  if(clear) $('#console').html('');
  $('#console').append('<div>'+new Date().toISOString()+' '+msg+'</div>');
}

// jsonRPC invocation helper
var jsonRPCId=42; // jsonRPC invocation counter
function jsonRPC(endpoint,method,paramsArray,successCB){
  var data = { 
    jsonrpc: "2.0",
    method: method,
    params: paramsArray, 
    id:(++jsonRPCId) 
  };
  $.ajax({
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: endpoint,
    data: JSON.stringify(data),
    success: successCB
  });
}

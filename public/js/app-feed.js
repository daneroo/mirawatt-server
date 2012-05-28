var app = app || {};

(function(){
  app.feed = {
    toModel:toModel, // converts feeds and maps them to model data structures
    lastFetch:null,  // exposed so it can be reset from outside
    fetchAll:fetchAll, //  fetchAll - get feeds (all scopes) - client initiated
    getAccounts:getAccounts // get a list of accountIds
  };

  function toModel(feed,callback){ // callback(summary,labels,data)
    if (!feed) {
      console.log('skipping feed (null)',scopeId);
      return;
    }    
    // console.log('toModel',feed.scopeId,feed);
    
    if (!callback) return;
    
    var scopeId=feed.scopeId;
    
    // scale denoms
    var W=1,kw=1000,kwh=1000,kwhpd=1000/24;
    var graphScale = [kw,kw,kwh,kwhpd,kwhpd][scopeId];
    var summaryScale = [W,kw,kwhpd,kwhpd,kwhpd][scopeId];
    
    // console.log('handling',scopeId,feed.name,feed.obs.length,'scale',scale,feed.obs[0]);
    var nudata=[];
    var avgOrLast=0;
    $.each(feed.obs,function(i,obs){
      var stamp = new Date(obs.t);//.toISOString().substring(0,19);
      var row = [stamp];
      var sum=0;
      $.each(obs.v,function(s,v){
        sum+=v;
        v=v/graphScale;
        row.push(v);
      });
      if (scopeId>0 || i==0) {
        avgOrLast+= sum/summaryScale;
      }
      nudata.push(row);
    });
    nudata.reverse();
    
    if (scopeId>0) avgOrLast/=feed.obs.length;
    
    avgOrLast = avgOrLast.toFixed([0,2,2,1,1][scopeId]);
    
    var summary = avgOrLast;
    var labels = ['Time'].concat(feed.sensorId);
    callback(summary,labels,nudata);
  }
  
  // fetchAll - get feeds (all scopes) - client initiated
  // dependancies:
  //  uses app.svc, app.currentScope, app.accountId
  //  will throttle according to app.currentScope, and app.feed.lastFetch
  // options : { 
  //   method: jsonrpc|dnode 
  // }
  function fetchAll(options,callback){ // callback(feeds)
    if (!app.svc) {
      // console.log('skip update - no connection yet');
      return;
    }
    
    options = $.extend({}, { // default options
        method:'dnode'
    },options);

    // if scope is not Live, punt on update < 5,10 seconds
    if (app.feed.lastFetch){
      var delay=+new Date()-app.feed.lastFetch;
      var minDelayForScope=[900,5000,10000,10000,10000][app.currentScope];
      if (delay<minDelayForScope) return;
    }
    app.feed.lastFetch=+new Date();

    if (options.method==='jsonrpc'){ // fetchFeeds-json
      console.log('fetchFeeds-jsonrpc')
      jsonRPC("get",[app.accountId],function(response){
        if (response.error) {
          console.log('jsonrpc-error',response.error);
          return;
        }
        var feeds = response.result;
        console.log('jsonrpc',app.accountId,feeds);
        if (callback) callback(feeds);
      });
    } else { // fetchFeeds-dnode
      console.log('fetchFeeds-dnode')
      app.svc.get(app.accountId,function(err,feeds){
        if (err) {
          console.log('dnode-error',err);
          return;
        }
        console.log('dnode',app.accountId,feeds);
        if (callback) callback(feeds);
      }); 
    }
  }

  function getAccounts(callback){ // callback(accountIds)
    if (!app.svc) {
      // console.log('skip refreshAccounts - no connection');
      return;
    }
    // this is the dnode fetch - all scopes
    app.svc.accounts(function(err,accountIds){
      if (err) {
        console.log('dnode err',err);
        return;
      }
      if (callback) callback(accountIds);
    });
  }
  
  
  // jsonRPC invocation helper
  var jsonRPCId=42; // jsonRPC invocation counter
  function jsonRPC(method,paramsArray,successCB){
    var endpoint='/jsonrpc'; // was a parameter, and defined as app.endpoint
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
  
})();
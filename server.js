// Config section
var port = (process.env.VMC_APP_PORT || 8080);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0' || 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');
var _ = require('underscore');
server.use(express.static(__dirname + '/public'));

var reflectIncoming = []; // temporary to debug posts
var persistentFeeds = {};  //by accountId - > array of scopes [0,1,2,3,4] : Live,...
// these are dnode client(remotes) by client.type
var clientsByType = {
  sensorhub: [],
  viewer: []
};

// all persisting passes through this function so we can propagate to subscribers
function persistFeed(accountId, feeds) {
    var maxScopeId=4;

    // setup the slots
    persistentFeeds[accountId]=persistentFeeds[accountId] || new Array(maxScopeId+1);

    function track(feeds){
      var dimension=0; var names=[]; var stamp='--';
      try {
        stamp=feeds[0].obs[0].t;
        dimension = feeds[0].obs[0].v.length;        
        names=_.map(feeds, function(feed){ return feed.name; }).join(',');
      } catch (e){}
      console.log(stamp,'received','|'+accountId+'|=',dimension,names);
    }
    track(feeds);
    
    var modifiedScopes = [];
    if (Array.isArray(feeds)){
      feeds.forEach(function(feed,i){
        if (feed.scopeId!==undefined) {
          var scopeId = Number(feed.scopeId);
          // guard against NaN or out of scopeId range
          if (scopeId>=0 && scopeId<=maxScopeId){
            modifiedScopes.push(scopeId);
            persistentFeeds[accountId][scopeId]=feed;
          }
        }
      });
    }
    // console.log('push updates',accountId,modifiedScopes);
    broadcastUpdates(accountId,modifiedScopes);
}

function broadcastUpdates(accountId,modifiedScopes) {
  clientsByType.viewer.forEach(function(client){
    if (!client.set){
      console.log('client viewer has no set method');
      return;
    }
    var sub = client.subscription;
    if (sub && sub.accountId===accountId){
      // TODO this should be alookup
      if (modifiedScopes.indexOf(sub.scopeId)>=0) {
        // console.log('pushing',sub /*,' in ',accountId,modifiedScopes*/);        
        client.set(accountId,[persistentFeeds[accountId][sub.scopeId]]);
      }
    }
  });
}

['spec.sample.json', 'spec.sampleBy2.json'].forEach(function (sampleDataFileName) {
  var sample = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, sampleDataFileName), 'utf8'));
  // console.log(sample);
  persistFeed(sample.accountId, sample.feeds); // make sure the samples has all scopes
});

var services = {
    zing : function (n, cb) { // cb(err,result)
      if (n>1000){
          console.log('n is too large');
          cb({code:-1,message:"n is too large"},null);
          return;
      }
      console.log('zing',n);
      if (cb) cb(null,n * 100);
    },
    accounts: function(cb){
        // TODO, add accountIds from sensorhubs, even without pushed data !?
        var sortedAccounts = Object.keys(persistentFeeds);
        sortedAccounts.sort();
        if (cb) cb(null,sortedAccounts);
    },
    // TODO change signature to remove accountId (included in feeds)
    set: function(accountId,feeds,cb){
      // validate
      persistFeed(accountId,feeds.feeds)
      if (cb) cb(null,true);
    },
    get:function(userId,cb){
        if (cb) cb(null,persistentFeeds[userId]);
    }
};

server.get('/feeds', function(req, res){
  // res.contentType('json'); 
  res.contentType('text');
  res.send(JSON.stringify(persistentFeeds,null,2));
});

server.get('/incoming', function(req, res){
  // res.contentType('json');  
  res.contentType('text');
  res.send([
    'Last '+reflectIncoming.length+' POSTS to /incoming',
    JSON.stringify(reflectIncoming,null,2)
  ].join('\n'));
});

// TODO; remove /:id from signature, included in body:  is this REST ok ?
// add the bodyparser only for this route.
server.post('/incoming/:id',express.bodyParser(), function(req, res){
  // console.log(req);
  reflectIncoming.unshift({
    stamp:new Date().toISOString(),
    url:req.originalUrl,
    query:req.query,
    params:req.params,
    body:req.body
  });
  res.send('OK');
  
  // trim the array
  var desiredLength=20;
  reflectIncoming=reflectIncoming.slice(0,desiredLength);
  
  var accountId=req.body.accountId; // || param ? || query
  var feeds = req.body.feeds;
  persistFeed(accountId,feeds);
});

jsonrpc_services = require('connect-jsonrpc')(services);
server.post('/jsonrpc', function(req, res, next){
  jsonrpc_services(req,res,next);    
});


var ioOpts= (process.env.VMC_APP_PORT)?{
  'transports': [
  //'websocket',
  //'flashsocket',
  //'htmlfile',
  'xhr-polling',
  'jsonp-polling'
  ]   
}:{};


dnode(function(client,conn){
  // attach services from above
  var service;
  for (service in services) {
    this[service]=services[service];
  }

  // this is exposed for viewers
  this.subscribe = function(subscription,cb){
    // this is for the viewer.
    client.subscription= subscription;
    console.log('subscribe',subscription);
    // callback not used
    if (cb) cb(null,true);
    // rebalance sensorhub subscriptions
    dispatchSensorSubscriptions();
  };

  // debug connection events
  if(0)['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
    conn.on(ev,function(){
      console.log('  --dnode.conn',ev,conn.id,new Date().toISOString());
    });
  });
  
  // expect client.type in [viewer,sensorhub]
  conn.on('ready', function () {
    
    console.log('adding client for conn:',conn.id,'type',client.type);
    if (!clientsByType[client.type]) clientsByType[client.type]=[];    
    clientsByType[client.type].push(client);

    dispatchSensorSubscriptions();
  });
  
  conn.on('end', function () {
    console.log('removing client for conn:',conn.id,'type',client.type);
    var idx = clientsByType[client.type].indexOf(client);
    if (idx!=-1) clientsByType[client.type].splice(idx, 1);
    // else: should never happen
    
    dispatchSensorSubscriptions();
  });
}).listen(server,{ io : ioOpts});

/* this seems to be necessary to keep the connection alive to the sensorhubs... */
setInterval(keepAlive,10000);
function keepAlive(){
  var sensorhubs=clientsByType['sensorhub']||[];
  sensorhubs.forEach(function(sensorhub){
    sensorhub.keepAlive(function(err,keepAliveCount){
      // if (keepAliveCount%3==0) console.log('keepAlive',sensorhub.type,keepAliveCount);
    });
  });
}

function dispatchSensorSubscriptions(){
  if (0) Object.keys(clientsByType).forEach(function(type){
    console.log('  |client['+type+']|=',clientsByType[type].length);
  });

  var subscriptions = [];
  
  var viewers=clientsByType['viewer']||[];
  viewers.forEach(function(viewer){
    // console.log(viewer.type,'subscription',viewer.subscription);
    if (viewer.subscription){
      subscriptions.push(viewer.subscription);
    } else {
      // console.log('subscription not set');
    }
  });

  var sensorhubs=clientsByType['sensorhub']||[];
  sensorhubs.forEach(function(sensorhub){
    // console.log(sensorhub.type,sensorhub.accountIds);
    sensorhub.subscribe(subscriptions);
  });
}

server.listen(port, host);
console.log('http://'+host+':'+port+'/');

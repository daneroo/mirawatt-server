// Config section
var port = (process.env.VMC_APP_PORT || 8080);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');
var _ = require('underscore');
server.use(express.static(__dirname+ '/public'));

var reflectIncoming=[]; // temporary to debug posts
var persistentFeeds={};  //by accountId - > array of scopes [0,1,2,3,4] : Live,...

['spec.sample.json','spec.sampleBy2.json'].forEach(function(sampleDataFileName){
  var sample = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, sampleDataFileName), 'utf8'));
  // console.log(sample);
  persistentFeeds[sample.accountId]=sample.feeds; // make sure the samples has all scopes
  
});

var services = {
    zing : function (n, cb) { // cb(err,result)
      if (n>100){
          console.log('n is too large');
          cb({code:-1,message:"n is too large"},null);
          return;
      }
      // console.log('zing',n);
      if (cb) cb(null,n * 100);
    },
    accounts: function(cb){
        var sortedAccounts = Object.keys(persistentFeeds);
        sortedAccounts.sort();
        if (cb) cb(null,sortedAccounts);
    },
    set: function(userId,feeds,cb){
      // validate
      function track(feeds){
        var dimension=0;
        var names=[];
        var stamp='--';
        try {
          stamp=feeds.feeds[0].obs[0].t;
          dimension = feeds.feeds[0].obs[0].v.length;        
          names=_.map(feeds.feeds, function(feed){ return feed.name; });
        } catch (e){}
        // console.log('set',stamp,userId,'dim',dimension,names.join(','));
      }
      track(feeds);
      persistentFeeds[userId]=feeds.feeds;
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
  
  var maxScopeId=4;
  // should validate 
  var accountId=req.body.accountId; // || param ? || query
  var feeds = req.body.feeds;
  if (Array.isArray(feeds)){
    feeds.forEach(function(feed,i){
      if (feed.scopeId!==undefined) {
        persistentFeeds[accountId]=persistentFeeds[accountId] || new Array(maxScopeId+1);
        var scopeId = Number(feed.scopeId);
        // guard against NaN or out of scopeId range
        if (scopeId>=0 && scopeId<=maxScopeId){
          persistentFeeds[accountId][scopeId]=feed;
        }
      }
    });
  }
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

// dnode(services).listen(server,{ io : ioOpts});
var clients=[];
dnode(function(client,conn){
  console.log('*****new client/conn',conn.id);
  var service;
  for (var service in services) {
    this[service]=services[service];
  }
  
  // expect client.type in [viewer,sensorhub]
  conn.on('ready', function () {
    console.log('adding client for conn:',conn.id);
    console.log('client.type',client.type)
    clients.push(client);
    console.log('added a client: '+clients.length);
    if(0) if (client.type=='sensorhub') setTimeout(function(){
      console.log('closing sensorhub connection after 10 seconds');
      conn.end();
    },10000);
  });
  conn.on('end', function () {
    console.log('removing client for conn:',conn.id);
    var idx = clients.indexOf(client);
    if (idx!=-1) clients.splice(idx, 1);
    // else: should never happen
    console.log('removed client: '+clients.length);
  });
}).listen(server,{ io : ioOpts});

server.listen(port, host);
console.log('http://'+host+':'+port+'/');

// Config section
var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');
server.use(express.static(__dirname+ '/public'));

var reflectIncoming=[]; // temporary to debug posts
var persistentFeeds={};  //by accountId - > array of scopes [0,1,2,3,4] : Live,...

var sample = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'spec.sample.json'), 'utf8'));
console.log(sample);
persistentFeeds[sample.accountId]=sample.feeds; // make sure the samples has all scopes
var services = {
    zing : function (n, cb) { // cb(err,result)
      if (n>100){
          console.log('n is too large');
          cb({code:-1,message:"n is too large"},null);
          return;
      }
      if (cb) cb(null,n * 100);
    },
    set: function(userId,feeds,cb){
      // validate
      console.log('set',userId,Object.keys(feeds.feeds));
      persistentFeeds[userId]=feeds.feeds;
      if (cb) cb(null,true);
    },
    get:function(userId,cb){
        if (cb) cb(null,persistentFeeds[userId]);
    }
};

server.get('/feeds', function(req, res){
  // res.contentType('json'); 
  var feedCopy =  JSON.parse(JSON.stringify(persistentFeeds));

  // commented: remove actual data for screen
  if (0) for (var accountId in feedCopy) {
    var feedByScope = feedCopy[accountId];
    feedByScope.forEach(function(feed,scopeId){
      console.log(accountId,scopeId,feed);
      if (feed) { // some are null
        feed.dimension=feed.obs[0].v.length;
        feed.obs="|...|="+feed.obs.length;
      }
    });
  }

  res.contentType('text');
  res.send([
    'Feeds By accoutId/scopeId',
    JSON.stringify(feedCopy,null,2)
  ].join('\n'));
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
dnode(services).listen(server,{ io : ioOpts});

if (!process.env.VMC_APP_PORT) {
  // also listen to 7070 directly (locally)
  dnode(services).listen(7070);
}


server.listen(port, host);
console.log('http://'+host+':'+port+'/');

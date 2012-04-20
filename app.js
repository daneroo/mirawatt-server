// Config section
var port = (process.env.VMC_APP_PORT || 8880);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');

//var orm = require('./lib/orm');
// not yet, see im-w for example invocation fro services

// if local ?
//server.use(express.logger());
server.use(express.static(__dirname+ '/public'));
server.use(express.bodyParser());

var reflectIncoming=[];

var persistentFeeds={};
var services = {
    zing : function (n, cb) { // cb(err,result)
      console.log('called server zing',n);
      if (n>100){
          console.log('n is too large');
          cb({code:-1,message:"n is too large"},null);
          return;
      }
      cb(null,n * 100);
    },
    set: function(userId,feeds,cb){
        persistentFeeds[userId]=feeds;
        cb(null,true);
    },
    get:function(userId,cb){
        cb(null,persistentFeeds[userId]);
    }
};

server.get('/incoming', function(req, res){
  // res.contentType('json');  
  res.contentType('text');
  res.send('Last '+reflectIncoming.length+' POSTS to /incoming\n'+JSON.stringify(reflectIncoming,null,2));
});

server.post('/incoming/:id', function(req, res){
  // console.log(req);
  reflectIncoming.unshift({
    stamp:new Date().toISOString(),
    url:req.originalUrl,
    query:req.query,
    params:req.params,
    body:req.body
  });
  
  // trim the array
  var desiredLength=20;
  reflectIncoming=reflectIncoming.slice(0,desiredLength);
  res.send('OK');
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

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

server.post('/incoming', function(req, res){
  // console.log(req);
  console.log('stamp',new Date().toISOString());
  console.log('url',req.originalUrl);
  console.log('query',req.query);
  console.log('body',req.body);
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

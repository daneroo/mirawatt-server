// Config section
var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');

var orm = require('./lib/orm');

var ioOpts= (process.env.VMC_APP_PORT)?{
  'transports': [
  //'websocket',
  //'flashsocket',
  //'htmlfile',
  'xhr-polling',
  'jsonp-polling'
  ]   
}:{};
server.use(express.static(__dirname+ '/public'));
server.get('/backup', function(req, res){
  // see require('express-resource'),
  orm.get(function(err,doc){
    res.writeHead(200, {'content-type': 'text/json' });
    res.write( JSON.stringify(doc,null,2) );
    res.end('\n');
  });
});

var initialLoad=false;
if (initialLoad){
  var restore = (function(){
    var obsjson = require('fs').readFileSync(__dirname+'/observationdata.json', 'utf8');
    //console.log(obsjson);
    //console.log('----------');
    return JSON.parse(obsjson);
  })();
  if (restore.values){
    console.log('restoring values');
    orm.save(restore.values);
  } else {
    console.log('ERROR: could not restore values');
  }
}

var svc = {
    zing : function (n, cb) { 
      //console.log('called server');
      cb(n * 100);
    },
    get: function(cb){ // cb(err,doc)      
      console.log('svc.get');
      orm.get(cb);
    },
    add: function(stamp,value,cb){
      console.log('svc.add:',stamp,value);
      //cb({message:'not implemented'});
      orm.add(stamp,value,cb);
    }
};

dnode(svc).listen(server,{ io : ioOpts});

if (!process.env.VMC_APP_PORT) {
  // also listen to 7070 directly (locally)
  dnode(svc).listen(7070);
}


server.listen(port, host);
console.log('http://'+host+':'+port+'/');

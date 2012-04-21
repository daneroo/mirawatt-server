// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');
var request = require('request');

var endpoint='http://0.0.0.0:3000/jsonrpc';
//var endpoint='http://mirawatt.cloudfoundry.com/jsonrpc';
var client = jsonrpc(endpoint);


var method='zing';
var params=[44]; //{ n: param }, 
client.call(method,params,function(err, result) {
  if (err){
    console.log('jsonrpc.zing('+params+') Error: ',err);
  } else {
    console.log('jsonrpc.zing('+params+') = ' + result);
  }
});

// dnode part
if (0) dnode.connect(7070, function (remote, conn) {
  //console.log(conn);
  var param=42;
  remote.zing(param, function (err,result) {
    if (err){
      console.log('remote.zing('+param+') Error: ',err);
    } else {
      console.log('remote.zing('+param+') = ' + result);
    }
    conn.end();
  });
});

function fetch(cb){
  console.log('fetching')
    request.get({uri:"http://cantor.imetrical.com/iMetrical/feedsJSON.php", json : true},function(error,response,body){
      console.log('fetched')
        cb(error,body);
    });
}

// push, then get
function fetchPushThenGet(){
    var userId='daniel';
    var feeds={stamp:new Date(),value:Math.random()};
    fetch(function(err,feeds){
        // console.log('calling set',userId /*,feeds*/);
        client.call('set',[userId,feeds],function(err,result){
            if (err){
                console.log('remote.set('+userId+',',feeds,') Error: ',err);            
            } else {
                // console.log('remote.set('+userId+',',feeds,') = ',result);            
            }
            client.call('get',[userId],function(err,result){
                if (err){
                    console.log('remote.get('+userId+') Error: ',err);            
                } else {
                    console.log('remote.get('+userId+') = ');            
                    result.forEach(function(sc,i){
                        console.log('scope',sc.scopeId,sc.name);
                        sc.observations=sc.observations.slice(0,1);
                        sc.observations.push('...');
                    });
                    console.log(JSON.stringify(result,null,2))
                }
            });
        });
    });
}

//setTimeout(fetchPushThenGet,1000);
setInterval(fetchPushThenGet,2000);

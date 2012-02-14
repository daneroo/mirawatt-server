// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');

// json-rpc part
client = jsonrpc('http://localhost:3000/jsonrpc');
var method='zing';
var params=[44]; //{ n: param }, 
client.call(method,params,function(err, result) {
        if (err){
            console.log('remote.zing('+params+') Error: ',err);
        } else {
            console.log('remote.zing('+params+') = ' + result);
        }
    }
);

// dnode part
dnode.connect(7070, function (remote, conn) {
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

// push, then get
function pushThenGet(){
    var userId='daniel';
    var feeds={stamp:new Date(),value:Math.random()};
    // console.log('calling set',userId,feeds);
    client.call('set',[userId,feeds],function(err,result){
        if (err){
            console.log('remote.set('+userId+',',feeds,') Error: ',err);            
        } else {
            //console.log('remote.set('+userId+',',feeds,') = ',result);            
        }
        client.call('get',[userId],function(err,result){
            if (err){
                console.log('remote.get('+userId+') Error: ',err);            
            } else {
                console.log('remote.get('+userId+') = ',result);            
            }
        });
    });
}

//setTimeout(pushThenGet,1000);
setInterval(pushThenGet,2000);

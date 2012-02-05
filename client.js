// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');
var request = require('request');

// json-rpc part
client = jsonrpc('http://localhost:3000/jsonrpc');
var method='zing';
var params=[44]; //{ n: param }, 
client.call(method,params,function(err, result) {
        if (err){
            console.log('jsonrpc.zing('+params+') Error: ',err);
        } else {
            console.log('jsonrpc.zing('+params+') = ' + result);
        }
    }
);

// dnode part
dnode.connect(7070, function (remote, conn) {
    //console.log(conn);
    var param=42;
    remote.zing(param, function (err,result) {
        if (err){
            console.log('dnode.zing('+param+') Error: ',err);            
        } else {
            console.log('dnode.zing('+param+') = ' + result);            
        }
        conn.end();
    });
});

//iMetricalReq =  request.defaults("http://cantor.imetrical.com/iMetrical/feedsJSON.php");
request.get({uri:"http://cantor.imetrical.com/iMetrical/feedsJSON.php", json : true},function(error,response,body){
	console.log('---body--');
	body.forEach(function(sc,i){
		console.log('scope',sc.scopeId,sc.name);
		sc.observations=sc.observations.slice(0,1);
	});
	console.log(JSON.stringify(body,null,2))
	console.log('+++body--');
});
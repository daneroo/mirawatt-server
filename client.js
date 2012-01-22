var dnode = require('dnode');

var ioOpts={
  'transports': [
  //'websocket',
  //'flashsocket',
  //'htmlfile',
  'xhr-polling',
  'jsonp-polling'
  ]   
}

dnode.connect(7070,{io:ioOpts}, function (remote, conn) {
    //console.log(conn);
    var param=142;
    remote.zing(param, function (err,result) {
        if (err){
            console.log('remote.zing('+param+') Error: ',err);            
        } else {
            console.log('remote.zing('+param+') = ' + result);            
        }
        conn.end();
    });
});
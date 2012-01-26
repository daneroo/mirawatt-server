var http=require('http');
var fs=require('fs');
var zlib=require('zlib');
var _  = require('underscore');
_.mixin(require('underscore.string'));



var processRawDay = function(json,T,startStr){
    var data = JSON.parse(json);
    console.log(startStr,json.length);
    return;
    console.log(_.sprintf("%22s %10s %8s %8s %7s %7s %7s %7s %7s",'date','method','samples','size','ratio','Bps','H(x)','<bound','<ac+h'));
    console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f",startStr,'raw',data.length,json.length,1.0,json.length/86400/T));
    var values = iM.rawToCanonical(json,startStr,T,false);
    var signal = {
        stamp : startStr,
        T : T,
        Q: 10,
        values : values
    };
    var valuesT60 = resample(values,60);
    var signalT60 = {
        stamp : startStr,
        T : 60,
        Q: 1,
        values : valuesT60,
        metrics:{
          raw:{size:json.length,sha1sum:sha1sum(json)}
        }
    };
    
    signalT60.metrics.Q01=metrics(signal);

    // Q10
    var Q = 10; // value quantization
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = (values[i]===null)?null:Math.round(values[i]/Q);        
    });
    signalT60.metrics.Q10=metrics(signal);

    // Delta
    iM.deltaEncode(values);
    signalT60.metrics.DLT=metrics(signal);

    // Runlength
    values = iM.rlEncode(values);
    signal.values = values;
    
    signalT60.metrics.RL=metrics(signal);

    saveDay(signalT60,signal);
}

function exists(filename){
    try {
        var stats = fs.lstatSync(filename);
        return stats.isFile();
    } catch (e) {}
    return false;
}
function fetch(table,dayStr,cb){
    var filename=_.sprintf('data/%s.json.gz',dayStr);
    if (exists(filename)){
        fs.readFile(filename,function (err, gzbuf) {            
            if (err) {
                if (cb) cb(err);
                return;
            }
            zlib.gunzip(gzbuf, function(error,buf){
                if (error) {
                    if (cb) cb(error);
                    return;
                }
                var data = buf.toString();
                if (cb) cb(null,data);                
            });
        });
        return;
    }
    // else fetch
    var options = {
        host: '192.168.5.2',
        port: 80,
        path: '/iMetrical/getJSONForDay.php?day='+dayStr+'&table='+table
        //path: '/iMetrical/getJSONForDay.php?offset='+offset+'&table='+table
    };
    console.log('--- fetch --- %s ---',dayStr);
    http.get(options, function(res) {
        var responseBody = '';
        //console.log("Got response: " + res.statusCode);
        res.addListener('data', function(chunk) {
            responseBody += chunk;
        });
        res.addListener('end', function() {            
            gzipMax(responseBody, function(error,gzbuf){
                if (error) {
                    console.log("gzip: Got error: " + error);
                    return;
                }
                fs.writeFileSync(filename, gzbuf);
            });
            
            if (cb) cb(null,responseBody);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        if (cb) cb(e);
    });
}
function gzipMax(buffer,callback) { //
    // zlib.gzip(buffer, callback);
    //     return;
    
    function zlibBuffer(engine, buffer, callback) {
      var buffers = [];
      var nread = 0;

      function onError(err) {
        engine.removeListener('end', onEnd);
        engine.removeListener('error', onError);
        callback(err);
      }

      function onData(chunk) {
        buffers.push(chunk);
        nread += chunk.length;
      }

      function onEnd() {
        var buffer;
        switch(buffers.length) {
          case 0:
            buffer = new Buffer(0);
            break;
          case 1:
            buffer = buffers[0];
            break;
          default:
            buffer = new Buffer(nread);
            var n = 0;
            buffers.forEach(function(b) {
              var l = b.length;
              b.copy(buffer, n, 0, l);
              n += l;
            });
            break;
        }
        callback(null, buffer);
      }

      engine.on('error', onError);
      engine.on('data', onData);
      engine.on('end', onEnd);

      engine.write(buffer);
      engine.end();
    }
    zlibBuffer(new zlib.Gzip({level:zlib.Z_BEST_COMPRESSION}), buffer, callback);
}

function fmtDay(day){
    // Month+1 Really ?
    return _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
}

function incrDay(day,deltaDays){
    var d = new Date(day.getTime());
    d.setUTCDate(d.getUTCDate()+deltaDays);
    return d;
}
// forwards this time
function doADay(day,delta,stopDay) {
    stopDay = stopDay || new Date();
    var dayStr = fmtDay(day);
    var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
    var T=1;

    console.log('doing day',day.toISOString());
    fetch(table,dayStr,function(e,responseBody){
        if (e) {
            console.log("Got error: " + e.message);
            return;
        }
        processRawDay(responseBody,T,dayStr+'T00:00:00Z');
        if ( day.getTime() <= stopDay.getTime() ){ // stop        
            setTimeout(function(){doADay(incrDay(day,delta),delta);},1);
        }
    })
}

var startDay = new Date("2008-07-30T00:00:00Z");
//var startDay = new Date("2012-01-24T00:00:00Z");
console.log('start',fmtDay(startDay),' :: '+startDay);

// var endDay = incrDay(startDay,1300);
var endDay = incrDay(new Date(),-1250);
console.log('end',fmtDay(endDay),' :: '+endDay);

doADay(startDay,1);
// doADay(20,400);

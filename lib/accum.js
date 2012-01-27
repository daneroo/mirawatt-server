var http=require('http');
var fs=require('fs');
var zlib=require('zlib');
var _  = require('underscore');
_.mixin(require('underscore.string'));

dayIter=false;
try {
    dayIter = require('./dayIter');
} catch (e) {}
try {
    dayIter = require('./lib/dayIter');
} catch (e) {}


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
    
    // file not found
    cb({message:_.sprintf(' file %s not found',filename)});
}

function fmtDay(day){
    // Month+1 Really ?
    return _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
}

function doADay(day,next) {
    var dayStr = fmtDay(day);
    var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
    var T=1;

    console.log(' ::fetch day',day.toISOString());
    fetch(table,dayStr,function(e,responseBody){
        if (e) {
            console.log("Got error: " + e.message);
            if (next) next();
            return;
        }
        processRawDay(responseBody,T,dayStr+'T00:00:00Z');
        if (next) next();
        else {
            console.log('  ::loop is done'); 
        }
    })
}

var epoch = new Date("2008-07-30T00:00:00Z");
//var startDay = new Date("2012-01-24T00:00:00Z");
console.log('epoch::',epoch);

// var endDay = incrDay(startDay,1300);
if (dayIter){
    console.log('--- this week up ---');
    dayIter.iter(epoch,null,null,doADay);
    
} else {
    console.log('dayIter not available');
}

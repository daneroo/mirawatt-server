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


var state = {
    sum:0,
    n:0
}
var processRawDay = function(json,T,startStr){
    var data = JSON.parse(json);
    console.log('--stamp::',data.stamp,'values::',data.values.length);
    data.values.forEach(function(v, idx, array) { 
        if (v!==null){
            state.sum+=v;
            state.n+=1;
        }
    });
    console.log('++stamp::',data.stamp,'sum::',state.sum,'n::',state.n,'avg::',state.sum/state.n);
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
    dayIter.iter(epoch,null,null,doADay);
} else {
    console.log('dayIter not available');
}

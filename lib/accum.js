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


//var state = { sum:0,n:0 };
var state = {
    minute:{ keep:60},
    hour:{ keep:48},
    day:{ keep:31},
    month:{ keep:12},
    year:{ keep:1000},
    all:{ sum:0,n:0 },    
    // "2012-04-01T05:00:00Z" : 1439
}

var vstamp,scopeStr; // only update these every hour.. or minimum timezone resolution..
function accumulate(scope,stamp,idx,v){
    var sc = state[scope];
    if (!sc) return; // or error
    if (idx%1==0){
        vstamp=new Date(stamp.getTime()+(idx*1000));
        scopeStr = dayIter.floor(vstamp,scope,true).toISOString();
    }
    if (!sc[scopeStr]) sc[scopeStr] ={ sum:0,n:0 };    
    sc[scopeStr].sum+=v;
    sc[scopeStr].n+=1;
}
function trim(scope){
    var sc = state[scope];
    if (!sc) return; // or error
    while (_.size(sc)>sc.keep){
        var min=null;
        _.each(sc, function(accum,k){
            if (min==null || min.localeCompare(k)>0) min=k
        });
        //console.log('      ::trim',scope,'size',_.size(sc),'keep',sc.keep,min,sc[min]);
        delete sc[min];
        //console.log('      ++trim',scope,'size',_.size(sc),'keep',sc.keep,min,sc[min]);
    }
}
var processRawDay = function(json,T,startStr){
    var data = JSON.parse(json);
    var stamp=new Date(Date.parse(data.stamp));
    console.log('--stamp::',stamp.toISOString(),'values::',data.values.length);
    data.values.forEach(function(v, idx, array) { 
        if (v!==null){
            state.all.sum+=v;
            state.all.n+=1;
            accumulate('minute',stamp,idx,v);
            accumulate('hour',stamp,idx,v);
            accumulate('day',stamp,idx,v);
            //accumulate('month',stamp,idx,v);
            //accumulate('year',stamp,idx,v);
        }
    });
    trim('minute');
    trim('hour');
    trim('day');
    trim('month');
    trim('year');
    
    console.log('++stamp::',data.stamp,'sum::',state.all.sum,'n::',state.all.n,'avg::',Math.round(state.all.sum/state.all.n));
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

function fmtDay(day,useLocal){
    // Month+1 Really ?
    if (useLocal){
        return _.sprintf("%4d-%02d-%02d",day.getFullYear(),day.getMonth()+1,day.getDate());
    }
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
            // console.log('state.day',state.day);
            console.log('state',state);
        }
    })
}

var epoch = new Date("2008-07-30T00:00:00Z");
var epoch = new Date("2011-11-30T00:00:00Z");
var epoch = new Date("2012-01-29T00:00:00Z");
//var startDay = new Date("2012-01-24T00:00:00Z");
console.log('epoch::',epoch);

// var endDay = incrDay(startDay,1300);
if (dayIter){    
    dayIter.iter(epoch,null,null,doADay);
} else {
    console.log('dayIter not available');
}

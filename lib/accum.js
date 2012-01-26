var _  = require('underscore');
_.mixin(require('underscore.string'));
var dayIter = require('./dayIter');


function fmtDay(day){
    // Month+1 Really ?
    return _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
}

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
        if ( day.getTime() < stopDay.getTime() ){ // stop        
            setTimeout(function(){doADay(incrDay(day,delta),delta);},1);
        }
    })
}

var epoch = new Date("2008-07-30T00:00:00Z");
var today = new Date();
var weekAgo = dayIter.incrDay(today,-7);
console.log('epoch :: ',epoch.toISOString());
console.log('today :: ',today.toISOString());
console.log('weekAgo :: ',weekAgo.toISOString());

// var endDay = incrDay(startDay,1300);
// console.log('end',fmtDay(endDay),' :: '+endDay);

// doADay(startDay,1);
// doADay(20,400);


console.log('--- today only ---')
dayIter.iter(null,null,null,function(day,next){
    console.log('  work for iter',day.toISOString()); 
   if (next) next();
   else {
       console.log('today is done');
       console.log('--- this week up ---')
       dayIter.iter(weekAgo,today,null,function(day,next){
           console.log('  work for iter',day.toISOString()); 
           if (next) next();
           else {
               console.log('week up is done');
               console.log('--- this week down ---')
               dayIter.iter(today,weekAgo,null,function(day,next){
                   console.log('  work for iter',day.toISOString()); 
                   if (next) next();
                   else {
                       console.log('week down is done');
                   }
               });
           }
       });
   }
});


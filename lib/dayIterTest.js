var dayIter = require('./dayIter');


var epoch = new Date("2008-07-30T00:00:00Z");
var today = new Date();
var weekAgo = dayIter.incrDay(today,-7);
console.log('epoch :: ',epoch.toISOString());
console.log('today :: ',today.toISOString());
console.log('weekAgo :: ',weekAgo.toISOString());

function loopAndThen(name,thenCB){
    return function(day,next){
        console.log('  '+name+'::work for iter',day.toISOString()); 
        if (next) next();
        else {
            console.log('  '+name+':: is done'); 
            if (thenCB) thenCB();
        }
    };    
}

function todayOnly(){
    console.log('--- today only ---')
    dayIter.iter(null,null,null,function(day,next){
        console.log('  work for iter',day.toISOString()); 
       if (next) next();
       else {
           console.log('today is done');
           weekUp();
       }
    });
}
function weekUp(){
    console.log('--- this week up ---')
    dayIter.iter(weekAgo,today,null,function(day,next){
        console.log('  work for iter',day.toISOString()); 
        if (next) next();
        else {
            console.log('week up is done');
            weekDown();
        }
    });
}
function weekDown(){
    console.log('--- this week down ---')
    dayIter.iter(today,weekAgo,null,function(day,next){
        console.log('  work for iter',day.toISOString()); 
        if (next) next();
        else {
            console.log('week down is done');
        }
    });
}

todayOnly();

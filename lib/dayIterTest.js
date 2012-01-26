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
            else {
                console.log('Nothing left to do');
            }
        }
    };    
}

function todayOnly(){
    console.log('--- today only ---');
    dayIter.iter(null,null,null,loopAndThen('today',weekUp));
}
function weekUp(){
    console.log('--- this week up ---');
    dayIter.iter(weekAgo,today,null,loopAndThen('week up',weekDown));
}
function weekDown(){
    console.log('--- this week down by 2 ---')
    dayIter.iter(today,weekAgo,-2,loopAndThen('week down by 2',allTimeUp));
}
function allTimeUp(){
    console.log('--- alltime up by 73 ---')
    dayIter.iter(epoch,null,73,loopAndThen('allTime up by 73'));
}

todayOnly();

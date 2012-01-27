
/**
  setup a day iterator
    function dayIter(startDay,stopDay,delta,cb);
  where cb(day,next)
    it is the callbacks responsibility to call next() to let the iteration proceed.
 */

 function incrDay(day,deltaDays){
     var d = new Date(day.getTime());
     d.setUTCDate(d.getUTCDate()+deltaDays);
     return d;
 }

/*
  scope is one of second,tenseconds,minute,tenminutes,hour,day,month
  is scope is a number,.. 1,10,60,3600, round to this many seconds...
*/
 
 function floor(d,scope,useLocal){
     // make a copy
     var truncated = new Date(d.getTime());
     var namedSetter = function(d,name,useLocal){ // name is Milliseconds,Seconds,...Month
         if (!useLocal) name = 'UTC'+name;
         var setter = d['set'+name];
         var value = ('Date'==name)?1:0;
         if (setter){
             setter.call(d,value);
         } else {
             console.log('floor::setter not found '+name);
         }
     }
     namedSetters=['Milliseconds','Seconds','Minutes','Hours','Date','Month'];
     var lastIndexForScope = {
         second:0,
         minute:1,
         hour:2,
         day:3,
         month:4,
         year:5
     }
     if (lastIndexForScope.hasOwnProperty(scope)){
         var end=lastIndexForScope[scope];
         for (var s=0;s<=end;s++){
             //console.log('  ::set ',namedSetters[s],scope);
             namedSetter(truncated,namedSetters[s],useLocal);
         }
     } else {
         console.log('error::floor scope not found '+scope);
     }
     return truncated;
 }

 function floorUTCDay(d){
     return floor(d,'day',false);
     var day = new Date(d.getTime());
     day.setUTCHours(0);
     day.setUTCMinutes(0);
     day.setUTCSeconds(0);
     day.setUTCMilliseconds(0);
     return day;
 }
 
 function before(dateA,dateB){
     // console.log(' before::',dateA.getTime() < dateB.getTime(),dateA.toISOString(),dateB.toISOString());
     return dateA.getTime() < dateB.getTime();
 }

 
 function iter(startDay,stopDay,delta,cb) {
     startDay = floorUTCDay(startDay || new Date());
     stopDay = floorUTCDay(stopDay || new Date());
 
     // console.log('- dayIter::iter delta',delta);
     delta = delta || (before(startDay,stopDay)?1:-1);
     // console.log('+ dayIter::iter delta',delta);
 
     // console.log(' dayIter::iter',startDay.toISOString(),'delta',delta,stopDay.toISOString());
     var continueCondition =  ( 
         (delta>0 && before(startDay,stopDay))
         || (delta<0 && before(stopDay,startDay)) 
     );
     
     // next is null when we stop.
     var next = continueCondition ? function(){
         // stop condition
         if (  (delta>0 && before(startDay,stopDay))
         || (delta<0 && before(stopDay,startDay)) ) {
             var nextDay = incrDay(startDay,delta);
             process.nextTick(function () {
                 iter(nextDay,stopDay,delta,cb);
             });         
         }
     }: null;
     if (cb) cb(startDay,next);
 }

/**
  * export the stup() function
  */
module.exports = {
    incrDay:incrDay,
    floor:floor,
    floorUTCDay:floorUTCDay,
    before:before,
    iter:iter
};

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

 function floorUTCDay(d){
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
    floorUTCDay:floorUTCDay,
    before:before,
    iter:iter
};
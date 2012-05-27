var app = app || {};

(function(){
  app.feed = {
    toModel:toModel
  };
  
  function toModel(feed,callback){ // cb(summary,labels,data)
    if (!feed) {
      console.log('skipping feed (null)',scopeId);
      return;
    }    
    // console.log('toModel',feed.scopeId,feed);
    
    if (!callback) return;
    
    var scopeId=feed.scopeId;
    
    // scale denoms
    var W=1000,kw=1000,kwh=1000,kwhpd=1000/24;
    var graphScale = [kw,kw,kwh,kwhpd,kwhpd][scopeId];
    var summaryScale = [kw,kw,kwhpd,kwhpd,kwhpd][scopeId];
    
    // console.log('handling',scopeId,feed.name,feed.obs.length,'scale',scale,feed.obs[0]);
    var nudata=[];
    var avgOrLast=0;
    $.each(feed.obs,function(i,obs){
      var stamp = new Date(obs.t);//.toISOString().substring(0,19);
      var row = [stamp];
      var sum=0;
      $.each(obs.v,function(s,v){
        sum+=v;
        v=v/graphScale;
        row.push(v);
      });
      avgOrLast+= ((scopeId>0 || i==0)?1:0) * sum/summaryScale;
      nudata.push(row);
    });
    nudata.reverse();
    
    if (scopeId>0) avgOrLast/=feed.obs.length;
    
    if (scopeId===0) avgOrLast*=1000; // W instead o kW
    avgOrLast = avgOrLast.toFixed([0,2,2,1,1][scopeId]);
    
    var summary = avgOrLast;
    var labels = ['Time'].concat(feed.sensorId);
    callback(summary,labels,nudata);
  }
})();
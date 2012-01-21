var anchorZoomSetup = function() {

  var day=1000*60*60*24; // in ms
  var zoomDays=[7,14,30,90,180,365,730];
  var zoomDaysPlus=zoomDays.slice(); //plus all time
  var zoomTitles=['1 week','2 weeks','1 month','3 months','6 months','1 year','2 years','All Time']
  function currentDaysContext(){
    if (!app.values) return {
      current:0,
      zoomInIndex:-1,
      zoomOutIndex:-1
    };
    
    var values = app.values;

    // all math in unix_ts
    var now = new Date-0;
    var oldest = Date.parse(values[values.length-1].stamp);

    var maxDays = Math.round((now-oldest)/day);
    zoomDaysPlus = zoomDays.slice();
    zoomDaysPlus.push(maxDays);
    
    var g=globalG.date_graph;
    var xR = g.xAxisRange();
    var current=Math.round((xR[1]-xR[0])/day);
    var zoomOutIndex=-1;
    var zoomInIndex=-1;
    var i;
    for (i=0;i<zoomDaysPlus.length;i++){
      if (current>zoomDaysPlus[i]) zoomInIndex=i;
    }
    for (i=zoomDaysPlus.length-1;i>=0;i--){
      if (current<zoomDaysPlus[i]) zoomOutIndex=i;
    }
    console.log('current range,zo',current,zoomOutIndex,zoomDaysPlus[zoomOutIndex]);
    console.log('current range,zi',current,zoomInIndex,zoomDaysPlus[zoomInIndex]);
    return {
      current:current,
      zoomInIndex:zoomInIndex,
      zoomOutIndex:zoomOutIndex
    };
  }
  var lastSetDays=null;
  function adjustRange(dayCtx,delta){
    if (!dayCtx) return;
    var g=globalG.date_graph;

    var now = new Date-0;
    var desiredDays=30; // gets overritten
    var title="title"; // gets overwritten
    if (delta>0) { // zoom out
      if (dayCtx.zoomOutIndex==-1) return;
      var idx = dayCtx.zoomOutIndex+delta-1;
      idx=Math.min(idx,zoomDaysPlus.length-1);
      desiredDays = zoomDaysPlus[idx];
      title=zoomTitles[idx];
    } else if (delta<0) { // zoom in
      if (dayCtx.zoomInIndex==-1) return;
      var idx = dayCtx.zoomInIndex+delta+1;
      idx=Math.max(idx,0);
      desiredDays = zoomDaysPlus[idx];
      title=zoomTitles[idx];
    } else return;
    
    if (lastSetDays==desiredDays) return;
    lastSetDays = desiredDays;
    g.updateOptions({
      dateWindow: [now-desiredDays*day,now],
      title:title // 'last '+desiredDays+'d'
    });

  }    

    var anchorX;
    var daysCtx;
    var stepPixels=50; //300/6
    function mouseRangeStart(e) {
        lastSetDays=null;
        anchorX = e['pageX'] || e.originalEvent.touches[0]['pageX'];
        daysCtx = currentDaysContext();
    }
    function mouseRangeMove(e) {
        if (!anchorX) return;
        var x = e['pageX'] || e.originalEvent.touches[0]['pageX'];
        var delta = Math.round((x - anchorX)/stepPixels);
        info('delta:' + delta+' days:'+daysCtx.current, true);
        adjustRange(daysCtx,delta);
    }
    function mouseRangeEnd(e) {
        anchorX = null;
        daysCtx = null;
    }

    $dygraph = $('#dygraph');
    $dygraph.bind('mousedown', mouseRangeStart);
    $dygraph.bind('mousemove', mouseRangeMove);
    $dygraph.bind('mouseout', mouseRangeEnd);
    $dygraph.bind('mouseup', mouseRangeEnd);
    $dygraph.bind('touchstart', mouseRangeStart);
    $dygraph.bind('touchmove', mouseRangeMove);
    $dygraph.bind('touchend', mouseRangeEnd);

}

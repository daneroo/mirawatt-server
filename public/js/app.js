

function hideURLBar(){
  MBP.hideUrlBar();
}

var globalG
function drawGraph(){
    var numSamples=50;
    var data = [];
    var t = new Date();
    for (var i = numSamples-3; i >= 0; i--) {
      var x = new Date(t.getTime() - i * 1000);
      data.push([x, Math.random()]);
    }

    var options = {
      title: 'Average Power over Time',
      titleHeight: 24,
      logscale : false,

      //showRoller: true, // allows controlling roller
      // rollPeriod: 30, // ok depends on scale

      //rollPeriod: 3,
      // errorBars: true, requires sigma column

      // gridLineColor: '#FF0000',
      // highlightCircleSize: 10,
      strokeWidth: 2,

      axisLabelColor: 'gray',

      colors:['rgb(128,255,128)'],
      // axis:{
      //   'weight':{axisLabelWidth:20}
      // },
      // axisLineColor: 'blue',
      // drawXGrid: false,
      // drawYGrid: false,
      // axisLabelWidth:100, // doesn't seem to do anything
      yAxisLabelWidth:25,

      showLabelsOnHighlight:false,
      // for touch stuff later...
      //interactionModel: interactionModel
      // interactionModel: {},
      //dateWindow: [now-desiredDays*day,now],
      
      //drawPoints: true,
      //showRoller: true,
      //valueRange: [0.0, 1.2],
      labels: ['Time', 'Power (avg)']
    };

    globalG = new Dygraph(document.getElementById("dygraph"), data,options);

    setInterval(function() {
      var x = new Date();  // current time
      var y = Math.random();
      // truncate - could be more efficient
      var toremove=data.length-(numSamples-1);
      if (toremove>0) data.splice(0,toremove);
      data.push([x, y]);
      globalG.updateOptions( { 'file': data } );
    }, 1000);

}

var app = {
  svc:null,
  values:null
}


$(function(){
  hideURLBar();
  $('html').bind('touchmove',function(e){
    e.preventDefault();
  });
  
  // orientation change
  function orientationChange(){
    MBP.viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";    
    hideURLBar();
    if (window.globalG) {
      globalG.resize();
    }
  }
  $(window).bind('orientationchange', orientationChange);
  orientationChange();
  
  //anchorZoomSetup();
  drawGraph();
  
  DNode.connect({reconnect:5000},function (remote) {
    app.svc=remote; // global!
    //refreshData();
  });
});

function info(msg,clear){
  if(clear) $('#console').html('');
  $('#console').append('<div>'+new Date().toISOString()+' '+msg+'</div>');
}



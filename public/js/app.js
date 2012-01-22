

function hideURLBar(){
  MBP.hideUrlBar();
}

function randSensor(){
    return Math.random()*.5+.5;
}
var globalG
function drawGraph(){
    var numSamples=30;
    var data = [];
    var t = new Date();
    for (var i = numSamples-3; i >= 0; i--) {
      var x = new Date(t.getTime() - i * 1000);
      data.push([x, randSensor(),randSensor(),randSensor(),randSensor(),randSensor(),randSensor()]);
    }


    var options = {
      title: 'Average Power over Time',
      titleHeight: 24,
      logscale : false,

      //showRoller: true, // allows controlling roller
      // rollPeriod: 3, // ok depends on scale

      // rollPeriod: 2,
      // errorBars: true, requires sigma column

      // gridLineColor: '#FF0000',
      // highlightCircleSize: 10,
      strokeWidth: 2,

      axisLabelColor: 'gray',

      // colors:['rgb(128,255,128)','rgb(128,192,128)','rgb(128,224,128)'],
      //colors:['hsl(120,100%,50%)','hsl(120,100%,25%)','hsl(120,100%,75%)'],
      colors:[green(1,.5),green(1,.3),green(1,.4),green(1,.5),green(1,.3),green(1,.4)],
      
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
      
      //stepPlot:true,
      fillGraph:true,
      //drawPoints: true,
      //showRoller: true,
      //valueRange: [0.0, 1.2],
      //labels: ['Time', 'Power (avg)']
      labels: ['Time', 'sensor 1','sensor 2','sensor 3','sensor 4','sensor 5','sensor 6'],
      stackedGraph: true
    };

    globalG = new Dygraph(document.getElementById("dygraph"), data,options);

    setInterval(function() {
      var x = new Date();  // current time      
      // truncate - could be more efficient
      var toremove=data.length-(numSamples-1);
      if (toremove>0) data.splice(0,toremove);
      data.push([x, randSensor(),randSensor(),randSensor(),randSensor(),randSensor(),randSensor()]);
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
    var param=43;
    if (0) setInterval(function(){
        app.svc.zing(param,function (err,result) {
            if (err){
                console.log('remote.zing('+param+') Error: ',err);
                param=42;
            } else {
                console.log('remote.zing('+param+') = ' + result);
                param=142;            
            }
        });
    },3000);
  });
});

function info(msg,clear){
  if(clear) $('#console').html('');
  $('#console').append('<div>'+new Date().toISOString()+' '+msg+'</div>');
}



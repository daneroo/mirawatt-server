

function hideURLBar(){
  MBP.hideUrlBar();
}

function randSensor(){
    return Math.random()*.5+.5;
}
function randModel(x,numSensors){ // x is a Date
    var row = [x];
    for (s=0;s<numSensors;s++) row.push(randSensor());
    return row;
}

function miraModel(x,numSensors){ // x is a Date
    var row = [x];
    // for (s=0;s<numSensors;s++) row.push(randSensor());
    var sec = x.getSeconds()/60;
    var m = (sec<=.25)?Math.abs(Math.sin(sec*8*Math.PI)):0;
    var w = (sec>.25 && sec<=.5)?1-Math.abs(Math.sin(sec*8*Math.PI)):1;
    m=4*m;w=4*w;
    row.push(0-m-w,m,w);
    for (s=3;s<numSensors;s++) row.push((sec>.5)?randSensor():0);
    return row;
}

var sourceModel=miraModel;

function hueColorModel(numSensors,h){
    var colors=[];
    for (s=0;s<numSensors;s++) colors.push(hsl(h,1,.3+(s%3)/10));
    for (s=0;s<numSensors;s++) colors.push(hsl(s/numSensors,1,.5));
    return colors;
}
function rainbowColorModel(numSensors){
    var colors=[];
    for (s=0;s<numSensors;s++) colors.push(hsl(h,1,.3+(s%3)/10));
    for (s=0;s<numSensors;s++) colors.push(hsl(s/numSensors,1,.5));
    console.log('colors',colors);
    return colors;
}
var colorModel=hueColorModel;

var globalG
function drawGraph(){
    var numSamples=60;
    var numSensors=10; // min 3 if
    var data = [];
    var t = new Date();
    var i,s;

    var labels=['Time'];
    for (s=0;s<numSensors;s++) labels.push('sensor '+(s+1));

    
    for (i = numSamples; i >= 0; i--) {
      var x = new Date(t.getTime() - i * 1000);
      data.push(sourceModel(x,numSensors));
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
      colors:colorModel(numSensors,(x.getSeconds()%60)/60),
      
      // axis:{
      //   'weight':{axisLabelWidth:20}
      // },
      // axisLineColor: 'blue',
      // drawXGrid: false,
      // drawYGrid: false,
      // axisLabelWidth:100, // doesn't seem to do anything
      yAxisLabelWidth:25,
      xAxisLabelWidth:55, // default 50 dosn't quite cut it...

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
      labels: labels,
      stackedGraph: true
    };

    globalG = new Dygraph(document.getElementById("dygraph"), data,options);

    setInterval(function() {
      var x = new Date();  // current time      
      // truncate - could be more efficient
      var toremove=data.length-(numSamples-1);
      if (toremove>0) data.splice(0,toremove);

      data.push(sourceModel(x,numSensors));
      globalG.updateOptions( { 'file': data, colors:colorModel(numSensors,(x.getSeconds()%60)/60) } );
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



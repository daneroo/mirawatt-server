

function hideURLBar(){
  MBP.hideUrlBar();
}


var globalG
function drawGraph(){
    var model=app.currentModel;
    var options = {
      title: 'Power',
      titleHeight: 24,
      // logscale : false,

      //showRoller: true, // allows controlling roller
      // rollPeriod: 3, // ok depends on scale
      // rollPeriod: 2,
      // errorBars: true, requires sigma column
      // gridLineColor: '#FF0000',
      // highlightCircleSize: 10,
      strokeWidth: 2,
      axisLabelColor: 'gray',
      colors:model.colors,
      
      // axis:{
      //   'weight':{axisLabelWidth:20}
      // },
      // axisLineColor: 'blue',
      // drawXGrid: false,
      // drawYGrid: false,
      // axisLabelWidth:100, // doesn't seem to do anything
      yAxisLabelWidth:15,
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
      labels: model.labels,
      stackedGraph: true
    };

    globalG = new Dygraph(document.getElementById("dygraph"), model.data,options);

}

function updateFromModel(){
    //app.models[0].update(app.models[0]); // time series - rand
    //app.currentModel.update(app.currentModel);    
    var opts =  $.extend({}, { 
        file: app.currentModel.data ,
        colors: app.currentModel.colors ,
        stackedGraph: true,
        includeZero: false
    },app.currentModel.options);
    globalG.updateOptions( opts );
}

function updateFromFeeds(){
  // this is the json fetch - all scopes
  if(0) jsonRPC(app.endpoint,"get",[app.accountId],function(feeds){
    console.log('jsonrpc',feeds);
  });
  // this is the dnode fetch - all scopes
  app.svc.get(app.accountId,function(err,feeds){
    console.log('dnode',err,feeds);
    if (err) {
      console.log('dnode err',err);
      return;
    }
    $.each(feeds,function(scopeId,feed){
      if (!feed) {
        console.log('skipping feed for scopeId',scopeId);
        return;
      }
      
      // scale denoms
      var kw=1000,kwh=1000,kwhpd=1000/24;
      var scale = [kw,kw,kwh,kwhpd,kwhpd][scopeId];
      
      console.log('handling',scopeId,feed.name,feed.obs.length,'scale',scale,feed.obs[0]);
      var nudata=[];
      $.each(feed.obs,function(i,obs){
        var stamp = new Date(obs.t);//.toISOString().substring(0,19);
        var row = [stamp];
        $.each(obs.v,function(s,v){
          row.push(v/scale);
        })
        nudata.push(row);
      });
      nudata.reverse();
      // console.log('nudata',nudata);
      app.models[scopeId].data=nudata;
    });
    
    var opts =  $.extend({}, { 
        file: app.currentModel.data ,
        colors: app.currentModel.colors ,
        stackedGraph: true,
        includeZero: false
    },app.currentModel.options);
    globalG.updateOptions( opts );
  });
  
}

// this was for synth demo
//setInterval(updateFromModel, 1000);
setInterval(updateFromFeeds, 1000);

var app = app || {};
app.svc=null;
app.currentModel = app.models[0];
app.endpoint='/jsonrpc';
app.accountId = 'sample';
app.accountId = 'daniel';

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
  
  $('#home ul li a').click(function(){
      var scopeId = $(this).jqmData('scope-id');
      if (typeof scopeId !='undefined'){
          console.log('change scopeId',scopeId);
          app.currentModel=app.models[scopeId%app.models.length];
          updateFromModel();
      }
  });
  $('#dygraph').click(function(){
      console.log('change scope');
      for (i=0;i<app.models.length;i++){
          if (app.models[i]===app.currentModel){
              console.log('found model:',i);
              app.currentModel=app.models[(i+1)%app.models.length];
              updateFromModel();
              break;
          }
      }
      
  });
  
  $('.feedpickershow').click(function(){
    $('#home .feedpickerwrapper').toggleClass('showing');
  });  
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

// jsonRPC invocation helper
var jsonRPCId=42; // jsonRPC invocation counter
function jsonRPC(endpoint,method,paramsArray,successCB){
  var data = { 
    jsonrpc: "2.0",
    method: method,
    params: paramsArray, 
    id:(++jsonRPCId) 
  };
  $.ajax({
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: endpoint,
    data: JSON.stringify(data),
    success: successCB
  });
}
// jsonRPC(app.endpoint,"set",["001DC9103902",[ets.body]],function(err,result){console.log(err,result)})
//jsonRPC(app.endpoint,"set",["001DC9103902",[ets[0].body,null,null,null]],function(err,result){console.log(err,result)})
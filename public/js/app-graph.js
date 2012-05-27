
var app = app || {};

(function(){
  var dygraph=null;
  
  app.graph = {
    init:init,
    updateOptions:function(opts){
      if (dygraph) dygraph.updateOptions(opts);
    },
    resize:function(){
      if (dygraph) dygraph.resize();
    }
  };
  
  function init(selector){
    console.log('graph.init');
      var model=app.models[app.currentScope];
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

      dygraph = new Dygraph(document.getElementById("dygraph"), model.data,options);

  }
  
})();

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
    // console.log('graph.init');
    var model   = app.models[app.currentScope];
    var options = {
      title: 'Power',
      titleHeight: 24,

      strokeWidth: 2,
      axisLabelColor: 'gray',
      colors:model.colors,

      // axisLabelWidth:100, // doesn't seem to do anything
      yAxisLabelWidth:20,
      xAxisLabelWidth:55, // default 50 dosn't quite cut it...

      showLabelsOnHighlight:false,

      fillGraph:true,
      labels: model.labels,
      stackedGraph: true
    };

    dygraph     = new Dygraph(document.getElementById("dygraph"), model.data,options);
  }
  
})();
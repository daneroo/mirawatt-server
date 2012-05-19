
var app = app || {};

(function(){
    var numSensors=8; // min 3 if

    var s;
    var labels=['Time'];
    for (s=0;s<numSensors;s++) labels.push('sensor '+(s+1));
    
    app.models=[];

    app.models.push({ // Live Scope, made of seconds (and tensecs ?)
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            title: 'Live (kW)',
            stepPlot:false,
            includeZero: true
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        timeRange:0,
        init:function(model){
          var t = quantizeTime( new Date(), 1);
          $.each([5,4,3,2,1,0],function(i,v){
            var value = 1000/1000;
            var x = new Date(t-v*60*1000);
            var row = splitModel(x,value,model.numSensors);
            model.data.push(row);
          });
          model.numSamples=model.data.length;
          model.colors=model.colorModel(model.numSensors,1/3);
        }
    });
    app.models.push({ // Hour Scope, made of minutes
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            title: 'Hour (kW)',
            stepPlot:false,
            includeZero: true
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        init:function(model){
          var t = quantizeTime( new Date(), 1);
          $.each([4,3,2,1,0],function(i,v){
            var value = 1000/1000;
            var x = new Date(t-v*15*60*1000);
            var row = splitModel(x,value,model.numSensors);
            model.data.push(row);
          });
          model.numSamples=model.data.length;
          model.colors=model.colorModel(model.numSensors,2/3);
        }
    });
    app.models.push({ // Day Scope, made of hours
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            title: 'Day (kWh)',
            stepPlot:true,
            includeZero: true
        },
        labels:labels,
        colors:null,
        colorModel:rainbowColorModel,
        init:function(model){
          var t = quantizeTime( new Date(), 2);
            $.each([6,5,4,3,2,1,0],function(i,v){
                var value = 1000/1000;
                var x = new Date(t-v*4*60*60*1000);
                var row = splitModel(x,value,model.numSensors);
                model.data.push(row);
            });
            model.numSamples=model.data.length;
            model.colors=model.colorModel(model.numSensors,3/3);
        }
    });
    app.models.push({ // Month Scope, made of days
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            title: 'Month (kWh/d)',
            includeZero: true,
            stepPlot:true
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        init:function(model){
          var t = quantizeTime( new Date(), 3);
          $.each([6,5,4,3,2,1,0],function(i,v){
            var value = kWhPd(1000);
            var x = new Date(t-v*5*24*60*60*1000);
            var row = splitModel(x,value,model.numSensors);
            model.data.push(row);
          });
          model.numSamples=model.data.length;
          model.colors=model.colorModel(model.numSensors,3/3);
        }
    });
    app.models.push({ // Year Scope, made of months
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            title: 'Year over Year (kWh/d)',
            includeZero: true,
            stepPlot:true,
            stackedGraph: true
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        init:function(model){
          var t = quantizeTime(new Date(),4);
          for (i=24;i>=0;i--){
            var value = kWhPd(1000);
            var x = new Date(t-i*30*24*60*60*1000);
            var row = splitModel(x,value,model.numSensors);
            model.data.push(row);
          }
          model.numSamples=model.data.length;
          model.colors=model.colorModel(model.numSensors,2/3);
        }
    });

    app.models[0].init(app.models[0]);
    app.models[1].init(app.models[1]);
    app.models[2].init(app.models[2]);
    app.models[3].init(app.models[3]);
    app.models[4].init(app.models[4]);

    function quantizeTime(d,upto){
      var q = new Date(d);
      var setters=['setMilliseconds','setSeconds','setMinutes','setHours','setDate'];
      for (var u=0;u<=upto;u++){
        q[setters[u]](u==4?1:0); // setXXX(0), except setDate(1);
      }
      console.log(setters[upto],d.toISOString(),'',q.toISOString());
      return q;
    }
    function kWhPd(watt){
        return watt*24.0/1000.0
    }
    function normalize(weights){
        var sum=0;
        for (s=0;s<weights.length;s++) sum+=weights[s];
        for (s=0;s<weights.length;s++) weights[s]/=sum;
    }
    function splitModel(x,v,numSensors){ // x is a Date
        var weights=[];
        for (s=0;s<numSensors;s++) weights.push(Math.random()+.5);
        normalize(weights);
        var row = [x];
        for (s=0;s<numSensors;s++) row.push(v*weights[s]);
        return row;
    }

    function randSensor(){
        return Math.random()*.5+.5;
    }

    function hueColorModel(numSensors,h){
        var colors=[];
        for (s=0;s<numSensors;s++) colors.push(hsl(h,1,.3+(s%3)/10));
        for (s=0;s<numSensors;s++) colors.push(hsl(s/numSensors,1,.5));
        return colors;
    }
    function rainbowColorModel(numSensors,h){
        var colors=[];
        //for (s=0;s<numSensors;s++) colors.push(hsl(h,1,.3+(s%3)/10));
        for (s=0;s<numSensors;s++) colors.push(hsl(s/numSensors,1,.5));
        //console.log('colors',colors);
        return colors;
    }

})();


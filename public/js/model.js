
var app = app || {};

(function(){
    var numSensors=10; // min 3 if

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
            var t = new Date();            
            t.setMilliseconds(0);
            //t.setSeconds(0);
            //t.setMinutes(0);
            //t.setHours(0);
            //t.setDate(1);
            var scopeId=0;
            var feed=feeds()[scopeId];
            model.numSamples=feed.observations.length;
            var delta = t.getTime()-Date.parse(feed.stamp);
            $.each(feed.observations,function(i,v){
                var value = Math.round(v[1])/1000;
                var x = new Date(Date.parse(v[0]) + delta);
                var row = splitModel(x,value,model.numSensors);
                model.data.push(row);
            });
            model.data.reverse();            
            model.colors=model.colorModel(model.numSensors,1/3);
            model.timeRange=model.data[model.data.length-1][0]-model.data[0][0];
            console.log('range',model.timeRange);
        },
        update:function(model){
            var x = new Date();  // current time      
            // truncate - could be more efficient
            value=randSensor()*2;
            var row = splitModel(x,value,model.numSensors);
            
            model.data.push(row);

            var timeRange=model.data[model.data.length-1][0]-model.data[0][0];
            console.log('++range',timeRange);
            
            if (timeRange>model.timeRange){
                var toremove=1;  //model.data.length-(model.numSamples-1);
                if (toremove>0) model.data.splice(0,toremove);
            }
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
            var t = new Date();            
            t.setMilliseconds(0);
            t.setSeconds(0);
            //t.setMinutes(0);
            //t.setHours(0);
            //t.setDate(1);
            var scopeId=1
            var feed=feeds()[scopeId];
            model.numSamples=feed.observations.length;
            var delta = t.getTime()-Date.parse(feed.stamp);
            $.each(feed.observations,function(i,v){
                var value = Math.round(v[1])/1000;
                var x = new Date(Date.parse(v[0]) + delta);
                var row = splitModel(x,value,model.numSensors);
                model.data.push(row);
            });
            model.data.reverse();            
            model.colors=model.colorModel(model.numSensors,2/3);
        },
        update:function(model){
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
            var t = new Date();            
            t.setMilliseconds(0);
            t.setSeconds(0);
            t.setMinutes(0);
            //t.setHours(0);
            //t.setDate(1);
            var scopeId=2
            var feed=feeds()[scopeId];
            model.numSamples=feed.observations.length;
            var delta = t.getTime()-Date.parse(feed.stamp);
            $.each(feed.observations,function(i,v){
                var value = Math.round(v[1])/1000;
                var x = new Date(Date.parse(v[0]) + delta);
                var row = splitModel(x,value,model.numSensors);
                model.data.push(row);
            });
            model.data.reverse();            
            model.colors=model.colorModel(model.numSensors,3/3);
        },
        update:function(model){
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
            var t = new Date();            
            t.setMilliseconds(0);
            t.setSeconds(0);
            t.setMinutes(0);
            t.setHours(0);
            //t.setDate(1);
            var scopeId=3
            var feed=feeds()[scopeId];
            model.numSamples=feed.observations.length;
            var delta = t.getTime()-Date.parse(feed.stamp);
            $.each(feed.observations,function(i,v){
                var value = Math.round(kWhPd(v[1]));
                var x = new Date(Date.parse(v[0]) + delta);
                var row = splitModel(x,value,model.numSensors);
                model.data.push(row);
            });
            model.data.reverse();            
            model.colors=model.colorModel(model.numSensors,3/3);
        },
        update:function(model){
        }
    });
    app.models.push({ // Year Scope, made of months
        numSensors:2,
        numSamples:0,
        data:[],
        options:{
            title: 'Year over Year (kWh/d)',
            includeZero: true,
            stepPlot:true,
            stackedGraph: false
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        init:function(model){
            var t = new Date();            
            t.setMilliseconds(0);
            //t.setSeconds(0);
            //t.setMinutes(0);
            //t.setHours(0);
            //t.setDate(1);
            var scopeId=4
            var feed=feeds()[scopeId];
            model.numSamples=12;//feed.observations.length/2;
            var delta = t.getTime()-Date.parse(feed.stamp);
            for (i=0;i<12;i++){
                var v=feed.observations[i];
                var value1 = kWhPd(v[1]);
                var x = new Date(Date.parse(v[0]));
                
                var value2 = null;
                if (i+12<feed.observations.length){
                    value2=kWhPd(feed.observations[i+12][1]);
                }
                model.data.push([x,value1,value2]);
            }
            model.data.reverse();
            model.colors=model.colorModel(model.numSensors,1/3);
        },
        update:function(model){
        }
    });



    app.models[0].init(app.models[0]);
    //console.log(app.models[0]);
    app.models[1].init(app.models[1]);
    //console.log(app.models[1]);
    app.models[2].init(app.models[2]);
    //console.log(app.models[2]);
    app.models[3].init(app.models[3]);
    // console.log(app.models[3]);
    app.models[4].init(app.models[4]);
    // console.log(app.models[4]);

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

    function sampleState() { return { 
        minute: { 
            '2012-01-30T17:40:00.000Z': { sum: 117140, n: 60 },
            '2012-01-30T17:41:00.000Z': { sum: 120280, n: 60 },
            '2012-01-30T17:42:00.000Z': { sum: 135510, n: 60 },
            '2012-01-30T17:43:00.000Z': { sum: 154840, n: 60 },
            '2012-01-30T17:44:00.000Z': { sum: 153440, n: 60 },
            '2012-01-30T17:45:00.000Z': { sum: 151260, n: 60 },
            '2012-01-30T17:46:00.000Z': { sum: 148810, n: 60 },
            '2012-01-30T17:47:00.000Z': { sum: 145010, n: 60 },
            '2012-01-30T17:48:00.000Z': { sum: 118280, n: 60 },
            '2012-01-30T17:49:00.000Z': { sum: 117690, n: 60 },
            '2012-01-30T17:50:00.000Z': { sum: 114530, n: 60 },
            '2012-01-30T17:51:00.000Z': { sum: 108600, n: 60 },
            '2012-01-30T17:52:00.000Z': { sum: 88380, n: 60 },
            '2012-01-30T17:53:00.000Z': { sum: 34150, n: 60 },
            '2012-01-30T17:54:00.000Z': { sum: 36560, n: 60 },
            '2012-01-30T17:55:00.000Z': { sum: 67100, n: 60 },
            '2012-01-30T17:56:00.000Z': { sum: 68600, n: 60 },
            '2012-01-30T17:57:00.000Z': { sum: 66800, n: 60 },
            '2012-01-30T17:58:00.000Z': { sum: 62870, n: 60 },
            '2012-01-30T17:59:00.000Z': { sum: 64210, n: 60 },
            '2012-01-30T18:00:00.000Z': { sum: 38760, n: 60 },
            '2012-01-30T18:01:00.000Z': { sum: 32990, n: 60 },
            '2012-01-30T18:02:00.000Z': { sum: 34140, n: 60 },
            '2012-01-30T18:03:00.000Z': { sum: 32770, n: 60 },
            '2012-01-30T18:04:00.000Z': { sum: 29170, n: 60 },
            '2012-01-30T18:05:00.000Z': { sum: 31760, n: 60 },
            '2012-01-30T18:06:00.000Z': { sum: 30100, n: 60 },
            '2012-01-30T18:07:00.000Z': { sum: 33400, n: 60 },
            '2012-01-30T18:08:00.000Z': { sum: 67410, n: 60 },
            '2012-01-30T18:09:00.000Z': { sum: 67630, n: 60 },
            '2012-01-30T18:10:00.000Z': { sum: 67130, n: 60 },
            '2012-01-30T18:11:00.000Z': { sum: 64150, n: 60 },
            '2012-01-30T18:12:00.000Z': { sum: 63210, n: 60 },
            '2012-01-30T18:13:00.000Z': { sum: 35090, n: 60 },
            '2012-01-30T18:14:00.000Z': { sum: 82080, n: 60 },
            '2012-01-30T18:15:00.000Z': { sum: 251640, n: 60 },
            '2012-01-30T18:16:00.000Z': { sum: 285370, n: 60 },
            '2012-01-30T18:17:00.000Z': { sum: 286380, n: 60 },
            '2012-01-30T18:18:00.000Z': { sum: 285170, n: 60 },
            '2012-01-30T18:19:00.000Z': { sum: 284590, n: 60 },
            '2012-01-30T18:20:00.000Z': { sum: 292640, n: 60 },
            '2012-01-30T18:21:00.000Z': { sum: 314860, n: 60 },
            '2012-01-30T18:22:00.000Z': { sum: 314110, n: 60 },
            '2012-01-30T18:23:00.000Z': { sum: 313760, n: 60 },
            '2012-01-30T18:24:00.000Z': { sum: 310680, n: 60 },
            '2012-01-30T18:25:00.000Z': { sum: 313900, n: 60 },
            '2012-01-30T18:26:00.000Z': { sum: 285290, n: 60 },
            '2012-01-30T18:27:00.000Z': { sum: 146320, n: 60 },
            '2012-01-30T18:28:00.000Z': { sum: 108630, n: 60 },
            '2012-01-30T18:29:00.000Z': { sum: 108650, n: 60 },
            '2012-01-30T18:30:00.000Z': { sum: 110560, n: 60 },
            '2012-01-30T18:31:00.000Z': { sum: 109190, n: 60 },
            '2012-01-30T18:32:00.000Z': { sum: 109500, n: 60 },
            '2012-01-30T18:33:00.000Z': { sum: 121230, n: 60 },
            '2012-01-30T18:34:00.000Z': { sum: 143440, n: 60 },
            '2012-01-30T18:35:00.000Z': { sum: 141260, n: 60 },
            '2012-01-30T18:36:00.000Z': { sum: 140600, n: 60 },
            '2012-01-30T18:37:00.000Z': { sum: 137180, n: 60 }},
        hour: { 
         '2012-01-28T20:00:00.000Z': { sum: 15482410, n: 3600 },
         '2012-01-28T21:00:00.000Z': { sum: 14584647, n: 3600 },
         '2012-01-28T22:00:00.000Z': { sum: 8581850, n: 3594 },
         '2012-01-28T23:00:00.000Z': { sum: 3399360, n: 3561 },
         '2012-01-29T00:00:00.000Z': { sum: 3608770, n: 3316 },
         '2012-01-29T01:00:00.000Z': { sum: 4664220, n: 3600 },
         '2012-01-29T02:00:00.000Z': { sum: 5410490, n: 3600 },
         '2012-01-29T03:00:00.000Z': { sum: 6155850, n: 3600 },
         '2012-01-29T04:00:00.000Z': { sum: 6823750, n: 3600 },
         '2012-01-29T05:00:00.000Z': { sum: 3644320, n: 3600 },
         '2012-01-29T06:00:00.000Z': { sum: 3524540, n: 3600 },
         '2012-01-29T07:00:00.000Z': { sum: 2772550, n: 3600 },
         '2012-01-29T08:00:00.000Z': { sum: 2730330, n: 3594 },
         '2012-01-29T09:00:00.000Z': { sum: 2660390, n: 3580 },
         '2012-01-29T10:00:00.000Z': { sum: 2631210, n: 3272 },
         '2012-01-29T11:00:00.000Z': { sum: 2464000, n: 3436 },
         '2012-01-29T12:00:00.000Z': { sum: 2719820, n: 3599 },
         '2012-01-29T13:00:00.000Z': { sum: 5859330, n: 3590 },
         '2012-01-29T14:00:00.000Z': { sum: 13270410, n: 3600 },
         '2012-01-29T15:00:00.000Z': { sum: 7191190, n: 3600 },
         '2012-01-29T16:00:00.000Z': { sum: 3891830, n: 3600 },
         '2012-01-29T17:00:00.000Z': { sum: 3044880, n: 3600 },
         '2012-01-29T18:00:00.000Z': { sum: 8121280, n: 3592 },
         '2012-01-29T19:00:00.000Z': { sum: 6822130, n: 3587 },
         '2012-01-29T20:00:00.000Z': { sum: 13714380, n: 3315 },
         '2012-01-29T21:00:00.000Z': { sum: 10263020, n: 3564 },
         '2012-01-29T22:00:00.000Z': { sum: 7686410, n: 3600 },
         '2012-01-29T23:00:00.000Z': { sum: 12925586, n: 3600 },
         '2012-01-30T00:00:00.000Z': { sum: 8418600, n: 3600 },
         '2012-01-30T01:00:00.000Z': { sum: 6222080, n: 3600 },
         '2012-01-30T02:00:00.000Z': { sum: 9062160, n: 3600 },
         '2012-01-30T03:00:00.000Z': { sum: 4053820, n: 3600 },
         '2012-01-30T04:00:00.000Z': { sum: 2889990, n: 3600 },
         '2012-01-30T05:00:00.000Z': { sum: 2003830, n: 3591 },
         '2012-01-30T06:00:00.000Z': { sum: 2438880, n: 3468 },
         '2012-01-30T07:00:00.000Z': { sum: 2392230, n: 3406 },
         '2012-01-30T08:00:00.000Z': { sum: 2850940, n: 3600 },
         '2012-01-30T09:00:00.000Z': { sum: 3187720, n: 3600 },
         '2012-01-30T10:00:00.000Z': { sum: 4797980, n: 3600 },
         '2012-01-30T11:00:00.000Z': { sum: 3186640, n: 3600 },
         '2012-01-30T12:00:00.000Z': { sum: 8215730, n: 3600 },
         '2012-01-30T13:00:00.000Z': { sum: 10250920, n: 3600 },
         '2012-01-30T14:00:00.000Z': { sum: 2849720, n: 3600 },
         '2012-01-30T15:00:00.000Z': { sum: 3546050, n: 3595 },
         '2012-01-30T16:00:00.000Z': { sum: 5296470, n: 3567 },
         '2012-01-30T17:00:00.000Z': { sum: 8554560, n: 3266 },
         '2012-01-30T18:00:00.000Z': { sum: 5636240, n: 2285 } },
      day: 
       {
         '2012-01-01T05:00:00.000Z': { sum: 132171630, n: 85405 },
         '2012-01-02T05:00:00.000Z': { sum: 117836150, n: 85704 },
         '2012-01-03T05:00:00.000Z': { sum: 120764990, n: 85298 },
         '2012-01-04T05:00:00.000Z': { sum: 183535480, n: 85702 },
         '2012-01-05T05:00:00.000Z': { sum: 150838700, n: 85678 },
         '2012-01-06T05:00:00.000Z': { sum: 154029370, n: 85400 },
         '2012-01-07T05:00:00.000Z': { sum: 122337536, n: 85682 },
         '2012-01-08T05:00:00.000Z': { sum: 120702290, n: 85703 },
         '2012-01-09T05:00:00.000Z': { sum: 166881555, n: 85325 },
         '2012-01-10T05:00:00.000Z': { sum: 99939760, n: 85676 },
         '2012-01-11T05:00:00.000Z': { sum: 144649800, n: 85659 },
         '2012-01-12T05:00:00.000Z': { sum: 162649107, n: 85337 },
         '2012-01-13T05:00:00.000Z': { sum: 138354170, n: 85670 },
         '2012-01-14T05:00:00.000Z': { sum: 100672640, n: 85677 },
         '2012-01-15T05:00:00.000Z': { sum: 121893690, n: 85366 },
         '2012-01-16T05:00:00.000Z': { sum: 139873880, n: 85676 },
         '2012-01-17T05:00:00.000Z': { sum: 149818350, n: 85654 },
         '2012-01-18T05:00:00.000Z': { sum: 143720410, n: 85366 },
         '2012-01-19T05:00:00.000Z': { sum: 131546630, n: 85699 },
         '2012-01-20T05:00:00.000Z': { sum: 150568395, n: 85667 },
         '2012-01-21T05:00:00.000Z': { sum: 163730090, n: 85289 },
         '2012-01-22T05:00:00.000Z': { sum: 160046780, n: 85737 },
         '2012-01-23T05:00:00.000Z': { sum: 147612760, n: 85594 },
         '2012-01-24T05:00:00.000Z': { sum: 182532350, n: 85203 },
         '2012-01-25T05:00:00.000Z': { sum: 165395600, n: 85826 },
         '2012-01-26T05:00:00.000Z': { sum: 145378639, n: 85505 },
         '2012-01-27T05:00:00.000Z': { sum: 108955390, n: 85235 },
         '2012-01-28T05:00:00.000Z': { sum: 156393517, n: 85591 },
         '2012-01-29T05:00:00.000Z': { sum: 146584256, n: 85529 },
         '2012-01-30T05:00:00.000Z': { sum: 65207910, n: 48378 } },
      month: { keep: 12 },
      year: { keep: 1000 },
      all: { sum: 8692755535, n: 5284112 } }
  };
  function feeds() { return [
    {
      "scopeId": 0,
      "name": "Live",
      "stamp": "2012-01-31T02:21:59Z",
      "value": 1610,
      "observations": [
        [
          "2012-01-31T02:21:59Z",
          "1610"
        ],
        [
          "2012-01-31T02:21:58Z",
          "1610"
        ],
        [
          "2012-01-31T02:21:57Z",
          "1610"
        ],
        [
          "2012-01-31T02:21:56Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:55Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:54Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:53Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:52Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:51Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:50Z",
          "1600"
        ],
        [
          "2012-01-31T02:21:40Z",
          "1601"
        ],
        [
          "2012-01-31T02:21:30Z",
          "1602"
        ],
        [
          "2012-01-31T02:21:20Z",
          "1601"
        ],
        [
          "2012-01-31T02:21:10Z",
          "1601"
        ],
        [
          "2012-01-31T02:21:00Z",
          "1626"
        ],
        [
          "2012-01-31T02:20:50Z",
          "1672"
        ],
        [
          "2012-01-31T02:20:40Z",
          "1627"
        ],
        [
          "2012-01-31T02:20:30Z",
          "1600"
        ],
        [
          "2012-01-31T02:20:20Z",
          "1601"
        ],
        [
          "2012-01-31T02:20:10Z",
          "1606"
        ],
        [
          "2012-01-31T02:20:00Z",
          "1610"
        ],
        [
          "2012-01-31T02:19:50Z",
          "1603"
        ],
        [
          "2012-01-31T02:19:40Z",
          "1607"
        ],
        [
          "2012-01-31T02:19:30Z",
          "1611"
        ],
        [
          "2012-01-31T02:19:20Z",
          "1874"
        ],
        [
          "2012-01-31T02:19:10Z",
          "2100"
        ],
        [
          "2012-01-31T02:19:00Z",
          "2057"
        ],
        [
          "2012-01-31T02:18:50Z",
          "1934"
        ],
        [
          "2012-01-31T02:18:40Z",
          "1938"
        ],
        [
          "2012-01-31T02:18:30Z",
          "1931"
        ],
        [
          "2012-01-31T02:18:20Z",
          "1931"
        ],
        [
          "2012-01-31T02:18:10Z",
          "1930"
        ],
        [
          "2012-01-31T02:18:00Z",
          "1932"
        ],
        [
          "2012-01-31T02:17:50Z",
          "1937"
        ],
        [
          "2012-01-31T02:17:40Z",
          "1993"
        ],
        [
          "2012-01-31T02:17:30Z",
          "1959"
        ],
        [
          "2012-01-31T02:17:20Z",
          "1921"
        ],
        [
          "2012-01-31T02:17:10Z",
          "1925"
        ],
        [
          "2012-01-31T02:17:00Z",
          "1986"
        ],
        [
          "2012-01-31T02:16:50Z",
          "1990"
        ]
      ]
    },
    {
      "scopeId": 1,
      "name": "Hour",
      "stamp": "2012-01-31T02:21:00Z",
      "value": 1707,
      "observations": [
        [
          "2012-01-31T02:21:00Z",
          "1605"
        ],
        [
          "2012-01-31T02:20:00Z",
          "1619"
        ],
        [
          "2012-01-31T02:19:00Z",
          "1809"
        ],
        [
          "2012-01-31T02:18:00Z",
          "1933"
        ],
        [
          "2012-01-31T02:17:00Z",
          "1954"
        ],
        [
          "2012-01-31T02:16:00Z",
          "1997"
        ],
        [
          "2012-01-31T02:15:00Z",
          "2004"
        ],
        [
          "2012-01-31T02:14:00Z",
          "2027"
        ],
        [
          "2012-01-31T02:13:00Z",
          "1754"
        ],
        [
          "2012-01-31T02:12:00Z",
          "1479"
        ],
        [
          "2012-01-31T02:11:00Z",
          "1479"
        ],
        [
          "2012-01-31T02:10:00Z",
          "1461"
        ],
        [
          "2012-01-31T02:09:00Z",
          "1458"
        ],
        [
          "2012-01-31T02:08:00Z",
          "1881"
        ],
        [
          "2012-01-31T02:07:00Z",
          "1901"
        ],
        [
          "2012-01-31T02:06:00Z",
          "1956"
        ],
        [
          "2012-01-31T02:05:00Z",
          "1949"
        ],
        [
          "2012-01-31T02:04:00Z",
          "1850"
        ],
        [
          "2012-01-31T02:03:00Z",
          "1758"
        ],
        [
          "2012-01-31T02:02:00Z",
          "1326"
        ],
        [
          "2012-01-31T02:01:00Z",
          "1318"
        ],
        [
          "2012-01-31T02:00:00Z",
          "1312"
        ],
        [
          "2012-01-31T01:59:00Z",
          "1310"
        ],
        [
          "2012-01-31T01:58:00Z",
          "1453"
        ],
        [
          "2012-01-31T01:57:00Z",
          "1806"
        ],
        [
          "2012-01-31T01:56:00Z",
          "1802"
        ],
        [
          "2012-01-31T01:55:00Z",
          "1886"
        ],
        [
          "2012-01-31T01:54:00Z",
          "1869"
        ],
        [
          "2012-01-31T01:53:00Z",
          "1862"
        ],
        [
          "2012-01-31T01:52:00Z",
          "1656"
        ],
        [
          "2012-01-31T01:51:00Z",
          "1332"
        ],
        [
          "2012-01-31T01:50:00Z",
          "1312"
        ],
        [
          "2012-01-31T01:49:00Z",
          "1335"
        ],
        [
          "2012-01-31T01:48:00Z",
          "1321"
        ],
        [
          "2012-01-31T01:47:00Z",
          "1603"
        ],
        [
          "2012-01-31T01:46:00Z",
          "1815"
        ],
        [
          "2012-01-31T01:45:00Z",
          "1846"
        ],
        [
          "2012-01-31T01:44:00Z",
          "1881"
        ],
        [
          "2012-01-31T01:43:00Z",
          "1885"
        ],
        [
          "2012-01-31T01:42:00Z",
          "1911"
        ],
        [
          "2012-01-31T01:41:00Z",
          "1456"
        ],
        [
          "2012-01-31T01:40:00Z",
          "1453"
        ],
        [
          "2012-01-31T01:39:00Z",
          "1470"
        ],
        [
          "2012-01-31T01:38:00Z",
          "1450"
        ],
        [
          "2012-01-31T01:37:00Z",
          "1450"
        ],
        [
          "2012-01-31T01:36:00Z",
          "1841"
        ],
        [
          "2012-01-31T01:35:00Z",
          "1947"
        ],
        [
          "2012-01-31T01:34:00Z",
          "1971"
        ],
        [
          "2012-01-31T01:33:00Z",
          "2030"
        ],
        [
          "2012-01-31T01:32:00Z",
          "2037"
        ],
        [
          "2012-01-31T01:31:00Z",
          "2019"
        ],
        [
          "2012-01-31T01:30:00Z",
          "1566"
        ],
        [
          "2012-01-31T01:29:00Z",
          "1490"
        ],
        [
          "2012-01-31T01:28:00Z",
          "1490"
        ],
        [
          "2012-01-31T01:27:00Z",
          "1499"
        ],
        [
          "2012-01-31T01:26:00Z",
          "1529"
        ],
        [
          "2012-01-31T01:25:00Z",
          "1964"
        ],
        [
          "2012-01-31T01:24:00Z",
          "1971"
        ],
        [
          "2012-01-31T01:23:00Z",
          "2028"
        ],
        [
          "2012-01-31T01:22:00Z",
          "2030"
        ]
      ]
    },
    {
      "scopeId": 2,
      "name": "Day",
      "stamp": "2012-01-31T02:00:00Z",
      "value": 1541,
      "observations": [
        [
          "2012-01-31T02:00:00Z",
          "1720"
        ],
        [
          "2012-01-31T01:00:00Z",
          "1720"
        ],
        [
          "2012-01-31T00:00:00Z",
          "1757"
        ],
        [
          "2012-01-30T23:00:00Z",
          "2423"
        ],
        [
          "2012-01-30T22:00:00Z",
          "5138"
        ],
        [
          "2012-01-30T21:00:00Z",
          "1916"
        ],
        [
          "2012-01-30T20:00:00Z",
          "803"
        ],
        [
          "2012-01-30T19:00:00Z",
          "741"
        ],
        [
          "2012-01-30T18:00:00Z",
          "1849"
        ],
        [
          "2012-01-30T17:00:00Z",
          "2711"
        ],
        [
          "2012-01-30T16:00:00Z",
          "1494"
        ],
        [
          "2012-01-30T15:00:00Z",
          "986"
        ],
        [
          "2012-01-30T14:00:00Z",
          "792"
        ],
        [
          "2012-01-30T13:00:00Z",
          "2848"
        ],
        [
          "2012-01-30T12:00:00Z",
          "2282"
        ],
        [
          "2012-01-30T11:00:00Z",
          "885"
        ],
        [
          "2012-01-30T10:00:00Z",
          "1333"
        ],
        [
          "2012-01-30T09:00:00Z",
          "886"
        ],
        [
          "2012-01-30T08:00:00Z",
          "792"
        ],
        [
          "2012-01-30T07:00:00Z",
          "705"
        ],
        [
          "2012-01-30T06:00:00Z",
          "704"
        ],
        [
          "2012-01-30T05:00:00Z",
          "558"
        ],
        [
          "2012-01-30T04:00:00Z",
          "803"
        ],
        [
          "2012-01-30T03:00:00Z",
          "1126"
        ]
      ]
    },
    {
      "scopeId": 3,
      "name": "Month",
      "stamp": "2012-01-30T05:00:00Z",
      "value": 1662,
      "observations": [
        [
          "2012-01-30T05:00:00Z",
          "1593"
        ],
        [
          "2012-01-29T05:00:00Z",
          "1718"
        ],
        [
          "2012-01-28T05:00:00Z",
          "1820"
        ],
        [
          "2012-01-27T05:00:00Z",
          "1275"
        ],
        [
          "2012-01-26T05:00:00Z",
          "1693"
        ],
        [
          "2012-01-25T05:00:00Z",
          "1924"
        ],
        [
          "2012-01-24T05:00:00Z",
          "2134"
        ],
        [
          "2012-01-23T05:00:00Z",
          "1715"
        ],
        [
          "2012-01-22T05:00:00Z",
          "1870"
        ],
        [
          "2012-01-21T05:00:00Z",
          "1930"
        ],
        [
          "2012-01-20T05:00:00Z",
          "1752"
        ],
        [
          "2012-01-19T05:00:00Z",
          "1553"
        ],
        [
          "2012-01-18T05:00:00Z",
          "1681"
        ],
        [
          "2012-01-17T05:00:00Z",
          "1741"
        ],
        [
          "2012-01-16T05:00:00Z",
          "1645"
        ],
        [
          "2012-01-15T05:00:00Z",
          "1426"
        ],
        [
          "2012-01-14T05:00:00Z",
          "1177"
        ],
        [
          "2012-01-13T05:00:00Z",
          "1617"
        ],
        [
          "2012-01-12T05:00:00Z",
          "1904"
        ],
        [
          "2012-01-11T05:00:00Z",
          "1682"
        ],
        [
          "2012-01-10T05:00:00Z",
          "1167"
        ],
        [
          "2012-01-09T05:00:00Z",
          "1975"
        ],
        [
          "2012-01-08T05:00:00Z",
          "1404"
        ],
        [
          "2012-01-07T05:00:00Z",
          "1426"
        ],
        [
          "2012-01-06T05:00:00Z",
          "1810"
        ],
        [
          "2012-01-05T05:00:00Z",
          "1755"
        ],
        [
          "2012-01-04T05:00:00Z",
          "2137"
        ],
        [
          "2012-01-03T05:00:00Z",
          "1419"
        ],
        [
          "2012-01-02T05:00:00Z",
          "1370"
        ],
        [
          "2012-01-01T05:00:00Z",
          "1546"
        ]
      ]
    },
    {
      "scopeId": 4,
      "name": "Year",
      "stamp": "2012-01-30T05:00:00Z",
      "value": 1510,
      "observations": [
        [
          "2012-01-01T05:00:00Z",
          "1662"
        ],
        [
          "2011-12-01T05:00:00Z",
          "1635"
        ],
        [
          "2011-11-01T04:00:00Z",
          "1442"
        ],
        [
          "2011-10-01T04:00:00Z",
          "1233"
        ],
        [
          "2011-09-01T04:00:00Z",
          "1369"
        ],
        [
          "2011-08-01T04:00:00Z",
          "1327"
        ],
        [
          "2011-07-01T04:00:00Z",
          "1540"
        ],
        [
          "2011-06-01T04:00:00Z",
          "1393"
        ],
        [
          "2011-05-01T04:00:00Z",
          "1432"
        ],
        [
          "2011-04-01T04:00:00Z",
          "1575"
        ],
        [
          "2011-03-01T05:00:00Z",
          "1557"
        ],
        [
          "2011-02-01T05:00:00Z",
          "1719"
        ],
        [
          "2011-01-01T05:00:00Z",
          "1814"
        ],
        [
          "2010-12-01T05:00:00Z",
          "1766"
        ],
        [
          "2010-11-01T04:00:00Z",
          "1625"
        ],
        [
          "2010-10-01T04:00:00Z",
          "1366"
        ],
        [
          "2010-09-09T04:00:00Z",
          "1336"
        ],
        [
          "2010-07-01T04:00:00Z",
          "1344"
        ],
        [
          "2010-06-01T04:00:00Z",
          "1288"
        ],
        [
          "2010-05-01T04:00:00Z",
          "1526"
        ],
        [
          "2010-04-01T04:00:00Z",
          "1484"
        ],
        [
          "2010-03-01T05:00:00Z",
          "1602"
        ],
        [
          "2010-02-01T05:00:00Z",
          "1625"
        ],
        [
          "2010-01-01T05:00:00Z",
          "1612"
        ]
      ]
    }
  ];
};

      app.feeds=feeds();
      app.samples=sampleState();

})();


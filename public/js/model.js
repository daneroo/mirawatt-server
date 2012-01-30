
var app = app || {};

(function(){
    var numSensors=10; // min 3 if

    var s;
    var labels=['Time'];
    for (s=0;s<numSensors;s++) labels.push('sensor '+(s+1));
    
    app.models=[];

    app.models.push({ // Live - made of seconds
        numSensors:numSensors,
        numSamples:60,
        data:[],
        options:{
            stepPlot:false
        },
        labels:labels,
        colors:null,
        sourceModel:randModel,
        colorModel:hueColorModel,
        init:function(model){
            var t = new Date();            
            var i;
            for (i = model.numSamples; i >= 0; i--) {
              var x = new Date(t.getTime() - i * 1000);
              model.data.push(model.sourceModel(x,model.numSensors));
            }
            model.colors=model.colorModel(model.numSensors,1/3);
        },
        update:function(model){
            var x = new Date();  // current time      
            // truncate - could be more efficient
            var toremove=model.data.length-(model.numSamples-1);
            if (toremove>0) model.data.splice(0,toremove);
            model.data.push(model.sourceModel(x,model.numSensors));
        }
    });
    app.models.push({ // Hour Scope, made of minutes
        numSensors:numSensors,
        numSamples:0,
        data:[],
        options:{
            stepPlot:false
        },
        labels:labels,
        colors:null,
        colorModel:hueColorModel,
        init:function(model){
            var t = new Date();            
            t.setMilliseconds(0);
            t.setSeconds(0);
            var scope=sampleState().minute;
            console.log('minute',scope);
            $.each(scope,function(k,v){
                model.numSamples++;
            });
            var i=model.numSamples;
            $.each(scope,function(k,v){
                var x = new Date(t.getTime() - i * 60000);
                console.log(x.toISOString(),k,v.sum/v.n)
                model.data.push(splitModel(x,v.sum/v.n,model.numSensors));
                i--;
            });
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
            stepPlot:true
        },
        labels:labels,
        colors:null,
        colorModel:rainbowColorModel,
        init:function(model){
            var t = new Date();            
            t.setMilliseconds(0);
            t.setSeconds(0);
            t.setMinutes(0);
            var scope=sampleState().hour;
            console.log('hour',scope);
            $.each(scope,function(k,v){
                model.numSamples++;
            });
            var i=model.numSamples;
            $.each(scope,function(k,v){
                var x = new Date(t.getTime() - i * 60000);
                console.log(x.toISOString(),k,v.sum/v.n)
                model.data.push(splitModel(x,v.sum/v.n,model.numSensors));
                i--;
            });
            model.colors=model.colorModel(model.numSensors,3/3);
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

    function splitModel(x,v,numSensors){ // x is a Date
        var row = [x];
        for (s=0;s<numSensors;s++) row.push(v/numSensors);
        return row;
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
      app.samples=sampleState();

})();


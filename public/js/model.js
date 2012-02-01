
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
        },
        update:function(model){
            var x = new Date();  // current time      
            // truncate - could be more efficient
            value=randSensor()*2;
            var row = splitModel(x,value,model.numSensors);
            
            model.data.push(row);

            var timeRange=model.data[model.data.length-1][0]-model.data[0][0];
            
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

})();


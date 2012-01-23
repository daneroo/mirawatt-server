
/**
 * Module dependencies.
 */
var request = require('request');

function client (options) {
  if (typeof options === 'string') options = {uri:options}
  var req = request.defaults(options);
  var client = {
    call : function(method, params, callback) {
      // request can encode our object for us
      // is adds content-type, and content-length approprately
      // it also json decodes the response !
      var opts = {
        json:{
          'jsonrpc': '2.0',
          'id': +new Date(), // made this into an int for connect-jsonrpc, not technically required to be an int
          'method': method,
          'params': params
        }
        // headers:{
        //   'Content-Type':'application/json; charset=utf-8',
        //   'Content-Length' : requestJSON.length
        // },
        // body:requestJSON
      }
      req.post(opts,function (error, response, body) {
        if (!typeof callback==='function') return;        
        if (error) { // this error is from request-lib
          console.log('request.error',error);
          callback(error);
          return;
        }
        try {
          var response = body;//JSON.parse(body);
          if (response.error) {
            callback(response.error);
            return;
          }
          callback(null, response.result);
          return;
        } catch (decodeError) { 
          // done in request now with opt:{json:...} but how do I trap errors ? parse above is not done by me
          callback({message:'Could not decode JSON response',data:body});
          return;
        }
      });
      console.log('called',arguments);
    }
  };
  return client;
}

/**
  * export the stup() function
  */
module.exports = client
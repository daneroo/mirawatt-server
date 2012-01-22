# Mirawatt Server

## Initial deployment to cloudfoundry
When it's up, you can find it [here](http://mirawatt.cloudfoundry.com)

    # if not yet created...
    vmc push mirawatt

    # to push an update
    vmc update mirawatt


## Boilerplate
Start from [HTML5 mobile boilerplate](https://github.com/h5bp/mobile-boilerplate) index.html.
Do not use it's build system, will try to minimise with express/connect.
  
* index.html
* add jQuery mobile, downgrade to jQ 1.6.4
* icons and startup
* js
* mobile-boookmark-bubble
* crossdomain
* appcache

## Transport and RPC

* [JSON-rpc client](https://github.com/andyfowler/node-jsonrpc-client)
* [JSON-rpc connect middleware](https://github.com/visionmedia/connect-jsonrpc) by visionmedia (TJ Holowaychuk)
* dnode client transport using xhr-polling ?

### curl command to invoke jsonrpc service

  curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "zing", "params": [42], "id":2 }' http://localhost:3000/jsonrpc

### node client to invoke jsonrpc-service

  node client.js

### node client to invoke dnode-service (local-only)
  
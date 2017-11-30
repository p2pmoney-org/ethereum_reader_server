/**
 * 
 */
'use strict';

// instantiating global object
var Global = require('./includes/global.js');

var global = Global.getGlobalInstance();

global.log("Started service: " + global.service_name);

// displaying settings
global.log("web3 provider: " + global.web3_provider_url + " on port " + global.web3_provider_port);
global.log("processing a maximum of blocks per request of  :" + global.max_processed_blocks);
global.log("returning a maximum of blocks per request of   :" + global.max_returned_blocks);
global.log("processing a maximum of transactions of        :" + global.max_processed_transactions);
global.log("returning a maximum of transactions of         :" + global.max_returned_transactions);
global.log("size of blocks in memory cache of              :" + (global.max_block_map_factor_size * global.max_returned_blocks));
global.log("size of accounts in memory cache of            :" + global.max_account_map_size );
global.log("logging enabled (e.g. in console)              :" + global.enable_log);
global.log("writing to file ./logs/server.log (if present) :" + global.write_to_log_file);
global.log("anonymous request limit                        :" + global.enable_anonymous_request_limit);
global.log("anonymous request limit of requests            :" + global.max_anonymous_request_limit_limit);
global.log("anonymous request windows in seconds           :" + global.max_anonymous_request_limit_windows/1000);

// instantiating express
var express = require('express'),
app = express();

global.log("");
global.log("Using express in mode      : " + app.settings.env);
global.log("and case sensitive routing : " + app.settings["case sensitive routing"]);

// add middleware to check requests (apikey,..)
// (should be done before loading routes!)
global.log("Adding middleware to validate requests")
var RequestValidator = require('./includes/requestvalidator.js');

var requestvalidator = new RequestValidator();

app.use(requestvalidator.validate)


// load routes
global.log("Loading routes")
var routes = require('../api/routes/routes.js'); //importing route
routes(app); //register the route



// start listening thread
var port = process.env.PORT || global.server_listening_port;

app.listen(port);

// terminating boot strap
var now = new Date();
global.log("REST API server started on: " + port);
global.log("at " + now.toISOString() + " UTC time");

/**
 * 
 */
'use strict';

// instantiating global object
var Global = require('./includes/global.js');

var global = Global.getGlobalInstance();

global.log("Started service: " + global.service_name);

// instantiating express
var express = require('express'),
app = express();

global.log("Using express in mode %s and case sensitive routing %s", app.settings.env, app.settings["case sensitive routing"]);

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
global.log("REST API server started on: " + port + " at " + now.toISOString() + " UTC time");

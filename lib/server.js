/**
 * 
 */
'use strict';

// instantiating global object
var Global = require('./includes/global.js');

var global = Global.getGlobalInstance();

console.log("Started service: " + global.service_name);

// instantiating express
var express = require('express'),
app = express();

console.log("Using express in mode %s and case sensitive routing %s", app.settings.env, app.settings["case sensitive routing"]);

// load routes
var routes = require('../api/routes/routes.js'); //importing route
routes(app); //register the route


// start listening thread
var port = process.env.PORT || global.server_listening_port;

app.listen(port);

// terminating boot strap
console.log("REST API server started on: " + port);

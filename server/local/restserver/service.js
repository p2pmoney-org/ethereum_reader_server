/**
 * 
 */
'use strict';

var globalinstance;
var webapp;

class Service {
	
	constructor() {
		this.name = 'restserver';
		this.global = null;
		
		this.app = null;
		this.server = null;
		this.debug = null;

		this.apikeys = [];
	
	}
	
	loadService() {
		this.global.log('loadService called for service ' + this.name);
		
		globalinstance = this.global;

		this.RequestValidator = require('./model/requestvalidator.js');

		var global = this.global;
		var config = global.config;

		// rate limit for anonymous requests
		this.enable_anonymous_request_limit = (config && config["enable_anonymous_request_limit"] ? parseInt(config["enable_anonymous_request_limit"]) : 0); 
		this.max_anonymous_request_limit_windows = (config && config["max_anonymous_request_limit_windows"]  ? parseInt(config["max_anonymous_request_limit_windows"]) : 600000);
		this.max_anonymous_request_limit_limit = (config && config["max_anonymous_request_limit_limit"]  ? parseInt(config["max_anonymous_request_limit_limit"]) : 10);
		
		var apikeysjson = (config && config["apikeys"] ? config["apikeys"]  : null);

		for(var key in apikeysjson)
			this.apikeys.push(apikeysjson[key]);		
	}
	
	getApiKeys() {
		return this.apikeys;
	}
	
	startRestServer() {
		var global = this.global;
		
		// instantiating express
		var express = require('express');
		var app = express();
		
		this.app = app;

		global.log("Using express in mode      : " + app.settings.env);
		global.log("and case sensitive routing : " + app.settings["case sensitive routing"]);
		global.log("");
		
		return app;
	}
	
	startMiddleware() {
		var global = this.global;
		var app = this.app;
		
		global.log("Adding middle-ware to validate requests")

		// add middle-ware to check requests (apikey,..)
		// (should be done before loading routes!)
		var RequestValidator = this.RequestValidator;

		var requestvalidator = new RequestValidator(global, this);

		app.use(function(req, res, next) { return requestvalidator.validate(req, res, next);})

		// add body-parser as middle-ware for posts.
		var BodyParser = require("body-parser");

		app.use(BodyParser.urlencoded({ extended: true }));
		app.use(BodyParser.json());
		
		
		//
		// routes for REST APIs
		//

		// load routes
		global.log("Loading routes")
		
		var apiroot = '../api';
		
		var routes = global.require( apiroot + '/routes/routes.js'); //importing route
		routes(app, global); //register the route



		// start listening thread
		var port = process.env.PORT || global.server_listening_port;

		app.listen(port);

		// terminating boot strap
		var now = new Date();
		global.log("REST API server started on: " + port);
		global.log("at " + now.toISOString() + " UTC time");
	}
	
	// static
	static getGlobalInstance() {
		return globalinstance;
	}
}


module.exports = Service;

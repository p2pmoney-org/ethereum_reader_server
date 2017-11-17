'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();

var ExpressRateLimit = require('express-rate-limit');

// instantiate ExpressRateLimit is json.config has enabled it
var expressratelimit = (global.enable_anonymous_request_limit == 1 ? new ExpressRateLimit({
																			windowMs: global.max_anonymous_request_limit_windows,  
																			max: global.max_anonymous_request_limit_limit, 
																			delayMs: 0
																			}) 
																	: null);

class RequestValidator {
	
    validate(req, res, next) {
    	var now = new Date();
    	
    	global.log("validating request " + req.originalUrl + " at " + now.toISOString() + " UTC time");
    	
    	// TODO: implement a check on presence of a valid apiKey token
    	// if not, set some wait time if number of request per second
    	// has been exceeded
    	
    	var nolimit = false;
 
    	global.log("apikeys passed is " + global.apikeys);
    			
    	if (global.apikeys !== null) {
    		// we read the apikey, if one has been sent
    		var apikey = req.get("apikey");
    		
    		global.log("apikey passed is " + apikey);
    		
    		if (global.apikeys.includes(apikey) ) {
        		global.log("unlimited access");
    			nolimit = true;
    		}
    	}
    	
		if ((expressratelimit !== null) && (nolimit === false)) {
			// a limit has been set, and the client is not unlimited
			// we pass the request to expressratelimit
			return expressratelimit(req, res, next);
		}
       next();
    }
 }


module.exports = RequestValidator;

'use strict';


class RequestValidator {
	constructor(glob, restservice) {
		this.global = glob;
		this.restserverservice = restservice;
		
		var ExpressRateLimit = require('express-rate-limit');

		// instantiate ExpressRateLimit is json.config has enabled it
		this.expressratelimit = (global.enable_anonymous_request_limit == 1 ? new ExpressRateLimit({
																					windowMs: global.max_anonymous_request_limit_windows,  
																					max: global.max_anonymous_request_limit_limit, 
																					delayMs: 0
																					}) 
																			: null);
	}
	
    validate(req, res, next) {
    	var now = new Date();
    	
		var global = this.global;
		
    	global.log("validating request " + req.originalUrl + " at " + now.toISOString() + " UTC time");
    	
    	// TODO: implement a check on presence of a valid apiKey token
    	// if not, set some wait time if number of request per second
    	// has been exceeded
    	
    	var nolimit = false;
    	
    	var restserverservice = this.restserverservice;
    	
    	var apikeys = restserverservice.getApiKeys();
      			
    	if (apikeys !== null) {
    	   	global.log("apikeys passed is " + apikeys);

    	   	// we read the apikey, if one has been sent
    		var apikey = req.get("apikey");
    		
    		global.log("apikey passed is " + apikey);
    		
    		if (apikeys.includes(apikey) ) {
        		global.log("unlimited access");
    			nolimit = true;
    		}
    	}
    	
		if ((this.expressratelimit !== null) && (nolimit === false)) {
			// a limit has been set, and the client is not unlimited
			// we pass the request to expressratelimit
			return this.expressratelimit(req, res, next);
		}
       next();
    }
 }


module.exports = RequestValidator;

'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();


class RequestValidator {
	
    validate(req, res, next) {
    	var now = new Date();
    	
    	global.log("validating request " + req.originalUrl + " at " + now.toISOString() + " UTC time");
    	
    	// TODO: implement a check on presence of a valid apiKey token
    	// if not, set some wait time if number of request per second
    	// has been exceeded
    	
        next();
    }
 }


module.exports = RequestValidator;

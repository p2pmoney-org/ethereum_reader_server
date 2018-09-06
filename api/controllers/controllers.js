/**
 * 
 */

'use strict';

var Global = require('../../server/includes/common/global.js');

var global = Global.getGlobalInstance();

var commonservice = global.getServiceInstance('common');
var Session = commonservice.Session;



//global Routes
exports.version = function(req, res) {
	var jsonresult = {status: 1, version:  "0.0.1"};
  	
  	res.json(jsonresult);
  	
}


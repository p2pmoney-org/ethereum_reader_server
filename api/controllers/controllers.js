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
	var jsonresult = {status: 1
			, data: [ {version:  global.current_version}]};
	
	res.json(jsonresult);
}


exports.version_support = function(req, res) {
	var version_support = global.getVersionSupported();
	
	var jsonlist = [];

	for (var i = 0; i < version_support.length; i++) {
		jsonlist.push({version:  version_support[i]});
	}
	
	var jsonresult = {status: 1
			, data: jsonlist};
	
	res.json(jsonresult);
}


/**
 * 
 */

'use strict';


module.exports = function(app, global) {

	//
	// Root routes
	//
	var route_root_path = global.route_root_path;

	var Controller = require('../controllers/controllers.js');
	
	app.route(route_root_path + '/')
	.get(Controller.version);
	app.route(route_root_path + '/version')
	.get(Controller.version);

	var localroot = '../../server/local';
	
	//
	// EthReader routes
	//
	var EthReaderRoutes = require( localroot + '/ethreader/routes/routes.js');
		
	var ethreaderroutes = new EthReaderRoutes(app, global);
	
	ethreaderroutes.registerRoutes();

};
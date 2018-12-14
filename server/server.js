/**
 * 
 */
'use strict';


//setting environment variables
var process = require('process');

if (!process.env.root_dir) {
	var path = require('path');
	process.env.root_dir = path.join(__dirname, '..');
}

if (!process.env.NODE_PATH) {
	process.env.NODE_PATH = path.join(__dirname, '../node_modules');
}

//instantiating global object
var Global = require('./includes/common/global.js');

// setting global var in Global
if (process.env.ETHEREUM_READER_SERVER_BASE_DIR) {
	Global.ETHEREUM_WEBAPP_BASE_DIR = process.env.ETHEREUM_READER_SERVER_BASE_DIR;
}

if (process.env.ETHEREUM_READER_SERVER_EXEC_DIR) {
	Global.ETHEREUM_WEBAPP_EXEC_DIR = process.env.ETHEREUM_READER_SERVER_EXEC_DIR;
}


// instantiating global object
var global = Global.getGlobalInstance();

// force logging
/*global.releaseConsoleLog();
global.enable_log = 1;
global.execution_env = 'dev';


if (global.execution_env) {
	// DEBUG
	//Error.stackTraceLimit = Infinity;
	// DEBUG
}*/

global.current_version = "0.1.0";
global.version_support = ["0.0.1", "0.1.0"];




global.log("*********");
global.log("Starting server: " + global.service_name);

global.log("");
global.log("Base directory: " + global.base_dir);
global.log("Execution directory: " + global.execution_dir);
global.log("Configuration file: " + global.config_path);
global.log("Execution environment: " + global.execution_env);
global.log("*********");
global.log("");
global.log("****Server initialization*****");

if (global.options.length) {
	global.log("command line options:" + global.options.toString());
}
else {
	global.log("no command line options passed,");
	global.log("remember to use -- --command=value (e.g. -- --conf=)");
	global.log("if you want to pass options");
	
}

global.log("****Server initialization*****");

//register services
var Service;

//local services
Service = require('./local/restserver/service.js');
var restservice = new Service();
global.registerServiceInstance(restservice);

Service = require('./local/ethreader/service.js');
var ethreaderservice = new Service();
global.registerServiceInstance(ethreaderservice);

//standard services (in ./includes)

//initialization
try {
	global.initServer();
}
catch(e) {
	global.log("ERROR during initServer: " + e);
	global.log(e.stack);
}



global.log("");
global.log("*********");

// displaying settings
global.log("web3 provider: " + global.web3_provider_url + " on port " + global.web3_provider_port);
global.log("logging enabled (e.g. in console)              :" + global.enable_log);
global.log("writing to file ./logs/server.log (if present) :" + global.write_to_log_file);

global.log("");
global.log("****Ethereum Reader*****");
global.log("processing a maximum of blocks per request of  :" + ethreaderservice.max_processed_blocks);
global.log("returning a maximum of blocks per request of   :" + ethreaderservice.max_returned_blocks);
global.log("processing a maximum of transactions of        :" + ethreaderservice.max_processed_transactions);
global.log("returning a maximum of transactions of         :" + ethreaderservice.max_returned_transactions);
global.log("size of blocks in memory cache of              :" + (ethreaderservice.max_block_map_factor_size * ethreaderservice.max_returned_blocks));
global.log("size of accounts in memory cache of            :" + ethreaderservice.max_account_map_size );

global.log("");
global.log("****Rest Server*****");
global.log("anonymous request limit                        :" + restservice.enable_anonymous_request_limit);
global.log("anonymous request limit of requests            :" + restservice.max_anonymous_request_limit_limit);
global.log("anonymous request windows in seconds           :" + restservice.max_anonymous_request_limit_windows/1000);


//
//Express
//

global.log("");

global.log("****Loading express*****");

//starting express
var app = global.getServiceInstance('restserver').startRestServer();

//
// middle-ware
global.getServiceInstance('restserver').startMiddleware();

global.log("*********");


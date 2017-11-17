/**
 * 
 */
'use strict';

var GlobalInstance;
//var GlobalWeb3;


class Global {
	
	constructor() {
		var fs = require('fs');
		var path = require('path');
		
		// log file
		this.logPath = null;
		
		try {
			var logPath = path.join(__dirname, '../..', 'logs', 'server.log');
			
			if (fs.existsSync(logPath)) {
				this.logPath = logPath;
			}	
			
		}
		catch(e) {
			this.log('exception checking log file: ' + e.message); 
		}
		
		// json config file
		var jsonPath;
		var jsonFile;
		var config;
		
		try {
			jsonPath = path.join(__dirname, '../..', 'settings', 'config.json');
			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			config = JSON.parse(jsonFile);
			
		}
		catch(e) {
			this.log('exception reading json file: ' + e.message); 
		}
		
		this.current_version = "0.0.1";
		this.version_support = ["0.0.0", "0.0.1"];

		this.service_name = (config && config["service_name"] ? config["service_name"] : 'no name');
		this.server_listening_port = (config && config["server_listening_port"] ? config["server_listening_port"] : 13000);
		this.route_root_path = (config && config["route_root_path"] ? config["route_root_path"] : '/api');
		this.web3_provider_url = (config && config["web3_provider_url"] ? config["web3_provider_url"] : 'http://localhost');
		this.web3_provider_port= (config && config["web3_provider_port"] ? config["web3_provider_port"] : '8545');
		
		// limit of blocks processed within a single request, if overloaded in config.json
		this.max_processed_blocks = (config && config["max_processed_blocks"] && (config["max_processed_blocks"] > 100 ) ? config["max_processed_blocks"] : 100);
		this.max_processed_transactions = (config && config["max_processed_transactions"] && (config["max_processed_transactions"] > 100 ) ? config["max_processed_transactions"] : 100);

		// limits for number of items returned, if overloaded in config.json
		this.max_returned_blocks = (config && config["max_returned_blocks"] && (config["max_returned_blocks"] > 50 ) ? config["max_returned_blocks"] : 50);
		this.max_returned_transactions = (config && config["max_returned_transactions"] && (config["max_returned_transactions"] > 50 ) ? config["max_returned_transactions"] : 50);
		
		// logging
		this.enable_log = (config && config["enable_log"] ? config["enable_log"] : 1);
		this.write_to_log_file = (config && config["write_to_log_file"] ? config["write_to_log_file"] : 0);
		
		
		// global objects
		this.web3 = null;
		
		// size factors for block map (factor of max_returned_blocks e.g; 200 * 1000 = 200 000 blocks)
		this.block_map_factor_size = (config && config["block_map_factor_size"] ? config["block_map_factor_size"] : 10); 
		this.max_block_map_factor_size = (config && config["max_block_map_factor_size"]  ? config["max_block_map_factor_size"] : 20);
		
		
		// account map
		this.account_map_size = (config && config["account_map_size"] ? config["account_map_size"] : 5); 
		this.max_account_map_size = (config && config["max_account_map_size"]  ? config["max_account_map_size"] : 10);
		
		// rate limit for anonymous requests
		this.enable_anonymous_request_limit = (config && config["enable_anonymous_request_limit"] ? parseInt(config["enable_anonymous_request_limit"]) : 0); 
		this.max_anonymous_request_limit_windows = (config && config["max_anonymous_request_limit_windows"]  ? parseInt(config["max_anonymous_request_limit_windows"]) : 600000);
		this.max_anonymous_request_limit_limit = (config && config["max_anonymous_request_limit_limit"]  ? parseInt(config["max_anonymous_request_limit_limit"]) : 10);
		
		var apikeysjson = (config && config["apikeys"] ? config["apikeys"]  : null);
		this.apikeys = [];
		for(var i in apikeysjson)
			this.apikeys.push(apikeysjson[i]);		
	}
	
	getWeb3ProviderFullUrl() {
		return this.web3_provider_url + ':' + this.web3_provider_port;
	};
	
	getWeb3Provider() {
		
		if (!this.web3) {
			var Web3 = require('web3');

			var web3providerfullurl = this.getWeb3ProviderFullUrl();
			
			this.web3 = new Web3(
				    new Web3.providers.HttpProvider(web3providerfullurl)
				);
		}
		
		return this.web3;
	}
	
	log(string) {
		if (this.enable_log == 0)
			return; // logging to console disabled
		
		var line = new Date().toISOString() + ": ";
		
		line += string;
		
		console.log(line);
		
		if ( (this.write_to_log_file != 0)  && (this.logPath != null )) {
			var fs = require('fs');

			// also write line in log/server.log
			fs.appendFileSync(this.logPath, line + '\r');
		}
	}
	
	isNumber(value) {
		if (!isNaN(value))
			return true;
		else
			return false;
	}
	
	EthToUnixTime(time) {
		return 1000 * time; // eth timestamps are in seconds
	}
	
	UnixToEthTime(time) {
		return time/1000; // eth timestamps are in seconds
	}
	
	getZeroAMTimeStamp() {
		var now = new Date();
		var nowyear = now.getFullYear();
		var nowmonth= now.getMonth();
		var nowday = now.getDate();
		this.log("year " + nowyear + " month " + nowmonth + " day " + nowday);
		
		var zeroam = new Date(nowyear, nowmonth, nowday, 0, 0, 0, 0);
		var zeroamtimestamp = zeroam.getTime();
		
		this.log("zero am is " + new Date(zeroamtimestamp).toISOString());
		
		return zeroamtimestamp;
	}
	
	static getGlobalInstance() {
		if (!GlobalInstance)
			GlobalInstance = new Global();
		
		return GlobalInstance;
	}
}

module.exports = Global;



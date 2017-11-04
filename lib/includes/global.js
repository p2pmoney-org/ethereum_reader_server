/**
 * 
 */
'use strict';

var GlobalInstance;
var GlobalWeb3;


class Global {
	
	constructor() {
		var fs = require('fs');
		var path = require('path');
		var jsonPath;
		var jsonFile;
		var config;
		
		try {
			jsonPath = path.join(__dirname, '../..', 'settings', 'config.json');
			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			config = JSON.parse(jsonFile);
			
		}
		catch(e) {
			console.log('exception reading json file: ' + e.message); 
		}
		
		this.current_version = "0.0.1";
		this.version_support = ["0.0.0", "0.0.1"];

		this.service_name = (config["service_name"] ? config["service_name"] : 'no name');
		this.server_listening_port = (config["server_listening_port"] ? config["server_listening_port"] : 13000);
		this.route_root_path = (config["route_root_path"] ? config["route_root_path"] : '/api');
		this.web3_provider_url = (config["web3_provider_url"] ? config["web3_provider_url"] : 'http://localhost');
		this.web3_provider_port= (config["web3_provider_port"] ? config["web3_provider_port"] : '8545');
	}
	
	getWeb3ProviderFullUrl() {
		return this.web3_provider_url + ':' + this.web3_provider_port;
	};
	
	getWeb3Provider() {
		
		if (!GlobalWeb3) {
			var Web3 = require('web3');

			var web3providerfullurl = this.getWeb3ProviderFullUrl();
			
			GlobalWeb3 = new Web3(
				    new Web3.providers.HttpProvider(web3providerfullurl)
				);
		}
		
		return GlobalWeb3;
	}
	
	log(string) {
		console.log(string);
	}
	
	static getGlobalInstance() {
		if (!GlobalInstance)
			GlobalInstance = new Global();
		
		return GlobalInstance;
	}
}

module.exports = Global;



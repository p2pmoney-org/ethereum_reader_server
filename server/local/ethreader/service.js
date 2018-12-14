/**
 * 
 */
'use strict';

var globalinstance;
var moduleinstance;


class Service {
	
	constructor() {
		this.name = 'ethreader';
		this.global = null;
		
		moduleinstance = this;
	}
	
	loadService() {
		this.global.log('loadService called for service ' + this.name);
		
		globalinstance = this.global;
		
		var config = global.config;
		
		this.Account = require('./model/account.js');
		this.Block = require('./model/block.js');
		this.Contract = require('./model/contract.js');
		this.EthereumNode = require('./model/ethnode.js');
		this.Statistics = require('./model/statistics.js');
		this.Transaction = require('./model/transaction.js');
		this.Utility = require('./model/utility.js');

		this.current_version = "0.1.0";
		this.version_support = ["0.0.1", "0.1.0"];

		// limit of blocks processed within a single request, if overloaded in config.json
		this.max_processed_blocks = (config && config["max_processed_blocks"] && (config["max_processed_blocks"] > 20 ) ? config["max_processed_blocks"] : 20);
		this.max_processed_transactions = (config && config["max_processed_transactions"] && (config["max_processed_transactions"] > 50 ) ? config["max_processed_transactions"] : 50);

		// limits for number of items returned, if overloaded in config.json
		this.max_returned_blocks = (config && config["max_returned_blocks"] && (config["max_returned_blocks"] > 10 ) ? config["max_returned_blocks"] : 10);
		this.max_returned_transactions = (config && config["max_returned_transactions"] && (config["max_returned_transactions"] > 25 ) ? config["max_returned_transactions"] : 25);
		
		
		// size factors for block map (factor of max_returned_blocks e.g; 200 * 1000 = 200 000 blocks)
		this.block_map_factor_size = (config && config["block_map_factor_size"] ? config["block_map_factor_size"] : 100); 
		this.max_block_map_factor_size = (config && config["max_block_map_factor_size"]  ? config["max_block_map_factor_size"] : 200);
		
		
		// account map
		this.account_map_size = (config && config["account_map_size"] ? config["account_map_size"] : 5); 
		this.max_account_map_size = (config && config["max_account_map_size"]  ? config["max_account_map_size"] : 10);
		
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
	
	getCurrentTimeStamp() {
		var now = new Date();
		
		return now.getTime();
	}
	
	getZeroAMTimeStamp() {
		var now = new Date();
		var nowyear = now.getFullYear();
		var nowmonth= now.getMonth();
		var nowday = now.getDate();
		//this.log("year " + nowyear + " month " + nowmonth + " day " + nowday);
		
		var zeroam = new Date(nowyear, nowmonth, nowday, 0, 0, 0, 0);
		var zeroamtimestamp = zeroam.getTime();
		
		this.log("zero am is " + new Date(zeroamtimestamp).toISOString());
		
		return zeroamtimestamp;
	}
	
	getEthereumNodeInstance(session) {
		return new this.EthereumNode(session);
	}
	
	// web3
	getWeb3Instance() {
		var global = this.global;
		
		if (this.web3instance)
			return this.web3instance;
		
		var Web3 = global.require('web3');

		var web3Provider = this.getWeb3Provider();
		
		this.web3instance = new Web3(web3Provider);		
		
		this.log("ethereum reader web3 instance created");
		
		return this.web3instance;
	}
	
	getWeb3Provider() {
		var global = this.global;
		
		var Web3 = global.require('web3');

		var web3providerfullurl = global.getWeb3ProviderFullUrl();
		
		var web3Provider =   new Web3.providers.HttpProvider(web3providerfullurl);
		
		
		return web3Provider;
	}
	
	
	
	// utils
	log(string) {
		return this.global.log(string);
	}
	
	// static
	static getGlobalInstance() {
		return moduleinstance;
	}

}

module.exports = Service;
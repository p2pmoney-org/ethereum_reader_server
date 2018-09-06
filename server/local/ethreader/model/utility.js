'use strict';

var Global = require('../service.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Instance();

var ETHER_TO_WEI = 1000000000000000000;

class BlockScan {
	constructor() {
		this.highestblocksearched = null;
		this.lowestblocksearched = null;
	}
	
	getHighestBlockSearched() {
		return this.highestblocksearched;
	}
	
	setHighestBlockSearched(blocknumber) {
		this.highestblocksearched = blocknumber;
	}
	
	getLowestBlockSearched() {
		return this.lowestblocksearched;
	}
	
	setLowestBlockSearched(blocknumber) {
		this.lowestblocksearched = blocknumber;
	}
	
}

class MethodParam {
	constructor(name, type, value) {
		this.name = name;
		this.type = type;
		this.value = value;
	}
}

class Utility {
	
	// rest interface
	static getBlockScanObject() {
		return new BlockScan();
	}
	
	static getParamFromJson(json) {
		var name = json.name;
		var type = json.type;
		var value = json.value; // could do type checking and parsing if necessary
		
		var param = new MethodParam(name, type, value);
		
		return param;
	}
	
	// ethereum interface
	static getWeiFromEther(numofether) {
		var wei = numofether * ETHER_TO_WEI;

		return wei;
	}
	
}


module.exports = Utility;

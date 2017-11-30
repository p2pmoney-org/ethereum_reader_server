'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

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

class Utility {
	
	static getBlockScanObject() {
		return new BlockScan();
	}
	
	
	static getWeiFromEther(numofether) {
		var wei = numofether * ETHER_TO_WEI;

		return wei;
	}
}


module.exports = Utility;

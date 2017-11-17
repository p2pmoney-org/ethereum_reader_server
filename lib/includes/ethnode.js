'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var GlobalEthNode = null;


class EthereumNode {
	
	constructor() {
	}
	
	
	isListening() {
		var listening = null;
		
		var finished = false;
		//var util = require('util');
		//global.log(util.inspect(web3));
		var promise =  web3.eth.net.isListening(function(error, result) {
			
			if (!error) {
				
				if(result !== false) {
					listening = result;
					 
				    global.log("node is listening");
				}
				else {
					listening = false;
					
				    global.log("node is NOT listening");
				}
				
				finished = true;
			  } else {
				  listening = null;
					
				  global.log('Web3 error: ' + error);
				  finished = true;
			  }
			});

		// wait to turn into synchronous call
		while(finished === false)
		{require('deasync').runLoopOnce();}
		
		return listening;
	}
	
	getPeerCount() {
		var peercount = null;
		
		var finished = false;
		var promise =  web3.eth.net.getPeerCount(function(error, result) {
			
			if (!error) {
				
				peercount = result;
				
				finished = true;
			  } else {
				  peercount = null;
					
				  global.log('Web3 error: ' + error);
				  finished = true;
			  }
			});

		// wait to turn into synchronous call
		while(finished === false)
		{require('deasync').runLoopOnce();}
		
		return peercount;
	}
	
	
	
	getSyncingArray() {
		var syncing = null;
		
		var finished = false;
		var promise =  web3.eth.isSyncing(function(error, result) {
			
			if (!error) {
				
				if(result !== false) {
					syncing = true;
					 
					var arr = [];

					for(var key in result){
					  arr[key] = result[key];
					}
					
					syncing = arr;
					
				    global.log("node is syncing");
				}
				else {
					syncing = false;
					
				    global.log("node is NOT syncing");
				}
				
				finished = true;
			  } else {
				  syncing = null;
					
				  global.log('Web3 error: ' + error);
				  finished = true;
			  }
			});

		// wait to turn into synchronous call
		while(finished === false)
		{require('deasync').runLoopOnce();}
		
		return syncing;
	}
	
	isSyncing() {
		var issyncing = this.getSyncingArray();
		
		issyncing = (issyncing === false ? false : true);
		
		return issyncing;
	}
	
	getBlockNumber() {
	    global.log("Block.getBlockNumber called");
		var blocknumber;
		
		var promise =  web3.eth.getBlockNumber(function(error, result) {
			
			if (!error) {
				blocknumber = result;
			  } else {
				  blocknumber = -1;
				  
				  global.log('Web3 error: ' + error);
			  }
			});

		// wait to turn into synchronous call
		while(blocknumber === undefined)
		{require('deasync').runLoopOnce();}
		
	    global.log("blocknumber is " + blocknumber);
		return blocknumber;
	}
	
	getMinedBlocksNumber(sinceblocknumber) {
		var currentblocknumber = this.getCurrentBlockNumber();
		
		return (currentblocknumber - sinceblocknumber);
	}
	
	
	getCurrentBlockNumber() {
	    global.log("EthereumNode.getCurrentBlockNumber called");
		var blocknumber;
		
		var syncingobj = this.getSyncingArray();
		
		blocknumber = ((syncingobj !== false) && (syncingobj) && (syncingobj['currentBlock']) ? syncingobj['currentBlock'] : false);
		
		if (blocknumber === false)
			blocknumber = this.getBlockNumber();
		
	    global.log("currentblocknumber is " + blocknumber);
		return blocknumber;
	}
	
	getHighestBlockNumber() {
	    global.log("EthereumNode.getHighestBlockNumber called");
		var blocknumber;
		
		var syncingobj = this.getSyncingArray();
		
		blocknumber = ((syncingobj !== false) && (syncingobj) && (syncingobj['highestBlock']) ? syncingobj['highestBlock'] : false);
		
		if (blocknumber === false)
			blocknumber = this.getBlockNumber();
		
	    global.log("highestblocknumber is " + blocknumber);
		return blocknumber;
	}
	
	static getBlocksLeftNumber() {
	    global.log("EthereumNode.getBlocksLeftNumber called");
		var blocknumber;
		
		var syncingobj = this.getSyncingArray();
		
		blocknumber = ((syncingobj !== false) && (syncingobj) && (syncingobj['currentBlock'])  && (syncingobj['highestBlock'])? syncingobj['highestBlock'] - syncingobj['currentBlock'] : false);
		
		if (blocknumber === false)
			blocknumber = 0;
		
	    global.log("blockleftnumber is " + blocknumber);
		return blocknumber;
	}

	static getEthNode() {
		if (GlobalEthNode != null)
			return GlobalEthNode;
		
		GlobalEthNode = new EthereumNode();
		
		return GlobalEthNode;
	}
	
	
}

module.exports = EthereumNode;
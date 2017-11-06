'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var Account = require('./account.js');
var Transaction = require('./transaction.js');


class Block {
	
	
	constructor() {
		this.blocknumber = -1;
		
		// we initialize members
		this.difficulty = null;
		this.extraData = null;
		this.gasLimit = null;
		this.gasUsed = null;
		this.hash = null;
		this.logsBloom =  null;
		this.miner = null;
		this.mixHash = null;
		this.nonce = null;
		this.number = null;
		this.parentHash = null;
		this.receiptsRoot = null;
		this.sha3Uncles = null;
		this.size = null;
		this.stateRoot = null;
		this.timestamp = null;
		this.totalDifficulty = null;
		this.transactions = null;
		this.transactionsRoot = null;
		this.uncles = null;			
		
		
		this.data = null; // raw data coming back from web3
		
		// list of transactions as objects
		this.transactionarray = null;
	}
	
	getBlockNumber() {
		return this.blocknumber;
	}
	
	getNumber() {
		return this.blocknumber;
	}
	
	getData() {
		return this.data;
	}
	
	getTimeStamp() {
		return this.timestamp;
	}
	
	setData(data) {
		this.data = data;
		
		if (data == null)
			return
		
		// we set members
		
		this.difficulty = data.difficulty;
		this.extraData = data.extraData;
		this.gasLimit = data.gasLimit;
		this.gasUsed = data.gasUsed;
		this.hash = data.hash;
		this.logsBloom =  data.logsBloom;
		this.miner = data.miner;
		this.mixHash = data.mixHash;
		this.nonce = data.nonce;
		this.number = data.number;
		this.parentHash = data.parentHash;
		this.receiptsRoot = data.receiptsRoot;
		this.sha3Uncles = data.sha3Uncles;
		this.size = data.size;
		this.stateRoot = data.stateRoot;
		this.timestamp = data.timestamp;
		this.totalDifficulty = data.totalDifficulty;
		this.transactions = data.transactions;
		this.transactionsRoot = data.transactionsRoot;
		this.uncles = data.uncles;	
		
		// list of transactions as objects (after initialization of block's members)
		var Transaction = require('./transaction.js');
		this.transactionarray = Transaction.getTransactionsFromJsonArray(this.transactions);
		
	}
	
	getTransactions() {
		if (this.transactionarray === undefined) {
			callback(new Error("block was not properly instanciated with a transaction array"));
		}
		
		// return data array of transactions
		return this.transactionarray;
	}
	
	static getBlock(blocknumber) {
		// check if it is in the map
		if (global.blockmap[blocknumber] !== undefined) {
			return global.blockmap[blocknumber] ;
		}
		
		// else we create a block object
		var block = new Block();
		block.blocknumber = blocknumber;
		
		// and put it in the global map before instantiating transactions
		global.blockmap[blocknumber] = block;

		// now we get the block's info and transactions array
		var finished = false;
		
		// web3.eth.getBlock(blocknumber, true)  param true let retrieve transactions
		var ret = web3.eth.getBlock(blocknumber, true, function(error, result) {
			
			if (!error) {
				block.setData(result);
					
				finished = true;
				  
			  } else {
				block.setData(null);
					
				finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}
		
		return block;
	}
	
	static getLastBlockNumber() {
		var blocknumber;
		
		var promise =  web3.eth.getBlockNumber(function(error, result) {
			
			if (!error) {
				blocknumber = result;
				  
			  } else {
				  blocknumber = -1;
			  }
			});

		// wait to turn into synchronous call
		while(blocknumber === undefined)
		{require('deasync').runLoopOnce();}
		
		return blocknumber;
	}
	
	static getLatestBlock() {
		var blocknumber = this.getLastBlockNumber();
		
		return this.getBlock(blocknumber);
	}
	
	static getBlocks(offset, count) {
		var lastBlockNumber = Block.getLatestBlock().getBlockNumber();
		
		var off = offset;
		var cnt = (count < global.max_returned_blocks ? count : global.max_returned_blocks);
	    
	    var startBlockNumber = ((lastBlockNumber - off > 0 ) ? (lastBlockNumber - off) : 0);
		var endBlockNumber = (startBlockNumber + cnt <= lastBlockNumber ? startBlockNumber + cnt : lastBlockNumber);
		
	    global.log("Reading from block " + startBlockNumber + " to block " + endBlockNumber);
		
		var blocks = []
	    
		for (var i = startBlockNumber; i <= endBlockNumber; i++) {
			if (i % 100 == 0) {
				global.log("Reading block " + i);
			}
			
			var block = Block.getBlock(i);
			
			blocks.push(block);
		}
		
		return blocks;
	}
}


module.exports = Block;

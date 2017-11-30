'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var Utility = require('./utility.js');
var EthNode = require('./ethnode.js');

var Block = require('./block.js');

//!!! to prevent circularities, transactions.js
// must not require account.js


class Transaction {
	
	constructor() {
		
		// members for API
		this.hash= -1;
		this.sender = null;
		this.recipient = null;
		this.accountNonce = null;
		this.price = null;
		this.gasLimit = null;
		this.amount = null;
		this.block_id = null;
		this.time = null;
		this.newContract = null;
		this.isContractTx = null;
		this.blockHash = null;
		this.parentHash = null;
		this.txIndex = null;
		this.gasUsed = null;
		this.type =	"tx";
		
		// original web3 data
		this.data = null;
		
		this.receiptdata = null;
		
		// objects
		this.block = null;
	}
	
	getBlock() {
		return this.block;
	}
	
	getHash() {
		return this.hash;
	}
	
	
	getData() {
		return this.data;
	}
	
	getUnixTimeStamp() {
		return global.EthToUnixTime(this.time);
	}
	
	setData(data) {
		this.data = data;
		
		if (data == null)
			return;
		
		// instantiate objects
		var blockid = this.data['blockNumber'];
		this.block = Block.getBlock(blockid);
		
		// fill members
		this.hash = this.data['hash'];
		
		this.sender = this.data['from'];
		this.recipient = this.data['to'];
		this.accountNonce = this.data['nonce']
		this.price = parseInt(this.data['gasPrice']);
		this.gasLimit = this.data['gas'];
		this.amount = 0;
		this.block_id =  blockid;
		this.time = this.block.timestamp;
		this.newContract = 0;
		this.isContractTx = null;
		this.blockHash = this.data['blockHash'];
		this.parentHash = this.data['hash'];
		this.txIndex = this.data['transactionIndex'];
		this.type =	"tx";
		
		// additional members (needing transactionreceipt)
		this.receiptdata = null; // we don't make the call now to avoid reading the receipts of all the transaction for a block
		
		this.gasUsed = null;
	
	}
	
	getGasPrice() {
		return this.price;
	}
	
	getGasLimit() {
		return this.gasLimit;
	}
	
	// additional members
	getGasUsed() {
		global.log("Transaction.getGasUsed called for " + this.hash);
		if (this.gasUsed !== null)
			return this.gasUsed;
		
		var receiptdata = this.getTransactionReceiptData();
		this.gasUsed = (receiptdata? receiptdata['gasUsed'] : 0);
		
		return this.gasUsed;
	}
	
	getGasCost() {
		return this.price * this.getGasUsed();
	}
	
	getTransactionReceiptData() {
		global.log("Transaction.getTransactionReceiptData called for "  + this.hash);
		
		if (this.receiptdata !== null)
			return this.receiptdata;
		
		var transaction = this;
		
		var txahash = transaction.hash;
		
		var txreceiptdate = EthNode.getTransactionReceiptData(txahash);
		
		this.setSetTransactionReceiptData(txreceiptdate);
		
/*		var finished = false;
		
		var ret = web3.eth.getTransactionReceipt(txahash, function(error, result) {
			
			if (!error) {
				transaction.setSetTransactionReceiptData(result);
					
				finished = true;
			  } else {
				  transaction.setSetTransactionReceiptData(null);
					
				  global.log('Web3 error: ' + error);
				  finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}*/

		return this.receiptdata;
	}
	
	setSetTransactionReceiptData(receiptdata) {
		this.receiptdata = receiptdata;
	}
	
	static getTransaction(txahash) {
		global.log("Transaction.getTransactionCount called for " + txahash);
		
		var transaction = new Transaction();
		transaction.hash = txahash;
		
		var transactiondata = EthNode.getTransactionData(txahash);
		
		transaction.setData(transactiondata);
		
		/*var finished = false;
		
		var ret = web3.eth.getTransaction(txahash, function(error, result) {
			
			if (!error) {
				transaction.setData(result);
					
				finished = true;
			  } else {
				transaction.setData(null);
					
				global.log('Web3 error: ' + error);
				finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}*/

		global.log("returning transaction ");
		return transaction;
	}
	
	static getTransactionsFromJsonArray(jsonarray) {
		var transactions = [];
		
		// read json array
		for(var i = 0; i < jsonarray.length; i++) {
			var transaction = new Transaction();
			
			transaction.setData(jsonarray[i]);
			
			transactions.push(transaction);
		}	
		
		return transactions;
	}
	
	static getBlockTransactions(block) {
		var blocknumber = block.getNumber();
		global.log("Transaction.getBlockTransactions called for " + blocknumber);
		
		var transactionarray = Block.getBlockTransactionsFromMap(blocknumber);

		if (transactionarray === null) {
			block.readBlock(true); // re-do read with transactions
			
			if (block.transactions) {
				transactionarray = Transaction.getTransactionsFromJsonArray(block.transactions);
				
				// put it in map
				Block.setBlockTransactionsInMap(blocknumber, transactionarray);
			}
		}
		
		// return data array of transactions
		return transactionarray;
	}
	
	
	static getTransactionCount(address) {
		global.log("Transaction.getTransactionCount called for " + address);

		var count = false;
		var finished = false;
		
		var ret = web3.eth.getTransactionCount(address, function(error, result) {
			
			if (!error) {
				count = result;
					
				finished = true;
				  
			  } else {
				count = false;
					
				global.log('Web3 error: ' + error);
				finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return count;
	}
	
	static getBlocksRangeTransactions(startBlockNumber, endBlockNumber) {
		var blocks = Block.getBlocksRange(startBlockNumber, endBlockNumber);
		
		var txs = [];
		
		for (var i = 0, len = blocks.length; i < len; i++) {
			var block = blocks[i];
			var transactions = this.getBlockTransactions(block);
			
			// using txs.pushValues(transactions) instead?
			for (var j = 0, lenj = transactions.length; j < lenj; j++) {
				txs.push(transactions[j]);
			}
		}
		
		return txs;
	}
	
	static getTransactions(offset, count) {
		global.log("Transaction.getTransactions called for offset " + offset + " and count " + count);

		var off = (offset > 0 ? offset : 0);
		var cnt = (count < global.max_returned_transactions ? count : global.max_returned_transactions);
		cnt = (cnt <= off ? cnt : off);
		
		var transactions = [];
	    
	    // we read backward the last blocks 
		// until we have off + cnt transactions 
		// and take the first cnt transactions
		var latestBlock = Block.getLatestBlock();
		var lastblocknumber = latestBlock.getNumber();
		
		var blocknum = lastblocknumber;
		var block = latestBlock;
		
		do {
			var blocktransactions = this.getBlockTransactions(block);
			
			// fill in reverse order to maintain order accross blocks
			for (var i = blocktransactions.length - 1; i >= 0; i--) {
				//global.log("pushing a transaction for block number " + blocknum);
				transactions.push(blocktransactions[i]);
			}			
			
			blocknum--;
			block = Block.getBlock(blocknum);
		}
		while ((blocknum >= 0 ) && (transactions.length < off))
				
		var txs = [];
		
		// take from off - 1 to off - count in reverse order again
		for (var i = (off -1) ; i >= (off - cnt); i--) {
			txs.push(transactions[i]);
		}			
		
		
		return txs;
		
	}
	
	static get(transactions) {
		return transactions;
	}
	
	static getTransactionsCumulativeGasUsed(transactions) {
		var gasused = 0;
		
		for (var i = 0, len = transactions.length; i < len; i++) {
			gasused += transactions[i].getGasUsed();
		}
		
		return gasused;
	}
	
	static getTransactionsCumulativeGasCost(transactions) {
		var gascost = 0;
		
		for (var i = 0, len = transactions.length; i < len; i++) {
			gascost += transactions[i].getGasCost();
		}
		
		return gascost;
	}
	
}

module.exports = Transaction;

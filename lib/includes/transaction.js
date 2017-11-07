'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var Account = require('./account.js');
var Block = require('./block.js');

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
		this.accountNonce = null;
		this.price = this.data['gasPrice'];
		this.gasLimit = null;
		this.amount = this.data['v'];
		this.block_id =  blockid;
		this.time = this.block.timestamp;
		this.newContract = null;
		this.isContractTx = null;
		this.blockHash = null;
		this.parentHash = null;
		this.txIndex = null;
		this.gasUsed = null;
		this.type =	"tx";
	}
	
	static getTransaction(txahash) {
		var transaction = new Transaction();
		transaction.hash = txahash;
		
		var finished = false;
		
		var ret = web3.eth.getTransaction(txahash, function(error, result) {
			
			if (!error) {
				transaction.setData(result);
					
				finished = true;
				this.tx_array
			  } else {
				  transaction.setData(null);
					
				finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return transaction;
	}
	
	static getTransactionsFromJsonArray(jsonarray) {
		var transactions = [];
		
		// read json array
		for(var i = 0; i < jsonarray.length; i++) {
			var transaction = new Transaction();
			
			transaction.setData(jsonarray[i]);
			
			// setting the transaction index (in this array)
			transaction.txIndex = i;
			
			transactions.push(transaction);
		}	
		
		return transactions;
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
					
				finished = true;
			  }
		});
		

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return count;
	}
	
	static getTransactions(offset, count) {
		global.log("Transaction.getTransactions called for offset " + offset + " and count " + count);

		var off = (offset > 0 ? offset : 0);
		var cnt = (count < global.max_returned_transactions ? count : global.max_returned_transactions);
		
		var transactions = [];
	    
	    // we read backward the last blocks 
		// until we have off + cnt transactions 
		// and take the first cnt transactions
		var latestBlock = Block.getLatestBlock();
		var lastblocknumber = latestBlock.getNumber();
		
		var blocknum = lastblocknumber;
		var block = latestBlock;
		
		do {
			var blocktransactions = block.getTransactions();
			
			for (var i = 0, len = blocktransactions.length; i < len; i++) {
				global.log("pushing a transaction for block number " + blocknum);
				transactions.push(blocktransactions[i]);
			}			
			
			blocknum--;
			block = Block.getBlock(blocknum);
		}
		while ((blocknum >= 0 ) && (transactions.length < cnt+off))
				
		var txs = [];
		
		if (off > 0) {
			// take count if offset
			for (var i = 0; i < cnt; i++) {
				txs.push(transactions[i]);
			}			
			
		}
		else {
			// or the array if no offset
			txs = transactions;
		}
		
		return txs;
		
	}
	
}

module.exports = Transaction;

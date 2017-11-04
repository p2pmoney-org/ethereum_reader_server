'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();


class Transaction {
	
	constructor() {
		this.hash= -1;
		this.data = null;
	}
	
	getHash() {
		return this.hash;
	}
	
	
	getData() {
		return this.data;
	}
	
	setData(data) {
		this.data = data;
		
		if (data == null)
			return;
	}
	
	static getTransaction(txahash) {
		var transaction = new Transaction();
		transaction.hash = txahash;
		
		var finished = false;
		
		var ret = web3.eth.getTransaction(txahash, function(error, result) {
			
			if (!error) {
				transaction.setData(result);
					
				finished = true;
				  
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
		var off = offset;
		var cnt = (count < 100 ? count : 100);
		
		var transactions = [];
	    
	    // we read the last blocks until we have off + cnt transactions and take the first cnt transactions
		
		return transactions;
		
	}
	
}

module.exports = Transaction;

'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var Promise = require("promise");

var Transaction = require('./transaction.js');
var Block = require('./block.js');

class Account {
	
	constructor() {
		this.address = -1;
		this.balance = -1;
		this.transactioncount = -1;
		
		// list of transactions
		this.tx_array = []; // array of objects
		this.tx_array_data = null; // data from web3
	}
	
	getAddress() {
		return this.address;
	}
	
	getBalance() {
		return this.balance;
	}
	
	getTransactionCount() {
		return this.transactioncount;
	}
	
	getTransactionsFrom(offset) {
		var lastblocknumber = Block.getLastBlockNumber();
		
		var toBlock = lastblocknumber;
		var fromBlock = (((lastblocknumber - global.max_processed_blocks) > 0) ? (lastblocknumber - global.max_processed_blocks) : 0);
		
		return Account.getTransactionsForAccount(this.address, offset, fromBlock, toBlock);
	}
	
	getTransactionsWithin(offset, fromBlock, toBlock) {
		return Account.getTransactionsForAccount(this.address, offset, fromBlock, toBlock);
	}
	
	static getTransactionsForAccount(accountaddress, offset, fromBlock, toBlock) {
		var transactions = [];
	    
		// we return a maximum of max_returned_transactions transactions
		// and processing a maximum of max_processed_blocks

		// we read the block range and add transactions for this account
		var lastblocknumber = Block.getLastBlockNumber();
		
		var lastblocknum = (toBlock != null ? toBlock : lastblocknumber);
		lastblocknum = (lastblocknum <= lastblocknumber ? lastblocknum : lastblocknumber);
		
		var startblocknum = (fromBlock > 0 ? fromBlock : 0);
		startblocknum = (((lastblocknum - startblocknum) < global.max_processed_blocks) ? startblocknum : (lastblocknum - global.max_processed_blocks));
	
		global.log("startblock is " + startblocknum + " endblock is " + lastblocknum);
		
		for (i = startblocknum; i <= lastblocknum; i++) {
			var block = Block.getBlock(i);
			var blocktransactions = block.getTransactions();
			
			for (var j = 0, len = blocktransactions.length; j < len; j++) {
				var transaction = blocktransactions[j];
				
				// add if sender or recipient is this account
				if ((transaction.sender == accountaddress) || (transaction.recipient == accountaddress)){
					transactions.push(transaction);
				}
			}			
		}
		
		

		// and take the offset and limit to count if necessary
		var off = (offset > 0 ? offset : 0);
		off = (off < transactions.length ? off : transactions.length);
		var cnt = ( transactions.length - off > 0 ? transactions.length - off : 0)
		cnt = (cnt < global.max_returned_transactions ? cnt : global.max_returned_transactions);

		var txs = [];
		
		if (off > 0) {
			// take count if offset
			for (var i = off; i < off + cnt; i++) {
				txs.push(transactions[i]);
			}			
			
		}
		else {
			// or the array if no offset
			txs = transactions;
		}
		
		return txs;
		
	}
	
/*	static getTransactionsByAccount(myaccount, startBlockNumber, endBlockNumber) {
		global.log("Account.getTransactionsByAccount called for " + myaccount);
		
		var tx_transactions_data = null;
		
	  if (endBlockNumber == null) {
	    endBlockNumber = Block.getLatestBlock().getBlockNumber();
	    global.log("Using endBlockNumber: " + endBlockNumber);
	  }
	  if (startBlockNumber == null) {
	    startBlockNumber = (endBlockNumber - 1000 > 0 ? endBlockNumber - 1000 : 0); 
	    global.log("Using startBlockNumber: " + startBlockNumber);
	  }
	  global.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
	
	  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
	    if (i % 1000 == 0) {
	      global.log("Searching block " + i);
	    }
	    var block = Block.getBlock(i);
	    if (block != null && block.transactions != null) {
	      block.transactions.forEach( function(e) {
	        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
	          global.log("  tx hash          : " + e.hash + "\n"
	            + "   nonce           : " + e.nonce + "\n"
	            + "   blockHash       : " + e.blockHash + "\n"
	            + "   blockNumber     : " + e.blockNumber + "\n"
	            + "   transactionIndex: " + e.transactionIndex + "\n"
	            + "   from            : " + e.from + "\n" 
	            + "   to              : " + e.to + "\n"
	            + "   value           : " + e.value + "\n"
	            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
	            + "   gasPrice        : " + e.gasPrice + "\n"
	            + "   gas             : " + e.gas + "\n"
	            + "   input           : " + e.input);
	        }
	      })
	    }
	  }
	  
	  return tx_transactions_data;
	}*/
	
	getTransactionsData() {
		global.log("Account.getTransactionsData called");
		this.tx_array_data = Account.getTransactionsByAccount(this.address, null, null);
		
		return this.tx_array_data;
	}
	
	getBalance() {
		global.log("Account.getBalance called for " + this.address);
		
	    var account = this;

		var accountaddr = account.address;
		
		var finished = false;
		var balancepromise = web3.eth.getBalance(accountaddr, function(error, result) {
			
			if (!error) {
				account.balance = result;
				
				finished = true;
			} else {
				account.balance = 'error: ' + error;
				
				finished = true;

			}
		});
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return this.balance;
	}
	
	getTransactionCount() {
		global.log("Account.getTransactionCount called for " + this.address);
		
	    var account = this;

		var accountaddr = account.address;
		
		var finished = false;
		var transactioncountpromise = web3.eth.getTransactionCount(accountaddr, function(error, result) {
			
			if (!error) {
				account.transactioncount = result;
				
				finished = true;
				  
			} else {
				account.transactioncount = 'error: ' + error;
				
				finished = true;
			  }
		});
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return this.transactioncount;
	}
	
	static getAccount(accountaddr) {
		global.log("Account.getAccount called for " + accountaddr);

		var account = new Account();
		
		account.address = accountaddr;
		
		// fill members
		var balance = account.getBalance();
		var transactioncount = account.getTransactionCount();
		
		
		return account;
	}
	
	/*static getAccount(accountaddr) {
		global.log("Account.getAccount called for " + accountaddr);

		var account = new Account();
		
		account.address = accountaddr;
		
		var balance;
		var transactioncount;
		
	    var promises = [];

		var finished = false;
		var balancepromise = web3.eth.getBalance(accountaddr, function(error, result) {
			
			if (!error) {
				balance = result;
				  
			} else {
				balance = 'error: ' + error;
			  }
		});
		
		promises.push(balancepromise);
		
		var transactioncountpromise = web3.eth.getTransactionCount(accountaddr, function(error, result) {
			
			if (!error) {
				transactioncount = result;
				  
			} else {
				transactioncount = 'error: ' + error;
			  }
		});
		
		promises.push(transactioncountpromise);

		global.log("get promises results ");
		// get result when all promises filled
		Promise.all( promises ).then( function(results) {
			account.balance = results[0];
			account.transactioncount = results[1];
			
			global.log('Account.getAccount balance is ' + results[0]);
	       
	   }, function( error ) {
		   global.log('error in Account.getAccount ' + error);
		   
		   account.balance = -1;
		   account.transactioncount = -1;
	    }	
	    );
		
		return account;
	}*/
}

module.exports = Account;

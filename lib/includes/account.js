'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var Promise = require("promise");

var Transaction = require('./transaction.js');
var Block = require('./block.js');

class AccountMap {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getAccount(address) {
		var key = address.toString();
		
		if (key in this.map) {
			return this.map[key];
		}
	}
	
	pushAccount(account) {
		if (this.count() > global.max_account_map_size) {
			// need to make some room in the account map
			this.empty(); // empty for the moment, do not resize to global.account_map_size)
		}
		
		var key = account.address.toString();

		this.map[key] = account;
	}
	
	count() {
		return Object.keys(this.map).length
	}
	
	empty() {
		this.map = Object.create(null);
	}
}

var accountmap = new AccountMap();



class Account {
	
	constructor() {
		this.address = -1;
		this.balance = null;
		this.nonce = null;
		this.code = null;
		this.name = null;
		this.storage = null;
		this.firstseen = null;
		
		
		this.transactioncount = null;
		
		// list of transactions
		this.tx_array = null; // array of objects
		this.tx_array_data = null; // data from web3
		
		
		// mining
		this.tx_mined_block_array = null; 
		this.tx_uncle_block_array = null; 
	}
	
	getAddress() {
		return this.address;
	}
	
	getBalance() {
		if (this.balance !== null)
			return this.balance;
		
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
	
	getNonce() {
		return this.nonce;
	}
	
	getCode() {
		if (this.code !== null)
			return this.code;
		
		global.log("Account.getCode called for " + this.address);
		
	    var account = this;

		var accountaddr = account.address;
		
		var finished = false;
		var codepromise = web3.eth.getCode(accountaddr, function(error, result) {
			
			if (!error) {
				account.code = result;
				
				finished = true;
			} else {
				account.code = 'error: ' + error;
				
				finished = true;

			}
		});
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return this.code;
	}
	
	getName() {
		return this.name;
	}
	
	getStorage() {
		return this.storage;
	}
	
	getFirstSeen() {
		var firstseentimestamp = this.getUnixFirstSeenTimeStamp();
		
		return this.firstseen;
	}
	
	getUnixFirstSeenTimeStamp() {
		if (this.firstseen !== null)
			return global.EthToUnixTime(this.firstseen);
			
		global.log("Account.getUnixFirstSeenTimeStamp called for " + this.address);
		
		var transactioncount = this.getTransactionCount();
		
		if (transactioncount == 0) {
			this.firstseen = Date.now();
		}
		
		// get all transactions
		var transactions = this.getTransactions(true);
		
		var oldesttimestamp = Date.now();
		
		// and see the older one
		if (transactions != null) {
			for (var i= 0, len = this.tx_array.length; i < len; i++) {
				var transactiontimestamp = this.tx_array[i].getUnixTimeStamp();
				
				if ((transactiontimestamp !== null) && (transactiontimestamp < oldesttimestamp))
					oldesttimestamp = transactiontimestamp;
			}
		}
		
		this.firstseen = global.UnixToEthTime(oldesttimestamp); 
		
		
		return global.EthToUnixTime(this.firstseen);
	}
	
	// blocks
	getMinedBlocks(bforcefullsearch) {
		if ((!bforcefullsearch) && (this.tx_mined_block_array  !== null))
			return this.tx_mined_block_array ;
		
		global.log("Account.getMinedBlocks called with force flag to " + (bforcefullsearch ? "true" : "false"));
		
		var accountaddr = this.getAddress();
		var accountaddrstring = accountaddr.toString().toLowerCase();
		
		// we look at all the blocks if bforcefullsearch (long) or max_processed_blocks if not
		var minedblocks = [];
		var blocknumber = Block.getLastBlockNumber();
		var processedblocks = 0;
		
		while (blocknumber >= 0) {
			var block = Block.getBlock(blocknumber);
			var miner = block.getMiner().toLowerCase();
			
			if (accountaddrstring == miner) {
				minedblocks.push(block);
			}
			
			processedblocks++;
			blocknumber--;
			
			if ((!bforcefullsearch) && (processedblocks >= global.max_processed_blocks))
				break; // stop if we have done enough and not required to go the long way
				
		}
		
		if (bforcefullsearch)
		this.tx_mined_block_array = minedblocks; // keep the result if we did a complete look up!
		
		return minedblocks;
	}
	
	// transactions
	getTransactions(bforcefullsearch) {
		if ((!bforcefullsearch) && (this.tx_array !== null))
			return this.tx_array;
		
		var transactioncount = this.getTransactionCount();

		if ((this.tx_array !== null) && (this.tx_array.length == transactioncount))
			return this.tx_array;
		
		global.log("Account.getTransactions called with force flag to " + (bforcefullsearch ? "true" : "false"));
		
		// we search until we get a number of transactions matching transactioncount
		var transactioncount = this.getTransactionCount();
		var lastblocknumber = Block.getLastBlockNumber();
		
		global.log("Searching for " + transactioncount + " transactions ");

		var endblocknumber = lastblocknumber;
		var startblocknumber = ((endblocknumber - global.max_processed_blocks) > 0 ? (endblocknumber - global.max_processed_blocks) : 0);
		
		while (endblocknumber > 0) {
			var tx_array= Account.getTransactionsForAccount(this.address, 0, startblocknumber, endblocknumber);
			
			if (tx_array.length > 0) {
				
				if (this.tx_array === null)
					this.tx_array = []; // not initialized yet
				
				for (var i= 0, len = tx_array.length; i < len; i++) {
					this.tx_array.push(tx_array[i]);
				}
			}
			
			endblocknumber = (startblocknumber - 1 > 0 ? startblocknumber - 1 : 0);
			startblocknumber = ((endblocknumber - global.max_processed_blocks) > 0 ? (endblocknumber - global.max_processed_blocks) : 0);
			
			if ((this.tx_array !== null) && (this.tx_array.length >= transactioncount))
				break;
		}
		
		if (endblocknumber > 0) {
			global.log("Found all transactions before a full scan, reading from " + startblocknumber);
		}
		
		
		return this.tx_array;;
	}
	
	getTransactionsData(bforcefullsearch) {
		if (this.tx_array_data !== null)
			return this.tx_array_data;
		
		global.log("Account.getTransactionsData called with force flag to " + (bforcefullsearch ? "true" : "false"));
		
		if (!bforcefullsearch) {
			this.tx_array_data = Account.getTransactionsByAccount(this.address, null, null);
			
			return this.tx_array_data;
		}
		
		this.tx_array_data = [];

		// get all transactions
		this.tx_array = this.getTransactions(bforcefullsearch);
		
		if (this.tx_array !== null) {
			// we transform transaction array into a transaction data array
			for (var i= 0, len = this.tx_array.length; i < len; i++) {
				var transaction = this.tx_array[i];
				this.tx_array_data.push(transaction.getData());
			}
			
		}

		return this.tx_array_data;
	}
	
	getTransactionCount() {
		global.log("Account.getTransactionCount called for " + this.address);
		
		if (this.transactioncount !== null)
			return this.transactioncount;
		
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
	
	static getAccount(accountaddr) {
		global.log("Account.getAccount called for " + accountaddr);

		var key = accountaddr.toString();
		var mapvalue = accountmap.getAccount(key);
		
		if (mapvalue !== undefined) {
			return mapvalue;
		}

		var account = new Account();
		
		account.address = accountaddr;
		
		// put in map
		accountmap.pushAccount(account);
		
		// fill members
		var balance = account.getBalance();
		var nonce = account.getNonce();
		var code = account.getCode();
		var name = account.getName();
		var storage = account.getStorage();
		var firstseen = account.getFirstSeen();
		
		var transactioncount = account.getTransactionCount();
		
		
		return account;
	}
	
	static getAccounts(accountaddresses) {
		global.log("Account.getAccounts called for " + accountaddresses.length + " addresses");
		
		var accounts = [];
		
		for (var i = 0, len = accountaddresses.length; i < len; i++) {
			var accountaddr = accountaddresses[i];
			var account = this.getAccount(accountaddr);
			
			accounts.push(account);
		}
		
		return accounts;
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

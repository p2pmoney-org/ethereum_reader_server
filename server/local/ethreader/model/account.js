'use strict';

var Global = require('../service.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Instance();

// reader objects
var EthNode = require('./ethnode.js');

var Block = require('./block.js');
var Transaction = require('./transaction.js');

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
	
	removeAccount(account) {
		var key = account.address.toString();

		delete this.map[key];
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
		
		
		// mining for this account
		this.tx_mined_block_array = null; 
		this.tx_uncle_block_array = null; 
		
		// indicators of the time for this account position
		this.currentblocknumber = null;
		this.newblocksseen = null;
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
				
				global.log('Web3 error: ' + error);
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
				
				global.log('Web3 error: ' + error);
				finished = true;

			}
		});
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return this.code;
	}
	
	isContract() {
		var code = this.getCode();
		
		if (code)
			return true;
		else
			return false;
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
		
		// get all transactions?
		//var transactions = this.getTransactions(true);
		var transactions = this.getTransactions(false);
		
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
	
	getCurrentBlockNumber() {
		return this.currentblocknumber;
	}
	
	getNewBlocksSeen() {
		return this.newblocksseen;
	}
	
	
	// read
	readAccount() {
		
		// note start time
		var ethnode = EthNode.getEthNode();
		
		this.currentblocknumber = ethnode.getCurrentBlockNumber();
			

		// fill members with synchronous calls
		var balance = this.getBalance();
		var nonce = this.getNonce();
		var code = this.getCode();
		var name = this.getName();
		var storage = this.getStorage();
		var firstseen = this.getFirstSeen();
		
		var transactioncount = this.getTransactionCount();
		
		// see if there has been new blocks
		this.newblocksseen = ethnode.getMinedBlocksNumber(this.currentblocknumber);
	}
	
	isObsolete() {
		var ethnode = EthNode.getEthNode();
		
		var currentblocknumber = ethnode.getCurrentBlockNumber();
		
		return (currentblocknumber > this.currentblocknumber ? true : false);
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
			var miner = Block.getMiner().toLowerCase();
			
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
	
	getMinedBlocksFrom(blocks) {
		var accountaddr = this.getAddress();
		var accountaddrstring = accountaddr.toString().toLowerCase();
		
		var minedblocks = [];

		for (var i = 0, len = blocks.length; i < len; i++) {
			var block = blocks[i];
			var miner = Block.getMiner().toLowerCase();
			
			if (accountaddrstring == miner) {
				minedblocks.push(block);
			}
			
		}
		
		return minedblocks;
		
	}
	
	getMinedBlocksToday() {
		var blocks = Block.getBlocksToday();
		
		return this.getMinedBlocksFrom(blocks);
	}
	
	getMinedBlocksPastWeek() {
		var blocks = Block.getBlocksPastWeek();
		
		return this.getMinedBlocksFrom(blocks);
	}
	
	getMinedBlocksPastMonth() {
		var blocks = Block.getBlocksPastMonth();
		
		return this.getMinedBlocksFrom(blocks);
	}
	
	getMinedBlocksPastDays(ndays) {
		var blocks = Block.getBlocksPastDays(ndays);
		
		return this.getMinedBlocksFrom(blocks);
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
		
		if (transactioncount == 0) {
			this.tx_array = [];
			return this.tx_array;
		}

		var endblocknumber = lastblocknumber;
		var startblocknumber = ((endblocknumber - global.max_processed_blocks) > 0 ? (endblocknumber - global.max_processed_blocks) : 0);
		var processedblocks = 0;
		
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
			
			if (this.tx_array !== null) {
				 if (this.tx_array.length >= transactioncount)
					break; // we have finished the job
				 
				 if (this.tx_array.length >= global.max_processed_transactions)
					break; // break if we have processed the maximum number of transactions
				 
			}
			
			processedblocks += (endblocknumber - startblocknumber);
			
			if ((!bforcefullsearch) && (processedblocks >= global.max_processed_blocks))
				break; // break if we have scanned the maximum number of blocks
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
				
				global.log('Web3 error: ' + error);
				finished = true;
			  }
		});
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return this.transactioncount;
	}
	
	
	// search performing a scan on blocks
	static getTransactionsFrom(accountaddress, offset, blockscan) {
		var lastblocknumber = Block.getLastBlockNumber();
		
		var toBlock = lastblocknumber;
		var fromBlock = (((lastblocknumber - global.max_processed_blocks) > 0) ? (lastblocknumber - global.max_processed_blocks) : 0);
		
		return Account.getTransactionsForAccount(accountaddress,  offset, fromBlock, toBlock, blockscan);
	}
	
	static getLastTransactions(accountaddress, offset, count, blockscan) {
		var lastblocknumber = Block.getLastBlockNumber();
		
		var toBlock = lastblocknumber;
		var fromBlock = (((lastblocknumber - global.max_processed_blocks) > 0) ? (lastblocknumber - global.max_processed_blocks) : 0);
		
		return Account.getLastTransactionsForAccountInBlockRange(accountaddress,  offset, count, fromBlock, toBlock, blockscan);
	}
	
	static getTransactionsBefore(accountaddress, blocknumber, blockscan) {
		var lastblocknumber = Block.getLastBlockNumber();
		
		var offset = global.max_processed_transactions;
		var toBlock = (blocknumber > 0 ? blocknumber - 1 : 0);
		var fromBlock = (((toBlock - global.max_processed_blocks) > 0) ? (toBlock - global.max_processed_blocks) : 0);
		
		return Account.getTransactionsForAccount(accountaddress,  offset, fromBlock, toBlock, blockscan);
	}
	
	static getTransactionsAfter(accountaddress, blocknumber, blockscan) {
		var lastblocknumber = Block.getLastBlockNumber();
		
		var offset = global.max_processed_transactions;
		var fromBlock = (blocknumber + 1 < lastblocknumber ? blocknumber + 1 : lastblocknumber);
		var toBlock = (((fromBlock + global.max_processed_blocks) < lastblocknumber) ? (fromBlock + global.max_processed_blocks) : lastblocknumber);
		
		return Account.getTransactionsForAccount(accountaddress,  offset, fromBlock, toBlock, blockscan);
	}
	
	static getTransactionsWithin(accountaddress, fromBlock, toBlock, blockscan) {
		var offset = global.max_processed_transactions;

		return Account.getTransactionsForAccount(accountaddress,  offset, fromBlock, toBlock, blockscan);
	}
	
	static getTransactionsForAccount(accountaddress, offset, fromBlock, toBlock, blockscan) {
		return Account.getLastTransactionsForAccountInBlockRange(accountaddress, offset, global.max_processed_transactions, fromBlock, toBlock, blockscan);
	}
	
	static getLastTransactionsForAccountInBlockRange(accountaddress, offset, count, fromBlock, toBlock, blockscan) {
		var transactions = [];
	    
		// we return a maximum of max_returned_transactions transactions
		// and processing a maximum of max_processed_blocks

		// we read the block range and add transactions for this account
		var lastblocknumber = Block.getLastBlockNumber();
		
		var lastblocknum = (toBlock != null ? toBlock : lastblocknumber);
		lastblocknum = (lastblocknum <= lastblocknumber ? lastblocknum : lastblocknumber);
		
		var startblocknum = (fromBlock > 0 ? fromBlock : 0);
		startblocknum = (((lastblocknum - startblocknum) < global.max_processed_blocks) ? startblocknum : (lastblocknum - global.max_processed_blocks));
	
		global.log("offset is " + offset + " count is " + count + " startblock is " + startblocknum + " endblock is " + lastblocknum);
		
	    // we read backward the blocks 
		// and take the first cnt transactions
		// (forward filling)
		for (i = lastblocknum; i >= startblocknum; i--) {
			// going backward in time
			var block = Block.getBlock(i);
			var blocktransactions = Transaction.getBlockTransactions(block);
			
			for (var j = 0, len = blocktransactions.length; j < len; j++) {
				var transaction = blocktransactions[j];
				
				// add if sender or recipient is this account
				if ((transaction.sender == accountaddress) || (transaction.recipient == accountaddress)){
					transactions.push(transaction);
				}
			}			
		}
		
		// we give the limits of our scan
		if (blockscan) {
			blockscan.setHighestBlockSearched(lastblocknum);
			blockscan.setLowestBlockSearched(startblocknum);
		}

		// and take the offset and limit to count if necessary
		var off = (offset > 0 ? offset : 0);
		off = (off < transactions.length ? off : transactions.length);
		var cnt = (count < global.max_processed_transactions ? count : global.max_processed_transactions);
		cnt = (cnt <= off ? cnt : off);

		var txs = [];
		
		// take from off - 1 to off - count in reverse order again
		for (var i = (off -1) ; i >= (off - cnt); i--) {
			if (transactions[i])
			txs.push(transactions[i]);
		}			
		
		
		//TODO: we could push the transaction in an account object
		// if one exists in the AccountMap for this address
		
		return txs;
		
	}
	
	
	static getAccount(accountaddr) {
		global.log("Account.getAccount called for " + accountaddr);

		var key = accountaddr.toString();
		var mapvalue = accountmap.getAccount(key);
		
		var account;
		
		if (mapvalue !== undefined) {
			account = mapvalue;
			
			if (!account.isObsolete()) {
				return mapvalue;
			}
			else {
				global.log("account " + account.address + " considered obsolete and removed from map");
				accountmap.removeAccount(account);
			}
		}

		account = new Account();
		
		account.address = accountaddr;
		
		// put in map
		accountmap.pushAccount(account);
		
		account.readAccount();
		
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
	
}

module.exports = Account;

/**
 * 
 */

'use strict';


// requires
// should be in this precise order to respect
// the non circular depedencies of objects
var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();

var Utility = require('../../lib/includes/utility.js');

var EthNode = require('../../lib/includes/ethnode.js');

var Statistics = require('../../lib/includes/statistics.js');

var Block = require('../../lib/includes/block.js');

var Transaction = require('../../lib/includes/transaction.js');

var Account = require('../../lib/includes/account.js');




//global Routes
exports.version = function(req, res) {
	var jsonresult = {status: 1
			, data: [ {version:  global.current_version}]};
	
	global.log('/version called json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
	
}

exports.version_support = function(req, res) {
	var version_support = global.version_support;
	
	var jsonlist = [];

	for (var i = 0; i < version_support.length; i++) {
		jsonlist.push({version:  version_support[i]});
	}
	
	var jsonresult = {status: 1
			, data: jsonlist};
	
	global.log('/version/support json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
	
}

// ethereum node Routes

exports.node = function(req, res) {
	var ethnode = EthNode.getEthNode();
	
	var islistening = ethnode.isListening();
	var peercount = ethnode.getPeerCount();
	var issyncing = ethnode.isSyncing();
	var currentblock = ethnode.getCurrentBlockNumber();
	var highestblock = ethnode.getHighestBlockNumber();
	
	var json = {
			islistening: islistening,
			peercount: peercount,
			issyncing: issyncing,
			currentblock: currentblock,
			highestblock: highestblock
	};
	
	var jsonresult = {status: 1
			, data: [json]};
	
	global.log('/node json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
	
}


exports.node_hashrate = function(req, res) {
	var ethnode = EthNode.getEthNode();
	
	var hashrate = ethnode.getHashRate();
	
	if (hashrate !== false) {
		  var json = {hashrate: hashrate};
		
		  var jsonresult = {status: 1
				  , data: [json]};
		  
		  global.log('/node/hashrate json result is ' + JSON.stringify(jsonresult));
		  
		  res.json(jsonresult);
		  
	  } else {
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
}


//statistics

exports.difficulty = function(req, res) {
	var lastblock = Block.getLatestBlock();
	var difficulty = lastblock.getDifficulty();
	
	if (difficulty !== false) {
		  var json = {difficulty: difficulty};
		  var jsonresult = {status: 1
				  , data: [json]};
		  
		  
		  global.log('/difficulty json result is ' + JSON.stringify(jsonresult));
		  
		  res.json(jsonresult);
		  
	  } else {
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

exports.gasPrice = function(req, res) {
	var gasPrice = Statistics.getGasPrice();
	
	if (gasPrice !== false) {
		  var json = {gasprice: gasPrice};
		  var jsonresult = {status: 1
				  , data: [json]};
		  
		  
		  global.log('/gasPrice json result is ' + JSON.stringify(jsonresult));
		  
		  res.json(jsonresult);
		  
	  } else {
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
}

exports.miningEstimator = function(req, res) {
	var miningEstimate = Statistics.getMiningEstimate();
	
	if (miningEstimate !== false) {
		var blockTime = miningEstimate['blockTime'];
		var difficulty = miningEstimate['difficulty'];
		var hashRate = miningEstimate['hashRate'];
		
		
		var json =  {
			blockTime: blockTime,
			difficulty: difficulty,
			hashRate: hashRate
		};
  
		var jsonresult = {status: 1
				, data: [json]};
  
  
		global.log('/miningEstimator json result is ' + JSON.stringify(jsonresult));
		  
		res.json(jsonresult);
		  
	  } else {
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
}


// blocks Routes

function getBlockJson(block) {
	
	var number = block.getBlockNumber();
	var hash = block.getHash();
	var parentHash = block.getParentHash();
	var uncleHash = block.getUncleHash();
	var coinbase = block.getMiner();
	var root = block.getStateRoot();
	var txHash = block.getTransactionRoot();
	var difficulty = block.getDifficulty();
	var gasLimit = block.getGasLimit();
	var gasUsed = block.getGasUsed();
	var time = new Date(block.getUnixTimeStamp()).toISOString();
	var extra = block.getExtraData();
	var mixDigest = block.getMixDigest();
	var nonce = block.getNonce();
	var tx_count = block.getTxCount();
	var uncle_count = block.getUncleCount();
	var size = block.getSize();
	var blockTime = block.getBlockTimeTaken();
	var reward = block.getReward();
	var totalFee = block.getTotalFee();
	var totalDifficulty = block.getTotalDifficulty();
	
	var data = block.getData();
	
	var json = {number : number, 
			hash: hash,
			parentHash: parentHash,
			uncleHash: uncleHash,
			coinbase: coinbase,
			root: root,
			txHash: txHash,
			difficulty: difficulty,
			gasLimit: gasLimit,
			gasUsed: gasUsed,
			time: time,
			extra: extra,
			mixDigest: mixDigest,
			nonce: nonce,
			tx_count: tx_count,
			uncle_count: uncle_count,
			size: size,
			blockTime: blockTime,
			reward: reward,
			totalFee: totalFee,			
			totalDifficulty: totalDifficulty/*,
			web3data: [data]*/
	};

	return json;
};

function getBlocksJsonArray(blocks) {
	
	var jsonarray = [];
	
	for (var i = 0; i < blocks.length; i++) {
		jsonarray.push(getBlockJson(blocks[i]));
		
		if (i > global.max_returned_blocks)
			break;
	}
	
	return jsonarray;
};


exports.blocks = function(req, res) {
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);
	
    global.log("/blocks called offset is " + offset + " and count is " + count);

	if (count > global.max_returned_blocks) {
		count = global.max_returned_blocks;
		global.log("resizing request from offset " + offset + " and count " + count);
	}

	var blocks = Block.getLastBlocks(offset, count);
	
	if (blocks !== undefined) {
		var jsonarray = getBlocksJsonArray(blocks);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , data: jsonarray};
		
			res.json(jsonresult);
		}
		else {
			var error = 'could not write json response';
			var jsonresult = {status: 0
					, error: error};

			res.json(jsonresult);
		}
		  
	  } else {
		  var error = 'could not get latest block';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }
};

exports.blocks_range = function(req, res) {
	var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
	var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : global.max_returned_blocks);
	
    global.log("/blocks/range called from " + fromBlock + " to " + toBlock);

	if ((toBlock - fromBlock) >= global.max_returned_blocks) {
		toBlock = fromBlock + global.max_returned_blocks - 1;
		global.log("resizing request from block " + fromBlock + " to block " + toBlock);
	}

    var blocks = Block.getBlocksRange(fromBlock, toBlock);
	
	if (blocks !== undefined) {
		var jsonarray = getBlocksJsonArray(blocks);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , data: jsonarray};
		
			res.json(jsonresult);
		}
		else {
			var error = 'could not write json response';
			var jsonresult = {status: 0
					, error: error};

			res.json(jsonresult);
		}
		  
	  } else {
		  var error = 'could not get latest block';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }
};

exports.blocks_count = function(req, res) {
	var block = Block.getLatestBlock();
	var blocknumber = block.getBlockNumber();
	
	if (blocknumber != -1) {
		  var jsonresult = {status: 1
				  , data: [ {count: blocknumber}]};
		  
		  res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get latest block';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }

};

exports.blocks_range_txs = function(req, res) {
	var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
	var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : global.max_returned_blocks);
	
	global.log("blocks_range_txs called from block " + fromBlock + " to block " + toBlock);

	// we return all the transactions (no limit on number of transactions)
	// for max returned number of blocks
	
	if ((toBlock - fromBlock) >= global.max_returned_blocks) {
		toBlock = fromBlock + global.max_returned_blocks - 1;
		global.log("resizing request from block " + fromBlock + " to block " + toBlock);
	}

	var transactions = Transaction.getBlocksRangeTransactions(fromBlock, toBlock);
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};



// block Routes
exports.block = function(req, res) {
	var blockId = (req.params.id !== undefined ? req.params.id : 0);

	global.log("block called for block " + blockId);
	
	var block = Block.getBlock(blockId);
	
	if (block !== false) {
		var json = getBlockJson(block)
		
		if (json !== false) {
			  var jsonresult = {status: 1
					  , data: [ json ]};
		       	
			  res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get block json';
			  var jsonresult = {status: 0
					  , error: error};

			  res.json(jsonresult);
		  }
		
	}
	else {
		  var error = 'could not find block ' + blockId;
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
		
	}
	
};

exports.block_transactions = function(req, res) {
	var blockId = (req.params.id !== undefined ? req.params.id : 0);

	global.log("block_transactions called for block " + blockId);
	
	var block = Block.getBlock(blockId);
	
	var transactions = Transaction.getBlockTransactions(block);
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};


// tx Routes

exports.transaction = function(req, res) {
	var txahash = (req.params.id !== undefined ? req.params.id : null);

	global.log("transaction called from hash " + (txahash !== null ? txahash : 'null'));
	
	
	var transaction = Transaction.getTransaction(txahash);
	
	if (transaction !== null) {
		var json = getTransactionJson(transaction)
		
		if (json !== false) {
			  var jsonresult = {status: 1
					  , data: [ json ]};
		       	
			  res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get transaction json';
			  var jsonresult = {status: 0
					  , error: error};

			  res.json(jsonresult);
		  }
		  
	  } else {
		  var error = 'could not get transaction data';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

exports.transactions_count = function(req, res) {
	var address = (req.params.id !== undefined ? req.params.id : null);
	
	global.log("transactions_count called for address " + (address !== null ? address : 'null'));
	
	var count = Transaction.getTransactionCount(address);
	
	if (count !== false) { 
		var jsondata = {count : count };
		
		var jsonresult = {status: 1
				  , data: [ jsondata ]};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get transaction count';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

function getTransactionJson(transaction) {
	
	var data = transaction.getData();
	var receiptdata = transaction.getTransactionReceiptData();
	
	var hash = transaction.getHash();
	var sender = transaction.getSender();
	var recipient = transaction.getRecipient();
	var accountNonce = transaction.getAccountNonce();
	var price = transaction.getGasPrice();
	var gasLimit = transaction.getGasLimit();
	var amount = transaction.getAmount();
	var block_id = transaction.getBlockId();
	var time = new Date(transaction.getUnixTimeStamp()).toISOString();
	var newContract = transaction.getNewContract();
	var isContractTx = transaction.getIsContractTx();
	var blockHash = transaction.getBlockHash();
	var parentHash = transaction.getParentHash();
	var txIndex = transaction.getTxIndex();
	var gasUsed = transaction.getGasUsed();
	var type = transaction.getType();
	
	var json = {
			hash: hash,
			sender: sender,
			recipient: recipient,
			accountNonce: accountNonce,
			price: price,
			gasLimit: gasLimit,
			amount: amount,
			block_id: block_id,
			time: time,
			newContract: newContract,
			isContractTx: isContractTx,
			blockHash: blockHash,
			parentHash: parentHash,
			txIndex: txIndex,
			gasUsed: gasUsed,
			type: type/*,
			
			
			web3data: data,
			web3receiptdata: receiptdata*/};
	
	return json;
};

function getTransactionsJsonArray(transactions) {
	var jsonarray = [];
	
	if ((transactions !== false) && (transactions != null)){ 
		
		for (var i = 0, len = transactions.length; i < len; i++) {
			var transaction = transactions[i];
			
			if (transaction) {
				var txjson = getTransactionJson(transaction);
				jsonarray.push(txjson);
			}
		}
		
		  
	  } else {
		  jsonarray = false;
	  }
	
	return jsonarray;
}


exports.transactions = function(req, res) {
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);

	global.log("transactions called with offset " + offset + " and count " + count);

	if (count > global.max_returned_transactions) {
		count = global.max_returned_transactions;
		global.log("resizing request from offset " + offset + " and count " + count);
	}

	var transactions = Transaction.getTransactions(offset, count);
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};


//account Routes

function getAccountJson(account) {
	
	var accountaddr = account.getAddress();
	var balance = account.getBalance();
	var nonce = account.getNonce();
	var code = account.getCode();
	var name = account.getName();
	var storage = account.getStorage();
	var firstseen = new Date(account.getUnixFirstSeenTimeStamp()).toISOString();
	var transactioncount = account.getTransactionCount();
	var currentblocknumber = account.getCurrentBlockNumber();
	var new_blocks_seen = account.getNewBlocksSeen();
	
	var json = {address: accountaddr,
				balance: balance,
				nonce: nonce,
				code: code,
				name: name,
				storage: storage,
				firstseen: firstseen,
				transactioncount: transactioncount,
				currentblocknumber: currentblocknumber,
				new_blocks_seen: new_blocks_seen
				};
	
	return json;
};

function getAccountsJsonArray(accounts) {
	var jsonarray = [];
	
	if (accounts !== false) { 
		
		for (var i = 0, len = accounts.length; i < len; i++) {
			var account = accounts[i];
			var accjson = getAccountJson(account);
			jsonarray.push(accjson);
		}
		
		  
	  } else {
		  jsonarray = false;
	  }
	
	return jsonarray;
}



exports.account = function(req, res) {
	var accountaddr = req.params.id;
	
	var account = Account.getAccount(accountaddr);
	
	var json = getAccountJson(account);
	
	var jsonresult = {status: 1
			, data: [json]};
	
	global.log('/account json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
};

exports.accounts = function(req, res) {
	var accountaddressesstring = req.params.ids;
	var accountaddresses = accountaddressesstring.split(',');
	
	var accounts = Account.getAccounts(accountaddresses);
	
	var jsonarray = getAccountsJsonArray(accounts);
	
	var jsonresult = {status: 1
			, data: jsonarray};
	
	global.log('/account/multiple json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
};

//source
exports.account_source = function(req, res) {
	var accountaddr = req.params.id;
	
	global.log("account_source called for " + accountaddr );

	var account = Account.getAccount(accountaddr);
	
	  var error = 'not implemented yet';
	  var jsonresult = {status: 0
			  , error: error};

	  res.json(jsonresult);
};

//account mining
exports.account_mined = function(req, res) {
	var accountaddr = req.params.id;
	var bforcefullsearch = (req.params.full && (req.params.full == "full") ? true : false);
	
	var account = Account.getAccount(accountaddr);

	// we get list of blocks within max_processed_blocks if bforcefullsearch = false
	var blocks = account.getMinedBlocks(bforcefullsearch);
	
	if (blocks !== undefined) {
		var jsonarray = [];
		
		for (var i = 0, len = blocks.length; i < len; i++) {
			var block = blocks[i];
			var blocknumber = block.getBlockNumber();
			var blocktime = new Date(block.getUnixBlockTimeStamp()).toISOString();
			jsonarray.push({number: blocknumber, time: blocktime});
		}
		
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get latest mined blocks';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }
};

exports.account_mined_full = function(req, res) {
	req.params.full = "full";
	
	return exports.account_mined(req, res);
}


exports.account_mined_today = function(req, res) {
	// returned the numbers of blocks mined for current day from an account
	var accountaddr = req.params.id;
	
	var account = Account.getAccount(accountaddr);

	var blocks = account.getMinedBlocksToday();
	
	if (blocks !== undefined) {
		var jsonarray = [];
		
		for (var i = 0, len = blocks.length; i < len; i++) {
			var block = blocks[i];
			var blocknumber = block.getBlockNumber();
			var blocktime = new Date(block.getUnixBlockTimeStamp()).toISOString();
			jsonarray.push({number: blocknumber, time: blocktime});
		}
		
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
	} else {
		  var error = 'could not get today\'s blocks';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }
	
};

exports.account_mininghistory = function(req, res) {
	// returned the numbers of blocks mined for current day from an account
	var accountaddr = req.params.id;
	
	var account = Account.getAccount(accountaddr);
	
	var ndays = 60;

	var blocks = account.getMinedBlocksPastDays(ndays);
	
	if (blocks !== undefined) {
		var jsonarray = [];
		
		// we initialize a map with the last month days
		var zero_am_timestamp = global.getZeroAMTimeStamp();
		
		var historyarray = [];
		var timestamp = zero_am_timestamp;
		
		for (i = 0; i < ndays + 1; i++) {
			historyarray[i] = new Object();
			historyarray[i].time = timestamp;
			historyarray[i].count = 0;
			
			timestamp -= 24*60*60*1000;
		}
		
		// we count the blocks mined each day
		for (var i = 0, len = blocks.length; i < len; i++) {
			global.log("i is " + i);
			var block = blocks[i];
			var blocknumber = block.getBlockNumber();
			var blocktime = block.getUnixBlockTimeStamp();
			var index = Math.trunc(((blocktime - zero_am_timestamp) > 0 ? blocktime - zero_am_timestamp : (zero_am_timestamp - blocktime) + 1) / (24*60*60*1000));
			global.log("index is " + index);
				
			historyarray[index].count = historyarray[index].count + 1;
		}
		
		// build the json array
		for (var i = 0, len = historyarray.length; i < len; i++) {
			var day = new Date(historyarray[i].time).toISOString();
			var count = historyarray[i].count;
			jsonarray.push({day: day, minedBlocks: count});
		}
		
		var jsonresult = {status: 1
				  , data: jsonarray};
	       	
		res.json(jsonresult);
	} else {
		  var error = 'could not get history blocks';
		  var jsonresult = {status: 0
				  , error: error};
	
		  res.json(jsonresult);
	  }
	
};

exports.account_miningunclehistory = function(req, res) {
	var accountaddr = req.params.id;
	
	  var error = 'not implemented yet';
	  var jsonresult = {status: 0
			  , error: error};

	  res.json(jsonresult);
	
};

//account transactions
exports.account_txs = function(req, res) {
	var accountaddr = req.params.id;
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	
	global.log("account_tx called for " + accountaddr + " and offset " + offset);

	// we return a maximum of max_returned_transactions transactions
	
	var blockscan = Utility.getBlockScanObject();

	var transactions = Account.getTransactionsFrom(accountaddr, offset, blockscan);
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , highestblock: blockscan.getHighestBlockSearched()
				  , lowestblock: blockscan.getLowestBlockSearched()
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};

exports.account_txs_in_blocks = function(req, res) {
	var accountaddr = req.params.id;
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 0);
	var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
	var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : null);
	
	global.log("account_txs_in_blocks called for " + accountaddr + " and offset " + offset + " from block " + fromBlock + " to block " + toBlock);

	// we return of transactions for maximum_returned_blocks

	if ((toBlock - fromBlock) >= global.max_returned_blocks) {
		toBlock = fromBlock + global.max_returned_blocks - 1;
		global.log("resizing request from block " + fromBlock + " to block " + toBlock);
	}

	var blockscan = Utility.getBlockScanObject();

	var transactions = Account.getTransactionsWithin(accountaddr, offset, fromBlock, toBlock, blockscan);
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , highestblock: blockscan.getHighestBlockSearched()
				  , lowestblock: blockscan.getLowestBlockSearched()
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};

exports.account_txs_before_block = function(req, res) {
	var accountaddr = req.params.id;
	var blockid = (req.params.blockid !== undefined ? parseInt(req.params.blockid) : -1);
	
	global.log("account_txs_before_block called for " + accountaddr + " and blockid " + blockid);


	var blockscan = Utility.getBlockScanObject();

	var transactions;
	
	if (blockid != -1) {
		// we do not limit the number of transactions returned, but rely
		// on number of processed_blocks in the model

		transactions = Account.getTransactionsBefore(accountaddr, blockid, blockscan);
	}
	else {
		// we return a number of transactions for max_returned_blocks
		var currentblock = Block.getCurrentBlockNumber();
		
		var offset = 0;
		var toBlock = currentblock;
		var fromBlock = toBlock - global.max_returned_blocks + 1;
		
		transactions = Account.getTransactions(accountaddr, offset, fromBlock, toBlock, blockscan);
	}
		
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , highestblock: blockscan.getHighestBlockSearched()
				  , lowestblock: blockscan.getLowestBlockSearched()
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};

exports.account_txs_after_block = function(req, res) {
	var accountaddr = req.params.id;
	var blockid = (req.params.blockid !== undefined ? parseInt(req.params.blockid) : -1);
	
	global.log("account_txs_after_block called for " + accountaddr + " and blockid " + blockid);

	var blockscan = Utility.getBlockScanObject();

	var transactions;
	
	if (blockid != -1) {
		// we return a number of transactions for max_processed_blocks
		
		transactions = Account.getTransactionsAfter(accountaddr, blockid, blockscan);
	}
	else {
		// we return a number of transactions for max_returned_blocks
		var offset = 0;
		var fromBlock = 0;
		var toBlock = fromBlock + global.max_returned_blocks - 1;
		
		transactions = Account.getTransactions(accountaddr, offset, fromBlock, toBlock, blockscan);
		
	}
		
	var jsonarray = getTransactionsJsonArray(transactions);
	
	if (jsonarray !== false) { 
		var jsonresult = {status: 1
				  , highestblock: blockscan.getHighestBlockSearched()
				  , lowestblock: blockscan.getLowestBlockSearched()
				  , data: jsonarray};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	  }
};



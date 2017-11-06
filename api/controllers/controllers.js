/**
 * 
 */

'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();

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

// account Routes
var Account = require('../../lib/includes/account.js');

exports.account = function(req, res) {
	var accountaddr = req.params.id;
	
	var account = Account.getAccount(accountaddr);
	
    var balance = account.getBalance();
    var transactioncount = account.getTransactionCount();
   
	var jsonresult = {status: 1
			, data: [ {address: accountaddr,
						balance: balance,
						transactioncount: transactioncount
						}]};
	
	global.log('/account json result is ' + JSON.stringify(jsonresult));
	
	res.json(jsonresult);
};

exports.account_txs = function(req, res) {
	var accountaddr = req.params.id;
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	
	global.log("account_tx called for " + accountaddr + " and offset " + offset);

	var account = Account.getAccount(accountaddr);
	
	// we return a maximum of max_returned_transactions transactions

	var transactions = account.getTransactionsFrom(offset);
	var jsondata = getTransactionsJson(transactions);
	
	if (jsondata !== false) { 
		var jsonresult = {status: 1
				  , data: jsondata};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

exports.account_txs_blocks = function(req, res) {
	var accountaddr = req.params.id;
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 0);
	var fromBlock = (req.params.start !== undefined ? parseInt(req.params.start) : 0);
	var toBlock = (req.params.finish !== undefined ? parseInt(req.params.finish) : null);
	
	global.log("account_tx called for " + accountaddr + " and offset " + offset + " from block " + fromBlock + " to block " + toBlock);

	var account = Account.getAccount(accountaddr);
	
	// we return a maximum of max_returned_transactions transactions

	var transactions = account.getTransactionsWithin(offset, fromBlock, toBlock);
	var jsondata = getTransactionsJson(transactions);
	
	if (jsondata !== false) { 
		var jsonresult = {status: 1
				  , data: jsondata};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

// blocks Routes
var Block = require('../../lib/includes/block.js');


function getBlockJson(block) {
	
	var number = block.getBlockNumber();
	var data = block.getData();
	
	var json = {number : block.getBlockNumber(), data: [data]};
	
	return json;
};

exports.blocks = function(req, res) {
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);
	
    global.log("/blocks called offset is " + offset + " and count is " + count);

    var blocks = Block.getBlocks(offset, count);
	
	if (blocks !== undefined) {
		var jsonlist = [];
	
		for (var i = 0; i < blocks.length; i++) {
			jsonlist.push(getBlockJson(blocks[i]));
		}
		
		var jsonresult = {status: 1
			, data: jsonlist};
		
		res.json(jsonresult);
		  
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

// block Routes
exports.block = function(req, res) {
	var blockId = req.params.id;
	var block = Block.getBlock(blockId);
	var blockdata = block.getData();
	
	if (blockdata !== null) {
		  var jsonresult = {status: 1
				  , data: [ blockdata ]};
	       	
		  res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get block data';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

exports.block_transactions = function(req, res) {
	var blockId = req.params.id;
	var block = Block.getBlock(blockId);
	
	var transactions = block.getTransactions();
	var jsondata = getTransactionsJson(transactions);
	
	if (jsondata !== false) { 
		var jsonresult = {status: 1
				  , data: jsondata};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};


// statistics
var Statistics = require('../../lib/includes/statistics.js');

exports.difficulty = function(req, res) {
};

exports.gasPrice = function(req, res) {
	var gasPrice = Statistics.getGasPrice();
	
	if (gasPrice !== false) {
		  var jsonresult = {result: {gasprice: gasPrice}};
		  
		  global.log('getGasPrice result is ' + JSON.stringify(jsonresult));
		  
		  res.json(jsonresult);
		  
	  } else {
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
}

// tx Routes
var Transaction = require('../../lib/includes/transaction.js');

exports.transaction = function(req, res) {
	var txahash = req.params.id;
	var transaction = Transaction.getTransaction(txahash);
	var txdata = transaction.getData();
	
	if (txdata !== null) {
		  var jsonresult = {status: 1
				  , data: [ txdata ]};
	       	
		  res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get transaction data';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};

exports.transactions_count = function(req, res) {
	var address = req.params.id;
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
	
	var transactiontimestring = "" + new Date(transaction.time * 1000).toGMTString() + ""
	
	var json = {
			hash: transaction.hash,
			sender: transaction.sender,
			recipient: transaction.recipient,
			accountNonce: transaction.accountNonce,
			price: transaction.price,
			gasLimit: transaction.gasLimit,
			amount: transaction.amount,
			block_id: transaction.block_id,
			time: transaction.time,
			newContract: transaction.newContract,
			isContractTx: transaction.isContractTx,
			blockHash: transaction.blockHash,
			parentHash: transaction.parentHash,
			txIndex: transaction.txIndex,
			gasUsed: transaction.gasUsed,
			type: transaction.type,
			
			
			data: data};
	
	return json;
};

function getTransactionsJson(transactions) {
	var jsondata = [];
	
	if (transactions !== false) { 
		var jsondata = [];
		
		for (var i = 0, len = transactions.length; i < len; i++) {
			var transaction = transactions[i];
			var txjson = getTransactionJson(transaction);
			jsondata.push(txjson);
		}
		
		  
	  } else {
		  jsondata = false;
	  }
	
	return jsondata;
}


exports.transactions = function(req, res) {
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);

	var transactions = Transaction.getTransactions(offset, count);
	var jsondata = getTransactionsJson(transactions);
	
	if (jsondata !== false) { 
		var jsonresult = {status: 1
				  , data: jsondata};
	       	
		res.json(jsonresult);
		  
	  } else {
		  var error = 'could not get any transaction';
		  var jsonresult = {status: 0
				  , error: error};

		  res.json(jsonresult);
	  }
};


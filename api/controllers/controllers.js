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

exports.account_tx = function(req, res) {
	var accountaddr = req.params.id;
	var offset = req.params.offset;
	
	global.log("account_tx called for " + accountaddr + " and offset " + offset);

	//account = Account.getAccount(accountaddr);
	
	var account = new Account();
	account.address = accountaddr;

	global.log("account found ");

	var tx_array_data = account.getTransactionsData();
	
	if (tx_array_data !== false) {
		  var jsonresult = {status: 1
				  , data: [ tx_array_data ]};
	       	
		  res.json(jsonresult);
		
	}
	else {
		  var error = 'could not get transactions for the account';
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
	var blockdata = block.getTransactions();
	
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



exports.transactions = function(req, res) {
	var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
	var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);

	var count = Transaction.getTransactions(offset, count);
	
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


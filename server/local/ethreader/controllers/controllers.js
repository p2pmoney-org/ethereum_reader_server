/**
 * 
 */

'use strict';

//requires
//should be in this precise order to respect
//the non circular dependencies of objects
/*var Global = require('../service.js');

var global = Global.getGlobalInstance();*/

var Utility = require('../model/utility.js');

var EthNode = require('../model/ethnode.js');

var Statistics = require('../model/statistics.js');

var Block = require('../model/block.js');

var Transaction = require('../model/transaction.js');

var Account = require('../model/account.js');

var Contract = require('../model/contract.js');


class EthReaderControllers {
	
	constructor(glob) {
		this.global = glob;
	}
	
	// deployment routes
	config(req, res) {
		// GET
		var global = this.global;
		
		var globalconfig = global.readJson('config');
		var config = {};
		
		if (globalconfig.server_env === 'dev') {
			config = globalconfig;
		}
		else {
			config.server_env = "prod";
			
			config.rest_server_url = globalconfig.rest_server_url;
			config.rest_server_api_path = globalconfig.rest_server_api_path;
		}
		
		
		var jsonresult = {status: 1
				, config: config};
		
		global.log('/config json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
		
	}

	get_logs_server_tail(req, res) {
		// GET
		var global = this.global;

		global.log("logs_server_tail called");
		
		var lines = [];
		
		if (global.config.server_env === 'dev') {
			lines = global.tail_log_file();
		}
		
		var jsonresult = {status: 1, lines:  lines};
	  	
	  	res.json(jsonresult);
	  	
	}
	
	
	
	// ethereum node Routes

	node(req, res) {
		// GET
		var global = this.global;
		var ethnode = EthNode.getEthNode();
		
		global.log("node called");

		try {
			var islistening = ethnode.isListening();
			var networkid = ethnode.getNetworkId();
			var peercount = ethnode.getPeerCount();
			var issyncing = ethnode.isSyncing();
			var currentblock = ethnode.getCurrentBlockNumber();
			var highestblock = ethnode.getHighestBlockNumber();
			
			var json = {
					networkid: networkid,
					islistening: islistening,
					peercount: peercount,
					issyncing: issyncing,
					currentblock: currentblock,
					highestblock: highestblock
			};
		}
		catch(e) {
			global.log("exception in node: " + e);
			global.log(e.stack);
		}
		
		
		if (json) {
			var jsonresult = {status: 1
					, data: [json]};
		}
		else {
			var jsonresult = {status: 0
					, error: "could not retrieve node info"};
		}
		
		
		global.log('/node json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
		
	}


	node_hashrate(req, res) {
		var global = this.global;
		var ethnode = EthNode.getEthNode();
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();
		
		var hashrate = ethnode.getHashRate();
		
		if (hashrate !== false) {
			  var json = {hashrate: hashrate};
			
			  var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: [json]};
			  
			  global.log('/node/hashrate json result is ' + JSON.stringify(jsonresult));
			  
			  res.json(jsonresult);
			  
		  } else {
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	}


	//statistics

	difficulty(req, res) {
		var global = this.global;
		//var lastblock = Block.getLatestBlock();
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();
		
		var difficulty = lastblock.getDifficulty();
		
		if (difficulty !== false) {
			  var json = {difficulty: difficulty};
			  var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: [json]};
			  
			  
			  global.log('/difficulty json result is ' + JSON.stringify(jsonresult));
			  
			  res.json(jsonresult);
			  
		  } else {
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	gasPrice(req, res) {
		var global = this.global;
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var gasPrice = Statistics.getGasPrice();
		
		if (gasPrice !== false) {
			  var json = {gasprice: gasPrice};
			  var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: [json]};
			  
			  
			  global.log('/gasPrice json result is ' + JSON.stringify(jsonresult));
			  
			  res.json(jsonresult);
			  
		  } else {
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	}

	miningEstimator(req, res) {
		var global = this.global;
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
					, nodeblocknumber: nodeblocknumber
					, data: [json]};
	  
	  
			global.log('/miningEstimator json result is ' + JSON.stringify(jsonresult));
			  
			res.json(jsonresult);
			  
		  } else {
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	}


	// blocks Routes

	getBlockJson(block) {
		
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

	getBlocksJsonArray(blocks) {
		
		var jsonarray = [];
		
		for (var i = 0; i < blocks.length; i++) {
			jsonarray.push(this.getBlockJson(blocks[i]));
			
			if (i > global.max_returned_blocks)
				break;
		}
		
		return jsonarray;
	};


	blocks(req, res) {
		var global = this.global;
		var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
		var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("/blocks called offset is " + offset + " and count is " + count);

		if (count > global.max_returned_blocks) {
			count = global.max_returned_blocks;
			global.log("resizing request from offset " + offset + " and count " + count);
		}

		var blocks = Block.getLastBlocks(offset, count);
		
		if (blocks !== undefined) {
			var jsonarray = this.getBlocksJsonArray(blocks);
			
			if (jsonarray !== false) { 
				var jsonresult = {status: 1
						  , nodeblocknumber: nodeblocknumber
						  , data: jsonarray};
			
				res.json(jsonresult);
			}
			else {
				var error = 'could not write json response';
				var jsonresult = {status: 0
						, nodeblocknumber: nodeblocknumber
						, error: error
						, data: []};

				res.json(jsonresult);
			}
			  
		  } else {
			  var error = 'could not get latest block';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }
	};

	blocks_range(req, res) {
		var global = this.global;
		var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
		var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : global.max_returned_blocks);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("/blocks/range called from " + fromBlock + " to " + toBlock);

		if ((toBlock - fromBlock) >= global.max_returned_blocks) {
			toBlock = fromBlock + global.max_returned_blocks - 1;
			global.log("resizing request from block " + fromBlock + " to block " + toBlock);
		}

	    var blocks = Block.getBlocksRange(fromBlock, toBlock);
		
		if (blocks !== undefined) {
			var jsonarray = this.getBlocksJsonArray(blocks);
			
			if (jsonarray !== false) { 
				var jsonresult = {status: 1
						  , nodeblocknumber: nodeblocknumber
						  , data: jsonarray};
			
				res.json(jsonresult);
			}
			else {
				var error = 'could not write json response';
				var jsonresult = {status: 0
						, nodeblocknumber: nodeblocknumber
						, error: error
						, data: []};

				res.json(jsonresult);
			}
			  
		  } else {
			  var error = 'could not get latest block';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }
	};

	blocks_count(req, res) {
		var global = this.global;
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var block = Block.getLatestBlock();
		var blocknumber = block.getBlockNumber();
		
		if (blocknumber != -1) {
			  var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: [ {count: blocknumber}]};
			  
			  res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get latest block';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }

	};

	blocks_range_txs(req, res) {
		var global = this.global;
		var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
		var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : global.max_returned_blocks);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("blocks_range_txs called from block " + fromBlock + " to block " + toBlock);

		// we return all the transactions (no limit on number of transactions)
		// for max returned number of blocks
		
		if ((toBlock - fromBlock) >= global.max_returned_blocks) {
			toBlock = fromBlock + global.max_returned_blocks - 1;
			global.log("resizing request from block " + fromBlock + " to block " + toBlock);
		}

		var transactions = Transaction.getBlocksRangeTransactions(fromBlock, toBlock);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};



	// block Routes
	block(req, res) {
		var global = this.global;
		var blockId = (req.params.id !== undefined ? req.params.id : 0);

		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("block called for block " + blockId);
		
		var block = Block.getBlock(blockId);
		
		if (block !== false) {
			var json = this.getBlockJson(block)
			
			if (json !== false) {
				  var jsonresult = {status: 1
						  , nodeblocknumber: nodeblocknumber
						  , data: [ json ]};
			       	
				  res.json(jsonresult);
				  
			  } else {
				  var error = 'could not get block json';
				  var jsonresult = {status: 0
						  , nodeblocknumber: nodeblocknumber
						  , error: error
						  , data: []};

				  res.json(jsonresult);
			  }
			
		}
		else {
			  var error = 'could not find block ' + blockId;
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
			
		}
		
	};

	block_transactions(req, res) {
		var global = this.global;
		var blockId = (req.params.id !== undefined ? req.params.id : 0);

		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("block_transactions called for block " + blockId);
		
		var block = Block.getBlock(blockId);
		
		var transactions = Transaction.getBlockTransactions(block);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};


	// tx Routes

	transaction(req, res) {
		var global = this.global;
		var txahash = (req.params.id !== undefined ? req.params.id : null);

		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("transaction called from hash " + (txahash !== null ? txahash : 'null'));
		
		
		var transaction = Transaction.getTransaction(txahash);
		
		if (transaction !== null) {
			var json = this.getTransactionJson(transaction)
			
			if (json !== false) {
				  var jsonresult = {status: 1
						  , nodeblocknumber: nodeblocknumber
						  , data: [ json ]};
			       	
				  res.json(jsonresult);
				  
			  } else {
				  var error = 'could not get transaction json';
				  var jsonresult = {status: 0
						  , nodeblocknumber: nodeblocknumber
						  , error: error
						  , data: []};

				  res.json(jsonresult);
			  }
			  
		  } else {
			  var error = 'could not get transaction data';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	transactions_count(req, res) {
		var global = this.global;
		var address = (req.params.id !== undefined ? req.params.id : null);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("transactions_count called for address " + (address !== null ? address : 'null'));
		
		var count = Transaction.getTransactionCount(address);
		
		if (count !== false) { 
			var jsondata = {count : count };
			
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: [ jsondata ]};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get transaction count';
			  var jsonresult = {status: 0
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	getTransactionJson(transaction) {
		
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

	getTransactionsJsonArray(transactions) {
		var jsonarray = [];
		
		if ((transactions !== false) && (transactions != null)){ 
			
			for (var i = 0, len = transactions.length; i < len; i++) {
				var transaction = transactions[i];
				
				if (transaction) {
					var txjson = this.getTransactionJson(transaction);
					jsonarray.push(txjson);
				}
			}
			
			  
		  } else {
			  jsonarray = false;
		  }
		
		return jsonarray;
	}


	transactions(req, res) {
		var global = this.global;
		var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : 1);
		var count = (req.params.count !== undefined ? parseInt(req.params.count) : 1);

		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("transactions called with offset " + offset + " and count " + count);

		if (count > global.max_returned_transactions) {
			count = global.max_returned_transactions;
			global.log("resizing request from offset " + offset + " and count " + count);
		}

		var transactions = Transaction.getTransactions(offset, count);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};


	//account Routes

	getAccountJson(account) {
		
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

	getAccountsJsonArray(accounts) {
		var jsonarray = [];
		
		if (accounts !== false) { 
			
			for (var i = 0, len = accounts.length; i < len; i++) {
				var account = accounts[i];
				var accjson = this.getAccountJson(account);
				jsonarray.push(accjson);
			}
			
			  
		  } else {
			  jsonarray = false;
		  }
		
		return jsonarray;
	}



	account(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var account = Account.getAccount(accountaddr);
		
		if (account) {
			var json = this.getAccountJson(account);
			
			var jsonresult = {status: 1
					, nodeblocknumber: nodeblocknumber
					, data: [json]};
		}
		else {
			  var error = 'address does not correspond to an account: ' + accountaddr;
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		}
		
		
		global.log('/account json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
	};

	accounts(req, res) {
		var global = this.global;
		var accountaddressesstring = req.params.ids;
		var accountaddresses = accountaddressesstring.split(',');
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var accounts = Account.getAccounts(accountaddresses);
		
		if (accounts) {
			var jsonarray = this.getAccountsJsonArray(accounts);
			
			var jsonresult = {status: 1
					, nodeblocknumber: nodeblocknumber
					, data: jsonarray};
			
		}
		else {
			  var error = 'could not retrieve array of accounts for list provided';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		}
		
		
		global.log('/account/multiple json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
	};

	//source
	account_source(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("account_source called for " + accountaddr );

		var account = Account.getAccount(accountaddr);
		
		  var error = 'not implemented yet';
		  var jsonresult = {status: 0
				  , nodeblocknumber: nodeblocknumber
				  , error: error
				  , data: []};

		  res.json(jsonresult);
	};

	//account mining
	account_mined(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var bforcefullsearch = (req.params.full && (req.params.full == "full") ? true : false);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get latest mined blocks';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }
	};

	account_mined_full(req, res) {
		req.params.full = "full";
		
		return this.account_mined(req, res);
	}


	account_mined_today(req, res) {
		var global = this.global;
		// returned the numbers of blocks mined for current day from an account
		var accountaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
		} else {
			  var error = 'could not get today\'s blocks';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }
		
	};

	account_mininghistory(req, res) {
		var global = this.global;
		// returned the numbers of blocks mined for current day from an account
		var accountaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
					  , nodeblocknumber: nodeblocknumber
					  , data: jsonarray};
		       	
			res.json(jsonresult);
		} else {
			  var error = 'could not get history blocks';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		
			  res.json(jsonresult);
		  }
		
	};

	account_miningunclehistory(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var error = 'not implemented yet';
		
		var jsonresult = {status: 0
				, nodeblocknumber: nodeblocknumber
				, error: error
				, data: []};

		res.json(jsonresult);
		
	};

	//account transactions
	account_txs(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : -1);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("account_tx called for " + accountaddr + " and offset " + offset);

		// we return a maximum of max_returned_transactions transactions
		offset = (offset < 0 ?  global.max_returned_transactions : offset);
		
		var blockscan = Utility.getBlockScanObject();

		var transactions = Account.getTransactionsFrom(accountaddr, offset, blockscan);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
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

	account_previous_txs(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var offsetasked = (req.params.offset !== undefined ? parseInt(req.params.offset) : 0);
		var count = (req.params.count !== undefined ? parseInt(req.params.count) : global.max_returned_transactions);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("account_previous_txs called for " + accountaddr + " with offset " + offset + " and count " + count);

		// we return a maximum of max_returned_transactions transactions
		// and do the flip from backwarding reading to forward reading
		var offset = (global.max_processed_transactions - offsetasked > 0 ? global.max_processed_transactions - offsetasked : global.max_processed_transactions);
		
		var blockscan = Utility.getBlockScanObject();

		var transactions = Account.getLastTransactions(accountaddr, offset, count, blockscan);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , highestblock: blockscan.getHighestBlockSearched()
					  , lowestblock: blockscan.getLowestBlockSearched()
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	account_next_txs(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : -1);
		var count = (req.params.count !== undefined ? parseInt(req.params.count) : global.max_returned_transactions);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("account_next_txs called for " + accountaddr + " with offset " + offset + " and count " + count);

		// we return a maximum of max_returned_transactions transactions
		offset = (offset < 0 ?  global.max_returned_transactions : offset);
		
		var blockscan = Utility.getBlockScanObject();

		var transactions = Account.getLastTransactions(accountaddr, offset, count, blockscan);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , highestblock: blockscan.getHighestBlockSearched()
					  , lowestblock: blockscan.getLowestBlockSearched()
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	account_txs_in_blocks(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var offset = (req.params.offset !== undefined ? parseInt(req.params.offset) : -1);
		var fromBlock = (req.params.from !== undefined ? parseInt(req.params.from) : 0);
		var toBlock = (req.params.to !== undefined ? parseInt(req.params.to) : null);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		global.log("account_txs_in_blocks called for " + accountaddr + " and offset (not used) " + offset + " from block " + fromBlock + " to block " + toBlock);

		// we return of transactions for maximum_returned_blocks
		offset = (offset < 0 ?  global.max_returned_transactions : offset);

		if ((toBlock - fromBlock) >= global.max_processed_blocks) {
			toBlock = fromBlock + global.max_processed_blocks - 1;
			global.log("resizing request from block " + fromBlock + " to block " + toBlock);
		}

		var blockscan = Utility.getBlockScanObject();

		var transactions = Account.getTransactionsWithin(accountaddr, fromBlock, toBlock, blockscan);
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , highestblock: blockscan.getHighestBlockSearched()
					  , lowestblock: blockscan.getLowestBlockSearched()
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	account_txs_before_block(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var blockid = (req.params.blockid !== undefined ? parseInt(req.params.blockid) : -1);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
			
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , highestblock: blockscan.getHighestBlockSearched()
					  , lowestblock: blockscan.getLowestBlockSearched()
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	account_txs_after_block(req, res) {
		var global = this.global;
		var accountaddr = req.params.id;
		var blockid = (req.params.blockid !== undefined ? parseInt(req.params.blockid) : -1);
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

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
			
		var jsonarray = this.getTransactionsJsonArray(transactions);
		
		if (jsonarray !== false) { 
			var jsonresult = {status: 1
					  , nodeblocknumber: nodeblocknumber
					  , highestblock: blockscan.getHighestBlockSearched()
					  , lowestblock: blockscan.getLowestBlockSearched()
					  , data: jsonarray};
		       	
			res.json(jsonresult);
			  
		  } else {
			  var error = 'could not get any transaction';
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		  }
	};

	// contract
	getContractJson(contract) {
		
		var account = contract.getAccount();
		
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


	contract(req, res) {
		var global = this.global;
		var contractaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var contract = Contract.getContract(contractaddr);
		
		if (contract) {
			var json = this.getContractJson(contract);
			
			var jsonresult = {status: 1
					, nodeblocknumber: nodeblocknumber
					, data: [json]};
			
		}
		else {
			  var error = 'address does not correspond to a contract: ' + contractaddr;
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};

			  res.json(jsonresult);
		}
		
		
		global.log('/contract json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
	};

	getObjectJson(obj) {
		var json;
		
		json = JSON.stringify(obj);
		
		return json;
	}

	getContractStateJson(contract) {
		var json;
		
		// contract part
		var account = contract.getAccount();

		var accountaddr = account.getAddress();
		var currentblocknumber = account.getCurrentBlockNumber();
		var new_blocks_seen = account.getNewBlocksSeen();
		
		var jsonaccount = {address: accountaddr,
					currentblocknumber: currentblocknumber,
					new_blocks_seen: new_blocks_seen
					};
		
		// state
		var jsonproparray = [];

		var abi = contract.getAbi();
		
		for (var i = 0; i < abi.length; i++) {
			var jsonelement;
			
			var item = abi[i];
			var constant = item.constant;
			var name = item.name;
			var type = item.type;
			var payable = item.payable;
			var stateMutability = item.stateMutability;
			var signature = item.signature;
			var value = null;
			
			if (item.type === "function" && item.inputs.length === 0 && item.constant) {
				// simple gets
	        	value = contract.callGetter(item);
			
				jsonelement = {
						name: name,
						constant: constant,
						type: type,
						payable: payable,
						stateMutability: stateMutability,
						signature: signature,
						value: value
				};
			
				
				jsonproparray.push(jsonelement);
			}
		}
		
		json = {"contract": jsonaccount,
				"state": jsonproparray};

		
		return json;
	}

	contract_state(req, res) {
		var global = this.global;
		var contractaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var contract = Contract.getContract(contractaddr);
		
		if (contract) {
			// we read the post content
			var abistring = req.body.abi;
			var abi = JSON.parse(abistring);
			
			if (abi) {
				contract.setAbi(abi);
				
				var instance = contract.getInstance();
				
				if (instance) {
					var json = this.getContractStateJson(contract);
					
					var jsonresult = {status: 1
							, nodeblocknumber: nodeblocknumber
							, data: [json]};
					
				}
				else {
					  var error = 'could not instantiate contract with submitted address and post content';
					  var jsonresult = {status: 0
							  , nodeblocknumber: nodeblocknumber
							  , error: error
							  , data: []};
					
				}
				
				
			}
			else {
				  var error = 'abi field not found in post content';
				  var jsonresult = {status: 0
						  , nodeblocknumber: nodeblocknumber
						  , error: error
						  , data: []};
				
			}
			
		}
		else {
			  var error = 'address does not correspond to a contract: ' + contractaddr;
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		}
		
		
		global.log('/contract json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
	};

	contract_get(req, res) {
		var global = this.global;
		var contractaddr = req.params.id;
		
		var nodeblocknumber = EthNode.getNodeCurrentBlockNumber();

		var contract = Contract.getContract(contractaddr);
		
		if (contract) {
			// we read the post content
			var abistring = req.body.abi;
			var abi = JSON.parse(abistring);
			var methodname = req.body.method;
			var jsonparams = (req.body.params ? JSON.parse(req.body.params) : []);
			var methodparams = [];
			
			// transcode parameters
			for (var i = 0; i < jsonparams.length; i++) {
				var param = Utility.getParamFromJson(jsonparams[i]);
				methodparams.push(param);
			}
			
			if (abi) {
				contract.setAbi(abi);
				
				var instance = contract.getInstance();
				
				if (instance) {
					try {
						var result = contract.callReadMethod(methodname, methodparams);
						
						var json = {result: result};
						
						var jsonresult = {status: 1
								, nodeblocknumber: nodeblocknumber
								, data: [json]};
						
					} catch(e) {
						  var error = 'exception calling contract method: ' + e;
						  var jsonresult = {status: 0
								  , nodeblocknumber: nodeblocknumber
								  , error: error
								  , data: []};
				    }

					
				}
				else {
					  var error = 'could not instantiate contract with submitted address and post content';
					  var jsonresult = {status: 0
							  , nodeblocknumber: nodeblocknumber
							  , error: error
							  , data: []};
					
				}
				
				
			}
			else {
				  var error = 'abi field not found in post content';
				  var jsonresult = {status: 0
						  , nodeblocknumber: nodeblocknumber
						  , error: error
						  , data: []};
				
			}
			
		}
		else {
			  var error = 'address does not correspond to a contract: ' + contractaddr;
			  var jsonresult = {status: 0
					  , nodeblocknumber: nodeblocknumber
					  , error: error
					  , data: []};
		}
		
		
		global.log('/contract json result is ' + JSON.stringify(jsonresult));
		
		res.json(jsonresult);
	};
}


module.exports = EthReaderControllers;





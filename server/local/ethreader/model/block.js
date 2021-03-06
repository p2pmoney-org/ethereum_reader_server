'use strict';

var Global = require('../service.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Instance();

var Utility = require('./utility.js');
var EthNode = require('./ethnode.js');


// !!! to prevent circularities, block.js
// must not require transaction.js or account.js


// map to cache block objects
class BlockMap {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getBlock(key) {
		if (key in this.map) {
			return this.map[key];
		}
	}
	
	setBlock(key, block) {
		this.map[key] = block;
	}
	
	count() {
		return Object.keys(this.map).length
	}
	
	empty() {
		this.map = Object.create(null);
	}
}

var blockmap = new BlockMap();

// map to cache array of transactions structs for each block
class BlockTransactionsMap {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getBlockTransactions(key) {
		if (key in this.map) {
			return this.map[key];
		}
		
		return null;
	}
	
	setBlockTransactions(key, transactions) {
		if (this.count() > (global.max_block_map_factor_size * global.max_returned_blocks)) {
			// need to make some room in the account map
			this.empty(); // empty for the moment, do not resize to (global.block_map_factor_size* global.max_returned_blocks)
		}
		
		this.map[key] = transactions;
	}
	
	count() {
		return Object.keys(this.map).length
	}
	
	empty() {
		this.map = Object.create(null);
	}
}

var blocktransactionsmap = new BlockTransactionsMap();

// block object
class Block {
	
	constructor() {
		this.blocknumber = -1;
		
		// we initialize members
		this.difficulty = null;
		this.extraData = null;
		this.gasLimit = null;
		this.gasUsed = null;
		this.hash = null;
		this.logsBloom =  null;
		this.miner = null;
		this.mixHash = null;
		this.nonce = null;
		this.number = null;
		this.parentHash = null;
		this.receiptsRoot = null;
		this.sha3Uncles = null;
		this.size = null;
		this.stateRoot = null;
		this.timestamp = null;
		this.totalDifficulty = null;
		this.transactions = null;
		this.transactionsRoot = null;
		this.uncles = null;			
		
		// computed members
		this.blockTime = null; 
		this.reward = null;
		this.totalFee = null;

		// data
		this.data = null; // raw data coming back from web3
		
		// list of transactions as objects
		this.transactionarray = null;
	}
	
	getHash() {
		return this.hash;
	}
	
	getBlockNumber() {
		return this.blocknumber;
	}
	
	getNumber() {
		return this.blocknumber;
	}
	
	getPreviousBlock() {
		if (this.blocknumber > 0) {
			var previousblocknumber = this.blocknumber - 1;
			
			return Block.getBlock(previousblocknumber);
		}
	}
	
	getParentHash() {
		return this.parentHash;
	}
	
	getUncleHash() {
		return this.sha3Uncles;
	}
	
	getMiner() {
		return this.miner;
	}
	
	getStateRoot() {
		return this.stateRoot;
	}
	
	getTransactionRoot() {
		return this.transactionsRoot;
	}
	
	getData() {
		return this.data;
	}
	
	getDifficulty() {
		return this.difficulty;
	}
	
	getGasLimit() {
		return this.gasLimit;
	}
	
	getHashRate() {
		return this.difficulty;
	}
	
	getUnixTimeStamp() {
		return global.EthToUnixTime(this.timestamp);
	}
	
	getUnixBlockTimeStamp() {
		return global.EthToUnixTime(this.timestamp );
	}
	
	getBlockTimeTaken() {
		if (this.blockTime != null)
			return this.blockTime;
		
		var previousblock = this.getPreviousBlock();
		this.blockTime = (previousblock ? this.timestamp - previousblock.timestamp : 0);
		
		return this.blockTime;
	}
	
	getGasUsed() {
		return (this.gasUsed ? this.gasUsed : 0);
	}
	
	getExtraData() {
		return this.extraData;
	}
	
	getMixDigest() {
		return this.mixDigest;
	}
	
	getNonce() {
		return this.nonce;
	}
	
	getTxCount() {
		return this.tx_count;
	}
	
	getUncleCount() {
		return this.uncle_count;
	}
	
	getSize() {
		return this.size;
	}
	
	getTotalDifficulty() {
		return this.totalDifficulty;
	}
	
	getStaticEtherBlockReward() {
		// change from 5.0 to 3.0 after certain point?
		var staticreward = 3.0;
		
		return staticreward;
	}
	
	getReward() {
		if (this.reward != null)
			return this.reward;
		
		// first get total fee
		this.reward = this.getTotalFee();
		
		// then remove reward for uncles
		var staticetherreward = this.getStaticEtherBlockReward();
		var unclecount = this.getUncleCount();
		this.reward -= Utility.getWeiFromEther((unclecount/32)*staticetherreward);
		
		return this.reward;
	}
	
	getTotalFee() {
		if (this.totalFee != null)
			return this.totalFee;
		
		// first get ether for static block
		var staticetherreward = this.getStaticEtherBlockReward();
		this.totalFee = Utility.getWeiFromEther(staticetherreward);
		
		// gas spent in the block
		
		var gascost = this.getTransactionsCumulativeGasCost();
		
		this.totalFee += gascost;
		
		return this.totalFee;
	}
	
	getTransactionsCumulativeGasCost() {
		global.log("Block.getTransactionsCumulativeGasCost called for block " + this.number);
		
		var gascost = 0;
		
		var transactions = this.getTransactions();
		
		if (transactions === null) {
			global.log("can not compute block's gas cost because transactions array has not been set by calling Transaction.getBlockTransactions(block)");
			
			if (this.transactions) {
				global.log("computing directly gas cost from web3 transaction and transactionreceipt data");
				for( i = 0, len = this.transactions.length; i < len; i++) {
					var transaction = this.transactions[i];
					var txhash = (this.transactions[i]['hash'] === undefined ? this.transactions[i] : this.transactions[i]['hash']);
					
					var transactiondata = EthNode.getTransactionData(txhash);
					var transactionreceiptdata = EthNode.getTransactionReceiptData(txhash);
					
					gascost += transactiondata['gasPrice']*transactionreceiptdata['gasUsed'];
				}
			}
			
			return gascost;
		}
		
		for (var i = 0, len = transactions.length; i < len; i++) {
			gascost += transactions[i].getGasCost();
		}
		
		return gascost;
	}
	
	
	setData(data) {
		this.data = data;
		
		if (data == null)
			return
		
		// we set members
		
		this.difficulty = parseInt(data.difficulty);
		this.extraData = data.extraData;
		this.gasLimit = data.gasLimit;
		this.gasUsed = data.gasUsed;
		this.hash = data.hash;
		this.logsBloom =  data.logsBloom;
		this.miner = data.miner;
		this.mixHash = data.mixHash;
		this.nonce = data.nonce;
		this.number = data.number;
		this.parentHash = data.parentHash;
		this.receiptsRoot = data.receiptsRoot;
		this.sha3Uncles = data.sha3Uncles;
		this.size = data.size;
		this.stateRoot = data.stateRoot;
		this.timestamp = data.timestamp;
		this.totalDifficulty = data.totalDifficulty;
		this.transactions = data.transactions;
		this.transactionsRoot = data.transactionsRoot;
		this.uncles = data.uncles;	
		
		// values for api
		// (could be removed since should be retrieved
		// only by calls to methods)
		this.uncleHash = this.sha3Uncles;
		this.coinbase = this.miner;
		this.root = this.stateRoot;
		this.txHash = this.transactionsRoot;
		//this.difficulty = null;
		//this.gasLimit = block.gasLimit;
		//this.gasUsed = block.gasUsed;
		this.time = this.timestamp;
		this.extra = this.extraData;
		this.mixDigest = null;
		//this.nonce = block.nonce;
		this.tx_count = (this.transactions ? this.transactions.length : 0);
		this.uncle_count = (this.uncles ? this.uncles.length : 0);
		//this.size = block.size;
		this.blockTime = null; // do not compute now to avoid scanning the whole chain
		this.reward = null;
		this.totalFee = null;
		
		// list of transactions as objects (done in getTransactions if asked)
		this.transactionarray = null;
		
	}
	
	// transactions objects, created in Transaction.getBlockTransactions and put
	// into the block for direct invocation by it
	getTransactions() {
		global.log("Block.getTransactions called for " + this.number);

		if (this.transactionarray === null) {
			var transactionsarray = blocktransactionsmap.getBlockTransactions(this.number);
			
			if (transactionsarray !== null) {
				this.transactionarray = transactionsarray;
			}
			else {
				global.log("transactions array not found in map for block " + this.number);
			}
		}
		
		// return data array of transactions
		return this.transactionarray;
	}
	
	setTransactions(transactions) {
		global.log("Block.getTransactions called for " + this.number);
		
		this.transactionarray = transactions;
	}

	readBlock($bWithTransactions) {
		var block = this;
		var blockid = this.blocknumber;
		
		global.log("ReadingBlock1 with blockid " + blockid + " and flag to " + $bWithTransactions);
		
		global.log("ReadingBlock2 with blockid " + blockid + " and flag to " + $bWithTransactions);

		// now we get the block's info and transactions array
		var finished = false;
		
		var callback = function(error, result) {
			
			if (!error) {
				global.log("ReadingBlock3.1 with blockid " + blockid + " and flag to " + $bWithTransactions);
				block.setData(result);
					
				global.log("ReadingBlock3.9 with blockid " + blockid + " and flag to " + $bWithTransactions);
				finished = true;
				  
			  } else {
				block.setData(null);
					
				global.log('Web3 error: ' + error);
				finished = true;
			  }
		};
		
		
		var ret;
		
		if ($bWithTransactions) {
			// web3.eth.getBlock(blockid, true)  param true let retrieve transactions
			web3.eth.getBlock(blockid, true, callback);
		}
		else {
			web3.eth.getBlock(blockid, false, callback);
		}
		
		global.log("ReadingBlock3 with blockid " + blockid + " and flag to " + $bWithTransactions);

		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}
		
		global.log("ReadingBlock4 with blockid " + blockid + " and flag to " + $bWithTransactions);
		
	}
	
	getUncleCount() {
		return this.uncle_count;
	}
	
	getUncles() {
		return this.uncles;
	}
	
	// getBlock(blockid) blockid, number or hash
	static getBlock(blockid) {
		//global.log("Block.getBlock called for " + blockid);

		// check if it is in the map
		var blocknumberkey = "key" + blockid.toString();
		var mapvalue = blockmap.getBlock(blocknumberkey);
		
		if (mapvalue !== undefined) {
			//global.log("block found in map " + blockid);
			return mapvalue;
		}
		
		// else we create a block object
		var block = new Block();
		block.blocknumber = (global.isNumber(blockid) ? blockid : null);
		
		// and put it in the global map before instantiating transactions
	    //global.log("size of blockmap is " + blockmap.count() + " for a maximum of " + (global.max_block_map_factor_size * global.max_returned_blocks));
		if (blockmap.count() > (global.max_block_map_factor_size * global.max_returned_blocks)) {
			// need to make some room in the blockmap
			this.doBlockMapGarbageCollecting();
		}
		
		blockmap.setBlock(blocknumberkey, block);

		// fill data, without transactions at this stage
		block.readBlock(false);
		
		return block;
	}
	
	static doBlockMapGarbageCollecting() {
	    global.log("Block.doBlockMapGarbageCollecting called");
	    
	    // we do a very simple empty for the moment
	    blockmap.empty();
		
	}
	
	static getBlockNumber() {
	    global.log("Block.getBlockNumber called");
	    
		var ethnode = EthNode.getEthNode();
		var blocknumber = ethnode.getBlockNumber();
		
	    global.log("blocknumber is " + blocknumber);
		return blocknumber;
	}
	
	static getCurrentBlockNumber() {
	    global.log("Block.getCurrentBlockNumber called");
		
		var ethnode = EthNode.getEthNode();
		var blocknumber = ethnode.getCurrentBlockNumber();
		
	    global.log("currentblocknumber is " + blocknumber);
		return blocknumber;
	}
	
	static getHighestBlockNumber() {
	    global.log("Block.getHighestBlockNumber called");
		
		var ethnode = EthNode.getEthNode();
		var blocknumber = ethnode.getHighestBlockNumber();
		
	    global.log("highestblocknumber is " + blocknumber);
		return blocknumber;
	}
	
	static getBlocksLeftNumber() {
	    global.log("Block.getBlocksLeftNumber called");
	    
		var ethnode = EthNode.getEthNode();
		var blocknumber = ethnode.getBlocksLeftNumber();
		
		return blocknumber;
	}
	
	static getLastBlockNumber() {
		var blocknumber;
		
		blocknumber = this.getCurrentBlockNumber();
		
		return blocknumber;
	}
	
	static getLatestBlock() {
		var blocknumber = this.getLastBlockNumber();
		
		return this.getBlock(blocknumber);
	}

	static getBlocksRange(startBlockNumber, endBlockNumber) {
	    global.log("Reading from block " + startBlockNumber + " to block " + endBlockNumber);
		
		var blocks = []
	    
		for (var i = startBlockNumber; i <= endBlockNumber; i++) {
			var block = Block.getBlock(i);
			
			blocks.push(block);
		}
		
		return blocks;
	}

	static getLastBlocks(offset, count) {
	    global.log("Block.getLastBlocks called for offset " + offset + " and count " + count);
	    
		var lastBlockNumber = Block.getLatestBlock().getBlockNumber();
		
		var off = offset;
		var cnt = (count < global.max_processed_blocks ? count : global.max_processed_blocks);
	    
	    var startBlockNumber = ((lastBlockNumber - off + 1 > 0 ) ? (lastBlockNumber - off + 1) : 0);
		var endBlockNumber = (startBlockNumber + cnt <= lastBlockNumber ? startBlockNumber + cnt : lastBlockNumber);
		
		var blocks = Block.getBlocksRange(startBlockNumber, endBlockNumber);
		
		return blocks;
	}
	
	static getBlocksSince(starttimestamp) {
		// return all the blocks mined since 12:00am, UTC time
	    
		global.log("Reading blocks mined since " + new Date(starttimestamp).toISOString());
		
		var block = Block.getLatestBlock();
		var blocktimestamp = block.getUnixTimeStamp();
		
		var blocks = [];
		
		while (blocktimestamp >= starttimestamp) {
			blocks.push(block);
			
			block = block.getPreviousBlock();

			if (block === undefined)
				break;
			
			blocktimestamp = block.getUnixTimeStamp();
		}
		
		return blocks;
	}
	
	static getBlocksToday() {
		// return all the blocks mined since 12:00am, UTC time
	    
		global.log("Reading blocks mined today");
		
		var zero_am_timestamp = global.getZeroAMTimeStamp();
		
		return Block.getBlocksSince(zero_am_timestamp);
	}
	
	static getBlocksPastTwentyFourHours() {
		global.log("Reading blocks mined for past 24h");
		
		var currenttimestamp = global.getCurrentTimeStamp();
		
		var twentyfourhoursago = currenttimestamp - 24*60*60*1000; // 24 hours
		
		return Block.getBlocksSince(twentyfourhoursago);
	}
	
	static getBlocksPastWeek() {
		global.log("Reading blocks mined for past week");
		
		var zero_am_timestamp = global.getZeroAMTimeStamp();
		
		var oneweekagotimestamp = zero_am_timestamp - 6*24*60*60*1000; // 6 days before 12am
		
		return Block.getBlocksSince(oneweekagotimestamp);
	}
	
	static getBlocksPastMonth() {
		global.log("Reading blocks mined for past month");
		
		var zero_am_timestamp = global.getZeroAMTimeStamp();

		var onemonthagotimestamp = zero_am_timestamp - 30*24*60*60*1000; // 30 days before 12am;
		
		return Block.getBlocksSince(onemonthagotimestamp);
	}
	
	static getBlocksPastDays(ndays) {
		global.log("Reading blocks mined for past " + ndays + " days");
		
		var zero_am_timestamp = global.getZeroAMTimeStamp();

		var ndaysagotimestamp = zero_am_timestamp - ndays*24*60*60*1000; // ndays days before 12am;
		
		return Block.getBlocksSince(ndaysagotimestamp);
	}
	
	static getBlockTransactionsFromMap(blocknumber) {
		global.log("Block.getBlockTransactions called for " + blocknumber);
		
		var transactionarray = blocktransactionsmap.getBlockTransactions(blocknumber);

		// return data array of transactions
		return transactionarray;
	}
	
	static setBlockTransactionsInMap(blocknumber, transactionarray) {
		global.log("Block.setBlockTransactionsInMap called for " + blocknumber);
		blocktransactionsmap.setBlockTransactions(blocknumber, transactionarray);
		
		var block = blockmap.getBlock(blocknumber);
		
		if (block !== undefined) {
			block.setTransactions(transactionarray);
		}
	}
	

}


module.exports = Block;

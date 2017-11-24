'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();

var EthNode = require('./ethnode.js');
var Block = require('./block.js');


class Statistics {
	
	static getGasPrice() {
		var ethnode = EthNode.getEthNode();
		
		return ethnode.getGasPrice();
	}
	
	static getMiningEstimate() {
		var ethnode = EthNode.getEthNode();
		
		var latestblock= Block.getLatestBlock(); // take 24h before latest blocks, than can be old if we are not in sync
		var latestblocktimestamp = latestblock.getUnixTimeStamp();
		
		var numberofhours = 1; // 1 hour instead of 24 for the moment
		var twentyfourhoursback = latestblocktimestamp - numberofhours*60*60*1000; 
		
		var blocks = Block.getBlocksSince(twentyfourhoursback);

		var cnt = blocks.length;
		
		var blockTime = 0;
		var difficulty = 0;
		
		for (var i = 0; i < cnt; i++) {
			var block = blocks[i];
			
			global.log('block blockTime is ' + block.getBlockTimeTaken());
			blockTime += block.getBlockTimeTaken();
			difficulty += parseInt(block.getDifficulty());
		}
		
		// do the average
		blockTime = blockTime / cnt;
		difficulty = difficulty / cnt;
		
		
		var expected_blocks = (numberofhours * 60 * 60) / 15;
		var blocks_found = cnt;
		var hash_rate = (blocks_found/expected_blocks*difficulty ); //* Math.pow(2,32)
		
		
		var miningEstimate = new Array();
		
		miningEstimate['blockTime'] = Math.trunc(blockTime*10000)/10000; // 4 decimals
		miningEstimate['difficulty'] = Math.trunc(difficulty*10)/10; // 1 decimal
		miningEstimate['hashRate'] =  Math.trunc(hash_rate*100)/100; // 2 decimals

		return miningEstimate;
	}
}


module.exports = Statistics;

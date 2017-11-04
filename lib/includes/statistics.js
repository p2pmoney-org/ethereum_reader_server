'use strict';

var Global = require('../../lib/includes/global.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Provider();


class Statistics {
	
	static getGasPrice() {
		var gasprice;
		
		var ret = web3.eth.getGasPrice(function(error, result) {
			
			if (!error) {
				gasprice= result;
			  } else {
				  gasprice = false;
			  }
			});
		
		
		// wait to turn into synchronous call
		while(gasprice === undefined)
		{require('deasync').runLoopOnce();}
	
		return gasprice;
	}
}


module.exports = Statistics;

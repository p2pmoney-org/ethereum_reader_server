/**
 * 
 */

'use strict';

class EthReaderRoutes {

	constructor(app, global) {
		this.app = app;
		this.global = global;
		
		var service = global.getServiceInstance('ethreader');
		
		service.routes = this; // keep this referenced to stay in memory
		
		var EthReaderControllers = require('../controllers/controllers.js');
		
		this.controllers = new EthReaderControllers(global);
	}
	
	registerRoutes() {
		var app = this.app;
		var global = this.global;
		
		var controllers = this.controllers;
		
		global.log('EthReaderRoutes.registerRoutes called')
		
		var route_root_path = global.route_root_path;

		  // deployment
		app.route(route_root_path + '/config')
		  .get(function(req, res) { controllers.config(req, res); });

		app.route(route_root_path + '/logs/server/tail')
		.get(function(req, res) { controllers.get_logs_server_tail(req, res); });
	
		  // ethereum node
		app.route(route_root_path + '/node')
		  .get(function(req, res) { controllers.node(req, res); });
	
		app.route(route_root_path + '/node/hashrate')
		  .get(function(req, res) { controllers.node_hashrate(req, res); });
		  
		  // statistics
		app.route(route_root_path + '/difficulty')
		  .get(function(req, res) { controllers.difficulty(req, res); });
	
		app.route(route_root_path + '/gasPrice')
		  .get(function(req, res) { controllers.gasPrice(req, res); });
		  
		app.route(route_root_path + '/miningEstimator')
		  .get(function(req, res) { controllers.miningEstimator(req, res); });
		  
		 
	
		  
		  // blocks
		app.route(route_root_path + '/blocks')
		    .get(function(req, res) { controllers.blocks(req, res); });
		app.route(route_root_path + '/blocks/:offset/:count') // to be compatible with etherchain.org, call /blocks/10/10 to get last 10 blocks
		  .get(function(req, res) { controllers.blocks(req, res); });								// offset with forward reading
		app.route(route_root_path + '/blocks/count')
		    .get(function(req, res) { controllers.blocks_count(req, res); });
		app.route(route_root_path + '/blocks/range/:from/:to')
		  .get(function(req, res) { controllers.blocks_range(req, res); });
		app.route(route_root_path + '/blocks/range/:from/:to/txs')
		  .get(function(req, res) { controllers.blocks_range_txs(req, res); });
		 
		  // block
		app.route(route_root_path + '/block/:id')
		  .get(function(req, res) { controllers.block(req, res); });
		app.route(route_root_path + '/block/:id/tx') // to be compatible with etherchain.org
		  .get(function(req, res) { controllers.block_transactions(req, res); });
		app.route(route_root_path + '/block/:id/txs')
		  .get(function(req, res) { controllers.block_transactions(req, res); });
		  
		  
		  // transactions
		app.route(route_root_path + '/tx/:id')
		  .get(function(req, res) { controllers.transaction(req, res); });
	
		app.route(route_root_path + '/txs/count/:id') // count to be compatible with etherchain.org
		  .get(function(req, res) { controllers.transactions_count(req, res); });
	
		app.route(route_root_path + '/txs/:offset/:count') // to be compatible with etherchain.org, call /txs/10/10 to get last 10 transactions
		  .get(function(req, res) { controllers.transactions(req, res); });					// offset with forward reading
	
	
		  // account
		app.route(route_root_path + '/account/:id')
		  .get(function(req, res) { controllers.account(req, res); });
		app.route(route_root_path + '/account/multiple/:ids')
		  .get(function(req, res) { controllers.accounts(req, res); });
	
		  // account source
		app.route(route_root_path + '/account/:id/source')
		  .get(function(req, res) { controllers.account_source(req, res); });
		  
		  // account mining
		app.route(route_root_path + '/account/:id/mined')
		  .get(function(req, res) { controllers.account_mined(req, res); });
		app.route(route_root_path + '/account/:id/mined/full')
		  .get(function(req, res) { controllers.account_mined_full(req, res); });
		app.route(route_root_path + '/account/:id/mined/today')
		  .get(function(req, res) { controllers.account_mined_today(req, res); });
		app.route(route_root_path + '/account/:id/miningHistory')
		  .get(function(req, res) { controllers.account_mininghistory(req, res); });
		app.route(route_root_path + '/account/:id/miningUncleHistory')
		  .get(function(req, res) { controllers.account_miningunclehistory(req, res); });
	
		  // account transactions
		app.route(route_root_path + '/account/:id/tx') // tx to be compatible with etherchain.org
		  .get(function(req, res) { controllers.account_txs(req, res); });
		app.route(route_root_path + '/account/:id/tx/:offset') // :offset to be compatible with etherchain.org
		  .get(function(req, res) { controllers.account_txs(req, res); });
		  
		app.route(route_root_path + '/account/:id/txs') 
		  .get(function(req, res) { controllers.account_txs(req, res); });
		app.route(route_root_path + '/account/:id/txs/:offset')  // offset with forward reading, call /account/:id/txs/-1 to get max_returned_transactions
		  .get(function(req, res) { controllers.account_txs(req, res); });							// equivalent to /account/:id/txs/:offset/next/:count with :count = :offset
		app.route(route_root_path + '/account/:id/txs/:offset/previous/:count')  
		 .get(function(req, res) { controllers.account_previous_txs(req, res); });
		app.route(route_root_path + '/account/:id/txs/:offset/next/:count')  
		 .get(function(req, res) { controllers.account_next_txs(req, res); });
		 
		app.route(route_root_path + '/account/:id/txs/:offset/blocks/') // offset must be present (e.g. -1) but is not used
		 .get(function(req, res) { controllers.account_txs_in_blocks(req, res); });
		app.route(route_root_path + '/account/:id/txs/:offset/blocks/:from') 
		 .get(function(req, res) { controllers.account_txs_in_blocks(req, res); });
		app.route(route_root_path + '/account/:id/txs/:offset/blocks/:from/:to') 
		  .get(function(req, res) { controllers.account_txs_in_blocks(req, res); });
		  
		app.route(route_root_path + '/account/:id/txs/:offset/before-block/:blockid') // offset must be present (e.g. -1) but is not used
		  .get(function(req, res) { controllers.account_txs_before_block(req, res); });
		app.route(route_root_path + '/account/:id/txs/:offset/after-block/:blockid') // offset must be present (e.g. -1) but is not used
		  .get(function(req, res) { controllers.account_txs_after_block(req, res); });
		
		 
		  // contract
		app.route(route_root_path + '/contract/:id')
		  .get(function(req, res) { controllers.contract(req, res); });//GET
		app.route(route_root_path + '/contract/:id')
		  .post(function(req, res) { controllers.contract_state(req, res); });//POST
		 
		app.route(route_root_path + '/contract/:id/get')
		  .post(function(req, res) { controllers.contract_get(req, res); });
		  
	}

}

module.exports = EthReaderRoutes;

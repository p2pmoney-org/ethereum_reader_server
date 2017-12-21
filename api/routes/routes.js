/**
 * 
 */

'use strict';


module.exports = function(app) {
  var Controller = require('../controllers/controllers');
  var Global = require('../../lib/includes/global.js');
  
  var global = Global.getGlobalInstance();
  
  var route_root_path = global.route_root_path;
  
  global.log('route path is: ' + route_root_path);

  
  // global
  app.route(route_root_path + '/version')
  .get(Controller.version);

  app.route(route_root_path + '/version/support')
  .get(Controller.version_support);
  
  // ethereum node
  app.route(route_root_path + '/node')
  .get(Controller.node);

  app.route(route_root_path + '/node/hashrate')
  .get(Controller.node_hashrate);
  
  // statistics
  app.route(route_root_path + '/difficulty')
  .get(Controller.difficulty);

  app.route(route_root_path + '/gasPrice')
  .get(Controller.gasPrice);
  
  app.route(route_root_path + '/miningEstimator')
  .get(Controller.miningEstimator);
  
 

  
  // blocks
  app.route(route_root_path + '/blocks')
    .get(Controller.blocks);
  app.route(route_root_path + '/blocks/:offset/:count') // to be compatible with etherchain.org
  .get(Controller.blocks);
  app.route(route_root_path + '/blocks/count')
    .get(Controller.blocks_count);
  app.route(route_root_path + '/blocks/range/:from/:to')
  .get(Controller.blocks_range);
  app.route(route_root_path + '/blocks/range/:from/:to/txs')
  .get(Controller.blocks_range_txs);
 
  // block
  app.route(route_root_path + '/block/:id')
  .get(Controller.block);
  app.route(route_root_path + '/block/:id/tx') // to be compatible with etherchain.org
  .get(Controller.block_transactions);
  app.route(route_root_path + '/block/:id/txs')
  .get(Controller.block_transactions);
  
  
  // transactions
  app.route(route_root_path + '/tx/:id')
  .get(Controller.transaction);

  app.route(route_root_path + '/txs/count/:id') // to be compatible with etherchain.org
  .get(Controller.transactions_count);

  app.route(route_root_path + '/txs/:offset/:count')
  .get(Controller.transactions);


  // account
  app.route(route_root_path + '/account/:id')
  .get(Controller.account);
  app.route(route_root_path + '/account/multiple/:ids')
  .get(Controller.accounts);

  // account source
  app.route(route_root_path + '/account/:id/source')
  .get(Controller.account_source);
  
  // account mining
  app.route(route_root_path + '/account/:id/mined')
  .get(Controller.account_mined);
  app.route(route_root_path + '/account/:id/mined/full')
  .get(Controller.account_mined_full);
  app.route(route_root_path + '/account/:id/mined/today')
  .get(Controller.account_mined_today);
  app.route(route_root_path + '/account/:id/miningHistory')
  .get(Controller.account_mininghistory);
  app.route(route_root_path + '/account/:id/miningUncleHistory')
  .get(Controller.account_miningunclehistory);

  // account transactions
  app.route(route_root_path + '/account/:id/tx')
  .get(Controller.account_txs);
  app.route(route_root_path + '/account/:id/tx/:offset') // to be compatible with etherchain.org
  .get(Controller.account_txs);
  app.route(route_root_path + '/account/:id/txs') 
  .get(Controller.account_txs);
 app.route(route_root_path + '/account/:id/txs/:offset') 
  .get(Controller.account_txs);
 app.route(route_root_path + '/account/:id/txs/:offset/blocks/') 
 .get(Controller.account_txs_in_blocks);
 app.route(route_root_path + '/account/:id/txs/:offset/blocks/:from') 
 .get(Controller.account_txs_in_blocks);
  app.route(route_root_path + '/account/:id/txs/:offset/blocks/:from/:to') 
  .get(Controller.account_txs_in_blocks);
  app.route(route_root_path + '/account/:id/txs/:offset/before-block/:blockid') 
  .get(Controller.account_txs_before_block);
  app.route(route_root_path + '/account/:id/txs/:offset/after-block/:blockid') 
  .get(Controller.account_txs_after_block);

 
  
  
};

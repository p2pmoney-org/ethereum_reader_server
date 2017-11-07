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

  // account
  app.route(route_root_path + '/account/:id')
  .get(Controller.account);
  app.route(route_root_path + '/account/multiple/:ids')
  .get(Controller.accounts);

  /*  app.route('/accounts/:accountId')
  .get(todoList.read_a_task)
  .put(todoList.update_a_task)
  .delete(todoList.delete_a_task);*/

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
 .get(Controller.account_txs_blocks);
 app.route(route_root_path + '/account/:id/txs/:offset/blocks/:start') 
 .get(Controller.account_txs_blocks);
  app.route(route_root_path + '/account/:id/txs/:offset/blocks/:start/:finish') 
  .get(Controller.account_txs_blocks);

  
  // blocks
  app.route(route_root_path + '/blocks')
    .get(Controller.blocks);
  app.route(route_root_path + '/blocks/:offset/:count')
  .get(Controller.blocks);
  app.route(route_root_path + '/blocks/count')
    .get(Controller.blocks_count);
 //   .post(todoList.create_a_task);
 
  // block
  app.route(route_root_path + '/block/:id')
  .get(Controller.block);
  app.route(route_root_path + '/block/:id/tx') // to be compatible with etherchain.org
  .get(Controller.block_transactions);
  app.route(route_root_path + '/block/:id/txs')
  .get(Controller.block_transactions);
  
  
  // statistics
  app.route(route_root_path + '/difficulty')
  .get(Controller.difficulty);

  app.route(route_root_path + '/gasPrice')
  .get(Controller.gasPrice);
  
   
  // transactions
  app.route(route_root_path + '/tx/:id')
  .get(Controller.transaction);

  app.route(route_root_path + '/txs/count/:id')
  .get(Controller.transactions_count);

  app.route(route_root_path + '/txs/:offset/:count')
  .get(Controller.transactions);


};

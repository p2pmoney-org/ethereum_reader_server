'use strict';

var Global = require('../service.js');

var global = Global.getGlobalInstance();
var web3 = global.getWeb3Instance();

// reader objects
var EthNode = require('./ethnode.js');

var Block = require('./block.js');
var Transaction = require('./transaction.js');
var Account = require('./account.js');

class ContractMap {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getContract(address) {
		var key = address.toString();
		
		if (key in this.map) {
			return this.map[key];
		}
	}
	
	pushContract(contract) {
		if (this.count() > global.max_account_map_size) {
			// need to make some room in the contract map
			this.empty(); // empty for the moment, do not resize to global.account_map_size)
		}
		
		var key = contract.address.toString();

		this.map[key] = contract;
	}
	
	removeContract(contract) {
		var key = contract.address.toString();

		delete this.map[key];
	}
	
	count() {
		return Object.keys(this.map).length
	}
	
	empty() {
		this.map = Object.create(null);
	}
}

var contractmap = new ContractMap();

class Contract {
	
	constructor() {
		this.address = null;
		this.account = null;
		this.abi;
		
		this.instance = null;
	}
	
	getAccount() {
		return this.account;
	}
	
	getAbi() {
		return this.abi;
	}
	
	setAbi(abi) {
		this.abi = abi;
		
		// reset instance it created
		this.instance = null;
	}
	
	getMethodAbiDefinition(methodname) {
		var abi = this.getAbi();
		var abidef = null;
		
		if (!abi)
			return abidef;
		
		for (var i = 0; i < abi.length; i++) {
			var item = abi[i];
			var name = item.name;
			
			if (name == methodname) {
				abidef = item;
				
				break;
			}
		}
		
		return abidef;
	}
	
	dynamicMethodCall(abidef, params) {
		var value = null;
		
		try {
			var finished = false;

			
			var callback = function(error, result) {
				
				if (!error) {
					value = result;
						
					finished = true;
					  
				  } else {
					count = false;
						
					global.log('Web3 error: ' + error);
					finished = true;
				  }
			};

			var instance = this.getInstance();
			var methodname = abidef.name;
			var signature = abidef.signature;
			
			global.log("list of params submitted is " + JSON.stringify(params));

			// using spread operator
			value = instance.methods[signature](...params).call(callback);
			
			// dirty dynamic
			/*switch(params.length) {
				case 0:
				value = instance.methods[signature]().call(callback);
				break;
				
				case 1:
				value = instance.methods[signature](params[0]).call(callback);
				break;
				
				case 2:
				value = instance.methods[signature]().call(instance, params[0], params[1], callback);
				break;
				
				default:
					throw 'does not support contract methods with more than 2 arguments';
				break;
			}*/
	        	
			// wait to turn into synchronous call
			while(!finished)
			{require('deasync').runLoopOnce();}
			
			global.log("value is " + value);
		} catch(e) {
	      global.log("exception in Contract.callReadMethod " + e);
	    }
		
		return value;
	}
	
	callReadMethod(methodname, methodparams) {
		global.log('Contact.callReadMethod called for method ' + methodname);
		
		var value = null;
		
		var abidef = this.getMethodAbiDefinition(methodname);
		
		if (!abidef) {
			throw 'could not find method with name ' + methodname;
		}
		
		var constant = abidef.constant;
		var type = abidef.type;
		var payable = abidef.payable;
		var paramsnumber = abidef.inputs.length;
		var stateMutability = abidef.stateMutability;
		
		if (payable) {
			throw 'can not call a payable method: ' + methodname;
		}
		
		if (paramsnumber > methodparams.length) {
			throw 'not enough parameters have been passed for method: ' + paramsnumber;
		}
		
		var params = [];
		
		for (var i = 0; i < paramsnumber; i++) {
			// parameters have to be in the right order
			var param = methodparams[i].value;
			
			params.push(param);
		}
		
		// make call
		value = this.dynamicMethodCall(abidef, params);
		
		return value;
	}
	
	callGetter(abimethod) {
		var instance = this.getInstance();
		
		var constant = abimethod.constant;
		var name = abimethod.name;
		var type = abimethod.type;
		var payable = abimethod.payable;
		var stateMutability = abimethod.stateMutability;
		var signature = abimethod.signature;
		var value = null;
		
		if (abimethod.type === "function" && abimethod.inputs.length === 0 && abimethod.constant) {
			// simple gets
			value = this.callReadMethod(name, []);
			/*var finished = false;
			
            try {
             	value = instance.methods[signature]().call(function(error, result) {
        			
        			if (!error) {
        				value = result;
        					
        				finished = true;
        				  
        			  } else {
        				count = false;
        					
        				global.log('Web3 error: ' + error);
        				finished = true;
        			  }
        		});
                	
        		// wait to turn into synchronous call
        		while(!finished)
        		{require('deasync').runLoopOnce();}
        		
        		global.log("value is " + value);
            } catch(e) {
              global.log("exception in Contract.callGetter " + e);
            }*/
          }		
		
		return value;
	}
	
	getInstance() {
		if (this.instance) {
			return this.instance;
		}
		var abi = this.abi;
		var address = this.address;
		
		var instance = new web3.eth.Contract(abi, address);
		//var instance = web3.eth.contract(abi).at(address);
		// web3.eth.contract works in console but not in node js
		
		this.instance = instance;
		
		return instance;
	}

	isObsolete() {
		if (this.account)
			return this.account.isObsolete();
		else
			return false;
	}
	
	static getContract(contractaddr) {
		global.log("Contract.getContract called for " + contractaddr);
		
		var contract = null;
		var key = contractaddr.toString();
		var mapvalue = contractmap.getContract(key);
		
		if (mapvalue !== undefined) {
			contract = mapvalue;
			
			if (!contract.isObsolete()) {
				return contract;
			}
			else {
				global.log("contract " + contract.address + " considered obsolete and removed from map");
				contractmap.removeContract(contract);
			}
		}

		var account = Account.getAccount(contractaddr);
		
		if (account && (account.isContract)) {
			contract = new Contract();
			
			contract.address = contractaddr;
			contract.account = account;
			
			// put in map
			contractmap.pushContract(contract);
		}
		
		return contract;
	}

}


module.exports = Contract;

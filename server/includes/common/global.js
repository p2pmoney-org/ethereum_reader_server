/**
 * 
 */
'use strict';

var globalinstance;
//var GlobalWeb3;


class Global {
	
	constructor() {
		
		// overload console.log
		this.overrideConsoleLog();

		// base and execution directories
		var process = require('process');
		var fs = require('fs');
		var path = require('path');
		
		this.base_dir = (Global.ETHEREUM_WEBAPP_BASE_DIR ? Global.ETHEREUM_WEBAPP_BASE_DIR : (process.env.root_dir ? process.env.root_dir :  path.join(__dirname, '../../..')));
		this.execution_dir = (Global.ETHEREUM_WEBAPP_EXEC_DIR ? Global.ETHEREUM_WEBAPP_EXEC_DIR : (process.env.root_dir ? process.env.root_dir :  path.join(__dirname, '../../..')));
		
		// command line arguments
		this.commandline = process.argv;
		this.options = [];
		
		if (this.commandline) {
			
			for (var i = 0, len=this.commandline.length; i < len; i++) {
				var command = this.commandline[i];
				
				if (command.startsWith('--conf=')) {
					this.options['jsonfile'] = command.split('=')[1];
					this.options.push(command);
				}
			}
		}
		
		// json config file
		var jsonFileName;
		var jsonPath;
		var jsonFile;
		this.config = {};
		
		try {
			var jsonConfigPath = (this.options['jsonfile'] !== undefined ? this.options['jsonfile'] : 'config.json');
			
			if (path.isAbsolute(jsonConfigPath)) {
				this.log("jsonConfigPath is " + jsonConfigPath)
				jsonPath = jsonConfigPath;
			}
			else {
				jsonFileName = (this.options['jsonfile'] !== undefined ? this.options['jsonfile'] : 'config.json');
				jsonPath = path.join(this.execution_dir, './settings', jsonFileName);
				
			}
			
			
			this.config_path = jsonPath;

			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			this.config = JSON.parse(jsonFile);
			
		}
		catch(e) {
			this.log('exception reading json file: ' + e.message); 
		}
		
		//
		// configuration
		//
		var config = this.config;
		
		// execution enviroment
		this.server_env = (config && (typeof config["server_env"] != 'undefined') ? config["server_env"] : 'prod');
		this.client_env = (config && (typeof config["client_env"] != 'undefined') ? config["client_env"] : 'prod');
		this.execution_env = this.server_env;
		
		// logging
		this.enable_log = (config && (typeof config["enable_log"] != 'undefined') ? config["enable_log"] : 1);
		this.write_to_log_file = (config && (typeof config["write_to_log_file"] != 'undefined') ? config["write_to_log_file"] : (this.execution_env != 'dev' ? 0 : 1));
		this.can_write_to_log_file = false;
		
		this.logPath = (config && (typeof config["log_path"] != 'undefined') ? config["log_path"] : null);
		
		var bCreateFile = false;

		try {
			if (!this.logPath) {
				var logPath = path.join(this.execution_dir, './logs', 'server.log');
				
				if (fs.existsSync(logPath)) {
					this.logPath = logPath;
					this.can_write_to_log_file = true;
				}	
			}
			else {
				if (this.enable_log && this.write_to_log_file ) {
					if (!fs.existsSync(this.logPath)) {
						bCreateFile = true; // normally never reached because existsSync would throw an error
					}
					else {
						this.can_write_to_log_file = true;
					}
				}
			}
			
			
		}
		catch(e) {
			bCreateFile = true;
			
			if (this.enable_log)
			this.log('exception checking log file: ' + e.message); 
		}
		
		if ( this.logPath && bCreateFile) {
			try {
				// we try to create the log file
				if (this.enable_log) {
					this.log('log file does not exist: ' + this.logPath);
					this.log('creating log file: ' + this.logPath);
					
					this.createfile(this.logPath);
					this.can_write_to_log_file = true;
				}
				
			}
			catch(e) {
				this.write_to_log_file = 0;
				this.log('exception creating log file: ' + e.message); 
			}
		}

		
		// configuration parameters
		this.service_name = (config && (typeof config["service_name"] != 'undefined') ? config["service_name"] : 'ethereum_securities_webapp');
		this.server_listening_port = (config && (typeof config["server_listening_port"] != 'undefined') ? config["server_listening_port"] : 8000);
		this.route_root_path = (config && (typeof config["route_root_path"] != 'undefined') ? config["route_root_path"] : '/api');

		this.web3_provider_url = (config && (typeof config["web3_provider_url"] != 'undefined') ? config["web3_provider_url"] : 'http://localhost');
		this.web3_provider_port= (config && (typeof config["web3_provider_port"] != 'undefined') ? config["web3_provider_port"] : '8545');

		
		this.mysql_host = (config && (typeof config["mysql_host"] != 'undefined') ? config["mysql_host"] : "localhost");
		this.mysql_port = (config && (typeof config["mysql_port"] != 'undefined') ? config["mysql_port"] : 3306);
		this.mysql_database = (config && (typeof config["mysql_database"] != 'undefined') ? config["mysql_database"] : null);
		this.mysql_username = (config && (typeof config["mysql_username"] != 'undefined') ? config["mysql_username"] : null);
		this.mysql_password = (config && (typeof config["mysql_password"] != 'undefined') ? config["mysql_password"] : null);
		this.mysql_table_prefix = (config && (typeof config["mysql_table_prefix"] != 'undefined') ? config["mysql_table_prefix"] : null);

		
		
		// 
		// operation members
		//
		
		// services
		this.services = [];
	
		// hooks
		this.hook_arrays = [];

		// web3
		//this.web3instance = null;
	}
	
	initServer() {
		this.log("Initializing server environment");
		
		// register common service
		var Service = require('./service.js');
		this.registerServiceInstance(new Service());
		
		// init services
		this.initServices();
	}
	
	initServices() {
		this.loadAllServices();
		
		// ask modules to register hooks
		this.registerServicesHooks();
	}
	
	exit() {
		var process = require('process');

		process.exit(1);		
	}
	
	reload() {
		// dirty exit to restart process
		this.exit();
	}
	
	readJson(jsonname) {
		var fs = require('fs');
		var path = require('path');

		var jsonFileName;
		var jsonPath;
		var jsonFile;
		
		var jsoncontent;
		
		try {
			jsonFileName = jsonname + ".json";
			
			jsonPath = path.join(this.execution_dir, './settings', jsonFileName);
	
	
			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			jsoncontent = JSON.parse(jsonFile);
	
		}
		catch(e) {
			this.log('exception reading json file: ' + e.message); 
		}
		
		return jsoncontent;
	}
	
	saveJson(jsonname, jsoncontent) {
		var bSuccess = false;
		var fs = require('fs');
		var path = require('path');

		var jsonFileName;
		var jsonPath;
		var jsonFile;
		
		var finished = false;
		
		try {
			jsonFileName = jsonname + ".json";
			
			jsonPath = path.join(this.execution_dir, './settings', jsonFileName);
		
			var jsonstring = JSON.stringify(jsoncontent);

			fs.writeFile(jsonPath, jsonstring, 'utf8', function() {
				bSuccess = true;
			
				finished = true;
			});
			
		}
		catch(e) {
			this.log('exception writing json file: ' + e.message); 
			finished = true;
		}
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return bSuccess;
	}
	
	readVariableFile(filepath) {
		var fs = require('fs');
		var path = require('path');

		var fileContent;
		
		var array = {};
		
		try {
			
			if (this._checkFileExist(fs, filepath)) {
				fileContent = fs.readFileSync(filepath, 'utf8');
				
				var lines = fileContent.split('\n');
			    
				for (var i = 0; i < lines.length; i++) {
					var line = lines[i];
					
					if ( (!line.startsWith('#')) && (line.indexOf('=') > -1))  {
						var pair = line.split('=');
						
						array[pair[0]] = pair[1];

					}
			    }
				
				
			}
			else {
				this.log('file does not exist: ' + filepath);
			}
	
		}
		catch(e) {
			this.log('exception reading variable file: ' + e.message); 
		}
		
		return array;
	}
	
	_processedvalue(value) {
		var objectConstructor = {}.constructor;
		
		if (value && value.constructor === objectConstructor)
			return JSON.stringify(value);
		else
			return value.toString();
	}
	
	processText(text) {
		var config = this.config;
		
	    // Create regex using the keys of the replacement object.
	    var regex = new RegExp(':(' + Object.keys(config).join('|') + ')', 'g');

	    // Replace the string by the value in object
	    return text.replace(regex, (m, $1) => this._processedvalue(config[$1]) || m);
	}
	
	_checkFileExist(fs, filepath) {
		try {
			if (fs.existsSync(filepath))
				return true;
		}
		catch(e) {
		}
		
		// check if it's a link
		try {
			if (fs.readlinkSync(contractslink))
				return true;
		}
		catch(e) {
			
		}
		
		return false;
	}
	
	copyfile(fs, path, sourcepath, destdir) {
		var self = this;
		var global = this;
		
		//this.log("copying file " + sourcepath);
		//this.log("to directory " + destdir);
		
		//gets file name and adds it to destdir
		var filename = path.basename(sourcepath);
		
		// check destdir exists
		if (!this._checkFileExist(fs, destdir)) {
			fs.mkdirSync(destdir); // good for one level down
		}		
		
		var destpath = path.resolve(destdir, filename);
		
		/*var source = fs.createReadStream(sourcepath);
		var dest = fs.createWriteStream(path.resolve(destdir, filename));

		source.pipe(dest);
		source.on('end', function() { global.log(filename + ' succesfully copied'); });
		source.on('error', function(err) { global.log(err); });*/
		
		fs.readFile(sourcepath, 'utf8', function(err, data) {
			if (err) throw err;
			  
			if (data) {
				// process data to replace placeholders
				data = self.processText(data);
				  
				// then copy to dest
				fs.writeFile(destpath, data, (err) => {  
					if (err) throw err;

					//self.log(filename + ' succesfully copied');
				});				  
			}
		});
	}
	
	createfile(filepath) {
		var fs = require('fs');
		var path = require('path');
		
		// create directory
		var dirpath = path.dirname(filepath);

		this.createdirectory(dirpath);
		
		// create file
		fs.openSync(filepath, 'w');
	}
	
	executeCmdLine(cmdline) {
		var child_process = require('child_process');
		var output = false;
		
		var finished = false;
		var self = this;
		self.log('executing command line: ' + cmdline);
		
		var batch = child_process.exec(cmdline, function(error, stdout, stderr){ 
			self.log('stdout is ' + JSON.stringify(stdout));
			output = stdout; 
			finished = true;
		});
		
	    
	    // wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}

		return output;
	}
	

	
	createdirectory(dirpath) {
		var shell = require('shelljs');
		shell.mkdir('-p', dirpath);
	}
	
	copydirectory(sourcedir, destdir) {
		var self = this;
		var fs = require('fs');
		
		if (this._checkFileExist(fs, sourcedir)) {
			
			if (!this._checkFileExist(fs, destdir)) {
				this.log('destination directory does not exist: ' + destdir);
				this.log('creating destination directory: ' + destdir);
				this.createdirectory(destdir);
			}
			
			var ncp = require('ncp').ncp;
			var finished = false;
			 
			ncp.limit = 5; 
			 
			//self.log('copying all files from ' + sourcedir + ' to '+ destdir);
			
			ncp(sourcedir, destdir, function (err) {
				
				if (err) {
					finished = true;
					return self.log('error while copying dapp directory ' + err);
				}
			 
				finished = true;
				//self.log(sourcedir + ' copied in '+ destdir);
			});
			
			// wait to turn into synchronous call
			while(!finished)
			{require('deasync').runLoopOnce();}
			
		}
		else {
			this.log('source directory does not exist: ' + sourcedir);
		}
		
	}
	
	require(module) {
		var process = require('process');
		// set the proper node_module path for module
		//this.log("loading module " + module + " NODE_PATH is " + process.env.NODE_PATH);
		
		if (process.env.NODE_PATH)
			return require(process.env.NODE_PATH + '/' + module);
		else
			return require(module);
	}
	
	getWeb3ProviderFullUrl() {
		return this.web3_provider_url + ':' + this.web3_provider_port;
	}
	
	/*getWeb3Provider() {
		var Web3 = this.require('web3');

		var web3providerfullurl = this.getWeb3ProviderFullUrl();
		
		var web3Provider =   new Web3.providers.HttpProvider(web3providerfullurl);
		
		return web3Provider;
	}
	
	getWeb3Instance() {
		if (this.web3instance)
			return this.web3instance;
		
		var Web3 = this.require('web3');

		var web3Provider = this.getWeb3Provider();
		  
		this.web3instance = new Web3(web3Provider);		
		
		this.log("web3 instance created");
		
		return this.web3instance;
	}*/
	
	getMySqlConnection() {
		if (this.mysqlconnection)
			return this.mysqlconnection;
		
		var MySqlConnection = require('./model/mysqlcon.js')
		
		var sqlcon = new MySqlConnection(this, this.mysql_host, this.mysql_port, this.mysql_database, this.mysql_username, this.mysql_password);
		
		if (this.mysql_table_prefix)
			sqlcon.setTablePrefix(this.mysql_table_prefix);
		
		this.mysqlconnection = sqlcon;
		
		// increment to never end connection
		this.mysqlconnection.open();
		
		return sqlcon;
	}
	

	overrideConsoleLog() {
		if (this.overrideconsolelog == true)
			return;
		
		this.overrideconsolelog = true;
		
		// capture current log function
		this.orgconsolelog = console.log;
		
		var self = this;
		
		console.log = function(message) {
			    self.log(message);
		}; 
	}
	
	releaseConsoleLog() {
		this.overrideconsolelog = false;
		
		console.log = this.orgconsolelog ; 
	}
	
	log(string) {
		if ((this.enable_log == 0) || (this.execution_env != 'dev'))
			return; // logging to console disabled
		
		var line = new Date().toISOString() + ": ";
		
		line += string;
		
		if (this.overrideconsolelog)
			this.orgconsolelog(line); // we've overloaded console.log
		else
			console.log(line);
		
		if ( (this.write_to_log_file != 0)  && (this.can_write_to_log_file) && (this.logPath)) {
			var fs = require('fs');

			// also write line in log/server.log
			fs.appendFileSync(this.logPath, line + '\r');
		}
	}
	
	log_directory() {
		var path = require('path');
		return path.dirname(this.logPath);
	}
	
	tail_file(filepath, nlines) {
		var fs = require("fs");

		let getLastLines = function (filename, lineCount, callback) {
		  let stream = fs.createReadStream(filename, {
		    flags: "r",
		    encoding: "utf-8",
		    fd: null,
		    mode: 438, // 0666 in Octal
		    bufferSize: 64 * 1024
		  });

		  let data = "";
		  let lines = [];
		  
		  stream.on("data", function (moreData) {
		    data += moreData;
		    
		    let worklines = data.split('\r');
		    
		    let end = worklines.length;
		    let start = (worklines.length - lineCount > 0 ? worklines.length - lineCount : 0);
		    
		    lines = worklines.slice(start, end);
		    
		    data = lines.join('\r');
		  });

		  stream.on("error", function () {
		    callback("Error");
		  });

		  stream.on("end", function () {
		    callback(null, lines);
		  });

		};
		
		var finished = false;
		var result = [];

		getLastLines(filepath, nlines, function (err, lines) {
			if (!err)
				result = lines;
			
			finished = true;
		});		
		
		// wait to turn into synchronous call
		while(!finished)
		{require('deasync').runLoopOnce();}
		
		return result;
	}
	
	tail_log_file(filename = 'server', nlines = 200) {
		var logPath;
		
		if (filename == 'server')
			logPath = this.logPath;
		else
			logPath = this.log_directory() + '/' + filename + '.log';
		
		var lines = this.tail_file(logPath, nlines);
		
		return lines;
	}
	
	guid() {
		  return this.generateUUID(8) + '-' + this.generateUUID(4) + '-' + this.generateUUID(4) + '-' +
		  this.generateUUID(4) + '-' + this.generateUUID(12);
	}
	
	generateUUID(length) {
		function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
		
		var uuid = '';
		
		while (uuid.length < length) {
			uuid += s4();
		}
		
		return uuid.substring(0, length);
	}
	
	formatDate(date, format) {
		var d = date;
		
		switch(format) {
			case 'YYYY-mm-dd HH:MM:SS':
			return d.getFullYear().toString()+"-"
			+((d.getMonth()+1).toString().length==2?(d.getMonth()+1).toString():"0"+(d.getMonth()+1).toString())+"-"
			+(d.getDate().toString().length==2?d.getDate().toString():"0"+d.getDate().toString())+" "
			+(d.getHours().toString().length==2?d.getHours().toString():"0"+d.getHours().toString())+":"
			+(d.getMinutes().toString().length==2?d.getMinutes().toString():"0"+d.getMinutes().toString())+":"
			+(d.getSeconds().toString().length==2?d.getSeconds().toString():"0"+d.getSeconds().toString());
			
			default:
				return date.toString(format);
		}
	}
	
	getConstant(name) {
		var Constants = require('./constants.js');
		
		var val = Constants[name];
		
		return val;
	}
	
	// services
	getServiceInstance(servicename) {
		if (!servicename)
		return;
		
		return (this.services[servicename] ? this.services[servicename] : null);
	}
	
	registerServiceInstance(service) {
		console.log('Global.registerServiceInstance called for ' + (service ? service.name : 'invalid'));
		
		if (!service)
			throw 'passed a null value to registerServiceInstance';
		
		if (!service.name)
			throw 'service needs to have a name property';
		
		if ((!service.loadService) || (typeof service.loadService != 'function'))
			throw 'service needs to have a loadService function';
		
		this.services[service.name] = service; // for direct access by name in getServiceInstance
		this.services.push(service); //for iteration on the array
		
		// we set global property
		service.global = this;
	}
	
	getClass() {
		return Global;
	}
	
	loadAllServices() {
		console.log('Global.loadAllServices called');
				
		for (var i=0; i < this.services.length; i++) {
			var service = this.services[i];
			
			service.loadService();
		}
		
		return true;
	}
	
	//
	// hooks mechanism
	//
	registerServicesHooks() {
		console.log('Global.registerServicesHooks called');
		
		// call registerHooks function for all services if functions exists
		for (var i=0; i < this.services.length; i++) {
			var service = this.services[i];
			
			if (service.registerHooks)
				service.registerHooks();
		}
	}
	
	getHookArray(hookentry) {
		var entry = hookentry.toString();
		
		if (!this.hook_arrays[hookentry])
			this.hook_arrays[hookentry] = [];
			
		return this.hook_arrays[hookentry];
	}
	
	registerHook(hookentry, servicename, hookfunction) {
		var hookarray = this.getHookArray(hookentry);
		
		if (typeof hookfunction === "function") {
			var hookfunctionname = hookfunction.toString();
			var entry = [];
			
			entry['servicename'] = servicename;
			entry['functionname'] = hookfunctionname;
			entry['function'] = hookfunction;
			
			console.log('registering hook '+ hookentry + ' for ' + servicename);
			hookarray.push(entry);
		}
	}
	
	invokeHooks(hookentry, result, inputparams) {
		console.log('Global.invokeHooks called for ' + hookentry);

		var hookarray = this.getHookArray(hookentry);

		for (var i=0; i < hookarray.length; i++) {
			var entry = hookarray[i];
			var func = entry['function'];
			var servicename = entry['servicename'];
			var service = this.getServiceInstance(servicename);
			
			if (service) {
				var ret = func.call(service, result, inputparams);
				
				if ((ret) && (ret === false))
					return ret
			}
			
		}
		
		return true;
	}
	
	
	// static
	static getGlobalInstance() {
		if (!globalinstance)
			globalinstance = new Global();
		
		return globalinstance;
	}
	
	static registerServiceClass(servicename, classname, classprototype) {
		Global.getGlobalInstance().getServiceInstancet(servicename)[classname] = classprototype;
		
		classprototype.getClass = function() {
			return classprototype;
		}
		
		classprototype.getClassName = function() {
			return classname;
		}
		
		classprototype.getGlobalInstance = function() {
			return Global.getGlobalInstance();
		}
	}

}

//var GlobalClass = Global;

module.exports = Global;

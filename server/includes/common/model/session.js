/**
 * 
 */
'use strict';

var _SessionMutex = class {
	
	constructor(global, session) {
		this.global = global;
		this.session = session;
	}
	
	wait(maxtime, callback) {
		var global = this.global;
		var session = this.session;
		
		var self = this;
		
		while(!session.initializationfinished) {
			global.deasync().runLoopOnce(this);
		}
		
	}
	
	static get(session) {
		if (!_SessionMutex.map)
			_SessionMutex.map = Object.create(null);
		
		var key = session.getSessionUUID();
		
		if (!_SessionMutex.map[key]) {
			var global = session.getGlobalInstance();
			_SessionMutex.map[key] = new _SessionMutex(global, session);
		}
		
		// remove old mutexes
		for (var key in _SessionMutex.map) {
		    if (!_SessionMutex.map[key]) continue;
			
		    var mutex = _SessionMutex.map[key];
		    
		    if ((mutex) && (mutex.session) && (mutex.session.isready))
		    	delete _SessionMutex.map[key];
		}
		
		return _SessionMutex.map[key];
	}
}


class SessionMap {
	constructor(global) {
		this.global = global;
		
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getSession(uuid) {
		var key = uuid.toString().toLowerCase();
		
		if (key in this.map) {
			var session = this.map[key];
			
			session.ping();
			
			// time to check on the database
			if (session.isAuthenticated()) {
				if (!session.checkAuthenticationStatus())
					session.logout();
			}
			
			return session;
		}
		else {
			var global = this.global;
			
			global.log('session not found in map: ' + key);
		}
	}
	
	pushSession(session, bfastpush = false) {
		this.garbage();

		var key = session.session_uuid.toString().toLowerCase();
		
		var global = this.global;
		global.log('Pushing session in map: ' + key);

		this.map[key] = session;
		
		if (bfastpush === true)
			return;
		
		// should put session in map before saving
		// to avoid re-entrance when mysql's async
		// is letting another call be processed

		// check if it exists in the persistence layer
		var array = Session._sessionRecord(global, key);
		
		if (array && (array['uuid'])) {
			session._init(array);
		}
		
		session.ping();

		session.save();
	}
	
	removeSession(session) {
		var key = session.session_uuid.toString().toLowerCase();
		
		var global = this.global;
		global.log('Removing session from map: ' + key);

		delete this.map[key];
	}
	
	count() {
		return Object.keys(this.map).length
	}
	
	empty() {
		this.map = Object.create(null);
	}
	
	garbage() {
		var session;
		var self = this;

		Object.keys(this.map).forEach(function(key) {
		    session = self.map[key];
		    
		    if (session.isObsolete())
		    	self.removeSession(session);
		});		
	}
}

//var _sessionmap;

class Session {
	constructor(global) {
		this.global = global;
		
		this.ethereum_node = null;
		
		this.session_uuid = null;
		
		
		this.useruuid = null;
		this.user = null;
		
		this.creation_date = Date.now();
		this.last_ping_date = Date.now();
		
		// initialization
		this.isready = false;

		// authentication
		this.isauthenticated = false;
		
		// object map
		this.objectmap = Object.create(null);
		
		this.sessionvar = {}; // saved in persistence layer
	}
	
	getGlobalInstance() {
		return this.global;
	}
	
	getSessionUUID() {
		return this.session_uuid;
	}
	
	guid() {
		return this.global.guid();
	}
	
	// persistence
	save() {
		this.global.log('Session.save called');

		var commonservice = this.global.getServiceInstance('common');
		var server = commonservice.getServerInstance();
		var persistor = server.getPersistor();
		
		if (persistor.canPersistData()) {
			var array = {};
			
			array['sessionuuid'] = this.session_uuid;
			
			var user = this.getUser();
			array['useruuid'] = (user ? user.getUserUUID() : null);
			
			array['createdon'] = this.creation_date;
			array['lastpingon'] = this.last_ping_date;
			
			array['isauthenticated'] = this.isauthenticated;
			
			var jsonstring = JSON.stringify(this.sessionvar);
			array['sessionvariables'] =  Buffer.from(jsonstring, 'utf8');
			
			
			persistor.putSession(array);
		}
		
	}
	
	_saveState() {
		this.global.log('Session._saveState called');

		var commonservice = this.global.getServiceInstance('common');
		var server = commonservice.getServerInstance();
		var persistor = server.getPersistor();
		
		if (persistor.canPersistData()) {
			var array = {};
			
			array['sessionuuid'] = this.session_uuid;
			
			var user = this.getUser();
			array['useruuid'] = (user ? user.getUserUUID() : null);
			
			array['createdon'] = this.creation_date;
			array['lastpingon'] = this.last_ping_date;
			
			array['isauthenticated'] = this.isauthenticated;
			
			persistor.putSessionState(array);
		}
		
	}
	
	_saveVariables() {
		this.global.log('Session._saveVariables called');

		var commonservice = this.global.getServiceInstance('common');
		var server = commonservice.getServerInstance();
		var persistor = server.getPersistor();
		
		if (persistor.canPersistData()) {
			var array = {};
			
			array['sessionuuid'] = this.session_uuid;
			
			var user = this.getUser();
			array['useruuid'] = (user ? user.getUserUUID() : null);
			
			array['createdon'] = this.creation_date;
			array['lastpingon'] = this.last_ping_date;
			
			array['isauthenticated'] = this.isauthenticated;
			
			var jsonstring = JSON.stringify(this.sessionvar);
			array['sessionvariables'] =  Buffer.from(jsonstring, 'utf8');
			
			
			persistor.putSessionVariables(array);
		}
		
	}
	
	_init(array) {
		this.global.log('Session._init called');

		if (array['useruuid'] !== undefined)
			this.useruuid = array['useruuid'];
		
		if (array['lastpingon'] !== undefined)
			this.last_ping_date = array['lastpingon'];
		
		if (array['isauthenticated'] !== undefined)
			this.isauthenticated = array['isauthenticated'];
		
		if (array['sessionvariables'] !== undefined) {
			try {
				var jsonstring = array['sessionvariables'].toString('utf8');
				this.sessionvar = JSON.parse(jsonstring);
			}
			catch(e) {
				
			}
		}
		
		//this.global.log('read sessionvar is ' + JSON.stringify(this.sessionvar));
	}
	
	_read() {
		var commonservice = this.global.getServiceInstance('common');
		var server = commonservice.getServerInstance();
		var persistor = server.getPersistor();
		
		if (persistor.canPersistData()) {
			var array = persistor.getSession(this.sessionuuid);
			
			this._init(array);
		}
		
	}
	
	getClass() {
		return Session;
	}
	


	// session var
	pushObject(key, object) {
		var keystring = key.toString().toLowerCase();
		this.objectmap[keystring] = object;
	}
	
	getObject(key) {
		if (key in this.objectmap) {
			return this.objectmap[key];
		}
	}
	
	removeObject(key) {
		var keystring = key.toString().toLowerCase();
		delete this.map[key];
	}
	
	setSessionVariable(key, value) {
		var global = this.global;
		
		this.sessionvar[key] = value;
		
		// save sessionvariables
		this.save();
	}
	
	getSessionVariable(key) {
		if (key in this.sessionvar) {
			return this.sessionvar[key];
		}
	}
	
	getSessionVariables() {
		var array = [];
		
		for (var key in this.sessionvar) {
		    if (!this.sessionvar[key]) continue;
		    
		    var entry = {};
		    entry.key = key;
		    entry.value = this.sessionvar[key];
		    array.push(entry);
		}
		
		return array;
	}
	
	
	// ientification and authentication
	isAnonymous() {
		var global = this.global;
		
		// invoke hooks to let services interact with the session object
		var orguseruuid = this.useruuid;
			
		var result = [];
		
		var params = [];
		
		params.push(this);

		var ret = global.invokeHooks('isSessionAnonymous_hook', result, params);
		
		if (ret && result && result.length) {
			global.log('isSessionAnonymous_hook result is ' + JSON.stringify(result));
		}
		
		var newuseruuid = this.useruuid;
		
		if (orguseruuid != newuseruuid) {
			// a hook changed the useruuid
			this.save();
		}

		// current check
		var user = this.getUser();
		return (user === null);
	}
	
	isAuthenticated() {
		var global = this.global;
		
		if (this.isAnonymous())
			return false;
		
		// invoke hooks to let services interact with the session object
		var orgisauthenticated = this.isauthenticated;
		
		var result = [];
		
		var params = [];
		
		params.push(this);

		var ret = global.invokeHooks('isSessionAuthenticated_hook', result, params);
		
		if (ret && result && result.length) {
			global.log('isSessionAuthenticated_hook result is ' + JSON.stringify(result));
		}
		
		var newisauthenticated  = this.useruuid;
		
		if (orgisauthenticated != newisauthenticated) {
			// a hook changed the authentication flag
			this.save();
		}

		// current check
		var now = Date.now();
		
		if ((now - this.last_ping_date) < 2*60*60*1000) {
			
			if (this.isauthenticated)
				return true;
			else
				return false;
		}
		else {
			this.isauthenticated = false;
			return false;
		}
	}
	
	checkAuthenticationStatus() {
		if (this.isauthenticated)
			return true;
		else
			return false;
	}
	
	logout() {
		this.isauthenticated = false;
		
		this.save();
	}
	
	isObsolete() {
		var now = Date.now();
		return ((now - this.last_ping_date) > 24*60*60*1000)
	}
	
	ping() {
		this.last_ping_date = Date.now();
		
		//this._saveState();
		// should update only lastpingon
	}
	
	impersonateUser(user) {
		this.user = user;
		this.useruuid = user.getUserUUID();;
		this.isauthenticated = true;
		
		this.save();
	}
	
	disconnectUser() {
		this.user = null;
		this.useruuid = null;
		this.isauthenticated = false;
		
		this.save();
	}
	
	getUser() {
		if (this.useruuid && !this.user) {
			// restored from database
			var commonservice = this.global.getServiceInstance('common');

			this.user = commonservice.createBlankUserInstance();
			
			// TODO: should access original auth service to get user details
			this.user.setUserUUID(this.useruuid);
		}
			
		return this.user;
	}
	
	getUserUUID() {
		return this.useruuid;
	}
	
	// mysql calls
	getMySqlConnection() {
		var global = this.global;
		
		return global.getMySqlConnection();
	}
	
	// rest calls
	getRestConnection(rest_server_url, rest_server_api_path) {
		var RestConnection = require('./restconnection.js');
		
		return new RestConnection(this, rest_server_url, rest_server_api_path);
	}
	
	// privileges
	hasSuperAdminPrivileges() {
		if (this.isAnonymous())
			return false;
		
		if (!this.isAuthenticated())
			return false;
		
		var user = this.getUser();
		
		return user.isSuperAdmin();
	}
	
	// static
	static createBlankSession(global) {
		var session = new Session(global);
		session.session_uuid = session.guid();
		
		var sessionmap = Session.getSessionMap(global);

		sessionmap.pushSession(session);
		
		return session;
	}
	
	static getSessionMap(global) {
		if (!global) {
			console.log('global is null');
			console.trace('must pass valid global');
			
			throw 'Session.getSessionMap called with a null value';
		}
		
		if (global._sessionmap)
			return global._sessionmap;
		
		global._sessionmap = new SessionMap(global);
		
		return global._sessionmap;
	}
	
	static _sessionRecord(global, sessionuuid) {
		var commonservice = global.getServiceInstance('common');
		var server = commonservice.getServerInstance();
		var persistor = server.getPersistor();
		
		global.log('Session._sessionRecord called for ' + sessionuuid);
		
		if (persistor.canPersistData()) {
			global.log('Session._sessionRecord reading in persistor session ' + sessionuuid);
			var array = persistor.getSession(sessionuuid);
			global.log('Session._sessionRecord session ' + sessionuuid + ' array is ' + JSON.stringify(array));
		}
		else {
			global.log('Session._sessionRecord session ' + sessionuuid + ' persistor says can not persist data');
		}
		
		return array;
	}
	
	static getSession(global, sessionuuid) {
		var session;
		
		var sessionmap = Session.getSessionMap(global);
		
		var key = sessionuuid.toString();
		var mapvalue = sessionmap.getSession(key);
		
		var account;
		
		if (mapvalue !== undefined) {
			// is already in map
			session = mapvalue;
		}
		else {
			// create a new session object
			session = new Session(global);
			session.session_uuid = sessionuuid;
			
			global.log('creating session object for ' + sessionuuid);
			
			// we push the object right away
			// to avoid having persistence async operation creating a re-entry
			sessionmap.pushSession(session, true); // fast push to avoid calls to mysql
			
		}
		
		if (session.isready === false) {
			session.initializationfinished = false;
			
			global.log('creating session initialization promise for session ' + sessionuuid);
			
			// we may go through this section several times because of issues with re-entrance
			// and nodejs/javascript mono-threaded approach of stacking execution bits
			
			/// create a mutex to start unstacking calls once one of them has finished the initialization
			var sessionmutex = _SessionMutex.get(session);
			
			global.log('session sessionmutex retrieved for session ' + sessionuuid);
			
			var promise = new Promise(function (resolve, reject) {
				try {
					global.log('starting initialization of session object for ' + sessionuuid);

					// check to see if it's in the persistence layer
					var array = Session._sessionRecord(global, sessionuuid);
					
					if (array && (array['uuid'])) {
						session._init(array);
					}
					
					session.ping();

					session.save();

					// invoke hooks to let services interact with the new session object
					var result = [];
					
					var params = [];
					
					params.push(session);

					var ret = global.invokeHooks('createSession_hook', result, params);
					
					if (ret && result && result.length) {
						global.log('createSession_hook result is ' + JSON.stringify(result));
					}
					
					session.isready = true; // end of pseudo lock on session initialization
					
					global.log('session ' + sessionuuid + ' is now ready!');

					resolve(true);
				}
				catch(e) {
					var error = 'exception in session creation promise: ' + e;
					global.log(error);
					
					reject(error);
			}
			})
			.then(function (res) {
				global.log('session ' + sessionuuid + ' resolved the initialization promise');

				session.initializationfinished = true;
				
				return Promise.resolve(true);
			})
			.catch(function (err) {
				global.log("error in session initialization for sessionuuid " + sessionuuid + ": " + err);
				
				session.initializationfinished = true;
				
				return Promise.reject("error in session initialization for sessionuuid " + sessionuuid + ": " + err);
			});
			
			global.log('session initialization promise created for session ' + sessionuuid);
			
			sessionmutex.wait(10000, function() {
				global.log('session going out of mutex for session ' + sessionuuid);
			});
			
			global.log('session initialized for session ' + sessionuuid);
			
		}

		
		return session;
	}
	
	static putSession(global, session) {
		var sessionuuid = session.getSessionUUID();
		
		if (Session.getSession(global, sessionuuid))
			throw 'session has already been pushed: ' + sessionuuid;
		
		var sessionmap = Session.getSessionMap(global);
		
		sessionmap.pushSession(session);
	}
}


module.exports = Session;
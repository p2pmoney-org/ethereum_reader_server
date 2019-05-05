/**
 * 
 */
'use strict';


class DataBasePersistor {
	constructor(service) {
		this.service = service;
		this.global = service.global;
	}
	
	canPersistData() {
		var global = this.global;
		var mysqlcon = global.getMySqlConnection();

		return mysqlcon.isActive();
	}
	
	getGlobalParameters(key) {
		var global = this.global;
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('globalparameters');
		
		var sql = "SELECT * FROM " + tablename + " WHERE \`Key\` = '" + key + "';";
		
		// open connection
		mysqlcon.open();
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		
		var array = [];
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				var rowarray = {};
				
				rowarray['key'] = row.Key;
				rowarray['type'] = row.Type;
				rowarray['value'] = row.Value;
				
				array.push(rowarray);
			}
			
		}
		
		
		// close connection
		mysqlcon.close();
			
			
		return array;
	}
	
	putGlobalParameter(key, type, value) {
		var global = this.global;
		
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('globalparameters');
		
		var sql;
		
		// open connection
		mysqlcon.open();
		
		sql = `INSERT INTO ` +  tablename + ` (
					\`Key\`,
					\`Type\`,
					\`Value\` 
		  )
		  VALUES (
		  '` + key + `',
		  ` + type + `,
		  '` + value + `'
		  );`;
		
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		// close connection
		mysqlcon.close();
	}
	
	updateGlobalParameters(key, type, value) {
		var global = this.global;
		
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('globalparameters');
		
		var sql;
		
		// open connection
		mysqlcon.open();
		
		sql = `UPDATE ` +  tablename + ` SET
		  \`Type\` = ` + type + `,
		  \`Value\` = '` + value + `'
		  WHERE  \`Key\` = '` + key + `';`;

		
		// execute query
		var result = mysqlcon.execute(sql);
		
		// close connection
		mysqlcon.close();
	}
	
	// sessions
	_getUserArrayFromUUID(useruuid) {
		var global = this.global;
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('users');
		
		var sql = "SELECT * FROM " + tablename + " WHERE UserUUID = '" + useruuid + "';";
		
		// open connection
		mysqlcon.open();
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		
		var array = {};
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				array['id'] = row.UserId;
				array['uuid'] = row.UserUUID;
				array['userid'] = row.UserId;
				array['useruuid'] = row.UserUUID;
				array['username'] = row.UserName;
				array['useremail'] = row.UserEmail;
				array['password'] = row.Password;
				array['hashmethod'] = row.HashMethod;
				array['salt'] = row.Salt;
				array['accountstatus'] = row.AccountStatus;
			}
			
		}
		
		
		// close connection
		mysqlcon.close();
			
			
		return array;
	}

	_getUserArrayFromId(userid) {
		var global = this.global;
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('users');
		
		var sql = "SELECT * FROM " + tablename + " WHERE UserId = " + userid + ";";
		
		// open connection
		mysqlcon.open();
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		
		var array = {};
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				array['id'] = row.UserId;
				array['uuid'] = row.UserUUID;
				array['userid'] = row.UserId;
				array['useruuid'] = row.UserUUID;
				array['username'] = row.UserName;
				array['useremail'] = row.UserEmail;
				array['password'] = row.Password;
				array['hashmethod'] = row.HashMethod;
				array['salt'] = row.Salt;
				array['accountstatus'] = row.AccountStatus;
				
			}
			
		}
		
		
		// close connection
		mysqlcon.close();
			
			
		return array;
	}

	getSession(sessionuuid) {
		var global = this.global;
		
		
		var mysqlcon = global.getMySqlConnection();
		
		var tablename = mysqlcon.getTableName('sessions');
		
		var sql = "SELECT * FROM " + tablename + " WHERE SessionUUID = '" + sessionuuid + "';";
		
		// open connection
		mysqlcon.open();
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		
		var array = {};
		
		if (result) {
			var rows = (result['rows'] ? result['rows'] : []);
			
			if (rows[0]) {
				var row = rows[0];
				
				array['id'] = row.SessionId;
				array['uuid'] = row.SessionUUID;
				array['sessionid'] = row.SessionId;
				array['sessionuuid'] = row.SessionUUID;
				array['userid'] = row.UserId;
				array['createdon'] = row.CreatedOn.getTime();
				array['lastpingon'] = row.LastPingOn.getTime();
				array['isauthenticated'] = (row.IsAuthenticated == 1 ? true : false);
				array['sessionvariables'] = row.SessionVariables;
				
				if (array['userid'] != -1) {
					var sessionuserarray = this._getUserArrayFromId(array['userid']);
					
					array['useruuid'] = (sessionuserarray ? sessionuserarray['useruuid'] : null);
				}
				else {
					array['useruuid'] = null;
				}
			}
			
		}
		
		
		// close connection
		mysqlcon.close();
		
		return array;
	}
	
	putSession(array) {
		var global = this.global;
		
		var sessionuuid = array['sessionuuid'];
		
		var useruuid = array['useruuid'];
		
		var userarray = ( useruuid ? this._getUserArrayFromUUID(useruuid) : {id: -1});
		var userid = (userarray['id'] ? userarray['id'] : -1);
		
		var mysqlcon = global.getMySqlConnection();
		
		var createdon = mysqlcon.escape(new Date(array['createdon']));
		var lastpingon = mysqlcon.escape(new Date(array['lastpingon']));
		var isauthenticated = (array['isauthenticated'] == true ? 1 : 0);;
		var sessionvariables = array['sessionvariables'];

		
		var tablename = mysqlcon.getTableName('sessions');
		
		var sql;
		
		// open connection
		mysqlcon.open();
		
		var current = this.getSession(sessionuuid);
		
		if (current.uuid !== undefined) {
			sql = `UPDATE ` +  tablename + ` SET
					  UserId = ` + userid + `,
					  LastPingOn = ` + lastpingon + `,
					  IsAuthenticated = ` + isauthenticated + `,
					  SessionVariables = ` + (sessionvariables ? `'` + sessionvariables + `'` : `''`) + `
				WHERE SessionId = ` + current.id + `;`;
		}
		else {
			var salt = this.global.generateUUID(16);
			
			sql = `INSERT INTO ` +  tablename + ` (
					  SessionUUID,
					  UserId,
					  CreatedOn,
					  LastPingOn,
					  IsAuthenticated,
					  SessionVariables
			  )
			  VALUES (
					  '` + sessionuuid + `',
					  ` + userid + `,
					  ` + createdon + `,
					  ` + lastpingon + `,
					  ` + isauthenticated + `,
					  ` + (sessionvariables ? `'` + sessionvariables + `'` : `''`) + `
			  );`;
		}
		
		
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		// close connection
		mysqlcon.close();
	}
	
	putSessionState(array) {
		var global = this.global;
		
		var sessionuuid = array['sessionuuid'];
		
		var useruuid = array['useruuid'];
		
		var userarray = ( useruuid ? this._getUserArrayFromUUID(useruuid) : {id: -1});
		var userid = (userarray['id'] ? userarray['id'] : -1);
		
		var mysqlcon = global.getMySqlConnection();
		
		var createdon = mysqlcon.escape(new Date(array['createdon']));
		var lastpingon = mysqlcon.escape(new Date(array['lastpingon']));
		var isauthenticated = (array['isauthenticated'] == true ? 1 : 0);;

		
		var tablename = mysqlcon.getTableName('sessions');
		
		var sql;
		
		// open connection
		mysqlcon.open();
		
		var current = this.getSession(sessionuuid);
		
		if (current.uuid !== undefined) {
			sql = `UPDATE ` +  tablename + ` SET
					  UserId = ` + userid + `,
					  LastPingOn = ` + lastpingon + `,
					  IsAuthenticated = ` + isauthenticated + `
				WHERE SessionId = ` + current.id + `;`;
		}
		else {
			var salt = this.global.generateUUID(16);
			
			sql = `INSERT INTO ` +  tablename + ` (
					  SessionUUID,
					  UserId,
					  CreatedOn,
					  LastPingOn,
					  IsAuthenticated
			  )
			  VALUES (
					  '` + sessionuuid + `',
					  ` + userid + `,
					  ` + createdon + `,
					  ` + lastpingon + `,
					  ` + isauthenticated + `
			  );`;
		}
		
		
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		// close connection
		mysqlcon.close();
	}
	
	putSessionVariables(array) {
		var global = this.global;
		
		var sessionuuid = array['sessionuuid'];
		
		var mysqlcon = global.getMySqlConnection();
		
		var sessionvariables = array['sessionvariables'];

		
		var tablename = mysqlcon.getTableName('sessions');
		
		var sql;
		
		// open connection
		mysqlcon.open();
		
		var current = this.getSession(sessionuuid);
		
		if (current.uuid !== undefined) {
			sql = `UPDATE ` +  tablename + ` SET
					  SessionVariables = ` + (sessionvariables ? `'` + sessionvariables + `'` : `''`) + `
				WHERE SessionId = ` + current.id + `;`;
		}
		
		
		
		// execute query
		var result = mysqlcon.execute(sql);
		
		// close connection
		mysqlcon.close();
	}
	
}


module.exports = DataBasePersistor;
/**
 * 
 */
'use strict';


class User {
	
	constructor() {
		this.username = null;
		this.useremail = null;
		
		this.useruuid = null;
		
		this.accountstatus = -1;
		
		this.roles = [];
	}
	
	getUserUUID() {
		return this.useruuid;
	}
	
	setUserUUID(useruuid) {
		this.useruuid = useruuid;
	}
	
	getUserName() {
		return this.username;
	}
	
	setUserName(username) {
		this.username = username;
	}
	
	getUserEmail() {
		return this.useremail;
	}
	
	setUserEmail(useremail) {
		this.useremail = useremail;
	}
	
	getAccountStatus() {
		return this.accountstatus;
	}
	
	setAccountStatus(accountstatus) {
		this.accountstatus = accountstatus;
	}
	
	// privileges
	addRole(role) {
		var rolevalue = role.getValue();
		
		if (this._hasRole(rolevalue))
			this.removeRole(rolevalue);
		
		this.roles.push(role);
	}
	
	removeRole(rolevalue) {
		for (var i = 0; i < this.roles.length; i++) {
			var role = this.roles[i];
			
			if (role.getValue() == rolevalue)
				this.roles.splice(i, 1);
		}
	}
	
	_hasRole(rolevalue) {
		for (var i = 0; i < this.roles.length; i++) {
			var role = this.roles[i];
			
			if (role.getValue() == rolevalue)
				return true;
		}
		
		return false;
	}
	
	isSuperAdmin() {
		return this._hasRole(1);
	}
	
	// static
	static createBlankUserInstance() {
		return new User();
	}
	
}


module.exports = User;

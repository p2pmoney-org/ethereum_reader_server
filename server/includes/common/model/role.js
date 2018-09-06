'use strict';


class Role {
	
	constructor(value, name) {
		this.value = value;
		this.name = name;
	}
	
	isSuperAdmin() {
		if (this.value == 1)
			return true;
		else
			return false;
	}
	
	getValue() {
		return this.value;
	}
	
	setValue(value) {
		this.value = value;
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
	}
	
	// static
	static createRoleInstance(rolevalue, rolename) {
		return new Role(rolevalue, rolename);
	}
}

module.exports = Role;
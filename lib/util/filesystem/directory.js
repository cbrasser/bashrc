import {fileFromJSON} from './file'

export function newDirectory(name, parent) {
	return new Directory(name, parent);
}

export function dirFromJSON(parent, json_obj){
	var d = new Directory(json_obj.name, parent, json_obj.isRoot);
	d.children = json_obj.children.map(c => dirFromJSON(d, c));
	d.files = json_obj.files.map(f => fileFromJSON(d, f));
	return d;
}


class Directory {
	constructor(name, parent, isRoot) {
		this.name = name;
		this.isRoot = isRoot;
		if (parent == null) {
			this.isRoot = true;
			this.parent = null;
		} else {
			this.isRoot = false;
			this.parent = parent;
		}
		this.parent = parent;
		this.children = [];
		this.files = [];
	}

	toJSON() {
		var json = {};
		json.name = this.name;
		json.isRoot = this.isRoot;
		json.children = this.children.map(c => c.toJSON());
		json.files = this.files.map(f => f.toJSON());
		return json;		
	}


	addChild(child) {
		if(this.getFileNames().indexOf(child.getName()) != -1 ||
		this.getChildrenNames().indexOf(child.getName()) != -1
		) {
			return false;
		}
		this.children.push(child);
		return true;
	}

	addFile(file) {
		if(this.getFileNames().indexOf(file.getName()) != -1 ||
		this.getChildrenNames().indexOf(file.getName()) != -1
		) {
			return false;
		}
		this.files.push(file);
		return true;
	}

	getParent() {
		return this.parent;
	}

	getRelative(name){
		if(name == '..') {
			return this.getParent();
		} else {
			return this.getNode(name);
		}
	}

	isEmpty() {
		return this.children.length == 0 && this.files.length == 0;
	}

	getName() {
		return this.name;
	}
	getPath() {
		if (this.parent) {
			return this.parent.getPath().concat("/"+this.name); 
		} else {
			return this.name;
		}
	}

	getChildren() {
		return this.children;
	}

	getChild(name) {
		return this.children.filter(c => c.getName() == name)[0];
	}
	getFile(name) {
		return this.files.filter(f => f.getName() == name)[0];
	}
	getNode(name) {
		return this.getChild(name) ? this.getChild(name) : this.getFile(name); 
	}

	removeChild(name) {
		if(this.getChildrenNames().indexOf(name) == -1){
			return false;
		}
		this.children = this.children.filter(c => c.getName() != name);
		return true;
	}
	removeFile(name) {
		if(this.getFileNames().indexOf(name) == -1){
			return false;
		}
		this.files = this.files.filter(f => f.getName() != name);
		return true;
	}

	getChildrenNames() {
		return this.children.map( c => c.getName());
	}



	getFileNames() {
		return this.files.map(f => f.getName());
	}
	
	getFiles() {
		return this.files;
	}



	
}


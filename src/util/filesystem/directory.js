import { fileFromJSON } from './file'

export function newDirectory(name, parent, isRoot) {
	return new Directory(name, parent, isRoot);
}

export function dirFromJSON(parent, json_obj) {
	var d = new Directory(json_obj.name, parent, json_obj.isRoot);
	d.children = (json_obj.children || []).map(c => dirFromJSON(d, c));
	d.files = (json_obj.files || []).map(f => fileFromJSON(d, f));
	return d;
}

class Directory {
	constructor(name, parent, isRoot) {
		this.name = name;
		this.parent = parent == null ? null : parent;
		this.isRoot = parent == null ? true : !!isRoot;
		this.children = [];
		this.files = [];
	}

	toJSON() {
		return {
			name: this.name,
			isRoot: this.isRoot,
			children: this.children.map(c => c.toJSON()),
			files: this.files.map(f => f.toJSON()),
		};
	}

	addChild(child) {
		if (this.hasNode(child.getName())) {
			return false;
		}
		this.children.push(child);
		return true;
	}

	addFile(file) {
		if (this.hasNode(file.getName())) {
			return false;
		}
		this.files.push(file);
		return true;
	}

	hasNode(name) {
		return this.getFileNames().indexOf(name) != -1 ||
			this.getChildrenNames().indexOf(name) != -1;
	}

	getParent() {
		return this.parent;
	}

	getRelative(name) {
		if (name == '.') {
			return this;
		}
		if (name == '..') {
			// staying at the root instead of returning null keeps 'cd ..' safe
			return this.getParent() || this;
		}
		return this.getNode(name);
	}

	getName() {
		return this.name;
	}

	getPath() {
		if (this.parent) {
			return this.parent.getPath().concat('/' + this.name);
		}
		return this.name;
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
		if (this.getChildrenNames().indexOf(name) == -1) {
			return false;
		}
		this.children = this.children.filter(c => c.getName() != name);
		return true;
	}

	removeFile(name) {
		if (this.getFileNames().indexOf(name) == -1) {
			return false;
		}
		this.files = this.files.filter(f => f.getName() != name);
		return true;
	}

	getChildrenNames() {
		return this.children.map(c => c.getName());
	}

	getFileNames() {
		return this.files.map(f => f.getName());
	}

	getFiles() {
		return this.files;
	}

	isEmpty() {
		return this.children.length == 0 && this.files.length == 0;
	}
}

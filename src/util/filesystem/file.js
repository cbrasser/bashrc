export function newFile(name, url, parent) {
	return new File(name, url, parent);
}

export function fileFromJSON(parent, json_obj) {
	return new File(json_obj.name, json_obj.url, parent);
}

class File {
	constructor(name, url, parent) {
		this.name = name;
		this.url = url;
		this.parent = parent;
	}

	toJSON() {
		return { name: this.name, url: this.url };
	}

	getUrl() {
		return this.url;
	}

	getPath() {
		return this.parent ? `${this.parent.getPath()}/${this.name}` : this.name;
	}

	getName() {
		return this.name;
	}

	getParent() {
		return this.parent;
	}
}

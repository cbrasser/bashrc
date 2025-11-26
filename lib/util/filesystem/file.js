export function newFile(name, url, parent) {
	return new File(name, url, parent);
}

export function fileFromJSON(parent, json_obj){
	var f = new File(json_obj.name, json_obj.url, parent);
	return f;
}

class File {
	constructor(name, url, parent) {
		this.name = name;
		this.url = url;
		this.parent = parent;
	}
	toJSON() {
		var json = {};
		json.name = this.name;
		json.url = this.url;
		return json;		
	}

	getUrl() {
		return this.url;
	}
	getPath() {
		return this.parent.getPath().concat(this.name);
	}
	getName() {
		return this.name;
	}
	getParent() {
		return this.parent;
	}
}

export function newResponse() {
	return new Response();
}

class Response {
	constructor() {
		this.directory = null;
		this.dirs = [];
		this.files = [];
		this.messages = [];
		// set by commands that mutated the file tree, so the caller knows
		// it has to persist the new state
		this.success = false;
	}

	error(message) {
		this.messages.push({ type: 'error', value: message });
		return this;
	}
}

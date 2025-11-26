

export function newResponse() {
	return new Response();
}

class Response {
	constructor() {
        this.directory = null;
        this.dirs = [];
        this.files = [];
        this.messages = [];
        
    }
}
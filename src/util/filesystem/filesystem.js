import { newDirectory, dirFromJSON } from './directory.js'
import { newFile, fileFromJSON } from './file.js'
import { newResponse } from '../../components/response.js'
import { log } from '../../components/logger'

/* A tree of all folders and files. It holds no information about the current
   working directory, that lives in the vuex store. */
export class FileSystem {
	constructor(config) {
		this.separator = '/'
		this.isAbsolutePathExp = /^~/

		this.root = newDirectory('~', null, true);
		if (config) {
			log('filesystem', 'restoring from local storage', 'green');
			this.root.children = (config.children || []).map(c => dirFromJSON(this.root, c));
			this.root.files = (config.files || []).map(f => fileFromJSON(this.root, f));
		} else {
			log('filesystem', 'no file system found, creating a new one', 'green');
		}
	}

	getRoot() {
		return this.root;
	}

	/* Commands are called from the terminal (array of args) as well as from the
	   file manager (a single string), so normalize both into an array. */
	normalizeArgs(args) {
		if (Array.isArray(args)) {
			return args.filter(a => a !== undefined && a !== null && a !== '');
		}
		if (typeof args === 'string') {
			return args.split(' ').filter(a => a.length > 0);
		}
		return [];
	}

	buildPathList(path) {
		return path.split(this.separator);
	}

	buildPathString(path_list) {
		return path_list.join(this.separator);
	}

	removeTrailingNode(path) {
		var index = path.indexOf(this.separator);
		return index == -1 ? '' : path.substr(index + 1);
	}

	/* Resolve a path (absolute or relative to dir) to a node.
	   Returns undefined if the path does not exist. */
	getNode(dir, path) {
		if (!dir) {
			return undefined;
		}
		if (typeof path !== 'string') {
			return dir;
		}

		// absolute path: restart the search at the root without the leading '~'
		if (this.isAbsolutePathExp.test(path)) {
			return this.getNode(this.root, this.removeTrailingNode(path));
		}

		// a path without a separator is a plain node name
		if (path.indexOf(this.separator) == -1) {
			if (path.length == 0) {
				return dir;
			}
			return dir.getRelative ? dir.getRelative(path) : undefined;
		}

		// neither a plain name nor absolute: descend into the first path segment
		var next_node = dir.getRelative(path.split(this.separator)[0]);
		if (!next_node) {
			return undefined;
		}
		return this.getNode(next_node, this.removeTrailingNode(path));
	}

	/* Split 'some/path/name' into the parent node and the trailing name. */
	resolveParent(dir, path) {
		var name = path.substr(path.lastIndexOf(this.separator) + 1);
		var parentPath = path.lastIndexOf(this.separator) == -1
			? ''
			: path.substr(0, path.lastIndexOf(this.separator));
		// 'touch ~/file' has an empty parent path but is still absolute
		if (parentPath.length == 0 && this.isAbsolutePathExp.test(path)) {
			return { parent: this.root, name: name };
		}
		return { parent: this.getNode(dir, parentPath), name: name };
	}

	call(command, directory, args) {
		if (typeof this[command] !== 'function' || this.api().indexOf(command) == -1) {
			return undefined;
		}
		try {
			return this[command](directory, args);
		} catch (e) {
			console.error(e);
			return newResponse().error(`${command}: ${e.message}`);
		}
	}

	// ------------------------- BASIC FILE SYSTEM COMMANDS ------------------------

	ls(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();
		var node = args[0] ? this.getNode(dir, args[0]) : dir;

		if (!node) {
			return res.error(`ls: cannot access '${args[0]}': No such file or directory`);
		}
		if (node.url) {
			// listing a file just prints the file itself, like real ls does
			res.files = [{ name: node.getName(), url: node.getUrl() }];
			return res;
		}
		res.dirs = node.getChildrenNames();
		res.files = node.getFiles().map(f => ({ name: f.getName(), url: f.getUrl() }));
		return res;
	}

	cd(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();

		if (!args[0]) {
			// no argument: back to the root, like 'cd' with no args goes home
			res.directory = this.getRoot();
			return res;
		}

		var d = this.getNode(dir, args[0]);
		if (!d) {
			return res.error(`cd: no such directory: ${args[0]}`);
		}
		if (d.url) {
			return res.error(`cd: not a directory: ${d.getName()}`);
		}
		res.directory = d;
		return res;
	}

	mkdir(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();
		if (!args[0]) {
			return res.error('mkdir: missing operand');
		}

		var { parent, name } = this.resolveParent(dir, args[0]);
		if (!parent || parent.url) {
			return res.error(`mkdir: cannot create directory '${args[0]}': No such file or directory`);
		}
		if (!parent.addChild(newDirectory(name, parent))) {
			return res.error(`mkdir: cannot create directory '${args[0]}': File exists`);
		}
		res.success = true;
		return res;
	}

	rmdir(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();
		if (!args[0]) {
			return res.error('rmdir: missing operand');
		}

		var node = this.getNode(dir, args[0]);
		if (!node) {
			return res.error(`rmdir: failed to remove '${args[0]}': No such file or directory`);
		}
		if (node.url) {
			return res.error(`rmdir: failed to remove '${node.getName()}': Not a directory`);
		}
		if (!node.getParent()) {
			return res.error('rmdir: failed to remove the root directory');
		}
		if (!node.isEmpty()) {
			return res.error(`rmdir: failed to remove '${node.getName()}': Directory not empty`);
		}
		if (!node.getParent().removeChild(node.getName())) {
			return res.error(`rmdir: failed to remove '${node.getName()}': No such file or directory`);
		}
		res.success = true;
		return res;
	}

	touch(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();
		if (!args[0]) {
			return res.error('touch: missing file operand');
		}
		if (!args[1]) {
			return res.error('touch: missing url operand (usage: touch [path] [url])');
		}

		var { parent, name } = this.resolveParent(dir, args[0]);
		if (!parent || parent.url) {
			return res.error(`touch: cannot touch '${args[0]}': No such file or directory`);
		}
		if (!parent.addFile(newFile(name, this.normalizeUrl(args[1]), parent))) {
			return res.error(`touch: cannot create file '${name}': File exists`);
		}
		res.success = true;
		return res;
	}

	rm(dir, args) {
		args = this.normalizeArgs(args);
		var res = newResponse();
		if (!args[0]) {
			return res.error('rm: missing operand');
		}

		var file = this.getNode(dir, args[0]);
		if (!file) {
			return res.error(`rm: cannot remove '${args[0]}': No such file or directory`);
		}
		if (!file.url) {
			return res.error(`rm: cannot remove '${file.getName()}': Is a directory`);
		}
		if (!file.getParent().removeFile(file.getName())) {
			return res.error(`rm: cannot remove '${file.getName()}': No such file`);
		}
		res.success = true;
		return res;
	}

	/* Bookmarks are typed without a protocol most of the time, but a link
	   without one is resolved relative to the start page. */
	normalizeUrl(url) {
		if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) {
			return url;
		}
		return `https://${url}`;
	}

	api() {
		return ['cd', 'touch', 'rm', 'mkdir', 'rmdir', 'ls'];
	}
}

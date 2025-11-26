import { newDirectory, dirFromJSON } from './directory.js'
import { newFile, fileFromJSON } from './file.js'
import { newResponse } from '../../components/response.js'
import { log } from '../../components/logger.js'



/* This will be a Tree with all folders and files but no information on current working dir, just the tree */
export class FileSystem {
	constructor(config) {
		this.separator = '/'
		this.dirNameExp = /[\w|~]+$/
		this.containsSlashCheckExp = /\//
		this.isAbsolutePathExp = /^~/

		this.root = newDirectory('~', null, true);
		if (config) {
			console.log('constructing filesystem from store')
			this.root.children = config.children.map(c => dirFromJSON(this.root, c));
			this.root.files = config.files.map(f => fileFromJSON(this.root, f));
		} else {
			console.log('no file system found, creating new');
		}
	}

	getRoot() {
		return this.root;
	}

	buildPathList(path) {
		return path.split(this.separator);
	}

	buildPathString(path_list) {
		return path_list.join(this.separator);
	}

	removeTrailingNode(path) {
		return path.substr(path.indexOf(this.separator) + 1)
	}

	/*
	type: 
	0: all
	1: dirs
	2: files
	TODO: Fix how we get nodes and files
	*/
	getNode(dir, path) {
		log('getNode: ', `${dir.getName()} - ${path}`)

		// path is absolute, start search at root and remove root at start of path
		if (this.isAbsolutePathExp.test(path)) {
			return this.getNode(this.root, this.removeTrailingNode(path))
		} else
			// path does not contain separator, so it only contains a name
			// -> path is direct name
			if (path.indexOf(this.separator) == -1) {
				if (path.length == 0) {
					return dir;
				}
				return dir.getRelative(path);
			}

		// neither direct name nor absolute 
		// -> get first node in path, restart search in first node in path with cut-off path
		var next_node = dir.getRelative(path.split(this.separator)[0]);
		return this.getNode(next_node, this.removeTrailingNode(path));
	}

	call(command, directory, args) {
		try {
			return this[command](directory, args);
		} catch (e) {
			console.log(e);

		}
	}



	// ------------------------- BASIC FILE SYSTEM COMMANDS ------------------------


	ls(dir, args) {
		log('ls', `${dir} - ${args}`, 'green')
		// node is either specified by path or current node
		var node = args[0] ? this.getNode(dir, args[0]) : dir;

		var res = newResponse();
		res.dirs = node.getChildrenNames();
		res.files = node.getFiles().map(f => ({ "name": f.getName(), "url": f.getUrl() }));
		return res;
	}

	cd(dir, args) {
		log('cd', `${dir} - ${args}`, 'green')
		var res = newResponse()
		if (!Array.isArray(args)) {
			args = args.split(' ')
		}
		if (args[0]) {
			var d = this.getNode(dir, args[0])
			if (!d) {
				res.messages.push({ "type": "error", "value": `cd: No such directory: ${args[0]}` });
				return res;
			}
			log('found node', d.getName())
			if (d.url) {
				res.messages.push({ "type": "error", "value": `cd: not a directory: ${d.getName()}` });
				return res;
			}
			res.directory = d;
			return res;
		}
		// goal dir is either root or a relative dir from current dir
		res.directory = this.getRoot()
		return res;
	}

	mkdir(dir, args) {
		log('mkdir', `${dir} - ${args}`, 'green')
		var res = newResponse();
		// check if required args are submitted
		if (!args[0]) {
			res.messages.push({ "type": "error", "value": "mkdir: missing operand" });
			return res;
		}
		if (!Array.isArray(args)) {
			args = args.split(' ')
		}
		// we always need at least a name
		var name = args[0].substr(args[0].lastIndexOf(this.separator) + 1);
		log('mkdir: name', name, 'green')
		var path = args[0].substr(0, args[0].lastIndexOf(this.separator));
		var node = this.getNode(dir, path);
		if (!node) {
			res.messages.push({
				"type": "error",
				"value": `mkdir: cannnot create directory '${args}': No such file or directory`
			});
			return res;
		}
		if (node.addChild(newDirectory(name, node))) {
			return { success: true };
		} else {
			res.messages.push({ "type": "error", "value": `mkdir: cannot create directory '${args[0]}': File exists` });
			return res;
		}
	}

	rmdir(dir, args) {
		log("rmdir", dir + " - " + args, 'green')
		var res = newResponse();
		// check if required args are submitted
		if (!args[0]) {
			res.messages.push({ "type": "error", "value": 'rmdir: missing operand' });
			return res;
		}
		if (!Array.isArray(args)) {
			args = args.split(' ')
		}
		var node = this.getNode(dir, args[0]);
		if (!node) {
			res.messages.push({
				"type": "error",
				"value": `rmdir: failed to remove '${args}': No such file or directory`
			});
			return res;
		}
		if (node.url) {
			res.messages.push({ "type": "error", "value": `rmdir: failed to remove '${node.getName()}': Not a directory` });
			return res;
		}
		if (!node.isEmpty()) {
			res.messages.push({ "type": "error", "value": `failed to remove ${node.getName()}: Directory not empty` })
			return res
		}
		if (!node.getParent().removeChild(node.getName())) {
			res.messages.push({ "type": "error", "value": `rmdir: failed to remove ${node.getName()}: No such file or directory` })
			return res;
		}
		this.storeConfigToLocalStorage()
	}

	touch(dir, args) {
		log('touch', `${dir} - ${args}`, 'purple')
		var res = newResponse();
		if (!Array.isArray(args)) {
			args = args.split(' ')
		}
		if (!args[0] || !args[1]) {
			res.messages.push({ "type": "error", "value": "touch: missing file operand" })
			return res
		}
		var name = args[0].substr(args[0].lastIndexOf(this.separator) + 1);
		var path = args[0].substr(0, args[0].lastIndexOf(this.separator));

		var node = this.getNode(dir, path);
		if (!node) {
			res.messages.push({
				"type": "error",
				"value": `touch: cannot touch '${args}': No such file or directory`
			});
			return res;
		}
		if (!node.addFile(newFile(name, args[1], node))) {
			res.messages.push({ "type": "error", "value": `touch: cannot create file '${name}': File exists` });
			return res;
		}
		this.storeConfigToLocalStorage()
	}

	rm(dir, args) {
		log('rm', `${dir} - ${args}`, 'green')
		var res = newResponse();
		if (!Array.isArray(args)) {
			args = args.split(' ')
		}
		if (!args[0]) {
			res.messages.push({ "type": "error", "value": "rm: missing operand" });
			return res;
		}

		var file = this.getNode(dir, args[0]);
		if (!file) {
			res.messages.push({
				"type": "error",
				"value": `rm: cannot remove '${args}': No such file or directory`
			});
			return res;
		}
		if (!file.url) {
			res.messages.push({ "type": "error", "value": `rm: cannot remove '${file.getName()}: Is a directory'` });
			return res;
		}
		if (!file.getParent().removeFile(file.getName())) {
			res.messages.push({ "type": "error", "value": `rm: cannot remove '${file.getName()}: No such file'` });
			return res;
		}
	}

	api() {
		return ["cd", "touch", "rm", "mkdir", "rmdir", "ls"];
	}

}





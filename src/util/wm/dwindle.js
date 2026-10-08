/*
 * Dwindle layout, the way hyprland does it.
 *
 * The layout of a workspace is a binary tree. A leaf holds a window id, a
 * split holds two children and the ratio between them. Opening a window
 * replaces the focused leaf with a split that contains the old window and the
 * new one, and the split runs along the longer axis of the space the focused
 * window occupied. That is the whole algorithm.
 *
 * Everything in here is pure: a tree goes in, a new tree or a list of
 * rectangles comes out. Nothing touches the dom or the store.
 */

export const ROW = 'row'; // children sit next to each other
export const COL = 'col'; // children sit on top of each other

export function leaf(id) {
	return { id };
}

export function isLeaf(node) {
	return !!node && node.id !== undefined;
}

export function clone(node) {
	if (!node) return null;
	if (isLeaf(node)) return { id: node.id };
	return { dir: node.dir, ratio: node.ratio, a: clone(node.a), b: clone(node.b) };
}

export function ids(node) {
	if (!node) return [];
	if (isLeaf(node)) return [node.id];
	return ids(node.a).concat(ids(node.b));
}

export function contains(node, id) {
	return ids(node).indexOf(id) !== -1;
}

/* The path to a node as a list of 'a' / 'b' steps from the root. */
export function pathTo(node, id, path = []) {
	if (!node) return null;
	if (isLeaf(node)) return node.id === id ? path : null;
	return (
		pathTo(node.a, id, path.concat('a')) || pathTo(node.b, id, path.concat('b'))
	);
}

export function nodeAt(node, path) {
	return path.reduce((current, step) => (current ? current[step] : null), node);
}

/*
 * Insert next to the focused window. Without a focus (or with a focus that is
 * not in this tree) the new window is appended next to the last one, which is
 * what hyprland does when a window opens on an inactive workspace.
 */
export function insert(tree, id, focusId, rects) {
	if (!tree) {
		return leaf(id);
	}
	const existing = ids(tree);
	const target =
		focusId && existing.indexOf(focusId) !== -1
			? focusId
			: existing[existing.length - 1];
	const path = pathTo(tree, target);
	if (!path) {
		return tree;
	}

	const rect = (rects || {})[target];
	// split along the longer axis, exactly like dwindle does
	const dir = !rect || rect.width >= rect.height ? ROW : COL;
	const next = clone(tree);
	const split = { dir, ratio: 0.5, a: leaf(target), b: leaf(id) };

	if (path.length === 0) {
		return split;
	}
	const parent = nodeAt(next, path.slice(0, -1));
	parent[path[path.length - 1]] = split;
	return next;
}

/* Removing a leaf replaces its parent split with the surviving sibling. */
export function remove(tree, id) {
	if (!tree) return null;
	if (isLeaf(tree)) {
		return tree.id === id ? null : tree;
	}
	const path = pathTo(tree, id);
	if (!path) return tree;

	const next = clone(tree);
	const parentPath = path.slice(0, -1);
	const siblingKey = path[path.length - 1] === 'a' ? 'b' : 'a';
	const parent = nodeAt(next, parentPath);
	const sibling = parent[siblingKey];

	if (parentPath.length === 0) {
		return sibling;
	}
	const grandParent = nodeAt(next, parentPath.slice(0, -1));
	grandParent[parentPath[parentPath.length - 1]] = sibling;
	return next;
}

export function swap(tree, first, second) {
	if (first === second) return tree;
	const pathA = pathTo(tree, first);
	const pathB = pathTo(tree, second);
	if (!pathA || !pathB) return tree;

	const next = clone(tree);
	const setId = (path, id) => {
		if (path.length === 0) {
			next.id = id;
			return;
		}
		nodeAt(next, path.slice(0, -1))[path[path.length - 1]] = leaf(id);
	};
	setId(pathA, second);
	setId(pathB, first);
	return next;
}

/*
 * Turn the tree into rectangles. Also returns the gutters, the gaps between
 * two children of a split, so they can be rendered as resize handles.
 */
export function layout(tree, rect, gap) {
	const tiles = [];
	const gutters = [];

	const walk = (node, area, path) => {
		if (!node) return;
		if (isLeaf(node)) {
			tiles.push({ id: node.id, ...area });
			return;
		}
		const ratio = Math.min(0.9, Math.max(0.1, node.ratio));
		if (node.dir === ROW) {
			const usable = Math.max(0, area.width - gap);
			const widthA = usable * ratio;
			walk(node.a, { ...area, width: widthA }, path.concat('a'));
			walk(
				node.b,
				{ ...area, left: area.left + widthA + gap, width: usable - widthA },
				path.concat('b')
			);
			gutters.push({
				path,
				dir: ROW,
				area,
				usable,
				left: area.left + widthA,
				top: area.top,
				width: gap,
				height: area.height,
			});
		} else {
			const usable = Math.max(0, area.height - gap);
			const heightA = usable * ratio;
			walk(node.a, { ...area, height: heightA }, path.concat('a'));
			walk(
				node.b,
				{ ...area, top: area.top + heightA + gap, height: usable - heightA },
				path.concat('b')
			);
			gutters.push({
				path,
				dir: COL,
				area,
				usable,
				left: area.left,
				top: area.top + heightA,
				width: area.width,
				height: gap,
			});
		}
	};

	walk(tree, rect, []);
	return { tiles, gutters };
}

export function setRatio(tree, path, ratio) {
	const next = clone(tree);
	const node = nodeAt(next, path);
	if (node && !isLeaf(node)) {
		node.ratio = Math.min(0.9, Math.max(0.1, ratio));
	}
	return next;
}

/*
 * Grow or shrink the focused window towards a direction by walking up to the
 * first ancestor that splits along that axis.
 */
export function resize(tree, id, direction, amount) {
	const path = pathTo(tree, id);
	if (!path) return tree;
	const wanted = direction === 'left' || direction === 'right' ? ROW : COL;

	for (let depth = path.length - 1; depth >= 0; depth--) {
		const parentPath = path.slice(0, depth);
		const node = nodeAt(tree, parentPath);
		if (node && !isLeaf(node) && node.dir === wanted) {
			const onFirstChild = path[depth] === 'a';
			const grows = direction === 'right' || direction === 'down';
			// growing the second child means shrinking the ratio
			const delta = onFirstChild === grows ? amount : -amount;
			return setRatio(tree, parentPath, node.ratio + delta);
		}
	}
	return tree;
}

/*
 * The window next to `id` in a direction: among the tiles that lie on that
 * side and overlap on the other axis, the closest one wins.
 */
export function neighbour(tiles, id, direction) {
	const from = tiles.find((t) => t.id === id);
	if (!from) return null;

	const horizontal = direction === 'left' || direction === 'right';
	const candidates = tiles.filter((tile) => {
		if (tile.id === id) return false;
		if (horizontal) {
			const after = tile.left >= from.left + from.width - 1;
			const before = tile.left + tile.width <= from.left + 1;
			const overlaps =
				tile.top < from.top + from.height && tile.top + tile.height > from.top;
			return overlaps && (direction === 'right' ? after : before);
		}
		const below = tile.top >= from.top + from.height - 1;
		const above = tile.top + tile.height <= from.top + 1;
		const overlaps =
			tile.left < from.left + from.width && tile.left + tile.width > from.left;
		return overlaps && (direction === 'down' ? below : above);
	});

	if (candidates.length === 0) return null;
	const distance = (tile) =>
		horizontal
			? Math.abs(tile.left - from.left) + Math.abs(tile.top - from.top) * 0.1
			: Math.abs(tile.top - from.top) + Math.abs(tile.left - from.left) * 0.1;
	return candidates.sort((x, y) => distance(x) - distance(y))[0].id;
}

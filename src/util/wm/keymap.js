/*
 * Keybindings, grouped the way they are shown in the cheat sheet.
 *
 * The modifier is 'alt' by default and not the super key: browsers keep
 * cmd/ctrl + digit and most cmd/ctrl + letter combinations for themselves and
 * a page cannot prevent them, while alt + anything reliably reaches us.
 */

export const MODIFIERS = {
	alt: { label: 'alt', match: (e) => e.altKey, other: ['ctrlKey', 'metaKey'] },
	ctrl: { label: 'ctrl', match: (e) => e.ctrlKey, other: ['altKey', 'metaKey'] },
	meta: { label: 'super', match: (e) => e.metaKey, other: ['altKey', 'ctrlKey'] },
};

export const BINDINGS = [
	{
		group: 'windows',
		items: [
			{ keys: ['return'], action: 'spawn:terminal', label: 'new terminal' },
			{ keys: ['e'], action: 'spawn:filemanager', label: 'new file manager' },
			{ keys: ['w'], action: 'spawn:weather', label: 'new weather' },
			{ keys: ['t'], action: 'spawn:todo', label: 'new todo list' },
			{ keys: ['q'], action: 'close', label: 'close window' },
			{ keys: ['f'], action: 'fullscreen', label: 'toggle fullscreen' },
			{ keys: ['v'], action: 'float', label: 'toggle floating' },
			{ keys: ['tab'], action: 'cycle', label: 'cycle focus' },
		],
	},
	{
		group: 'focus',
		items: [
			{ keys: ['h', '←'], action: 'focus:left', label: 'focus left' },
			{ keys: ['j', '↓'], action: 'focus:down', label: 'focus down' },
			{ keys: ['k', '↑'], action: 'focus:up', label: 'focus up' },
			{ keys: ['l', '→'], action: 'focus:right', label: 'focus right' },
		],
	},
	{
		group: 'move',
		modifier: 'shift',
		items: [
			{ keys: ['h', '←'], action: 'move:left', label: 'swap left' },
			{ keys: ['j', '↓'], action: 'move:down', label: 'swap down' },
			{ keys: ['k', '↑'], action: 'move:up', label: 'swap up' },
			{ keys: ['l', '→'], action: 'move:right', label: 'swap right' },
			{ keys: ['1 … 9'], action: 'send', label: 'send to workspace' },
		],
	},
	{
		group: 'resize',
		modifier: 'ctrl',
		items: [
			{ keys: ['h', '←'], action: 'resize:left', label: 'shrink' },
			{ keys: ['l', '→'], action: 'resize:right', label: 'grow' },
			{ keys: ['k', '↑'], action: 'resize:up', label: 'shrink vertically' },
			{ keys: ['j', '↓'], action: 'resize:down', label: 'grow vertically' },
		],
	},
	{
		group: 'workspaces',
		items: [
			{ keys: ['1 … 9'], action: 'workspace', label: 'switch workspace' },
			{ keys: ['s'], action: 'settings', label: 'toggle settings' },
			{ keys: ['/'], action: 'cheatsheet', label: 'this cheat sheet' },
		],
	},
];

const ARROWS = {
	ArrowLeft: 'left',
	ArrowDown: 'down',
	ArrowUp: 'up',
	ArrowRight: 'right',
};
const VIM = { h: 'left', j: 'down', k: 'up', l: 'right' };

/*
 * Map a keyboard event to an action string, or null when the event is not one
 * of ours. Everything that is not the configured modifier is left alone so
 * typing in the terminal keeps working.
 */
export function resolve(event, modifierName) {
	const modifier = MODIFIERS[modifierName] || MODIFIERS.alt;
	if (!modifier.match(event)) {
		return null;
	}
	// a second non-shift modifier that is not part of a binding means the
	// combination belongs to the browser or the operating system
	if (modifierName !== 'ctrl' && event.ctrlKey && !event.altKey) {
		return null;
	}

	const key = event.key;
	const direction = ARROWS[key] || VIM[key && key.toLowerCase()];

	if (direction) {
		if (event.ctrlKey && modifierName !== 'ctrl') return `resize:${direction}`;
		if (event.shiftKey) return `move:${direction}`;
		return `focus:${direction}`;
	}

	if (/^[1-9]$/.test(key)) {
		return event.shiftKey ? `send:${key}` : `workspace:${key}`;
	}
	// shift+digit produces punctuation on many layouts, use the physical key
	if (event.code && /^Digit[1-9]$/.test(event.code) && event.shiftKey) {
		return `send:${event.code.slice(5)}`;
	}

	switch (key && key.toLowerCase()) {
		case 'enter':
			return 'spawn:terminal';
		case 'e':
			return 'spawn:filemanager';
		case 'w':
			return 'spawn:weather';
		case 't':
			return 'spawn:todo';
		case 'q':
			return 'close';
		case 'f':
			return 'fullscreen';
		case 'v':
			return 'float';
		case 'tab':
			return 'cycle';
		case 's':
			return 'settings';
		case '/':
		case '?':
			return 'cheatsheet';
		default:
			return null;
	}
}

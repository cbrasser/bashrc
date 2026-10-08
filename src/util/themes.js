/*
 * Colour presets. Every theme defines the same set of roles, the window
 * manager and the applications only ever refer to those roles.
 */
export const THEMES = {
	'catppuccin-mocha': {
		name: 'catppuccin mocha',
		colors: {
			bg: '#1e1e2e',
			bg_alt: '#181825',
			fg: '#cdd6f4',
			muted: '#7f849c',
			accent_1: '#89b4fa',
			accent_2: '#f38ba8',
			accent_3: '#f9e2af',
			green: '#a6e3a1',
			cyan: '#94e2d5',
			orange: '#fab387',
			pink: '#cba6f7',
			red: '#f38ba8',
			yellow: '#f9e2af',
			blue: '#89b4fa',
		},
		wallpaper: 'linear-gradient(135deg, #1e1e2e 0%, #302d41 45%, #45395a 100%)',
	},
	'tokyo-night': {
		name: 'tokyo night',
		colors: {
			bg: '#1a1b26',
			bg_alt: '#16161e',
			fg: '#c0caf5',
			muted: '#565f89',
			accent_1: '#7aa2f7',
			accent_2: '#bb9af7',
			accent_3: '#e0af68',
			green: '#9ece6a',
			cyan: '#7dcfff',
			orange: '#ff9e64',
			pink: '#bb9af7',
			red: '#f7768e',
			yellow: '#e0af68',
			blue: '#7aa2f7',
		},
		wallpaper: 'linear-gradient(135deg, #1a1b26 0%, #24283b 50%, #414868 100%)',
	},
	nord: {
		name: 'nord',
		colors: {
			bg: '#2e3440',
			bg_alt: '#272c36',
			fg: '#d8dee9',
			muted: '#6b7280',
			accent_1: '#88c0d0',
			accent_2: '#bf616a',
			accent_3: '#ebcb8b',
			green: '#a3be8c',
			cyan: '#8fbcbb',
			orange: '#d08770',
			pink: '#b48ead',
			red: '#bf616a',
			yellow: '#ebcb8b',
			blue: '#81a1c1',
		},
		wallpaper: 'linear-gradient(135deg, #2e3440 0%, #3b4252 50%, #4c566a 100%)',
	},
	'gruvbox-dark': {
		name: 'gruvbox dark',
		colors: {
			bg: '#282828',
			bg_alt: '#1d2021',
			fg: '#ebdbb2',
			muted: '#928374',
			accent_1: '#83a598',
			accent_2: '#fb4934',
			accent_3: '#fabd2f',
			green: '#b8bb26',
			cyan: '#8ec07c',
			orange: '#fe8019',
			pink: '#d3869b',
			red: '#fb4934',
			yellow: '#fabd2f',
			blue: '#83a598',
		},
		wallpaper: 'linear-gradient(135deg, #282828 0%, #3c3836 50%, #504945 100%)',
	},
	'rose-pine': {
		name: 'rosé pine',
		colors: {
			bg: '#191724',
			bg_alt: '#1f1d2e',
			fg: '#e0def4',
			muted: '#6e6a86',
			accent_1: '#9ccfd8',
			accent_2: '#eb6f92',
			accent_3: '#f6c177',
			green: '#31748f',
			cyan: '#9ccfd8',
			orange: '#f6c177',
			pink: '#c4a7e7',
			red: '#eb6f92',
			yellow: '#f6c177',
			blue: '#31748f',
		},
		wallpaper: 'linear-gradient(135deg, #191724 0%, #26233a 50%, #403d52 100%)',
	},
	everforest: {
		name: 'everforest',
		colors: {
			bg: '#2d353b',
			bg_alt: '#232a2e',
			fg: '#d3c6aa',
			muted: '#859289',
			accent_1: '#a7c080',
			accent_2: '#e67e80',
			accent_3: '#dbbc7f',
			green: '#a7c080',
			cyan: '#83c092',
			orange: '#e69875',
			pink: '#d699b6',
			red: '#e67e80',
			yellow: '#dbbc7f',
			blue: '#7fbbb3',
		},
		wallpaper: 'linear-gradient(135deg, #2d353b 0%, #343f44 50%, #475258 100%)',
	},
};

export const DEFAULT_THEME = 'catppuccin-mocha';

export function themeColors(name, overrides) {
	const theme = THEMES[name] || THEMES[DEFAULT_THEME];
	return { ...theme.colors, ...(overrides || {}) };
}

export function themeWallpaper(name) {
	return (THEMES[name] || THEMES[DEFAULT_THEME]).wallpaper;
}

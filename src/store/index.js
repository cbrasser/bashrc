import Vue from 'vue'
import Vuex from 'vuex'
import { FileSystem } from '../util/filesystem/filesystem'
import * as dwindle from '../util/wm/dwindle'
import { DEFAULT_THEME, themeColors, themeWallpaper } from '../util/themes'

Vue.use(Vuex);

export const WORKSPACES = 9;
export const APPS = ['terminal', 'filemanager', 'weather', 'todo'];

export const getDefaultConfig = () => ({
    theme: DEFAULT_THEME,
    colorOverrides: {},
    city: 'Zurich',
    backgroundImage: '',
    modifier: 'alt',
    showBar: true,
    animations: true,
    blur: true,
    opacity: 0.82,
    rounding: 14,
    borderWidth: 2,
    gapInner: 10,
    gapOuter: 14,
});

/* One terminal and one file manager on the first workspace, side by side. */
export const getDefaultWm = () => ({
    windows: [
        { id: 'terminal-1', app: 'terminal', workspace: 1, floating: false, position: { left: 80, top: 80 }, dimensions: { width: 540, height: 360 } },
        { id: 'filemanager-1', app: 'filemanager', workspace: 1, floating: false, position: { left: 160, top: 160 }, dimensions: { width: 420, height: 320 } },
    ],
    trees: { 1: { dir: dwindle.ROW, ratio: 0.55, a: { id: 'terminal-1' }, b: { id: 'filemanager-1' } } },
    activeWorkspace: 1,
    focused: 'terminal-1',
    fullscreen: null,
    counter: 2,
});

const persist = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`could not write ${key} to local storage`, e);
    }
};

const read = (key) => {
    try {
        return JSON.parse(window.localStorage.getItem(key));
    } catch (e) {
        console.warn(`invalid ${key} in local storage, using defaults`);
        return null;
    }
};

const mergeConfig = (stored) => {
    const defaults = getDefaultConfig();
    if (!stored || typeof stored !== 'object') return defaults;
    const config = { ...defaults, ...stored };
    config.colorOverrides = { ...(stored.colorOverrides || {}) };
    // a v2 config carried a full colour map, keep it as an override set
    if (stored.colors && !stored.theme) {
        config.colorOverrides = { ...stored.colors };
    }
    return config;
};

/*
 * A layout written by version 2 stored a list of apps with absolute positions
 * and no workspaces. Turn those into floating windows on workspace one so an
 * existing setup is not thrown away.
 */
const migrateWindows = (storedConfig) => {
    const apps = storedConfig && Array.isArray(storedConfig.apps) ? storedConfig.apps : null;
    if (!apps) return null;

    const visible = apps.filter((app) => app && app.visible && APPS.indexOf(app.name) !== -1);
    if (visible.length === 0) return getDefaultWm();

    const windows = visible.map((app, index) => ({
        id: `${app.name}-${index + 1}`,
        app: app.name,
        workspace: 1,
        floating: storedConfig.windowState === 'floating',
        position: { ...(app.position || { left: 80, top: 80 }) },
        dimensions: { ...(app.dimensions || { width: 480, height: 320 }) },
    }));

    let tree = null;
    windows.forEach((window) => {
        tree = dwindle.insert(tree, window.id, null, {});
    });

    return {
        windows,
        trees: { 1: tree },
        activeWorkspace: 1,
        focused: windows[0].id,
        fullscreen: null,
        counter: windows.length + 1,
    };
};

const mergeWm = (stored, storedConfig) => {
    if (!stored || !Array.isArray(stored.windows)) {
        return migrateWindows(storedConfig) || getDefaultWm();
    }
    const windows = stored.windows.filter((w) => w && APPS.indexOf(w.app) !== -1);
    if (windows.length === 0) {
        return { ...getDefaultWm(), ...{ activeWorkspace: stored.activeWorkspace || 1 } };
    }
    const known = windows.map((w) => w.id);
    const trees = {};
    // drop ids from the stored trees that no longer have a window
    Object.keys(stored.trees || {}).forEach((workspace) => {
        let tree = stored.trees[workspace];
        dwindle.ids(tree)
            .filter((id) => known.indexOf(id) === -1)
            .forEach((id) => { tree = dwindle.remove(tree, id); });
        if (tree) trees[workspace] = tree;
    });
    // and add windows that are missing from their workspace tree
    windows.filter((w) => !w.floating).forEach((w) => {
        if (!dwindle.contains(trees[w.workspace], w.id)) {
            trees[w.workspace] = dwindle.insert(trees[w.workspace] || null, w.id, null, {});
        }
    });

    return {
        windows,
        trees,
        activeWorkspace: stored.activeWorkspace || 1,
        focused: known.indexOf(stored.focused) !== -1 ? stored.focused : known[0],
        fullscreen: known.indexOf(stored.fullscreen) !== -1 ? stored.fullscreen : null,
        counter: stored.counter || windows.length + 1,
    };
};

const saveWm = (wm) => persist('wm', {
    windows: wm.windows,
    trees: wm.trees,
    activeWorkspace: wm.activeWorkspace,
    focused: wm.focused,
    fullscreen: wm.fullscreen,
    counter: wm.counter,
});

const store = new Vuex.Store({
    state: {
        fileTree: undefined,
        workingDirectory: undefined,
        config: getDefaultConfig(),
        wm: getDefaultWm(),
    },

    getters: {
        colors: (state) => themeColors(state.config.theme, state.config.colorOverrides),
        wallpaper: (state) => state.config.backgroundImage
            ? `url(${state.config.backgroundImage})`
            : themeWallpaper(state.config.theme),
        activeWindows: (state) => state.wm.windows.filter(
            (w) => w.workspace === state.wm.activeWorkspace
        ),
        tiledTree: (state) => state.wm.trees[state.wm.activeWorkspace] || null,
        focusedWindow: (state) => state.wm.windows.find((w) => w.id === state.wm.focused) || null,
        occupiedWorkspaces: (state) => {
            const occupied = {};
            state.wm.windows.forEach((w) => { occupied[w.workspace] = true; });
            return occupied;
        },
    },

    mutations: {
        CONFIGURATION(state, payload) {
            state.config = { ...state.config, ...payload };
            persist('config', state.config);
        },
        WM(state, payload) {
            state.wm = { ...state.wm, ...payload };
            saveWm(state.wm);
        },
        FILE_TREE(state, payload) {
            state.fileTree = payload;
            persist('root', payload.getRoot().toJSON());
        },
        WORKING_DIRECTORY(state, payload) {
            state.workingDirectory = payload;
        },
    },

    actions: {
        loadConfig({ commit }) {
            const storedConfig = read('config');
            commit('CONFIGURATION', mergeConfig(storedConfig));
            commit('WM', mergeWm(read('wm'), storedConfig));
        },
        loadFileTree({ commit }) {
            let tree;
            try {
                tree = new FileSystem(read('root'));
            } catch (e) {
                console.error('could not restore the file tree, starting empty', e);
                tree = new FileSystem();
            }
            commit('FILE_TREE', tree);
            commit('WORKING_DIRECTORY', tree.getRoot());
        },
        updateConfig({ commit }, config) {
            commit('CONFIGURATION', config);
        },
        resetConfig({ commit }) {
            commit('CONFIGURATION', getDefaultConfig());
        },
        resetLayout({ commit }) {
            commit('WM', getDefaultWm());
        },
        updateFileTree({ commit }, fileTree) {
            commit('FILE_TREE', fileTree);
        },
        updateWorkingDirectory({ commit }, wd) {
            commit('WORKING_DIRECTORY', wd);
        },

        // ---------------------------- window manager ----------------------------

        spawn({ commit, state }, { app, rects }) {
            if (APPS.indexOf(app) === -1) return;
            const wm = state.wm;
            const id = `${app}-${wm.counter}`;
            const workspace = wm.activeWorkspace;
            const window = {
                id,
                app,
                workspace,
                floating: false,
                position: { left: 120 + (wm.counter % 5) * 30, top: 100 + (wm.counter % 5) * 30 },
                dimensions: { width: 520, height: 340 },
            };
            const focusedHere = wm.windows.some(
                (w) => w.id === wm.focused && w.workspace === workspace && !w.floating
            );
            commit('WM', {
                windows: wm.windows.concat(window),
                trees: {
                    ...wm.trees,
                    [workspace]: dwindle.insert(
                        wm.trees[workspace] || null,
                        id,
                        focusedHere ? wm.focused : null,
                        rects || {}
                    ),
                },
                focused: id,
                fullscreen: null,
                counter: wm.counter + 1,
            });
        },

        close({ commit, state }, id) {
            const wm = state.wm;
            const target = wm.windows.find((w) => w.id === id);
            if (!target) return;
            const trees = { ...wm.trees };
            const pruned = dwindle.remove(trees[target.workspace], id);
            if (pruned) {
                trees[target.workspace] = pruned;
            } else {
                delete trees[target.workspace];
            }
            const remaining = wm.windows.filter((w) => w.id !== id);
            const sameWorkspace = remaining.filter((w) => w.workspace === target.workspace);
            commit('WM', {
                windows: remaining,
                trees,
                focused: sameWorkspace.length ? sameWorkspace[sameWorkspace.length - 1].id : null,
                fullscreen: wm.fullscreen === id ? null : wm.fullscreen,
            });
        },

        focus({ commit, state }, id) {
            if (!id || state.wm.focused === id) return;
            commit('WM', { focused: id });
        },

        setWorkspace({ commit, state }, workspace) {
            const index = Number(workspace);
            if (!index || index < 1 || index > WORKSPACES) return;
            if (index === state.wm.activeWorkspace) return;
            const onWorkspace = state.wm.windows.filter((w) => w.workspace === index);
            commit('WM', {
                activeWorkspace: index,
                focused: onWorkspace.length ? onWorkspace[onWorkspace.length - 1].id : null,
                fullscreen: null,
            });
        },

        sendToWorkspace({ commit, state }, { id, workspace }) {
            const index = Number(workspace);
            const wm = state.wm;
            const target = wm.windows.find((w) => w.id === id);
            if (!target || !index || index < 1 || index > WORKSPACES) return;
            if (target.workspace === index) return;

            const trees = { ...wm.trees };
            const pruned = dwindle.remove(trees[target.workspace], id);
            if (pruned) trees[target.workspace] = pruned;
            else delete trees[target.workspace];
            if (!target.floating) {
                trees[index] = dwindle.insert(trees[index] || null, id, null, {});
            }

            const windows = wm.windows.map(
                (w) => (w.id === id ? { ...w, workspace: index } : w)
            );
            const left = windows.filter((w) => w.workspace === wm.activeWorkspace);
            commit('WM', {
                windows,
                trees,
                focused: left.length ? left[left.length - 1].id : null,
                fullscreen: wm.fullscreen === id ? null : wm.fullscreen,
            });
        },

        swapWindows({ commit, state }, { from, to }) {
            const workspace = state.wm.activeWorkspace;
            commit('WM', {
                trees: {
                    ...state.wm.trees,
                    [workspace]: dwindle.swap(state.wm.trees[workspace], from, to),
                },
            });
        },

        setRatio({ commit, state }, { path, ratio }) {
            const workspace = state.wm.activeWorkspace;
            commit('WM', {
                trees: {
                    ...state.wm.trees,
                    [workspace]: dwindle.setRatio(state.wm.trees[workspace], path, ratio),
                },
            });
        },

        resizeWindow({ commit, state }, { id, direction, amount }) {
            const workspace = state.wm.activeWorkspace;
            commit('WM', {
                trees: {
                    ...state.wm.trees,
                    [workspace]: dwindle.resize(
                        state.wm.trees[workspace], id, direction, amount
                    ),
                },
            });
        },

        toggleFullscreen({ commit, state }, id) {
            commit('WM', { fullscreen: state.wm.fullscreen === id ? null : id, focused: id });
        },

        toggleFloating({ commit, state }, id) {
            const wm = state.wm;
            const target = wm.windows.find((w) => w.id === id);
            if (!target) return;
            const trees = { ...wm.trees };
            const floating = !target.floating;

            if (floating) {
                const pruned = dwindle.remove(trees[target.workspace], id);
                if (pruned) trees[target.workspace] = pruned;
                else delete trees[target.workspace];
            } else {
                trees[target.workspace] = dwindle.insert(
                    trees[target.workspace] || null, id, wm.focused, {}
                );
            }
            commit('WM', {
                windows: wm.windows.map((w) => (w.id === id ? { ...w, floating } : w)),
                trees,
                focused: id,
                fullscreen: null,
            });
        },

        moveFloating({ commit, state }, { id, position, dimensions }) {
            commit('WM', {
                windows: state.wm.windows.map((w) => (w.id === id
                    ? {
                        ...w,
                        position: position || w.position,
                        dimensions: dimensions || w.dimensions,
                    }
                    : w)),
            });
        },
    },
});

export default store;

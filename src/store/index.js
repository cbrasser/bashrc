import Vue from 'vue'
import Vuex from 'vuex'
import { FileSystem } from '../util/filesystem/filesystem'

Vue.use(Vuex);

export const getDefaultConfig = () => {
    return {
        apps: [
            {
                name: 'filemanager',
                position: { top: 20, left: 50 },
                dimensions: { height: 200, width: 300 },
                visible: true,
            },
            {
                name: 'terminal',
                position: { top: 500, left: 100 },
                dimensions: { height: 200, width: 300 },
                visible: true,
            },
            {
                name: 'todo',
                position: { top: 420, left: 900 },
                dimensions: { height: 220, width: 500 },
                visible: false,
            },
            {
                name: 'weather',
                position: { top: 20, left: 900 },
                dimensions: { height: 250, width: 300 },
                visible: false,
            }
        ],
        city: "Zurich",
        windowState: "floating",
        windowBorders: false,
        backgroundImage: "",
        colors: {
            fg: '#d8dee9',
            bg: '#1a1e21',
            accent_1: '#8fbcbb',
            accent_2: '#bf616a',
            accent_3: '#ebcb8b',
        },
        opacity: 1,
        numCols: 1,
    };
}

/* A config stored by an older version can be missing keys that the current
   version relies on, which used to break the whole page. Fill those in from
   the defaults instead. */
const mergeWithDefaults = (stored) => {
    const defaults = getDefaultConfig();
    if (!stored || typeof stored !== 'object') {
        return defaults;
    }
    const config = { ...defaults, ...stored };
    config.colors = { ...defaults.colors, ...(stored.colors || {}) };
    config.apps = defaults.apps.map((defaultApp) => {
        const storedApp = (stored.apps || []).find(a => a && a.name === defaultApp.name);
        if (!storedApp) {
            return defaultApp;
        }
        return {
            ...defaultApp,
            ...storedApp,
            position: { ...defaultApp.position, ...(storedApp.position || {}) },
            dimensions: { ...defaultApp.dimensions, ...(storedApp.dimensions || {}) },
        };
    });
    return config;
}

const persist = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('could not write to local storage', e);
    }
}

const store = new Vuex.Store({
    state: {
        fileTree: undefined,
        workingDirectory: undefined,
        config: getDefaultConfig(),
    },
    mutations: {
        CONFIGURATION(state, payload) {
            state.config = payload;
            persist('config', state.config);
        },
        WINDOW_STATE(state, payload) {
            state.config.windowState = payload;
            persist('config', state.config);
        },
        CITY(state, payload) {
            state.config.city = payload;
            persist('config', state.config);
        },
        FILE_TREE(state, payload) {
            state.fileTree = payload;
            persist('root', payload.getRoot().toJSON());
        },
        WORKING_DIRECTORY(state, payload) {
            state.workingDirectory = payload;
        }
    },
    actions: {
        loadConfig({ commit }) {
            let stored;
            try {
                stored = JSON.parse(window.localStorage.getItem('config'));
            } catch (e) {
                console.warn('invalid config in local storage, loading defaults');
            }
            commit('CONFIGURATION', mergeWithDefaults(stored));
        },
        loadFileTree({ commit }) {
            let json_obj;
            try {
                json_obj = JSON.parse(window.localStorage.getItem('root'));
            } catch (e) {
                console.warn('invalid file tree in local storage, starting empty');
            }
            let tree;
            try {
                tree = new FileSystem(json_obj);
            } catch (e) {
                console.error('could not restore the file tree, starting empty', e);
                tree = new FileSystem();
            }
            commit('FILE_TREE', tree);
            commit('WORKING_DIRECTORY', tree.getRoot());
        },
        resetConfig({ commit }) {
            commit('CONFIGURATION', getDefaultConfig());
        },
        updateConfig({ commit }, config) {
            commit('CONFIGURATION', config);
        },
        updateFileTree({ commit }, fileTree) {
            commit('FILE_TREE', fileTree);
        },
        updateWorkingDirectory({ commit }, wd) {
            commit('WORKING_DIRECTORY', wd);
        },
        setCity({ commit }, city) {
            commit('CITY', city);
        },
        setState({ commit }, windowState) {
            commit('WINDOW_STATE', windowState);
        },
    },
    getters: {},
});

export default store;

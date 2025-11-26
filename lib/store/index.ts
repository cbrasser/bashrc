import { create } from 'zustand';

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
    windowState: "floating" as "floating" | "tiled",
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
};

interface AppState {
  fileTree: any;
  workingDirectory: any;
  config: ReturnType<typeof getDefaultConfig>;
  loadConfig: () => void;
  loadFileTree: () => void;
  updateConfig: (config: ReturnType<typeof getDefaultConfig>) => void;
  updateFileTree: (fileTree: any) => void;
  updateWorkingDirectory: (wd: any) => void;
  setCity: (city: string) => void;
  setState: (windowState: "floating" | "tiled") => void;
}

export const useStore = create<AppState>((set, get) => ({
  fileTree: undefined,
  workingDirectory: undefined,
  config: getDefaultConfig(),
  
  loadConfig: () => {
    if (typeof window === 'undefined') return;
    console.log('loading config');
    let config;
    try {
      const stored = window.localStorage.getItem("config");
      if (stored) {
        config = JSON.parse(stored);
        console.log('loaded config');
      }
    } catch (e) {
      console.log('invalid config, loading default');
    }

    if (!config) {
      config = getDefaultConfig();
    }
    set({ config });
  },
  
  loadFileTree: async () => {
    if (typeof window === 'undefined') return;
    console.log('loading file system');
    try {
      const { FileSystem } = await import('../util/filesystem/filesystem.js');
      const stored = window.localStorage.getItem("root");
      if (stored) {
        const json_obj = JSON.parse(stored);
        const tree = new FileSystem(json_obj);
        set({ 
          fileTree: tree,
          workingDirectory: tree.getRoot()
        });
      }
    } catch (e) {
      console.log('error loading file tree', e);
    }
  },
  
  updateConfig: (config) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem("config", JSON.stringify(config));
    }
    set({ config });
  },
  
  updateFileTree: (fileTree) => {
    if (typeof window !== 'undefined' && fileTree) {
      window.localStorage.setItem("root", JSON.stringify(fileTree.getRoot().toJSON()));
    }
    set({ fileTree });
  },
  
  updateWorkingDirectory: (wd) => {
    set({ workingDirectory: wd });
  },
  
  setCity: (city) => {
    const config = { ...get().config, city };
    get().updateConfig(config);
  },
  
  setState: (windowState) => {
    const config = { ...get().config, windowState };
    get().updateConfig(config);
  },
}));

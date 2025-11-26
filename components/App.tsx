'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import Settings from './settings/Settings';
import SettingsIcon from './settings/SettingsIcon';
import Window from './widgets/Window';
import Terminal from './widgets/Terminal';
import FileManager from './widgets/FileManager';
import Weather from './widgets/Weather';
import Todo from './widgets/Todo';

export default function App() {
  const { config, loadConfig, loadFileTree, updateConfig } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadConfig();
    loadFileTree();
  }, [loadConfig, loadFileTree]);

  const handleDragEnd = (appName: string, event: { top: number; left: number; width: number; height: number }) => {
    const newApps = config.apps.map((app) =>
      app.name === appName
        ? {
            ...app,
            position: { top: event.top, left: event.left },
            dimensions: { height: event.height, width: event.width },
          }
        : app
    );
    updateConfig({ ...config, apps: newApps });
  };

  const buildRGBA = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${opacity})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  const userStyle = {
    '--fg': config.colors.fg,
    '--bg': config.colors.bg,
    '--accent_1': config.colors.accent_1,
    '--accent_2': config.colors.accent_2,
    '--accent_3': config.colors.accent_3,
    '--bg-opaque': buildRGBA(config.colors.bg, config.opacity),
    backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
  } as React.CSSProperties;

  const visibleApps = config.apps.filter((a) => a.visible);

  return (
    <>
      <div
        id="app"
        className="h-[calc(100%-2rem)] w-[calc(100%-2rem)] p-4 relative drawer drawer-end"
        style={userStyle}
      >
        <input
          id="my-drawer-1"
          type="checkbox"
          className="drawer-toggle"
          checked={settingsOpen}
          onChange={(e) => setSettingsOpen(e.target.checked)}
        />
        <div className="drawer-content">
          <SettingsIcon
            open={settingsOpen}
            onClick={() => setSettingsOpen(!settingsOpen)}
            bgColor={config.colors.bg}
            fgColor={config.colors.fg}
          />
            <div
              id="screen"
              className={`h-full w-full ${
                config.windowState === 'tiled' ? 'grid grid-cols-2 gap-4' : ''
              }`}
            >
              {visibleApps.map((app) => (
                <Window
                  key={app.name}
                  id={app.name}
                  name={app.name}
                  position={app.position}
                  dimensions={app.dimensions}
                  draggable={config.windowState === 'floating'}
                  className={config.windowBorders ? 'border' : ''}
                >
                  {app.name === 'terminal' && <Terminal />}
                  {app.name === 'filemanager' && <FileManager />}
                  {app.name === 'weather' && <Weather city={config.city} />}
                  {app.name === 'todo' && <Todo />}
                </Window>
              ))}
          
             </div>
       </div>
      
      
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-1"
          aria-label="close sidebar"
          className="drawer-overlay"
          onClick={() => setSettingsOpen(false)}
        ></label>
        <Settings />
      </div>
      </div>
      
    </>
  );
}


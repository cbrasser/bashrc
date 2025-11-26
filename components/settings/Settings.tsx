'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { config, updateConfig } = useStore();
  const [colorsOpen, setColorsOpen] = useState(false);
  const [windowsOpen, setWindowsOpen] = useState(false);

  const terminalActive = config.apps.find((a) => a.name === 'terminal')?.visible || false;
  const fmActive = config.apps.find((a) => a.name === 'filemanager')?.visible || false;
  const weatherActive = config.apps.find((a) => a.name === 'weather')?.visible || false;
  const todoActive = config.apps.find((a) => a.name === 'todo')?.visible || false;

  const toggleApp = (name: string) => {
    const newApps = config.apps.map((app) =>
      app.name === name ? { ...app, visible: !app.visible } : app
    );
    updateConfig({ ...config, apps: newApps });
  };

  const toggleLayout = () => {
    const newWindowState = config.windowState === 'floating' ? 'tiled' : 'floating';
    updateConfig({ ...config, windowState: newWindowState });
  };

  const toggleBorders = () => {
    updateConfig({ ...config, windowBorders: !config.windowBorders });
  };

  return (
    <div className="w-96 min-h-full bg-base-200 text-base-content p-6 overflow-y-auto m-2">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-base-300">
        <h2 className="text-2xl font-bold mb-1">Settings</h2>
        <p className="text-sm opacity-70">Customize your experience</p>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6">
        {/* Applications Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Applications
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'terminal', icon: 'fa-terminal', label: 'Terminal', active: terminalActive },
              { name: 'filemanager', icon: 'far fa-hdd', label: 'Files', active: fmActive },
              { name: 'weather', icon: 'fa-cloud-sun', label: 'Weather', active: weatherActive },
              { name: 'todo', icon: 'fa-clipboard-list', label: 'Todo', active: todoActive },
            ].map((app) => (
              <div
                key={app.name}
                className={`card card-compact cursor-pointer transition-all hover:shadow-md ${
                  app.active ? 'ring-2 ring-primary bg-primary/20' : 'bg-base-100'
                }`}
                onClick={() => toggleApp(app.name)}
              >
                <div className="card-body items-center text-center p-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                      app.active ? 'bg-primary/30 text-primary' : 'bg-base-200 text-base-content/70'
                    }`}
                  >
                    <i className={`fas ${app.icon} text-xl`}></i>
                  </div>
                  <h4 className={`card-title text-sm justify-center ${app.active ? 'text-primary' : ''}`}>
                    {app.label}
                  </h4>
                  {app.active && (
                    <div className="badge badge-sm badge-primary">Active</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Layout
          </h3>
          <div className="card bg-base-100 shadow">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                    <i className="fas fa-th text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold">Tile Layout</h4>
                    <p className="text-xs opacity-70">
                      {config.windowState === 'tiled' ? 'Windows are tiled' : 'Windows are floating'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={config.windowState === 'tiled'}
                  onChange={toggleLayout}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weather Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Weather
          </h3>
          <div className="card bg-base-100 shadow">
            <div className="card-body p-5">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-secondary"></i>
                    City
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter city name"
                  className="input input-bordered w-full"
                  value={config.city}
                  onChange={(e) => updateConfig({ ...config, city: e.target.value })}
                />
                <label className="label">
                  <span className="label-text-alt opacity-70">Location for weather data</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Appearance
          </h3>
          <div className="card bg-base-100 shadow">
            <div className="card-body p-5">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <i className="fas fa-image text-accent"></i>
                    Background Image
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered w-full"
                  value={config.backgroundImage}
                  onChange={(e) => updateConfig({ ...config, backgroundImage: e.target.value })}
                />
                <label className="label">
                  <span className="label-text-alt opacity-70">URL for background image</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Theme
          </h3>
          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input
              type="checkbox"
              checked={colorsOpen}
              onChange={(e) => setColorsOpen(e.target.checked)}
            />
            <div className="collapse-title font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                <i className="fas fa-palette text-sm"></i>
              </div>
              <div className="text-left">
                <div>Color Customization</div>
                <div className="text-xs font-normal opacity-70">Customize theme colors</div>
              </div>
            </div>
            <div className="collapse-content">
              <div className="space-y-4 pt-2">
                {[
                  { key: 'fg', label: 'Text Color', placeholder: '#d8dee9', icon: 'fa-font' },
                  { key: 'bg', label: 'Background', placeholder: '#1a1e21', icon: 'fa-square' },
                  { key: 'accent_1', label: 'Accent 1', placeholder: '#8fbcbb', icon: 'fa-circle' },
                  { key: 'accent_2', label: 'Accent 2', placeholder: '#bf616a', icon: 'fa-circle' },
                  { key: 'accent_3', label: 'Accent 3', placeholder: '#ebcb8b', icon: 'fa-circle' },
                ].map((color) => (
                  <div key={color.key} className="space-y-2">
                    <label className="label">
                      <span className="label-text text-xs font-semibold uppercase tracking-wider flex items-center gap-2 opacity-70">
                        <i className={`fas ${color.icon} text-xs`}></i>
                        {color.label}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-xl border-2 border-base-300 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: config.colors[color.key as keyof typeof config.colors],
                        }}
                        onClick={() => {
                          const input = document.getElementById(`color-${color.key}`) as HTMLInputElement;
                          input?.click();
                        }}
                      />
                      <input
                        id={`color-${color.key}`}
                        type="color"
                        value={config.colors[color.key as keyof typeof config.colors]}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            colors: { ...config.colors, [color.key]: e.target.value },
                          })
                        }
                        className="hidden"
                      />
                      <input
                        type="text"
                        placeholder={color.placeholder}
                        className="input input-bordered flex-1 font-mono text-sm"
                        value={config.colors[color.key as keyof typeof config.colors]}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            colors: { ...config.colors, [color.key]: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Windows Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 px-2">
            Windows
          </h3>
          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input
              type="checkbox"
              checked={windowsOpen}
              onChange={(e) => setWindowsOpen(e.target.checked)}
            />
            <div className="collapse-title font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/20 text-secondary">
                <i className="fas fa-window-maximize text-sm"></i>
              </div>
              <div className="text-left">
                <div>Window Settings</div>
                <div className="text-xs font-normal opacity-70">Appearance and behavior</div>
              </div>
            </div>
            <div className="collapse-content">
              <div className="space-y-4 pt-2">
                {/* Borders Toggle */}
                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                          <i className="fas fa-border-style text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Window Borders</h4>
                          <p className="text-xs opacity-70">
                            {config.windowBorders ? 'Borders visible' : 'Borders hidden'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={config.windowBorders}
                        onChange={toggleBorders}
                      />
                    </div>
                  </div>
                </div>

                {/* Opacity Input */}
                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold flex items-center gap-2">
                          <i className="fas fa-adjust text-accent"></i>
                          Opacity
                        </span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={config.opacity}
                          onChange={(e) => updateConfig({ ...config, opacity: parseFloat(e.target.value) })}
                          className="range range-primary flex-1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={config.opacity}
                          onChange={(e) => updateConfig({ ...config, opacity: parseFloat(e.target.value) || 1 })}
                          className="input input-bordered w-20 font-mono text-sm"
                        />
                      </div>
                      <label className="label">
                        <span className="label-text-alt opacity-70">
                          Window transparency ({Math.round(config.opacity * 100)}%)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

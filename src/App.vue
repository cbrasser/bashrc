<template>
  <div id="app" :style="rootStyle">
    <wm-bar
      v-if="config.showBar"
      :workspaceCount="workspaceCount"
      :activeWorkspace="wm.activeWorkspace"
      :occupied="occupiedWorkspaces"
      :focusedApp="focusedWindow ? focusedWindow.app : ''"
      :floating="!!(focusedWindow && focusedWindow.floating)"
      :fullscreen="!!wm.fullscreen"
      :settingsOpen="settingsOpen"
      v-on:workspace="setWorkspace"
      v-on:settings="settingsOpen = !settingsOpen"
      v-on:cheatsheet="cheatsheetOpen = true"
    />

    <main id="screen" ref="screen">
      <div class="empty-hint" v-if="activeWindows.length === 0">
        <wm-icon name="layers" :size="26" />
        <p>workspace {{ wm.activeWorkspace }} is empty</p>
        <p class="empty-keys">
          <kbd>{{ modifierLabel }}</kbd> + <kbd>return</kbd> terminal ·
          <kbd>{{ modifierLabel }}</kbd> + <kbd>e</kbd> files ·
          <kbd>{{ modifierLabel }}</kbd> + <kbd>/</kbd> all keys
        </p>
      </div>

      <div
        v-for="gutter in gutters"
        :key="'gutter-' + gutter.path.join('')"
        class="gutter"
        :class="gutter.dir"
        :style="{
          left: gutter.left + 'px',
          top: gutter.top + 'px',
          width: gutter.width + 'px',
          height: gutter.height + 'px',
        }"
        v-on:mousedown.prevent="startGutterDrag(gutter, $event)"
      ></div>

      <window-frame
        v-for="item in placedWindows"
        :key="item.window.id"
        :window="item.window"
        :rect="item.rect"
        :focused="item.window.id === wm.focused"
        :animated="config.animations && !dragging"
        :data-window-id="item.window.id"
        v-on:focus="focusWindow(item.window.id)"
        v-on:close="closeWindow(item.window.id)"
        v-on:float="toggleFloating(item.window.id)"
        v-on:fullscreen="toggleFullscreen(item.window.id)"
        v-on:drag-start="startWindowDrag(item, $event)"
        v-on:resize-start="startWindowResize(item, $event)"
      >
        <terminal v-if="item.window.app === 'terminal'" />
        <filemanager v-else-if="item.window.app === 'filemanager'" />
        <weather v-else-if="item.window.app === 'weather'" :city="config.city" />
        <todo v-else-if="item.window.app === 'todo'" />
      </window-frame>
    </main>

    <settings
      :open="settingsOpen"
      v-on:close="settingsOpen = false"
      v-on:spawn="spawn"
      v-on:cheatsheet="cheatsheetOpen = true"
    />

    <cheatsheet
      :open="cheatsheetOpen"
      :modifier="config.modifier"
      v-on:close="cheatsheetOpen = false"
    />
  </div>
</template>

<script>
import * as dwindle from "./util/wm/dwindle";
import { resolve, MODIFIERS } from "./util/wm/keymap";
import { WORKSPACES } from "./store";

import terminal from "./components/terminal/terminal";
import filemanager from "./components/filemanager/filemanager";
import weather from "./components/widgets/weather";
import todo from "./components/widgets/todo";
import settings from "./components/settings/settings";
import wmBar from "./components/wm/bar";
import windowFrame from "./components/wm/window-frame";
import cheatsheet from "./components/wm/cheatsheet";
import wmIcon from "./components/wm/icon";

const MIN_FLOATING = { width: 260, height: 160 };

export default {
  name: "app",
  components: {
    terminal,
    filemanager,
    weather,
    todo,
    settings,
    wmBar,
    windowFrame,
    cheatsheet,
    wmIcon,
  },
  data() {
    return {
      settingsOpen: false,
      cheatsheetOpen: false,
      screen: { width: 0, height: 0 },
      dragging: null,
      observer: null,
    };
  },

  created: async function () {
    await this.$store.dispatch("loadConfig");
    await this.$store.dispatch("loadFileTree");
  },

  mounted() {
    this.measure();
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(this.$refs.screen);
    }
    window.addEventListener("resize", this.measure);
    window.addEventListener("keydown", this.onKey, true);
    // a tab that starts in the background reports no size at all
    document.addEventListener("visibilitychange", this.measure);
    this.$nextTick(this.focusActiveWindow);
  },

  beforeDestroy() {
    if (this.observer) this.observer.disconnect();
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("keydown", this.onKey, true);
    document.removeEventListener("visibilitychange", this.measure);
    this.endDrag();
  },

  computed: {
    config() {
      return this.$store.state.config;
    },
    wm() {
      return this.$store.state.wm;
    },
    workspaceCount() {
      return WORKSPACES;
    },
    activeWindows() {
      return this.$store.getters.activeWindows;
    },
    occupiedWorkspaces() {
      return this.$store.getters.occupiedWorkspaces;
    },
    focusedWindow() {
      return this.$store.getters.focusedWindow;
    },
    modifierLabel() {
      return (MODIFIERS[this.config.modifier] || MODIFIERS.alt).label;
    },

    /* The dwindle tiles for the active workspace. */
    tiling() {
      const tree = this.$store.getters.tiledTree;
      if (!tree || !this.screen.width) return { tiles: [], gutters: [] };
      const gap = this.config.gapInner;
      return dwindle.layout(
        tree,
        { left: 0, top: 0, width: this.screen.width, height: this.screen.height },
        gap
      );
    },
    tileRects() {
      const rects = {};
      this.tiling.tiles.forEach((tile) => {
        rects[tile.id] = tile;
      });
      return rects;
    },
    gutters() {
      if (this.wm.fullscreen) return [];
      return this.tiling.gutters;
    },

    /* Every window on this workspace together with the rectangle it occupies. */
    placedWindows() {
      const fullscreen = this.wm.fullscreen;
      return this.activeWindows
        .map((window) => {
          if (fullscreen === window.id) {
            return {
              window,
              rect: {
                left: 0,
                top: 0,
                width: this.screen.width,
                height: this.screen.height,
                zIndex: 40,
              },
            };
          }
          if (window.floating) {
            return {
              window,
              rect: {
                ...window.position,
                ...window.dimensions,
                zIndex: window.id === this.wm.focused ? 30 : 20,
              },
            };
          }
          const tile = this.tileRects[window.id];
          if (!tile) return null;
          return {
            window,
            rect: { ...tile, zIndex: window.id === this.wm.focused ? 11 : 10 },
          };
        })
        .filter((item) => item && (!fullscreen || item.window.id === fullscreen));
    },

    rootStyle() {
      const colors = this.$store.getters.colors;
      const style = {
        "--fg": colors.fg,
        "--bg": colors.bg,
        "--muted": colors.muted,
        "--accent_1": colors.accent_1,
        "--accent_2": colors.accent_2,
        "--accent_3": colors.accent_3,
        "--green": colors.green,
        "--cyan": colors.cyan,
        "--orange": colors.orange,
        "--pink": colors.pink,
        "--red": colors.red,
        "--yellow": colors.yellow,
        "--blue": colors.blue,
        "--bg-solid": colors.bg,
        "--bg-translucent": this.rgba(colors.bg, this.config.opacity),
        "--surface": this.rgba(colors.fg, 0.08),
        "--line": this.rgba(colors.fg, 0.12),
        "--border-idle": this.rgba(colors.fg, 0.14),
        "--glow": this.rgba(colors.accent_1, 0.55),
        "--rounding": `${this.config.rounding}px`,
        "--border-width": `${this.config.borderWidth}px`,
        "--gap-outer": `${this.config.gapOuter}px`,
        "--window-blur": this.config.blur ? "blur(18px) saturate(140%)" : "none",
        "background-image": this.$store.getters.wallpaper,
      };
      return style;
    },
  },

  watch: {
    "wm.focused": function () {
      this.$nextTick(this.focusActiveWindow);
    },
    "wm.activeWorkspace": function () {
      this.$nextTick(this.focusActiveWindow);
    },
  },

  methods: {
    rgba(hex, alpha) {
      const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
      if (!match) return hex;
      const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16));
      const value = isNaN(parseFloat(alpha)) ? 1 : parseFloat(alpha);
      return `rgba(${r}, ${g}, ${b}, ${value})`;
    },

    measure() {
      const element = this.$refs.screen;
      if (!element) return;
      // a hidden tab reports nothing, keeping the old size avoids a collapse
      if (!element.clientWidth || !element.clientHeight) return;
      this.screen = { width: element.clientWidth, height: element.clientHeight };
      this.clampFloating();
    },

    clampFloating() {
      this.wm.windows
        .filter((w) => w.floating)
        .forEach((w) => {
          const width = Math.min(w.dimensions.width, this.screen.width);
          const height = Math.min(w.dimensions.height, this.screen.height);
          const left = Math.min(Math.max(0, w.position.left), this.screen.width - width);
          const top = Math.min(Math.max(0, w.position.top), this.screen.height - height);
          if (
            width !== w.dimensions.width ||
            height !== w.dimensions.height ||
            left !== w.position.left ||
            top !== w.position.top
          ) {
            this.$store.dispatch("moveFloating", {
              id: w.id,
              position: { left, top },
              dimensions: { width, height },
            });
          }
        });
    },

    // ------------------------------- actions --------------------------------

    spawn(app) {
      this.$store.dispatch("spawn", { app, rects: this.tileRects });
    },
    closeWindow(id) {
      this.$store.dispatch("close", id || this.wm.focused);
    },
    focusWindow(id) {
      this.$store.dispatch("focus", id);
    },
    toggleFloating(id) {
      this.$store.dispatch("toggleFloating", id || this.wm.focused);
    },
    toggleFullscreen(id) {
      this.$store.dispatch("toggleFullscreen", id || this.wm.focused);
    },
    setWorkspace(workspace) {
      this.$store.dispatch("setWorkspace", workspace);
    },

    focusDirection(direction) {
      const focused = this.focusedWindow;
      if (!focused) return;
      if (focused.floating) {
        this.cycleFocus();
        return;
      }
      const next = dwindle.neighbour(this.tiling.tiles, focused.id, direction);
      if (next) this.focusWindow(next);
    },

    moveDirection(direction) {
      const focused = this.focusedWindow;
      if (!focused || focused.floating) return;
      const next = dwindle.neighbour(this.tiling.tiles, focused.id, direction);
      if (next) this.$store.dispatch("swapWindows", { from: focused.id, to: next });
    },

    cycleFocus() {
      const windows = this.activeWindows;
      if (windows.length < 2) return;
      const index = windows.findIndex((w) => w.id === this.wm.focused);
      this.focusWindow(windows[(index + 1) % windows.length].id);
    },

    /* Move keyboard focus into the application inside the focused window. */
    focusActiveWindow() {
      if (!this.wm.focused) return;
      const frame = this.$el.querySelector(
        `[data-window-id="${this.wm.focused}"]`
      );
      if (!frame) return;
      const target = frame.querySelector("input, [tabindex]");
      if (target) target.focus({ preventScroll: true });
    },

    onKey(event) {
      if (event.key === "Escape") {
        if (this.cheatsheetOpen) {
          this.cheatsheetOpen = false;
          event.preventDefault();
        } else if (this.settingsOpen) {
          this.settingsOpen = false;
          event.preventDefault();
        }
        return;
      }

      const action = resolve(event, this.config.modifier);
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();

      const [name, argument] = action.split(":");
      switch (name) {
        case "spawn":
          this.spawn(argument);
          break;
        case "close":
          this.closeWindow();
          break;
        case "fullscreen":
          this.toggleFullscreen();
          break;
        case "float":
          this.toggleFloating();
          break;
        case "cycle":
          this.cycleFocus();
          break;
        case "focus":
          this.focusDirection(argument);
          break;
        case "move":
          this.moveDirection(argument);
          break;
        case "resize":
          this.$store.dispatch("resizeWindow", {
            id: this.wm.focused,
            direction: argument,
            amount: 0.03,
          });
          break;
        case "workspace":
          this.setWorkspace(argument);
          break;
        case "send":
          this.$store.dispatch("sendToWorkspace", {
            id: this.wm.focused,
            workspace: argument,
          });
          break;
        case "settings":
          this.settingsOpen = !this.settingsOpen;
          break;
        case "cheatsheet":
          this.cheatsheetOpen = !this.cheatsheetOpen;
          break;
      }
    },

    // -------------------------------- dragging -------------------------------

    /* Dragging a gutter sets the ratio of the split it belongs to directly
       from the pointer position inside that split's own area. */
    startGutterDrag(gutter, event) {
      const horizontal = gutter.dir === dwindle.ROW;
      const screenRect = this.$refs.screen.getBoundingClientRect();
      this.beginDrag({
        kind: "gutter",
        path: gutter.path,
        horizontal,
        origin: horizontal
          ? screenRect.left + gutter.area.left
          : screenRect.top + gutter.area.top,
        usable: Math.max(1, gutter.usable),
      });
    },

    startWindowDrag(item, event) {
      this.beginDrag({
        kind: "move",
        id: item.window.id,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...item.window.position },
      });
    },

    startWindowResize(item, event) {
      this.beginDrag({
        kind: "resize",
        id: item.window.id,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...item.window.dimensions },
      });
    },

    beginDrag(drag) {
      this.dragging = drag;
      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.endDrag);
      document.body.classList.add("dragging");
    },

    onDragMove(event) {
      const drag = this.dragging;
      if (!drag) return;

      if (drag.kind === "gutter") {
        const pointer = drag.horizontal ? event.clientX : event.clientY;
        const ratio = (pointer - drag.origin) / drag.usable;
        this.$store.dispatch("setRatio", { path: drag.path, ratio });
        return;
      }

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (drag.kind === "move") {
        this.$store.dispatch("moveFloating", {
          id: drag.id,
          position: {
            left: Math.round(drag.origin.left + dx),
            top: Math.round(drag.origin.top + dy),
          },
        });
      } else {
        this.$store.dispatch("moveFloating", {
          id: drag.id,
          dimensions: {
            width: Math.max(MIN_FLOATING.width, Math.round(drag.origin.width + dx)),
            height: Math.max(MIN_FLOATING.height, Math.round(drag.origin.height + dy)),
          },
        });
      }
    },

    endDrag() {
      if (!this.dragging) return;
      this.dragging = null;
      document.removeEventListener("mousemove", this.onDragMove);
      document.removeEventListener("mouseup", this.endDrag);
      document.body.classList.remove("dragging");
      this.clampFloating();
    },
  },
};
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: var(--gap-outer);
  box-sizing: border-box;
  color: var(--fg);
  background-size: cover;
  background-position: center;
  transition: background-image 0.4s ease;
}

#screen {
  position: relative;
  flex: 1;
  min-height: 0;
}

body.dragging {
  cursor: grabbing;
  user-select: none;
}

.gutter {
  position: absolute;
  z-index: 15;
  border-radius: 999px;
  transition: background 0.15s ease;
}

.gutter.row {
  cursor: col-resize;
}
.gutter.col {
  cursor: row-resize;
}

.gutter:hover {
  background: var(--accent_1);
  opacity: 0.6;
}

.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--muted);
  text-align: center;
}

.empty-hint p {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.empty-keys {
  text-transform: none !important;
  letter-spacing: 0 !important;
  opacity: 0.75;
}
</style>

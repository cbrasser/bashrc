<template>
  <aside class="settings" :class="{ open: open }">
    <header class="settings-head">
      <h2>settings</h2>
      <button class="icon-button" v-on:click="$emit('close')">
        <wm-icon name="close" :size="14" />
      </button>
    </header>

    <section class="settings-block">
      <h3>launch</h3>
      <div class="launchers">
        <button
          v-for="app in apps"
          :key="app.name"
          class="launcher"
          v-on:click="$emit('spawn', app.name)"
        >
          <wm-icon :name="app.icon" :size="16" />
          <span>{{ app.name }}</span>
        </button>
      </div>
    </section>

    <section class="settings-block">
      <h3>theme</h3>
      <div class="themes">
        <button
          v-for="(theme, key) in themes"
          :key="key"
          class="theme"
          :class="{ active: key === config.theme }"
          :title="theme.name"
          v-on:click="setTheme(key)"
        >
          <span class="swatches">
            <i :style="{ background: theme.colors.bg }"></i>
            <i :style="{ background: theme.colors.accent_1 }"></i>
            <i :style="{ background: theme.colors.accent_2 }"></i>
            <i :style="{ background: theme.colors.accent_3 }"></i>
          </span>
          <span class="theme-name">{{ theme.name }}</span>
        </button>
      </div>
    </section>

    <section class="settings-block">
      <h3>window manager</h3>
      <label class="row">
        <span>outer gap</span>
        <input type="range" min="0" max="40" step="1" :value="config.gapOuter"
          v-on:input="update('gapOuter', Number($event.target.value))" />
        <output>{{ config.gapOuter }}</output>
      </label>
      <label class="row">
        <span>inner gap</span>
        <input type="range" min="0" max="40" step="1" :value="config.gapInner"
          v-on:input="update('gapInner', Number($event.target.value))" />
        <output>{{ config.gapInner }}</output>
      </label>
      <label class="row">
        <span>rounding</span>
        <input type="range" min="0" max="28" step="1" :value="config.rounding"
          v-on:input="update('rounding', Number($event.target.value))" />
        <output>{{ config.rounding }}</output>
      </label>
      <label class="row">
        <span>border</span>
        <input type="range" min="0" max="6" step="1" :value="config.borderWidth"
          v-on:input="update('borderWidth', Number($event.target.value))" />
        <output>{{ config.borderWidth }}</output>
      </label>
      <label class="row">
        <span>opacity</span>
        <input type="range" min="0.3" max="1" step="0.02" :value="config.opacity"
          v-on:input="update('opacity', Number($event.target.value))" />
        <output>{{ Math.round(config.opacity * 100) }}%</output>
      </label>

      <label class="row toggle">
        <span>blur</span>
        <button class="switch" :class="{ on: config.blur }"
          v-on:click.prevent="update('blur', !config.blur)"><i></i></button>
      </label>
      <label class="row toggle">
        <span>animations</span>
        <button class="switch" :class="{ on: config.animations }"
          v-on:click.prevent="update('animations', !config.animations)"><i></i></button>
      </label>
      <label class="row toggle">
        <span>status bar</span>
        <button class="switch" :class="{ on: config.showBar }"
          v-on:click.prevent="update('showBar', !config.showBar)"><i></i></button>
      </label>
    </section>

    <section class="settings-block">
      <h3>keybindings</h3>
      <div class="row">
        <span>modifier</span>
        <div class="segmented">
          <button
            v-for="mod in modifiers"
            :key="mod.key"
            :class="{ active: config.modifier === mod.key }"
            v-on:click="update('modifier', mod.key)"
          >
            {{ mod.label }}
          </button>
        </div>
      </div>
      <p class="hint">
        super and ctrl collide with shortcuts the browser keeps for itself, alt
        is the one that always reaches the page.
      </p>
      <button class="wide-button" v-on:click="$emit('cheatsheet')">
        <wm-icon name="keyboard" :size="14" /> show all keybindings
      </button>
    </section>

    <section class="settings-block">
      <h3>applets</h3>
      <label class="row">
        <span>city</span>
        <input class="text" type="text" :value="config.city"
          v-on:input="update('city', $event.target.value)" />
      </label>
      <label class="row">
        <span>wallpaper</span>
        <input class="text" type="text" placeholder="image url"
          :value="config.backgroundImage"
          v-on:input="update('backgroundImage', $event.target.value)" />
      </label>
    </section>

    <section class="settings-block danger">
      <button class="wide-button" v-on:click="$store.dispatch('resetLayout')">
        <wm-icon name="layers" :size="14" /> reset layout
      </button>
      <button class="wide-button" v-on:click="$store.dispatch('resetConfig')">
        <wm-icon name="trash" :size="14" /> reset settings
      </button>
    </section>
  </aside>
</template>

<script>
import wmIcon from "../wm/icon";
import { THEMES } from "../../util/themes";

export default {
  name: "settings",
  components: { wmIcon },
  props: {
    open: Boolean,
  },
  data() {
    return {
      apps: [
        { name: "terminal", icon: "terminal" },
        { name: "filemanager", icon: "folder" },
        { name: "weather", icon: "cloud" },
        { name: "todo", icon: "todo" },
      ],
      modifiers: [
        { key: "alt", label: "alt" },
        { key: "ctrl", label: "ctrl" },
        { key: "meta", label: "super" },
      ],
    };
  },
  computed: {
    config() {
      return this.$store.state.config;
    },
    themes() {
      return THEMES;
    },
  },
  methods: {
    update(key, value) {
      this.$store.dispatch("updateConfig", { [key]: value });
    },
    setTheme(key) {
      // picking a preset drops colour tweaks made on the previous one
      this.$store.dispatch("updateConfig", { theme: key, colorOverrides: {} });
    },
  },
};
</script>

<style>
.settings {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 80;
  width: min(330px, 92vw);
  height: 100%;
  padding: 1.1rem 1.2rem 2rem;
  box-sizing: border-box;
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--bg-translucent);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border-left: 1px solid var(--line);
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.4);
  transform: translateX(100%);
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.settings::-webkit-scrollbar {
  display: none;
}

.settings.open {
  transform: translateX(0);
}

.settings-head {
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;
}

.settings-head h2 {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.icon-button {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
}
.icon-button:hover {
  color: var(--fg);
}

.settings-block {
  margin-bottom: 1.5rem;
}

.settings-block h3 {
  margin: 0 0 0.7rem;
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.launchers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.launcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.launcher:hover {
  border-color: var(--accent_1);
  color: var(--accent_1);
  transform: translateY(-1px);
}

.themes {
  display: grid;
  gap: 0.35rem;
}

.theme {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.theme:hover {
  background: var(--surface);
  color: var(--fg);
}

.theme.active {
  border-color: var(--accent_1);
  background: var(--surface);
  color: var(--fg);
}

.swatches {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.swatches i {
  width: 13px;
  height: 18px;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.45rem;
  font-size: 0.72rem;
  color: var(--muted);
}

.row > span {
  flex: none;
  width: 78px;
}

.row output {
  flex: none;
  width: 34px;
  text-align: right;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.settings input[type="range"] {
  flex: 1;
  min-width: 0;
  height: 3px;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
}

.settings input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent_1);
  border: none;
  cursor: grab;
}

.settings input[type="range"]::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border: none;
  border-radius: 50%;
  background: var(--accent_1);
}

.settings input.text {
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.72rem;
}

.settings input.text:focus {
  border-color: var(--accent_1);
}

.row.toggle {
  justify-content: space-between;
}

.switch {
  width: 36px;
  height: 20px;
  padding: 2px;
  border: none;
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch i {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--muted);
  transition: transform 0.2s ease, background 0.2s ease;
}

.switch.on {
  background: var(--accent_1);
  opacity: 0.85;
}

.switch.on i {
  transform: translateX(16px);
  background: var(--bg);
}

.segmented {
  display: flex;
  flex: 1;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.segmented button {
  flex: 1;
  padding: 0.3rem 0;
  border: none;
  background: none;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.68rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.segmented button.active {
  background: var(--accent_1);
  color: var(--bg);
}

.hint {
  margin: 0.5rem 0 0.7rem;
  font-size: 0.65rem;
  line-height: 1.5;
  color: var(--muted);
  opacity: 0.8;
}

.wide-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.wide-button:hover {
  border-color: var(--accent_1);
  color: var(--accent_1);
}

.danger .wide-button:hover {
  border-color: var(--red);
  color: var(--red);
}
</style>

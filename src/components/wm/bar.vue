<template>
  <header class="bar">
    <div class="bar-section">
      <div class="workspaces">
        <button
          v-for="workspace in workspaceCount"
          :key="workspace"
          class="workspace"
          :class="{
            active: workspace === activeWorkspace,
            occupied: !!occupied[workspace],
          }"
          :title="`workspace ${workspace}`"
          v-on:click="$emit('workspace', workspace)"
        >
          {{ workspace }}
        </button>
      </div>
    </div>

    <div class="bar-section center">
      <wm-icon v-if="focusedApp" :name="focusedIcon" :size="13" />
      <span class="focused-title">{{ focusedApp || "no windows" }}</span>
      <span class="layout-chip">{{ layoutLabel }}</span>
    </div>

    <div class="bar-section right">
      <span class="clock">
        <wm-icon name="clock" :size="13" />
        {{ time }}
      </span>
      <button class="bar-button" title="keybindings" v-on:click="$emit('cheatsheet')">
        <wm-icon name="keyboard" :size="15" />
      </button>
      <button
        class="bar-button"
        :class="{ active: settingsOpen }"
        title="settings"
        v-on:click="$emit('settings')"
      >
        <wm-icon name="settings" :size="15" />
      </button>
    </div>
  </header>
</template>

<script>
import wmIcon from "./icon";

const ICONS = {
  terminal: "terminal",
  filemanager: "folder",
  weather: "cloud",
  todo: "todo",
};

export default {
  name: "wmBar",
  components: { wmIcon },
  props: {
    workspaceCount: { type: Number, default: 9 },
    activeWorkspace: Number,
    occupied: { type: Object, default: () => ({}) },
    focusedApp: String,
    floating: Boolean,
    fullscreen: Boolean,
    settingsOpen: Boolean,
  },
  data() {
    return { time: "", timer: null };
  },
  computed: {
    focusedIcon() {
      return ICONS[this.focusedApp] || "terminal";
    },
    layoutLabel() {
      if (this.fullscreen) return "fullscreen";
      return this.floating ? "floating" : "dwindle";
    },
  },
  methods: {
    tick() {
      const now = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      this.time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    },
  },
  mounted() {
    this.tick();
    this.timer = setInterval(this.tick, 15000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
};
</script>

<style>
.bar {
  flex: none;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 0.5rem;
  margin-bottom: var(--gap-outer);
  border-radius: calc(var(--rounding) - 2px);
  background: var(--bg-translucent);
  backdrop-filter: var(--window-blur);
  -webkit-backdrop-filter: var(--window-blur);
  border: 1px solid var(--line);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.26);
  font-size: 0.72rem;
  user-select: none;
}

.bar-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.bar-section.center {
  justify-content: center;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  min-width: 0;
}

.bar-section.right {
  justify-content: flex-end;
}

.workspaces {
  display: flex;
  align-items: center;
  gap: 2px;
}

.workspace {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: none;
  color: var(--muted);
  opacity: 0.45;
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.workspace.occupied {
  opacity: 1;
  color: var(--fg);
  background: var(--surface);
}

.workspace.active {
  opacity: 1;
  width: 32px;
  color: var(--bg);
  background: linear-gradient(135deg, var(--accent_1), var(--accent_2));
  box-shadow: 0 0 16px -4px var(--glow);
}

.workspace:hover:not(.active) {
  opacity: 1;
  color: var(--fg);
}

.focused-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-chip {
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--accent_1);
  font-size: 0.62rem;
}

.clock {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.bar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.18s ease;
}

.bar-button:hover,
.bar-button.active {
  background: var(--surface);
  color: var(--accent_1);
}

/* on a narrow screen the three sections do not fit next to each other, so the
   empty workspaces and the title in the middle give way */
@media (max-width: 720px) {
  .bar-section.center {
    display: none;
  }

  .workspace:not(.occupied):not(.active) {
    display: none;
  }

  .bar-section {
    flex: none;
  }

  .bar-section.right {
    margin-left: auto;
  }
}
</style>

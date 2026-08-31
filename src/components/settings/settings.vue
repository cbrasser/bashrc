<template>
  <div class="settings-wrapper" :class="{ open: open }">
    <div id="submenu-view" class="settings-section">
      <div class="apps">
        <div
          class="app-icon"
          :class="{ active: terminalActive }"
          @click="toggleApp('terminal')"
        >
          <i class="fas fa-terminal"></i>
        </div>
        <div
          class="app-icon"
          :class="{ active: fmActive }"
          @click="toggleApp('filemanager')"
        >
          <i class="far fa-hdd"></i>
        </div>
        <div
          class="app-icon"
          :class="{ active: weatherActive }"
          @click="toggleApp('weather')"
        >
          <i class="fas fa-smog"></i>
        </div>
        <div
          class="app-icon"
          :class="{ active: todoActive }"
          @click="toggleApp('todo')"
        >
          <i class="fas fa-clipboard-list"></i>
        </div>
      </div>
    </div>
    <div class="settings-section toggle">
      <div class="label">tile</div>
      <div
        class="layout-toggle"
        @click="toggleLayout"
        :class="{ active: config.windowState === 'tiled' }"
      >
        <div class="toggle-button"></div>
      </div>
    </div>
    <div class="settings-section">
      <span>City</span>
      <input
        type="text"
        id="city"
        v-model="config.city"
        @input="updateConfig"
      />
    </div>
    <div class="settings-section">
      <span>background image</span>
      <input
        type="text"
        v-model="config.backgroundImage"
        @input="updateConfig"
      />
    </div>
    <div class="settings-section expand" :class="{ open: colorsOpen }">
      <div class="expand-title" @click="colorsOpen = !colorsOpen">
        <div class="title">colors</div>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="expand-content">
        <div class="colors">
          <div class="color">
            <div class="color-name">Text</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: config.colors.fg }"
            ></div>
            <input
              type="text"
              v-model="config.colors.fg"
              @input="updateConfig"
            />
          </div>
          <div class="color">
            <div class="color-name">Background</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: config.colors.bg }"
            ></div>
            <input
              type="text"
              v-model="config.colors.bg"
              @input="updateConfig"
            />
          </div>
          <div class="color">
            <div class="color-name">Accent 1</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: config.colors.accent_1 }"
            ></div>
            <input
              type="text"
              v-model="config.colors.accent_1"
              @input="updateConfig"
            />
          </div>
          <div class="color">
            <div class="color-name">Accent 2</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: config.colors.accent_2 }"
            ></div>
            <input
              type="text"
              v-model="config.colors.accent_2"
              @input="updateConfig"
            />
          </div>
          <div class="color">
            <div class="color-name">Accent 3</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: config.colors.accent_3 }"
            ></div>
            <input
              type="text"
              v-model="config.colors.accent_3"
              @input="updateConfig"
            />
          </div>
        </div>
        <div class="opacity"></div>
        <div class="background"></div>
        <div class="window-borders"></div>
      </div>
    </div>
    <div class="settings-section expand" :class="{ open: windowsOpen }">
      <div class="expand-title" @click="windowsOpen = !windowsOpen">
        <div class="title">windows</div>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="expand-content">
        <div class="settings-section toggle">
          <div class="label">borders</div>
          <div
            class="layout-toggle"
            @click="toggleBorders"
            :class="{ active: config.windowBorders }"
          >
            <div class="toggle-button"></div>
          </div>
        </div>
        <div class="settings-section">
          <span>opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            v-model.number="config.opacity"
            @input="updateConfig"
          />
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="reset" @click="resetConfig">reset to defaults</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "settings",
  data: function () {
    return {
      colorsOpen: false,
      windowsOpen: false,
    };
  },
  props: {
    open: Boolean,
  },
  methods: {
    toggleBorders() {
      this.config.windowBorders = !this.config.windowBorders;
      this.$store.dispatch("updateConfig", this.config);
    },
    toggleLayout() {
      this.config.windowState === "floating"
        ? (this.config.windowState = "tiled")
        : (this.config.windowState = "floating");
      this.$store.dispatch("updateConfig", this.config);
    },
    updateConfig() {
      this.$store.dispatch("updateConfig", this.config);
    },
    toggleApp(name) {
      const app = this.config.apps.find((a) => a.name === name);
      if (!app) return;
      app.visible = !app.visible;
      this.$store.dispatch("updateConfig", this.config);
    },
    isVisible(name) {
      // an app can be missing from a config written by an older version
      const app = this.config.apps.find((a) => a.name === name);
      return app ? app.visible : false;
    },
    resetConfig() {
      this.$store.dispatch("resetConfig");
    },
  },
  computed: {
    config() {
      return this.$store.state.config;
    },
    terminalActive() {
      return this.isVisible("terminal");
    },
    fmActive() {
      return this.isVisible("filemanager");
    },
    weatherActive() {
      return this.isVisible("weather");
    },
    todoActive() {
      return this.isVisible("todo");
    },
  },
};
</script>

<style>
.expand-content h3 {
  font-size: 18px;
  margin-bottom: 4px;
  margin-top: 4px;
}
.colors {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.color {
  width: max-content;
  padding: 4px;
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
  border-radius: 10px;
}
.color-name {
  font-size: 16px;
}
.color input {
  width: 80px;
}
.color span {
  font-size: 14px;
}
.color-preview {
  height: 30px;
  width: 100%;
}
.expand.open .expand-content {
  max-height: 400px;
}
.expand-title {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.expand-content {
  max-height: 0;
  transition: 0.3s ease-in-out;
  overflow: hidden;
}
.layout-toggle {
  width: 40px;
  height: 20px;
  overflow: hidden;
  background-color: var(--bg);
  border-radius: 10px;
  cursor: pointer;
  transition: 0.5s ease-in-out;
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
}
.layout-toggle.active {
  background-color: var(--fg);
}
.toggle-button {
  width: 20px;
  height: 20px;
  background-color: var(--accent_1);
  border-radius: 50%;
  transition: 0.3s ease-in-out;
}
.layout-toggle.active .toggle-button {
  transform: translateX(100%);
  background-color: var(--accent_2);
}
.apps {
  display: flex;
}
.app-icon {
  margin-right: 8px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  background-color: var(--fg);
  transition: 0.3s ease-in-out;
}
.app-icon i {
  transition: 0.3s ease-in-out;
  color: var(--accent_2);
}
.app-icon.active {
  background-color: var(--accent_1);
}
.app-icon.active i {
  color: var(--fg);
}

.settings-wrapper {
  z-index: 99;
  padding: 1rem;
  border-radius: 12px;
  background-color: var(--bg);
  position: absolute;
  right: 20px;
  top: 20px;
  max-height: calc(100% - 40px);
  overflow-y: auto;
  scrollbar-width: none;
  /* the panel sits inside the padded screen, so it has to travel a bit
     further than its own width to be completely off screen */
  transform: translateX(calc(100% + 4rem));
  transition: 0.3s ease-in-out;
  display: grid;
}
.settings-section {
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
}
.settings-section .label {
  margin-right: 1rem;
}
.settings-section.toggle {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.settings-wrapper.open {
  transform: translateX(0);
}

.settings-wrapper input[type="text"] {
  background-color: var(--bg);
  border: none;
  margin-left: 0;
  color: var(--fg);
  font-family: inherit;
}

.reset {
  cursor: pointer;
  color: var(--accent_2);
}
</style>

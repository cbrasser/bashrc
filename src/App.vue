<template>
  <div id="app" :style="userStyle">
    <div id="screen" :class="config.windowState">
      <vue-resizable
        :dragSelector="'.drag-bar'"
        :width="app.dimensions.width"
        :height="app.dimensions.height"
        :left="app.position.left"
        :top="app.position.top"
        v-for="app in visibleApps"
        :key="app.name"
        :active="['r', 'rb', 'b', 'lb', 'l', 'lt', 't', 'rt']"
        :class="{ focused: focusedApp === app.name }"
        @resize:end="handleDragEnd(app.name, $event)"
        @drag:end="handleDragEnd(app.name, $event)"
        @mousedown.native="focusedApp = app.name"
      >
        <Window
          :id="app.name"
          :ref="app.name"
          :position="app.position"
          :dimensions="app.dimensions"
          :applicationName="app.name"
          :draggable="config.windowState === 'floating'"
          :name="app.name"
          :class="{ border: config.windowBorders }"
        >
          <div slot="application" class="application-wrapper">
            <filemanager
              class="application"
              v-if="app.name === 'filemanager'"
            ></filemanager>
            <terminal
              class="application"
              v-if="app.name === 'terminal'"
            ></terminal>
            <weather
              :city="config.city"
              class="application"
              v-if="app.name === 'weather'"
            />
            <todo class="application" v-if="app.name === 'todo'"> </todo>
          </div>
        </Window>
      </vue-resizable>

      <settingsIcon
        v-on:click="settingsOpen = !settingsOpen"
        :open="settingsOpen"
      ></settingsIcon>
      <settings :open="settingsOpen"> </settings>
    </div>
  </div>
</template>

<script>
import VueResizable from "vue-resizable";

import terminal from "./components/terminal/terminal";
import filemanager from "./components/filemanager/filemanager";
import weather from "./components/widgets/weather";
import todo from "./components/widgets/todo";
import Window from "./components/widgets/window";
import settings from "./components/settings/settings";
import settingsIcon from "./components/settings/settingsIcon";

const MIN_SIZE = { width: 200, height: 120 };

export default {
  name: "app",
  data() {
    return {
      settingsOpen: false,
      focusedApp: null,
    };
  },
  components: {
    VueResizable,
    terminal,
    filemanager,
    settings,
    settingsIcon,
    weather,
    todo,
    Window,
  },
  created: async function () {
    await this.$store.dispatch("loadConfig");
    this.clampWindows();
    await this.$store.dispatch("loadFileTree");
  },
  mounted: function () {
    window.addEventListener("resize", this.onWindowResize);
  },
  beforeDestroy: function () {
    window.removeEventListener("resize", this.onWindowResize);
    clearTimeout(this.resizeTimer);
  },
  computed: {
    config() {
      return this.$store.state.config;
    },
    visibleApps() {
      return this.config.apps.filter((a) => a.visible);
    },
    userStyle() {
      const style = {
        "--fg": this.config.colors.fg,
        "--bg": this.config.colors.bg,
        "--accent_1": this.config.colors.accent_1,
        "--accent_2": this.config.colors.accent_2,
        "--accent_3": this.config.colors.accent_3,
        "--bg-opaque": this.buildRGBA(this.config.colors.bg, this.config.opacity),
      };
      if (this.config.backgroundImage) {
        style["background-image"] = `url(${this.config.backgroundImage})`;
      }
      return style;
    },
  },
  methods: {
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    },
    buildRGBA(hex, opacity) {
      const rgb = this.hexToRgb(hex);
      if (!rgb) {
        // an incomplete color from the settings field must not break the page
        return hex;
      }
      const alpha = isNaN(parseFloat(opacity)) ? 1 : parseFloat(opacity);
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    },
    /* Window positions are absolute, so bring windows that ended up outside
       the viewport (smaller screen, rotated device, ...) back into view. */
    clampWindows() {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      // a hidden or not yet laid out tab reports a zero sized viewport, and
      // clamping against that would collapse every window to nothing
      if (!viewport.width || !viewport.height) {
        return;
      }
      const config = this.config;
      config.apps.forEach((app) => {
        app.dimensions.width = Math.max(
          MIN_SIZE.width,
          Math.min(app.dimensions.width, viewport.width)
        );
        app.dimensions.height = Math.max(
          MIN_SIZE.height,
          Math.min(app.dimensions.height, viewport.height)
        );
        app.position.left = Math.min(
          Math.max(0, app.position.left),
          Math.max(0, viewport.width - app.dimensions.width)
        );
        app.position.top = Math.min(
          Math.max(0, app.position.top),
          Math.max(0, viewport.height - app.dimensions.height)
        );
      });
      this.$store.dispatch("updateConfig", config);
    },
    onWindowResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(this.clampWindows, 250);
    },
    handleDragEnd(appName, event) {
      // in the tiled layout the positions are managed by the grid
      if (this.config.windowState !== "floating") {
        return;
      }
      if (!event || !event.width || !event.height) {
        return;
      }
      const config = this.config;
      const app = config.apps.find((app) => app.name === appName);
      if (!app) {
        return;
      }
      app.position = { top: event.top, left: event.left };
      app.dimensions = { height: event.height, width: event.width };
      this.$store.dispatch("updateConfig", config);
    },
  },
};
</script>

<style lang="scss">
#app {
  height: calc(100% - 2rem);
  width: calc(100% - 2rem);
  color: var(--fg);
  padding: 1rem;
  background-size: cover;
  background-position: center;
}
#screen {
  height: 100%;
  width: 100%;
  position: relative;
}

/* the resizable wrapper is position: relative by default, so in the floating
   layout the windows would stack in the document flow instead of sitting at
   their configured position */
#screen.floating .resizable-component {
  position: absolute;
}

#screen.floating .resizable-component.focused {
  z-index: 2;
}

#screen.tiled {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  /* a tiling layout shares the available space, rows must be able to shrink
     below their content size instead of overflowing the screen */
  grid-auto-rows: minmax(0, 1fr);
}
#screen.tiled .resizable-component {
  position: relative;
  top: unset !important;
  left: unset !important;
  width: unset !important;
  height: unset !important;
}

*:focus {
  outline: none;
}

.application-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.application {
  width: 100%;
  height: 100%;
}

.fullscreen {
  height: 100%;
  width: 100%;
}
</style>

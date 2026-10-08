<template>
  <div
    class="window"
    :class="{ focused: focused, floating: window.floating }"
    :style="frameStyle"
    v-on:mousedown="$emit('focus')"
  >
    <div class="window-inner">
      <header class="title-bar" v-on:mousedown="onTitleDown">
        <wm-icon :name="icon" :size="13" class="title-icon" />
        <span class="title-name">{{ window.app }}</span>
        <span class="title-id">{{ instance }}</span>
        <div class="title-actions">
          <button
            class="title-button"
            :title="window.floating ? 'tile' : 'float'"
            v-on:mousedown.stop
            v-on:click.stop="$emit('float')"
          >
            <wm-icon name="float" :size="12" />
          </button>
          <button
            class="title-button"
            title="fullscreen"
            v-on:mousedown.stop
            v-on:click.stop="$emit('fullscreen')"
          >
            <wm-icon name="expand" :size="12" />
          </button>
          <button
            class="title-button close"
            title="close"
            v-on:mousedown.stop
            v-on:click.stop="$emit('close')"
          >
            <wm-icon name="close" :size="12" />
          </button>
        </div>
      </header>
      <div class="window-body">
        <slot></slot>
      </div>
    </div>
    <div
      v-if="window.floating"
      class="resize-grip"
      v-on:mousedown.stop.prevent="$emit('resize-start', $event)"
    ></div>
  </div>
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
  name: "windowFrame",
  components: { wmIcon },
  props: {
    window: { type: Object, required: true },
    rect: { type: Object, required: true },
    focused: Boolean,
    animated: Boolean,
  },
  computed: {
    icon() {
      return ICONS[this.window.app] || "terminal";
    },
    instance() {
      return this.window.id.split("-").pop();
    },
    frameStyle() {
      return {
        left: `${this.rect.left}px`,
        top: `${this.rect.top}px`,
        width: `${this.rect.width}px`,
        height: `${this.rect.height}px`,
        zIndex: this.rect.zIndex,
        transitionDuration: this.animated ? null : "0s",
      };
    },
  },
  methods: {
    onTitleDown(event) {
      if (this.window.floating) {
        this.$emit("drag-start", event);
      }
    },
  },
};
</script>

<style>
.window {
  position: absolute;
  padding: var(--border-width);
  border-radius: var(--rounding);
  box-sizing: border-box;
  transition: left 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.2s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
}

/*
 * The border is drawn as a ring on a pseudo element and masked out in the
 * middle. Painting it as a background behind a translucent window would tint
 * the whole surface instead of just the edge.
 */
.window::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: var(--border-width);
  background: var(--border-idle);
  -webkit-mask: linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  transition: background 0.2s ease;
}

/* hyprland's signature: the focused window gets a gradient border and a glow */
.window.focused::before {
  background: linear-gradient(
    135deg,
    var(--accent_1) 0%,
    var(--accent_2) 55%,
    var(--accent_3) 100%
  );
}

.window.focused {
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42), 0 0 26px -6px var(--glow);
}

.window.floating {
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.window-inner {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: calc(var(--rounding) - var(--border-width));
  background: var(--bg-translucent);
  backdrop-filter: var(--window-blur);
  -webkit-backdrop-filter: var(--window-blur);
}

.title-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 30px;
  padding: 0 0.3rem 0 0.7rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  user-select: none;
}

.floating .title-bar {
  cursor: grab;
}
.floating .title-bar:active {
  cursor: grabbing;
}

.window.focused .title-bar {
  color: var(--fg);
}

.title-icon {
  color: var(--accent_1);
}

.title-name {
  font-weight: 700;
}

.title-id {
  color: var(--muted);
  opacity: 0.7;
}

.title-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.window:hover .title-actions,
.window.focused .title-actions {
  opacity: 1;
}

.title-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.title-button:hover {
  background: var(--surface);
  color: var(--fg);
}

.title-button.close:hover {
  background: var(--red);
  color: var(--bg);
}

.window-body {
  flex: 1;
  min-height: 0;
  padding: 0.8rem 0.9rem;
  overflow: hidden;
}

.resize-grip {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
}
</style>

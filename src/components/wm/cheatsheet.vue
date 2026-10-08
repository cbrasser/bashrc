<template>
  <div class="cheatsheet-backdrop" v-if="open" v-on:click.self="$emit('close')">
    <div class="cheatsheet">
      <header class="cheatsheet-head">
        <wm-icon name="keyboard" :size="18" />
        <h2>keybindings</h2>
        <code class="mod-chip">mod = {{ modifierLabel }}</code>
        <button class="cheatsheet-close" v-on:click="$emit('close')">
          <wm-icon name="close" :size="14" />
        </button>
      </header>

      <div class="cheatsheet-groups">
        <section v-for="group in bindings" :key="group.group">
          <h3>
            {{ group.group }}
            <span v-if="group.modifier" class="group-mod">+ {{ group.modifier }}</span>
          </h3>
          <div class="binding" v-for="item in group.items" :key="item.action">
            <div class="binding-keys">
              <kbd>mod</kbd>
              <kbd v-if="group.modifier">{{ group.modifier }}</kbd>
              <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
            </div>
            <span class="binding-label">{{ item.label }}</span>
          </div>
        </section>
      </div>

      <footer class="cheatsheet-foot">
        windows tile with dwindle: a new window splits the focused one along its
        longer side. drag the gap between two windows to change the split.
      </footer>
    </div>
  </div>
</template>

<script>
import wmIcon from "./icon";
import { BINDINGS, MODIFIERS } from "../../util/wm/keymap";

export default {
  name: "cheatsheet",
  components: { wmIcon },
  props: {
    open: Boolean,
    modifier: { type: String, default: "alt" },
  },
  computed: {
    bindings() {
      return BINDINGS;
    },
    modifierLabel() {
      return (MODIFIERS[this.modifier] || MODIFIERS.alt).label;
    },
  },
};
</script>

<style>
.cheatsheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade-in 0.18s ease;
}

.cheatsheet {
  width: min(760px, 100%);
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 1.4rem 1.6rem 1.1rem;
  border-radius: var(--rounding);
  border: 1px solid var(--line);
  background: var(--bg-solid);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  animation: pop-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.cheatsheet-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.2rem;
  color: var(--accent_1);
}

.cheatsheet-head h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg);
}

.mod-chip {
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--accent_3);
  font-size: 0.68rem;
}

.cheatsheet-close {
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
.cheatsheet-close:hover {
  color: var(--fg);
}

.cheatsheet-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.4rem 2rem;
}

.cheatsheet h3 {
  margin: 0.6rem 0 0.5rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.group-mod {
  color: var(--accent_2);
}

.binding {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 3px 0;
  font-size: 0.78rem;
}

.binding-keys {
  display: flex;
  gap: 3px;
  flex: none;
}

.binding-label {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

kbd {
  min-width: 1.2rem;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  background: var(--surface);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.68rem;
  text-align: center;
}

.cheatsheet-foot {
  margin-top: 1.2rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
</style>

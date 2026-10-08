<template>
  <div class="console-out">
    <div class="out-grid" v-if="out.dirs.length || out.files.length">
      <a
        v-for="(dir, index) in out.dirs"
        v-bind:key="'d' + index"
        class="out-entry directory"
        v-on:click="$emit('cd', `cd ${dir}`)"
      >
        <wm-icon name="folder" :size="13" />
        <span>{{ dir }}</span>
      </a>
      <a
        v-for="(file, index) in out.files"
        v-bind:key="'f' + index"
        class="out-entry file"
        :href="file.url"
        target="_blank"
        rel="noopener"
      >
        <wm-icon name="file" :size="13" />
        <span>{{ file.name }}</span>
      </a>
    </div>
    <p
      v-for="(msg, index) in out.messages"
      v-bind:key="'m' + index"
      class="out-message"
      :class="msg.type"
      :style="msg.css"
    >
      {{ msg.value }}
    </p>
  </div>
</template>

<script>
import wmIcon from "../wm/icon";

export default {
  name: "termOut",
  components: { wmIcon },
  props: {
    out: {
      type: Object,
      default: () => ({ dirs: [], files: [], messages: [] }),
    },
  },
};
</script>

<style>
.console-out {
  flex: 1;
  min-height: 0;
  margin-top: 0.6rem;
  overflow-y: auto;
  font-size: 0.85rem;
}

.out-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1px 0.8rem;
}

.out-entry {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 2px 6px;
  margin-left: -6px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.14s ease;
}

.out-entry span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.out-entry:hover {
  background: var(--surface);
}

.out-entry.directory {
  color: var(--accent_1);
}

.out-entry.file {
  color: var(--yellow);
}

.out-message {
  margin: 0;
  padding: 1px 0;
}

.out-message.error {
  color: var(--red);
}

.out-message.success {
  color: var(--green);
}
</style>

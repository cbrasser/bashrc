<template>
  <div class="entry">
    <div class="entry-command">
      <span class="entry-path">{{ entry.path }}</span>
      <span class="entry-caret">❯</span>
      <span class="entry-text">{{ entry.command }}</span>
    </div>

    <div class="entry-grid" v-if="entry.dirs.length || entry.files.length">
      <a
        v-for="(dir, index) in entry.dirs"
        v-bind:key="'d' + index"
        class="out-entry directory"
        v-on:click="$emit('cd', `cd ${dir}`)"
      >
        <wm-icon name="folder" :size="13" />
        <span>{{ dir }}</span>
      </a>
      <a
        v-for="(file, index) in entry.files"
        v-bind:key="'f' + index"
        class="out-entry file"
        :href="file.url"
        :title="file.url"
        target="_blank"
        rel="noopener"
      >
        <wm-icon name="file" :size="13" />
        <span>{{ file.name }}</span>
      </a>
    </div>

    <p
      v-for="(msg, index) in entry.messages"
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
    entry: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style>
.entry {
  margin-bottom: 0.55rem;
}

.entry-command {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  opacity: 0.75;
}

.entry-path {
  color: var(--accent_1);
}

.entry-caret {
  color: var(--green);
}

.entry-text {
  color: var(--fg);
  word-break: break-all;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1px 0.6rem;
  margin-top: 0.2rem;
}

.out-entry {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 1px 6px;
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
  word-break: break-word;
}

.out-message.error {
  color: var(--red);
}

.out-message.success {
  color: var(--green);
}
</style>

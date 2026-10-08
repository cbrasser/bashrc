<template>
  <div
    id="filemanager"
    tabindex="0"
    ref="filemanager"
    v-on:keydown="onKey"
    v-on:click="focus"
  >
    <nav class="breadcrumb">
      <button
        v-for="(crumb, index) in breadcrumbs"
        v-bind:key="index"
        class="crumb"
        :class="{ current: index === breadcrumbs.length - 1 }"
        v-on:click.stop="goUp(breadcrumbs.length - 1 - index)"
      >
        {{ crumb }}
      </button>
      <span class="crumb-filter" v-if="filter">/{{ filter }}</span>
    </nav>

    <ul v-if="content.length">
      <li
        v-for="(node, index) in content"
        v-bind:key="node.type + node.name"
        v-on:click="enterNode(node)"
        v-bind:title="node.url || node.name"
        v-bind:class="{
          selected: index == selected,
          marked: markedRemove.indexOf(node.name) != -1,
          directory: node.type == 'directory',
          file: node.type == 'file',
        }"
      >
        <wm-icon :name="node.type === 'directory' ? 'folder' : 'file'" :size="13" />
        <span class="entry-name">{{ node.name }}</span>
        <span class="entry-meta">{{ node.meta }}</span>
      </li>
    </ul>

    <div class="fm-empty" v-else>
      <wm-icon name="folder" :size="22" />
      <p v-if="filter">nothing matches “{{ filter }}”</p>
      <p v-else>empty directory</p>
      <p class="fm-empty-keys">
        <kbd>n</kbd> new folder · <kbd>f</kbd> new bookmark
      </p>
    </div>

    <div class="fm-prompt-wrapper" v-if="promptActive">
      <prompt
        v-bind:label="type"
        type="text"
        v-bind:placeholder="placeholders[type]"
        v-on:submit="onSubmit"
        v-on:cancel="cancel"
        ref="filePrompt"
      ></prompt>
    </div>

    <footer class="status-bar">
      <span class="position">
        {{ content.length ? selected + 1 : 0 }}/{{ content.length }}
      </span>
      <span class="fm-error" v-if="error">{{ error }}</span>
      <span class="marked-count" v-else-if="markedRemove.length">
        {{ markedRemove.length }} marked · <kbd>p</kbd> to delete
      </span>
      <span class="fm-target" v-else-if="selectedNode">{{ target }}</span>
      <span class="fm-keys">
        <kbd>hjkl</kbd><kbd>n</kbd><kbd>f</kbd><kbd>d</kbd><kbd>/</kbd>
      </span>
    </footer>
  </div>
</template>

<script>
import prompt from "./prompt";
import wmIcon from "../wm/icon";

export default {
  name: "filemanager",
  data: function () {
    return {
      selected: 0,
      promptActive: false,
      type: "",
      filter: "",
      error: "",
      placeholders: {
        touch: "filename url",
        mkdir: "name",
        search: "string",
        cd: "directory",
      },
      markedRemove: [],
    };
  },
  components: {
    prompt,
    wmIcon,
  },
  mounted: function () {
    this.focus();
  },
  watch: {
    // the selection must stay inside the list when it shrinks or we navigate
    content: function (newContent) {
      if (this.selected > newContent.length - 1) {
        this.selected = Math.max(0, newContent.length - 1);
      }
    },
  },
  methods: {
    focus: function () {
      if (!this.promptActive && this.$refs.filemanager) {
        // without preventScroll the browser scrolls the whole page to the
        // focused window, which pushes the other windows out of view
        this.$refs.filemanager.focus({ preventScroll: true });
      }
    },
    onKey: function (event) {
      if (this.promptActive || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const actions = {
        ArrowLeft: this.leave,
        h: this.leave,
        ArrowDown: this.down,
        j: this.down,
        ArrowUp: this.up,
        k: this.up,
        ArrowRight: this.enter,
        l: this.enter,
        Enter: this.enter,
        f: () => this.openPrompt("touch"),
        n: () => this.openPrompt("mkdir"),
        "/": () => this.openPrompt("search"),
        ":": () => this.openPrompt("cd"),
        ";": () => this.openPrompt("cd"),
        d: this.mark,
        p: this.removeMarked,
        Escape: this.cancel,
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        this.error = "";
        action();
      }
    },
    leave: function () {
      this.changeDirectory("..");
    },
    enter: function () {
      const node = this.content[this.selected];
      if (node) {
        this.enterNode(node);
      }
    },
    enterNode: function (node) {
      if (!node) return;
      if (node.type == "directory") {
        this.changeDirectory(node.name);
      } else {
        window.open(node.url, "_blank", "noopener");
      }
    },
    changeDirectory: function (name) {
      const res = this.fs.cd(this.wd, [name]);
      if (res.directory) {
        // the working directory lives in the store, it cannot be assigned here
        this.$store.dispatch("updateWorkingDirectory", res.directory);
        this.selected = 0;
        this.filter = "";
        this.markedRemove = [];
      } else {
        this.showErrors(res);
      }
    },
    down: function () {
      if (this.content.length == 0) return;
      this.selected = (this.selected + 1) % this.content.length;
    },
    up: function () {
      if (this.content.length == 0) return;
      this.selected =
        this.selected > 0 ? this.selected - 1 : this.content.length - 1;
    },
    openPrompt: function (type) {
      this.type = type;
      this.promptActive = true;
    },
    /* Marking is by name, an index would point at a different entry as soon
       as the listing changes. */
    mark: function () {
      const node = this.content[this.selected];
      if (!node) return;
      const index = this.markedRemove.indexOf(node.name);
      if (index == -1) {
        this.markedRemove.push(node.name);
      } else {
        this.markedRemove.splice(index, 1);
      }
    },
    cancel: function () {
      this.promptActive = false;
      this.type = "";
      this.filter = "";
      this.markedRemove = [];
      this.$nextTick(this.focus);
    },
    removeMarked: function () {
      const names = this.markedRemove.slice();
      let changed = false;
      names.forEach((name) => {
        const node = this.content.filter((n) => n.name == name)[0];
        if (!node) return;
        const res =
          node.type == "file"
            ? this.fs.rm(this.wd, [name])
            : this.fs.rmdir(this.wd, [name]);
        changed = changed || res.success;
        this.showErrors(res);
      });
      this.markedRemove = [];
      this.selected = 0;
      if (changed) {
        this.persist();
      }
    },
    onSubmit: function (value) {
      let res;
      switch (this.type) {
        case "touch":
          res = this.fs.touch(this.wd, value);
          break;
        case "mkdir":
          res = this.fs.mkdir(this.wd, value);
          break;
        case "search":
          this.filter = value;
          this.selected = 0;
          break;
        case "cd":
          this.changeDirectory(value);
          break;
      }
      if (res) {
        this.showErrors(res);
        if (res.success) {
          this.persist();
        }
      }
      this.type = "";
      this.promptActive = false;
      this.$nextTick(this.focus);
    },
    /* Writes the tree back into the store, which persists it to local storage.
       Without this every change was lost on the next reload. */
    persist: function () {
      this.$store.dispatch("updateFileTree", this.fs);
    },
    /* Jump several levels up at once from the breadcrumb. */
    goUp: function (levels) {
      for (let step = 0; step < levels; step++) {
        this.changeDirectory("..");
      }
    },
    countLabel: function (directory) {
      const total = directory.getChildren().length + directory.getFiles().length;
      return total === 1 ? "1 item" : `${total} items`;
    },
    hostOf: function (url) {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch (e) {
        return url;
      }
    },
    showErrors: function (res) {
      if (res && res.messages && res.messages.length > 0) {
        this.error = res.messages[0].value;
      }
    },
  },
  computed: {
    fs() {
      return this.$store.state.fileTree;
    },
    wd() {
      return this.$store.state.workingDirectory;
    },
    content: function () {
      if (!this.wd || !this.wd.getChildren) {
        return [];
      }
      let content = this.wd.getChildren().map((c) => ({
        name: c.getName(),
        type: "directory",
        meta: this.countLabel(c),
      }));
      content = content.concat(
        this.wd.getFiles().map((f) => ({
          name: f.getName(),
          type: "file",
          url: f.getUrl(),
          meta: this.hostOf(f.getUrl()),
        }))
      );
      if (this.filter.length > 0) {
        const filter = this.filter.toLowerCase();
        return content.filter((n) => n.name.toLowerCase().indexOf(filter) != -1);
      }
      return content;
    },
    dirname: function () {
      return this.wd && this.wd.getPath ? this.wd.getPath() : "";
    },
    breadcrumbs: function () {
      return this.dirname ? this.dirname.split("/") : [];
    },
    selectedNode: function () {
      return this.content[this.selected] || null;
    },
    target: function () {
      const node = this.selectedNode;
      if (!node) return "";
      return node.type === "file" ? node.url : `${node.meta} inside`;
    },
  },
};
</script>

<style>
#filemanager {
  display: flex;
  flex-direction: column;
  height: 100%;
  outline: none;
  font-size: 0.88rem;
  /* so the status bar can drop its key reminder in a narrow window rather
     than at a narrow screen: a tile can be small on a wide monitor */
  container-type: inline-size;
}

.breadcrumb {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  font-size: 0.72rem;
}

.crumb {
  padding: 1px 5px;
  border: none;
  border-radius: 5px;
  background: none;
  color: var(--muted);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  transition: color 0.14s ease, background 0.14s ease;
}

.crumb:not(:last-child)::after {
  content: "/";
  margin-left: 5px;
  color: var(--line);
}

.crumb:hover {
  color: var(--accent_1);
}

.crumb.current {
  color: var(--fg);
  cursor: default;
}

.crumb-filter {
  color: var(--accent_3);
  font-size: 0.72rem;
}

#filemanager ul {
  flex: 1;
  min-height: 0;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
}

#filemanager li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 2px 7px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.entry-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* the host of a bookmark or the size of a folder, only when there is room */
.entry-meta {
  margin-left: auto;
  padding-left: 0.6rem;
  color: var(--muted);
  font-size: 0.7rem;
  opacity: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.14s ease;
}

#filemanager li:hover .entry-meta,
#filemanager li.selected .entry-meta {
  opacity: 0.75;
}

#filemanager .directory {
  color: var(--accent_1);
}

#filemanager .file {
  color: var(--yellow);
}

#filemanager li:hover {
  background: var(--surface);
}

/*
 * The selection is a tinted row with a bar on the leading edge rather than a
 * solid block: at these window sizes a full bar of colour drowns the list.
 */
#filemanager li.selected::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 2px;
  border-radius: 999px;
  background: currentColor;
}

#filemanager li.selected {
  background: var(--surface);
}

#filemanager .directory.selected {
  box-shadow: inset 0 0 0 1px var(--accent_1);
}

#filemanager .file.selected {
  box-shadow: inset 0 0 0 1px var(--yellow);
}

/* has to beat the selected styles, an entry can be both */
#filemanager li.marked,
#filemanager li.selected.marked {
  color: var(--red);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--red);
  text-decoration: line-through;
}

.fm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  color: var(--muted);
  text-align: center;
}

.fm-empty p {
  margin: 0;
  font-size: 0.78rem;
}

.fm-empty-keys {
  opacity: 0.7;
  font-size: 0.72rem !important;
}

.status-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--line);
  font-size: 0.7rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
}

.status-bar .position {
  flex: none;
  padding: 0 6px;
  border-radius: 5px;
  background: var(--surface);
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.status-bar .fm-error {
  color: var(--red);
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-bar .marked-count {
  color: var(--red);
}

.status-bar .fm-target {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* the key reminder is the first thing to go when the window gets narrow */
.status-bar .fm-keys {
  flex: none;
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0.5;
}

#filemanager kbd {
  min-width: 0;
  padding: 0 4px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
  color: inherit;
  font-family: inherit;
  font-size: 0.66rem;
}

@container (max-width: 260px) {
  .status-bar .fm-keys {
    display: none;
  }
}

.fm-prompt-wrapper {
  flex: none;
  margin-top: 0.4rem;
}
</style>

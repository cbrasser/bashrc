<template>
  <div
    id="filemanager"
    tabindex="0"
    ref="filemanager"
    v-on:keydown="onKey"
    v-on:click="focus"
  >
    <div class="wrapper">
      <ul>
        <li
          v-for="(node, index) in content"
          v-bind:key="node.type + node.name"
          v-on:click="enterNode(node)"
          v-bind:class="{
            selected: index == selected,
            marked: markedRemove.indexOf(node.name) != -1,
            directory: node.type == 'directory',
            file: node.type == 'file',
          }"
        >
          <wm-icon :name="node.type === 'directory' ? 'folder' : 'file'" :size="13" />
          <span class="entry-name">{{ node.name }}</span>
        </li>
      </ul>
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
      <div class="status-bar">
        <span class="position">{{ content.length ? selected + 1 : 0 }}/{{ content.length }}</span>
        <span class="wd">{{ dirname }}</span>
        <span class="fm-error" v-if="error">{{ error }}</span>
        <span class="filter" v-if="filter.length > 0">filter: {{ filter }}</span>
      </div>
    </div>
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
      }));
      content = content.concat(
        this.wd.getFiles().map((f) => ({
          name: f.getName(),
          type: "file",
          url: f.getUrl(),
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
}

#filemanager .wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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

#filemanager .directory {
  color: var(--accent_1);
}

#filemanager .file {
  color: var(--yellow);
}

#filemanager li:hover {
  background: var(--surface);
}

#filemanager .directory.selected {
  background: var(--accent_1);
  color: var(--bg);
}

#filemanager .file.selected {
  background: var(--yellow);
  color: var(--bg);
}

/* has to beat .directory.selected / .file.selected, an entry can be both */
#filemanager .directory.marked,
#filemanager .file.marked,
#filemanager .directory.selected.marked,
#filemanager .file.selected.marked {
  background: var(--red);
  color: var(--bg);
}

.status-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--line);
  font-size: 0.7rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
}

.status-bar .position {
  padding: 0 6px;
  border-radius: 5px;
  background: var(--surface);
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.status-bar .wd {
  color: var(--accent_1);
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-bar .fm-error {
  color: var(--red);
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-bar .filter {
  margin-left: auto;
  color: var(--accent_3);
}

.fm-prompt-wrapper {
  flex: none;
  margin-top: 0.4rem;
}
</style>

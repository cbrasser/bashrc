<template>
  <div class="terminal" v-on:click="focusInput">
    <div class="scrollback" ref="scrollback">
      <p class="terminal-hint" v-if="history.length === 0">
        bookmarks live in a file tree. <code>help</code> lists the commands,
        <code>tab</code> completes.
      </p>
      <term-out
        v-for="entry in history"
        v-bind:key="entry.id"
        v-bind:entry="entry"
        v-on:cd="onCommandSubmit"
      />
    </div>
    <prompt
      v-on:input="onCommand"
      v-on:submit="onCommandSubmit"
      v-bind:wd="wdPath"
      v-bind:suggestions="suggestions"
    />
  </div>
</template>

<script>
import prompt from "./prompt.vue";
import termOut from "./term-out.vue";
import { newResponse } from "../response";
import { log } from "../logger";
import { get_browser_info } from "../utility";

const SCROLLBACK_LIMIT = 100;

export default {
  name: "terminal",
  components: {
    prompt,
    termOut,
  },
  data: function () {
    return {
      history: [],
      suggestions: [],
      counter: 0,
      uptimeStart: new Date().getTime(),
    };
  },
  computed: {
    fs() {
      return this.$store.state.fileTree;
    },
    wd() {
      return this.$store.state.workingDirectory;
    },
    wdPath() {
      return this.wd ? this.wd.getPath() : "";
    },
    /* Commands that are not part of the file system itself. They are defined
       here (and not in data) so that `this` is the component. */
    builtins() {
      return {
        help: () => {
          const res = newResponse();
          res.messages.push({
            type: "value",
            value: `commands: ${this.commandNames.join(", ")}`,
          });
          res.messages.push({
            type: "value",
            value: "tab completes, up/down cycles through the history",
          });
          return res;
        },
        clear: () => newResponse(),
        fetch: () => {
          const res = newResponse();
          const uptime = Math.floor((Date.now() - this.uptimeStart) / 1000);
          res.messages.push({
            type: "value",
            value: "OS > " + window.navigator.platform,
            css: { color: "var(--orange)" },
          });
          res.messages.push({
            type: "value",
            value: "Kernel > bashrc v2.0.0",
            css: { color: "var(--yellow)" },
          });
          res.messages.push({
            type: "value",
            value: `Uptime > ${Math.floor(uptime / 60)} minutes - ${uptime % 60} seconds`,
            css: { color: "var(--green)" },
          });
          res.messages.push({
            type: "value",
            value: `Resolution > ${window.innerWidth}x${window.innerHeight}`,
            css: { color: "var(--pink)" },
          });
          res.messages.push({
            type: "value",
            value: "DE > " + get_browser_info().name,
            css: { color: "var(--blue)" },
          });
          return res;
        },
        pwd: () => {
          const res = newResponse();
          res.messages.push({ type: "value", value: this.wdPath });
          return res;
        },
        echo: (args) => {
          const res = newResponse();
          res.messages.push({ type: "value", value: args.join(" ") });
          return res;
        },
        locate: (args) => {
          const res = newResponse();
          if (!args[0]) {
            return res.error("locate: please enter a search query");
          }
          window.open(
            `https://duckduckgo.com/?q=${encodeURIComponent(args.join(" "))}`,
            "_blank"
          );
          return res;
        },
        open: (args) => {
          const res = newResponse();
          if (!args[0]) {
            return res.error("open: missing operand");
          }
          const file = this.fs.getNode(this.wd, args[0]);
          if (!file) {
            return res.error(
              `open: cannot open '${args[0]}': No such file or directory`
            );
          }
          if (!file.url) {
            return res.error(`open: '${args[0]}' is a directory`);
          }
          window.open(file.url, "_blank");
          return res;
        },
      };
    },
    commandNames() {
      return Object.keys(this.builtins).concat(this.fs ? this.fs.api() : []);
    },
  },
  methods: {
    /* clicking anywhere in the terminal window should put the cursor back
       into the prompt, like clicking into a real terminal does */
    focusInput: function () {
      const input = this.$el.querySelector("#input_field");
      if (input) {
        input.focus({ preventScroll: true });
      }
    },
    onCommand: function (input) {
      this.suggest(input);
    },
    onCommandSubmit: function (com) {
      this.suggestions = [];
      if (!com || com.trim().length == 0) {
        return;
      }

      const parts = com.trim().split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);
      const path = this.wdPath;

      if (command === "clear") {
        this.history = [];
        return;
      }

      if (this.builtins[command]) {
        this.record(path, com, this.builtins[command](args));
        return;
      }

      const res = this.fs.call(command, this.wd, args);
      if (!res) {
        this.record(
          path,
          com,
          newResponse().error(`bashrc: command not found: ${command}`)
        );
        return;
      }
      // a command that changed the tree has to be written back to the store
      if (res.success) {
        this.$store.dispatch("updateFileTree", this.fs);
      }
      if (res.directory) {
        this.$store.dispatch("updateWorkingDirectory", res.directory);
      }
      this.record(path, com, res);
    },

    /* Keep the command and what it printed, the way a real shell keeps its
       scrollback instead of replacing the last output. */
    record: function (path, command, res) {
      this.counter += 1;
      this.history.push({
        id: this.counter,
        path,
        command,
        dirs: (res && res.dirs) || [],
        files: (res && res.files) || [],
        messages: (res && res.messages) || [],
      });
      if (this.history.length > SCROLLBACK_LIMIT) {
        this.history.splice(0, this.history.length - SCROLLBACK_LIMIT);
      }
      this.$nextTick(this.scrollToBottom);
    },

    scrollToBottom: function () {
      const element = this.$refs.scrollback;
      if (element) element.scrollTop = element.scrollHeight;
    },
    suggest: function (input) {
      if (!input || input.length == 0) {
        this.suggestions = [];
        return;
      }
      // a space means the command is typed already and we complete a path
      if (input.indexOf(" ") != -1) {
        this.suggestFiles(input);
      } else {
        this.suggestCommands(input);
      }
    },
    suggestCommands: function (input) {
      const names = this.commandNames.concat(this.wd ? this.wd.getFileNames() : []);
      this.suggestions = names.filter((c) => c.substr(0, input.length) == input);
    },
    suggestFiles: function (input) {
      const path = input.split(/\s+/).slice(1).join(" ");
      let searchDir = this.wd;
      let fragment = path || "";

      if (path.indexOf(this.fs.separator) != -1) {
        const dirPath = path.substr(0, path.lastIndexOf(this.fs.separator));
        fragment = path.substr(path.lastIndexOf(this.fs.separator) + 1);
        searchDir = this.fs.getNode(this.wd, dirPath);
      }
      if (!searchDir || searchDir.url) {
        this.suggestions = [];
        return;
      }
      const content = searchDir
        .getChildrenNames()
        .concat(searchDir.getFileNames());
      this.suggestions = content.filter(
        (c) => c.substr(0, fragment.length) == fragment
      );
    },
  },
};
</script>

<style>
.terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 0.9rem;
  cursor: text;
}

.scrollback {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/*
 * Keeps the output sitting on the prompt while the buffer is short. An auto
 * margin is used rather than justify-content: flex-end, which makes the top of
 * an overflowing scroll container unreachable.
 */
.scrollback > :first-child {
  margin-top: auto;
}

.terminal-hint {
  margin: 0 0 0.4rem;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.6;
}

.terminal-hint code {
  padding: 0 5px;
  border-radius: 4px;
  background: var(--surface);
  color: var(--accent_3);
  font-size: 0.74rem;
}
</style>

<template>
  <div class="terminal" v-on:click="focusInput">
    <prompt
      v-on:input="onCommand"
      v-on:submit="onCommandSubmit"
      v-bind:wd="wdPath"
      v-bind:suggestions="suggestions"
    />
    <term-out v-bind:out="out" v-on:cd="onCommandSubmit" />
  </div>
</template>

<script>
import prompt from "./prompt.vue";
import termOut from "./term-out.vue";
import { newResponse } from "../response";
import { log } from "../logger";
import { get_browser_info } from "../utility";

export default {
  name: "terminal",
  components: {
    prompt,
    termOut,
  },
  data: function () {
    return {
      out: { dirs: [], files: [], messages: [] },
      suggestions: [],
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
      this.showResponse(newResponse());
      if (!com || com.trim().length == 0) {
        return;
      }

      const parts = com.trim().split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      if (this.builtins[command]) {
        this.showResponse(this.builtins[command](args));
        return;
      }

      const res = this.fs.call(command, this.wd, args);
      if (!res) {
        const notFound = newResponse();
        notFound.error(`bashrc: command not found: ${command}`);
        this.showResponse(notFound);
        return;
      }
      // a command that changed the tree has to be written back to the store
      if (res.success) {
        this.$store.dispatch("updateFileTree", this.fs);
      }
      if (res.directory) {
        this.$store.dispatch("updateWorkingDirectory", res.directory);
      }
      this.showResponse(res);
    },
    showResponse: function (res) {
      if (!res) {
        return;
      }
      this.out = {
        dirs: res.dirs || [],
        files: res.files || [],
        messages: res.messages || [],
      };
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
}
</style>

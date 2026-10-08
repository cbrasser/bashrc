<template>
  <!-- Prompt & user input -->
  <div class="prompt-input">
    <form v-on:submit.prevent="submit">
      <input
        ref="input"
        id="input_field"
        name="cmd"
        v-model="input"
        v-on:input="onInput"
        v-on:keydown.tab.prevent="next"
        v-on:keydown.enter.prevent="onEnter"
        v-on:keydown.esc.prevent="dismiss"
        v-on:keydown.up.prevent="previousCommand"
        v-on:keydown.down.prevent="nextCommand"
        type="text"
        autocomplete="off"
        spellcheck="false"
      />
    </form>
    <suggestions
      v-bind:suggestions="termSuggestions"
      v-bind:suggestionIndex="index"
      v-bind:show="showSuggestions"
      v-on:select="accept"
    />
  </div>
</template>

<script>
import suggestions from "./suggestions.vue";

const HISTORY_LIMIT = 50;

export default {
  name: "promptInput",
  data() {
    return {
      input: "",
      index: -1,
      showSuggestions: false,
      history: [],
      historyIndex: -1,
    };
  },
  props: {
    termSuggestions: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    suggestions,
  },
  mounted() {
    this.focus();
  },
  methods: {
    focus() {
      if (this.$refs.input) {
        this.$refs.input.focus({ preventScroll: true });
      }
    },
    onInput() {
      this.$emit("input", this.input);
      this.index = -1;
      this.showSuggestions = false;
      this.historyIndex = -1;
    },
    submit() {
      const value = this.input;
      if (value.trim().length > 0) {
        this.history.push(value);
        if (this.history.length > HISTORY_LIMIT) {
          this.history.shift();
        }
      }
      this.historyIndex = -1;
      this.index = -1;
      this.showSuggestions = false;
      this.input = "";
      this.$emit("submit", value);
    },
    onEnter() {
      // enter accepts the highlighted suggestion, otherwise it runs the command
      if (this.showSuggestions && this.index >= 0) {
        this.accept(this.termSuggestions[this.index]);
        return;
      }
      this.submit();
    },
    next() {
      if (this.termSuggestions.length == 0) return;
      if (!this.showSuggestions) {
        this.showSuggestions = true;
        this.index = 0;
        // a single match needs no cycling, take it right away
        if (this.termSuggestions.length == 1) {
          this.accept(this.termSuggestions[0]);
        }
        return;
      }
      this.index = (this.index + 1) % this.termSuggestions.length;
    },
    accept(suggestion) {
      if (suggestion === undefined) return;
      this.input = this.getCompletedInput(this.input).concat(suggestion);
      this.index = -1;
      this.showSuggestions = false;
      this.$emit("input", this.input);
      this.focus();
    },
    dismiss() {
      this.index = -1;
      this.showSuggestions = false;
    },
    /* Everything up to and including the last space or separator, i.e. the
       part of the input that autocompletion must not overwrite. */
    getCompletedInput(input) {
      const last = Math.max(input.lastIndexOf(" "), input.lastIndexOf("/"));
      return last == -1 ? "" : input.substring(0, last + 1);
    },
    previousCommand() {
      if (this.history.length == 0) return;
      this.historyIndex =
        this.historyIndex == -1
          ? this.history.length - 1
          : Math.max(0, this.historyIndex - 1);
      this.input = this.history[this.historyIndex];
      this.$emit("input", this.input);
    },
    nextCommand() {
      if (this.historyIndex == -1) return;
      if (this.historyIndex >= this.history.length - 1) {
        this.historyIndex = -1;
        this.input = "";
      } else {
        this.historyIndex += 1;
        this.input = this.history[this.historyIndex];
      }
      this.$emit("input", this.input);
    },
  },
};
</script>

<style>
.prompt-input {
  flex: 1;
  min-width: 0;
}

.prompt-input form {
  display: block;
}

#input_field {
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  color: var(--fg);
  font-family: inherit;
  font-size: inherit;
  caret-color: var(--accent_2);
}
</style>

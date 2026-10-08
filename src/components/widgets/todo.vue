<template>
  <div class="todo-wrapper">
    <header class="todo-head">
      <span class="todo-title">todo</span>
      <span class="todo-count" v-if="todos.active.length">
        {{ todos.active.length }}
      </span>
      <button
        class="todo-done-toggle"
        v-if="todos.completed.length"
        :class="{ active: showCompleted }"
        v-on:click="showCompleted = !showCompleted"
      >
        <wm-icon name="archive" :size="12" />
        {{ todos.completed.length }} done
      </button>
    </header>

    <div class="todo-list">
      <p class="todo-empty" v-if="!todos.active.length && !showCompleted">
        nothing to do.<br />
        <span>write <code>name [tag]: description</code> below</span>
      </p>

      <div
        class="todo-entry"
        v-for="(task, index) in todos.active"
        v-bind:key="task.name + index"
      >
        <button
          class="todo-check"
          v-on:click="completeTask(index)"
          title="mark as done"
        >
          <wm-icon name="check" :size="12" />
        </button>
        <div class="todo-main">
          <span class="todo-name">{{ task.name }}</span>
          <span
            class="tag"
            v-for="(tag, tagIndex) in task.tags"
            v-bind:key="tag + tagIndex"
            v-bind:style="{ backgroundColor: getTagColor(tag) }"
            v-bind:class="{ picking: colorPickerActive && selectedTag === tag }"
            v-on:click="showColorPicker(tag)"
          >
            {{ tag }}
          </span>
        </div>
        <p class="todo-text" v-if="task.description">{{ task.description }}</p>
      </div>

      <template v-if="showCompleted">
        <div class="todo-divider">done</div>
        <div
          class="todo-entry completed"
          v-for="(task, index) in todos.completed"
          v-bind:key="'c' + task.name + index"
        >
          <button
            class="todo-check done"
            v-on:click="restoreTask(index)"
            title="put back"
          >
            <wm-icon name="check" :size="12" />
          </button>
          <div class="todo-main">
            <span class="todo-name">{{ task.name }}</span>
          </div>
        </div>
      </template>
    </div>

    <form class="todo-prompt" v-on:submit.prevent="addTask">
      <wm-icon name="plus" :size="13" />
      <input
        ref="input"
        v-model="input"
        v-on:keydown.enter.prevent="addTask"
        :placeholder="placeholder"
      />
    </form>

    <div class="color-picker" :class="{ open: colorPickerActive }">
      <span
        class="color"
        v-for="(color, index) in colors"
        v-bind:key="color + index"
        v-bind:style="{ backgroundColor: color }"
        v-on:click="setTagColor(color)"
      ></span>
    </div>
  </div>
</template>

<script>
import wmIcon from "../wm/icon";

export default {
  name: "todo",
  components: { wmIcon },
  data: function () {
    return {
      todos: {
        active: [],
        completed: [],
        tags: [],
      },
      input: "",
      placeholder: "task [tag, tag]: description",
      selectedTag: null,
      colorPickerActive: false,
      showCompleted: false,
      colors: [
        "var(--accent_1)",
        "var(--cyan)",
        "var(--blue)",
        "var(--green)",
        "var(--yellow)",
        "var(--orange)",
        "var(--red)",
        "var(--pink)",
        "var(--muted)",
      ],
    };
  },
  methods: {
    loadFromLocalStorage: function () {
      let stored;
      try {
        stored = JSON.parse(window.localStorage.getItem("todo"));
      } catch (e) {
        console.warn("invalid todo list in local storage, starting empty");
      }
      if (stored) {
        this.todos = {
          active: stored.active || [],
          completed: stored.completed || [],
          tags: stored.tags || [],
        };
      }
    },
    storeToLocalStorage: function () {
      try {
        localStorage.setItem("todo", JSON.stringify(this.todos));
      } catch (e) {
        console.error("could not write the todo list", e);
      }
    },
    findTag: function (name) {
      return this.todos.tags.filter((t) => t.name === name)[0];
    },
    getTagColor: function (tag) {
      // a tag can be missing from the list when the stored data is older
      const found = this.findTag(tag);
      return found ? found.color : "var(--muted)";
    },
    setTagColor: function (color) {
      const tag = this.findTag(this.selectedTag);
      if (tag) {
        tag.color = color;
        this.storeToLocalStorage();
      }
      this.colorPickerActive = false;
    },
    showColorPicker: function (tag) {
      if (this.colorPickerActive && this.selectedTag === tag) {
        this.colorPickerActive = false;
        return;
      }
      this.selectedTag = tag;
      this.colorPickerActive = true;
    },
    /* 'name [tag, tag]: description', where tags and description are optional */
    addTask: function () {
      const value = this.input.trim();
      if (value.length == 0) return;

      const separator = value.indexOf(":");
      const head = separator == -1 ? value : value.substr(0, separator);
      const description =
        separator == -1 ? "" : value.substr(separator + 1).trim();

      const task = {
        name: head.split("[")[0].trim(),
        description,
        tags: [],
      };
      if (task.name.length == 0) return;

      const tags = head.split("[")[1];
      if (tags) {
        task.tags = tags
          .replace("]", "")
          .split(/,\s*/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        this.addTagsIfNew(task.tags);
      }
      this.todos.active.push(task);
      this.input = "";
      this.storeToLocalStorage();
    },
    addTagsIfNew: function (tags) {
      const newTags = tags.filter((t) => !this.findTag(t));
      this.todos.tags = this.todos.tags.concat(
        newTags.map((t, index) => ({
          name: t,
          // give a new tag a colour straight away instead of a grey chip
          color: this.colors[(this.todos.tags.length + index) % this.colors.length],
        }))
      );
    },
    completeTask: function (index) {
      const task = this.todos.active.splice(index, 1)[0];
      if (task) this.todos.completed.push(task);
      // completing a task used to be lost on the next reload
      this.storeToLocalStorage();
    },
    restoreTask: function (index) {
      const task = this.todos.completed.splice(index, 1)[0];
      if (task) this.todos.active.push(task);
      this.storeToLocalStorage();
    },
  },
  mounted: function () {
    this.loadFromLocalStorage();
  },
};
</script>

<style>
.todo-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  font-size: 0.88rem;
}

.todo-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
}

.todo-title {
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.todo-count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--fg);
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
}

.todo-done-toggle {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 1px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: none;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.66rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.todo-done-toggle:hover,
.todo-done-toggle.active {
  color: var(--green);
  border-color: var(--green);
}

.todo-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.todo-empty {
  margin: 1.2rem 0;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.7;
  text-align: center;
}

.todo-empty span {
  opacity: 0.75;
  font-size: 0.72rem;
}

.todo-empty code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--surface);
  color: var(--accent_3);
}

.todo-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: 0.1rem 0.45rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--line);
}

.todo-entry:last-child {
  border-bottom: none;
}

.todo-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: none;
  color: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.todo-check:hover {
  border-color: var(--green);
  color: var(--green);
}

.todo-check.done {
  border-color: var(--green);
  background: var(--green);
  color: var(--bg);
}

.todo-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}

.todo-name {
  overflow-wrap: anywhere;
}

.todo-text {
  grid-column: 2;
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}

.todo-entry.completed .todo-name {
  color: var(--muted);
  text-decoration: line-through;
}

.todo-divider {
  margin: 0.8rem 0 0.3rem;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.7;
}

.tag {
  padding: 0 6px;
  border-radius: 999px;
  color: var(--bg);
  font-size: 0.66rem;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.tag.picking {
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px currentColor;
}

.todo-prompt {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  transition: color 0.16s ease;
}

.todo-prompt:focus-within {
  color: var(--green);
}

.todo-prompt input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  color: var(--fg);
  font-family: inherit;
  font-size: 0.82rem;
  caret-color: var(--accent_2);
}

.color-picker {
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.color-picker.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.color {
  height: 24px;
  flex-grow: 1;
  cursor: pointer;
  transition: flex-grow 0.15s ease;
}

.color:hover {
  flex-grow: 1.6;
}
</style>

<template>
  <div class="todo-wrapper">
    <div class="todo-title">todo</div>
    <div class="todo-list">
      <div
        class="todo-entry"
        v-for="(task, index) in todos.active"
        v-bind:key="task.name + index"
      >
        <div class="todo-main">
          <span class="todo-name">&gt; {{ task.name }}</span>
          <span
            class="tag"
            v-for="(tag, tagIndex) in task.tags"
            v-bind:key="tag + tagIndex"
            v-bind:style="{ 'background-color': getTagColor(tag) }"
            v-on:click="showColorPicker(tag)"
          >
            {{ tag }}
          </span>
        </div>
        <button class="todo-complete" v-on:click="completeTask(index)" title="done">
          <wm-icon name="check" :size="13" />
        </button>
        <div class="todo-text" v-if="task.description">{{ task.description }}</div>
      </div>
    </div>

    <form class="todo-prompt" v-on:submit.prevent="addTask">
      <span class="todo-prompt-label">{{ label }}</span>
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
        v-bind:style="{ 'background-color': color }"
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
      label: "add",
      placeholder: "task [tag, tog]: Do this thing finally",
      selectedTag: null,
      colorPickerActive: false,
      colors: [
        "var(--cyan)",
        "var(--blue)",
        "var(--blue)",
        "var(--orange)",
        "var(--yellow)",
        "var(--pink)",
        "var(--green)",
        "var(--red)",
        "var(--fg)",
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
      return found ? found.color : "var(--fg)";
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
      if (value.length == 0) {
        return;
      }
      const separator = value.indexOf(":");
      const head = separator == -1 ? value : value.substr(0, separator);
      const description =
        separator == -1 ? "" : value.substr(separator + 1).trim();

      const task = {
        name: head.split("[")[0].trim(),
        description: description,
        tags: [],
      };
      if (task.name.length == 0) {
        return;
      }

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
        newTags.map((t) => ({ name: t, color: "var(--fg)" }))
      );
    },
    completeTask: function (index) {
      const task = this.todos.active.splice(index, 1)[0];
      if (task) {
        this.todos.completed.push(task);
      }
      // completing a task used to be lost on the next reload
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

.todo-title {
  flex: none;
  margin-bottom: 0.7rem;
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.todo-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.todo-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.3rem 0.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--line);
}

.todo-name {
  color: var(--fg);
}

.todo-text {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  color: var(--muted);
}

.todo-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.todo-complete:hover {
  background: var(--green);
  color: var(--bg);
}

.tag {
  padding: 0 6px;
  border-radius: 999px;
  color: var(--bg);
  font-size: 0.66rem;
  cursor: pointer;
}

.todo-prompt {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--line);
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

.todo-prompt-label {
  flex: none;
  padding: 0 6px;
  border-radius: 5px;
  background: var(--green);
  color: var(--bg);
  font-size: 0.68rem;
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
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.color-picker.open {
  opacity: 1;
  pointer-events: auto;
}

.color {
  height: 22px;
  flex-grow: 1;
  cursor: pointer;
}
</style>

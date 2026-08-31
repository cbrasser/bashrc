<template>
  <div class="todo-wrapper">
    <div class="todo-title">todo</div>
    <div class="todo-list">
      <div
        class="todo-entry"
        v-for="(task, index) in todos.active"
        v-bind:key="task.name + index"
      >
        <div class="todo-name">&gt; {{ task.name }}</div>
        <div class="todo-tags">
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
        <div class="todo-complete" v-on:click="completeTask(index)" title="done">
          <i class="fas fa-check"></i>
        </div>
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
export default {
  name: "todo",
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
        "var(--darkblue)",
        "var(--orange)",
        "var(--yellow)",
        "var(--pink)",
        "var(--green)",
        "var(--red)",
        "var(--white)",
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
      return found ? found.color : "var(--white)";
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
        newTags.map((t) => ({ name: t, color: "var(--white)" }))
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
.todo-name,
.todo-tags,
.todo-complete {
  display: inline;
}

.todo-complete {
  float: right;
  cursor: pointer;
}

.todo-wrapper {
  opacity: 0.95;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  min-height: 0;
}

.todo-entry {
  margin-bottom: 0.5rem;
}

.todo-title {
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.todo-text {
  font-size: 0.8rem;
}

.tag {
  color: var(--dark);
  font-size: 0.8rem;
  padding: 0.1rem;
  cursor: pointer;
  margin-right: 0.3rem;
  border-radius: 3px;
}

.todo-prompt {
  display: flex;
  align-items: center;
  width: 100%;
  height: 22px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.todo-prompt input {
  flex-grow: 1;
  background: none;
  border: none;
  margin-left: 0.3rem;
  color: var(--fg);
  font-family: inherit;
}

.color-picker {
  display: flex;
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  transition: opacity 0.6s;
}

.color-picker.open {
  opacity: 1;
  pointer-events: auto;
}

.color {
  height: 20px;
  width: 40px;
  display: inline-block;
  cursor: pointer;
  flex-grow: 1;
}

.todo-prompt-label {
  margin-right: 0.2rem;
  padding: 0 0.2rem;
  background-color: var(--green);
  color: var(--dark);
}
</style>

<template>
  <ul id="suggestions" v-if="show && suggestions.length > 0">
    <li
      v-for="(sug, index) in suggestions"
      v-bind:class="{ activeSuggestion: index == suggestionIndex }"
      v-bind:key="sug + index"
      v-on:click="$emit('select', sug)"
      class="suggestion"
    >
      {{ sug }}
    </li>
  </ul>
</template>

<script>
export default {
  name: "suggestions",
  props: {
    suggestions: {
      type: Array,
      default: () => [],
    },
    suggestionIndex: Number,
    show: Boolean,
  },
};
</script>

<style>
#suggestions li {
  list-style: none;
  cursor: pointer;
}

#suggestions {
  column-count: 3;
  column-width: 100px;
  padding-left: 0;
  margin: 0;
}

.activeSuggestion {
  background-color: var(--accent_1);
  color: var(--bg);
}
</style>

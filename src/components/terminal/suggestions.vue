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
#suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0.45rem 0 0;
  padding: 0;
}

#suggestions li {
  list-style: none;
  cursor: pointer;
  padding: 1px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--muted);
  transition: all 0.14s ease;
}

#suggestions li:hover {
  color: var(--fg);
  border-color: var(--accent_1);
}

.activeSuggestion {
  background: var(--accent_1);
  border-color: var(--accent_1) !important;
  color: var(--bg) !important;
}
</style>

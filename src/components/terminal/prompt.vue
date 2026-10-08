<template>
  <div class="prompt-line">
    <span class="prompt-path">{{ wd }}</span>
    <span class="prompt-caret">❯</span>
    <prompt-input
      ref="input"
      v-on:input="$emit('input', $event)"
      v-on:submit="$emit('submit', $event)"
      v-bind:termSuggestions="suggestions"
    />
  </div>
</template>

<script>
import promptInput from "./prompt-input.vue";

export default {
  name: "prompt",
  components: { promptInput },
  props: {
    wd: String,
    suggestions: Array,
  },
};
</script>

<style>
.prompt-line {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  flex: none;
}

.prompt-path {
  flex: none;
  color: var(--accent_1);
  font-weight: 500;
}

.prompt-caret {
  flex: none;
  color: var(--green);
}
</style>

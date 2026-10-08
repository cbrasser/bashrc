<template>
  <div class="fm-prompt">
    <span class="label">{{ label }}</span>
    <input
      ref="input"
      v-model="input"
      v-on:keydown.enter.prevent.stop="onSubmit"
      v-on:keydown.esc.prevent.stop="$emit('cancel')"
      :type="type"
      :placeholder="placeholder"
      autocomplete="off"
      spellcheck="false"
    />
  </div>
</template>

<script>
export default {
  name: "prompt",
  data: function () {
    return {
      input: "",
    };
  },
  props: {
    label: String,
    type: String,
    placeholder: String,
  },
  methods: {
    onSubmit: function () {
      this.$emit("submit", this.input);
      this.input = "";
    },
  },
  mounted: function () {
    this.$refs.input.focus({ preventScroll: true });
  },
};
</script>

<style>
.fm-prompt {
  display: flex;
  width: 100%;
  align-items: center;
  font-size: 0.8rem;
}

.label {
  padding: 0 0.3rem;
  background-color: var(--green);
  color: var(--bg);
}

.fm-prompt input {
  flex-grow: 1;
  background: none;
  border: none;
  margin-left: 0.3rem;
  color: var(--fg);
  font-family: inherit;
  font-size: 0.8rem;
}
</style>

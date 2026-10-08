<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, index) in paths" :key="index" :d="d" />
    <circle
      v-if="circle"
      :cx="circle[0]"
      :cy="circle[1]"
      :r="circle[2]"
    />
  </svg>
</template>

<script>
/* A small inline icon set, so the page needs no icon font and no external
   request to render. */
const ICONS = {
  terminal: ['M4 17l6-5-6-5', 'M12 19h8'],
  folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
  todo: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6l1 1 2-2', 'M4 12l1 1 2-2', 'M4 18l1 1 2-2'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.2a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z'],
  keyboard: ['M3 6h18v12H3z', 'M7 10h.01', 'M11 10h.01', 'M15 10h.01', 'M8 14h8'],
  chevron: ['M6 9l6 6 6-6'],
  check: ['M4 12l5 5L20 6'],
  layers: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 14l9 5 9-5'],
  float: ['M4 4h11v11H4z', 'M9 9h11v11H9z'],
  expand: ['M4 9V4h5', 'M20 15v5h-5', 'M15 4h5v5', 'M9 20H4v-5'],
  sun: ['M12 4V2', 'M12 22v-2', 'M4 12H2', 'M22 12h-2', 'M5.6 5.6L4.2 4.2', 'M19.8 19.8l-1.4-1.4', 'M5.6 18.4l-1.4 1.4', 'M19.8 4.2l-1.4 1.4', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  cloud: ['M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 18z'],
  rain: ['M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 15', 'M8 19l-1 2', 'M12 19l-1 2', 'M16 19l-1 2'],
  snow: ['M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 15', 'M8 19h.01', 'M12 20h.01', 'M16 19h.01'],
  fog: ['M5 14a4 4 0 0 1 1-7.9A5 5 0 0 1 16 6a3.5 3.5 0 0 1 1 6.9', 'M4 17h16', 'M7 20h13'],
  bolt: ['M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 15', 'M13 13l-3 5h4l-2 4'],
  thermometer: ['M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z'],
  clock: ['M12 7v5l3 2'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: ['M4 7h16', 'M9 7V5h6v2', 'M6 7l1 13h10l1-13'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.5-4.5'],
};

const CIRCLES = {
  clock: [12, 12, 9],
};

export default {
  name: 'wmIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
  },
  computed: {
    paths() {
      return ICONS[this.name] || [];
    },
    circle() {
      return CIRCLES[this.name] || null;
    },
  },
};
</script>

<style>
.icon {
  flex: none;
  display: block;
}
</style>

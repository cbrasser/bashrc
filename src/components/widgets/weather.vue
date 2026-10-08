<template>
  <div class="weather">
    <div class="weather-head">
      <span class="weather-city">{{ city }}</span>
      <span class="weather-state" v-if="weatherData.main">{{ phrase }}</span>
    </div>

    <p class="weather-error" v-if="error">{{ error }}</p>

    <template v-else-if="weatherData.main">
      <div class="weather-body">
        <wm-icon :name="icon" :size="48" class="weather-icon" />
        <div class="weather-temp">
          <strong>{{ weatherData.temp }}°</strong>
          <span>feels like {{ weatherData.tempFeelsLike }}°</span>
        </div>
      </div>
    </template>

    <p class="weather-loading" v-else>loading…</p>
  </div>
</template>

<script>
import wmIcon from "../wm/icon";

/* WMO weather codes as used by open-meteo, mapped onto the few states the
   widget knows about. */
const WEATHER_CODES = {
  0: "Clear", 1: "Clear", 2: "Clouds", 3: "Clouds",
  45: "Fog", 48: "Fog",
  51: "Drizzle", 53: "Drizzle", 55: "Drizzle", 56: "Drizzle", 57: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Rain", 66: "Rain", 67: "Rain",
  71: "Snow", 73: "Snow", 75: "Snow", 77: "Snow",
  80: "Rain", 81: "Rain", 82: "Rain",
  85: "Snow", 86: "Snow",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

const PHRASES = {
  Clear: "sunny af",
  Clouds: "cloudy af",
  Fog: "foggy af",
  Drizzle: "drizzly af",
  Rain: "rainy af",
  Snow: "snowy af",
  Thunderstorm: "THUNDERSTORM",
};

const ICONS = {
  Clear: "sun",
  Clouds: "cloud",
  Fog: "fog",
  Drizzle: "rain",
  Rain: "rain",
  Snow: "snow",
  Thunderstorm: "bolt",
};

export default {
  name: "weather",
  components: { wmIcon },
  props: {
    city: String,
  },
  data() {
    return { weatherData: {}, error: "", timer: null };
  },
  computed: {
    phrase() {
      return PHRASES[this.weatherData.main] || "";
    },
    icon() {
      return ICONS[this.weatherData.main] || "cloud";
    },
  },
  watch: {
    // the city is bound to a text field, so wait for typing to settle
    city() {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.getWeatherData, 600);
    },
  },
  methods: {
    async getWeatherData() {
      if (!this.city) return;
      const city = this.city;
      try {
        const location = await this.geocode(city);
        if (!location) {
          this.error = `unknown city: ${city}`;
          this.weatherData = {};
          return;
        }
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&current=temperature_2m,apparent_temperature,weather_code`
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        // a slow answer for a previous city must not overwrite the current one
        if (city !== this.city) return;
        this.error = "";
        this.weatherData = {
          main: WEATHER_CODES[json.current.weather_code] || "Clouds",
          temp: Math.round(json.current.temperature_2m),
          tempFeelsLike: Math.round(json.current.apparent_temperature),
        };
      } catch (e) {
        console.error(e);
        this.error = "could not reach the weather service";
      }
    },
    async geocode(city) {
      const response = await fetch(
        "https://geocoding-api.open-meteo.com/v1/search" +
          `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      return json.results ? json.results[0] : null;
    },
  },
  mounted() {
    this.getWeatherData();
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  },
};
</script>

<style>
.weather {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.weather-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.weather-city {
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.weather-state {
  color: var(--accent_3);
  font-size: 0.78rem;
}

.weather-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  min-height: 0;
}

.weather-icon {
  color: var(--accent_1);
  flex: none;
}

.weather-temp {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.weather-temp strong {
  font-size: 2.1rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.weather-temp span {
  font-size: 0.72rem;
  color: var(--muted);
}

.weather-error {
  color: var(--red);
  font-size: 0.8rem;
}

.weather-loading {
  color: var(--muted);
  font-size: 0.8rem;
}
</style>

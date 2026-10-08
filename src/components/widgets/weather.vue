<template>
  <div class="weather">
    <header class="weather-head">
      <span class="weather-city">{{ city }}</span>
      <button
        class="weather-refresh"
        :class="{ spinning: loading }"
        title="refresh"
        v-on:click="getWeatherData"
      >
        <wm-icon name="refresh" :size="12" />
      </button>
    </header>

    <p class="weather-error" v-if="error">{{ error }}</p>

    <template v-else-if="current.main">
      <div class="weather-now">
        <wm-icon :name="iconFor(current.main)" :size="44" class="weather-icon" />
        <div class="weather-temp">
          <strong>{{ current.temp }}°</strong>
          <span class="weather-state">{{ phraseFor(current.main) }}</span>
        </div>
      </div>

      <div class="weather-facts">
        <span><i>feels</i>{{ current.feelsLike }}°</span>
        <span><i>wind</i>{{ current.wind }} km/h</span>
        <span><i>hum</i>{{ current.humidity }}%</span>
      </div>

      <div class="weather-forecast" v-if="forecast.length">
        <div class="forecast-day" v-for="day in forecast" :key="day.date">
          <span class="forecast-name">{{ day.label }}</span>
          <wm-icon :name="iconFor(day.main)" :size="16" />
          <span class="forecast-range">
            <b>{{ day.max }}°</b><i>{{ day.min }}°</i>
          </span>
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

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const REFRESH_MINUTES = 20;

export default {
  name: "weather",
  components: { wmIcon },
  props: {
    city: String,
  },
  data() {
    return {
      current: {},
      forecast: [],
      error: "",
      loading: false,
      debounce: null,
      interval: null,
    };
  },
  watch: {
    // the city is bound to a text field, so wait for typing to settle
    city() {
      clearTimeout(this.debounce);
      this.debounce = setTimeout(this.getWeatherData, 600);
    },
  },
  methods: {
    phraseFor(main) {
      return PHRASES[main] || "";
    },
    iconFor(main) {
      return ICONS[main] || "cloud";
    },
    async getWeatherData() {
      if (!this.city || this.loading) return;
      const city = this.city;
      this.loading = true;
      try {
        const location = await this.geocode(city);
        if (!location) {
          this.error = `unknown city: ${city}`;
          this.current = {};
          this.forecast = [];
          return;
        }
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${location.latitude}&longitude=${location.longitude}` +
            "&current=temperature_2m,apparent_temperature,weather_code," +
            "relative_humidity_2m,wind_speed_10m" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
            "&forecast_days=4&timezone=auto"
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        // a slow answer for a previous city must not overwrite the current one
        if (city !== this.city) return;

        this.error = "";
        this.current = {
          main: WEATHER_CODES[json.current.weather_code] || "Clouds",
          temp: Math.round(json.current.temperature_2m),
          feelsLike: Math.round(json.current.apparent_temperature),
          humidity: Math.round(json.current.relative_humidity_2m),
          wind: Math.round(json.current.wind_speed_10m),
        };
        this.forecast = this.buildForecast(json.daily);
      } catch (e) {
        console.error(e);
        this.error = "could not reach the weather service";
      } finally {
        this.loading = false;
      }
    },

    /* The daily block starts with today, which the big number already shows. */
    buildForecast(daily) {
      if (!daily || !daily.time) return [];
      return daily.time.slice(1).map((date, index) => ({
        date,
        label: DAYS[new Date(date).getDay()],
        main: WEATHER_CODES[daily.weather_code[index + 1]] || "Clouds",
        max: Math.round(daily.temperature_2m_max[index + 1]),
        min: Math.round(daily.temperature_2m_min[index + 1]),
      }));
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
    this.interval = setInterval(this.getWeatherData, REFRESH_MINUTES * 60000);
  },
  beforeDestroy() {
    clearTimeout(this.debounce);
    clearInterval(this.interval);
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
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.weather-city {
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-refresh {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.16s ease;
}

.weather:hover .weather-refresh {
  opacity: 1;
}

.weather-refresh:hover {
  background: var(--surface);
  color: var(--accent_1);
}

.weather-refresh.spinning {
  opacity: 1;
  animation: weather-spin 1s linear infinite;
}

@keyframes weather-spin {
  to {
    transform: rotate(360deg);
  }
}

.weather-now {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.weather-icon {
  flex: none;
  color: var(--accent_1);
}

.weather-temp {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}

.weather-temp strong {
  font-size: 2.2rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.weather-state {
  color: var(--accent_3);
  font-size: 0.76rem;
}

.weather-facts {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.9rem;
  padding: 0.4rem 0;
  font-size: 0.72rem;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.weather-facts i {
  margin-right: 0.35rem;
  color: var(--muted);
  font-style: normal;
}

.weather-forecast {
  flex: none;
  display: flex;
  gap: 0.3rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--line);
}

.forecast-day {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.35rem 0;
  border-radius: 8px;
  color: var(--muted);
  font-size: 0.68rem;
  transition: background 0.14s ease;
}

.forecast-day:hover {
  background: var(--surface);
}

.forecast-name {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.forecast-range {
  font-variant-numeric: tabular-nums;
}

.forecast-range b {
  color: var(--fg);
  font-weight: 500;
}

.forecast-range i {
  margin-left: 3px;
  font-style: normal;
  opacity: 0.6;
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

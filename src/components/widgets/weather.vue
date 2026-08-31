<template>
  <div class="weather-wrapper">
    <span class="d-block">{{ city }}</span>
    <span class="d-block error" v-if="error">{{ error }}</span>
    <template v-else-if="weatherData.main">
      <span class="d-block" v-if="weatherData.main === 'Rain'"
        ><i class="fas fa-cloud-showers-heavy"></i>rainy af</span
      >
      <span class="d-block" v-if="weatherData.main === 'Fog'"
        ><i class="fas fa-smog"></i>foggy af</span
      >
      <span class="d-block" v-if="weatherData.main === 'Snow'"
        ><i class="fas fa-snowflake"></i>snowy af</span
      >
      <span class="d-block" v-if="weatherData.main === 'Drizzle'"
        ><i class="fas fa-umbrella"></i>drizzly af</span
      >
      <span class="d-block" v-if="weatherData.main === 'Thunderstorm'"
        ><i class="fas fa-bolt"></i>THUNDERSTORM</span
      >
      <span class="d-block" v-if="weatherData.main === 'Clouds'"
        ><i class="fas fa-cloud"></i>cloudy af</span
      >
      <span class="d-block" v-if="weatherData.main === 'Clear'"
        ><i class="fas fa-sun"></i>sunny af</span
      >
      <span class="d-block">
        <i class="fas" :class="temperatureIcon"></i>{{ weatherData.temp }}°C
      </span>
      <span class="d-block"
        >Feels like {{ weatherData.tempFeelsLike }}°C though..</span
      >
    </template>
    <span class="d-block" v-else>loading..</span>
  </div>
</template>

<script>
/* WMO weather codes as used by open-meteo, mapped onto the categories the
   template knows about. */
const WEATHER_CODES = {
  0: "Clear",
  1: "Clear",
  2: "Clouds",
  3: "Clouds",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "Drizzle",
  57: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  66: "Rain",
  67: "Rain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  77: "Snow",
  80: "Rain",
  81: "Rain",
  82: "Rain",
  85: "Snow",
  86: "Snow",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export default {
  name: "weather",
  data: function () {
    return {
      weatherData: {},
      error: "",
      timer: null,
    };
  },
  props: {
    city: String,
  },
  watch: {
    // the city is bound to a text field, so wait for typing to settle
    city: function () {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.getWeatherData, 600);
    },
  },
  methods: {
    getWeatherData: async function () {
      if (!this.city) {
        return;
      }
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
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const json = await response.json();
        // a slow response for a previous city must not overwrite the current one
        if (city !== this.city) {
          return;
        }
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
    geocode: async function (city) {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const json = await response.json();
      return json.results ? json.results[0] : null;
    },
  },
  computed: {
    temperatureIcon() {
      if (this.weatherData.temp <= 10) return "fa-temperature-low";
      if (this.weatherData.temp <= 20) return "fa-thermometer-half";
      return "fa-temperature-high";
    },
  },
  mounted: function () {
    this.getWeatherData();
  },
  beforeDestroy: function () {
    clearTimeout(this.timer);
  },
};
</script>

<style>
.weather-wrapper {
  opacity: 0.95;
}

.weather-wrapper span {
  margin-bottom: 1rem;
}

.weather-wrapper span i {
  margin-right: 1rem;
}

.weather-wrapper .error {
  color: var(--red);
}

.d-block {
  display: block;
}
</style>

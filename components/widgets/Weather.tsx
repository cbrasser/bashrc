'use client';

import { useState, useEffect } from 'react';

interface WeatherProps {
  city: string;
}

interface WeatherData {
  main: string;
  weather: string;
  icon: string;
  temp: number;
  tempFeelsLike: number;
}

export default function Weather({ city }: WeatherProps) {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    main: '',
    weather: '',
    icon: '',
    temp: 0,
    tempFeelsLike: 0,
  });

  useEffect(() => {
    getWeatherData();
  }, [city]);

  const getWeatherData = () => {
    // API call is commented out in original, so we'll leave it as placeholder
    // callAPI(city, parseData);
  };

  const callAPI = (city: string, callback: (json: any) => void) => {
    // TODO: Fix API Call
    // Original code had this commented out:
    // $.getJSON(
    //   `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=12689f13c28873a6559ba14ec01f3392`,
    //   callback
    // );
  };

  const parseData = (json: any) => {
    const temp: WeatherData = {
      main: json.weather[0].main,
      weather: json.weather[0].description,
      icon: json.weather[0].icon,
      temp: parseFloat(json.main.temp),
      tempFeelsLike: json.main.feels_like,
    };
    setWeatherData(temp);
  };

  const getWeatherIcon = (main: string) => {
    const icons: Record<string, string> = {
      Rain: 'fa-cloud-showers-heavy',
      Fog: 'fa-smog',
      Snow: 'fa-snowflake',
      Drizzle: 'fa-umbrella',
      Thunderstorm: 'far fa-bolt',
      Clouds: 'fa-cloud',
      Clear: 'far fa-sun',
    };
    return icons[main] || 'fa-question';
  };

  const getTempIcon = (temp: number) => {
    if (temp <= 10) return 'fa-temperature-low';
    if (temp > 10 && temp <= 20) return 'fa-temperature-half';
    return 'fa-thermometer-high';
  };

  return (
    <div className="weather-wrapper w-full h-full bg-[var(--bg)] rounded-lg p-4" style={{ opacity: 0.95, color: 'var(--fg)' }}>
      <span className="d-block" style={{ display: 'block', marginBottom: '1rem' }}>
        {city}
      </span>
      {weatherData.main && (
        <>
          <span className="d-block" style={{ display: 'block', marginBottom: '1rem' }}>
            <i className={`fas ${getWeatherIcon(weatherData.main)}`} style={{ marginRight: '1rem' }}></i>
            {weatherData.main === 'Rain' && 'rainy af'}
            {weatherData.main === 'Fog' && 'foggy af'}
            {weatherData.main === 'Snow' && 'snowy af'}
            {weatherData.main === 'Drizzle' && 'drizzly af'}
            {weatherData.main === 'Thunderstorm' && 'THUNDERSTORM'}
            {weatherData.main === 'Clouds' && 'cloudy af'}
            {weatherData.main === 'Clear' && 'sunny af'}
          </span>
          {weatherData.temp > 0 && (
            <span className="d-block" style={{ display: 'block', marginBottom: '1rem' }}>
              <i className={`fas ${getTempIcon(weatherData.temp)}`} style={{ marginRight: '1rem' }}></i>
              {weatherData.temp}
            </span>
          )}
          {weatherData.tempFeelsLike > 0 && (
            <span className="d-block" style={{ display: 'block', marginBottom: '1rem' }}>
              Feels like {weatherData.tempFeelsLike} though..
            </span>
          )}
        </>
      )}
    </div>
  );
}

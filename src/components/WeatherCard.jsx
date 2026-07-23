import { useEffect, useState } from "react";

const OFFICE_LATITUDE = 43.6532;
const OFFICE_LONGITUDE = -79.3832;
const OFFICE_LOCATION_LABEL = "Demo Office";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function getWeatherDetails(weatherCode, isDay) {
  const conditions = {
    0: {
      label: isDay ? "Clear sky" : "Clear night",
      icon: isDay ? "☀️" : "🌙",
    },
    1: { label: "Mainly clear", icon: isDay ? "🌤️" : "🌙" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Foggy", icon: "🌫️" },
    48: { label: "Foggy", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy drizzle", icon: "🌧️" },
    56: { label: "Freezing drizzle", icon: "🌧️" },
    57: { label: "Freezing drizzle", icon: "🌧️" },
    61: { label: "Light rain", icon: "🌦️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "🌧️" },
    66: { label: "Freezing rain", icon: "🌧️" },
    67: { label: "Heavy freezing rain", icon: "🌧️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Snow", icon: "🌨️" },
    75: { label: "Heavy snow", icon: "❄️" },
    77: { label: "Snow grains", icon: "❄️" },
    80: { label: "Rain showers", icon: "🌦️" },
    81: { label: "Rain showers", icon: "🌧️" },
    82: { label: "Heavy rain showers", icon: "⛈️" },
    85: { label: "Snow showers", icon: "🌨️" },
    86: { label: "Heavy snow showers", icon: "❄️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm with hail", icon: "⛈️" },
    99: { label: "Severe thunderstorm", icon: "⛈️" },
  };

  return (
    conditions[weatherCode] || {
      label: "Current conditions",
      icon: "🌤️",
    }
  );
}

function formatUpdatedTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        setError("");

        const params = new URLSearchParams({
          latitude: String(OFFICE_LATITUDE),
          longitude: String(OFFICE_LONGITUDE),
          current:
            "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,is_day",
          daily: "temperature_2m_max,temperature_2m_min",
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
          precipitation_unit: "mm",
          timezone: "America/Toronto",
          forecast_days: "1",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`Weather service error (${response.status})`);
        }

        const data = await response.json();

        if (!data.current) {
          throw new Error("Current weather data was not returned.");
        }

        if (!isMounted) return;

        setWeather({
          currentTemperature: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          weatherCode: data.current.weather_code,
          windSpeed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          isDay: data.current.is_day === 1,
          high: data.daily?.temperature_2m_max?.[0],
          low: data.daily?.temperature_2m_min?.[0],
          updatedAt: new Date(),
        });
      } catch (weatherError) {
        if (isMounted) {
          console.error("Weather load failed:", weatherError);
          setError(
            weatherError.message || "Weather is temporarily unavailable.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWeather();

    const refreshTimer = window.setInterval(loadWeather, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const condition = weather
    ? getWeatherDetails(weather.weatherCode, weather.isDay)
    : null;

  return (
    <section className="panel-card weather-card">
      <div className="panel-card-head">
        <div>
          <h3>Office Weather</h3>
          <p className="weather-location">{OFFICE_LOCATION_LABEL}</p>
        </div>
        <span className="badge neutral">Live</span>
      </div>

      {isLoading && (
        <div className="weather-loading">
          <span className="weather-loading-icon">🌤️</span>
          <p>Loading current conditions...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="weather-error">
          <span>🌦️</span>
          <div>
            <strong>Weather unavailable</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && weather && condition && (
        <>
          <div className="weather-current">
            <span className="weather-icon" aria-hidden="true">
              {condition.icon}
            </span>

            <div className="weather-temperature">
              <strong>{Math.round(weather.currentTemperature)}°</strong>
              <span>C</span>
            </div>

            <div className="weather-condition">
              <strong>{condition.label}</strong>
              <span>Feels like {Math.round(weather.feelsLike)}°C</span>
            </div>
          </div>

          <div className="weather-details">
            <div>
              <span>Wind</span>
              <strong>{Math.round(weather.windSpeed)} km/h</strong>
            </div>

            <div>
              <span>Precipitation</span>
              <strong>{weather.precipitation ?? 0} mm</strong>
            </div>

            <div>
              <span>High / Low</span>
              <strong>
                {Math.round(weather.high)}° / {Math.round(weather.low)}°
              </strong>
            </div>
          </div>

          <p className="weather-updated">
            Updated {formatUpdatedTime(weather.updatedAt)}
          </p>
        </>
      )}
    </section>
  );
}

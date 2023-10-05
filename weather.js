const apiKeys = ['cdb1c859d84dc95a6cbf36c77df16cb0', '9fada2daaf6f377a750698a49f4d5a61'];
let apiKeyIndex = 0;

const city = 'Kingston';
const country = 'CA';

async function fetchWeatherData() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKeys[apiKeyIndex]}&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayWeatherData(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        // Switch to the other API key and try fetching the data again
        apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
        fetchWeatherData();
    }
}

function displayWeatherData(data) {
    const weatherSection = document.getElementById('weather-data');
    const weatherInfo = `
        <div class="weather-info">
            <p><strong>Temperature:</strong> ${data.main.temp} °C</p>
            <p><strong>Weather:</strong> ${data.weather[0].description}</p>
            <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
            <p><strong>Humidity:</strong> ${data.main.humidity} %</p>
        </div>
    `;
    weatherSection.innerHTML = weatherInfo;
}

fetchWeatherData();

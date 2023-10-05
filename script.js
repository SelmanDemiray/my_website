const apiKey = "YOUR_API_KEY";

async function getWeather() {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Kingston,JM&appid=${apiKey}`);
    const data = await response.json();
    displayWeather(data);
}

function displayWeather(data) {
    const weatherSection = document.getElementById('weather-data');
    const temperature = (data.main.temp - 273.15).toFixed(2);  // Convert Kelvin to Celsius
    const weatherDescription = data.weather[0].description;
    weatherSection.innerHTML = `
        <h2>Temperature: ${temperature}°C</h2>
        <h3>Weather: ${weatherDescription}</h3>
    `;
}

window.onload = getWeather;  // Fetch and display weather data when the page loads

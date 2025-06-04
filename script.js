// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered successfully'))
            .catch(error => console.log('SW registration failed:', error));
    });
}

let userLocation = null;

// Mock data for demonstration - in a real app, you'd use Google Places API
const mockSkateparks = [
    {
        name: "South Bank Skate Space",
        address: "Queen's Walk, London SE1 9PP",
        lat: 51.5074,
        lng: -0.1278,
        cost: "Free",
        rating: 4.5,
        reviewCount: 324,
        reviews: [
            { text: "Iconic spot with amazing views of the Thames!", author: "SkaterDude123" },
            { text: "Gets crowded but the atmosphere is unbeatable", author: "BoardMaster" }
        ]
    },
    {
        name: "House of Vans London",
        address: "The Old Vic Tunnels, London SE1 8LZ",
        lat: 51.5033,
        lng: -0.1195,
        cost: "Free (events)",
        rating: 4.7,
        reviewCount: 189,
        reviews: [
            { text: "Amazing indoor park with great events", author: "VansLover" },
            { text: "Perfect for rainy days, excellent bowls", author: "BowlRider" }
        ]
    },
    {
        name: "Meanwhile Gardens Skatepark",
        address: "Meanwhile Gardens, London W10 6DX",
        lat: 51.5241,
        lng: -0.2097,
        cost: "Free",
        rating: 4.2,
        reviewCount: 156,
        reviews: [
            { text: "Classic concrete bowls, old school vibes", author: "OldSchoolSkater" },
            { text: "Great for bowl skating, can get busy", author: "ConcreteKing" }
        ]
    },
    {
        name: "Stockwell Skatepark",
        address: "Stockwell Park Walk, London SW9 0DA",
        lat: 51.4720,
        lng: -0.1226,
        cost: "Free",
        rating: 4.4,
        reviewCount: 267,
        reviews: [
            { text: "One of the best street courses in London", author: "StreetSkater" },
            { text: "Excellent for technical skating", author: "TechMaster" }
        ]
    }
];

async function getCurrentLocation() {
    const btn = document.getElementById('locationBtn');
    btn.textContent = '📍 Getting Location...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser');
        btn.textContent = '📍 Use My Location';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update input with reverse geocoded address
            try {
                const address = await reverseGeocode(userLocation.lat, userLocation.lng);
                document.getElementById('locationInput').value = address;
            } catch (e) {
                document.getElementById('locationInput').value = `${userLocation.lat}, ${userLocation.lng}`;
            }
            
            btn.textContent = '📍 Use My Location';
            btn.disabled = false;
            searchSkateparks();
        },
        (error) => {
            showError('Unable to get your location: ' + error.message);
            btn.textContent = '📍 Use My Location';
            btn.disabled = false;
        }
    );
}

async function reverseGeocode(lat, lng) {
    // In a real app, you'd use Google Geocoding API
    // For demo, return a mock address
    return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

async function searchSkateparks() {
    const location = document.getElementById('locationInput').value.trim();
    if (!location) {
        showError('Please enter a location');
        return;
    }

    showLoading(true);
    hideError();

    try {
        // Get coordinates for the location
        if (!userLocation) {
            userLocation = await geocodeLocation(location);
        }

        // Get skateparks (using mock data for demo)
        const skateparks = await findNearbySkaterparks(userLocation);
        
        // Get weather data for each skatepark
        const skaterparksWithWeather = await Promise.all(
            skateparks.map(async (park) => {
                const weather = await getWeatherData(park.lat, park.lng);
                return { ...park, weather };
            })
        );

        displaySkateparks(skaterparksWithWeather);
    } catch (error) {
        showError('Error finding skateparks: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function geocodeLocation(location) {
    // In a real app, you'd use Google Geocoding API
    // For demo, return coordinates for Croydon
    return { lat: 51.3762, lng: -0.0982 };
}

async function findNearbySkaterparks(location) {
    // In a real app, you'd use Google Places API
    // For demo, return mock data with calculated distances
    const skaterparksWithDistance = mockSkateparks.map(park => ({
        ...park,
        distance: calculateDistance(location.lat, location.lng, park.lat, park.lng)
    }));
    
    // Always sort by distance (closest first)
    return skaterparksWithDistance.sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function getWeatherData(lat, lng) {
    // In a real app, you'd use OpenWeatherMap or similar API
    // For demo, return mock weather data
    const temperatures = [8, 12, 15, 18, 22, 19, 14, 11];
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Light Rain', 'Overcast'];
    
    return {
        today: {
            temp: temperatures[Math.floor(Math.random() * temperatures.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)]
        },
        yesterday: {
            temp: temperatures[Math.floor(Math.random() * temperatures.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)]
        }
    };
}

function displaySkateparks(skateparks) {
    const container = document.getElementById('skateparks');
    container.innerHTML = '';

    if (skateparks.length === 0) {
        container.innerHTML = '<div class="loading"><p class="body-large">No skateparks found in your area</p></div>';
        return;
    }

    skateparks.forEach(park => {
        const card = createSkateparkCard(park);
        container.appendChild(card);
    });
}

function createSkateparkCard(park) {
    const card = document.createElement('div');
    card.className = 'skatepark-card';

    const stars = '★'.repeat(Math.floor(park.rating)) + '☆'.repeat(5 - Math.floor(park.rating));
    const costClass = park.cost.toLowerCase().includes('free') ? 'cost-free' : 'cost-paid';

    card.innerHTML = `
        <div class="card-header">
            <h3 class="title-large skatepark-name">${park.name}</h3>
            <span class="distance-badge">${park.distance.toFixed(1)} km away</span>
        </div>
        
        <div class="card-content">
            <div class="info-section">
                <h4 class="title-medium">Weather</h4>
                <div class="weather-grid">
                    <div class="weather-item">
                        <div class="label-medium">Today</div>
                        <div class="weather-temp">${park.weather.today.temp}°C</div>
                        <div class="body-medium">${park.weather.today.condition}</div>
                    </div>
                    <div class="weather-item">
                        <div class="label-medium">Yesterday</div>
                        <div class="weather-temp">${park.weather.yesterday.temp}°C</div>
                        <div class="body-medium">${park.weather.yesterday.condition}</div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4 class="title-medium">Cost</h4>
                <p class="body-large ${costClass}">${park.cost}</p>
            </div>

            <div class="reviews-section">
                <div class="rating">
                    <span class="stars">${stars}</span>
                    <span class="body-medium">${park.rating}/5 (${park.reviewCount} reviews)</span>
                </div>
                ${park.reviews.map(review => `
                    <div class="review-text body-medium">"${review.text}"</div>
                    <div class="label-medium">- ${review.author}</div>
                `).join('')}
            </div>
        </div>

        <div class="card-actions">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(park.address)}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="directions-btn">
                🗺️ Get Directions
            </a>
        </div>
    `;

    return card;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

// Allow Enter key to trigger search
document.getElementById('locationInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSkateparks();
    }
});

// Auto-search on page load
window.addEventListener('load', () => {
    searchSkateparks();
});

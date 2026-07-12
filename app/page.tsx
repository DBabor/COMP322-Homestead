"use client";

import { useState, useEffect } from 'react';

export default function AgriTechDashboard() {
  const [crops, setCrops] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [locationHeader, setLocationHeader] = useState('Greensboro');
  const [forecastDays, setForecastDays] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState('Loading outlook');
  const [alerts, setAlerts] = useState([]);
  
  const [cropName, setCropName] = useState('');
  const [growthTime, setGrowthTime] = useState('');
  const [cropYield, setCropYield] = useState('');
  const [frost, setFrost] = useState('No');
  const [drought, setDrought] = useState('No');

  const API_KEY = "24d0200f0eb8e09af866e15c198adcfe";
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetch("/api/crops")
      .then(res => res.json())
      .then(data => setCrops(data || []))
      .catch(err => console.error(err));

    fetchForecast("Greensboro");
  }, []);

  async function fetchForecast(location: string) {
    if (!location) return;
    setWeatherLoading("Loading weather data");
    setAlerts([]); 

    try {
      const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`;
      const geoResponse = await fetch(geoURL);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) throw new Error("Location not found");

      const { lat, lon, name, state } = geoData[0];
      setLocationHeader(`${name}${state ? `, ${state}` : ""}`);

      const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
      const response = await fetch(forecastURL);
      if (!response.ok) throw new Error("Can't get weather");

      const data = await response.json();
      const dailyData: Record<string, any> = {};

      data.list.forEach((item: any) => {
        const dateKey = item.dt_txt.split(" ")[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            temps: [],
            conditions: [],
            rawDate: new Date(item.dt * 1000)
          };
        }
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].conditions.push({
          main: item.weather[0].main,
          description: item.weather[0].description
        });
      });

      let freezeWarning = false;
      let countDrought = 0;
      const daysArray = Object.keys(dailyData).slice(0, 5);
      
      const computedDays = daysArray.map(dateKey => {
        const dayInfo = dailyData[dateKey];
        const maxTemp = Math.round(Math.max(...dayInfo.temps));
        const minTemp = Math.round(Math.min(...dayInfo.temps));
        const midIndex = Math.floor(dayInfo.conditions.length / 2);
        const mainCondition = dayInfo.conditions[midIndex].main;
        const conditionDesc = dayInfo.conditions[midIndex].description;

        if (minTemp <= 32) freezeWarning = true;
        if (mainCondition === "Clear" && maxTemp > 85) countDrought++;

        return {
          dayName: weekDays[dayInfo.rawDate.getDay()],
          month: dayInfo.rawDate.getMonth() + 1,
          date: dayInfo.rawDate.getDate(),
          maxTemp,
          minTemp,
          conditionDesc,
          isFreezing: minTemp <= 32
        };
      });

      setForecastDays(computedDays);
      setWeatherLoading('');

      if (freezeWarning) {
        addAlert("FREEZE WARNING: Bring in or cover frost susceptible plants", "freeze");
      }
      if (countDrought >= 2) {
        addAlert("DROUGHT WARNING: Set up irrigation systems", "drought");
      }

    } catch (error) {
      setWeatherLoading(`Could not load "${location}".`);
      setLocationHeader("Error");
    }
  }

  const addAlert = (message: string, type: string) => {
    setAlerts(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
  };

  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = cropName.trim();
    const time = growthTime.trim();
    const yieldValue = cropYield.trim();

    if (!name || !time || !yieldValue) {
      alert("FILL OUT ALL FIELDS");
      return;
    }

    const cropData = { name, time, yield: yieldValue, frost, drought };

    const res = await fetch("/api/crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cropData)
    });

    if (res.ok) {
      const newCrop = await res.json();
      setCrops(prev => [...prev, newCrop]);
      setCropName('');
      setGrowthTime('');
      setCropYield('');
      setFrost('No');
      setDrought('No');
    }
  };

  const handleCropDelete = async (id: number) => {
    const res = await fetch(`/api/crops/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCrops(prev => prev.filter((crop: any) => crop.id !== id));
    } else {
      alert("Could not delete from server");
    }
  };

  return (
    <div>
      <header>
        <h1>Agri-Tech</h1>
      </header>

      <main className="siteLayout">
        <div id="alertContainer" className="alertContainer">
          {alerts.map(alert => (
            <div key={alert.id} className={`farmAlert alert-${alert.type}`}>
              <span>{alert.message}</span>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: 'inherit' }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <section className="weatherInsert">
          <h3>Local Weather</h3>
          <div className="weatherSearch">
            <input 
              type="text" 
              id="locationInput" 
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchForecast(locationInput)}
              placeholder="EX: Greensboro, NC" 
            />
            <button id="weatherButton" onClick={() => fetchForecast(locationInput)}>Search</button>
          </div>
          <div id="weatherDisplay">
            <div id="locationHeader" style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '1rem' }}>
              {locationHeader}
            </div>
            {weatherLoading ? (
              <div id="forecastContainer" className="forecastGrid">{weatherLoading}</div>
            ) : (
              <div id="forecastContainer" className="forecastGrid">
                {forecastDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className="forecastDay" 
                    style={day.isFreezing ? { backgroundColor: '#fff0f0', borderColor: '#ffcccc' } : {}}
                  >
                    <span className="dateLabel">{day.dayName} ({day.month}/{day.date})</span>
                    <span className="tempRange" style={{ fontSize: '1rem' }}>
                      <span style={{ color: '#c0392b', fontWeight: 'bold' }}>{day.maxTemp}°</span> / <span style={{ color: '#2980b9' }}>{day.minTemp}°F</span>
                    </span>
                    <span className="conditionLabel">{day.conditionDesc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="form">
          <form id="cropForm" onSubmit={handleCropSubmit}>
            <label htmlFor="cropName">Crop Name:</label>
            <input type="text" id="cropName" value={cropName} onChange={e => setCropName(e.target.value)} placeholder="EX: Lettuce" />

            <label htmlFor="growthTime">Growth Time (days):</label>
            <input type="text" id="growthTime" value={growthTime} onChange={e => setGrowthTime(e.target.value)} placeholder="EX: 75" />

            <label htmlFor="cropYield">Crop Yield (lbs):</label>
            <input type="text" id="cropYield" value={cropYield} onChange={e => setCropYield(e.target.value)} placeholder="EX: 120" />

            <label>Frost Susceptible:</label>
            <div className="radioGroup">
              <input type="radio" id="frostYes" name="frost" value="Yes" checked={frost === "Yes"} onChange={e => setFrost(e.target.value)} />
              <label htmlFor="frostYes">Yes</label>
              <input type="radio" id="frostNo" name="frost" value="No" checked={frost === "No"} onChange={e => setFrost(e.target.value)} />
              <label htmlFor="frostNo">No</label>
            </div>

            <label>Drought Susceptible:</label>
            <div className="radioGroup">
              <input type="radio" id="droughtYes" name="drought" value="Yes" checked={drought === "Yes"} onChange={e => setDrought(e.target.value)} />
              <label htmlFor="droughtYes">Yes</label>
              <input type="radio" id="droughtNo" name="drought" value="No" checked={drought === "No"} onChange={e => setDrought(e.target.value)} />
              <label htmlFor="droughtNo">No</label>
            </div>

            <input type="submit" value="Submit" style={{ cursor: 'pointer' }} />
          </form>
        </section>

        <section className="table">
          <table id="cropTable">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Growth Time (days)</th>
                <th>Yield (lbs)</th>
                <th>Frost Susceptible</th>
                <th>Drought Susceptible</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {crops.length === 0 ? (
                <tr className="emptyTable">
                  <td colSpan={6} style={{ color: '#888', fontStyle: 'italic', padding: '20px' }}>
                    No crops added, use the form to track your crop cycles
                  </td>
                </tr>
              ) : (
                crops.map((crop: any) => (
                  <tr key={crop.id}>
                    <td>{crop.name}</td>
                    <td>{crop.time}</td>
                    <td>{crop.yield} lbs</td>
                    <td>{crop.frost}</td>
                    <td>{crop.drought}</td>
                    <td>
                      <button 
                        onClick={() => handleCropDelete(crop.id)} 
                        style={{ color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
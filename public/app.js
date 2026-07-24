/*Server Crop Tracker*/
document.addEventListener("DOMContentLoaded", () => {
    const cropForm = document.getElementById("cropForm");
    const tableBody = document.querySelector("#cropTable tbody");

    fetch("/api/crops")
        .then(res => res.json())
        .then(savedCrops => {
            if (Array.isArray(savedCrops)) {
                savedCrops.forEach(crop => {
                    renderCropRow(crop.id, crop.name, crop.time, crop.yield, crop.frost, crop.drought);
                });
            }
        });

    function renderCropRow(id, name, time, cropYield, frost, drought) {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-id", id);
        newRow.innerHTML = `
        <td>${name}</td>
        <td>${time}</td>
        <td>$${cropYield}</td>
        <td>${frost}</td>
        <td>${drought}</td>
        <td><button class="deleteButton">Delete</button></td>`;
        const emptyRow = tableBody.querySelector(".emptyTable");
        tableBody.insertBefore(newRow, emptyRow);
    }

    cropForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("cropName").value.trim();
        const time = document.getElementById("growthTime").value.trim();
        const cropYield = document.getElementById("cropYield").value.trim();

        const frostRadio = document.querySelector("input[name='frostSusceptible']:checked");
        const droughtRadio = document.querySelector("input[name='droughtSusceptible']:checked");
        const frost = frostRadio ? frostRadio.value : "No";
        const drought = droughtRadio ? droughtRadio.value : "No";

        if (!name || !time || !cropYield) {
            alert("FILL OUT ALL FIELDS");
            return;
        }

        const cropData = { name, time, yield: cropYield, frost, drought };

        fetch("/api/crops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cropData)
        })
            .then(res => res.json())
            .then(newCrop => {
                renderCropRow(newCrop.id, name, time, cropYield, frost, drought);
                cropForm.reset();
            });
    });

    tableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("deleteButton")) {
            const row = event.target.closest("tr");
            const cropID = row.getAttribute("data-id");

            fetch(`/api/crops/${cropID}`, { method: "DELETE" })
                .then(res => {
                    if (res.ok) {
                        row.remove();
                    }
                    else {
                        alert("Could not delete from server");
                    }
                });
        }
    });

    const locationHeader = document.getElementById("locationHeader");
    const forecastContainer = document.getElementById("forecastContainer");
    const locationInput = document.getElementById("locationInput");
    const weatherButton = document.getElementById("weatherButton");

    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    async function fetchForecast(location) {
        if (!location) return;

        forecastContainer.innerHTML = "Loading weather data...";

        const alertContainer = document.getElementById("alertContainer");
        if (alertContainer) alertContainer.innerHTML = "";

        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Can't get weather");
            }

            locationHeader.textContent = data.locationName;
            forecastContainer.innerHTML = "";

            const dailyData = {};

            data.list.forEach(item => {
                const [dateStr] = item.dt_txt.split(" ");
                
                if (!dailyData[dateStr]) {
                    const [year, month, day] = dateStr.split("-").map(Number);
                    const parsedDate = new Date(year, month - 1, day);

                    dailyData[dateStr] = {
                        temps: [],
                        conditions: [],
                        rawDate: parsedDate
                    };
                }

                dailyData[dateStr].temps.push(item.main.temp);
                dailyData[dateStr].conditions.push({
                    main: item.weather[0].main,
                    description: item.weather[0].description
                });
            });

            fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location })
            }).catch(err => console.warn("Failed to persist location history:", err));

            let freezeWarning = false;
            let countDrought = 0;
            const daysArray = Object.keys(dailyData).slice(0, 5);

            daysArray.forEach(dateKey => {
                const dayInfo = dailyData[dateKey];

                const maxTemp = Math.round(Math.max(...dayInfo.temps));
                const minTemp = Math.round(Math.min(...dayInfo.temps));

                const midIndex = Math.floor(dayInfo.conditions.length / 2);
                const mainCondition = dayInfo.conditions[midIndex].main;
                const conditionDesc = dayInfo.conditions[midIndex].description;

                if (minTemp <= 32) freezeWarning = true;
                if (mainCondition === "Clear" && maxTemp > 85) countDrought++;

                const dayName = weekDays[dayInfo.rawDate.getDay()];
                const dayRow = document.createElement("div");
                dayRow.className = "forecastDay";

                if (minTemp <= 32) {
                    dayRow.style.backgroundColor = "#fff0f0";
                    dayRow.style.borderColor = "#ffcccc";
                }

                dayRow.innerHTML = `
                <span class="dataLabel">${dayName} (${dayInfo.rawDate.getMonth() + 1}/${dayInfo.rawDate.getDate()})</span>
                <span class="tempRange" style="font-size: 1rem;">
                    <span style="color: #c0392b; font-weight: bold;">${maxTemp}°</span> /
                    <span style="color: #2980b9;">${minTemp}°F</span>
                </span>
                <span class="conditionLabel">${conditionDesc}</span>`;

                forecastContainer.appendChild(dayRow);
            });

            if (freezeWarning) {
                showAlert("FREEZE WARNING: Bring in or cover frost-susceptible plants", "freeze");
            }

            if (countDrought >= 2) {
                showAlert("DROUGHT WARNING: Set up irrigation systems", "drought");
            }

        } catch (error) {
            console.error("Weather tracker error:", error);
            forecastContainer.innerHTML = `<span style="color: #ff6b6b; font-size: 1rem;">Could not load "${location}".</span>`;
            locationHeader.textContent = "Error";
        }
    }

    function showAlert(message, type) {
        const alertContainer = document.getElementById("alertContainer");
        if (!alertContainer) return;

        const alertDiv = document.createElement("div");
        alertDiv.className = `farmAlert alert-${type}`;
        alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alertClose">&times;</button>`;

        alertDiv.querySelector(".alertClose").addEventListener("click", () => {
            alertDiv.remove();
        });
        alertContainer.appendChild(alertDiv);
    }

    weatherButton.addEventListener("click", () => {
        const targetLocation = locationInput.value.trim();
        fetchForecast(targetLocation);
    });

    locationInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const targetLocation = locationInput.value.trim();
            fetchForecast(targetLocation);
        }
    });

    fetch("/api/location")
        .then(res => res.json())
        .then(data => {
            if (data && data.lastLocation) {
                fetchForecast(data.lastLocation);
            } else {
                fetchForecast("Greensboro");
            }
        })
        .catch(() => fetchForecast("Greensboro"));
});
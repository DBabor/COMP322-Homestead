/*Local Storage crop tracker*/
document.addEventListener("DOMContentLoaded", () => { // Waits until the docs DOM is parsed before running the script
    const cropForm = document.getElementById("cropForm");
    const tableBody = document.querySelector("#cropTable tbody"); // Selects the crop table body

    //Replaces the local save, fetches data from the server on page load
    fetch("/api/crops")
        .then(res => res.json()) //Converts server response into JSON
        .then(savedCrops => {
            //Go through all of the crops returned individually
            savedCrops.forEach(crop => {
                renderCropRow(crop.id, crop.name, crop.time, crop.yield, crop.frost, crop.drought)
            });
        });

    /*Adds rows to the crop table*/
    function renderCropRow(id, name, time, cropYield, frost, drought) {
        const newRow = document.createElement("tr"); //Row structure: name, growth time, yield, frost, drough, delete button
        newRow.setAttribute("data-id", id);
        newRow.innerHTML = `
        <td>${name}</td>
        <td>${time}</td>
        <td>$${cropYield}</td>
        <td>${frost}</td>
        <td>${drought}</td>
        <td><button class="deleteButton">Delete</button></td>`; //Creates an empty header for the delete buttton column
        const emptyRow = tableBody.querySelector(".emptyTable");
        tableBody.insertBefore(newRow, emptyRow); //Insert new crop data row
    }

    /*Crop form event listener*/
    cropForm.addEventListener("submit", (event) => {
        event.preventDefault(); //Stops the browser reloading on form submission

        //Gets rid of extra whitespace
        const name = document.getElementById("cropName").value.trim();
        const time = document.getElementById("growthTime").value.trim();
        const cropYield = document.getElementById("cropYield").value.trim();

        //Detects radio button checks
        const frostRadio = document.querySelector("input[name='frostSusceptible']:checked");
        const droughtRadio = document.querySelector("input[name='droughtSusceptible']:checked");
        //Defaults to NO if nothing is checked
        const frost = frostRadio ? frostRadio.value : "No";
        const drought = droughtRadio ? droughtRadio.value : "No";

        //Force user to enter name, time, and yield
        if (!name || !time || !cropYield) {
            alert("FILL OUT ALL FIELDS");
            return;
        }

        const cropData = { name, time, yield: cropYield, frost, drought }; //Places the inputs into a data object

        //Sends POST request with the crop data to the backend
        fetch("/api/crops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cropData)
        })
            .then(res => res.json())
            .then(newCrop => {
                //Render after saving
                renderCropRow(newCrop.id, name, time, cropYield, frost, drought); //ID returned by Prisma
                cropForm.reset(); //Reset the form fields
            });
    });

    //Listens for clicks on the tables delete button
    tableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("deleteButton")) {
            const row = event.target.closest("tr");
            const cropID = row.getAttribute("data-id"); //PostgreSQL ID

            fetch(`/api/crops/${cropID}`, { method: "DELETE" })
                .then(res => {
                    if (res.ok) {
                        row.remove();
                    }
                    else {
                        alert("Could not delete from server"); //Added an alert if it doesnt delete
                    }
                });
        }
    });

    /*Weather API (OpenWeather)*/
    const API_KEY = "24d0200f0eb8e09af866e15c198adcfe";

    //UI containers
    const weatherDisplay = document.getElementById("weatherDisplay");
    const locationHeader = document.getElementById("locationHeader");
    const forecastContainer = document.getElementById("forecastContainer");
    const locationInput = document.getElementById("locationInput");
    const weatherButton = document.getElementById("weatherButton");

    //Array to convert index to weekdays
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    //Async containing geocoding coordinates and API calls
    async function fetchForecast(location) {
        if (!location) return;

        forecastContainer.innerHTML = "Loading weather data";

        //Clear warning alerts from prior location query
        const alertContainer = document.getElementById("alertContainer");
        alertContainer.innerHTML = "";

        try {
            //Convert city name to geo lat lon coord
            const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`;
            const geoResponse = await fetch(geoURL);
            const geoData = await geoResponse.json();

            //Invalid coord
            if (!geoData || geoData.length === 0) {
                throw new Error("Location not found");
            }

            const { lat, lon, name, state } = geoData[0];
            locationHeader.textContent = `${name}${state ? `, ${state}` : ""}`;

            const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`; //5Day 3Hr forecast (free version)
            const response = await fetch(forecastURL);

            //Server-side error
            if (!response.ok) {
                throw new Error("Can't get weather");
            }

            const data = await response.json();
            forecastContainer.innerHTML = ""; //Get rid of loading placeholder

            const dailyData = {}; //Key-value store 3hr data points bucketed by days

            //IMPORTANT: Because I can only grab by 3 hours, I need to find the lowest and highest temp to display for each day

            data.list.forEach(item => {
                const dateKey = item.dt_txt.split(" ")[0]; //Grab yyyy-mm-dd

                //If first time, initialize data structure
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        temps: [],
                        conditions: [],
                        rawDate: new Date(item.dt * 1000) //Convert API sec into Java
                    };
                }

                //Append temp and condition types into their buckets
                dailyData[dateKey].temps.push(item.main.temp);
                dailyData[dateKey].conditions.push({
                    main: item.weather[0].main,
                    description: item.weather[0].description
                });
            });

            //Save forecast metrics to server
            fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: location })
            });

            //Set warnings to default and limit days tracked to 5
            let freezeWarning = false;
            let countDrought = 0;
            const daysArray = Object.keys(dailyData).slice(0, 5);

            daysArray.forEach(dateKey => {
                const dayInfo = dailyData[dateKey];

                if (typeof dayInfo.rawDate === 'string') dayInfo.rawDate = new Date(dayInfo.rawDate);

                //Find min and max temp
                const maxTemp = Math.round(Math.max(...dayInfo.temps));
                const minTemp = Math.round(Math.min(...dayInfo.temps));

                //Grab average condition
                const midIndex = Math.floor(dayInfo.conditions.length / 2);
                const mainCondition = dayInfo.conditions[midIndex].main;
                const conditionDesc = dayInfo.conditions[midIndex].description;

                //Check for freezing and drought
                if (minTemp <= 32) {
                    freezeWarning = true;
                }
                if (mainCondition === "Clear" && maxTemp > 85) {
                    countDrought++;
                }

                //Create readable date (DayofWeek (xm/xd))
                const dayName = weekDays[dayInfo.rawDate.getDay()];
                const dayRow = document.createElement("div");
                dayRow.className = "forecastDay";

                //Update style if freezing
                if (minTemp <= 32) {
                    dayRow.style.backgroundColor = "#fff0f0";
                    dayRow.style.borderColor = "#ffcccc";
                }

                //Gen HTML for a days forecast
                dayRow.innerHTML = `
                <span class="dataLabel">${dayName} (${dayInfo.rawDate.getMonth() + 1}/${dayInfo.rawDate.getDate()})</span>
                <span class="tempRange" style="font-size: 1rem;">
                    <span style="color: #c0392b; font-weight: bold;">${maxTemp}°</span> /
                    <span style="color: #2980b9;">${minTemp}°F</span>
                </span>
                <span class="conditionLabel">${conditionDesc}</span>`;

                forecastContainer.appendChild(dayRow); //Append the new HTML element
            });

            //Trigger alert if freezing conditions
            if (freezeWarning) {
                showAlert("FREEZE WARNING: Bring in or cover frost susceptible plants", "freeze")
            }

            //Trigger alert if more than 1 drought day occurs
            if (countDrought >= 2) {
                showAlert("DROUGHT WARNING: Set up irrigation systems", "drought")
            }

        } catch (error) { //General error handler
            console.error("Weather tracker error:", error);
            forecastContainer.innerHTML = `<span style="color: #ff6b6b; font-size: 1rem;">Could not load "${location}".</span>`;
            locationHeader.textContent = "Error";
        }
    }

    //Create and append alert banners
    function showAlert(message, type) {
        const alertContainer = document.getElementById("alertContainer");
        if (!alertContainer) return;

        const alertDiv = document.createElement("div");
        alertDiv.className = `farmAlert alert-${type}`;
        alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alertClose">&times;</button>`;

        //X button to get rid of banner
        alertDiv.querySelector(".alertClose").addEventListener("click", () => {
            alertDiv.remove();
        });
        alertContainer.appendChild(alertDiv);
    }

    /*Weather Events and Startup*/

    //Find weather when clicking search button or pressing enter
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

    //Fetch the last location
    fetch("/api/location")
        .then(res => res.json())
        .then(data => {
            //If there is a saved location, use that. If not, use Greensboro
            if (data.lastLocation) {
                fetchForecast(data.lastLocation);
            } else {
                fetchForecast("Greensboro");
            }

        });
})
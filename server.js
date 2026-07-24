require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();

//Database Connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

//Middleware
app.use(express.json());
app.use(express.static("public"));

//Grab stored location
app.get("/api/location", async (req, res) => {
  try {
    const locationRecord = await prisma.location.findFirst();
    res.json({ lastLocation: locationRecord ? locationRecord.city : "" });
  } catch (error) {
    console.error("Fetch location error:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

//Update stored location
app.post("/api/location", async (req, res) => {
  const { location } = req.body;
  if (!location) return res.status(400).json({ error: "Location required" });

  try {
    const existingLocation = await prisma.location.findFirst();

    if (existingLocation) {
      await prisma.location.update({
        where: { id: existingLocation.id },
        data: { city: location.trim() },
      });
    } else {
      await prisma.location.create({
        data: { city: location.trim() },
      });
    }

    res.json({ message: "Updated globally, saved to DB" });
  } catch (error) {
    console.error("Save location error:", error);
    res.status(500).json({ error: "Failed to save location" });
  }
});

app.get("/api/weather", async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: "Location parameter required" });

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server missing OPENWEATHER_API_KEY" });

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return res.status(404).json({ error: `Location "${location}" not found.` });
    }

    const { lat, lon, name, state } = geoData[0];

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const forecastData = await forecastRes.json();

    res.json({
      locationName: `${name}${state ? `, ${state}` : ""}`,
      list: forecastData.list,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

//Fetch all
app.get("/api/crops", async (req, res) => {
  try {
    const crops = await prisma.crop.findMany({ orderBy: { plantedAt: "desc" } });
    res.json(crops);
  } catch (error) {
    console.error("Fetch crops error:", error);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
});

//Save new crop
app.post("/api/crops", async (req, res) => {
  const { name, time, yield: cropYield, frost, drought } = req.body;
  if (!name || !time || !cropYield) return res.status(400).json({ error: "Missing required fields" });

  try {
    const newCrop = await prisma.crop.create({
      data: { name: name.trim(), time: time.trim(), yield: cropYield.trim(), frost, drought },
    });
    res.status(201).json(newCrop);
  } catch (error) {
    console.error("Save crop error:", error);
    res.status(500).json({ error: "Failed to save crop" });
  }
});

//Remove crop
app.delete("/api/crops/:id", async (req, res) => {
  const cropId = parseInt(req.params.id, 10);
  if (isNaN(cropId)) return res.status(400).json({ error: "Invalid crop ID" });

  try {
    await prisma.crop.delete({ where: { id: cropId } });
    res.sendStatus(204);
  } catch (error) {
    console.error("Delete crop error:", error);
    res.status(500).json({ error: "Failed to delete crop" });
  }
});

// 404 Fallback & Listener
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
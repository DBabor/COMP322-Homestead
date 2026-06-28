require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();

//Connects
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(express.json()); //Auto parse incoming JSON
app.use(express.static("public")); //Frontend files in the public folder

//GET, grabs location
app.get("/api/location", async (req, res) => {
  try {
    const locationRecord = await prisma.location.findFirst();
    res.json({ lastLocation: locationRecord ? locationRecord.city : "" });
  }
  catch (error) {
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

//POST, updates location
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
    }
    else {
      await prisma.location.create({
        data: { city: location.trim() },
      });
    }

    res.json({ message: "Updated globally, saved to DB" });
  }

  catch (error) {
    res.status(500).json({ error: "Failed to save location" });
  }
});

//GET, sends the array to the frontend
app.get("/api/crops", async (req, res) => {
  try {
    const crops = await prisma.crop.findMany({ orderBy: { plantedAt: "desc" } });
    res.json(crops);
  }
  catch (error) {
    res.status(500).json({ error: "Failed to fetch crops" });
  }
});

//POST, recieves crop data and stores on the server
app.post("/api/crops", async (req, res) => {
  const { name, time, yield: cropYield, frost, drought } = req.body;
  if (!name || !time || !cropYield) return res.status(400).json({ error: "Missing fields" });

  try {
    const newCrop = await prisma.crop.create({
      data: { name: name.trim(), time: time.trim(), yield: cropYield.trim(), frost, drought },
    });
    res.status(201).json(newCrop);
  }
  catch (error) {
    res.status(500).json({ error: "Failed to save crops" });
  }
});

//DELETE, removes crops from the array
app.delete("/api/crops/:id", async (req, res) => {
  try {
    await prisma.crop.delete({ where: { id: parseInt(req.params.id) } });
    res.sendStatus(204);
  }
  catch (error) {
    res.status(500).json({ error: "Failed to delete crop" });
  }
});

//GET, sends the last searched city
app.get("/api/location", (req, res) => res.json({ lastLocation }));
//POST, updates with the most recent location
app.post("/api/location", (req, res) => { lastLocation = req.body.location; res.json({ message: "Updated" }); });

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(3000, () => console.log("Server running on port 3000")); //Shows we're listening ;p
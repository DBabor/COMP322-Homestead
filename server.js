const express = require("express");
const app = express();

app.use(express.json()); //Auto parse incoming JSON
app.use(express.static("public")); //Frontend files in the public folder

//Resets when the server restarts
let farmCrops = []; //Stores crops
let lastLocation = ""; //Stores last location

//GET, sends the array to the frontend
app.get("/api/data", (req, res) => {
  res.json(farmCrops);
});

//POST, recieves crop data and stores on the server
app.post("/api/data", (req, res) => {
  farmCrops.push(req.body); //Appends crop into server array
  res.json({message: "Crops have been saved..."});
});

//DELETE, removes crops from the array
app.delete("/api/data/:index", (req, res) => {
  const index = req.params.index;
  farmCrops.splice(index, 1); //Remove 1 crop at the index
  res.json({message: "Crops have been deleted..."});
});

//GET, sends the last searched city
app.get("/api/location", (req, res) => {
  res.json({lastLocation: lastLocation});
});

//POST, updates with the most recent location
app.post("/api/location", (req, res) => {
  lastLocation = req.body.location; //Overrites with the new location
  res.json({message: "Location has been updated..."});
});

app.listen(3000, () => console.log("Server running on port 3000")); //Shows we're listening ;p
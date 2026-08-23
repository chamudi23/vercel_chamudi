require("dotenv").config();
const express = require("express");
const cors = require("cors");
const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());

const gisRoutes = require("./routes/gisRoutes");
const imagesRoutes = require("./routes/images");
const assistantRoutes = require("./routes/assistant");

app.use("/api/gis", gisRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/assistant", assistantRoutes);

app.get("/", (req, res) => {
  res.send("OAHRIS Backend Running 🚀");
});

// GET all sites
app.get("/sites", async (req, res) => {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST new site
app.post("/sites", async (req, res) => {
  const { site_name, district, latitude, longitude, elevation, time_period } = req.body;
  const { data, error } = await supabase
    .from("sites")
    .insert([{ site_name, district, latitude, longitude, elevation, time_period }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
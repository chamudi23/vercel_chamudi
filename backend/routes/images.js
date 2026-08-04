const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET /api/images — all bone images
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("bone_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, count: data.length, data });
});

// GET /api/images/search?q=... — search across text fields
router.get("/search", async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ success: false, error: "Query parameter 'q' is required" });

  const { data, error } = await supabase
    .from("bone_images")
    .select("*")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,bone_type.ilike.%${q}%`);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, count: data.length, data });
});

// GET /api/images/:id — single bone image
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("bone_images")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
  res.json({ success: true, data });
});

// POST /api/images — insert a new bone image record
router.post("/", async (req, res) => {
  const { title, description, bone_type, image_url, site_id, skeleton_id } = req.body;

  if (!image_url) {
    return res.status(400).json({ success: false, error: "image_url is required" });
  }

  const { data, error } = await supabase
    .from("bone_images")
    .insert([{ title, description, bone_type, image_url, site_id, skeleton_id }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

module.exports = router;

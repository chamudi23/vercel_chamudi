const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET /api/gis/sites/map
router.get("/sites/map", async (req, res) => {
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, site_name, latitude, longitude, district, province, time_period, site_type, elevation, protected_status, risk_level, description, skeletons(skeleton_id)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const data = sites.map(({ skeletons, ...s }) => ({
    ...s,
    skeleton_count: skeletons?.length ?? 0,
  }));

  res.json({ success: true, count: data.length, data });
});


// GET /api/gis/sites/temporal
router.get("/sites/temporal", async (req, res) => {
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, site_name, latitude, longitude, district, time_period, site_type, skeletons(skeleton_id, biological_profiles(gender))")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const data = sites.map(({ skeletons, ...s }) => ({
    ...s,
    skeleton_count: skeletons?.length ?? 0,
    genders: [...new Set(
      (skeletons || []).flatMap(sk =>
        (sk.biological_profiles || []).map(bp => bp.gender).filter(Boolean)
      )
    )].join(","),
  }));

  res.json({ success: true, data });
});


// GET /api/gis/sites/cluster-data
router.get("/sites/cluster-data", async (req, res) => {
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, site_name, latitude, longitude, site_type, district, time_period, risk_level, skeletons(skeleton_id)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const data = sites.map(({ skeletons, id, site_name, latitude, longitude, site_type, district, time_period, risk_level }) => ({
    id,
    name: site_name,
    lat: latitude,
    lng: longitude,
    type: site_type,
    district,
    period: time_period,
    risk_level,
    skeletons: skeletons?.length ?? 0,
  }));

  res.json({ success: true, data });
});


// GET /api/gis/sites/by-district
router.get("/sites/by-district", async (req, res) => {
  const { data: sites, error } = await supabase
    .from("sites")
    .select("district, latitude, longitude, site_type")
    .not("latitude", "is", null);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const grouped = {};
  for (const s of sites) {
    if (!s.district) continue;
    if (!grouped[s.district]) {
      grouped[s.district] = { site_count: 0, lat_sum: 0, lng_sum: 0, types: new Set() };
    }
    grouped[s.district].site_count++;
    grouped[s.district].lat_sum += parseFloat(s.latitude);
    grouped[s.district].lng_sum += parseFloat(s.longitude);
    if (s.site_type) grouped[s.district].types.add(s.site_type);
  }

  const data = Object.entries(grouped)
    .map(([district, g]) => ({
      district,
      site_count: g.site_count,
      center_lat: g.lat_sum / g.site_count,
      center_lng: g.lng_sum / g.site_count,
      types: [...g.types].join(","),
    }))
    .sort((a, b) => b.site_count - a.site_count);

  res.json({ success: true, data });
});


// GET /api/gis/sites/excavation-phases
router.get("/sites/excavation-phases", async (req, res) => {
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, site_name, latitude, longitude, time_period, district, site_type, skeletons(skeleton_id)")
    .not("latitude", "is", null);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const phase = (t) => {
    if (!t) return "Phase IV";
    if (/Mesolithic|14000|12000|10000/i.test(t)) return "Phase I";
    if (/6000|8000|Neolithic/i.test(t)) return "Phase II";
    if (/Iron Age|3000|2000/i.test(t)) return "Phase III";
    return "Phase IV";
  };

  const data = sites
    .map(({ skeletons, ...s }) => ({
      ...s,
      excavation_phase: phase(s.time_period),
      skeleton_count: skeletons?.length ?? 0,
    }))
    .sort((a, b) => a.excavation_phase.localeCompare(b.excavation_phase));

  res.json({ success: true, data });
});


// GET /api/gis/spatial-stats
router.get("/spatial-stats", async (req, res) => {
  const [
    { count: total_mapped,    error: e1 },
    { data: siteTypeRows,     error: e2 },
    { data: periodRows,       error: e3 },
    { count: protected_count, error: e4 },
    { count: high_risk,       error: e5 },
  ] = await Promise.all([
    supabase.from("sites").select("*", { count: "exact", head: true }).not("latitude", "is", null),
    supabase.from("sites").select("site_type").not("site_type", "is", null),
    supabase.from("sites").select("time_period").not("time_period", "is", null),
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("protected_status", true),
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("risk_level", "High"),
  ]);

  const firstError = e1 || e2 || e3 || e4 || e5;
  if (firstError) return res.status(500).json({ success: false, error: firstError.message });

  const by_type = Object.entries(
    siteTypeRows.reduce((acc, { site_type }) => {
      acc[site_type] = (acc[site_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([site_type, count]) => ({ site_type, count }));

  const by_period = Object.entries(
    periodRows.reduce((acc, { time_period }) => {
      acc[time_period] = (acc[time_period] || 0) + 1;
      return acc;
    }, {})
  ).map(([time_period, count]) => ({ time_period, count }));

  res.json({
    success: true,
    data: { total_mapped, by_type, by_period, protected_count, high_risk },
  });
});


module.exports = router;

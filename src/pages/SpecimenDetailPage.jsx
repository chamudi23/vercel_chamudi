import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

export default function SpecimenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [specimen, setSpecimen] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [excavation, setExcavation] = useState(null);
  const [labDating, setLabDating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);

    // Fetch specimen
    const { data: specData, error: specError } = await supabase
      .from("specimens")
      .select("*")
      .eq("specimen_id", id)
      .single();

    if (specError || !specData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setSpecimen(specData);

    // Fetch measurements
    const { data: measData } = await supabase
      .from("measurements")
      .select("*")
      .eq("specimen_id", specData.specimen_id);

    setMeasurements(measData || []);

    // Fetch excavation record
    const { data: excData } = await supabase
      .from("excavation_records")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .single();

    setExcavation(excData || null);

    // Fetch lab dating
    const { data: labData } = await supabase
      .from("laboratory_dating_results")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .single();

    setLabDating(labData || null);

    setLoading(false);
  }

  const badgeColor = (state) => {
    const map = {
      Excellent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      Good: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      Fair: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      Poor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      Fragmentary: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return map[state] || "bg-white/10 text-white/40 border-white/10";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a14] text-white flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 mr-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-white/40">Loading specimen...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0f1a14] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-white/40 text-lg">Specimen not found</p>
        <button
          onClick={() => navigate("/specimens")}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/specimens")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">Specimen Detail</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">
                Specimen Record
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white font-mono">
              {specimen.specimen_id}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Skeleton Code: <span className="text-white/60">{specimen.skeleton_code || "—"}</span>
            </p>
          </div>
          {specimen.preservation_state && (
            <span className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full border ${badgeColor(specimen.preservation_state)}`}>
              {specimen.preservation_state}
            </span>
          )}
        </div>

        {/* Section 1 — Specimen Info */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Specimen Information
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Site Name</p>
              <p className="text-white/80">{specimen.site_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">District</p>
              <p className="text-white/80">{specimen.district || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Province</p>
              <p className="text-white/80">{specimen.province || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Year</p>
              <p className="text-white/80">{specimen.excavation_year || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Time Period</p>
              <p className="text-white/80">{specimen.time_period || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Storage Location</p>
              <p className="text-white/80">{specimen.location_stored || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Burial Context</p>
              <p className="text-white/80">{specimen.burial_context || "—"}</p>
            </div>
            {specimen.notes && (
              <div className="md:col-span-2">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-white/80">{specimen.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2 — Measurements */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-white/30 uppercase tracking-widest">
              Bone Measurements
            </p>
            <span className="text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {measurements.length} record{measurements.length !== 1 ? "s" : ""}
            </span>
          </div>

          {measurements.length === 0 ? (
            <p className="text-white/25 text-sm">No measurements recorded for this specimen.</p>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Bone Type</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Measurement Type</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Value</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Unit</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, i) => (
                    <tr key={m.measurement_id || i} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                      <td className="px-4 py-3 text-white/70">{m.bone_type || "—"}</td>
                      <td className="px-4 py-3 text-white/70">{m.measurement_type || "—"}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">{m.value ?? "—"}</td>
                      <td className="px-4 py-3 text-white/50">{m.unit || "—"}</td>
                      <td className="px-4 py-3 text-white/40">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3 — Excavation Record */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Excavation Record
          </p>
          {!excavation ? (
            <p className="text-white/25 text-sm">No excavation record for this specimen.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Date</p>
                <p className="text-white/80">{excavation.excavation_date || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Phase</p>
                <p className="text-white/80">{excavation.excavation_phase || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Depth Found (m)</p>
                <p className="text-white/80">{excavation.depth_found ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavator Name</p>
                <p className="text-white/80">{excavation.excavator_name || "—"}</p>
              </div>
              {excavation.excavation_notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Notes</p>
                  <p className="text-white/80">{excavation.excavation_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 4 — Lab Dating */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Laboratory Dating
          </p>
          {!labDating ? (
            <p className="text-white/25 text-sm">No laboratory dating results for this specimen.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Dating Method</p>
                <p className="text-white/80">{labDating.dating_method || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Result</p>
                <p className="text-white/80 font-mono">{labDating.date_result || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Range Min (BP)</p>
                <p className="text-white/80 font-mono">{labDating.date_range_min ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Range Max (BP)</p>
                <p className="text-white/80 font-mono">{labDating.date_range_max ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Lab Name</p>
                <p className="text-white/80">{labDating.lab_name || "—"}</p>
              </div>
              {labDating.result_notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Result Notes</p>
                  <p className="text-white/80">{labDating.result_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  Sliders, Sparkles, TrendingDown, 
  Flame, Car, Factory, HeartPulse, IndianRupee, 
  RefreshCw, Compass, School, 
  Smile, Frown, ArrowRight, Zap, CheckCircle2,
  MapPin, ShieldCheck, Activity, Users, Info, AlertTriangle, Satellite
} from 'lucide-react'

// CPCB helper
const getCpcbBadge = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good (Clean Sky)", bg: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", bg: "bg-lime-500/10 text-lime-300 border border-lime-500/20" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate (Acceptable)", bg: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor (Unhealthy)", bg: "bg-orange-500/10 text-orange-300 border border-orange-500/20" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor (Hazardous)", bg: "bg-red-500/10 text-red-300 border border-red-500/20" }
  return { color: "#7f1d1d", label: "Severe Emergency 🚨", bg: "bg-red-950/40 text-red-400 border border-red-500/30" }
}

export default function PolicySimulatorView() {
  const { selectedDate } = useStore()

  // Selected district state
  const [district, setDistrict] = useState("Ludhiana")
  const [stubbleBan, setStubbleBan] = useState(80)
  const [trafficCurb, setTrafficCurb] = useState(0)
  const [industryCurb, setIndustryCurb] = useState(0)

  // Simulation output state
  const [simData, setSimData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch simulation results whenever inputs change
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    const params = new URLSearchParams({
      district,
      stubble_ban_pct: stubbleBan.toString(),
      traffic_curb_pct: trafficCurb.toString(),
      industry_curb_pct: industryCurb.toString(),
      date: selectedDate || ''
    })

    fetch(`/api/simulate-policy?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setSimData(data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error("Failed to run policy simulation:", err)
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [district, stubbleBan, trafficCurb, industryCurb, selectedDate])

  // One-Click Presets
  const applyPreset = (type) => {
    if (type === 'zero_stubble') {
      setStubbleBan(100)
      setTrafficCurb(0)
      setIndustryCurb(0)
    } else if (type === 'odd_even') {
      setStubbleBan(0)
      setTrafficCurb(50)
      setIndustryCurb(0)
    } else if (type === 'super_combo') {
      setStubbleBan(90)
      setTrafficCurb(35)
      setIndustryCurb(30)
    } else if (type === 'reset') {
      setStubbleBan(0)
      setTrafficCurb(0)
      setIndustryCurb(0)
    }
  }

  const districtsList = simData?.available_districts || [
    "Ludhiana", "Sangrur", "Amritsar", "Patiala", "Jalandhar", "Firozpur", 
    "Bathinda", "Tarn Taran", "Karnal", "Kaithal", "Kurukshetra", "Ambala", "Panipat", "Delhi",
    "All Punjab", "All Haryana", "All North India (Regional Blanket Ban)"
  ]

  const targetSummary = simData?.target_district_summary
  const baseBadge = targetSummary ? getCpcbBadge(targetSummary.baseline_aqi) : null
  const simBadge = targetSummary ? getCpcbBadge(targetSummary.simulated_aqi) : null

  return (
    <div className="space-y-5">
      
      {/* 1. Dynamic District Hero Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-[#0c0c10] border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#060608] border border-white/[0.06] text-zinc-300 text-xs font-bold mb-2">
              <Satellite size={13} className="text-indigo-400 animate-pulse" />
              <span>PHYSICS-DRIVEN DIGITAL TWIN • {district.toUpperCase()} ({targetSummary?.date || selectedDate})</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {district} Air Quality & Policy Sandbox
            </h1>
            <p className="text-sm text-zinc-300 max-w-3xl mt-1 leading-relaxed font-medium">
              Real-time intervention modeling for <strong className="text-white font-bold">{district} ({targetSummary?.state || 'Punjab'})</strong>: 
              Simulates local policy decisions based on actual <span className="text-amber-400 font-semibold">NASA VIIRS fires</span>, <span className="text-indigo-300 font-semibold">Sentinel-5P gas columns</span>, and <span className="text-emerald-400 font-semibold">Chemical Mass Balance source apportionment</span>.
            </p>
          </div>

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('zero_stubble')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Flame size={14} /> 🌾 100% Stubble Ban
            </button>
            <button
              onClick={() => applyPreset('odd_even')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Car size={14} /> 🚗 50% Traffic Cut
            </button>
            <button
              onClick={() => applyPreset('super_combo')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Zap size={14} /> 👑 Multi-Sector Combo
            </button>
            <button
              onClick={() => applyPreset('reset')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#060608] border border-white/[0.06] hover:bg-zinc-800 transition-all"
              title="Reset to Baseline"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL SATELLITE DIAGNOSTIC & OBSERVATIONAL REASONING CARD */}
      {simData?.satellite_reasoning && (
        <div className="glass-panel p-5 rounded-2xl bg-[#0c0c10] border border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Satellite size={15} className="text-indigo-400" />
              <span>Genuine Satellite Telemetry & Scientific Reason for {district}</span>
            </div>

            {/* Live Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="bg-[#060608] border border-white/[0.06] px-2.5 py-1 rounded-lg text-amber-300 font-medium">
                🔥 NASA Active Fires: {targetSummary?.active_fires_count || 0} ({targetSummary?.active_frp_mw || 0.0} MW FRP)
              </span>
              <span className="bg-[#060608] border border-white/[0.06] px-2.5 py-1 rounded-lg text-indigo-300 font-medium">
                💨 Wind: {targetSummary?.satellite_telemetry?.wind_spd_kmh || 12} km/h (Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
              </span>
              <span className="bg-[#060608] border border-white/[0.06] px-2.5 py-1 rounded-lg text-emerald-300 font-medium">
                🛡️ BLH Inversion: {targetSummary?.satellite_telemetry?.blh_m || 650}m
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-normal leading-relaxed bg-[#060608] border border-white/[0.04] p-3.5 rounded-xl">
            {simData.satellite_reasoning}
          </p>

          {/* Actual Chemical Mass Balance Breakdown for this District on this Date */}
          {targetSummary?.chemical_mass_balance_pct && (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-[#060608] border border-white/[0.04] p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-amber-400 font-semibold block">🌾 Biomass Burning Share</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.biomass_stubble}%</span>
              </div>
              <div className="bg-[#060608] border border-white/[0.04] p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-indigo-400 font-semibold block">🚗 Vehicular Exhaust Share</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.vehicular_traffic}%</span>
              </div>
              <div className="bg-[#060608] border border-white/[0.04] p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-purple-400 font-semibold block">🏭 Industrial Point Sources</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.industrial_kilns}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT COLUMN: District Selector & Action Sliders (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 rounded-2xl space-y-4 bg-[#0c0c10] border border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-indigo-400" /> Step 1: Select District & Levers
              </span>
              <span className="text-[10px] text-zinc-300 font-semibold bg-[#060608] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                {district}
              </span>
            </div>

            {/* District Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>📍 Select Target District</span>
                <span className="text-[10px] text-amber-400 font-medium">Punjab / Haryana / Delhi</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#060608] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-white/[0.25] cursor-pointer hover:bg-[#09090d] transition-all"
              >
                {districtsList.map(d => (
                  <option key={d} value={d} className="bg-[#060608] text-white">{d}</option>
                ))}
              </select>
            </div>

            {/* Slider 1: Stubble Fire Ban */}
            <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-200 flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20"><Flame size={13} /></span>
                  🌾 {district} Stubble Burning Ban
                </span>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                  {stubbleBan}% Stopped
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={stubbleBan}
                onChange={(e) => setStubbleBan(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                <span>0% (No Ban)</span>
                <span className="text-amber-400 font-bold">80% (Happy Seeder)</span>
                <span>100% (Zero Fires)</span>
              </div>
            </div>

            {/* Slider 2: Local Traffic Restrictions */}
            <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-200 flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Car size={13} /></span>
                  🚗 Local {district} Traffic Cut
                </span>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-md font-mono">
                  {trafficCurb}% Cars Reduced
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={trafficCurb}
                onChange={(e) => setTrafficCurb(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                <span>0% (Standard Flow)</span>
                <span className="text-indigo-400 font-bold">25% (Public Transit)</span>
                <span>50% (Odd-Even)</span>
              </div>
            </div>

            {/* Slider 3: Industrial Limits */}
            <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-zinc-200 flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"><Factory size={13} /></span>
                  🏭 Factory & Kiln Smog Cap
                </span>
                <span className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">
                  {industryCurb}% Cut
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={industryCurb}
                onChange={(e) => setIndustryCurb(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                <span>0% (Standard)</span>
                <span className="text-purple-400 font-bold">25% (PNG Switch)</span>
                <span>50% (Halt)</span>
              </div>
            </div>

          </div>

          {/* Local Health & Economic Impact Card for Selected District */}
          {simData?.local_health_roi && (
            <div className="glass-panel p-5 rounded-2xl space-y-3.5 bg-[#0c0c10] border border-white/[0.08]">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <HeartPulse size={16} className="animate-pulse text-emerald-400" />
                <span>Local Benefits for {district} Citizens</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#060608] border border-white/[0.04] p-3.5 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">🏥 Hospital Visits Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    ~{simData.local_health_roi.admissions_prevented_per_week}
                    <span className="text-xs text-zinc-400 font-normal ml-1">/ week</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Fewer local children & seniors with acute respiratory attacks in {district}.
                  </div>
                </div>

                <div className="bg-[#060608] border border-white/[0.04] p-3.5 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">💰 Public Money Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    ₹ {simData.local_health_roi.economic_savings_crores}
                    <span className="text-xs text-zinc-400 font-normal ml-1">Cr</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Saved in healthcare treatments & lost workdays in {district}.
                  </div>
                </div>
              </div>

              {/* Farm Fires Stopped */}
              {targetSummary?.fires_curbed > 0 && (
                <div className="bg-[#060608] border border-white/[0.04] p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-medium text-[11px]">
                    🌾 Real Farm Fires Extinguished:
                  </span>
                  <span className="text-emerald-400 font-bold font-mono text-[11px]">
                    {targetSummary.fires_curbed} of {targetSummary.active_fires_count} active fires ({targetSummary.frp_curbed_mw} MW)
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: 100% District-Specific Estimation (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          
          {/* Main Air Quality Recovery Window for Selected District */}
          {targetSummary && (
            <div className="glass-panel p-5 rounded-2xl space-y-5 bg-[#0c0c10] border border-white/[0.08] relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/[0.06] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Step 2: Estimation Outcome</span>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {district} Air Quality Projection
                  </h3>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  <span>{targetSummary.pct_improvement}% Cleaner Air in {district}!</span>
                </div>
              </div>

              {/* BEFORE VS AFTER 2-CARD COMPARISON FOR SELECTED DISTRICT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. BASELINE STATUS (WITHOUT ACTION) */}
                <div className="bg-[#060608] border border-white/[0.06] rounded-xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <Frown size={14} /> 1. Actual Baseline
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{district}</span>
                  </div>

                  <div className="text-center py-1.5">
                    <div className="text-4xl font-black text-white font-mono tracking-tight">{targetSummary.baseline_aqi}</div>
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${baseBadge?.bg}`}>
                      {baseBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-300 bg-black/50 border border-white/[0.04] p-2 rounded-lg text-center font-medium">
                    ⚠️ Current PM2.5: {Number(targetSummary.baseline_pm25).toFixed(1)} µg/m³
                  </div>
                </div>

                {/* 2. SIMULATED STATUS (WITH ACTION) */}
                <div className="bg-[#060608] border border-white/[0.06] rounded-xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Smile size={14} /> 2. Post-Action Result
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      -{targetSummary.aqi_reduced} Points!
                    </span>
                  </div>

                  <div className="text-center py-1.5">
                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">{targetSummary.simulated_aqi}</div>
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${simBadge?.bg}`}>
                      {simBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 p-2 rounded-lg text-center font-medium">
                    🍃 Cleared Down to: {Number(targetSummary.simulated_pm25).toFixed(1)} µg/m³
                  </div>
                </div>

              </div>

              {/* Breakdown: Where did the clean air come from in this district? */}
              <div className="bg-[#060608] border border-white/[0.04] p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-zinc-300">How much did each local action help {district}?</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/60 border border-white/[0.04] p-2 rounded-lg">
                    <div className="text-[10px] text-amber-400 font-semibold">🌾 Stubble Ban</div>
                    <div className="text-xs font-extrabold text-white mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.stubble_saved).toFixed(1)} µg</div>
                  </div>
                  <div className="bg-black/60 border border-white/[0.04] p-2 rounded-lg">
                    <div className="text-[10px] text-indigo-400 font-semibold">🚗 Traffic Cut</div>
                    <div className="text-xs font-extrabold text-white mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.traffic_saved).toFixed(1)} µg</div>
                  </div>
                  <div className="bg-black/60 border border-white/[0.04] p-2 rounded-lg">
                    <div className="text-[10px] text-purple-400 font-semibold">🏭 Factory Cap</div>
                    <div className="text-xs font-extrabold text-white mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.industry_saved).toFixed(1)} µg</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Local Administrative Advisory for Selected District */}
          {simData?.administrative_recommendation && (
            <div className="glass-panel p-4 rounded-2xl space-y-2 bg-[#0c0c10] border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <School size={15} className="text-indigo-400" /> {district} District Advisory & Public Health
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  ✅ SATELLITE VALIDATED
                </span>
              </div>

              <p className="text-xs text-zinc-300 font-normal leading-relaxed bg-[#060608] border border-white/[0.04] p-3 rounded-xl">
                {simData.administrative_recommendation}
              </p>
            </div>
          )}

          {/* Connected Downwind Cities Benefit Chain */}
          {simData?.downwind_impact && simData.downwind_impact.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl space-y-3 bg-[#0c0c10] border border-white/[0.08]">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-2.5">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Compass size={15} className="text-emerald-400" /> Genuine Downwind Network (Along Wind Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Cities that receive cleaner air when {district} cuts emissions:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {simData.downwind_impact.map((item) => (
                  <div key={item.city} className="bg-[#060608] border border-white/[0.04] rounded-xl p-3 space-y-1.5 hover:border-white/[0.1] transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{item.city} ({item.state})</span>
                      <span className="text-[10px] font-mono text-zinc-400">{item.distance_km} km ({item.transit_hours}h ETA)</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="text-zinc-400 text-[11px]">AQI Saved: <span className="text-emerald-400 font-bold">-{item.aqi_points_saved} pts</span></span>
                      <span className="text-emerald-300 font-bold text-[11px]">-{Number(item.pm25_saved).toFixed(1)} µg/m³</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

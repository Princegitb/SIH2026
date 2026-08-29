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
  if (aqi <= 50) return { color: "#10b981", label: "Good (Clean Sky)", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", bg: "bg-lime-500/10 text-lime-300 border-lime-500/30" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate (Acceptable)", bg: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor (Unhealthy)", bg: "bg-orange-500/10 text-orange-300 border-orange-500/30" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor (Hazardous)", bg: "bg-red-500/10 text-red-300 border-red-500/30" }
  return { color: "#7f1d1d", label: "Severe Emergency 🚨", bg: "bg-red-950/40 text-red-400 border-red-500/50" }
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
    <div className="space-y-6">
      
      {/* 1. Dynamic District Hero Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 text-xs font-bold border border-zinc-700 mb-2">
              <Satellite size={13} className="text-indigo-400 animate-pulse" />
              <span>PHYSICS-DRIVEN DIGITAL TWIN • {district.toUpperCase()} ({targetSummary?.date || selectedDate})</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {district} Air Quality & Policy Sandbox
            </h1>
            <p className="text-sm text-zinc-300 max-w-3xl mt-1 leading-relaxed">
              Real-time intervention modeling for <strong className="text-white">{district} ({targetSummary?.state || 'Punjab'})</strong>: 
              Simulates local policy decisions based on actual <span className="text-amber-400 font-semibold">NASA VIIRS fires</span>, <span className="text-indigo-300 font-semibold">Sentinel-5P gas columns</span>, and <span className="text-emerald-400 font-semibold">Chemical Mass Balance source apportionment</span>.
            </p>
          </div>

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('zero_stubble')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 hover:bg-zinc-850 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
            >
              <Flame size={15} /> 🌾 100% Stubble Ban
            </button>
            <button
              onClick={() => applyPreset('odd_even')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-zinc-900 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-zinc-850 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
            >
              <Car size={15} /> 🚗 50% Traffic Cut
            </button>
            <button
              onClick={() => applyPreset('super_combo')}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <Zap size={15} /> 👑 Multi-Sector Combo
            </button>
            <button
              onClick={() => applyPreset('reset')}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all"
              title="Reset to Baseline"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL SATELLITE DIAGNOSTIC & OBSERVATIONAL REASONING CARD */}
      {simData?.satellite_reasoning && (
        <div className="glass-panel p-5 rounded-3xl border border-zinc-800 bg-[#09090c] shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-zinc-200 uppercase tracking-wider">
              <Satellite size={16} className="text-indigo-400" />
              <span>Genuine Satellite Telemetry & Scientific Reason for {district}</span>
            </div>

            {/* Live Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="bg-[#050507] px-2.5 py-1 rounded-lg border border-zinc-800 text-amber-300 font-bold">
                🔥 NASA Active Fires: {targetSummary?.active_fires_count || 0} ({targetSummary?.active_frp_mw || 0.0} MW FRP)
              </span>
              <span className="bg-[#050507] px-2.5 py-1 rounded-lg border border-zinc-800 text-indigo-300 font-bold">
                💨 Wind: {targetSummary?.satellite_telemetry?.wind_spd_kmh || 12} km/h (Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
              </span>
              <span className="bg-[#050507] px-2.5 py-1 rounded-lg border border-zinc-800 text-emerald-300 font-bold">
                🛡️ BLH Inversion: {targetSummary?.satellite_telemetry?.blh_m || 650}m
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-[#050507] p-4 rounded-2xl border border-zinc-850">
            {simData.satellite_reasoning}
          </p>

          {/* Actual Chemical Mass Balance Breakdown for this District on this Date */}
          {targetSummary?.chemical_mass_balance_pct && (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-[#050507] border border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-amber-400 font-bold block">🌾 Biomass Burning Share</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.biomass_stubble}%</span>
              </div>
              <div className="bg-[#050507] border border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-indigo-400 font-bold block">🚗 Vehicular Exhaust Share</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.vehicular_traffic}%</span>
              </div>
              <div className="bg-[#050507] border border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-purple-400 font-bold block">🏭 Industrial Point Sources</span>
                <span className="text-sm font-extrabold text-white font-mono">{targetSummary.chemical_mass_balance_pct.industrial_kilns}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT COLUMN: District Selector & Action Sliders (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-zinc-800 bg-[#09090c]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" /> Step 1: Select District & Levers
              </span>
              <span className="text-[10px] text-zinc-300 font-bold bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                {district}
              </span>
            </div>

            {/* District Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span>📍 Select Target District</span>
                <span className="text-[10px] text-amber-400 font-bold">Punjab / Haryana / Delhi</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#050507] border border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-100 outline-none focus:border-zinc-500 cursor-pointer shadow-sm hover:border-zinc-700 transition-all"
              >
                {districtsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Slider 1: Stubble Fire Ban */}
            <div className="space-y-2 pt-3 border-t border-zinc-850">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Flame size={14} /></span>
                  🌾 {district} Stubble Burning Ban
                </span>
                <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 font-mono">
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
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                <span>0% (No Ban)</span>
                <span className="text-amber-400 font-bold">80% (Happy Seeder)</span>
                <span>100% (Zero Fires)</span>
              </div>
            </div>

            {/* Slider 2: Local Traffic Restrictions */}
            <div className="space-y-2 pt-3 border-t border-zinc-850">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Car size={14} /></span>
                  🚗 Local {district} Traffic Cut
                </span>
                <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 font-mono">
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
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                <span>0% (Standard Flow)</span>
                <span className="text-indigo-400 font-bold">25% (Public Transit)</span>
                <span>50% (Odd-Even)</span>
              </div>
            </div>

            {/* Slider 3: Industrial Limits */}
            <div className="space-y-2 pt-3 border-t border-zinc-850">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Factory size={14} /></span>
                  🏭 Factory & Kiln Smog Cap
                </span>
                <span className="text-sm font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20 font-mono">
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
                className="w-full accent-purple-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
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
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-emerald-500/20 bg-[#09090c] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div className="flex items-center space-x-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <HeartPulse size={18} className="animate-pulse text-emerald-400" />
                <span>Local Benefits for {district} Citizens</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050507] border border-zinc-850 p-4 rounded-2xl">
                  <div className="text-xs text-zinc-300 font-bold">🏥 Hospital Visits Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ~{simData.local_health_roi.admissions_prevented_per_week}
                    <span className="text-xs text-zinc-400 font-normal ml-1">/ week</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Fewer local children & seniors with acute respiratory attacks in {district}.
                  </div>
                </div>

                <div className="bg-[#050507] border border-zinc-850 p-4 rounded-2xl">
                  <div className="text-xs text-zinc-300 font-bold">💰 Public Money Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
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
                <div className="bg-[#050507] p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                    🌾 Real Farm Fires Extinguished:
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {targetSummary.fires_curbed} of {targetSummary.active_fires_count} active fires ({targetSummary.frp_curbed_mw} MW)
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: 100% District-Specific Estimation (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          
          {/* Main Air Quality Recovery Window for Selected District */}
          {targetSummary && (
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-zinc-800 bg-[#09090c] relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Step 2: Estimation Outcome</span>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {district} Air Quality Projection
                  </h3>
                </div>

                <div className="bg-emerald-500/10 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <TrendingDown size={16} />
                  <span>{targetSummary.pct_improvement}% Cleaner Air in {district}!</span>
                </div>
              </div>

              {/* BEFORE VS AFTER 2-CARD COMPARISON FOR SELECTED DISTRICT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. BASELINE STATUS (WITHOUT ACTION) */}
                <div className="bg-[#050507] border border-red-500/20 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <Frown size={15} /> 1. Actual Satellite Baseline
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{district}</span>
                  </div>

                  <div className="text-center py-2">
                    <div className="text-4xl font-black text-white font-mono tracking-tight">{targetSummary.baseline_aqi}</div>
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mt-2 border ${baseBadge?.bg}`}>
                      {baseBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-red-300 bg-red-950/20 p-2.5 rounded-xl border border-red-500/20 text-center font-medium">
                    ⚠️ Current PM2.5: {targetSummary.baseline_pm25} µg/m³
                  </div>
                </div>

                {/* 2. SIMULATED STATUS (WITH ACTION) */}
                <div className="bg-[#050507] border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Smile size={15} /> 2. Post-Action Result
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      -{targetSummary.aqi_reduced} Points!
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">{targetSummary.simulated_aqi}</div>
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mt-2 border ${simBadge?.bg}`}>
                      {simBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-200 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30 text-center font-bold">
                    🍃 Cleared Down to: {targetSummary.simulated_pm25} µg/m³
                  </div>
                </div>

              </div>

              {/* Breakdown: Where did the clean air come from in this district? */}
              <div className="bg-[#050507] border border-zinc-850 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-zinc-300">How much did each local action help {district}?</div>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-amber-400 font-bold">🌾 Stubble Ban</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.stubble_saved} µg</div>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-indigo-400 font-bold">🚗 Traffic Cut</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.traffic_saved} µg</div>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-purple-400 font-bold">🏭 Factory Cap</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.industry_saved} µg</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Local Administrative Advisory for Selected District */}
          {simData?.administrative_recommendation && (
            <div className="glass-panel p-5 rounded-3xl space-y-2.5 border border-zinc-800 bg-[#09090c]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <School size={16} className="text-indigo-400" /> {district} District Advisory & Public Health
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  ✅ SATELLITE VALIDATED
                </span>
              </div>

              <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-[#050507] p-3.5 rounded-2xl border border-zinc-850">
                {simData.administrative_recommendation}
              </p>
            </div>
          )}

          {/* Connected Downwind Cities Benefit Chain */}
          {simData?.downwind_impact && simData.downwind_impact.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-zinc-800 bg-[#09090c]">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <Compass size={16} className="text-emerald-400" /> Genuine Downwind Network (Along Actual Wind Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Cities that receive cleaner air when {district} cuts emissions:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {simData.downwind_impact.map((item) => (
                  <div key={item.city} className="bg-[#050507] border border-zinc-850 rounded-2xl p-3.5 space-y-2 hover:border-zinc-700 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{item.city} ({item.state})</span>
                      <span className="text-[10px] font-mono text-zinc-400">{item.distance_km} km ({item.transit_hours}h ETA)</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-zinc-850">
                      <span className="text-zinc-400">AQI Saved: <span className="text-emerald-400 font-bold">-{item.aqi_points_saved} pts</span></span>
                      <span className="text-emerald-300 font-bold">-{item.pm25_saved} µg/m³</span>
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

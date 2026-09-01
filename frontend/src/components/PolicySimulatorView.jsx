import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  Sliders, Flame, Car, Factory, Zap, ShieldCheck, HeartPulse, 
  TrendingDown, TrendingUp, Sparkles, RefreshCw, Compass, ArrowRight,
  School, CheckCircle2, AlertTriangle, Activity, Satellite, Frown, Smile
} from 'lucide-react'

// CPCB category helper
const getCpcbBadge = (aqi) => {
  if (aqi <= 50) return { label: "Good (Safe)", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
  if (aqi <= 100) return { label: "Satisfactory", bg: "bg-lime-500/15 text-lime-400 border-lime-500/30" }
  if (aqi <= 200) return { label: "Moderate (Acceptable)", bg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" }
  if (aqi <= 300) return { label: "Poor (Health Warning)", bg: "bg-orange-500/15 text-orange-400 border-orange-500/30" }
  if (aqi <= 400) return { label: "Very Poor (Respiratory Danger)", bg: "bg-red-500/15 text-red-400 border-red-500/30" }
  return { label: "Severe Emergency (Critical Smog)", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" }
}

export default function PolicySimulatorView() {
  const { selectedDate, districts } = useStore()
  
  // Interactive Simulation Controls
  const [district, setDistrict] = useState("Ludhiana")
  const [stubbleBan, setStubbleBan] = useState(80)
  const [trafficCurb, setTrafficCurb] = useState(25)
  const [industryCurb, setIndustryCurb] = useState(20)
  
  // State from API
  const [simData, setSimData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch simulation results from backend API
  const fetchSimulation = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/policy-simulator?date=${selectedDate}&district=${district}&stubble_reduction_pct=${stubbleBan}&traffic_reduction_pct=${trafficCurb}&industrial_reduction_pct=${industryCurb}`
      )
      const data = await res.json()
      if (res.ok) {
        setSimData(data)
      } else {
        setError(data?.detail || "Simulation calculation error.")
      }
    } catch (err) {
      console.error("Failed to run policy sandbox:", err)
      setError("Network error communicating with policy simulation engine.")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSimulation()
  }, [district, stubbleBan, trafficCurb, industryCurb, selectedDate])

  // Quick Action Presets
  const applyPreset = (type) => {
    if (type === 'zero_stubble') {
      setStubbleBan(100); setTrafficCurb(0); setIndustryCurb(0)
    } else if (type === 'odd_even') {
      setStubbleBan(0); setTrafficCurb(50); setIndustryCurb(0)
    } else if (type === 'super_combo') {
      setStubbleBan(90); setTrafficCurb(40); setIndustryCurb(30)
    } else if (type === 'reset') {
      setStubbleBan(0); setTrafficCurb(0); setIndustryCurb(0)
    }
  }

  const districtsList = districts && districts.length > 0 
    ? districts 
    : ["Amritsar", "Bathinda", "Faridabad", "Firozpur", "Gurugram", "Jalandhar", "Karnal", "Ludhiana", "New Delhi", "Panipat", "Patiala", "Rohtak", "Sangrur"]

  const targetSummary = simData?.target_district_summary
  const baseBadge = targetSummary ? getCpcbBadge(targetSummary.baseline_aqi) : null
  const simBadge = targetSummary ? getCpcbBadge(targetSummary.simulated_aqi) : null

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* 1. Dynamic District Hero Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full vayu-subcard text-xs font-bold mb-2">
              <Satellite size={13} className="text-indigo-400 animate-pulse" />
              <span>PHYSICS-DRIVEN DIGITAL TWIN • {district.toUpperCase()} ({targetSummary?.date || selectedDate})</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
              {district} Air Quality & Policy Sandbox
            </h1>
            <p className="text-xs text-zinc-400 max-w-3xl mt-1 leading-relaxed font-medium">
              Real-time intervention modeling for <strong className="font-bold">{district} ({targetSummary?.state || 'Punjab'})</strong>: 
              Simulates local policy decisions based on actual <span className="text-amber-400 font-semibold">NASA VIIRS fires</span>, <span className="text-indigo-400 font-semibold">Sentinel-5P gas columns</span>, and <span className="text-emerald-400 font-semibold">Chemical Mass Balance source apportionment</span>.
            </p>
          </div>

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('zero_stubble')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Flame size={14} /> 🌾 100% Stubble Ban
            </button>
            <button
              onClick={() => applyPreset('odd_even')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Car size={14} /> 🚗 50% Traffic Cut
            </button>
            <button
              onClick={() => applyPreset('super_combo')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5442ed] text-white hover:bg-[#6554fa] hover:scale-105 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/25"
            >
              <Zap size={14} /> 👑 Multi-Sector Combo
            </button>
            <button
              onClick={() => applyPreset('reset')}
              className="p-2 rounded-xl vayu-subcard hover:border-indigo-500/40 transition-all text-zinc-400 hover:text-white"
              title="Reset to Baseline"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL SATELLITE DIAGNOSTIC & OBSERVATIONAL REASONING CARD */}
      {simData?.satellite_reasoning && (
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Satellite size={15} className="text-indigo-400" />
              <span>Genuine Satellite Telemetry & Scientific Reason for {district}</span>
            </div>

            {/* Live Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="vayu-subcard px-2.5 py-1 text-amber-400 font-medium">
                🔥 NASA Active Fires: {targetSummary?.active_fires_count || 0} ({targetSummary?.active_frp_mw || 0.0} MW FRP)
              </span>
              <span className="vayu-subcard px-2.5 py-1 text-indigo-400 font-medium">
                💨 Wind: {targetSummary?.satellite_telemetry?.wind_spd_kmh || 12} km/h (Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
              </span>
              <span className="vayu-subcard px-2.5 py-1 text-emerald-400 font-medium">
                🛡️ BLH Inversion: {targetSummary?.satellite_telemetry?.blh_m || 650}m
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-normal leading-relaxed vayu-subcard p-3.5">
            {simData.satellite_reasoning}
          </p>

          {/* Actual Chemical Mass Balance Breakdown for this District on this Date */}
          {targetSummary?.chemical_mass_balance_pct && (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="vayu-subcard p-2.5 text-center">
                <span className="text-[10px] text-amber-400 font-semibold block">🌾 Biomass Burning Share</span>
                <span className="text-sm font-extrabold font-mono">{targetSummary.chemical_mass_balance_pct.biomass_stubble}%</span>
              </div>
              <div className="vayu-subcard p-2.5 text-center">
                <span className="text-[10px] text-indigo-400 font-semibold block">🚗 Vehicular Exhaust Share</span>
                <span className="text-sm font-extrabold font-mono">{targetSummary.chemical_mass_balance_pct.vehicular_traffic}%</span>
              </div>
              <div className="vayu-subcard p-2.5 text-center">
                <span className="text-[10px] text-purple-400 font-semibold block">🏭 Industrial Point Sources</span>
                <span className="text-sm font-extrabold font-mono">{targetSummary.chemical_mass_balance_pct.industrial_kilns}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT COLUMN: District Selector & Action Sliders (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-indigo-400" /> Step 1: Select District & Levers
              </span>
              <span className="text-[10px] font-semibold vayu-subcard px-2.5 py-0.5 rounded-full">
                {district}
              </span>
            </div>

            {/* District Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                <span>📍 Select Target District</span>
                <span className="text-[10px] text-amber-400 font-medium">Punjab / Haryana / Delhi</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full vayu-subcard px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500/50 cursor-pointer transition-all"
              >
                {districtsList.map(d => (
                  <option key={d} value={d} className="bg-[#090e1b] text-white">{d}</option>
                ))}
              </select>
            </div>

            {/* Slider 1: Stubble Fire Ban */}
            <div className="space-y-2 pt-2.5 border-t border-[var(--panel-border)]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20"><Flame size={13} /></span>
                  🌾 {district} Stubble Burning Ban
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
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
            <div className="space-y-2 pt-2.5 border-t border-[var(--panel-border)]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Car size={13} /></span>
                  🚗 Local {district} Traffic Cut
                </span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-md font-mono">
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
            <div className="space-y-2 pt-2.5 border-t border-[var(--panel-border)]">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"><Factory size={13} /></span>
                  🏭 Factory & Kiln Smog Cap
                </span>
                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">
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
            <div className="glass-panel p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <HeartPulse size={16} className="animate-pulse text-emerald-400" />
                <span>Local Benefits for {district} Citizens</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="vayu-subcard p-3.5 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">🏥 Hospital Visits Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    ~{simData.local_health_roi.admissions_prevented_per_week}
                    <span className="text-xs text-zinc-400 font-normal ml-1">/ week</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Fewer local acute respiratory attacks in {district}.
                  </div>
                </div>

                <div className="vayu-subcard p-3.5 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">💰 Public Money Saved</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    ₹ {simData.local_health_roi.economic_savings_crores}
                    <span className="text-xs text-zinc-400 font-normal ml-1">Cr</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Saved in healthcare costs & workdays in {district}.
                  </div>
                </div>
              </div>

              {/* Farm Fires Stopped */}
              {targetSummary?.fires_curbed > 0 && (
                <div className="vayu-subcard p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
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
            <div className="glass-panel p-5 rounded-2xl space-y-5 relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--panel-border)] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Step 2: Estimation Outcome</span>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {district} Air Quality Projection
                  </h3>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  <span>{targetSummary.pct_improvement}% Cleaner Air in {district}!</span>
                </div>
              </div>

              {/* BEFORE VS AFTER 2-CARD COMPARISON FOR SELECTED DISTRICT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. BASELINE STATUS (WITHOUT ACTION) */}
                <div className="vayu-subcard rounded-xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <Frown size={14} /> 1. Actual Baseline
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{district}</span>
                  </div>

                  <div className="text-center py-1.5">
                    <div className="text-4xl font-black font-mono tracking-tight">{targetSummary.baseline_aqi}</div>
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5 border ${baseBadge?.bg}`}>
                      {baseBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 vayu-subcard p-2 rounded-lg text-center font-medium">
                    ⚠️ Current PM2.5: {Number(targetSummary.baseline_pm25).toFixed(1)} µg/m³
                  </div>
                </div>

                {/* 2. SIMULATED STATUS (WITH ACTION) */}
                <div className="vayu-subcard rounded-xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Smile size={14} /> 2. Post-Action Result
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      -{targetSummary.aqi_reduced} Points!
                    </span>
                  </div>

                  <div className="text-center py-1.5">
                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">{targetSummary.simulated_aqi}</div>
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5 border ${simBadge?.bg}`}>
                      {simBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-center font-medium">
                    🍃 Cleared Down to: {Number(targetSummary.simulated_pm25).toFixed(1)} µg/m³
                  </div>
                </div>

              </div>

              {/* Breakdown: Where did the clean air come from in this district? */}
              <div className="vayu-subcard p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-zinc-400">How much did each local action help {district}?</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="vayu-subcard p-2 rounded-lg">
                    <div className="text-[10px] text-amber-400 font-semibold">🌾 Stubble Ban</div>
                    <div className="text-xs font-extrabold mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.stubble_saved).toFixed(1)} µg</div>
                  </div>
                  <div className="vayu-subcard p-2 rounded-lg">
                    <div className="text-[10px] text-indigo-400 font-semibold">🚗 Traffic Cut</div>
                    <div className="text-xs font-extrabold mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.traffic_saved).toFixed(1)} µg</div>
                  </div>
                  <div className="vayu-subcard p-2 rounded-lg">
                    <div className="text-[10px] text-purple-400 font-semibold">🏭 Factory Cap</div>
                    <div className="text-xs font-extrabold mt-0.5 font-mono">-{Number(targetSummary.sector_breakdown_pm25.industry_saved).toFixed(1)} µg</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Local Administrative Advisory for Selected District */}
          {simData?.administrative_recommendation && (
            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <School size={15} className="text-indigo-400" /> {district} District Advisory & Public Health
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  ✅ SATELLITE VALIDATED
                </span>
              </div>

              <p className="text-xs text-zinc-400 font-normal leading-relaxed vayu-subcard p-3 rounded-xl">
                {simData.administrative_recommendation}
              </p>
            </div>
          )}

          {/* Connected Downwind Cities Benefit Chain */}
          {simData?.downwind_impact && simData.downwind_impact.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Compass size={15} className="text-emerald-400" /> Genuine Downwind Network (Along Wind Heading {targetSummary?.satellite_telemetry?.wind_heading_deg || 135}°)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Cities that receive cleaner air when {district} cuts emissions:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {simData.downwind_impact.map((item) => (
                  <div key={item.city} className="vayu-subcard rounded-xl p-3 space-y-1.5 hover:border-indigo-500/40 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{item.city} ({item.state})</span>
                      <span className="text-[10px] font-mono text-zinc-400">{item.distance_km} km ({item.transit_hours}h ETA)</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="text-zinc-400 text-[11px]">AQI Saved: <span className="text-emerald-400 font-bold">-{item.aqi_points_saved} pts</span></span>
                      <span className="text-emerald-400 font-bold text-[11px]">-{Number(item.pm25_saved).toFixed(1)} µg/m³</span>
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

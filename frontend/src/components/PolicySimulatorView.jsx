import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  Sliders, Sparkles, TrendingDown, 
  Flame, Car, Factory, HeartPulse, IndianRupee, 
  RefreshCw, Compass, School, 
  Smile, Frown, ArrowRight, Zap, CheckCircle2,
  MapPin, ShieldCheck, Activity, Users
} from 'lucide-react'

// CPCB helper
const getCpcbBadge = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good (Clean Sky)", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", bg: "bg-lime-500/20 text-lime-300 border-lime-500/40" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate (Acceptable)", bg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor (Unhealthy)", bg: "bg-orange-500/20 text-orange-300 border-orange-500/40" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor (Hazardous)", bg: "bg-red-500/20 text-red-300 border-red-500/40" }
  return { color: "#7f1d1d", label: "Severe Emergency 🚨", bg: "bg-red-950/60 text-red-400 border-red-500/60" }
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
    "Bhatinda", "Tarn Taran", "Karnal", "Kaithal", "Kurukshetra", "Ambala", "Panipat", "Delhi",
    "All Punjab", "All Haryana", "All North India (Regional Blanket Ban)"
  ]

  const targetSummary = simData?.target_district_summary
  const baseBadge = targetSummary ? getCpcbBadge(targetSummary.baseline_aqi) : null
  const simBadge = targetSummary ? getCpcbBadge(targetSummary.simulated_aqi) : null

  return (
    <div className="space-y-6">
      
      {/* 1. Dynamic District Hero Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-slate-900/70 to-blue-950/40 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
              <MapPin size={13} className="text-purple-300" />
              <span>DISTRICT POLICY SIMULATOR • {district.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {district} Air Quality & Policy Sandbox
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Simulating policy decisions for <strong className="text-purple-300">{district} ({targetSummary?.state || 'Punjab'})</strong>: See how stopping local farm fires & traffic cleans up <span className="text-emerald-400 font-bold">{district}'s own air quality</span> and protects downwind cities!
            </p>
          </div>

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('zero_stubble')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
            >
              <Flame size={15} /> 🌾 100% Stubble Ban
            </button>
            <button
              onClick={() => applyPreset('odd_even')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
            >
              <Car size={15} /> 🚗 50% Traffic Cut
            </button>
            <button
              onClick={() => applyPreset('super_combo')}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Zap size={15} /> 👑 Super Action Combo
            </button>
            <button
              onClick={() => applyPreset('reset')}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-all"
              title="Reset to Baseline"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT COLUMN: District Selector & Action Sliders (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-purple-400" /> Step 1: Select District & Actions
              </span>
              <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {district}
              </span>
            </div>

            {/* District Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>📍 Select Target District</span>
                <span className="text-[10px] text-amber-400 font-bold">Punjab / Haryana / Delhi</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-100 outline-none focus:border-purple-500 cursor-pointer shadow-sm hover:border-slate-600 transition-all"
              >
                {districtsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Slider 1: Stubble Fire Ban */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400"><Flame size={14} /></span>
                  🌾 {district} Stubble Fire Ban
                </span>
                <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30 font-mono">
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
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% (No Enforcement)</span>
                <span className="text-amber-400 font-bold">80% (Happy Seeder)</span>
                <span>100% (Zero Fires)</span>
              </div>
            </div>

            {/* Slider 2: Local Traffic Restrictions */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400"><Car size={14} /></span>
                  🚗 Local {district} Traffic Cut
                </span>
                <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/30 font-mono">
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
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% (Standard Flow)</span>
                <span className="text-blue-400 font-bold">25% (Public Transit)</span>
                <span>50% (Odd-Even)</span>
              </div>
            </div>

            {/* Slider 3: Industrial Limits */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><Factory size={14} /></span>
                  🏭 Factory & Kiln Smog Cap
                </span>
                <span className="text-sm font-black text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/30 font-mono">
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
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% (Standard)</span>
                <span className="text-purple-400 font-bold">25% (PNG Switch)</span>
                <span>50% (Halt)</span>
              </div>
            </div>

          </div>

          {/* Local Health & Economic Impact Card for Selected District */}
          {simData?.local_health_roi && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="flex items-center space-x-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <HeartPulse size={18} className="animate-pulse text-emerald-400" />
                <span>Local Benefits for {district} Citizens</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-emerald-500/20 p-4 rounded-2xl">
                  <div className="text-xs text-slate-300 font-bold">🏥 Local Hospital Admissions Avoided</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ~{simData.local_health_roi.admissions_prevented_per_week}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ week</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Fewer local children & seniors with asthma attacks in {district}.
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-emerald-500/20 p-4 rounded-2xl">
                  <div className="text-xs text-slate-300 font-bold">💰 Local Healthcare Savings</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ₹ {simData.local_health_roi.economic_savings_crores}
                    <span className="text-xs text-slate-400 font-normal ml-1">Cr</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Saved in medical treatments & lost workdays in {district}.
                  </div>
                </div>
              </div>

              {/* Farm Fires Stopped */}
              {targetSummary?.fires_curbed > 0 && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                    🌾 Farm Fires Extinguished in {district}:
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {targetSummary.fires_curbed} of {targetSummary.typical_farm_fires} fires prevented
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
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-800 bg-slate-900/60 relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 2: Estimation Outcome</span>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {district} Air Quality Projection
                  </h3>
                </div>

                <div className="bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <TrendingDown size={16} />
                  <span>{targetSummary.pct_improvement}% Cleaner Air in {district}!</span>
                </div>
              </div>

              {/* BEFORE VS AFTER 2-CARD COMPARISON FOR SELECTED DISTRICT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. BASELINE STATUS (WITHOUT ACTION) */}
                <div className="bg-red-950/25 border border-red-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <Frown size={15} /> 1. Current Baseline
                    </span>
                    <span className="text-[10px] text-red-400/80 font-mono">{district}</span>
                  </div>

                  <div className="text-center py-2">
                    <div className="text-4xl font-black text-white font-mono tracking-tight">{targetSummary.baseline_aqi}</div>
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mt-2 border ${baseBadge?.bg}`}>
                      {baseBadge?.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-red-300/80 bg-red-950/40 p-2.5 rounded-xl border border-red-500/20 text-center font-medium">
                    ⚠️ Current PM2.5: {targetSummary.baseline_pm25} µg/m³
                  </div>
                </div>

                {/* 2. SIMULATED STATUS (WITH ACTION) */}
                <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
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

                  <div className="text-[11px] text-emerald-200 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30 text-center font-bold">
                    🍃 Cleared Down to: {targetSummary.simulated_pm25} µg/m³
                  </div>
                </div>

              </div>

              {/* Breakdown: Where did the clean air come from in this district? */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-slate-300">How much did each local action help {district}?</div>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-amber-400 font-bold">🌾 Stubble Ban</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.stubble_saved} µg</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-blue-400 font-bold">🚗 Traffic Cut</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.traffic_saved} µg</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-purple-400 font-bold">🏭 Factory Cap</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">-{targetSummary.sector_breakdown_pm25.industry_saved} µg</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Local Administrative Advisory for Selected District */}
          {simData?.administrative_recommendation && (
            <div className="glass-panel p-5 rounded-3xl space-y-2.5 border border-purple-500/30 bg-gradient-to-r from-purple-950/20 to-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <School size={16} className="text-purple-400" /> {district} District Advisory & School Safety
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✅ ACTION VERIFIED
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                {simData.administrative_recommendation}
              </p>
            </div>
          )}

          {/* Connected Downwind Cities Benefit Chain */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 bg-slate-900/60">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass size={16} className="text-emerald-400" /> Downwind Network Effect: Cities Benefiting From {district}'s Action
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">When {district} stops burning stubble, smoke doesn't travel downwind to these cities:</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {simData?.downwind_impact?.map((item) => (
                <div key={item.city} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-emerald-500/40 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{item.city}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.eta_hours}h Transit</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">AQI Saved: <span className="text-emerald-400 font-bold">-{item.aqi_points_saved} pts</span></span>
                    <span className="text-emerald-300 font-bold">-{item.pm25_saved} µg/m³</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

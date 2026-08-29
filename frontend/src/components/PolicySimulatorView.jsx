import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  Sliders, ShieldCheck, Sparkles, TrendingDown, ArrowDownRight, 
  Flame, Car, Factory, HeartPulse, IndianRupee, AlertTriangle, 
  CheckCircle2, RefreshCw, Layers, Compass, FileCheck
} from 'lucide-react'

// CPCB helper
const getCpcbBadge = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", badge: "bg-lime-500/10 text-lime-400 border border-lime-500/30" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate", badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor", badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor", badge: "bg-red-500/10 text-red-400 border border-red-500/30" }
  return { color: "#7f1d1d", label: "Severe", badge: "bg-red-950/40 text-red-500 border border-red-500/30" }
}

export default function PolicySimulatorView() {
  const { selectedDate } = useStore()

  // Policy parameter state
  const [district, setDistrict] = useState("Sangrur")
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

  // Presets
  const applyPreset = (type) => {
    if (type === 'zero_stubble') {
      setStubbleBan(100)
      setTrafficCurb(0)
      setIndustryCurb(0)
    } else if (type === 'grap_emergency') {
      setDistrict("All North India (Regional Blanket Ban)")
      setStubbleBan(90)
      setTrafficCurb(40)
      setIndustryCurb(35)
    } else if (type === 'moderate') {
      setStubbleBan(50)
      setTrafficCurb(20)
      setIndustryCurb(15)
    } else if (type === 'reset') {
      setDistrict("Sangrur")
      setStubbleBan(0)
      setTrafficCurb(0)
      setIndustryCurb(0)
    }
  }

  const districtsList = simData?.available_districts || [
    "Sangrur", "Ludhiana", "Amritsar", "Patiala", "Firozpur", 
    "Bhatinda", "Tarn Taran", "Karnal", "Kaithal", "Kurukshetra", "Jind",
    "All Punjab", "All Haryana", "All North India (Regional Blanket Ban)"
  ]

  const delhiSummary = simData?.delhi_ncr_summary
  const baseBadge = delhiSummary ? getCpcbBadge(delhiSummary.baseline_aqi) : null
  const simBadge = delhiSummary ? getCpcbBadge(delhiSummary.simulated_aqi) : null

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders size={20} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold theme-adapt-text tracking-tight flex items-center gap-2">
                Digital Twin Policy & Intervention Simulator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase tracking-wider">
                  What-If Scenario
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate targeted district fire bans, Odd-Even vehicular curbs, and industrial limits to compute 48-hour downwind savings in Delhi-NCR.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('zero_stubble')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5"
          >
            <Flame size={12} /> 100% Stubble Ban
          </button>
          <button
            onClick={() => applyPreset('grap_emergency')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck size={12} /> Full GRAP-4 Emergency
          </button>
          <button
            onClick={() => applyPreset('reset')}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left Column: Parameter Controls (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} className="text-[#4b6bf5]" /> Policy Control Levers
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Interactive Modifiers</span>
            </div>

            {/* Lever 1: Target District Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Target Enforcement District</span>
                <span className="text-[10px] text-amber-400 font-mono">Upwind Source</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-[#4b6bf5] cursor-pointer shadow-sm"
              >
                {districtsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Select specific agricultural districts or execute regional blanket bans across Punjab & Haryana.
              </p>
            </div>

            {/* Lever 2: Stubble Burning Ban Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" /> Stubble Fire Reduction
                </span>
                <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {stubbleBan}% Ban
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={stubbleBan}
                onChange={(e) => setStubbleBan(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0% (No Enforcement)</span>
                <span>50% (Subsidized Happy Seeder)</span>
                <span>100% (Zero Fires)</span>
              </div>
            </div>

            {/* Lever 3: Vehicular Traffic Curb Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Car size={14} className="text-blue-400" /> Vehicular Odd-Even Curb
                </span>
                <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {trafficCurb}% Traffic Reduced
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={trafficCurb}
                onChange={(e) => setTrafficCurb(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0% (Normal Flow)</span>
                <span>25% (Public Transport Push)</span>
                <span>50% (Full Odd-Even)</span>
              </div>
            </div>

            {/* Lever 4: Industrial & Brick Kiln Limits Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Factory size={14} className="text-purple-400" /> Industrial & Kiln Emission Cap
                </span>
                <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {industryCurb}% Curtailment
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={industryCurb}
                onChange={(e) => setIndustryCurb(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0% (Standard Ops)</span>
                <span>25% (PNG Switch)</span>
                <span>50% (Emergency Halt)</span>
              </div>
            </div>

          </div>

          {/* Health & Economic ROI Summary Box */}
          {simData?.health_and_economic_roi && (
            <div className="glass-panel p-5 rounded-2xl space-y-4 border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                <HeartPulse size={16} />
                <span>Simulated Health & Economic ROI</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-semibold">Hospital Admissions Avoided</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">
                    ~{simData.health_and_economic_roi.admissions_prevented_per_week}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ week</span>
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5">Acute respiratory emergencies</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-semibold">Healthcare Savings</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">
                    ₹ {simData.health_and_economic_roi.economic_savings_crores}
                    <span className="text-xs text-slate-400 font-normal ml-1">Cr</span>
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5">Medical bills & lost workdays</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Results, Receptor City Matrix & GRAP Certificate (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          
          {/* Main Comparison Card */}
          {delhiSummary && (
            <div className="glass-panel p-6 rounded-2xl space-y-5 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Receptor Outcome</span>
                  <h3 className="text-lg font-black text-white tracking-tight">Delhi-NCR (48-Hour Impact Projection)</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                    <TrendingDown size={14} /> -{delhiSummary.pct_improvement}% Cleaner Air
                  </span>
                </div>
              </div>

              {/* Before vs After Gauge Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Baseline Box */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Baseline Status</span>
                  <div className="text-3xl font-black text-slate-200 mt-1 font-mono">{delhiSummary.baseline_aqi}</div>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${baseBadge?.badge}`}>
                    {baseBadge?.label.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">PM2.5: {delhiSummary.baseline_pm25} µg/m³</div>
                </div>

                {/* Simulated Outcome Box */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-center relative">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <Sparkles size={11} /> 2. Post-Intervention
                  </span>
                  <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">{delhiSummary.simulated_aqi}</div>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${simBadge?.badge}`}>
                    {simBadge?.label.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-emerald-300 mt-2 font-mono">PM2.5: {delhiSummary.simulated_pm25} µg/m³</div>
                </div>
              </div>

              {/* Sector Reduction Progress Bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Total PM2.5 Inflow Curtailed:</span>
                  <span className="text-emerald-400 font-mono">-{delhiSummary.pm25_reduced} µg/m³ ({delhiSummary.aqi_reduced} AQI Points)</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-medium text-slate-400">
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-amber-400 font-bold">🌾 Stubble Saved</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">-{delhiSummary.sector_breakdown_pm25.biomass_saved} µg</div>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-blue-400 font-bold">🚗 Traffic Saved</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">-{delhiSummary.sector_breakdown_pm25.vehicular_saved} µg</div>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-purple-400 font-bold">🏭 Industrial Saved</div>
                    <div className="text-slate-200 font-mono font-bold mt-0.5">-{delhiSummary.sector_breakdown_pm25.industrial_saved} µg</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Downwind Receptor Cities Matrix */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Compass size={14} className="text-emerald-400" /> Downwind Receptor Cities Impact Matrix
              </span>
              <span className="text-[10px] text-slate-500 font-mono">48-Hour Advection Window</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {simData?.receptor_cities?.map((city) => (
                <div key={city.city} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{city.city}</div>
                      <div className="text-[9px] text-slate-500 font-mono">Transit ETA: {city.transit_eta_hours}h</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                      -{city.pct_improvement}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/50 font-mono">
                    <span className="text-slate-500">AQI: <span className="line-through text-slate-400">{city.baseline_aqi}</span> ➔ <span className="text-emerald-400 font-bold">{city.simulated_aqi}</span></span>
                    <span className="text-slate-400">Saved: <span className="text-emerald-400 font-bold">-{city.pm25_reduced} µg</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CAQM GRAP Stage De-escalation Regulatory Certificate */}
          {simData?.grap_compliance && (
            <div className="glass-panel p-5 rounded-2xl space-y-3 border border-purple-500/20 bg-purple-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={16} /> Commission for Air Quality Management (CAQM) Compliance
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${simData.grap_compliance.can_deescalate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {simData.grap_compliance.can_deescalate ? "DE-ESCALATION VALIDATED" : "THRESHOLD MONITORED"}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {simData.grap_compliance.recommendation}
              </p>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                <span>Baseline: <span className="font-bold text-red-400">{simData.grap_compliance.baseline.stage}</span></span>
                <span>➔ Simulated: <span className="font-bold text-emerald-400">{simData.grap_compliance.simulated.stage}</span></span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

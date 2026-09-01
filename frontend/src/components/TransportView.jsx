import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, useMap } from 'react-leaflet'
import { 
  Wind, ShieldAlert, Navigation, ArrowUpRight, Compass, Activity, Clock, Layers, 
  MapPin, Flame, AlertTriangle, ArrowRight, Gauge, Play, Pause, RotateCcw
} from 'lucide-react'

// Helper component to smoothly center map
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, zoom, map])
  return null
}

export default function TransportView() {
  const { selectedDate, theme } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('corridor') // 'corridor', 'pathway', 'scientific'
  const [chartMode, setChartMode] = useState('bars') // 'bars', 'decay'
  const [selectedHour, setSelectedHour] = useState(48)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/wind?date=${selectedDate}`)
        const resData = await res.json()
        setData(resData)
      } catch (err) {
        console.error("Failed to load wind data:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedDate])

  // Auto-play animation through 48h timeline
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour(prev => {
          if (prev >= 48) return 0
          return prev + 12
        })
      }, 2200)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400 font-medium">Computing Lagrangian wind transport & smoke plume paths...</span>
      </div>
    )
  }

  // Format Recharts data with clear intuitive labels
  const chartData = (data.lag_analysis || []).map(lag => ({
    name: `Day ${lag.lag_days} (${lag.lag_days * 24}h)`,
    'Direct Fire Link': Math.abs(lag.raw_correlation),
    'Weather-Adjusted Stubble Impact': Math.abs(lag.partial_correlation),
    raw_val: lag.raw_correlation,
    partial_val: lag.partial_correlation
  }))

  const checkpoints = data.checkpoints || [
    { hour: "0h", name: "Sangrur & Amritsar (Punjab)", lat: 30.24, lon: 75.84, stage: "Smoke Source / Plume Rise", altitude: "1,150m (Briggs Lofting)", pm25_influx: "+185 µg/m³" },
    { hour: "12h", name: "Patiala & Ambala Transit", lat: 30.34, lon: 76.38, stage: "Advection along NW Jetstream", altitude: "920m (Mid-PBL)", pm25_influx: "+140 µg/m³" },
    { hour: "24h", name: "Karnal & Kurukshetra Valley", lat: 29.68, lon: 76.98, stage: "Boundary Layer Entrainment", altitude: "680m (Descending)", pm25_influx: "+195 µg/m³" },
    { hour: "36h", name: "Panipat & Sonipat (NCR Entry)", lat: 29.39, lon: 76.96, stage: "Pre-Delhi Accumulation", altitude: "460m (Ground Layer)", pm25_influx: "+220 µg/m³" },
    { hour: "48h", name: "Delhi-NCR (Receptor Zone)", lat: 28.61, lon: 77.20, stage: "Peak Inversion Smog Trap", altitude: "Surface to 380m (Trapped)", pm25_influx: "+265 µg/m³" }
  ]

  const cityImpacts = data.city_impacts || [
    { city: "Delhi (Central / NCR)", eta_hours: "36–48h", smoke_share_pct: 68, expected_pm25: 245, status: "Severe Inversion Trap", risk_color: "#ef4444" },
    { city: "Gurugram & Faridabad", eta_hours: "42–48h", smoke_share_pct: 64, expected_pm25: 230, status: "Secondary Transport", risk_color: "#f97316" },
    { city: "Karnal & Panipat", eta_hours: "18–24h", smoke_share_pct: 52, expected_pm25: 190, status: "Corridor Transit", risk_color: "#eab308" },
    { city: "Noida & Greater Noida", eta_hours: "40–48h", smoke_share_pct: 62, expected_pm25: 225, status: "Downwind Basin Trap", risk_color: "#f97316" },
    { city: "Ambala & Kurukshetra", eta_hours: "8–12h", smoke_share_pct: 44, expected_pm25: 165, status: "Proximal Influx", risk_color: "#38bdf8" }
  ]

  const physics = data.physics_telemetry || {
    fire_count: 0,
    total_frp_mw: 0.0,
    corridor_status: "CLEAN_ATMOSPHERE",
    status_label: "Clean Air (Zero Active Stubble Fires)",
    status_description: "Zero active farm fire clusters detected in Punjab/Haryana today. Clean atmospheric transit corridor.",
    boundary_layer_height_m: 420,
    ventilation_index_m2s: 1680,
    is_inversion_trap: false,
    plume_injection_height_m: 0,
    lateral_dispersion_sigma_km: 0,
    dominant_corridor: "NW Corridor"
  }

  const isClean = physics.corridor_status === "CLEAN_ATMOSPHERE" || physics.fire_count === 0
  const isDissipating = physics.corridor_status === "DISSIPATING_PLUME"

  // Active checkpoint based on hour
  const activeCheckpointIndex = Math.min(Math.floor(selectedHour / 12), checkpoints.length - 1)
  const currentCheckpoint = checkpoints[activeCheckpointIndex]

  // Construct trajectory coordinates for polyline
  const trajectoryCoords = checkpoints.map(c => [c.lat, c.lon])
  const activeTrajectorySlice = checkpoints.slice(0, activeCheckpointIndex + 1).map(c => [c.lat, c.lon])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner with View Tabs & Real-Time Dynamic Corridor Status */}
      <div className="glass-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isClean ? 'bg-emerald-500' : isDissipating ? 'bg-amber-500' : 'bg-red-500 animate-ping'}`}></span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isClean ? 'text-emerald-500' : isDissipating ? 'text-amber-500' : 'text-red-500'}`}>
              {physics.status_label || "Lagrangian Smoke Dispersion Model"}
            </span>
          </div>
          <h2 className="text-xl font-black flex items-center tracking-tight mt-1">
            <Wind size={22} className="text-[#5442ed] mr-2.5" /> Wind Transport & Smoke Tracking
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {physics.status_description || "Real-time advection tracking: From Punjab & Haryana farm fires downwind to Delhi-NCR receptors over 48 hours."}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1.5 vayu-subcard p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('corridor')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'corridor' ? 'bg-[#5442ed] text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Navigation size={13} />
            <span>Smoke Corridor Map</span>
          </button>
          <button
            onClick={() => setActiveTab('pathway')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'pathway' ? 'bg-[#5442ed] text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>48h Transit Pathway</span>
          </button>
          <button
            onClick={() => setActiveTab('scientific')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'scientific' ? 'bg-[#5442ed] text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Scientific Proof</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Transport Physics Telemetry Cards (Theme-Adaptive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Wind Corridor Vector */}
        <div className="glass-panel p-4 border-l-4 border-l-sky-500 flex flex-col justify-between h-[135px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-sky-500/15 text-sky-500 border border-sky-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">
              <Compass size={11} className="mr-1" /> Wind Vector
            </span>
            <ArrowUpRight size={16} className="text-sky-500" />
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black tracking-tight">
              {data.wind_speed_kmh || 13.2} km/h • {data.wind_direction || "NW Corridor"}
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              {isClean ? "Clean atmospheric air flow" : "Blowing towards Delhi-NCR"}
            </span>
          </div>
        </div>

        {/* Card 2: Smoke Source Region & Fire Count */}
        <div className={`glass-panel p-4 flex flex-col justify-between h-[135px] border-l-4 ${
          isClean ? 'border-l-emerald-500' : isDissipating ? 'border-l-amber-500' : 'border-l-orange-500'
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center border ${
              isClean 
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' 
                : 'bg-orange-500/15 text-orange-500 border-orange-500/30'
            }`}>
              <Flame size={11} className="mr-1" /> Farm Fires ({physics.fire_count})
            </span>
            <span className="text-[10px] text-orange-500 font-mono font-bold">
              {physics.total_frp_mw > 0 ? `FRP: ${physics.total_frp_mw} MW` : "0 MW (Clean)"}
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black tracking-tight">
              {isClean ? "Zero Active Fires (Clean)" : isDissipating ? "Low Fire Activity" : "Sangrur & Tarn Taran (Punjab)"}
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              {isClean ? "No biomass emissions detected" : isDissipating ? "Low smoke release / Rapid dilution" : "High-intensity biomass burning cluster"}
            </span>
          </div>
        </div>

        {/* Card 3: Delhi Arrival Time / Status */}
        <div className="glass-panel p-4 border-l-4 border-l-amber-500 flex flex-col justify-between h-[135px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">
              <Clock size={11} className="mr-1" /> Delhi Plume ETA
            </span>
            <span className="text-[10px] text-amber-500 font-mono font-bold">{isClean ? "0 km Influx" : "310 km Transit"}</span>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black tracking-tight">
              {isClean ? "N/A (Clean Baseline)" : isDissipating ? "Vanished in Transit" : "36 – 48 Hours (Day 2 Peak)"}
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              {isClean ? "Pure urban background AQI" : isDissipating ? "Dispersed before reaching NCR" : "Maximum PM2.5 arrival window"}
            </span>
          </div>
        </div>

        {/* Card 4: Atmospheric Inversion Ceiling */}
        <div className={`glass-panel p-4 flex flex-col justify-between h-[135px] border-l-4 ${
          physics.is_inversion_trap ? 'border-l-red-500' : 'border-l-emerald-500'
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center border ${
              physics.is_inversion_trap 
                ? 'bg-red-500/15 text-red-500 border-red-500/30' 
                : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
            }`}>
              {physics.is_inversion_trap ? "INVERSION SMOG TRAP" : "HIGH DISPERSION"}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">VI: {physics.ventilation_index_m2s} m²/s</span>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black tracking-tight">
              BLH: {physics.boundary_layer_height_m}m {physics.is_inversion_trap ? "(Trapped)" : "(Clean Mixing)"}
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              {physics.is_inversion_trap ? "Smoke trapped below cold boundary lid" : "Good vertical ventilation & dispersion"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TAB 1: SMOKE CORRIDOR MAP & 48H TIME-SLIDER SIMULATION */}
      {activeTab === 'corridor' && (
        <div className="grid grid-cols-12 gap-5">
          {/* Left: Map & Interactive Step Playbar (Span 8) */}
          <div className="col-span-12 lg:col-span-8 glass-panel p-5 flex flex-col h-[520px]">
            {/* Header with Step Time Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div>
                <h3 className="text-sm font-extrabold flex items-center">
                  <Navigation size={15} className="text-[#5442ed] mr-1.5" />
                  Regional Smoke Transport Corridor Map
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  Tracking smoke parcel: <strong className="text-[#5442ed]">{currentCheckpoint.name}</strong> at <strong className="text-orange-500">Hour {selectedHour}</strong>
                </span>
              </div>

              {/* 48h Time Playbar */}
              <div className="flex items-center space-x-1.5 vayu-subcard p-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-[#5442ed] text-white hover:bg-[#6554fa] transition-all"
                  title={isPlaying ? "Pause Timeline" : "Play 48h Simulation"}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                {[0, 12, 24, 36, 48].map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setSelectedHour(h)
                      setIsPlaying(false)
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-all ${
                      selectedHour === h
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container (Leaflet with Watermark-free OpenStreetMap) */}
            <div className="flex-1 rounded-xl overflow-hidden border border-[var(--panel-border)] relative z-10">
              <MapContainer
                center={[29.6, 76.5]}
                zoom={7.2}
                className="w-full h-full"
                zoomControl={true}
                key={`${selectedHour}-${theme}`}
              >
                <ChangeView center={[currentCheckpoint.lat, currentCheckpoint.lon]} zoom={7.2} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className={theme === 'dark' ? 'theme-map-dark-tiles' : ''}
                  attribution="&copy; OpenStreetMap contributors"
                />

                {/* Full Projected Trajectory Guide Line */}
                <Polyline
                  positions={trajectoryCoords}
                  pathOptions={{
                    color: theme === 'dark' ? '#94a3b8' : '#cbd5e1',
                    weight: 2.5,
                    dashArray: '5, 8',
                    opacity: 0.6
                  }}
                />

                {/* Active Advection Smoke Plume Segment */}
                <Polyline
                  positions={activeTrajectorySlice}
                  pathOptions={{
                    color: isClean ? '#10b981' : isDissipating ? '#f59e0b' : '#ef4444',
                    weight: 5,
                    opacity: 0.85
                  }}
                />

                {/* Checkpoint Circles */}
                {checkpoints.map((cp, idx) => {
                  const isCurrent = parseInt(cp.hour) === selectedHour
                  const isOrigin = idx === 0
                  const isDestination = idx === checkpoints.length - 1
                  const nodeColor = isClean 
                    ? '#10b981' 
                    : isOrigin 
                    ? '#ef4444' 
                    : isDestination 
                    ? (isDissipating ? '#10b981' : '#f59e0b') 
                    : '#38bdf8'

                  return (
                    <React.Fragment key={cp.name}>
                      {isCurrent && (
                        <Circle
                          center={[cp.lat, cp.lon]}
                          radius={35000}
                          pathOptions={{
                            color: nodeColor,
                            fillColor: nodeColor,
                            fillOpacity: 0.18,
                            weight: 1.5,
                            dashArray: '4, 4'
                          }}
                        />
                      )}

                      <CircleMarker
                        center={[cp.lat, cp.lon]}
                        radius={isOrigin ? 10 : isDestination ? 11 : isCurrent ? 8 : 6}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: nodeColor,
                          fillOpacity: 0.95,
                          weight: 2
                        }}
                      >
                        <Popup className="custom-leaflet-popup">
                          <div className="p-2.5 rounded-xl min-w-[190px]">
                            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase border-b border-[var(--panel-border)] pb-1 mb-1.5">
                              <span className={isClean ? "text-emerald-500" : "text-orange-500"}>Hour {cp.hour} Checkpoint</span>
                              <span className="text-cyan-500 font-bold">{cp.altitude}</span>
                            </div>
                            <h4 className="text-xs font-black">{cp.name}</h4>
                            <p className="text-[10px] text-zinc-400 mt-1">{cp.stage}</p>
                            <div className="mt-2 pt-1.5 border-t border-[var(--panel-border)] flex justify-between items-center text-[10px]">
                              <span className="text-zinc-400">PM2.5 Influx:</span>
                              <span className={`font-extrabold font-mono ${isClean ? 'text-emerald-500' : 'text-red-500'}`}>{cp.pm25_influx}</span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </React.Fragment>
                  )
                })}
              </MapContainer>

              {/* In-Map Floating Corridor Legend */}
              <div className="absolute bottom-3 left-3 vayu-subcard p-2.5 text-[10px] backdrop-blur-md z-[1000] space-y-1 select-none pointer-events-none shadow-lg">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
                  {isClean ? "Status: Clean Wind Corridor" : isDissipating ? "Status: Dissipating Plume" : "Status: Active Stubble Transport"}
                </div>
                {isClean ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Zero Farm Fires (Clean Baseline)</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span>Punjab Stubble Fires (Origin 0h)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <span>Haryana Transit (12h - 36h)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Delhi Inversion Trap (48h Peak)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Downwind Receptor Cities Impact Matrix (Theme-Adaptive) */}
          <div className="col-span-12 lg:col-span-4 glass-panel p-5 flex flex-col justify-between h-[520px]">
            <div>
              <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
                <h3 className="text-sm font-extrabold flex items-center">
                  <AlertTriangle size={15} className="text-orange-500 mr-1.5" />
                  Downwind City Impact Matrix
                </h3>
                <span className="text-[9px] font-mono text-[#5442ed] bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded font-bold">
                  48h Window
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Estimated smoke inflow and expected PM2.5 spike along the active wind vector:
              </p>

              {/* City Cards List */}
              <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[380px] pr-1">
                {cityImpacts.map((city) => (
                  <div 
                    key={city.city} 
                    className="p-3 rounded-xl vayu-subcard transition-all hover:border-indigo-500/40"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold flex items-center">
                          <MapPin size={11} className="text-zinc-400 mr-1" />
                          {city.city}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5 block">
                          ETA: <b className="text-[#5442ed]">{city.eta_hours}</b>
                        </span>
                      </div>
                      <div className="text-right">
                        <span 
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase"
                          style={{ 
                            color: city.risk_color, 
                            borderColor: `${city.risk_color}40`,
                            backgroundColor: `${city.risk_color}15`
                          }}
                        >
                          {city.status}
                        </span>
                        <div className="text-xs font-extrabold mt-1">
                          PM2.5: <span className="text-orange-500 font-mono">~{city.expected_pm25} µg/m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar: Smoke Share % */}
                    <div className="mt-2">
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                        <span>Biomass Smoke Share:</span>
                        <span className="font-extrabold text-orange-500">+{city.smoke_share_pct}% of total AQI</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${city.smoke_share_pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: STEP-BY-STEP 48-HOUR TRANSIT PATHWAY */}
      {activeTab === 'pathway' && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold flex items-center">
              <Clock size={18} className="text-orange-500 mr-2" />
              Detailed 48-Hour Kinematic Transport Sequence
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Physics breakdown of how stubble smoke lofting, lateral Gaussian dispersion, and boundary layer trapping progress from farm to city:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {checkpoints.map((cp) => (
              <div 
                key={cp.hour}
                className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 transition-all ${
                  selectedHour === parseInt(cp.hour)
                    ? 'bg-orange-500/10 border-orange-500/50 shadow-md'
                    : 'vayu-subcard hover:border-indigo-500/40'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-orange-500/15 text-orange-500 border border-orange-500/30">
                    Hour {cp.hour}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-500 font-bold">{cp.altitude.split(' ')[0]}</span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold">{cp.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium leading-snug">
                    {cp.stage}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--panel-border)] flex justify-between items-center text-[10px]">
                  <span className="text-zinc-400">Layer Influx:</span>
                  <span className={`font-mono font-bold ${isClean ? 'text-emerald-500' : 'text-red-500'}`}>{cp.pm25_influx}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SCIENTIFIC PROOF (LAG-CORRELATION & GAUSSIAN PLUME) */}
      {activeTab === 'scientific' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
            <div>
              <h3 className="text-base font-extrabold flex items-center">
                <Activity size={18} className="text-[#5442ed] mr-2" />
                Lagrangian Stubble-to-Smog Mathematical Verification
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Proof that farm fire emissions show peak correlation with Delhi-NCR PM2.5 after a 24h–48h meteorological transit lag:
              </p>
            </div>

            <div className="flex items-center space-x-2 vayu-subcard p-1">
              <button
                onClick={() => setChartMode('bars')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'bars' ? 'bg-[#5442ed] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Correlation Bars
              </button>
              <button
                onClick={() => setChartMode('decay')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'decay' ? 'bg-[#5442ed] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Decay Trajectory Area
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bars' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff', 
                      borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                      color: theme === 'dark' ? '#ffffff' : '#0f172a', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="Direct Fire Link" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Weather-Adjusted Stubble Impact" fill="#5442ed" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight={600} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#090d16' : '#ffffff', 
                      borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                      color: theme === 'dark' ? '#ffffff' : '#0f172a', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="Weather-Adjusted Stubble Impact" stroke="#5442ed" fill="rgba(84, 66, 237, 0.2)" strokeWidth={3} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

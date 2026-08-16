import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Rectangle } from 'react-leaflet'
import { ShieldAlert, Play, ArrowUpRight, TrendingUp, TrendingDown, Clock, Activity, Flame, Sparkles } from 'lucide-react'

// CPCB color & category helpers
const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", badge: "bg-lime-500/10 text-lime-400 border border-lime-500/30" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate", badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor", badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor", badge: "bg-red-500/10 text-red-400 border border-red-500/30" }
  return { color: "#7f1d1d", label: "Severe", badge: "bg-red-950/40 text-red-500 border border-red-500/30" }
}

const getCellColorAndLabel = (cell, layer) => {
  if (layer === 'AQI') {
    return getCpcbColorAndLabel(cell.aqi)
  }
  if (layer === 'PM2.5') {
    const val = cell.pm25
    if (val <= 30) return { color: "#10b981", label: "Good" }
    if (val <= 60) return { color: "#84cc16", label: "Satisfactory" }
    if (val <= 90) return { color: "#eab308", label: "Moderate" }
    if (val <= 120) return { color: "#f97316", label: "Poor" }
    if (val <= 250) return { color: "#ef4444", label: "Very Poor" }
    return { color: "#7f1d1d", label: "Severe" }
  }
  if (layer === 'PM10') {
    const val = cell.pm10 || (cell.pm25 * 1.5)
    if (val <= 50) return { color: "#10b981", label: "Good" }
    if (val <= 100) return { color: "#84cc16", label: "Satisfactory" }
    if (val <= 250) return { color: "#eab308", label: "Moderate" }
    if (val <= 350) return { color: "#f97316", label: "Poor" }
    if (val <= 430) return { color: "#ef4444", label: "Very Poor" }
    return { color: "#7f1d1d", label: "Severe" }
  }
  if (layer === 'HCHO') {
    const val = cell.hcho
    if (val <= 3.0) return { color: "#10b981", label: "Low" }
    if (val <= 5.0) return { color: "#84cc16", label: "Satisfactory" }
    if (val <= 7.0) return { color: "#eab308", label: "Moderate" }
    if (val <= 10.0) return { color: "#f97316", label: "High" }
    if (val <= 14.0) return { color: "#ef4444", label: "Very High" }
    return { color: "#7f1d1d", label: "Severe" }
  }
  return { color: "#10b981", label: "Good" }
}

// Custom SVG Sparkline Generator
const Sparkline = ({ values, color }) => {
  if (!values || values.length < 2) return null
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV !== 0 ? maxV - minV : 1.0
  const width = 120
  const height = 30
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width
    const y = height - ((val - minV) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="120" height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}

// Custom SVG Semi-circular Gauge Chart
const SVGGauge = ({ value, color, label }) => {
  const radius = 50
  const strokeWidth = 8
  const circumference = Math.PI * radius // semi-circle
  const percent = Math.min(100, Math.max(0, (value / 500) * 100))
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center h-28 relative">
      <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
        {/* Background Arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill Arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div className="absolute bottom-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight text-white">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{label}</div>
      </div>
    </div>
  )
}

export default function DashboardView() {
  const { 
    selectedDate, 
    selectedDistrict, 
    districts, 
    setSelectedDistrict, 
    dashboardData, 
    mapData, 
    fetchDashboard, 
    fetchMapData,
    setActiveTab
  } = useStore()

  const [selectedLayer, setSelectedLayer] = useState('AQI')

  useEffect(() => {
    fetchDashboard()
    fetchMapData()
  }, [selectedDate, selectedDistrict])

  if (!dashboardData || !dashboardData.kpis) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Loading Dashboard Observables...</span>
      </div>
    )
  }

  const { kpis, focus } = dashboardData
  const aqiDetails = getCpcbColorAndLabel(kpis.aqi)

  // Pollutants for focus district
  const pollutants = focus ? [
    { name: "PM2.5", value: focus.pm25, max: 250, color: "#eab308" },
    { name: "PM10", value: focus.pm10, max: 430, color: "#f97316" },
    { name: "NO₂", value: focus.no2, max: 180, color: "#10b981" },
    { name: "SO₂", value: focus.so2, max: 380, color: "#84cc16" },
    { name: "CO", value: focus.co, max: 10.0, color: "#0ea5e9" },
    { name: "O₃", value: focus.o3, max: 168, color: "#a855f7" }
  ] : []

  // Donut chart formatting for Source Attribution
  const donutData = focus ? [
    { name: 'Biomass', value: focus.source_attribution.biomass },
    { name: 'Vehicular', value: focus.source_attribution.vehicular },
    { name: 'Industrial', value: focus.source_attribution.industrial }
  ] : []
  const COLORS = ['#f97316', '#3b82f6', '#64748b']

  // Line chart formatting for trend
  const trendData = focus ? focus.trend.dates.map((date, idx) => ({
    date: date.substring(5),
    AQI: focus.trend.aqi[idx],
    'PM2.5': focus.trend.pm25[idx],
    'PM10': focus.trend.pm10[idx]
  })) : []

  return (
    <div className="space-y-5">
      {/* 1. KPIs Row - Cleaned to 4 detailed columns to avoid compression */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* KPI 1: Estimated AQI (Span 4) */}
        <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated AQI</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Delhi NCR Basin</div>
              <div className="text-4xl font-extrabold mt-1 text-white tracking-tight">{kpis.aqi}</div>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 ${aqiDetails.badge}`}>
                {aqiDetails.label.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <div className="text-[10px] text-emerald-400 font-bold flex items-center space-x-0.5">
                <TrendingDown size={12} />
                <span>8.4%</span>
              </div>
              <span className="text-[8px] text-slate-500 mt-0.5 font-medium">vs yesterday</span>
              <div className="mt-4">
                <Sparkline values={kpis.sparklines.aqi} color={aqiDetails.color} />
              </div>
            </div>
          </div>
          <div className="text-[8px] text-slate-500 font-medium flex items-center space-x-1 mt-1">
            <Clock size={10} />
            <span>Updated 2 mins ago</span>
          </div>
        </div>

        {/* KPI 2: Pollutants Overview (Span 3) */}
        <div className="col-span-3 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[160px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Particulate Matter</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Focus District Averages</div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] font-medium text-slate-400">PM2.5</div>
                <div className="text-2xl font-extrabold text-yellow-400 tracking-tight">{focus ? focus.pm25.toFixed(0) : "77"}</div>
                <div className="text-[8px] text-slate-500 mt-0.5">µg/m³</div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400">PM10</div>
                <div className="text-2xl font-extrabold text-orange-400 tracking-tight">{focus ? focus.pm10.toFixed(0) : "143"}</div>
                <div className="text-[8px] text-slate-500 mt-0.5">µg/m³</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] text-slate-500 font-medium border-t border-slate-800/40 pt-1.5 mt-1">
            <span>CPCB Guideline Limits</span>
            <span className="font-bold text-slate-400">60 / 100</span>
          </div>
        </div>

        {/* KPI 3: HCHO Hotspots (Span 2) */}
        <div className="col-span-2 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HCHO Hotspots</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">DBSCAN Clusters</div>
              <div className="text-3xl font-extrabold mt-1.5 text-purple-400 tracking-tight">24</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse"></div>
          </div>
          <div className="mt-1">
            <Sparkline values={kpis.sparklines.hcho} color="#a855f7" />
          </div>
          <div className="text-[8px] text-purple-400/90 font-bold uppercase tracking-wider">Elevated Activity</div>
        </div>

        {/* KPI 4: Active Fires (Span 3) */}
        <div className="col-span-3 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Fires</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">MODIS/VIIRS Satellite</div>
              <div className="text-3xl font-extrabold mt-1.5 text-orange-500 tracking-tight">{kpis.fires}</div>
            </div>
            <div className="text-[9px] text-orange-400 font-bold flex items-center space-x-0.5">
              <TrendingUp size={10} />
              <span>+15%</span>
            </div>
          </div>
          <div className="mt-1">
            <Sparkline values={kpis.sparklines.fires} color="#f97316" />
          </div>
          <div className="text-[8px] text-slate-500 font-medium flex justify-between">
            <span>Sensor confidence rate</span>
            <span className="font-bold text-orange-400">92% avg</span>
          </div>
        </div>

      </div>

      {/* AI Insight Box (Added intelligence layer) */}
      {focus && (
        <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 flex items-center space-x-3.5 relative overflow-hidden">
          <div className="absolute right-0 top-0 text-slate-900/10 pointer-events-none translate-x-4 -translate-y-4">
            <Sparkles size={160} />
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/35 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-purple-400 tracking-wide uppercase mr-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">AI Atmosphere Insight</span>
            <span className="text-slate-300 font-medium">
              Stubble burning markers indicate an HCHO column density of <b className="text-slate-100">{focus.hcho_column.toFixed(2)}</b> in <b className="text-slate-100">{focus.district}</b>. 
              Lagrangian wind analysis (u: {focus.wind_speed.toFixed(1)} km/h) forecasts downwind particulate transport carrying smoke plumes towards downwind receptors within <b className="text-slate-100">12–18 hours</b>.
            </span>
          </div>
        </div>
      )}

      {/* 2. Middle Row: Map Container & Focus Right Panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Map Body (Left 7 Cols - Enlarged) */}
        <div className="col-span-7 glass-panel rounded-2xl p-5 flex flex-col h-[570px] relative">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-sm font-extrabold text-slate-200 tracking-tight">Geospatial GIS Atmospheric Overview</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Interactive pixelated satellite grid</div>
            </div>
            {/* Toggles */}
            <div className="flex bg-slate-900/50 border border-slate-800/80 rounded-lg p-0.5 text-xs text-slate-400">
              {['AQI', 'PM2.5', 'PM10', 'HCHO'].map((layer) => {
                const isActive = selectedLayer === layer
                return (
                  <span
                    key={layer}
                    onClick={() => setSelectedLayer(layer)}
                    className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#4b6bf5] text-white shadow-md' 
                        : 'hover:text-slate-200'
                    }`}
                  >
                    {layer}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/80 relative z-10">
            {/* Leaflet Map */}
            {mapData && (
              <MapContainer 
                center={[30.1, 75.8]} 
                zoom={8} 
                className="w-full h-full"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                
                {/* 1. Draw Grid Cells as rectangular satellite pixels */}
                {mapData.cells && mapData.cells.map((cell) => {
                  const { color } = getCellColorAndLabel(cell, selectedLayer)
                  const bounds = [
                    [cell.latitude - 0.075, cell.longitude - 0.075],
                    [cell.latitude + 0.075, cell.longitude + 0.075]
                  ];

                  return (
                    <Rectangle
                      key={`cell-${cell.cell_id}`}
                      bounds={bounds}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.38,
                        color: color,
                        weight: 0.5,
                        opacity: 0.1
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-700/60 pb-1">{cell.district} ({cell.state})</div>
                          <div className="text-slate-300 font-semibold">{selectedLayer}: {selectedLayer === 'HCHO' ? cell.hcho.toFixed(4) : cell.aqi}</div>
                          <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-700/40 pt-1 space-y-0.5">
                            <div>PM2.5: {cell.pm25} µg/m³</div>
                            <div>Boundary Layer: {cell.blh} m</div>
                          </div>
                        </div>
                      </Popup>
                    </Rectangle>
                  )
                })}

                {/* 2. Hotspots - visually dominant */}
                {mapData.hotspots && mapData.hotspots.map((hot, idx) => (
                  <Circle
                    key={`hot-${idx}`}
                    center={[hot.latitude, hot.longitude]}
                    radius={10000}
                    pathOptions={{
                      color: hot.is_biomass ? '#a855f7' : '#6366f1',
                      weight: 2.5,
                      fillColor: hot.is_biomass ? '#a855f7' : '#6366f1',
                      fillOpacity: 0.22,
                      dashArray: '3, 4'
                    }}
                  />
                ))}

                {/* 3. Draw Active Fires */}
                {mapData.fires && mapData.fires.map((fire, idx) => (
                  <CircleMarker
                    key={`fire-${idx}`}
                    center={[fire.latitude, fire.longitude]}
                    radius={6}
                    pathOptions={{
                      fillColor: '#f97316',
                      fillOpacity: 0.9,
                      color: '#ffedd5',
                      weight: 1.5
                    }}
                  />
                ))}

                {/* 4. Draw Trajectories */}
                {mapData.plumes && mapData.plumes.map((plume, idx) => (
                  <Polyline
                    key={`plume-${idx}`}
                    positions={plume.path}
                    pathOptions={{
                      color: '#ea580c',
                      weight: 3,
                      dashArray: '6, 8',
                      opacity: 0.8
                    }}
                  />
                ))}
              </MapContainer>
            )}

            {/* Custom Map Legend overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-950/95 border border-slate-800/80 rounded-lg p-2.5 z-[1000] text-[9px] font-bold text-slate-300 space-y-1.5 shadow-2xl backdrop-blur-md">
              <div className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold">AQI Category</div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                <span>Good (0-50)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-lime-500"></span>
                <span>Satisfactory (51-100)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-yellow-500"></span>
                <span>Moderate (101-200)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
                <span>Poor (201-300)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
                <span>Severe (301+)</span>
              </div>
            </div>
          </div>

          {/* Scale colorbar */}
          <div className="scale-bar"></div>
        </div>

        {/* Right Sidebar focus district view - Restructured hierarchy */}
        <div className="col-span-5 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[570px] overflow-y-auto space-y-4">
          
          {/* Dropdown Focus Selector */}
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Analysis Target</div>
              <div className="text-sm font-extrabold text-white tracking-tight">{focus ? focus.district : "No Selection"}</div>
            </div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#4b6bf5] cursor-pointer shadow-sm font-semibold"
            >
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {focus && (
            <div className="flex-grow flex flex-col justify-between space-y-4">
              
              {/* Section 1: AQI Gauge */}
              <div className="flex flex-col items-center py-1">
                <SVGGauge 
                  value={focus.aqi} 
                  color={getCpcbColorAndLabel(focus.aqi).color} 
                  label={getCpcbColorAndLabel(focus.aqi).label} 
                />
              </div>

              {/* Section 2: Pollutant concentrations (progress bars) */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Pollutants</div>
                {pollutants.slice(0, 3).map(p => {
                  const pct = Math.min(100, (p.value / p.max) * 100)
                  return (
                    <div key={p.name} className="mb-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-300">
                        <span>{p.name}</span>
                        <span className="font-mono text-white">{p.value.toFixed(1)} <span className="text-[8px] text-slate-500 font-normal">µg</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 border border-slate-800/40 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Section 3: Surface Gases (NO2, SO2, CO) */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Surface Atmospheric Columns</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">NO₂</div>
                    <div className="font-extrabold text-[#10b981] text-xs mt-0.5">{focus.no2.toFixed(1)}</div>
                    <div className="text-[7px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">SO₂</div>
                    <div className="font-extrabold text-[#84cc16] text-xs mt-0.5">{focus.so2.toFixed(1)}</div>
                    <div className="text-[7px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">CO</div>
                    <div className="font-extrabold text-[#0ea5e9] text-xs mt-0.5">{focus.co.toFixed(2)}</div>
                    <div className="text-[7px] text-slate-600">mg/m³</div>
                  </div>
                </div>
              </div>

              {/* Section 4: 24h Trend Chart */}
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Historical 7-Day Trend</div>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#475569" fontSize={8} />
                      <YAxis stroke="#475569" fontSize={8} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc', fontSize: 10 }} />
                      <Line type="monotone" dataKey="AQI" stroke="#4b6bf5" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="PM2.5" stroke="#eab308" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="PM10" stroke="#f97316" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Row: 5 Cards */}
      <div className="bottom-card-grid">
        {/* Card 1: HCHO Hotspots */}
        <div className="bottom-card group cursor-pointer" onClick={() => setActiveTab('HCHO Hotspots')}>
          <div>
            <div className="kpi-title text-purple-400 group-hover:text-purple-300">HCHO Hotspots</div>
            <div className="kpi-value text-purple-400">24 <span className="text-xs font-normal text-slate-500">Active</span></div>
          </div>
          {/* Radar scan animation */}
          <div className="radar-container">
            <div className="radar-sweep w-full h-full bg-[conic-gradient(from_0deg,rgba(168,85,247,0.2)_0deg,transparent_90deg)]"></div>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
            View Details <ArrowUpRight size={10} className="ml-1" />
          </div>
        </div>

        {/* Card 2: Fire Detection */}
        <div className="bottom-card group cursor-pointer" onClick={() => setActiveTab('Fire Detection')}>
          <div>
            <div className="kpi-title text-orange-500 group-hover:text-orange-400">Fire Detection</div>
            <div className="kpi-value text-orange-500">{kpis.fires} <span className="text-xs font-normal text-slate-500">Active</span></div>
          </div>
          {/* Fire pulsing glow */}
          <div className="fire-glow"></div>
          <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
            View Details <ArrowUpRight size={10} className="ml-1" />
          </div>
        </div>

        {/* Card 3: Wind Transport */}
        <div className="bottom-card group cursor-pointer" onClick={() => setActiveTab('Wind Transport')}>
          <div>
            <div className="kpi-title text-sky-400 group-hover:text-sky-300">Wind Transport</div>
            <div className="kpi-value text-sky-400 text-lg mt-2">Active</div>
          </div>
          {/* Wave animation overlay */}
          <div className="wave-container">
            <div className="wave-line"></div>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
            View Details <ArrowUpRight size={10} className="ml-1" />
          </div>
        </div>

        {/* Card 4: Source Attribution */}
        {focus && (
          <div className="bottom-card flex flex-row items-center justify-between p-4 cursor-pointer group" onClick={() => setActiveTab('Source Attribution')}>
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="kpi-title text-coral-500" style={{ color: '#ff7043' }}>Source Attribution</div>
                <div className="text-xs font-bold text-slate-200 mt-1">Biomass Burning</div>
                <div className="text-2xl font-bold" style={{ color: '#ff7043' }}>{intVal(focus.source_attribution.biomass)}%</div>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
                View Details <ArrowUpRight size={10} className="ml-1" />
              </div>
            </div>
            {/* Recharts Pie Donut */}
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={28}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Card 5: Model Confidence */}
        <div className="bottom-card group cursor-pointer" onClick={() => setActiveTab('District Analytics')}>
          <div>
            <div className="kpi-title text-emerald-400 group-hover:text-emerald-300">Model Confidence</div>
            <div className="kpi-value text-emerald-400">89%</div>
            <div className="text-[9px] text-emerald-500 font-semibold uppercase mt-0.5">High Confidence</div>
          </div>
          <Sparkline values={[85, 87, 86, 88, 89, 89, 89]} color="#10b981" />
          <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
            View Details <ArrowUpRight size={10} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

const intVal = (val) => Math.round(val)

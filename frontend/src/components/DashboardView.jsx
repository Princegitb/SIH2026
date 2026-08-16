import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline } from 'react-leaflet'
import { ShieldAlert, Play, ArrowUpRight } from 'lucide-react'

// CPCB color & category helpers
const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#00b050", label: "Good", text: "#ffffff", badge: "bg-emerald-600 text-white" }
  if (aqi <= 100) return { color: "#92d050", label: "Satisfactory", text: "#000000", badge: "bg-lime-500 text-slate-900" }
  if (aqi <= 200) return { color: "#ffff00", label: "Moderate", text: "#000000", badge: "bg-yellow-400 text-slate-900" }
  if (aqi <= 300) return { color: "#ffc000", label: "Poor", text: "#000000", badge: "bg-amber-500 text-slate-900" }
  if (aqi <= 400) return { color: "#ff0000", label: "Very Poor", text: "#ffffff", badge: "bg-red-600 text-white" }
  return { color: "#c00000", label: "Severe", text: "#ffffff", badge: "bg-red-950 text-white" }
}

const getCellColorAndLabel = (cell, layer) => {
  if (layer === 'AQI') {
    return getCpcbColorAndLabel(cell.aqi)
  }
  if (layer === 'PM2.5') {
    const val = cell.pm25
    if (val <= 30) return { color: "#00b050", label: "Good" }
    if (val <= 60) return { color: "#92d050", label: "Satisfactory" }
    if (val <= 90) return { color: "#ffff00", label: "Moderate" }
    if (val <= 120) return { color: "#ffc000", label: "Poor" }
    if (val <= 250) return { color: "#ff0000", label: "Very Poor" }
    return { color: "#c00000", label: "Severe" }
  }
  if (layer === 'PM10') {
    const val = cell.pm10 || (cell.pm25 * 1.5)
    if (val <= 50) return { color: "#00b050", label: "Good" }
    if (val <= 100) return { color: "#92d050", label: "Satisfactory" }
    if (val <= 250) return { color: "#ffff00", label: "Moderate" }
    if (val <= 350) return { color: "#ffc000", label: "Poor" }
    if (val <= 430) return { color: "#ff0000", label: "Very Poor" }
    return { color: "#c00000", label: "Severe" }
  }
  if (layer === 'HCHO') {
    const val = cell.hcho
    if (val <= 3.0) return { color: "#00b050", label: "Low" }
    if (val <= 5.0) return { color: "#92d050", label: "Satisfactory" }
    if (val <= 7.0) return { color: "#ffff00", label: "Moderate" }
    if (val <= 10.0) return { color: "#ffc000", label: "High" }
    if (val <= 14.0) return { color: "#ff0000", label: "Very High" }
    return { color: "#c00000", label: "Severe" }
  }
  return { color: "#00b050", label: "Good" }
}

// Custom SVG Sparkline Generator
const Sparkline = ({ values, color }) => {
  if (!values || values.length < 2) return null
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV !== 0 ? maxV - minV : 1.0
  const width = 100
  const height = 25
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width
    const y = height - ((val - minV) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={height} className="overflow-visible mt-2">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        points={points}
      />
    </svg>
  )
}

// Custom SVG Semi-circular Gauge Chart
const SVGGauge = ({ value, color, label }) => {
  const radius = 50
  const strokeWidth = 10
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
          stroke="#f1f5f9"
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
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</div>
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

  // CPCB details for Top Estimated AQI card
  const aqiDetails = getCpcbColorAndLabel(kpis.aqi)

  // Pollutant list mapping
  const pollutants = focus ? [
    { name: "PM2.5", value: focus.pm25, max: 250, color: "#ffc000" },
    { name: "PM10", value: focus.pm10, max: 430, color: "#ff9100" },
    { name: "NO₂", value: focus.no2, max: 180, color: "#00b050" },
    { name: "SO₂", value: focus.so2, max: 380, color: "#92d050" },
    { name: "CO", value: focus.co, max: 10.0, color: "#29b6f6" },
    { name: "O₃", value: focus.o3, max: 168, color: "#bc8cff" }
  ] : []

  // Donut chart formatting for Source Attribution
  const donutData = focus ? [
    { name: 'Biomass', value: focus.source_attribution.biomass },
    { name: 'Vehicular', value: focus.source_attribution.vehicular },
    { name: 'Industrial', value: focus.source_attribution.industrial }
  ] : []
  const COLORS = ['#ff7043', '#29b6f6', '#b0bec5']

  // Line chart formatting for trend
  const trendData = focus ? focus.trend.dates.map((date, idx) => ({
    date: date.substring(5), // truncate year
    AQI: focus.trend.aqi[idx],
    'PM2.5': focus.trend.pm25[idx],
    'PM10': focus.trend.pm10[idx]
  })) : []

  return (
    <div className="space-y-5">
      {/* 1. KPIs Row */}
      <div className="grid grid-cols-6 gap-3">
        {/* KPI 1: Estimated AQI */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated AQI</div>
            <div className="text-[10px] text-slate-500 font-medium">Delhi, Delhi</div>
            <div className="text-3xl font-extrabold mt-1" style={{ color: aqiDetails.color }}>{kpis.aqi}</div>
            <div className="text-[10px] font-bold uppercase mt-1" style={{ color: aqiDetails.color }}>{aqiDetails.label}</div>
          </div>
          <Sparkline values={kpis.sparklines.aqi} color={aqiDetails.color} />
          <div className="text-[8px] text-slate-500 mt-1">Updated 10 mins ago</div>
        </div>

        {/* KPI 2: PM2.5 */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PM2.5</div>
            <div className="text-[10px] text-slate-500 font-medium">µg/m³</div>
            <div className="text-3xl font-extrabold mt-1 text-yellow-400">77</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-yellow-400">Moderate</div>
          </div>
          <Sparkline values={kpis.sparklines.pm25} color="#ffd54f" />
        </div>

        {/* KPI 3: PM10 */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PM10</div>
            <div className="text-[10px] text-slate-500 font-medium">µg/m³</div>
            <div className="text-3xl font-extrabold mt-1 text-orange-500">143</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-orange-500 text-[9px]">Unhealthy for Sensitive</div>
          </div>
          <Sparkline values={kpis.sparklines.pm10} color="#ff9100" />
        </div>

        {/* KPI 4: HCHO Hotspots */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HCHO Hotspots</div>
            <div className="text-[10px] text-slate-500 font-medium">Active</div>
            <div className="text-3xl font-extrabold mt-1 text-red-500">24</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-red-500">High</div>
          </div>
          <Sparkline values={kpis.sparklines.hcho} color="#ff1744" />
        </div>

        {/* KPI 5: Active Fires */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Fires</div>
            <div className="text-[10px] text-slate-500 font-medium">Detected</div>
            <div className="text-3xl font-extrabold mt-1 text-red-500">{kpis.fires}</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-red-500">High</div>
          </div>
          <Sparkline values={kpis.sparklines.fires} color="#ff1744" />
        </div>

        {/* KPI 6: Wind Speed */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[155px]">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind Speed</div>
            <div className="text-[10px] text-slate-500 font-medium">km/h</div>
            <div className="text-3xl font-extrabold mt-1 text-emerald-400">{kpis.wind}</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-emerald-400">Moderate</div>
          </div>
          <Sparkline values={kpis.sparklines.wind} color="#00e676" />
        </div>
      </div>

      {/* 2. Middle Row: Map Container & Focus Right Panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Map Body (Left 7 Cols) */}
        <div className="col-span-7 glass-panel rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Real-time Air Quality & Atmospheric Overview</div>
              <div className="text-[10px] text-slate-500">Satellite derived · Real-time · India</div>
            </div>
            {/* Toggles */}
            <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
              {['AQI', 'PM2.5', 'PM10', 'HCHO'].map((layer) => {
                const isActive = selectedLayer === layer
                return (
                  <span
                    key={layer}
                    onClick={() => setSelectedLayer(layer)}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#4b6bf5] text-white shadow-sm' 
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {layer}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 relative z-10">
            {/* Leaflet Map */}
            {mapData && (
              <MapContainer 
                center={[30.1, 75.8]} 
                zoom={8} 
                className="w-full h-full"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                
                {/* 1. Draw Grid Cells */}
                {mapData.cells && mapData.cells.map((cell) => {
                  const { color, label } = getCellColorAndLabel(cell, selectedLayer)
                  let displayVal = cell.aqi
                  let unitStr = ''
                  if (selectedLayer === 'PM2.5') {
                    displayVal = cell.pm25.toFixed(1)
                    unitStr = ' µg/m³'
                  } else if (selectedLayer === 'PM10') {
                    displayVal = (cell.pm10 || (cell.pm25 * 1.5)).toFixed(1)
                    unitStr = ' µg/m³'
                  } else if (selectedLayer === 'HCHO') {
                    displayVal = cell.hcho.toFixed(4)
                    unitStr = ' 10¹⁵ molecules/cm²'
                  }

                  return (
                    <CircleMarker
                      key={`cell-${cell.cell_id}`}
                      center={[cell.latitude, cell.longitude]}
                      radius={9}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.55,
                        stroke: false
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">{cell.district} ({cell.state})</div>
                          <div><b>{selectedLayer}:</b> {displayVal}{unitStr} ({label})</div>
                          <div className="text-[10px] text-slate-600 mt-1.5 border-t border-slate-200 pt-1.5 space-y-0.5">
                            <div>AQI: {cell.aqi}</div>
                            <div>PM2.5: {cell.pm25} µg/m³</div>
                            <div>HCHO: {cell.hcho.toFixed(4)}</div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}

                {/* 2. Draw HCHO clusters */}
                {mapData.hotspots && mapData.hotspots.map((hot, idx) => (
                  <Circle
                    key={`hot-${idx}`}
                    center={[hot.latitude, hot.longitude]}
                    radius={8000}
                    pathOptions={{
                      color: hot.is_biomass ? '#d500f9' : '#651fff',
                      weight: 1.5,
                      fillColor: hot.is_biomass ? '#d500f9' : '#651fff',
                      fillOpacity: 0.15
                    }}
                  />
                ))}

                {/* 3. Draw Active Fires */}
                {mapData.fires && mapData.fires.map((fire, idx) => (
                  <CircleMarker
                    key={`fire-${idx}`}
                    center={[fire.latitude, fire.longitude]}
                    radius={5}
                    pathOptions={{
                      fillColor: '#ff2e00',
                      fillOpacity: 0.85,
                      stroke: false
                    }}
                  />
                ))}

                {/* 4. Draw Trajectories */}
                {mapData.plumes && mapData.plumes.map((plume, idx) => (
                  <Polyline
                    key={`plume-${idx}`}
                    positions={plume.path}
                    pathOptions={{
                      color: '#e65100',
                      weight: 2.5,
                      dashArray: '5, 8',
                      opacity: 0.75
                    }}
                  />
                ))}
              </MapContainer>
            )}
          </div>

          {/* Scale colorbar */}
          <div className="scale-bar"></div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            {selectedLayer === 'AQI' && (
              <>
                <span>0 (Good)</span>
                <span>50</span>
                <span>100</span>
                <span>150</span>
                <span>200</span>
                <span>300</span>
                <span>400</span>
                <span>500 (Severe)</span>
              </>
            )}
            {selectedLayer === 'PM2.5' && (
              <>
                <span>0 (Good)</span>
                <span>30</span>
                <span>60</span>
                <span>90</span>
                <span>120</span>
                <span>180</span>
                <span>250 (Severe)</span>
              </>
            )}
            {selectedLayer === 'PM10' && (
              <>
                <span>0 (Good)</span>
                <span>50</span>
                <span>100</span>
                <span>250</span>
                <span>350</span>
                <span>430 (Severe)</span>
              </>
            )}
            {selectedLayer === 'HCHO' && (
              <>
                <span>0 (Low)</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>10</span>
                <span>14 (Severe)</span>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar focus district view (Right 5 Cols) */}
        <div className="col-span-5 glass-panel rounded-xl p-5 flex flex-col justify-between h-[520px] overflow-y-auto">
          {/* Dropdown Focus Selector */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <div className="text-xs font-bold text-slate-600">Focus District:</div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-[#4b6bf5] cursor-pointer shadow-sm"
            >
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {focus && (
            <div className="flex-1 flex flex-col justify-between mt-3 space-y-4">
              {/* Gauge & Metrics Side by Side */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* SVG Gauge */}
                <SVGGauge 
                  value={focus.aqi} 
                  color={getCpcbColorAndLabel(focus.aqi).color} 
                  label={getCpcbColorAndLabel(focus.aqi).label} 
                />

                {/* Pollutant Bars */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-1">Concentrations</div>
                  {pollutants.slice(0, 3).map(p => {
                    const pct = Math.min(100, (p.value / p.max) * 100)
                    return (
                      <div key={p.name} className="mb-2.5">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-0.5">
                          <span>{p.name}</span>
                          <span className="font-mono">{p.value.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Extended pollutant list */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700">
                <div>
                  <div className="text-[9px] text-slate-600 uppercase font-semibold">NO₂ Surface</div>
                  <div className="font-bold text-[#00b050] mt-0.5">{focus.no2} <span className="text-[8px] font-normal text-slate-500">µg</span></div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-600 uppercase font-semibold">SO₂ Surface</div>
                  <div className="font-bold text-[#92d050] mt-0.5">{focus.so2} <span className="text-[8px] font-normal text-slate-500">µg</span></div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-600 uppercase font-semibold">CO Surface</div>
                  <div className="font-bold text-[#29b6f6] mt-0.5">{focus.co} <span className="text-[8px] font-normal text-slate-500">mg</span></div>
                </div>
              </div>

              {/* 7-Day Trend Chart */}
              <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 10 }} />
                    <Line type="monotone" dataKey="AQI" stroke="#58a6ff" strokeWidth={1.8} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="PM2.5" stroke="#ffd54f" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="PM10" stroke="#ff9100" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
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
            <div className="radar-sweep w-full h-full bg-[conic-gradient(from_0deg,rgba(188,140,255,0.2)_0deg,transparent_90deg)]"></div>
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
          <Sparkline values={[85, 87, 86, 88, 89, 89, 89]} color="#00e676" />
          <div className="text-[10px] text-slate-500 flex items-center group-hover:text-slate-300">
            View Details <ArrowUpRight size={10} className="ml-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

const intVal = (val) => Math.round(val)

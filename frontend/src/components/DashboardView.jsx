import React, { useEffect } from 'react'
import { useStore } from '../store'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import { 
  Activity, Wind, Flame, CloudSnow, Sparkles, MapPin, 
  Compass, ShieldAlert, Radio
} from 'lucide-react'

// CPCB color & category helpers
const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good", dotColor: "bg-emerald-400" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", dotColor: "bg-lime-400" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate", dotColor: "bg-yellow-400" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor", dotColor: "bg-orange-400" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor", dotColor: "bg-red-400" }
  return { color: "#7f1d1d", label: "Severe", dotColor: "bg-purple-500" }
}

// Helper to aggregate grid cells into district centers
const getDistrictMarkers = (cells) => {
  if (!cells) return []
  const groups = {}
  cells.forEach(c => {
    if (!groups[c.district]) {
      groups[c.district] = {
        district: c.district,
        state: c.state,
        lats: [],
        lons: [],
        aqis: [],
        pm25s: [],
        hchos: []
      }
    }
    groups[c.district].lats.push(c.latitude)
    groups[c.district].lons.push(c.longitude)
    groups[c.district].aqis.push(c.aqi)
    groups[c.district].pm25s.push(c.pm25)
    groups[c.district].hchos.push(c.hcho || 1.0)
  })

  return Object.values(groups).map(g => {
    const count = g.aqis.length
    const avg = (arr) => arr.reduce((sum, val) => sum + val, 0) / count
    return {
      district: g.district,
      state: g.state,
      latitude: avg(g.lats),
      longitude: avg(g.lons),
      aqi: Math.round(avg(g.aqis)),
      pm25: avg(g.pm25s),
      hcho: avg(g.hchos)
    }
  })
}

export default function DashboardView() {
  const { 
    selectedDate, 
    selectedDistrict, 
    setSelectedDistrict, 
    dashboardData, 
    mapData, 
    fetchDashboard, 
    fetchMapData,
    theme
  } = useStore()

  useEffect(() => {
    fetchDashboard()
    fetchMapData()
  }, [selectedDate, selectedDistrict])

  if (!dashboardData || !dashboardData.kpis) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400 font-medium">Loading Atmospheric Telemetry...</span>
      </div>
    )
  }

  const { kpis, focus } = dashboardData
  const aqiInfo = getCpcbColorAndLabel(kpis.aqi)
  const districtMarkers = getDistrictMarkers(mapData?.cells || [])

  // Sorted list of top affected regions for table
  const sortedRegions = [...districtMarkers].sort((a, b) => b.aqi - a.aqi)

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* 1. ATMOSPHERIC OVERVIEW HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-1.5 h-6 bg-[#5442ed] rounded-full mr-3"></div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white dark:text-white light:text-slate-900">
              Atmospheric Overview
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              India • Live Environmental Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 6 KPI STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: AQI */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Activity size={13} className="text-[#5442ed]" />
            <span>AQI</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#5442ed] tracking-tight">
              {kpis.aqi}
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold mt-0.5" style={{ color: aqiInfo.color }}>
              <span className={`w-2 h-2 rounded-full ${aqiInfo.dotColor} shadow-sm animate-pulse`}></span>
              <span>{aqiInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Card 2: PM2.5 */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <CloudSnow size={13} className="text-[#38bdf8]" />
            <span>PM2.5</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#38bdf8] tracking-tight">
              {kpis.pm25 ? kpis.pm25.toFixed(1) : "46.3"}
            </div>
            <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
              µg/m³
            </div>
          </div>
        </div>

        {/* Card 3: HCHO */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Sparkles size={13} className="text-[#10b981]" />
            <span>HCHO</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#10b981] tracking-tight">
              {kpis.hcho_column ? kpis.hcho_column.toFixed(1) : "1.0"}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 mt-0.5 font-mono">
              10¹⁵ mol/cm²
            </div>
          </div>
        </div>

        {/* Card 4: Active Fires */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Flame size={13} className="text-[#f97316]" />
            <span>Active Fires</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#f97316] tracking-tight">
              {kpis.fires}
            </div>
            <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
              Thermal Spots
            </div>
          </div>
        </div>

        {/* Card 5: Wind Speed */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Wind size={13} className="text-[#38bdf8]" />
            <span>Wind Speed</span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#38bdf8] tracking-tight">
              {focus?.wind_speed ? Number(focus.wind_speed).toFixed(1) : "8.4"}
            </div>
            <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
              km/h
            </div>
          </div>
        </div>

        {/* Card 6: Transport Risk */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-[120px] transition-all hover:scale-[1.02]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Compass size={13} className="text-[#a855f7]" />
            <span>Transport Risk</span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#a855f7] tracking-tight">
              {focus?.insight?.inversion_status?.includes("Critical") ? "Severe" : "Moderate"}
            </div>
            <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
              NW Advection
            </div>
          </div>
        </div>

      </div>

      {/* 3. MAIN SECTION: ATMOSPHERIC MAP & TOP AFFECTED REGIONS */}
      <div className="grid grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Atmospheric Map Card */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-2xl p-5 flex flex-col h-[520px]">
          
          {/* Header (Clean title without redundant layer toggle buttons) */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-[#5442ed]" />
              <h3 className="text-sm font-extrabold tracking-tight">
                Atmospheric Map
              </h3>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-bold text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live 10km Inversion Grid</span>
            </div>
          </div>

          {/* Leaflet Map Body (100% Watermark Free Tile Layer) */}
          <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.08] relative z-10">
            {mapData && (
              <MapContainer 
                center={[30.1, 75.8]} 
                zoom={8} 
                className="w-full h-full"
                zoomControl={false}
                key={`${theme}`}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className={theme === 'dark' ? 'theme-map-dark-tiles' : ''}
                  attribution="&copy; OpenStreetMap contributors"
                  key={theme}
                />
                
                {/* District markers */}
                {districtMarkers.map((marker) => {
                  let colorInfo = getCpcbColorAndLabel(marker.aqi)

                  return (
                    <React.Fragment key={`district-${marker.district}`}>
                      <Circle
                        center={[marker.latitude, marker.longitude]}
                        radius={15000}
                        pathOptions={{
                          color: colorInfo.color,
                          weight: 1,
                          fillColor: colorInfo.color,
                          fillOpacity: 0.18
                        }}
                      />
                      <CircleMarker
                        center={[marker.latitude, marker.longitude]}
                        radius={12}
                        pathOptions={{
                          fillColor: colorInfo.color,
                          fillOpacity: 0.9,
                          color: '#ffffff',
                          weight: 1.5
                        }}
                        eventHandlers={{
                          click: () => setSelectedDistrict(marker.district)
                        }}
                      >
                        <Popup>
                          <div className="text-xs space-y-1 p-1">
                            <div className="font-extrabold border-b border-white/[0.1] pb-1">
                              {marker.district} ({marker.state})
                            </div>
                            <div className="font-bold text-sm mt-1" style={{ color: colorInfo.color }}>
                              AQI: {marker.aqi} ({colorInfo.label})
                            </div>
                            <div className="text-[10px] text-zinc-400 pt-1">
                              PM2.5: {marker.pm25.toFixed(1)} µg/m³
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </React.Fragment>
                  )
                })}

                {/* Draw active fires */}
                {mapData.fires && mapData.fires.map((fire, idx) => (
                  <CircleMarker
                    key={`fire-${idx}`}
                    center={[fire.latitude, fire.longitude]}
                    radius={6}
                    pathOptions={{
                      fillColor: '#f97316',
                      fillOpacity: 0.95,
                      color: '#ffedd5',
                      weight: 1.5
                    }}
                  />
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Top Affected Regions Card */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-2xl p-5 flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <ShieldAlert size={16} className="text-[#5442ed]" />
              <h3 className="text-sm font-extrabold tracking-tight">
                Top Affected Regions
              </h3>
            </div>

            {/* Region List Table (Theme Adaptive Subcards) */}
            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
              {sortedRegions.slice(0, 7).map((region, idx) => {
                const badge = getCpcbColorAndLabel(region.aqi)
                const isSelected = selectedDistrict === region.district
                return (
                  <div
                    key={region.district}
                    onClick={() => setSelectedDistrict(region.district)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#5442ed]/20 border border-[#5442ed]/60 text-white' 
                        : 'vayu-subcard hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-zinc-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-extrabold">
                        {region.district}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-xs font-extrabold">
                        {region.aqi}
                      </span>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${badge.color}22`, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 font-semibold text-center border-t border-[var(--panel-border)] pt-2">
            Click any region to load district parameters
          </div>
        </div>

      </div>

    </div>
  )
}

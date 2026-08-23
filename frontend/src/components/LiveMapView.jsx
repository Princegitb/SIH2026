import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
import { MapPin, Navigation, Search, Activity, Flame, ShieldAlert, TrendingUp } from 'lucide-react'

const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor" }
  return { color: "#7f1d1d", label: "Severe" }
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
        pm10s: [],
        hchos: []
      }
    }
    groups[c.district].lats.push(c.latitude)
    groups[c.district].lons.push(c.longitude)
    groups[c.district].aqis.push(c.aqi)
    groups[c.district].pm25s.push(c.pm25)
    groups[c.district].pm10s.push(c.pm10 || (c.pm25 * 1.5))
    groups[c.district].hchos.push(c.hcho)
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
      pm10: avg(g.pm10s),
      hcho: avg(g.hchos)
    }
  })
}

// Map Event Handler Component
function MapEvents({ onMapClick, centerPosition }) {
  const map = useMap()
  
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })

  useEffect(() => {
    if (centerPosition) {
      map.setView([centerPosition.lat, centerPosition.lng], 10, { animate: true })
    }
  }, [centerPosition, map])

  return null
}

export default function LiveMapView() {
  const { mapData, fetchMapData, selectedDate, selectedState, theme } = useStore()
  const [selectedLayer, setSelectedLayer] = useState('AQI')
  const [layers, setLayers] = useState({
    aqi: true,
    hotspots: true,
    fires: true,
    plumes: true
  })

  // Hyperlocal coordinates state
  const [hyperlocalPoint, setHyperlocalPoint] = useState(null)
  const [hyperlocalDetails, setHyperlocalDetails] = useState(null)
  const [loadingHyperlocal, setLoadingHyperlocal] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)

  // Village search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  useEffect(() => {
    fetchMapData()
  }, [selectedDate, selectedState])

  // Handle Village Autocomplete Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await fetch(`/api/village-search?q=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          setSearchResults(data.results || [])
          setShowSearchDropdown(true)
        } catch (err) {
          console.error("Village search failed:", err)
        }
      } else {
        setSearchResults([])
        setShowSearchDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch Hyperlocal Point Prediction
  const fetchHyperlocalPrediction = async (lat, lon) => {
    setLoadingHyperlocal(true)
    setHyperlocalPoint({ lat, lng: lon })
    try {
      const res = await fetch(`/api/predict-location?lat=${lat}&lon=${lon}&date=${selectedDate}`)
      const data = await res.json()
      if (res.ok && data && !data.detail) {
        setHyperlocalDetails(data)
      } else {
        console.error("API returned error:", data)
        setHyperlocalDetails(null)
        alert("Prediction failed: " + (data.detail || "Server error"))
      }
    } catch (err) {
      console.error("Failed to fetch hyperlocal prediction:", err)
      setHyperlocalDetails(null)
    } finally {
      setLoadingHyperlocal(false)
    }
  }

  // Handle Select Village from Search
  const handleSelectVillage = (village) => {
    setSearchQuery(village.name)
    setShowSearchDropdown(false)
    setMapCenter({ lat: village.lat, lng: village.lon })
    fetchHyperlocalPrediction(village.lat, village.lon)
  }

  // Handle GPS Locate button
  const handleGPSLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter({ lat: latitude, lng: longitude })
          fetchHyperlocalPrediction(latitude, longitude)
        },
        (err) => {
          alert("GPS Permission Denied / Timed Out. Please click manually on the map instead.")
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Loading Map Layer Observables...</span>
      </div>
    )
  }

  const districtMarkers = getDistrictMarkers(mapData.cells)
  const hpColorInfo = hyperlocalDetails ? getCpcbColorAndLabel(hyperlocalDetails.aqi) : null

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Controls Overlay Header */}
      <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row justify-between items-center z-10 gap-4">
        <div>
          <h2 className="text-base font-bold theme-adapt-text">Geospatial GIS Atmospheric Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Hyperlocal village prediction model overlaying Sentinel-5P column density & active fire points</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Base Layer Switcher */}
          <div className="flex bg-slate-900/50 border border-slate-800/80 rounded-lg p-0.5 text-xs text-slate-400">
            {['AQI', 'PM2.5', 'PM10', 'HCHO'].map((layer) => {
              const isActive = selectedLayer === layer
              return (
                <span
                  key={layer}
                  onClick={() => setSelectedLayer(layer)}
                  className={`px-3 py-1 rounded cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-[#4b6bf5] text-white font-bold shadow-md' 
                      : 'hover:text-slate-200'
                  }`}
                >
                  {layer}
                </span>
              )
            })}
          </div>

          {/* Visibility Toggles */}
          <div className="flex space-x-4 text-xs font-semibold text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.aqi} 
                onChange={() => setLayers({...layers, aqi: !layers.aqi})}
                className="accent-[#4b6bf5]"
              />
              <span>Districts</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.hotspots} 
                onChange={() => setLayers({...layers, hotspots: !layers.hotspots})}
                className="accent-purple-600"
              />
              <span>Hotspots</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.fires} 
                onChange={() => setLayers({...layers, fires: !layers.fires})}
                className="accent-orange-500"
              />
              <span>Fires</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.plumes} 
                onChange={() => setLayers({...layers, plumes: !layers.plumes})}
                className="accent-amber-600"
              />
              <span>Plumes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Map Left, Hyperlocal Sidebar Right */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        
        {/* Left Map View */}
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/80 relative z-0 min-h-[350px]">
          <MapContainer 
            center={[30.1, 75.8]} 
            zoom={8} 
            className="w-full h-full"
            key={`${theme}`}
          >
            <TileLayer
              url={theme === 'light'
                ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              }
              className="theme-map-tile-layer"
              key={theme}
            />

            {/* Custom map event capture click & center */}
            <MapEvents 
              onMapClick={fetchHyperlocalPrediction} 
              centerPosition={mapCenter}
            />
            
            {/* Hyperlocal Pin Drop Marker */}
            {hyperlocalPoint && (
              <React.Fragment key={`hyperlocal-${hyperlocalPoint.lat}-${hyperlocalPoint.lng}`}>
                {/* Static outer glow ring */}
                <Circle
                  center={[hyperlocalPoint.lat, hyperlocalPoint.lng]}
                  radius={5000}
                  pathOptions={{
                    color: hpColorInfo ? hpColorInfo.color : '#3b82f6',
                    weight: 1.5,
                    fillColor: hpColorInfo ? hpColorInfo.color : '#3b82f6',
                    fillOpacity: 0.18
                  }}
                />
                {/* Crisp target core pinpoint */}
                <CircleMarker
                  center={[hyperlocalPoint.lat, hyperlocalPoint.lng]}
                  radius={9}
                  pathOptions={{
                    fillColor: hpColorInfo ? hpColorInfo.color : '#3b82f6',
                    fillOpacity: 0.95,
                    color: '#ffffff',
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <span className="font-bold text-white">Hyperlocal GPS Target Pin</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Lat: {hyperlocalPoint.lat.toFixed(4)} | Lon: {hyperlocalPoint.lng.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            )}

            {/* Clean, understandable, and consistent District markers */}
            {layers.aqi && districtMarkers.map((marker) => {
              let val = marker.aqi
              let color = '#10b981'
              let label = 'Good'
              let unit = ''
              
              if (selectedLayer === 'AQI') {
                const res = getCpcbColorAndLabel(marker.aqi)
                color = res.color
                label = res.label
              } else if (selectedLayer === 'PM2.5') {
                val = marker.pm25
                const res = getCellColorAndLabel({ pm25: val }, 'PM2.5')
                color = res.color
                label = res.label
                unit = ' µg/m³'
              } else if (selectedLayer === 'PM10') {
                val = marker.pm10
                const res = getCellColorAndLabel({ pm10: val }, 'PM10')
                color = res.color
                label = res.label
                unit = ' µg/m³'
              } else if (selectedLayer === 'HCHO') {
                val = marker.hcho
                const res = getCellColorAndLabel({ hcho: val }, 'HCHO')
                color = res.color
                label = res.label
                unit = ' 10¹⁵ molec/cm²'
              }

              // Dynamic marker size based on value
              const radius = 8 + (val / 40)

              return (
                <React.Fragment key={`live-district-${marker.district}-${selectedLayer}`}>
                  {/* Outer glowing hotspot halo */}
                  <Circle
                    key={`live-halo-${marker.district}-${selectedLayer}-${theme}`}
                    center={[marker.latitude, marker.longitude]}
                    radius={15000}
                    pathOptions={{
                      color: color,
                      weight: 1,
                      fillColor: color,
                      fillOpacity: 0.12
                    }}
                  />
                  {/* Core marker */}
                  <CircleMarker
                    key={`live-marker-${marker.district}-${selectedLayer}-${theme}`}
                    center={[marker.latitude, marker.longitude]}
                    radius={Math.min(22, Math.max(9, radius))}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.85,
                      color: '#ffffff',
                      weight: 1.5
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-white border-b border-slate-700/60 pb-1">{marker.district} ({marker.state})</div>
                        <div className="text-slate-350 font-semibold mt-1">Selected Metric ({selectedLayer}):</div>
                        <div className="font-extrabold text-sm flex items-baseline space-x-1" style={{ color }}>
                          <span>{selectedLayer === 'HCHO' ? val.toFixed(4) : Math.round(val)}</span>
                          <span className="text-[9px] font-normal text-slate-400">{unit} ({label})</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-750 pt-1.5 space-y-0.5">
                          <div>AQI Index: {marker.aqi}</div>
                          <div>PM2.5: {Math.round(marker.pm25)} µg/m³</div>
                          <div>PM10: {Math.round(marker.pm10)} µg/m³</div>
                          <div>HCHO Column: {marker.hcho.toFixed(4)}</div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              )
            })}

            {/* Draw HCHO clusters */}
            {layers.hotspots && mapData.hotspots && mapData.hotspots.map((hot, idx) => (
              <Circle
                key={`live-hot-${idx}`}
                center={[hot.latitude, hot.longitude]}
                radius={10000}
                pathOptions={{
                  color: hot.is_biomass ? '#a855f7' : '#6366f1',
                  weight: 2,
                  fillColor: hot.is_biomass ? '#a855f7' : '#6366f1',
                  fillOpacity: 0.22,
                  dashArray: '3, 4'
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-white border-b border-slate-750 pb-1">HCHO Cluster {hot.cluster_id}</div>
                    <div className="mt-1"><b>Signature:</b> {hot.is_biomass ? "Biomass Smoke" : "Urban/Industrial"}</div>
                    <div><b>HCHO Column:</b> {hot.hcho.toFixed(4)}</div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Draw Active Fires */}
            {layers.fires && mapData.fires && mapData.fires.map((fire, idx) => (
              <CircleMarker
                key={`live-fire-${idx}`}
                center={[fire.latitude, fire.longitude]}
                radius={6}
                pathOptions={{
                  fillColor: '#f97316',
                  fillOpacity: 0.9,
                  color: '#ffedd5',
                  weight: 1.5
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-white border-b border-slate-750 pb-1">Active Fire Detection</div>
                    <div className="mt-1"><b>Power (FRP):</b> {fire.frp} MW</div>
                    <div><b>Confidence:</b> {fire.confidence}%</div>
                    <div><b>Sensor:</b> {fire.sensor}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Draw Trajectories */}
            {layers.plumes && mapData.plumes && mapData.plumes.map((plume, idx) => (
              <Polyline
                key={`live-plume-${idx}`}
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
        </div>

        {/* Right Hyperlocal Sidebar Predictor Panel */}
        <div className="w-full lg:w-96 glass-panel rounded-xl p-4 flex flex-col overflow-y-auto border border-slate-800/80 z-10 shrink-0">
          
          {/* Autocomplete Input & GPS Action controls */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center">
              <MapPin size={13} className="mr-1.5 text-sky-400" /> Rural & Urban Hyperlocal Search
            </h3>
            
            <div className="relative w-full flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Type village/locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full bg-[#0d1121] border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-200 outline-none focus:border-[#4b6bf5] placeholder-slate-500 font-semibold shadow-inner"
              />
              
              <button
                onClick={handleGPSLocate}
                className="absolute right-2 p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-all flex items-center justify-center"
                title="Detect My Location"
              >
                <Navigation size={14} className="rotate-45" />
              </button>
              
              {/* Search Dropdown list */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#090d1a] border border-slate-800 rounded-lg max-h-48 overflow-y-auto shadow-2xl z-50">
                  {searchResults.map((village, idx) => (
                    <div
                      key={`v-res-${idx}`}
                      onClick={() => handleSelectVillage(village)}
                      className="px-3 py-2 text-xs text-slate-350 hover:bg-slate-800/40 hover:text-white cursor-pointer border-b border-slate-900/50 flex justify-between items-center"
                    >
                      <span className="font-bold">{village.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold">{village.district}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-slate-500 font-semibold italic">
              💡 Tip: Click anywhere on the map grid to predict hyperlocal air quality instantly!
            </div>
          </div>

          {/* Prediction results render container */}
          {loadingHyperlocal ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-sky-500"></div>
              <span className="text-xs text-slate-400 font-semibold">Running Hyperlocal ML Inference...</span>
            </div>
          ) : hyperlocalDetails ? (
            <div className="flex-grow pt-4 space-y-4 animate-fadeIn">
              
              {/* Location Badge header */}
              <div className="bg-slate-900/35 border border-slate-800 p-3 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{hyperlocalDetails.location.name}</h4>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                      {hyperlocalDetails.location.locality_type} • {hyperlocalDetails.location.district}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    GPS Coordinates
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-semibold mt-1">
                  Lat: {hyperlocalDetails.location.latitude}°N | Lon: {hyperlocalDetails.location.longitude}°E
                </div>
              </div>

              {/* AQI Indicator Card */}
              <div className="p-4 rounded-xl border flex justify-between items-center shadow-lg relative overflow-hidden" 
                   style={{ backgroundColor: `${hpColorInfo?.color}18`, borderColor: `${hpColorInfo?.color}40` }}>
                <div className="absolute right-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: hpColorInfo?.color }}></div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide"> Hyperlocal Predicted AQI</span>
                  <div className="text-3xl font-extrabold text-white mt-1">{hyperlocalDetails.aqi}</div>
                  <span className="text-xs font-bold mt-1.5 block" style={{ color: hpColorInfo?.color }}>
                    {hyperlocalDetails.aqi_category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Dominant Threat</span>
                  <span className="text-xs font-extrabold text-white uppercase mt-1 block">{hyperlocalDetails.dominant_pollutant}</span>
                </div>
              </div>

              {/* Pollutant levels detailed Grid */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center">
                  <Activity size={12} className="mr-1 text-sky-400" /> Hyperlocal Concentrations
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0f1429] border border-slate-800/60 p-2 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-semibold">PM2.5 (Ground)</div>
                    <div className="font-extrabold text-white mt-0.5">{hyperlocalDetails.pollutants.pm25} <span className="text-[8px] font-normal text-slate-400">µg/m³</span></div>
                  </div>
                  <div className="bg-[#0f1429] border border-slate-800/60 p-2 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-semibold">PM10 (Ground)</div>
                    <div className="font-extrabold text-white mt-0.5">{hyperlocalDetails.pollutants.pm10} <span className="text-[8px] font-normal text-slate-400">µg/m³</span></div>
                  </div>
                  <div className="bg-[#0f1429] border border-slate-800/60 p-2 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-semibold">S5P Column HCHO</div>
                    <div className="font-extrabold text-white mt-0.5">{hyperlocalDetails.satellite_telemetry.hcho_column} <span className="text-[8px] font-normal text-slate-400">10¹⁵</span></div>
                  </div>
                  <div className="bg-[#0f1429] border border-slate-800/60 p-2 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-semibold">MODIS Satellite AOD</div>
                    <div className="font-extrabold text-white mt-0.5">{hyperlocalDetails.satellite_telemetry.aod} <span className="text-[8px] font-normal text-slate-400">Haze</span></div>
                  </div>
                </div>
              </div>

              {/* Chemical Source Attribution percentages */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center">
                  <Flame size={12} className="mr-1 text-orange-400" /> Local Emission Fingerprint
                </h5>
                <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="text-xs text-white font-bold flex justify-between">
                    <span>Source Fingerprint:</span>
                    <span className="text-sky-400">{hyperlocalDetails.source_attribution.dominant_source}</span>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="space-y-2 text-[10px]">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-400 mb-0.5">
                        <span>Agricultural Biomass (Parali/Smoke)</span>
                        <span className="text-white">{hyperlocalDetails.source_attribution.biomass_smoke_pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${hyperlocalDetails.source_attribution.biomass_smoke_pct}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-400 mb-0.5">
                        <span>Vehicular Traffic Exhaust</span>
                        <span className="text-white">{hyperlocalDetails.source_attribution.vehicular_traffic_pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${hyperlocalDetails.source_attribution.vehicular_traffic_pct}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-400 mb-0.5">
                        <span>Industrial / Coal Emission</span>
                        <span className="text-white">{hyperlocalDetails.source_attribution.industrial_emissions_pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${hyperlocalDetails.source_attribution.industrial_emissions_pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 48-Hour ML Forecast */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center">
                  <TrendingUp size={12} className="mr-1 text-sky-400" /> 48-Hour Localized ML Projections
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0b0e1c] border border-slate-800/80 p-2.5 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-extrabold uppercase">Day +1 Tomorrow</div>
                    <div className="font-extrabold text-white mt-1 text-sm">{hyperlocalDetails.forecast_48h.day1.aqi} AQI</div>
                    <div className="text-[8px] font-bold text-sky-400 mt-1 flex items-center">
                      <ShieldAlert size={9} className="mr-1" /> {hyperlocalDetails.forecast_48h.day1.inversion_risk}
                    </div>
                  </div>

                  <div className="bg-[#0b0e1c] border border-slate-800/80 p-2.5 rounded-lg">
                    <div className="text-[9px] text-slate-500 font-extrabold uppercase">Day +2 Day After Tomorrow</div>
                    <div className="font-extrabold text-white mt-1 text-sm">{hyperlocalDetails.forecast_48h.day2.aqi} AQI</div>
                    <div className="text-[8px] font-bold text-slate-400 mt-1 flex items-center">
                      🍃 Wind: {hyperlocalDetails.forecast_48h.day2.wind_speed} km/h
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <MapPin size={28} className="text-slate-650 animate-bounce" />
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">No Location Selected</span>
              <p className="text-[11px] text-slate-500">
                Click any coordinate on the left map grid or type a village name to compute real-time point prediction diagnostics!
              </p>
            </div>
          )}

        </div>
        
      </div>
    </div>
  )
}

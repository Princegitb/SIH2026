import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline } from 'react-leaflet'

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

export default function LiveMapView() {
  const { mapData, fetchMapData, selectedDate, selectedState, theme } = useStore()
  const [selectedLayer, setSelectedLayer] = useState('AQI')
  const [layers, setLayers] = useState({
    aqi: true,
    hotspots: true,
    fires: true,
    plumes: true
  })

  useEffect(() => {
    fetchMapData()
  }, [selectedDate, selectedState])

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Loading Map Layer Observables...</span>
      </div>
    )
  }

  const districtMarkers = getDistrictMarkers(mapData.cells)

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Controls Overlay Header */}
      <div className="glass-panel rounded-xl p-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-base font-bold theme-adapt-text">Geospatial GIS Atmospheric Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Active layers overlaying Sentinel-5P columns & MODIS fire counts</p>
        </div>
        
        <div className="flex items-center space-x-6">
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
          <div className="flex space-x-6 text-xs font-semibold text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.aqi} 
                onChange={() => setLayers({...layers, aqi: !layers.aqi})}
                className="accent-[#4b6bf5]"
              />
              <span>District Markers</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.hotspots} 
                onChange={() => setLayers({...layers, hotspots: !layers.hotspots})}
                className="accent-purple-600"
              />
              <span>HCHO Hotspots</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.fires} 
                onChange={() => setLayers({...layers, fires: !layers.fires})}
                className="accent-orange-500"
              />
              <span>Active Fires</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
              <input 
                type="checkbox" 
                checked={layers.plumes} 
                onChange={() => setLayers({...layers, plumes: !layers.plumes})}
                className="accent-amber-600"
              />
              <span>Plume Trajectories</span>
            </label>
          </div>
        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/80 relative z-0">
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
                        <div>PM2.5 Concentration: {Math.round(marker.pm25)} µg/m³</div>
                        <div>PM10 Concentration: {Math.round(marker.pm10)} µg/m³</div>
                        <div>HCHO Column Density: {marker.hcho.toFixed(4)}</div>
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
                  <div className="font-bold text-white border-b border-slate-750 pb-1">HCHO DBSCAN Cluster {hot.cluster_id}</div>
                  <div className="mt-1"><b>Chemical Signature:</b> {hot.is_biomass ? "Biomass Smoke" : "Urban/Industrial"}</div>
                  <div><b>HCHO Column Density:</b> {hot.hcho.toFixed(4)}</div>
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
                  <div className="font-bold text-white border-b border-slate-750 pb-1">MODIS/VIIRS Active Fire</div>
                  <div className="mt-1"><b>Radiative Power (FRP):</b> {fire.frp} MW</div>
                  <div><b>Confidence Level:</b> {fire.confidence}%</div>
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
    </div>
  )
}

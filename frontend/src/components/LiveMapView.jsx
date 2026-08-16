import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline } from 'react-leaflet'

const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#00b050", label: "Good" }
  if (aqi <= 100) return { color: "#92d050", label: "Satisfactory" }
  if (aqi <= 200) return { color: "#ffff00", label: "Moderate" }
  if (aqi <= 300) return { color: "#ffc000", label: "Poor" }
  if (aqi <= 400) return { color: "#ff0000", label: "Very Poor" }
  return { color: "#c00000", label: "Severe" }
}

export default function LiveMapView() {
  const { mapData, fetchMapData, selectedDate, selectedState } = useStore()
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

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Controls Overlay Header */}
      <div className="glass-panel rounded-xl p-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-base font-bold text-slate-800">Geospatial GIS Atmospheric Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Active layers overlaying Sentinel-5P columns & MODIS fire counts</p>
        </div>
        <div className="flex space-x-6 text-xs font-semibold text-slate-600">
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-800">
            <input 
              type="checkbox" 
              checked={layers.aqi} 
              onChange={() => setLayers({...layers, aqi: !layers.aqi})}
              className="accent-[#4b6bf5]"
            />
            <span>AQI Grid</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-800">
            <input 
              type="checkbox" 
              checked={layers.hotspots} 
              onChange={() => setLayers({...layers, hotspots: !layers.hotspots})}
              className="accent-purple-600"
            />
            <span>HCHO Hotspots</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-800">
            <input 
              type="checkbox" 
              checked={layers.fires} 
              onChange={() => setLayers({...layers, fires: !layers.fires})}
              className="accent-orange-500"
            />
            <span>Active Fires</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-800">
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

      {/* Map Body */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative z-0">
        <MapContainer 
          center={[30.1, 75.8]} 
          zoom={8} 
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          {/* 1. Draw Grid Cells */}
          {layers.aqi && mapData.cells && mapData.cells.map((cell) => {
            const { color, label } = getCpcbColorAndLabel(cell.aqi)
            return (
              <CircleMarker
                key={`live-cell-${cell.cell_id}`}
                center={[cell.latitude, cell.longitude]}
                radius={11}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.55,
                  stroke: false
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white border-b border-[#1f2d4d] pb-1">{cell.district} ({cell.state})</div>
                    <div><b>Estimated AQI:</b> {cell.aqi} ({label})</div>
                    <div><b>PM2.5:</b> {cell.pm25} µg/m³</div>
                    <div><b>AOD:</b> {cell.aod}</div>
                    <div><b>Boundary Layer:</b> {cell.blh} m</div>
                    <div><b>HCHO Column:</b> {cell.hcho.toFixed(4)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* 2. Draw HCHO clusters */}
          {layers.hotspots && mapData.hotspots && mapData.hotspots.map((hot, idx) => (
            <Circle
              key={`live-hot-${idx}`}
              center={[hot.latitude, hot.longitude]}
              radius={8000}
              pathOptions={{
                color: hot.is_biomass ? '#d500f9' : '#651fff',
                weight: 2,
                fillColor: hot.is_biomass ? '#d500f9' : '#651fff',
                fillOpacity: 0.18
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-white border-b border-[#1f2d4d] pb-1">HCHO DBSCAN Cluster {hot.cluster_id}</div>
                  <div className="mt-1"><b>Chemical Signature:</b> {hot.is_biomass ? "Biomass Smoke" : "Urban/Industrial"}</div>
                  <div><b>HCHO Column Density:</b> {hot.hcho.toFixed(4)}</div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* 3. Draw Active Fires */}
          {layers.fires && mapData.fires && mapData.fires.map((fire, idx) => (
            <CircleMarker
              key={`live-fire-${idx}`}
              center={[fire.latitude, fire.longitude]}
              radius={6}
              pathOptions={{
                fillColor: '#ff1744',
                fillOpacity: 0.85,
                stroke: true,
                color: '#ffea00',
                weight: 1
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-white border-b border-[#1f2d4d] pb-1">MODIS/VIIRS Active Fire</div>
                  <div className="mt-1"><b>Radiative Power (FRP):</b> {fire.frp} MW</div>
                  <div><b>Confidence Level:</b> {fire.confidence}%</div>
                  <div><b>Sensor:</b> {fire.sensor}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 4. Draw Trajectories */}
          {layers.plumes && mapData.plumes && mapData.plumes.map((plume, idx) => (
            <Polyline
              key={`live-plume-${idx}`}
              positions={plume.path}
              pathOptions={{
                color: '#e65100',
                weight: 3,
                dashArray: '6, 10',
                opacity: 0.8
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Flame, AlertTriangle } from 'lucide-react'

export default function FiresView() {
  const { selectedDate } = useStore()
  const [fires, setFires] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/fires?date=${selectedDate}`)
        const data = await res.json()
        setFires(data.fires || [])
      } catch (err) {
        console.error("Failed to load fires:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-400">Fetching MODIS/VIIRS thermal coordinates...</span>
      </div>
    )
  }

  // Sort by FRP descending
  const sortedFires = [...fires].sort((a, b) => b.frp - a.frp)
  
  // Aggregate stats
  const totalFires = fires.length
  const maxFrp = totalFires > 0 ? Math.max(...fires.map(f => f.frp)) : 0
  const avgConf = totalFires > 0 ? Math.round(fires.reduce((a, c) => a + c.confidence, 0) / totalFires) : 0

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Thermal Anomalies</span>
          <span className="text-3xl font-extrabold text-orange-500 flex items-center">
            {totalFires} <Flame className="ml-2 text-orange-500" size={20} />
          </span>
          <span className="text-[10px] text-slate-550 font-medium">MODIS/VIIRS active fires detected</span>
        </div>
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Peak Fire Energy</span>
          <span className="text-3xl font-extrabold text-red-500">{maxFrp.toFixed(1)} <span className="text-sm font-normal text-slate-500">MW</span></span>
          <span className="text-[10px] text-slate-550 font-medium">Max Fire Radiative Power recorded</span>
        </div>
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Detection Confidence</span>
          <span className="text-3xl font-extrabold text-emerald-500">{avgConf}%</span>
          <span className="text-[10px] text-slate-550 font-medium">Satellite measurement reliability index</span>
        </div>
      </div>

      {/* Critical fires list */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold theme-adapt-text uppercase tracking-wider border-b border-slate-800/60 pb-2 flex items-center">
          <AlertTriangle size={16} className="text-orange-500 mr-2" /> Peak Energetic Stubble Burning Points
        </h3>

        {sortedFires.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No thermal anomalies detected on this date.
          </div>
        ) : (
          <div className="space-y-3.5 overflow-y-auto max-h-[350px] pr-2">
            {sortedFires.slice(0, 10).map((fire, idx) => {
              // Color base on FRP level
              const colorClass = fire.frp > 100 ? 'text-red-500' : 'text-orange-500'
              return (
                <div key={idx} className="bg-slate-900/30 border border-slate-800/60 rounded-lg p-3 flex justify-between items-center text-xs light-theme-banner">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold theme-adapt-text">Fire Event #{idx + 1}</span>
                      {fire.frp > 100 && (
                        <span className="bg-red-950/20 text-red-400 border border-red-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded light-theme-critical-tag">
                          CRITICAL ENERGY
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Coordinates: <span className="font-mono">{fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold">Radiative Power</div>
                      <div className={`font-bold font-mono ${colorClass}`}>{fire.frp.toFixed(1)} MW</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold">Confidence</div>
                      <div className="font-bold font-mono text-emerald-500">{fire.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold">Sensor</div>
                      <div className="font-bold font-mono text-slate-400">{fire.sensor}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

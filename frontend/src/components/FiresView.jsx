import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Flame, AlertTriangle, ShieldCheck, Zap, Radio, MapPin } from 'lucide-react'

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
        <span className="ml-3 text-slate-300 font-medium">Fetching active fire detections from NASA satellites...</span>
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
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white mb-1 flex items-center tracking-tight">
            <Flame size={20} className="text-orange-500 mr-2.5" /> Active Farm Fires & Stubble Burning Detection
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Real-time active fire locations and fire heat power (FRP) detected by NASA satellites (VIIRS & MODIS)
          </p>
        </div>
        <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider flex items-center">
          <Zap size={12} className="mr-1.5" /> NASA Satellite Feed
        </span>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border-orange-500/30 bg-gradient-to-br from-orange-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-orange-300 uppercase tracking-wider">Active Farm Fires</span>
          <span className="text-4xl font-black text-orange-400 flex items-center tracking-tight">
            {totalFires} <Flame className="ml-2 text-orange-400 animate-pulse" size={24} />
          </span>
          <span className="text-xs text-slate-300 font-medium">Detected by NASA satellites</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-red-500/30 bg-gradient-to-br from-red-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-red-300 uppercase tracking-wider">Peak Fire Heat</span>
          <span className="text-4xl font-black text-red-400 tracking-tight">
            {maxFrp.toFixed(1)} <span className="text-sm font-semibold text-slate-400">MW</span>
          </span>
          <span className="text-xs text-slate-300 font-medium">Maximum heat power released</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">Detection Confidence</span>
          <span className="text-4xl font-black text-emerald-400 tracking-tight">{avgConf}%</span>
          <span className="text-xs text-slate-300 font-medium">Satellite sensor reliability rating</span>
        </div>
      </div>

      {/* Critical fires list */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800/80 pb-3 flex items-center">
          <AlertTriangle size={16} className="text-orange-500 mr-2" /> Top Active Fire Locations (Ranked by Intensity)
        </h3>

        {sortedFires.length === 0 ? (
          <div className="text-center py-8 text-slate-300 font-medium text-xs">
            No active farm fires or stubble burning detected on this date.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
            {sortedFires.slice(0, 15).map((fire, idx) => {
              const isCritical = fire.frp > 50
              return (
                <div key={idx} className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex justify-between items-center text-xs transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-white text-sm">Thermal Event #{idx + 1}</span>
                      {isCritical && (
                        <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          CRITICAL FRP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 flex items-center font-medium">
                      <MapPin size={12} className="mr-1 text-slate-400" />
                      Coordinates: <span className="font-mono text-slate-200 ml-1 font-bold">{fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Radiative Power</div>
                      <div className={`font-black font-mono text-base ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                        {fire.frp.toFixed(1)} MW
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Confidence</div>
                      <div className="font-black font-mono text-base text-emerald-400">{fire.confidence}%</div>
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

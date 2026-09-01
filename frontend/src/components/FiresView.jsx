import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Flame, AlertTriangle, ShieldCheck, Zap, Radio, MapPin, CheckCircle2 } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400 font-medium">Fetching active fire detections from NASA satellites...</span>
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold flex items-center tracking-tight">
            <Flame size={20} className="text-orange-500 mr-2.5" /> Active Farm Fires & Stubble Burning Detection
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Real-time active fire locations and fire heat power (FRP) detected by NASA satellites (VIIRS & MODIS)
          </p>
        </div>
        <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider flex items-center">
          <Zap size={12} className="mr-1.5" /> NASA Satellite Feed
        </span>
      </div>

      {/* Overview stats (Theme-adaptive cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 flex flex-col justify-between h-[135px] border-l-4 border-l-orange-500">
          <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider">Active Farm Fires</span>
          <span className="text-4xl font-black text-orange-500 flex items-center tracking-tight">
            {totalFires} <Flame className="ml-2 text-orange-500 animate-pulse" size={24} />
          </span>
          <span className="text-xs text-zinc-400 font-medium">Detected by NASA satellites</span>
        </div>

        <div className="glass-panel p-5 flex flex-col justify-between h-[135px] border-l-4 border-l-red-500">
          <span className="text-[11px] font-extrabold text-red-400 uppercase tracking-wider">Peak Fire Heat</span>
          <span className="text-4xl font-black text-red-500 tracking-tight">
            {maxFrp.toFixed(1)} <span className="text-sm font-semibold text-zinc-400">MW</span>
          </span>
          <span className="text-xs text-zinc-400 font-medium">Maximum heat power released</span>
        </div>

        <div className="glass-panel p-5 flex flex-col justify-between h-[135px] border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Detection Confidence</span>
          <span className="text-4xl font-black text-emerald-400 tracking-tight">{avgConf}%</span>
          <span className="text-xs text-zinc-400 font-medium">Satellite sensor reliability rating</span>
        </div>
      </div>

      {/* Critical fires list */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider border-b border-[var(--panel-border)] pb-3 flex items-center">
          <AlertTriangle size={16} className="text-orange-500 mr-2" /> Top Active Fire Locations (Ranked by Intensity)
        </h3>

        {sortedFires.length === 0 ? (
          <div className="text-center py-12 space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold">Clean Atmospheric Scan</h4>
            <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
              No active farm fires or anomalous stubble burning thermal events detected by NASA VIIRS/MODIS sensors on this date.
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
            {sortedFires.slice(0, 15).map((fire, idx) => {
              const isCritical = fire.frp > 50
              return (
                <div key={idx} className="vayu-subcard p-3.5 flex justify-between items-center text-xs transition-all hover:border-orange-500/40">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-sm">Thermal Event #{idx + 1}</span>
                      {isCritical && (
                        <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          CRITICAL FRP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center font-medium">
                      <MapPin size={12} className="mr-1 text-zinc-500" />
                      Lat: {fire.latitude.toFixed(4)}, Lon: {fire.longitude.toFixed(4)} ({fire.district || "Punjab Basin"})
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-base font-black text-orange-500">
                      {fire.frp.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">MW</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold">
                      Confidence: {fire.confidence}%
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

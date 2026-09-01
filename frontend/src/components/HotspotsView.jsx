import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Flame, Building2, ChevronDown, ChevronUp, Radio, AlertCircle, Layers } from 'lucide-react'

export default function HotspotsView() {
  const { selectedDate } = useStore()
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedCluster, setExpandedCluster] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/hotspots?date=${selectedDate}`)
        const data = await res.json()
        setHotspots(data.hotspots || [])
      } catch (err) {
        console.error("Failed to load hotspots:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400 font-medium">Finding pollution hotspot clusters from satellite data...</span>
      </div>
    )
  }

  // Group hotspots by cluster_id
  const clusters = {}
  hotspots.forEach(h => {
    if (!clusters[h.cluster_id]) {
      clusters[h.cluster_id] = {
        id: h.cluster_id,
        members: [],
        avgHcho: 0,
        isBiomass: false
      }
    }
    clusters[h.cluster_id].members.push(h)
    if (h.is_biomass_driven) {
      clusters[h.cluster_id].isBiomass = true
    }
  })

  // Compute stats for clusters
  Object.values(clusters).forEach(c => {
    const total = c.members.reduce((acc, curr) => acc + curr.hcho_column, 0)
    c.avgHcho = total / c.members.length
  })

  const clusterList = Object.values(clusters)
  const totalBiomass = clusterList.filter(c => c.isBiomass).length
  const totalIndustrial = clusterList.length - totalBiomass

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-purple-500 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-purple-500 uppercase tracking-wider flex items-center">
            <Radio size={12} className="mr-1.5 animate-pulse" /> Active Pollution Clusters
          </span>
          <span className="text-4xl font-black text-purple-500 tracking-tight">{clusterList.length}</span>
          <span className="text-xs text-zinc-400 font-medium">Across {hotspots.length} detected grid areas</span>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-orange-500 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider flex items-center">
            <Flame size={12} className="mr-1.5" /> Farm Fire / Stubble Clusters
          </span>
          <span className="text-4xl font-black text-orange-500 flex items-center tracking-tight">
            {totalBiomass} <Flame className="ml-2 text-orange-500 animate-pulse" size={24} />
          </span>
          <span className="text-xs text-zinc-400 font-medium">From stubble burning and open farm fires</span>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-sky-500 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-sky-500 uppercase tracking-wider flex items-center">
            <Building2 size={12} className="mr-1.5" /> City & Factory Clusters
          </span>
          <span className="text-4xl font-black text-sky-500 flex items-center tracking-tight">
            {totalIndustrial} <Building2 className="ml-2 text-sky-500" size={24} />
          </span>
          <span className="text-xs text-zinc-400 font-medium">From vehicle exhaust and factory chimneys</span>
        </div>
      </div>

      {/* 2. Interactive Cluster Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider border-b border-[var(--panel-border)] pb-2 flex items-center">
          <Layers size={16} className="text-[#5442ed] mr-2" /> Hotspot Cluster Breakdown
        </h3>
        {clusterList.length === 0 ? (
          <div className="glass-panel p-8 text-center text-zinc-400 font-medium">
            No pollution hotspots detected on this date. Clean air conditions across the region.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusterList.map((c) => {
              const isExpanded = expandedCluster === c.id
              return (
                <div 
                  key={c.id} 
                  className="glass-panel p-5 transition-all space-y-3 cursor-pointer hover:border-indigo-500/40"
                  onClick={() => setExpandedCluster(isExpanded ? null : c.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm">Cluster #{c.id + 1}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        c.isBiomass 
                          ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' 
                          : 'bg-sky-500/15 text-sky-500 border-sky-500/30'
                      }`}>
                        {c.isBiomass ? "BIOMASS DOMINATED" : "URBAN / INDUSTRIAL"}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
                    <span>Cells: <b className="font-bold">{c.members.length}</b></span>
                    <span>Mean HCHO: <b className="text-purple-500 font-bold font-mono">{c.avgHcho.toFixed(2)}</b> ×10¹⁵</span>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-[var(--panel-border)] space-y-2 text-xs animate-fadeIn">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-zinc-400">Cluster Members:</div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {c.members.map((m, idx) => (
                          <div key={idx} className="vayu-subcard p-2 rounded-lg flex justify-between items-center text-[11px]">
                            <span>{m.district || `Zone ${idx + 1}`} ({m.latitude.toFixed(2)}°, {m.longitude.toFixed(2)}°)</span>
                            <span className="font-mono font-bold text-purple-500">{m.hcho_column.toFixed(2)} HCHO</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

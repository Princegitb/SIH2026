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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-300 font-medium">Running DBSCAN spatial hotspot clustering calculations...</span>
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
    <div className="space-y-6">
      {/* 1. Header Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider flex items-center">
            <Radio size={12} className="mr-1.5 animate-pulse text-purple-400" /> Active Hotspot Clusters
          </span>
          <span className="text-4xl font-black text-purple-400 tracking-tight">{clusterList.length}</span>
          <span className="text-xs text-slate-300 font-medium">Across {hotspots.length} anomalous monitoring grid cells</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-orange-500/30 bg-gradient-to-br from-orange-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-orange-300 uppercase tracking-wider flex items-center">
            <Flame size={12} className="mr-1.5 text-orange-400" /> Biomass Driven Clusters
          </span>
          <span className="text-4xl font-black text-orange-400 flex items-center tracking-tight">
            {totalBiomass} <Flame className="ml-2 text-orange-400 animate-pulse" size={24} />
          </span>
          <span className="text-xs text-slate-300 font-medium">Attributed to active stubble combustion</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-sky-500/30 bg-gradient-to-br from-sky-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold text-sky-300 uppercase tracking-wider flex items-center">
            <Building2 size={12} className="mr-1.5 text-sky-400" /> Industrial & Urban Clusters
          </span>
          <span className="text-4xl font-black text-sky-400 flex items-center tracking-tight">
            {totalIndustrial} <Building2 className="ml-2 text-sky-400" size={24} />
          </span>
          <span className="text-xs text-slate-300 font-medium">Attributed to vehicular or factory stack sources</span>
        </div>
      </div>

      {/* 2. Interactive Cluster Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-800/80 pb-2 flex items-center">
          <Layers size={16} className="text-[#4b6bf5] mr-2" /> Spatial Cluster Decomposition
        </h3>
        {clusterList.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-300 font-medium">
            No anomalous HCHO column hotspots detected on this date. Clean atmospheric baseline.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusterList.map((c) => {
              const isExpanded = expandedCluster === c.id
              return (
                <div 
                  key={c.id} 
                  className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3 cursor-pointer"
                  onClick={() => setExpandedCluster(isExpanded ? null : c.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white">Cluster #{c.id + 1}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        c.isBiomass 
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' 
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      }`}>
                        {c.isBiomass ? 'Biomass Burning' : 'Industrial / Urban'}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>

                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>Cells: <b className="text-white font-bold">{c.members.length}</b></span>
                    <span>Mean HCHO: <b className="text-purple-400 font-bold">{c.avgHcho.toFixed(2)}</b> <span className="text-[10px] text-slate-400">10¹⁵ molec/cm²</span></span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Cluster Cell Coordinates:</div>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {c.members.map((m, idx) => (
                          <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-[11px] flex justify-between">
                            <span className="text-slate-300 font-medium">{m.district || `Cell ${m.cell_id}`}</span>
                            <span className="text-purple-400 font-mono font-bold">{m.hcho_column.toFixed(1)}</span>
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

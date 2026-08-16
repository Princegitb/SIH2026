import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Flame, Building2, ChevronDown, ChevronUp } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Running DBSCAN clustering calculations...</span>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">DBSCAN Hotspots</span>
          <span className="text-3xl font-extrabold text-purple-400">{hotspots.length}</span>
          <span className="text-[10px] text-slate-500">Active anomalous grid cells detected</span>
        </div>
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Biomass Driven Clusters</span>
          <span className="text-3xl font-extrabold text-orange-500 flex items-center">
            {totalBiomass} <Flame className="ml-2 text-orange-500 animate-pulse" size={20} />
          </span>
          <span className="text-[10px] text-slate-500">Attributed to active stubble fires</span>
        </div>
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Industrial/Urban Clusters</span>
          <span className="text-3xl font-extrabold text-sky-400 flex items-center">
            {totalIndustrial} <Building2 className="ml-2 text-sky-400" size={20} />
          </span>
          <span className="text-[10px] text-slate-500">Attributed to vehicular or factory stack emissions</span>
        </div>
      </div>

      {/* 2. Interactive Cluster Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800/40 pb-2">Identified HCHO Clusters</h3>
        {clusterList.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center text-slate-500">
            No HCHO column hotspots detected on this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusterList.map((c) => {
              const isExpanded = expandedCluster === c.id
              return (
                <div 
                  key={c.id} 
                  className={`glass-panel rounded-xl p-5 transition-all duration-300 ${isExpanded ? 'border-purple-500/50 bg-purple-950/20' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">Cluster #{c.id}</span>
                        {c.isBiomass ? (
                          <span className="flex items-center bg-orange-950/20 text-orange-400 border border-orange-500/30 text-[9px] font-bold px-2 py-0.5 rounded">
                            <Flame size={10} className="mr-1" /> Biomass
                          </span>
                        ) : (
                          <span className="flex items-center bg-sky-950/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold px-2 py-0.5 rounded">
                            <Building2 size={10} className="mr-1" /> Industrial
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Contains {c.members.length} district coordinates</p>
                    </div>

                    <button 
                      onClick={() => setExpandedCluster(isExpanded ? null : c.id)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800/60 rounded shadow-sm focus:outline-none"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Avg HCHO Progress Indicator */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Average HCHO column density</span>
                      <span className="font-mono font-bold text-purple-400">{c.avgHcho.toFixed(4)} molecules/cm²</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-slate-800/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-purple-500" 
                        style={{ width: `${Math.min(100, (c.avgHcho / 8.0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Expanded district members table */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-850 pt-3 overflow-x-auto">
                      <table className="min-w-full text-xs text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-left">
                            <th className="pb-1.5 font-bold">District</th>
                            <th className="pb-1.5 font-bold">State</th>
                            <th className="pb-1.5 font-bold text-right">Latitude</th>
                            <th className="pb-1.5 font-bold text-right">Longitude</th>
                            <th className="pb-1.5 font-bold text-right">HCHO Column</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.members.map((m, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-800/40 border-b border-slate-800/20">
                              <td className="py-1.5 text-slate-200 font-semibold">{m.district}</td>
                              <td className="py-1.5">{m.state}</td>
                              <td className="py-1.5 text-right font-mono">{m.latitude.toFixed(2)}</td>
                              <td className="py-1.5 text-right font-mono">{m.longitude.toFixed(2)}</td>
                              <td className="py-1.5 text-right font-mono text-purple-400 font-bold">{m.hcho_column.toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

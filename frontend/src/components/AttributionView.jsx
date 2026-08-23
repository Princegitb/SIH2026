import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'
import { ShieldAlert, Flame, Car, Factory, Filter, CheckCircle2, Info } from 'lucide-react'

export default function AttributionView() {
  const { selectedDate, selectedState } = useStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('stacked') // 'stacked', 'pie'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/attribution?date=${selectedDate}&state=${selectedState}`)
        const resData = await res.json()
        setData(resData.attribution || resData.attributions || [])
      } catch (err) {
        console.error("Failed to load attribution:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedDate, selectedState])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-300 font-medium">Parsing Sentinel-5P columnar chemistry ratios...</span>
      </div>
    )
  }

  // Format Recharts data (Stacked bars)
  const chartData = data.map(item => ({
    name: item.district,
    'Biomass Burning %': item.biomass,
    'Vehicular %': item.vehicular,
    'Industrial Stack %': item.industrial
  }))

  // Regional overall average pie breakdown
  const avgBiomass = data.length ? Math.round(data.reduce((acc, d) => acc + d.biomass, 0) / data.length) : 0
  const avgVehicular = data.length ? Math.round(data.reduce((acc, d) => acc + d.vehicular, 0) / data.length) : 0
  const avgIndustrial = data.length ? Math.round(data.reduce((acc, d) => acc + d.industrial, 0) / data.length) : 0

  const pieData = [
    { name: 'Biomass Burning', value: avgBiomass, color: '#f97316' },
    { name: 'Vehicular Exhaust', value: avgVehicular, color: '#38bdf8' },
    { name: 'Industrial Stacks', value: avgIndustrial, color: '#a855f7' }
  ]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center tracking-tight">
            Trace Gas Chemical Source Apportionment
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Isolating emission fingerprints by cross-referencing TROPOMI columnar ratios of HCHO, NO₂, CO, and SO₂
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#090d16]/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode('stacked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'stacked' ? 'bg-[#4b6bf5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            District Stacked Bars
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'pie' ? 'bg-[#4b6bf5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Regional Share Donut
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Visual: Stacked or Pie Chart (Span 8) */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col h-[460px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                {viewMode === 'stacked' ? "District-Level Source Contribution (%)" : "Regional Basin Chemical Contribution"}
              </h3>
              <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                {viewMode === 'stacked' 
                  ? "Normalized 100% composition breakdown based on trace gas satellite column densities"
                  : "Mean source share across all active monitoring districts"}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'stacked' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={600}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#090d16', 
                      borderColor: '#334155', 
                      color: '#ffffff', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#cbd5e1' }} />
                  <Bar dataKey="Biomass Burning %" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Vehicular %" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Industrial Stack %" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-around h-full">
                  <div className="h-[280px] w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#090d16', 
                            borderColor: '#334155', 
                            color: '#ffffff', 
                            borderRadius: '12px',
                            fontSize: '12px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4 pr-6">
                    {pieData.map(item => (
                      <div key={item.name} className="flex items-center justify-between space-x-6 min-w-[200px]">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-xs text-white font-bold">{item.name}</span>
                        </div>
                        <span className="text-base font-extrabold font-mono" style={{ color: item.color }}>
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Explanatory Chemical Guide Cards (Span 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between space-y-4">
          
          {/* Card 1: Biomass */}
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-[#f97316] bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-white">
              <Flame size={16} className="text-[#f97316]" />
              <span>Biomass & Stubble Combustion</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
              Flagged by elevated <b className="text-[#f97316]">HCHO : NO₂</b> column ratios from Sentinel-5P. Agricultural burning releases large fractions of volatile organics relative to combustion NO₂.
            </p>
          </div>

          {/* Card 2: Vehicular */}
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-[#38bdf8] bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-white">
              <Car size={16} className="text-[#38bdf8]" />
              <span>Vehicular & Traffic Exhaust</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
              Identified by high surface <b className="text-[#38bdf8]">NO₂ and CO</b> columns with low HCHO ratios. Internal combustion engines dominate congested urban traffic corridors.
            </p>
          </div>

          {/* Card 3: Industrial */}
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-[#a855f7] bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-white">
              <Factory size={16} className="text-[#a855f7]" />
              <span>Industrial Stacks & Power Plants</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
              Attributed when isolated <b className="text-[#a855f7]">SO₂</b> column anomalies occur independently of fire clusters, indicating coal-fired boilers, thermal plants, or brick kilns.
            </p>
          </div>

          {/* Diagnostic Note */}
          <div className="glass-panel rounded-2xl p-4 border border-purple-500/30 bg-purple-950/25 flex items-start space-x-3">
            <ShieldAlert size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed font-medium">
              <b className="text-purple-300">Diagnostic Threshold:</b> HCHO column densities exceeding <span className="font-mono text-purple-400 font-bold">2.5 × 10¹⁵ molec/cm²</span> are statutory signatures of open-field agricultural biomass combustion.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

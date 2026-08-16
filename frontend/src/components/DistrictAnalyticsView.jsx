import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react'

// CPCB category helper
const getCpcbColor = (aqi) => {
  if (aqi <= 50) return "#00b050"
  if (aqi <= 100) return "#92d050"
  if (aqi <= 200) return "#ffff00"
  if (aqi <= 300) return "#ffc000"
  if (aqi <= 400) return "#ff0000"
  return "#c00000"
}

export default function DistrictAnalyticsView() {
  const { selectedDate, mapData, fetchMapData } = useStore()
  const [analytics, setAnalytics] = useState([])

  useEffect(() => {
    fetchMapData()
  }, [selectedDate])

  useEffect(() => {
    if (mapData && mapData.cells) {
      // Group by district and calculate averages
      const districtMap = {}
      mapData.cells.forEach(cell => {
        if (!districtMap[cell.district]) {
          districtMap[cell.district] = { name: cell.district, aqiTotal: 0, pm25Total: 0, count: 0 }
        }
        districtMap[cell.district].aqiTotal += cell.aqi
        districtMap[cell.district].pm25Total += cell.pm25
        districtMap[cell.district].count += 1
      })

      const list = Object.values(districtMap).map(d => ({
        name: d.name,
        'Average AQI': Math.round(d.aqiTotal / d.count),
        'Average PM2.5': Math.round(d.pm25Total / d.count)
      }))

      // Sort by AQI descending
      list.sort((a, b) => b['Average AQI'] - a['Average AQI'])
      setAnalytics(list)
    }
  }, [mapData])

  if (!mapData || analytics.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-400">Aggregating district boundaries metrics...</span>
      </div>
    )
  }

  // Top/Bottom districts
  const worstDistrict = analytics[0]
  const bestDistrict = analytics[analytics.length - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center">
          <BarChart3 size={18} className="text-[#4b6bf5] mr-2" /> Regional District Comparative Analytics
        </h2>
        <p className="text-xs text-slate-500 font-medium">Comparative air quality rankings and metrics across active monitoring zones</p>
      </div>

      {/* Top Cards: Worst vs Best */}
      <div className="grid grid-cols-2 gap-4">
        {/* Most Polluted District */}
        <div className="glass-panel rounded-xl p-5 flex items-start space-x-4 border-red-500/20 bg-red-50/50">
          <div className="bg-[#fff1f2] p-2.5 rounded-lg border border-red-200 text-red-500 mt-1">
            <AlertTriangle size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Critical Zone Alert
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-1.5">Most Polluted: {worstDistrict.name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">Average AQI: <span className="font-bold text-red-500">{worstDistrict['Average AQI']}</span> | PM2.5: {worstDistrict['Average PM2.5']} µg/m³</p>
          </div>
        </div>

        {/* Cleanest District */}
        <div className="glass-panel rounded-xl p-5 flex items-start space-x-4 border-emerald-500/20 bg-emerald-50/50">
          <div className="bg-[#f0fdf4] p-2.5 rounded-lg border border-emerald-200 text-emerald-500 mt-1">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[9px] bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Optimal Zone Status
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-1.5">Cleanest: {bestDistrict.name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">Average AQI: <span className="font-bold text-emerald-500">{bestDistrict['Average AQI']}</span> | PM2.5: {bestDistrict['Average PM2.5']} µg/m³</p>
          </div>
        </div>
      </div>

      {/* District Comparison Bar Chart */}
      <div className="glass-panel rounded-xl p-5 flex flex-col h-[380px]">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Average AQI Comparisons by District</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 450]} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={75} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 11 }} />
              <Bar dataKey="Average AQI" radius={[0, 4, 4, 0]}>
                {analytics.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={getCpcbColor(entry['Average AQI'])} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

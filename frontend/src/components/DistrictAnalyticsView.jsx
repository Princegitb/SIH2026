import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  ComposedChart, Line, Area
} from 'recharts'
import { BarChart3, AlertTriangle, ShieldCheck, TrendingUp, Layers, Award, Activity } from 'lucide-react'

// CPCB category helper
const getCpcbColor = (aqi) => {
  if (aqi <= 50) return "#10b981"      // Good (Emerald)
  if (aqi <= 100) return "#84cc16"     // Satisfactory (Lime)
  if (aqi <= 200) return "#eab308"     // Moderate (Yellow)
  if (aqi <= 300) return "#f97316"     // Poor (Orange)
  if (aqi <= 400) return "#ef4444"     // Very Poor (Red)
  return "#a855f7"                     // Severe (Purple)
}

const getAqiCategory = (aqi) => {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Satisfactory"
  if (aqi <= 200) return "Moderate"
  if (aqi <= 300) return "Poor"
  if (aqi <= 400) return "Very Poor"
  return "Severe"
}

export default function DistrictAnalyticsView() {
  const { selectedDate, mapData, fetchMapData, theme } = useStore()
  const [analytics, setAnalytics] = useState([])
  const [chartType, setChartType] = useState('aqi') // 'aqi', 'pm', 'composed'
  const [selectedSort, setSelectedSort] = useState('desc')

  useEffect(() => {
    fetchMapData()
  }, [selectedDate])

  useEffect(() => {
    if (mapData && mapData.cells) {
      const districtMap = {}
      mapData.cells.forEach(cell => {
        if (!districtMap[cell.district]) {
          districtMap[cell.district] = { 
            name: cell.district, 
            state: cell.state || "NCR",
            aqiTotal: 0, 
            pm25Total: 0, 
            pm10Total: 0,
            no2Total: 0,
            count: 0 
          }
        }
        districtMap[cell.district].aqiTotal += cell.aqi
        districtMap[cell.district].pm25Total += cell.pm25
        districtMap[cell.district].pm10Total += cell.pm10 || (cell.pm25 * 1.6)
        districtMap[cell.district].no2Total += cell.no2_surface || (cell.pm25 * 0.4)
        districtMap[cell.district].count += 1
      })

      const list = Object.values(districtMap).map(d => ({
        name: d.name,
        state: d.state,
        'Average AQI': Math.round(d.aqiTotal / d.count),
        'PM2.5': Math.round(d.pm25Total / d.count),
        'PM10': Math.round(d.pm10Total / d.count),
        'NO2': Math.round(d.no2Total / d.count),
        'Category': getAqiCategory(Math.round(d.aqiTotal / d.count))
      }))

      list.sort((a, b) => selectedSort === 'desc' ? b['Average AQI'] - a['Average AQI'] : a['Average AQI'] - b['Average AQI'])
      setAnalytics(list)
    }
  }, [mapData, selectedSort])

  if (!mapData || analytics.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-300 font-medium">Aggregating district boundary telemetry...</span>
      </div>
    )
  }

  // Top/Bottom districts sorted by AQI
  const worstDistrict = [...analytics].sort((a, b) => b['Average AQI'] - a['Average AQI'])[0]
  const bestDistrict = [...analytics].sort((a, b) => a['Average AQI'] - b['Average AQI'])[0]
  const avgRegionalAqi = Math.round(analytics.reduce((acc, d) => acc + d['Average AQI'], 0) / analytics.length)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center tracking-tight">
            <BarChart3 size={20} className="text-[#4b6bf5] mr-2.5" /> Regional District Comparative Analytics
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Comparative air quality rankings, particulate loading, and CPCB regulatory compliance across all active monitoring zones
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#090d16]/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setChartType('aqi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartType === 'aqi' ? 'bg-[#4b6bf5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AQI Rankings
          </button>
          <button
            onClick={() => setChartType('pm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartType === 'pm' ? 'bg-[#4b6bf5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PM2.5 vs PM10
          </button>
          <button
            onClick={() => setChartType('composed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartType === 'composed' ? 'bg-[#4b6bf5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Metric Trend
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Polluted District Card */}
        <div className="glass-panel rounded-2xl p-5 border-red-500/30 bg-gradient-to-br from-red-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">
              <AlertTriangle size={11} className="mr-1 animate-pulse" /> Critical Hotspot
            </span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-red-400">{worstDistrict['Average AQI']}</span>
              <span className="text-[9px] text-slate-400 block font-medium">AQI Index</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-extrabold text-white tracking-tight">{worstDistrict.name}</h3>
            <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 font-medium">
              <span>PM2.5: <b className="text-yellow-400">{worstDistrict['PM2.5']}</b> µg/m³</span>
              <span>•</span>
              <span>PM10: <b className="text-orange-400">{worstDistrict['PM10']}</b> µg/m³</span>
            </div>
          </div>
        </div>

        {/* Cleanest District Card */}
        <div className="glass-panel rounded-2xl p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">
              <ShieldCheck size={11} className="mr-1" /> Cleanest Zone
            </span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-400">{bestDistrict['Average AQI']}</span>
              <span className="text-[9px] text-slate-400 block font-medium">AQI Index</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-extrabold text-white tracking-tight">{bestDistrict.name}</h3>
            <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 font-medium">
              <span>PM2.5: <b className="text-emerald-400">{bestDistrict['PM2.5']}</b> µg/m³</span>
              <span>•</span>
              <span>PM10: <b className="text-lime-400">{bestDistrict['PM10']}</b> µg/m³</span>
            </div>
          </div>
        </div>

        {/* Regional Mean Overview Card */}
        <div className="glass-panel rounded-2xl p-5 border-blue-500/30 bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-slate-900/90 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">
              <Activity size={11} className="mr-1" /> Regional Mean
            </span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-blue-400">{avgRegionalAqi}</span>
              <span className="text-[9px] text-slate-400 block font-medium">Mean AQI</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-extrabold text-white tracking-tight">Delhi-NCR & Punjab Basin</h3>
            <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1 font-medium">
              <span>Coverage: <b className="text-white">{analytics.length} Districts</b></span>
              <span>•</span>
              <span className="text-blue-300 font-semibold">{getAqiCategory(avgRegionalAqi)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Box */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col h-[460px]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              {chartType === 'aqi' && "District AQI Comparison & Severity Gradient"}
              {chartType === 'pm' && "Particulate Matter Loading (PM2.5 vs PM10)"}
              {chartType === 'composed' && "Cross-District Multi-Pollutant Spectrum"}
            </h3>
            <span className="text-xs text-slate-400 font-medium mt-0.5 block">
              Hover over bars to inspect individual pollutant concentrations and safe limits
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedSort(selectedSort === 'desc' ? 'asc' : 'desc')}
              className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Sort: {selectedSort === 'desc' ? 'Highest First ⬇' : 'Lowest First ⬆'}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'aqi' ? (
              <BarChart data={analytics} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
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
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090d16', 
                    borderColor: '#334155', 
                    color: '#ffffff', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar dataKey="Average AQI" radius={[6, 6, 0, 0]}>
                  {analytics.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={getCpcbColor(entry['Average AQI'])} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'pm' ? (
              <BarChart data={analytics} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
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
                <YAxis stroke="#94a3b8" fontSize={11} />
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
                <Bar dataKey="PM2.5" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PM10" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <ComposedChart data={analytics} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
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
                <YAxis stroke="#94a3b8" fontSize={11} />
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
                <Bar dataKey="Average AQI" fill="#4b6bf5" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="PM2.5" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4, fill: '#eab308' }} />
                <Line type="monotone" dataKey="NO2" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Detail Table Matrix */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center">
          <Layers size={16} className="text-[#4b6bf5] mr-2" /> Complete District Air Quality Scorecard
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">State</th>
                <th className="py-3 px-3">Average AQI</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">PM2.5 (µg/m³)</th>
                <th className="py-3 px-3">PM10 (µg/m³)</th>
                <th className="py-3 px-3">NO₂ (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {analytics.map((row, idx) => (
                <tr key={row.name} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 text-slate-400 font-bold font-mono">#{idx + 1}</td>
                  <td className="py-3 px-3 text-white font-bold">{row.name}</td>
                  <td className="py-3 px-3 text-slate-300">{row.state}</td>
                  <td className="py-3 px-3">
                    <span 
                      className="font-extrabold text-sm px-2 py-0.5 rounded-md"
                      style={{ color: getCpcbColor(row['Average AQI']) }}
                    >
                      {row['Average AQI']}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span 
                      className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border"
                      style={{ 
                        backgroundColor: `${getCpcbColor(row['Average AQI'])}15`,
                        color: getCpcbColor(row['Average AQI']),
                        borderColor: `${getCpcbColor(row['Average AQI'])}35`
                      }}
                    >
                      {row.Category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-yellow-400 font-bold">{row['PM2.5']}</td>
                  <td className="py-3 px-3 font-mono text-orange-400 font-bold">{row['PM10']}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{row['NO2']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

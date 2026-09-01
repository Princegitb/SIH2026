import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { FileDown, Calendar, Award } from 'lucide-react'

export default function ReportsView() {
  const { selectedDate, selectedDistrict } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/compliance?date=${selectedDate}&district=${selectedDistrict}`)
        const resData = await res.json()
        setData(resData)
      } catch (err) {
        console.error("Failed to load compliance data:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [selectedDate, selectedDistrict])

  const downloadCSVReport = async () => {
    try {
      const res = await fetch('/api/data-explorer?limit=1000')
      const resData = await res.json()
      
      // Convert JSON to CSV
      const headers = ["Date", "District", "State", "Estimated AQI", "PM2.5", "PM10", "NO2", "SO2", "CO", "O3", "AOD", "HCHO", "BLH"]
      const rows = resData.data.map(r => [
        r.date, r.district, r.state, r.aqi, r.pm25, r.pm10, r.no2_surface, r.so2_surface, r.co_surface, r.o3_surface, r.aod, r.hcho_column, r.blh
      ])
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
        
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `NCAP_Compliance_Report_${selectedDistrict}_${selectedDate}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to export compliance report:", err)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-400">Loading NCAP compliance report...</span>
      </div>
    )
  }

  // Margin calculation
  const margin = Math.round(data.target - data.rolling_average)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-base font-extrabold text-white flex items-center tracking-tight">
          <Award size={18} className="text-emerald-400 mr-2" /> National Clean Air Programme (NCAP) Compliance Panel
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">Target status tracking against official environmental quality thresholds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance metrics card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-[250px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Compliance Status</span>
              <h3 className="text-base font-extrabold text-white mt-2 tracking-tight">Rolling 30-Day Average</h3>
              <p className="text-xs text-zinc-400 font-medium">{selectedDistrict} District</p>
            </div>
            {data.is_compliant ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded">
                COMPLIANT
              </span>
            ) : (
              <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1 rounded">
                NON-COMPLIANT
              </span>
            )}
          </div>

          <div className="my-4 flex items-baseline space-x-2">
            <span className="text-5xl font-black text-white">{data.rolling_average}</span>
            <span className="text-sm font-semibold text-zinc-400">/ {data.target} Target AQI</span>
          </div>

          <div className="border-t border-white/[0.06] pt-3 text-xs text-zinc-300">
            {data.is_compliant ? (
              <span>District is compliant by <span className="font-bold text-emerald-400">{margin} AQI points</span>.</span>
            ) : (
              <span>District exceeds NCAP target by <span className="font-bold text-red-400">{Math.abs(margin)} AQI points</span>.</span>
            )}
          </div>
        </div>

        {/* Exporter actions card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-[250px]">
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-white tracking-tight">Compliance Exporter Tool</h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              Download complete high-resolution spatial grid predictions, meteorological layers, and Sentinel-5P column density calculations in tabular format.
            </p>
          </div>

          <button 
            onClick={downloadCSVReport}
            className="w-full bg-[#0c0c10] border border-white/[0.1] hover:border-white/[0.3] text-white hover:bg-zinc-800 text-xs font-bold py-3 rounded-xl flex items-center justify-center transition-all shadow-md focus:outline-none"
          >
            <FileDown size={14} className="mr-2" /> Export 30-Day compliance CSV Report
          </button>
        </div>
      </div>
    </div>
  )
}

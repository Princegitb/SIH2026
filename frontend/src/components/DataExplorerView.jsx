import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export default function DataExplorerView() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const limit = 20

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/data-explorer?page=${page}&limit=${limit}`)
        const resData = await res.json()
        setData(resData.data || [])
        setTotalPages(Math.ceil(resData.total_records / limit))
      } catch (err) {
        console.error("Failed to load explorer data:", err)
      }
      setLoading(false)
    }
    loadData()
  }, [page])

  // Filter local search for search term (district or state)
  const filteredData = data.filter(r => 
    r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search and stats */}
      <div className="flex justify-between items-center glass-panel rounded-xl p-4 z-10">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            placeholder="Search by District or State..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#4b6bf5] shadow-sm"
          />
        </div>

        <div className="text-xs text-slate-600">
          Showing page <span className="font-bold text-slate-800">{page}</span> of {totalPages}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-xl p-5 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
          </div>
        ) : (
          <table className="min-w-full text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left">
                <th className="pb-3 font-bold">Date</th>
                <th className="pb-3 font-bold">District</th>
                <th className="pb-3 font-bold">State</th>
                <th className="pb-3 font-bold text-right">AQI</th>
                <th className="pb-3 font-bold text-right">PM2.5</th>
                <th className="pb-3 font-bold text-right">PM10</th>
                <th className="pb-3 font-bold text-right">NO₂</th>
                <th className="pb-3 font-bold text-right">SO₂</th>
                <th className="pb-3 font-bold text-right">CO</th>
                <th className="pb-3 font-bold text-right">O₃</th>
                <th className="pb-3 font-bold text-right">AOD</th>
                <th className="pb-3 font-bold text-right">HCHO</th>
                <th className="pb-3 font-bold text-right">BLH</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((r, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="py-2.5 font-mono">{r.date}</td>
                  <td className="py-2.5 text-slate-800 font-semibold">{r.district}</td>
                  <td className="py-2.5">{r.state}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-[#4b6bf5]">{r.aqi}</td>
                  <td className="py-2.5 text-right font-mono">{r.pm25}</td>
                  <td className="py-2.5 text-right font-mono">{r.pm10}</td>
                  <td className="py-2.5 text-right font-mono">{r.no2_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.so2_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.co_surface.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">{r.o3_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.aod.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono text-purple-600">{r.hcho_column.toFixed(4)}</td>
                  <td className="py-2.5 text-right font-mono">{r.blh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex justify-between items-center text-xs">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 hover:border-slate-300 disabled:opacity-40 flex items-center transition-colors shadow-sm"
        >
          <ChevronLeft size={14} className="mr-1" /> Previous
        </button>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 hover:border-slate-300 disabled:opacity-40 flex items-center transition-colors shadow-sm"
        >
          Next <ChevronRight size={14} className="ml-1" />
        </button>
      </div>
    </div>
  )
}

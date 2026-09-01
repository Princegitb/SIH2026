import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useStore } from '../store'

export default function DataExplorerView() {
  const { theme } = useStore()
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
    <div className="space-y-4 animate-fadeIn">
      {/* Search and stats */}
      <div className="flex justify-between items-center glass-panel p-4 z-10">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            placeholder="Search by District or State..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#5442ed] shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <span>Showing page <strong className="font-bold">{page}</strong> of {totalPages}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg vayu-subcard hover:border-indigo-500/40 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg vayu-subcard hover:border-indigo-500/40 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel p-5 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
          </div>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--panel-border)] text-zinc-400 text-left uppercase text-[10px] font-bold">
                <th className="pb-3">Date</th>
                <th className="pb-3">District</th>
                <th className="pb-3">State</th>
                <th className="pb-3 text-right">AQI</th>
                <th className="pb-3 text-right">PM2.5</th>
                <th className="pb-3 text-right">PM10</th>
                <th className="pb-3 text-right">NO₂</th>
                <th className="pb-3 text-right">SO₂</th>
                <th className="pb-3 text-right">CO</th>
                <th className="pb-3 text-right">O₃</th>
                <th className="pb-3 text-right">AOD</th>
                <th className="pb-3 text-right">HCHO</th>
                <th className="pb-3 text-right">BLH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {filteredData.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-500/5 transition-colors">
                  <td className="py-2.5 font-mono text-zinc-400">{r.date}</td>
                  <td className="py-2.5 font-semibold">{r.district}</td>
                  <td className="py-2.5 text-zinc-400">{r.state}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-[#5442ed]">{r.aqi}</td>
                  <td className="py-2.5 text-right font-mono">{r.pm25}</td>
                  <td className="py-2.5 text-right font-mono">{r.pm10}</td>
                  <td className="py-2.5 text-right font-mono">{r.no2_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.so2_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.co_surface.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">{r.o3_surface.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono">{r.aod.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono text-purple-500 font-bold">{r.hcho_column.toFixed(4)}</td>
                  <td className="py-2.5 text-right font-mono">{r.blh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

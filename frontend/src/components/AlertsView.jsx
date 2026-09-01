import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { ShieldAlert, ShieldCheck, Landmark, Building2, Flame, AlertTriangle } from 'lucide-react'

export default function AlertsView() {
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400">Scanning sensitive receptor boundaries...</span>
      </div>
    )
  }

  const alerts = data.alerts || []

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-5">
        <h2 className="text-base font-extrabold flex items-center tracking-tight">
          <ShieldAlert size={18} className="text-red-500 mr-2" /> Spatial Sensitive Receptor Alerts
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">Real-time alerts for schools, hospitals, and residential zones within hotspot dispersion paths</p>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel p-8 flex flex-col items-center justify-center space-y-3 h-[250px] text-center border-emerald-500/30 bg-emerald-500/5">
          <ShieldCheck className="text-emerald-500" size={48} />
          <div className="text-sm font-bold">System Status: Clean Atmospheric Scan</div>
          <p className="text-xs text-zinc-400 max-w-sm">No active Formaldehyde columns or fire fronts detected near schools or hospitals in {selectedDistrict} today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert, idx) => (
            <div key={idx} className="glass-panel p-5 flex items-start space-x-4 border-l-4 border-l-red-500">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 mt-1 border border-red-500/20">
                {alert.type === "School" ? <Landmark size={20} /> : <Building2 size={20} />}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-extrabold">{alert.name}</h3>
                    <span className="text-[9px] bg-red-500/15 text-red-500 border border-red-500/30 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {alert.type} Proximity Warn
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-500 font-mono">{alert.dist_km} km away</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                  This facility sits downwind from a detected HCHO column hotspot. Under active wind trajectories, elevated particulate counts are projected within 3 hours.
                </p>

                <div className="text-[10px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center space-x-1.5">
                  <Flame size={12} className="animate-pulse flex-shrink-0" />
                  <span>Recommendation: Restrict outdoor activities and activate HVAC secondary particulate filters.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

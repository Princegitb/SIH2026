import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { ShieldAlert, ShieldCheck, Landmark, Building2, Flame } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-400">Scanning sensitive receptor boundaries...</span>
      </div>
    )
  }

  const alerts = data.alerts || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-200 flex items-center">
          <ShieldAlert size={18} className="text-red-400 mr-2" /> Spatial Sensitive Receptor Alerts
        </h2>
        <p className="text-xs text-slate-500 font-medium">Real-time alerts for schools, hospitals, and residential zones within hotspot dispersion paths</p>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center space-y-3 h-[250px] text-center border-emerald-500/30 bg-emerald-950/10">
          <ShieldCheck className="text-emerald-400" size={48} />
          <div className="text-sm font-bold text-slate-200">System Status: Secure</div>
          <p className="text-xs text-slate-400 max-w-sm">No active Formaldehyde columns or active fire fronts detected near schools or hospitals in {selectedDistrict} today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert, idx) => (
            <div key={idx} className="glass-panel rounded-xl p-5 flex items-start space-x-4 border-red-500/30 bg-red-950/10">
              <div className="bg-red-950/20 p-2.5 rounded-lg border border-red-500/30 text-red-400 mt-1">
                {alert.type === "School" ? <Landmark size={20} /> : <Building2 size={20} />}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{alert.name}</h3>
                    <span className="text-[9px] bg-red-950/30 text-red-400 border border-red-500/30 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {alert.type} Proximity Warn
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-400">{alert.dist_km} km away</span>
                </div>

                <p className="text-[11px] text-slate-400">
                  This facility sits downwind from a detected HCHO column hotspot. Under active wind trajectories, elevated particulate counts are projected within 3 hours.
                </p>

                <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/20 rounded p-2 flex items-center space-x-1.5">
                  <Flame size={12} className="animate-pulse" />
                  <span>Recommendation: Restrict outdoor physical education and activate hospital HVAC secondary filters.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

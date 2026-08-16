import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ShieldAlert } from 'lucide-react'

export default function AttributionView() {
  const { selectedDate, selectedState } = useStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/attribution?date=${selectedDate}&state=${selectedState}`)
        const resData = await res.json()
        setData(resData.attribution || [])
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
        <span className="ml-3 text-slate-500">Parsing column chemistry ratios...</span>
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

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-1">Trace Gas Chemical Source Apportionment</h2>
        <p className="text-xs text-slate-500 font-medium">Emissions categorized by cross-referencing TROPOMI columnar ratios of HCHO, NO₂, CO, and SO₂</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Attribution Stacked Bar Chart */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-5 flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">District-level Emissions Attribution Comparisons</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: 10 }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Biomass Burning %" stackId="a" fill="#ff7043" />
                <Bar dataKey="Vehicular %" stackId="a" fill="#29b6f6" />
                <Bar dataKey="Industrial Stack %" stackId="a" fill="#b0bec5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chemical ratios guide */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-5 flex flex-col justify-between h-[350px]">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Ratios apportionment key</h3>
            <div className="text-xs text-slate-700 space-y-3">
              <p>
                <b>Biomass Burning 🔥:</b> Indicated by high Formaldehyde (HCHO) to Nitrogen Dioxide (NO₂) column ratios. Stubble combustion yields a high emission factor of volatile organics (leading to HCHO columns) relative to combustion NO₂.
              </p>
              <p>
                <b>Vehicular Emissions 🚗:</b> Flagged by low HCHO:NO₂ ratios combined with high Carbon Monoxide (CO). Urban transportation engines release massive quantities of nitrogen oxides and CO at surface level.
              </p>
              <p>
                <b>Industrial stack emissions 🏢:</b> Attributed when sulfur dioxide (SO₂) anomalies occur independently of fires, indicating coal-fired thermal power plants or metallurgy stacks.
              </p>
            </div>
          </div>

          <div className="border border-purple-200 bg-purple-50 text-purple-800 rounded-lg p-3 flex items-start space-x-2.5 text-[11px] font-medium shadow-sm">
            <ShieldAlert size={14} className="mt-0.5" />
            <div>
              <b>Diagnostic Flag:</b> HCHO column densities &gt; 2.5 molecules/cm² are typical signatures of biomass agricultural burning events.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

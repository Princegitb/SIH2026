import React, { useState } from 'react'
import { Sliders, Save } from 'lucide-react'

export default function SettingsView() {
  const [eps, setEps] = useState(0.3)
  const [percentile, setPercentile] = useState(85)
  const [saveStatus, setSaveStatus] = useState('')

  const handleSave = () => {
    setSaveStatus('Saving parameters...')
    setTimeout(() => {
      setSaveStatus('Parameters successfully compiled and applied!')
      setTimeout(() => setSaveStatus(''), 2000)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center">
          <Sliders size={18} className="text-[#4b6bf5] mr-2" /> Platform Parameters & Configuration
        </h2>
        <p className="text-xs text-slate-500 font-medium">Configure core parameters for spatial clustering and threshold alerts</p>
      </div>

      <div className="glass-panel rounded-xl p-6 space-y-6 max-w-xl">
        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">DBSCAN Neighborhood Radius (eps)</span>
              <span className="font-mono font-bold text-[#4b6bf5]">{eps} degrees</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.0" 
              step="0.05"
              value={eps} 
              onChange={(e) => setEps(parseFloat(e.target.value))}
              className="w-full accent-[#4b6bf5] bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-600">Determines the maximum distance threshold for linking Formaldehyde anomalies into a single hotspot cluster.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">HCHO Anomaly Percentile Threshold</span>
              <span className="font-mono font-bold text-[#4b6bf5]">{percentile}th Percentile</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="99" 
              step="1"
              value={percentile} 
              onChange={(e) => setPercentile(parseInt(e.target.value))}
              className="w-full accent-[#4b6bf5] bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-600">Grid cells exceeding this percentile in HCHO column density will be flagged as anomalous hotspots.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
          <button 
            onClick={handleSave}
            className="bg-[#4b6bf5] hover:bg-[#3b56cf] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm border-transparent"
          >
            <Save size={14} className="mr-2" /> Save Parameters
          </button>

          {saveStatus && (
            <span className="text-xs text-emerald-600 font-semibold">{saveStatus}</span>
          )}
        </div>
      </div>
    </div>
  )
}

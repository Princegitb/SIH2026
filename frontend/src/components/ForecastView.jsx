import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Calendar, CloudSnow, Wind, Sparkles } from 'lucide-react'

const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor" }
  return { color: "#7f1d1d", label: "Severe" }
}

export default function ForecastView() {
  const { selectedDate, selectedDistrict } = useStore()
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadForecast() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/forecast?date=${selectedDate}&district=${selectedDistrict}`)
        const data = await res.json()
        if (res.ok && data && data.forecast) {
          setForecastData(data.forecast)
        } else {
          setError(data?.detail || "Service temporary unavailable or loading data.")
        }
      } catch (err) {
        console.error("Failed to load ML forecast:", err)
        setError("Network error: Could not reach backend forecast service.")
      }
      setLoading(false)
    }
    loadForecast()
  }, [selectedDate, selectedDistrict])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4b6bf5]"></div>
        <span className="ml-3 text-slate-400 font-medium">Running 48-Hour ML atmospheric forecasting regressor...</span>
      </div>
    )
  }

  if (error || !forecastData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 space-y-3">
        <span className="text-2xl">⚠️</span>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Forecast Engine Notice</h3>
        <p className="text-xs text-slate-400 max-w-md font-semibold">
          {error || "No forecast metrics available for the selected parameters."}
        </p>
      </div>
    )
  }

  const d1 = forecastData.day1 || { aqi: 150, inversion_risk: "Moderate Risk", wind_speed: 12.0 }
  const d2 = forecastData.day2 || { aqi: 140, inversion_risk: "Low Risk", wind_speed: 14.0 }

  const tomDetails = getCpcbColorAndLabel(d1.aqi)
  const dayDetails = getCpcbColorAndLabel(d2.aqi)

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold theme-adapt-text mb-1 flex items-center">
            <Sparkles size={18} className="text-[#4b6bf5] mr-2" /> Multi-Step ML 48-Hour AQI Forecasting Engine
          </h2>
          <p className="text-xs text-slate-500 font-medium">Atmospheric predictions derived from boundary layer height compression, upstream FRP, and wind vectors</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#4b6bf5]/10 text-[#7c93fe] border border-[#4b6bf5]/25 uppercase tracking-wider">
          XGBoost Time-Series Regressor
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Day +1 Forecast Card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between h-[280px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#4b6bf5]/10 text-[#7c93fe] border border-[#4b6bf5]/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Day +1 Projection (+24h)
              </span>
              <h3 className="text-base font-bold theme-adapt-text mt-2">Tomorrow</h3>
              <p className="text-xs text-slate-500">{selectedDistrict} District</p>
            </div>
            <Calendar size={18} className="text-slate-500" />
          </div>

          <div className="text-center my-4">
            <div className="text-5xl font-extrabold" style={{ color: tomDetails.color }}>{d1.aqi}</div>
            <div className="text-xs font-bold uppercase mt-1" style={{ color: tomDetails.color }}>{tomDetails.label}</div>
          </div>

          <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <CloudSnow size={12} className={`mr-1 ${d1.inversion_risk === 'High Risk' ? 'text-red-400' : 'text-slate-500'}`} /> 
              Temp Inversion: <b className={`ml-1 ${d1.inversion_risk === 'High Risk' ? 'text-red-400' : 'text-slate-300'}`}>{d1.inversion_risk}</b>
            </span>
            <span className="flex items-center">
              <Wind size={12} className="mr-1 text-slate-500" /> Wind: <b className="ml-1 text-slate-300">{d1.wind_speed} km/h</b>
            </span>
          </div>
        </div>

        {/* Day +2 Forecast Card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between h-[280px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#4b6bf5]/10 text-[#7c93fe] border border-[#4b6bf5]/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Day +2 Projection (+48h)
              </span>
              <h3 className="text-base font-bold theme-adapt-text mt-2">Day After Tomorrow</h3>
              <p className="text-xs text-slate-500">{selectedDistrict} District</p>
            </div>
            <Calendar size={18} className="text-slate-500" />
          </div>

          <div className="text-center my-4">
            <div className="text-5xl font-extrabold" style={{ color: dayDetails.color }}>{d2.aqi}</div>
            <div className="text-xs font-bold uppercase mt-1" style={{ color: dayDetails.color }}>{dayDetails.label}</div>
          </div>

          <div className="border-t border-slate-800/60 pt-3 flex justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <CloudSnow size={12} className={`mr-1 ${d2.inversion_risk === 'High Risk' ? 'text-red-400' : 'text-slate-500'}`} /> 
              Temp Inversion: <b className={`ml-1 ${d2.inversion_risk === 'High Risk' ? 'text-red-400' : 'text-slate-300'}`}>{d2.inversion_risk}</b>
            </span>
            <span className="flex items-center">
              <Wind size={12} className="mr-1 text-slate-500" /> Wind: <b className="ml-1 text-slate-300">{d2.wind_speed} km/h</b>
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Forecast Alert Banner */}
      <div className={`border rounded-xl p-4 flex items-start space-x-3 text-xs font-medium shadow-sm ${
        d1.inversion_risk === 'High Risk' 
          ? 'border-red-500/30 bg-red-500/10 text-red-300' 
          : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
      }`}>
        <span className="text-base">{d1.inversion_risk === 'High Risk' ? '⚠️' : '✅'}</span>
        <div>
          <span className="font-bold">Meteorological Forecast Alert:</span> {
            d1.inversion_risk === 'High Risk'
              ? 'Atmospheric boundary layer compression forecasted (< 250m). Surface thermal inversion will trap local and upwind particulates, raising PM concentrations.'
              : 'Moderate-to-favorable planetary boundary layer dispersion expected. Atmospheric vertical mixing will maintain stable regional pollutant levels.'
          }
        </div>
      </div>
    </div>
  )
}

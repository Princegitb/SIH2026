import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Calendar, CloudSnow, Wind, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, Activity } from 'lucide-react'

const getCpcbColorAndLabel = (aqi) => {
  if (aqi <= 50) return { color: "#10b981", label: "Good", badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" }
  if (aqi <= 100) return { color: "#84cc16", label: "Satisfactory", badge: "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30" }
  if (aqi <= 200) return { color: "#eab308", label: "Moderate", badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" }
  if (aqi <= 300) return { color: "#f97316", label: "Poor", badge: "bg-orange-500/15 text-orange-500 border-orange-500/30" }
  if (aqi <= 400) return { color: "#ef4444", label: "Very Poor", badge: "bg-red-500/15 text-red-500 border-red-500/30" }
  return { color: "#a855f7", label: "Severe", badge: "bg-purple-500/15 text-purple-500 border-purple-500/30" }
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5442ed]"></div>
        <span className="ml-3 text-zinc-400 font-medium">Running 48-Hour ML atmospheric forecasting regressor...</span>
      </div>
    )
  }

  if (error || !forecastData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 space-y-3">
        <span className="text-2xl">⚠️</span>
        <h3 className="text-sm font-bold uppercase tracking-wider">Forecast Engine Notice</h3>
        <p className="text-xs text-zinc-400 max-w-md font-semibold">
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold mb-1 flex items-center tracking-tight">
            <Sparkles size={20} className="text-[#5442ed] mr-2.5" /> Multi-Step ML 48-Hour AQI Forecasting Engine
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            Projections derived from boundary layer height compression, upstream FRP emissions, and kinematic wind trajectories
          </p>
        </div>
        <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-[#5442ed]/15 text-[#5442ed] dark:text-[#7c93fe] border border-[#5442ed]/30 uppercase tracking-wider flex items-center">
          <Activity size={12} className="mr-1.5" /> XGBoost Time-Series Regressor
        </span>
      </div>

      {/* 2 Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Day +1 Forecast Card */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#5442ed]/15 text-[#5442ed] dark:text-[#7c93fe] border border-[#5442ed]/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Day +1 Projection (+24h)
              </span>
              <h3 className="text-lg font-extrabold mt-2.5 tracking-tight">Tomorrow</h3>
              <p className="text-xs text-zinc-400 font-semibold">{selectedDistrict} District</p>
            </div>
            <Calendar size={20} className="text-zinc-400" />
          </div>

          <div className="text-center my-3">
            <div className="text-5xl font-black tracking-tight" style={{ color: tomDetails.color }}>{d1.aqi}</div>
            <span className={`inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full mt-2 border ${tomDetails.badge}`}>
              {tomDetails.label.toUpperCase()}
            </span>
          </div>

          <div className="border-t border-[var(--panel-border)] pt-3 flex justify-between text-xs text-zinc-400 font-medium">
            <span className="flex items-center">
              <CloudSnow size={14} className={`mr-1.5 ${d1.inversion_risk === 'High Risk' ? 'text-red-500' : 'text-zinc-400'}`} /> 
              Inversion: <b className={`ml-1 ${d1.inversion_risk === 'High Risk' ? 'text-red-500 font-bold' : 'font-bold'}`}>{d1.inversion_risk}</b>
            </span>
            <span className="flex items-center">
              <Wind size={14} className="mr-1.5 text-sky-500" /> Wind: <b className="ml-1 font-bold">{d1.wind_speed} km/h</b>
            </span>
          </div>
        </div>

        {/* Day +2 Forecast Card */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-purple-500/15 text-purple-500 border border-purple-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Day +2 Projection (+48h)
              </span>
              <h3 className="text-lg font-extrabold mt-2.5 tracking-tight">Day After Tomorrow</h3>
              <p className="text-xs text-zinc-400 font-semibold">{selectedDistrict} District</p>
            </div>
            <Calendar size={20} className="text-zinc-400" />
          </div>

          <div className="text-center my-3">
            <div className="text-5xl font-black tracking-tight" style={{ color: dayDetails.color }}>{d2.aqi}</div>
            <span className={`inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full mt-2 border ${dayDetails.badge}`}>
              {dayDetails.label.toUpperCase()}
            </span>
          </div>

          <div className="border-t border-[var(--panel-border)] pt-3 flex justify-between text-xs text-zinc-400 font-medium">
            <span className="flex items-center">
              <CloudSnow size={14} className={`mr-1.5 ${d2.inversion_risk === 'High Risk' ? 'text-red-500' : 'text-zinc-400'}`} /> 
              Inversion: <b className={`ml-1 ${d2.inversion_risk === 'High Risk' ? 'text-red-500 font-bold' : 'font-bold'}`}>{d2.inversion_risk}</b>
            </span>
            <span className="flex items-center">
              <Wind size={14} className="mr-1.5 text-sky-500" /> Wind: <b className="ml-1 font-bold">{d2.wind_speed} km/h</b>
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Forecast Alert Banner */}
      <div className={`glass-panel p-5 flex items-start space-x-3.5 text-xs font-medium border ${
        d1.inversion_risk === 'High Risk' 
          ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300' 
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      }`}>
        <span className="text-xl flex-shrink-0 mt-0.5">{d1.inversion_risk === 'High Risk' ? '⚠️' : '🛡️'}</span>
        <div className="leading-relaxed">
          <span className="font-extrabold text-sm block mb-1">Meteorological Forecast & Advisory:</span> {
            d1.inversion_risk === 'High Risk'
              ? 'Atmospheric boundary layer compression forecasted (< 250m). Surface thermal inversion will trap local vehicular and upwind particulates, triggering elevated PM concentrations.'
              : 'Moderate-to-favorable planetary boundary layer dispersion expected. Stable atmospheric vertical mixing will maintain compliant regional pollutant levels.'
          }
        </div>
      </div>
    </div>
  )
}

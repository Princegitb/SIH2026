import React, { useEffect, useState, useRef } from 'react'
import { useStore } from './store'
import DashboardView from './components/DashboardView'
import LiveMapView from './components/LiveMapView'
import ForecastView from './components/ForecastView'
import HotspotsView from './components/HotspotsView'
import FiresView from './components/FiresView'
import TransportView from './components/TransportView'
import AttributionView from './components/AttributionView'
import DistrictAnalyticsView from './components/DistrictAnalyticsView'
import ReportsView from './components/ReportsView'
import AlertsView from './components/AlertsView'
import DataExplorerView from './components/DataExplorerView'
import PolicySimulatorView from './components/PolicySimulatorView'
import LandingPage from './components/LandingPage'
import { 
  LayoutDashboard, Map, Compass, Activity, Flame, Wind, 
  Tag, BarChart3, FileSpreadsheet, BellRing, Database,
  Sun, Moon, Calendar, Sliders, ChevronDown, Download, Sparkles
} from 'lucide-react'

export default function App() {
  const { 
    activeTab, 
    setActiveTab, 
    selectedDate, 
    setSelectedDate, 
    dates, 
    fetchMetadata,
    theme,
    toggleTheme,
    setTheme
  } = useStore()

  const [enteredDashboard, setEnteredDashboard] = useState(false)
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false)
  const [intelligenceDropdownOpen, setIntelligenceDropdownOpen] = useState(false)

  const analyticsRef = useRef(null)
  const intelligenceRef = useRef(null)

  useEffect(() => {
    // Sync initial theme
    const savedTheme = localStorage.getItem('vayu_theme') || 'dark'
    setTheme(savedTheme)
    fetchMetadata()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (analyticsRef.current && !analyticsRef.current.contains(event.target)) {
        setAnalyticsDropdownOpen(false)
      }
      if (intelligenceRef.current && !intelligenceRef.current.contains(event.target)) {
        setIntelligenceDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!enteredDashboard) {
    return <LandingPage onEnterDashboard={() => setEnteredDashboard(true)} />
  }

  // Analytics tab group items
  const analyticsItems = [
    { name: 'AQI Forecast', icon: Compass },
    { name: 'HCHO Hotspots', icon: Activity },
    { name: 'Fire Detection', icon: Flame },
    { name: 'Wind Transport', icon: Wind },
  ]

  // Intelligence tab group items
  const intelligenceItems = [
    { name: 'Source Attribution', icon: Tag },
    { name: 'District Analytics', icon: BarChart3 },
    { name: 'Alerts', icon: BellRing },
  ]

  const isAnalyticsActive = analyticsItems.some(item => item.name === activeTab)
  const isIntelligenceActive = intelligenceItems.some(item => item.name === activeTab)

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'Dashboard':
      case 'Overview': return <DashboardView />
      case 'Live Map': return <LiveMapView />
      case 'Policy Simulator': return <PolicySimulatorView />
      case 'AQI Forecast': return <ForecastView />
      case 'HCHO Hotspots': return <HotspotsView />
      case 'Fire Detection': return <FiresView />
      case 'Wind Transport': return <TransportView />
      case 'Source Attribution': return <AttributionView />
      case 'District Analytics': return <DistrictAnalyticsView />
      case 'Reports': return <ReportsView />
      case 'Alerts': return <AlertsView />
      case 'Data Explorer': return <DataExplorerView />
      default: return <DashboardView />
    }
  }

  return (
    <div className="app-workspace min-h-screen flex flex-col font-outfit select-none">
      
      {/* 1. HORIZONTAL TOP NAVIGATION BAR */}
      <header className="vayu-navbar sticky top-0 z-50 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-sm">
        
        {/* Left Brand Logo */}
        <div 
          onClick={() => setActiveTab('Dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0 group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5442ed] to-[#7b6bfa] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-all">
            <span className="text-base">🛰️</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center">
              VayuShetra
            </h1>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 text-xs font-semibold">
          
          {/* Overview */}
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'Dashboard' || activeTab === 'Overview'
                ? 'vayu-nav-pill-active'
                : 'vayu-nav-pill-inactive'
            }`}
          >
            <LayoutDashboard size={13} />
            <span>Overview</span>
          </button>

          {/* Live Map */}
          <button
            onClick={() => setActiveTab('Live Map')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'Live Map'
                ? 'vayu-nav-pill-active'
                : 'vayu-nav-pill-inactive'
            }`}
          >
            <Map size={13} />
            <span>Live Map</span>
          </button>

          {/* Analytics Dropdown */}
          <div className="relative" ref={analyticsRef}>
            <button
              onClick={() => setAnalyticsDropdownOpen(!analyticsDropdownOpen)}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
                isAnalyticsActive
                  ? 'vayu-nav-pill-active'
                  : 'vayu-nav-pill-inactive'
              }`}
            >
              <Activity size={13} />
              <span>{isAnalyticsActive ? activeTab : 'Analytics'}</span>
              <ChevronDown size={12} className={`transition-transform ${analyticsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {analyticsDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-48 rounded-2xl vayu-card shadow-2xl p-1.5 z-50 space-y-0.5 animate-fadeIn">
                {analyticsItems.map(item => {
                  const Icon = item.icon
                  const isSelected = activeTab === item.name
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name)
                        setAnalyticsDropdownOpen(false)
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                        isSelected 
                          ? 'bg-[#5442ed] text-white shadow-sm font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Intelligence Dropdown */}
          <div className="relative" ref={intelligenceRef}>
            <button
              onClick={() => setIntelligenceDropdownOpen(!intelligenceDropdownOpen)}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
                isIntelligenceActive
                  ? 'vayu-nav-pill-active'
                  : 'vayu-nav-pill-inactive'
              }`}
            >
              <Sparkles size={13} />
              <span>{isIntelligenceActive ? activeTab : 'Intelligence'}</span>
              <ChevronDown size={12} className={`transition-transform ${intelligenceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {intelligenceDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 rounded-2xl vayu-card shadow-2xl p-1.5 z-50 space-y-0.5 animate-fadeIn">
                {intelligenceItems.map(item => {
                  const Icon = item.icon
                  const isSelected = activeTab === item.name
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name)
                        setIntelligenceDropdownOpen(false)
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                        isSelected 
                          ? 'bg-[#5442ed] text-white shadow-sm font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Policy Simulator */}
          <button
            onClick={() => setActiveTab('Policy Simulator')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'Policy Simulator'
                ? 'vayu-nav-pill-active'
                : 'vayu-nav-pill-inactive'
            }`}
          >
            <Sliders size={13} />
            <span>Policy Simulator</span>
          </button>

          {/* Data Explorer */}
          <button
            onClick={() => setActiveTab('Data Explorer')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'Data Explorer'
                ? 'vayu-nav-pill-active'
                : 'vayu-nav-pill-inactive'
            }`}
          >
            <Database size={13} />
            <span>Data Explorer</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setActiveTab('Reports')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
              activeTab === 'Reports'
                ? 'vayu-nav-pill-active'
                : 'vayu-nav-pill-inactive'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Reports</span>
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          
          {/* Date Selector Pill */}
          <div className="relative flex items-center">
            <Calendar size={13} className="absolute left-3 text-slate-400 dark:text-zinc-400 pointer-events-none" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="vayu-subcard pl-8 pr-3 py-1.5 text-xs font-semibold outline-none cursor-pointer hover:border-indigo-500/40 transition-all min-w-[135px]"
            >
              {dates && dates.length > 0 ? (
                dates.map(d => (
                  <option key={d} value={d} className="bg-white dark:bg-[#090e1b] text-slate-900 dark:text-white">
                    {d}
                  </option>
                ))
              ) : (
                <option value={selectedDate} className="bg-white dark:bg-[#090e1b] text-slate-900 dark:text-white">
                  {selectedDate || "2026-09-01"}
                </option>
              )}
            </select>
          </div>

          {/* Theme Toggle Sun / Moon Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl vayu-subcard hover:border-indigo-500/40 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
          </button>

          {/* Export Report Pill Button */}
          <button
            onClick={() => setActiveTab('Reports')}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#5442ed] hover:bg-[#6554fa] text-white flex items-center space-x-1.5 shadow-md shadow-indigo-500/25 transition-all active:scale-95"
          >
            <Download size={13} />
            <span>Dossier Reports</span>
          </button>
        </div>

      </header>

      {/* 2. MAIN APPLICATION CONTENT VIEW */}
      <main className="flex-1 px-4 lg:px-8 py-5 overflow-y-auto max-w-[1800px] w-full mx-auto">
        {renderView()}
      </main>

    </div>
  )
}

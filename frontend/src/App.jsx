import React, { useEffect, useState } from 'react'
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
import SettingsView from './components/SettingsView'
import { 
  LayoutDashboard, Map, Compass, Activity, Flame, Wind, 
  Tag, BarChart3, FileSpreadsheet, BellRing, Database, Settings, HelpCircle,
  Menu, X, Sun, Moon, Info
} from 'lucide-react'

// Icon mapping for navigation links
const navItems = [
  { name: 'Dashboard', value: 'Dashboard', icon: LayoutDashboard },
  { name: 'Live Map', value: 'Live Map', icon: Map },
  { name: 'AQI Forecast', value: 'AQI Forecast', icon: Compass },
  { name: 'HCHO Hotspots', value: 'HCHO Hotspots', icon: Activity },
  { name: 'Fire Detection', value: 'Fire Detection', icon: Flame },
  { name: 'Wind Transport', value: 'Wind Transport', icon: Wind },
  { name: 'Source Attribution', value: 'Source Attribution', icon: Tag },
  { name: 'District Analytics', value: 'District Analytics', icon: BarChart3 },
  { name: 'Reports', value: 'Reports', icon: FileSpreadsheet },
  { name: 'Alerts', value: 'Alerts', icon: BellRing },
  { name: 'Data Explorer', value: 'Data Explorer', icon: Database },
  { name: 'Settings', value: 'Settings', icon: Settings },
]

export default function App() {
  const { 
    activeTab, 
    setActiveTab, 
    selectedDate, 
    setSelectedDate, 
    dates, 
    fetchMetadata,
    theme,
    setTheme
  } = useStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  useEffect(() => {
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }, [theme])

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardView />
      case 'Live Map': return <LiveMapView />
      case 'AQI Forecast': return <ForecastView />
      case 'HCHO Hotspots': return <HotspotsView />
      case 'Fire Detection': return <FiresView />
      case 'Wind Transport': return <TransportView />
      case 'Source Attribution': return <AttributionView />
      case 'District Analytics': return <DistrictAnalyticsView />
      case 'Reports': return <ReportsView />
      case 'Alerts': return <AlertsView />
      case 'Data Explorer': return <DataExplorerView />
      case 'Settings': return <SettingsView />
      default: return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)] font-outfit select-none transition-colors duration-300">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className={`bg-[var(--sidebar-bg)] border-r border-[var(--panel-border)] flex flex-col justify-between p-4 flex-shrink-0 relative transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-18'}`}>
        <div className="space-y-6">
          {/* Header Row: Logo & Modern Inside-Sidebar Toggle Button + Theme Toggle */}
          <div className="flex items-center justify-between px-1 overflow-hidden">
            <div className="flex items-center space-x-2.5 overflow-hidden whitespace-nowrap group cursor-pointer">
              <span className="text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110">🛰️</span>
              {sidebarOpen && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-sm font-extrabold text-white tracking-tight group-hover:text-[#4b6bf5] transition-colors">VayuShetra</h1>
                  <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase mt-0.5 block">Satellite Intelligence</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1.5 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors focus:outline-none"
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors focus:outline-none"
                title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                <Menu size={15} />
              </button>
            </div>
          </div>

          {/* Links list */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 relative">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  title={!sidebarOpen ? item.name : undefined}
                  className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-wide relative transition-all duration-200 transform ${
                    sidebarOpen ? 'space-x-3 px-3 py-2.5 hover:translate-x-1' : 'justify-center p-2.5'
                  } ${
                    isActive 
                      ? 'bg-[#4b6bf5]/15 text-[#7c93fe] font-bold border border-[#4b6bf5]/35 shadow-[0_0_15px_rgba(75,107,245,0.18)]' 
                      : 'text-slate-400 hover:bg-slate-800/20 hover:text-slate-100'
                  }`}
                >
                  {/* Left indicator bar */}
                  {isActive && sidebarOpen && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#4b6bf5]"></div>
                  )}
                  <Icon size={16} className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  {sidebarOpen && <span className="truncate transition-opacity duration-300">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Diagnostics Overlay Popup */}
        {showDiagnostic && sidebarOpen && (
          <div className="absolute bottom-18 left-4 right-4 glass-panel p-3.5 rounded-xl z-50 text-[10px] text-slate-350 space-y-1.5 shadow-2xl border-emerald-500/20 bg-slate-950/95 backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                <Info size={11} className="mr-1" /> System Diagnostics
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDiagnostic(false); }} 
                className="text-slate-500 hover:text-white text-xs font-bold focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-1 font-medium">
              <div className="flex justify-between"><span>XGBoost Models:</span> <span className="text-white">6 operational</span></div>
              <div className="flex justify-between"><span>SHAP TreeExplainers:</span> <span className="text-white">Active</span></div>
              <div className="flex justify-between"><span>Meteorology Feed:</span> <span className="text-white">ERA5 Realtime</span></div>
              <div className="flex justify-between"><span>Satellite Track:</span> <span className="text-white">Sentinel-5P / VIIRS</span></div>
            </div>
          </div>
        )}

        {/* Bottom Card: Data Updated (Interactive diagnostic toggler) */}
        <div 
          onClick={() => sidebarOpen && setShowDiagnostic(!showDiagnostic)}
          className={`border rounded-lg text-[10px] space-y-1 text-slate-400 transition-all duration-300 select-none bg-slate-900/40 border-slate-800/80 ${
            sidebarOpen 
              ? 'p-3 cursor-pointer hover:bg-slate-800/25 hover:border-slate-700/60' 
              : 'p-1.5 flex flex-col items-center'
          }`}
          title={sidebarOpen ? "Click to view diagnostics" : "Grid Engine Active"}
        >
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="w-2 h-2 bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676] flex-shrink-0 animate-pulse"></div>
            {sidebarOpen && <span className="font-bold">Grid Engine Live</span>}
          </div>
          {sidebarOpen && (
            <>
              <div className="font-bold text-slate-200">Atmospheric Data Synced</div>
              <div className="text-[9px] text-slate-500 flex justify-between items-center">
                <span>Updated 2 min ago</span>
                <span className="text-sky-400 font-bold hover:underline">Info →</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 2. MAIN BODY PANEL */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Global Header Row (Only renders for pages where global date picker is suitable, e.g. Dashboard) */}
        {activeTab === 'Dashboard' && (
          <header className="px-6 pt-5 pb-2 flex justify-between items-start flex-shrink-0 bg-transparent">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">VayuShetra</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>India Atmospheric Monitoring • Updated 2 min ago</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Date selection selectbox */}
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#0d1121] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#4b6bf5] cursor-pointer shadow-sm font-semibold"
              >
                {dates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button 
                onClick={() => alert('NCAP Compliance report prepared for export!')}
                className="bg-[#4b6bf5] hover:bg-[#3b56cf] text-white text-xs font-semibold px-4.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Export Report 📥
              </button>
            </div>
          </header>
        )}

        {/* Dynamic page view rendering */}
        <section className="flex-1 overflow-y-auto px-6 py-4">
          {renderView()}
        </section>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 flex-shrink-0 bg-[#080b16] shadow-sm">
          <div className="flex space-x-4">
            <span><b>Data Sources:</b></span>
            <span>📡 Sentinel-5P</span>
            <span>📡 MODIS</span>
            <span>📡 VIIRS</span>
            <span>📡 ERA5</span>
            <span>📡 CPCB</span>
            <span>☁️ Google Earth Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span>VayuShetra Platform v1.0.0</span>
            <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full"></span>
            <span>Online</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

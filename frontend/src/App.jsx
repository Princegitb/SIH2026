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
  Menu, X
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
    fetchMetadata 
  } = useStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchMetadata()
  }, [])

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
    <div className="flex h-screen overflow-hidden bg-[#f4f6fa] text-slate-800 font-outfit select-none">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className={`bg-gradient-to-b from-[#4b6bf5] to-[#253994] border-r border-transparent flex flex-col justify-between p-4 flex-shrink-0 relative transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-18'}`}>
        <div className="space-y-6">
          {/* Header Row: Logo & Modern Inside-Sidebar Toggle Button */}
          <div className="flex items-center justify-between px-1 overflow-hidden">
            <div className="flex items-center space-x-2.5 overflow-hidden whitespace-nowrap">
              <span className="text-2xl flex-shrink-0">🛰️</span>
              {sidebarOpen && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-sm font-extrabold text-white leading-none">VayuDrishti</h1>
                  <span className="text-[8px] text-[#c2d0ff] font-semibold tracking-wider uppercase mt-0.5 block">Smart Intelligence</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#c2d0ff] hover:text-white transition-colors focus:outline-none flex-shrink-0"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu size={16} />
            </button>
          </div>

          {/* Links list */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  title={!sidebarOpen ? item.name : undefined}
                  className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    sidebarOpen ? 'space-x-3 px-3 py-2' : 'justify-center p-2.5'
                  } ${
                    isActive 
                      ? 'bg-white text-[#3b56cf] font-bold shadow-md' 
                      : 'text-[#c2d0ff] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate transition-opacity duration-300">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card: Data Updated */}
        <div className={`bg-white/10 border border-white/20 rounded-lg text-[10px] space-y-1 text-[#c2d0ff] transition-all duration-300 ${sidebarOpen ? 'p-3' : 'p-1.5 flex flex-col items-center'}`}>
          <div className="flex items-center space-x-2 text-[#c2d0ff]">
            <div className="w-2 h-2 bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676] flex-shrink-0"></div>
            {sidebarOpen && <span>Online</span>}
          </div>
          {sidebarOpen && (
            <>
              <div className="font-extrabold text-white">All systems operational</div>
              <div className="text-[9px] text-[#c2d0ff]/80">2 min ago</div>
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
              <h2 className="text-xl font-bold text-slate-800 leading-none">Good Afternoon, Team <span className="text-[#4b6bf5]">VayuDrishti!</span> 👋</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Real-time Air Quality Intelligence Powered by Satellite & AI</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Date selection selectbox */}
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#4b6bf5] cursor-pointer shadow-sm"
              >
                {dates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button 
                onClick={() => alert('NCAP Compliance report prepared for export!')}
                className="bg-[#4b6bf5] hover:bg-[#3b56cf] text-white text-xs font-semibold px-4.5 py-1.5 rounded transition-colors shadow-sm"
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
        <footer className="px-6 py-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 flex-shrink-0 bg-white shadow-sm">
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
            <span>VayuDrishti Platform v1.0.0</span>
            <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full"></span>
            <span>Online</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

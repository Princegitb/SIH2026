import React, { useState, useEffect } from 'react'
import { ArrowRight, Satellite, Shield, Cpu, Database, Bell, BarChart3, Wind, Flame, Compass } from 'lucide-react'

// Simple SVG mini sparkline generator for floating widgets
const MiniSparkline = ({ values, color }) => {
  const width = 60
  const height = 20
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

export default function LandingPage({ onEnterDashboard }) {
  const [activeCard, setActiveCard] = useState(null)
  const [pulseCount, setPulseCount] = useState(0)

  // Subtle dynamic updates on floating widgets for interactivity
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="h-screen overflow-y-auto font-outfit overflow-x-hidden relative flex flex-col justify-between selection:bg-[#4b6bf5]/30"
      style={{ backgroundColor: '#03050c', color: '#f1f5f9' }}
    >

      {/* Background grids and glowing orbits */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(75,107,245,0.18),rgba(0,0,0,0))] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* 1. HEADER ROW */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-3 group">
          <span className="text-3xl transition-transform duration-500 group-hover:rotate-[360deg]">🛰️</span>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center">
              VayuShetra
            </h1>
            <span className="text-[9px] text-[#4b6bf5] font-bold tracking-widest uppercase block mt-0.5">India's Atmospheric Intelligence</span>
          </div>
        </div>

        <button
          onClick={onEnterDashboard}
          className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-lg text-slate-200 hover:text-white"
        >
          <span>Explore Dashboard</span>
          <ArrowRight size={13} />
        </button>
      </header>

      {/* 2. HERO GRID SECTION */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-grow z-10 relative">

        {/* Left Side: Pitch and Call to Actions (Span 6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Real-time Air Intelligence Powered by Satellite & CPCB</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Breathe Better. <br />
            <span className="bg-gradient-to-r from-[#4b6bf5] to-[#7c93fe] bg-clip-text text-transparent">Live Smarter.</span>
          </h2>

          {/* Description Paragraph */}
          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed font-medium">
            VayuShetra delivers real-time, hyperlocal air quality insights, fire & smoke detection, and wind intelligence using satellite data and AI models — for a cleaner, safer tomorrow.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-3">
            <button
              onClick={onEnterDashboard}
              className="flex items-center justify-center space-x-2.5 bg-[#4b6bf5] hover:bg-[#3b56cf] hover:shadow-[0_0_25px_rgba(75,107,245,0.4)] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-350 transform active:scale-98"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Side: Futuristic Animated Space Orbit Scan Visual (Span 6) */}
        <div className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] lg:min-h-[500px]">

          {/* The Orbiting/Radar Background Ring */}
          <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] border border-slate-800/40 rounded-full flex items-center justify-center z-0">
            <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] border border-slate-800/20 rounded-full flex items-center justify-center">
              <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] border border-sky-500/5 rounded-full"></div>
            </div>
          </div>

          {/* Glowing Green Scanning Arc Orbit path */}
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-t-emerald-500/20 border-r-emerald-500/25 animate-spin duration-[20s] ease-linear pointer-events-none z-0"></div>
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-b-sky-500/20 border-l-sky-500/25 animate-spin duration-[12s] ease-linear pointer-events-none z-0"></div>

          {/* Central Satellite Scanned Earth Sphere */}
          <div className="absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] bg-slate-900 border border-slate-850 rounded-full overflow-hidden shadow-[0_0_80px_rgba(75,107,245,0.15)] flex items-center justify-center z-10 transition-transform duration-500 hover:scale-105 group">
            {/* Holographic Earth mesh overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-[#4b6bf5]/25 mix-blend-screen pointer-events-none"></div>
            {/* Grid Line Scans */}
            <div className="absolute w-full h-[2px] bg-sky-500/35 top-0 animate-[scan_3s_infinite_linear]"></div>
            <span className="text-7xl select-none filter drop-shadow-[0_0_20px_rgba(75,107,245,0.4)] opacity-85">🌏</span>
          </div>

          {/* Orbiting Scanning Satellite Model */}
          <div className="absolute w-full h-full animate-[spin_32s_linear_infinite] pointer-events-none z-20">
            <div className="absolute top-[8%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 transform rotate-[-45deg] pointer-events-auto">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-lg hover:border-sky-500/40 hover:text-sky-300 transition-colors">
                <Satellite size={16} className="animate-pulse" />
              </div>
              <div className="w-[1.5px] h-32 bg-gradient-to-b from-sky-400/40 to-transparent animate-[laser_2s_infinite]"></div>
            </div>
          </div>

          {/* Floating Widget Card 1: AQI Status (Top Left) */}
          <div
            onMouseEnter={() => setActiveCard(1)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute top-[8%] left-[2%] glass-panel rounded-2xl p-4 w-[160px] text-left transition-all duration-300 z-30 cursor-pointer ${activeCard === 1 ? 'scale-105 border-[#4b6bf5]/50 shadow-[0_0_20px_rgba(75,107,245,0.2)]' : 'hover:translate-y-[-2px]'
              }`}
          >
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">AQI (Delhi NCR)</div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-[#84cc16]">76</span>
              <span className="text-[9px] font-bold text-[#84cc16] uppercase">Satisfactory</span>
            </div>
            <div className="flex justify-between items-center mt-2.5 pt-1 border-t border-slate-850">
              <span className="text-[7px] text-slate-500">Updated 2m ago</span>
              <MiniSparkline values={[82, 79, 81, 75, 77, 76]} color="#84cc16" />
            </div>
          </div>

          {/* Floating Widget Card 2: Wind Speed (Bottom Center) */}
          <div
            onMouseEnter={() => setActiveCard(2)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute bottom-[10%] left-[25%] -translate-x-1/2 glass-panel rounded-2xl p-3.5 w-[140px] text-left transition-all duration-300 z-30 cursor-pointer ${activeCard === 2 ? 'scale-105 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'hover:translate-y-[-2px]'
              }`}
          >
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Wind size={10} className="mr-1 text-sky-400" /> Wind Velocity
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              9 <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[8px] text-[#10b981] font-bold mt-1 uppercase">Moderate Vector</div>
          </div>

          {/* Floating Widget Card 3: Active Fires (Middle Right) */}
          <div
            onMouseEnter={() => setActiveCard(3)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute top-[48%] right-[2%] glass-panel rounded-2xl p-4 w-[160px] text-left transition-all duration-300 z-30 cursor-pointer ${activeCard === 3 ? 'scale-105 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'hover:translate-y-[-2px]'
              }`}
          >
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Flame size={10} className="mr-1 text-orange-500" /> Active Fires
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-orange-500">3</span>
              <span className="text-[8px] font-bold text-orange-400 uppercase">Detected</span>
            </div>
            <div className="flex justify-between items-center mt-2.5 pt-1 border-t border-slate-850">
              <span className="text-[7px] text-slate-500">Last 24 hrs</span>
              <MiniSparkline values={[1, 3, 2, 4, 3, 3]} color="#f97316" />
            </div>
          </div>

        </div>

      </main>

      {/* 3. VALUE PROPOSITIONS FEATURE ROW */}
      <section className="max-w-7xl mx-auto w-full px-6 py-6 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* Card 1: Satellite-Powered */}
          <div className="bg-[#080b16]/60 border border-slate-850/60 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Satellite size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Satellite-Powered</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">Real-time data from Sentinel, MODIS, VIIRS & more.</p>
            </div>
          </div>

          {/* Card 2: AI Intelligence */}
          <div className="bg-[#080b16]/60 border border-slate-850/60 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Cpu size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">AI Intelligence</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">Advanced models detect pollution trends, fires & air risks.</p>
            </div>
          </div>

          {/* Card 3: Hyperlocal Insights */}
          <div className="bg-[#080b16]/60 border border-slate-850/60 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Compass size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Hyperlocal Insights</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">District-level AQI, hotspot mapping & forecasts.</p>
            </div>
          </div>

          {/* Card 4: Actionable Alerts */}
          <div className="bg-[#080b16]/60 border border-slate-850/60 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Bell size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Actionable Alerts</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">Timely alerts on pollution, fires & hazardous levels.</p>
            </div>
          </div>

          {/* Card 5: Data You Can Trust */}
          <div className="bg-[#080b16]/60 border border-slate-850/60 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-[#4b6bf5]/10 flex items-center justify-center text-[#7c93fe]">
              <Database size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Data You Can Trust</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">Backed by global datasets & government standards.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. BOTTOM CTAs BANNER */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 z-10 relative">
        <div className="bg-gradient-to-r from-[#080b16]/90 to-[#0e1326]/90 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="text-left space-y-1.5">
            <div className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span> Together for Cleaner Air
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Better Data. Better Decisions. Better Tomorrow.</h3>
            <p className="text-[10px] text-slate-400">Join us in building a healthier, sustainable future through intelligent air monitoring.</p>
          </div>
          <button
            onClick={onEnterDashboard}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-all duration-300 shadow-md whitespace-nowrap"
          >
            <span>Get Started</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </footer>

      {/* Embedded CSS rules for orbit scanning effects */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.1; }
          50% { opacity: 0.8; }
          100% { transform: translateY(240px); opacity: 0.1; }
        }
        @keyframes laser {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

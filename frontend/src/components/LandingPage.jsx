import React, { useState, useEffect, useRef } from 'react'
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

  // Refs for interactive components
  const heroRef = useRef(null)
  const windCardRef = useRef(null)
  const fireCardRef = useRef(null)
  const earthRef = useRef(null)
  const ringsRef = useRef(null)

  // Wind evasion physics state
  const windPos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 })
  const [windTrails, setWindTrails] = useState(false)

  // Fire awakening state & rising embers
  const [fireActive, setFireActive] = useState(false)
  const [embers, setEmbers] = useState([])

  // Mouse coords inside hero container
  const mouseCoords = useRef({ x: -9999, y: -9999, isInside: false, nx: 0, ny: 0 })

  // Subtle dynamic updates on floating widgets for interactivity
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Ember generation when fire is active
  useEffect(() => {
    if (!fireActive) {
      setEmbers([])
      return
    }

    const emberInterval = setInterval(() => {
      const id = Date.now() + Math.random()
      const newEmber = {
        id,
        left: Math.random() * 80 + 10,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 1.2 + 0.8,
        drift: (Math.random() - 0.5) * 30
      }
      setEmbers(prev => [...prev.slice(-12), newEmber])
    }, 120)

    return () => clearInterval(emberInterval)
  }, [fireActive])

  // Continuous 60fps RAF loop for Wind physics & Earth 3D Parallax
  useEffect(() => {
    // Check for reduced motion and fine pointer (desktop cursor)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    if (prefersReducedMotion || !isFinePointer) return

    let animationFrameId
    let time = 0

    const updatePhysics = () => {
      time += 0.03

      // 1. EARTH & RINGS 3D PARALLAX
      if (earthRef.current && mouseCoords.current.isInside) {
        const tiltX = -mouseCoords.current.ny * 10
        const tiltY = mouseCoords.current.nx * 12
        earthRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(12px)`
      } else if (earthRef.current) {
        earthRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`
      }

      if (ringsRef.current && mouseCoords.current.isInside) {
        const ringX = -mouseCoords.current.nx * 7
        const ringY = -mouseCoords.current.ny * 7
        ringsRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`
      } else if (ringsRef.current) {
        ringsRef.current.style.transform = `translate(0px, 0px)`
      }

      // 2. WIND VELOCITY CARD — "THE WIND ESCAPES"
      if (windCardRef.current && heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect()
        const windRect = windCardRef.current.getBoundingClientRect()

        const windCenterX = windRect.left + windRect.width / 2 - heroRect.left
        const windCenterY = windRect.top + windRect.height / 2 - heroRect.top

        const mouseX = mouseCoords.current.x
        const mouseY = mouseCoords.current.y

        const dx = windCenterX - mouseX
        const dy = windCenterY - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        const evasionRadius = 140

        if (mouseCoords.current.isInside && dist < evasionRadius && dist > 0) {
          // Stronger repulsion the closer cursor gets
          const intensity = Math.pow((evasionRadius - dist) / evasionRadius, 1.2) * 55
          const angle = Math.atan2(dy, dx)
          
          // Evasion vector with subtle tangential breeze curl
          const curl = Math.sin(time * 3) * 8
          windPos.current.targetX = Math.max(-45, Math.min(45, Math.cos(angle) * intensity + curl))
          windPos.current.targetY = Math.max(-35, Math.min(35, Math.sin(angle) * intensity - 5))
          setWindTrails(true)
        } else {
          // Resting floating breath motion when cursor is far
          windPos.current.targetX = Math.sin(time * 1.5) * 3
          windPos.current.targetY = Math.cos(time * 2) * 4
          if (windPos.current.speed < 0.2) {
            setWindTrails(false)
          }
        }

        // Spring-like interpolation (lerp with damping)
        const prevX = windPos.current.x
        const prevY = windPos.current.y
        windPos.current.x += (windPos.current.targetX - windPos.current.x) * 0.12
        windPos.current.y += (windPos.current.targetY - windPos.current.y) * 0.12

        const stepSpeed = Math.sqrt(
          Math.pow(windPos.current.x - prevX, 2) + Math.pow(windPos.current.y - prevY, 2)
        )
        windPos.current.speed = stepSpeed

        const tiltDeg = (windPos.current.x * 0.25).toFixed(2)
        windCardRef.current.style.transform = `translate3d(${windPos.current.x.toFixed(2)}px, ${windPos.current.y.toFixed(2)}px, 20px) rotate(${tiltDeg}deg)`
      }

      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const nx = (x / rect.width) * 2 - 1
    const ny = (y / rect.height) * 2 - 1

    mouseCoords.current = { x, y, isInside: true, nx, ny }

    // Proximity check for Fire Card Awakening
    if (fireCardRef.current) {
      const fireRect = fireCardRef.current.getBoundingClientRect()
      const fireCenterX = fireRect.left + fireRect.width / 2 - rect.left
      const fireCenterY = fireRect.top + fireRect.height / 2 - rect.top
      const fdx = x - fireCenterX
      const fdy = y - fireCenterY
      const fdist = Math.sqrt(fdx * fdx + fdy * fdy)
      if (fdist < 110) {
        setFireActive(true)
      } else if (activeCard !== 3) {
        setFireActive(false)
      }
    }
  }

  const handleHeroMouseLeave = () => {
    mouseCoords.current = { x: -9999, y: -9999, isInside: false, nx: 0, ny: 0 }
    if (activeCard !== 3) setFireActive(false)
  }

  return (
    <div
      className="h-screen overflow-y-auto font-outfit overflow-x-hidden relative flex flex-col justify-between selection:bg-[#4b6bf5]/30"
      style={{ backgroundColor: '#03050c', color: '#f1f5f9' }}
    >

      {/* Background Atmospheric Grids, Aurora Streams & Glowing Orbits */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(75,107,245,0.22),rgba(0,0,0,0))] pointer-events-none z-0"></div>
      
      {/* Stratospheric Aurora Wave Stream (Top-Left to Center) */}
      <div className="absolute top-[-5%] left-[5%] w-[800px] h-[350px] bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none transform -rotate-12 animate-pulse z-0"></div>
      
      {/* Tropospheric Ozone Glow (Bottom Right) */}
      <div className="absolute bottom-[5%] right-[-5%] w-[700px] h-[450px] bg-gradient-to-l from-indigo-500/12 via-sky-500/10 to-transparent rounded-full blur-[130px] pointer-events-none z-0"></div>
      
      {/* Subtle Atmospheric Isobar Pressure Contours in Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0"></div>

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
        <div 
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] lg:min-h-[500px] select-none perspective-[1000px]"
        >

          {/* Concentric Background Rings with Parallax Container */}
          <div 
            ref={ringsRef}
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none z-0"
          >
            <div className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] border border-slate-800/40 rounded-full flex items-center justify-center">
              <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] border border-slate-800/20 rounded-full flex items-center justify-center">
                <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] border border-sky-500/5 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Glowing Green & Blue Scanning Arc Orbit paths */}
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-t-emerald-500/20 border-r-emerald-500/25 animate-spin duration-[20s] ease-linear pointer-events-none z-0"></div>
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-b-sky-500/20 border-l-sky-500/25 animate-spin duration-[12s] ease-linear pointer-events-none z-0"></div>

          {/* Central Satellite Scanned Earth Sphere with 3D Parallax Tilt & Fiery Hotspot Corona */}
          <div 
            ref={earthRef}
            className={`absolute w-[210px] h-[210px] sm:w-[270px] sm:h-[270px] rounded-full flex items-center justify-center z-10 transition-all duration-500 ease-out group cursor-grab active:cursor-grabbing ${
              fireActive 
                ? 'shadow-[0_0_90px_rgba(249,115,22,0.7),0_0_150px_rgba(220,38,38,0.5)]' 
                : 'shadow-[0_0_90px_rgba(56,189,248,0.4),0_0_140px_rgba(75,107,245,0.3)]'
            }`}
          >
            {/* The 3D Earth Globe Body */}
            <div className="w-full h-full rounded-full relative overflow-hidden bg-[#060e20] border-2 border-sky-400/50 shadow-inner">
              {/* Deep Ocean Gradient Base */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e40af_0%,#0f172a_65%,#020617_100%)]"></div>

              {/* Atmospheric Glow Aura inside Globe */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none"></div>

              {/* Realistic India Centered Vector Map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <radialGradient id="earthGlow" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
                    </radialGradient>

                    <linearGradient id="indiaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#065f46" />
                      <stop offset="40%" stopColor="#0f766e" />
                      <stop offset="80%" stopColor="#1e3a8a" />
                    </linearGradient>

                    <linearGradient id="indiaStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>

                  {/* Neighboring Eurasia Background Landmass */}
                  <path 
                    d="M 30,50 Q 60,35 100,30 Q 150,25 180,45 Q 190,70 170,95 Q 160,85 140,85 Q 130,70 100,65 Q 60,70 40,80 Z" 
                    fill="#111c33" 
                    stroke="#1e293b" 
                    strokeWidth="0.8"
                    opacity="0.7"
                  />
                  {/* Arabian Peninsula & Middle East */}
                  <path 
                    d="M 25,90 Q 45,85 55,95 Q 50,115 35,120 Q 20,110 25,90 Z" 
                    fill="#111c33" 
                    stroke="#1e293b" 
                    strokeWidth="0.8"
                    opacity="0.6"
                  />

                  {/* DETAILED ACCURATE INDIA OUTLINE MAP */}
                  {/* Kashmir -> Punjab/Rajasthan -> Gujarat (Kutch/Kathiawar) -> South (Kanyakumari) -> East Coast -> Northeast (Assam/Arunachal) -> Himalayas */}
                  <path 
                    d="
                      M 100,42 
                      C 103,34 107,34 110,38 
                      C 114,44 110,50 114,56 
                      C 118,62 116,66 112,70 
                      C 106,70 100,68 96,72 
                      C 90,76 86,82 80,90 
                      C 74,96 72,104 80,108 
                      C 76,114 84,116 86,112 
                      C 88,122 92,136 96,150 
                      C 100,162 104,170 106,170 
                      C 108,170 112,160 116,148 
                      C 122,134 128,120 134,112 
                      C 138,106 142,102 144,96 
                      C 148,94 154,88 160,86 
                      C 166,86 170,92 166,98 
                      C 158,102 150,102 144,98 
                      C 138,94 134,88 126,82 
                      C 120,76 114,64 108,58 
                      Z
                    " 
                    fill="url(#indiaFill)" 
                    stroke="url(#indiaStroke)" 
                    strokeWidth="1.8"
                    className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                  />

                  {/* State Grid Accents (Northern Grid, Central Corridor, Coastal Arcs) */}
                  <path d="M 96,72 Q 106,74 114,70" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.6" />
                  <path d="M 80,108 Q 106,110 134,112" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.4" />
                  <path d="M 88,130 Q 106,136 122,134" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.4" />

                  {/* Sri Lanka */}
                  <ellipse cx="114" cy="176" rx="3.5" ry="5.5" fill="#0f766e" stroke="#38bdf8" strokeWidth="0.8" opacity="0.85" />

                  {/* Delhi-NCR Air Monitoring Pulsing Beacon */}
                  <g className="cursor-pointer">
                    <circle cx="102" cy="74" r="5" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping" />
                    <circle cx="102" cy="74" r="2.5" fill="#34d399" className="shadow-[0_0_8px_#10b981]" />
                  </g>

                  {/* Atmospheric Longitude & Latitude Curved Grid Overlay */}
                  <ellipse cx="100" cy="100" rx="98" ry="98" fill="url(#earthGlow)" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <ellipse cx="100" cy="100" rx="65" ry="98" fill="none" stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.3" />
                  <ellipse cx="100" cy="100" rx="30" ry="98" fill="none" stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="2" y1="100" x2="198" y2="100" stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="14" y1="65" x2="186" y2="65" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.25" />
                  <line x1="14" y1="135" x2="186" y2="135" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.25" />

                  {/* Atmospheric Cloud Swirls */}
                  <path 
                    d="M 25,60 Q 65,45 115,58 T 175,70" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                    opacity="0.3" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M 55,140 Q 95,120 145,135" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="2" 
                    opacity="0.25" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Atmospheric Rim Glow */}
              <div className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${
                fireActive 
                  ? 'bg-[radial-gradient(circle_at_30%_30%,rgba(254,240,138,0.3),rgba(249,115,22,0.45)_50%,rgba(220,38,38,0.35)_80%)]' 
                  : 'bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.35),rgba(56,189,248,0.25)_40%,transparent_75%)]'
              }`}></div>

              {/* Horizontal Satellite Radar Scan Line */}
              <div className={`absolute w-full h-[2px] top-0 animate-[scan_3s_infinite_linear] transition-colors duration-500 ${
                fireActive ? 'bg-orange-400 shadow-[0_0_12px_#f97316]' : 'bg-sky-400 shadow-[0_0_10px_#38bdf8]'
              }`}></div>

              {/* Active Satellite-Detected Thermal Hotspots on Northern India */}
              {fireActive && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Hotspot 1: Punjab / Stubble Core */}
                  <div className="absolute top-[36%] left-[49%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-red-500/50 animate-ping absolute"></span>
                    <span className="w-4 h-4 rounded-full bg-orange-500/80 animate-pulse absolute"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#ffedd5] relative z-10"></span>
                  </div>

                  {/* Hotspot 2: Delhi-NCR Basin Receptor */}
                  <div className="absolute top-[40%] left-[53%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-orange-500/50 animate-ping absolute" style={{ animationDelay: '0.4s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#f97316] relative z-10 animate-bounce"></span>
                  </div>

                  {/* Hotspot 3: Upwind Farm Fire Cluster */}
                  <div className="absolute top-[32%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full bg-amber-500/40 animate-ping absolute" style={{ animationDelay: '0.8s' }}></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_#ea580c] relative z-10"></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Fire Orbit Corona Ring encircling the Earth when Fire Awakens */}
          {fireActive && (
            <div className="absolute w-[290px] h-[290px] sm:w-[360px] sm:h-[360px] rounded-full border border-orange-500/40 pointer-events-none z-10 animate-[spin_10s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_20px_#ea580c] animate-pulse"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_#facc15] animate-ping"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#dc2626] animate-pulse"></div>
            </div>
          )}

          {/* Orbiting Scanning Satellite Model */}
          <div className="absolute w-full h-full animate-[spin_32s_linear_infinite] pointer-events-none z-20">
            <div className="absolute top-[8%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 transform rotate-[-45deg] pointer-events-auto">
              <div className={`w-9 h-9 rounded-xl bg-slate-900 border flex items-center justify-center shadow-lg transition-all duration-300 ${
                fireActive 
                  ? 'border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                  : 'border-slate-800 text-sky-400 hover:border-sky-500/40 hover:text-sky-300'
              }`}>
                <Satellite size={16} className="animate-pulse" />
              </div>
              <div className={`w-[1.5px] h-32 animate-[laser_2s_infinite] transition-all duration-300 ${
                fireActive 
                  ? 'bg-gradient-to-b from-orange-500/80 via-red-500/50 to-transparent' 
                  : 'bg-gradient-to-b from-sky-400/40 to-transparent'
              }`}></div>
            </div>
          </div>

          {/* Floating Widget Card 1: AQI Status (Top Left) */}
          <div
            onMouseEnter={() => setActiveCard(1)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute top-[8%] left-[2%] glass-panel rounded-2xl p-4 w-[160px] text-left transition-all duration-300 z-30 cursor-pointer ${
              activeCard === 1 ? 'scale-105 border-[#4b6bf5]/50 shadow-[0_0_20px_rgba(75,107,245,0.2)]' : 'hover:translate-y-[-2px]'
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

          {/* Floating Widget Card 2: Wind Velocity — "The Wind Escapes" (Bottom Center) */}
          <div
            ref={windCardRef}
            onMouseEnter={() => setActiveCard(2)}
            onMouseLeave={() => setActiveCard(null)}
            className={`absolute bottom-[10%] left-[25%] -translate-x-1/2 glass-panel rounded-2xl p-3.5 w-[140px] text-left z-30 cursor-pointer will-change-transform ${
              activeCard === 2 
                ? 'border-sky-400/60 shadow-[0_0_25px_rgba(56,189,248,0.3)]' 
                : 'border-slate-800/80 shadow-lg'
            }`}
            style={{ transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
          >
            {/* Animated Air Streams / Wind Trails flowing behind the escaping card */}
            {windTrails && (
              <div className="absolute -top-3 -left-5 -right-5 pointer-events-none opacity-60">
                <svg viewBox="0 0 160 30" className="w-full h-7 overflow-visible">
                  <path 
                    d="M 5,12 Q 35,4 70,14 T 145,8" 
                    fill="none" 
                    stroke="rgba(56,189,248,0.5)" 
                    strokeWidth="1.5" 
                    strokeDasharray="12 6"
                    className="animate-[windStream_1.2s_linear_infinite]"
                  />
                  <path 
                    d="M 15,22 Q 45,16 90,24 T 155,18" 
                    fill="none" 
                    stroke="rgba(147,197,253,0.4)" 
                    strokeWidth="1" 
                    strokeDasharray="8 4"
                    className="animate-[windStream_0.9s_linear_infinite]"
                  />
                </svg>
              </div>
            )}

            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center">
                <Wind size={11} className={`mr-1 text-sky-400 ${windTrails ? 'animate-pulse' : ''}`} /> Wind Velocity
              </span>
              {windTrails && (
                <span className="text-[7px] text-sky-400 font-mono font-bold animate-pulse">GUST</span>
              )}
            </div>
            <div className="text-xl font-extrabold text-white mt-1 flex items-baseline">
              <span>9</span> 
              <span className="text-[10px] font-normal text-slate-400 ml-1">km/h</span>
            </div>
            <div className="text-[8px] text-[#10b981] font-bold mt-1 uppercase flex items-center justify-between">
              <span>Moderate Vector</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            </div>
          </div>

          {/* Floating Widget Card 3: Active Fires — "Fire Awakens" (Positioned on Upper-Right Orbital Ring) */}
          <div
            ref={fireCardRef}
            onMouseEnter={() => {
              setActiveCard(3)
              setFireActive(true)
            }}
            onMouseLeave={() => {
              setActiveCard(null)
              setFireActive(false)
            }}
            className={`absolute top-[10%] right-[3%] sm:right-[5%] glass-panel rounded-2xl p-4 w-[160px] text-left transition-all duration-300 z-30 cursor-pointer overflow-hidden ${
              fireActive 
                ? 'scale-105 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.55),inset_0_0_25px_rgba(239,68,68,0.3)] bg-gradient-to-br from-orange-950/40 via-slate-900/90 to-red-950/30' 
                : 'hover:translate-y-[-2px] border-slate-800'
            }`}
          >
            {/* Ambient Fire Aura Glow in background */}
            {fireActive && (
              <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gradient-to-t from-orange-500/40 via-red-500/30 to-transparent rounded-full blur-xl pointer-events-none animate-pulse"></div>
            )}

            {/* Rising Animated Ember Sparks Particle Layer */}
            {fireActive && embers.map(ember => (
              <div
                key={ember.id}
                className="absolute rounded-full pointer-events-none animate-[emberRise_1.2s_ease-out_forwards]"
                style={{
                  left: `${ember.left}%`,
                  bottom: '10px',
                  width: `${ember.size}px`,
                  height: `${ember.size}px`,
                  backgroundColor: Math.random() > 0.4 ? '#fbbf24' : '#f97316',
                  boxShadow: '0 0 8px #ea580c, 0 0 12px #facc15',
                  '--ember-drift': `${ember.drift}px`,
                  animationDuration: `${ember.duration}s`
                }}
              />
            ))}

            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between relative z-10">
              <span className="flex items-center">
                <Flame 
                  size={13} 
                  className={`mr-1 transition-all duration-300 ${
                    fireActive ? 'text-amber-300 scale-125 drop-shadow-[0_0_12px_#ea580c] animate-bounce' : 'text-orange-500'
                  }`} 
                /> 
                Active Fires
              </span>
              {fireActive && (
                <span className="text-[7px] bg-orange-500/30 text-amber-300 border border-orange-400/50 px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                  IGNITED
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-1.5 mt-1 relative z-10">
              <span className={`text-2xl font-black transition-colors duration-300 ${fireActive ? 'text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.8)]' : 'text-orange-500'}`}>
                3
              </span>
              <span className={`text-[8px] font-extrabold uppercase ${fireActive ? 'text-orange-300' : 'text-orange-400'}`}>Detected</span>
            </div>

            <div className="flex justify-between items-center mt-2.5 pt-1 border-t border-slate-850 relative z-10">
              <span className="text-[7px] text-slate-400">Last 24 hrs</span>
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

      {/* Embedded CSS rules for orbit scanning, wind streams & ember particles */}
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
        @keyframes windStream {
          0% { stroke-dashoffset: 36; opacity: 0.2; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0.1; }
        }
        @keyframes emberRise {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--ember-drift, 10px), -60px) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}


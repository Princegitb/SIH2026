import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Satellite, Shield, Cpu, Database, Bell, BarChart3, Wind, Flame, Compass, Sparkles } from 'lucide-react'

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
      <polyline fill="none" stroke={color} strokeWidth="1.8" points={points} />
    </svg>
  )
}

// Procedural Starfield & Cyber Matrix Space Atmosphere Environment
const CosmicSpaceEnvironment = () => {
  const canvasRef = useRef(null)

  // Star field data
  const stars = [
    { top: 5, left: 12, size: 1.5, opacity: 0.7, color: '#4ade80', dur: '2.5s', del: '0.2s' },
    { top: 8, left: 45, size: 2.0, opacity: 0.8, color: '#ffffff', dur: '3.8s', del: '1.1s' },
    { top: 12, left: 78, size: 1.0, opacity: 0.5, color: '#86efac', dur: '4.2s', del: '0.5s' },
    { top: 15, left: 28, size: 1.8, opacity: 0.8, color: '#a3e635', dur: '2.1s', del: '1.8s' },
    { top: 18, left: 92, size: 2.2, opacity: 0.9, color: '#22c55e', dur: '3.2s', del: '0.9s' },
    { top: 25, left: 8, size: 1.5, opacity: 0.7, color: '#ffffff', dur: '3.1s', del: '0.4s' },
    { top: 35, left: 52, size: 2.5, opacity: 0.95, color: '#4ade80', dur: '2.3s', del: '0.1s' },
    { top: 46, left: 89, size: 2.0, opacity: 0.85, color: '#86efac', dur: '2.9s', del: '0.7s' },
    { top: 58, left: 77, size: 1.5, opacity: 0.7, color: '#22c55e', dur: '2.6s', del: '0.3s' },
    { top: 70, left: 95, size: 1.6, opacity: 0.75, color: '#ffffff', dur: '2.8s', del: '0.8s' },
    { top: 74, left: 61, size: 2.4, opacity: 0.95, color: '#4ade80', dur: '3.7s', del: '2.2s' },
    { top: 86, left: 41, size: 1.4, opacity: 0.65, color: '#a3e635', dur: '4.1s', del: '2.7s' },
    { top: 92, left: 50, size: 2.2, opacity: 0.9, color: '#ffffff', dur: '3.1s', del: '1.6s' }
  ]

  // Interactive Constellation Cursor Tracking
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const starPoints = stars.map(s => ({
      x: (s.left / 100) * width,
      y: (s.top / 100) * height,
      size: s.size,
      color: s.color
    }))

    let mouseX = -9999
    let mouseY = -9999
    let targetMouseX = -9999
    let targetMouseY = -9999

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX
      targetMouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    let animId
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      mouseX += (targetMouseX - mouseX) * 0.15
      mouseY += (targetMouseY - mouseY) * 0.15

      if (mouseX > 0 && mouseY > 0) {
        const connectRadius = 140

        const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, connectRadius)
        grad.addColorStop(0, 'rgba(74, 222, 128, 0.15)')
        grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.04)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, connectRadius, 0, Math.PI * 2)
        ctx.fill()

        starPoints.forEach((pt) => {
          const dx = mouseX - pt.x
          const dy = mouseY - pt.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectRadius) {
            const alpha = (1 - dist / connectRadius) * 0.7
            ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(mouseX, mouseY)
            ctx.lineTo(pt.x, pt.y)
            ctx.stroke()

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.2})`
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, pt.size * 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }

      animId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      {stars.map((s, idx) => (
        <div
          key={idx}
          className="absolute rounded-full animate-pulse"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            opacity: s.opacity,
            animationDuration: s.dur,
            animationDelay: s.del,
            boxShadow: `0 0 10px ${s.color}`
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage({ onEnterDashboard }) {
  const [activeCard, setActiveCard] = useState(null)
  const [fireActive, setFireActive] = useState(false)
  const [windTrails, setWindTrails] = useState(false)
  const [embers, setEmbers] = useState([])

  const heroRef = useRef(null)
  const earthRef = useRef(null)
  const ringsRef = useRef(null)
  const fireCardRef = useRef(null)
  const windCardRef = useRef(null)
  const mouseCoords = useRef({ x: 0, y: 0, isInside: false, nx: 0, ny: 0 })

  // Rising animated fire embers
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

  // Mouse Movement Handler for 3D Earth Parallax Tilt & Fire Hover
  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseCoords.current = {
      x,
      y,
      isInside: true,
      nx: (x / rect.width) * 2 - 1,
      ny: (y / rect.height) * 2 - 1
    }

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
      className="landing-page-root min-h-screen overflow-y-auto font-outfit overflow-x-hidden relative flex flex-col justify-between selection:bg-lime-500/30"
      style={{ backgroundColor: '#000000', color: '#ffffff' }}
    >
      {/* Cyber Green Matrix Space Atmosphere Background */}
      <CosmicSpaceEnvironment />

      {/* 1. HEADER ROW */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <span className="text-3xl transition-transform duration-500 group-hover:rotate-[360deg]">🛰️</span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center">
              VayuShetra
            </h1>
            <span className="text-[9px] text-[#4ade80] font-black tracking-widest uppercase block mt-0.5">
              INDIA'S ATMOSPHERIC INTELLIGENCE
            </span>
          </div>
        </div>

        <button
          onClick={onEnterDashboard}
          className="flex items-center space-x-2 bg-[#0c1222] border border-white/10 hover:border-emerald-500/50 hover:bg-[#131d38] text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-300 shadow-lg text-white"
        >
          <span>Explore Dashboard</span>
          <ArrowRight size={13} />
        </button>
      </header>

      {/* 2. HERO GRID SECTION */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-grow z-10 relative">

        {/* Left Side: Pitch and Call to Actions (Span 6) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Cyber Neon Capsule Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#052010] border border-[#22c55e]/40 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold text-[#4ade80] uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping"></span>
            <span>REAL-TIME AIR INTELLIGENCE POWERED BY SATELLITE & CPCB</span>
          </div>

          {/* Radiant Readable Heading */}
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]">
              Breathe Better.
            </span>
            <br />
            <span className="text-[#4ade80] drop-shadow-[0_0_30px_rgba(74,222,128,0.6)]">
              Live Smarter.
            </span>
          </h2>

          {/* Description Paragraph */}
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed font-normal">
            VayuShetra delivers real-time, hyperlocal air quality insights, fire & smoke detection, and wind intelligence using satellite data and AI models — for a cleaner, safer tomorrow.
          </p>

          {/* Primary Glowing Neon Lime CTA Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-3">
            <button
              onClick={onEnterDashboard}
              className="flex items-center justify-center space-x-2.5 bg-[#84cc16] hover:bg-[#a3e635] hover:shadow-[0_0_35px_rgba(132,204,22,0.6)] text-black text-sm font-black px-7 py-3.5 rounded-2xl transition-all duration-300 transform active:scale-98 shadow-[0_0_25px_rgba(132,204,22,0.4)]"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right Side: Futuristic Cyber Matrix Space Orbit Scan Visual (Span 6) */}
        <div 
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] lg:min-h-[500px] select-none perspective-[1000px]"
        >

          {/* Concentric Neon Green Radar Rings */}
          <div 
            ref={ringsRef}
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none z-0"
          >
            <div className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] border border-[#22c55e]/20 rounded-full flex items-center justify-center">
              <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] border border-[#22c55e]/15 rounded-full flex items-center justify-center">
                <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] border border-[#22c55e]/10 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Glowing Green Scanning Arc Orbit Paths */}
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-t-[#4ade80]/40 border-r-[#4ade80]/30 animate-spin duration-[16s] ease-linear pointer-events-none z-0"></div>
          <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full border border-transparent border-b-[#22c55e]/30 border-l-[#22c55e]/20 animate-spin duration-[10s] ease-linear pointer-events-none z-0"></div>

          {/* Central Satellite Scanned Earth Sphere with 3D Cyber Radar Hologram */}
          <div 
            ref={earthRef}
            className={`absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full flex items-center justify-center z-10 transition-all duration-500 ease-out group cursor-grab active:cursor-grabbing ${
              fireActive 
                ? 'shadow-[0_0_100px_rgba(249,115,22,0.75)]' 
                : 'shadow-[0_0_80px_rgba(34,197,94,0.35),0_0_140px_rgba(74,222,128,0.2)]'
            }`}
          >
            {/* The 3D Earth Globe Body */}
            <div className="w-full h-full rounded-full relative overflow-hidden bg-[#020703] border-2 border-[#4ade80]/60 shadow-inner">
              {/* Cyber Deep Space Grid Base */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#052e16_0%,#021307_65%,#000000_100%)]"></div>

              {/* Atmospheric Glow Aura inside Globe */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,222,128,0.15),transparent_70%)] pointer-events-none"></div>

              {/* Ultra-Detailed India Centered Cyber Vector Map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <radialGradient id="earthGlow" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#15803d" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
                    </radialGradient>

                    <linearGradient id="indiaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#064e3b" />
                      <stop offset="50%" stopColor="#042f1d" />
                      <stop offset="100%" stopColor="#021a10" />
                    </linearGradient>

                    <linearGradient id="indiaStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="50%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#86efac" />
                    </linearGradient>

                    <linearGradient id="jetstreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
                      <stop offset="50%" stopColor="#4ade80" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Neighboring Eurasia Background Landmass */}
                  <path 
                    d="M 25,48 Q 60,32 100,28 Q 150,22 185,42 Q 192,68 172,92 Q 162,82 142,82 Q 132,68 100,62 Q 60,68 38,78 Z" 
                    fill="#031f0f" 
                    stroke="#064e3b" 
                    strokeWidth="0.8"
                    opacity="0.7"
                  />

                  {/* ULTRA-DETAILED INDIA OUTLINE MAP WITH STATE CORRIDORS */}
                  <path 
                    d="
                      M 100,40 
                      C 104,32 108,32 111,36 
                      C 115,42 111,48 115,54 
                      C 119,60 117,64 113,68 
                      C 107,68 101,66 97,70 
                      C 91,74 87,80 81,88 
                      C 75,94 73,102 81,106 
                      C 77,112 85,114 87,110 
                      C 89,120 93,134 97,148 
                      C 101,160 105,168 107,168 
                      C 109,168 113,158 117,146 
                      C 123,132 129,118 135,110 
                      C 139,104 143,100 145,94 
                      C 149,92 155,86 161,84 
                      C 167,84 171,90 167,96 
                      C 159,100 151,100 145,96 
                      C 139,92 135,86 127,80 
                      C 121,74 115,62 109,56 
                      Z
                    " 
                    fill="url(#indiaFill)" 
                    stroke="url(#indiaStroke)" 
                    strokeWidth="2.2"
                    className="filter drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                  />

                  {/* State Corridors */}
                  <path d="M 95,68 Q 105,70 113,66" stroke="#4ade80" strokeWidth="0.9" strokeDasharray="1.5 1.5" opacity="0.8" />
                  <path d="M 97,70 Q 116,84 135,88" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                  <path d="M 81,88 Q 97,94 115,92" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
                  <path d="M 87,110 Q 107,116 135,110" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
                  <path d="M 93,134 Q 107,138 123,132" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.45" />

                  {/* Cyber Jet Stream / Wind Flow Vector */}
                  <path 
                    d="M 75,64 Q 105,74 140,84" 
                    fill="none" 
                    stroke="url(#jetstreamGrad)" 
                    strokeWidth="2.2" 
                    strokeDasharray="6 3"
                    className="animate-[windStream_1.5s_linear_infinite]"
                  />

                  {/* Monitoring Beacons */}
                  <g>
                    <circle cx="103" cy="72" r="6" fill="none" stroke="#4ade80" strokeWidth="1.2" className="animate-ping" />
                    <circle cx="103" cy="72" r="3" fill="#4ade80" className="shadow-[0_0_10px_#4ade80]" />
                    <circle cx="103" cy="72" r="1.2" fill="#ffffff" />
                  </g>

                  {/* Atmospheric Isobars & Coordinate Grid */}
                  <ellipse cx="100" cy="100" rx="98" ry="98" fill="url(#earthGlow)" stroke="#4ade80" strokeWidth="1.2" opacity="0.5" />
                  <ellipse cx="100" cy="100" rx="65" ry="98" fill="none" stroke="#4ade80" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.3" />
                  <ellipse cx="100" cy="100" rx="30" ry="98" fill="none" stroke="#4ade80" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="2" y1="100" x2="198" y2="100" stroke="#4ade80" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.3" />
                </svg>
              </div>

              {/* Horizontal Satellite Radar Scan Line */}
              <div className={`absolute w-full h-[2px] top-0 animate-[scan_3s_infinite_linear] transition-colors duration-500 ${
                fireActive ? 'bg-orange-400 shadow-[0_0_12px_#f97316]' : 'bg-[#4ade80] shadow-[0_0_12px_#4ade80]'
              }`}></div>
            </div>
          </div>

          {/* Orbiting Scanning Satellite Model */}
          <div className="absolute w-full h-full animate-[spin_32s_linear_infinite] pointer-events-none z-20">
            <div className="absolute top-[8%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 transform rotate-[-45deg] pointer-events-auto">
              <div className={`w-8 h-8 rounded-xl bg-black border flex items-center justify-center shadow-lg transition-all duration-300 ${
                fireActive 
                  ? 'border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                  : 'border-[#4ade80]/40 text-[#4ade80] hover:border-[#4ade80] hover:scale-110'
              }`}>
                <Satellite size={15} className="animate-pulse" />
              </div>
              <div className={`w-[1.5px] h-32 animate-[laser_2s_infinite] transition-all duration-300 ${
                fireActive 
                  ? 'bg-gradient-to-b from-orange-500/80 to-transparent' 
                  : 'bg-gradient-to-b from-[#4ade80]/80 to-transparent'
              }`}></div>
            </div>
          </div>

          {/* Floating Widget Card 1: AQI Status (Top Left) */}
          <div
            onMouseEnter={() => setActiveCard(1)}
            onMouseLeave={() => setActiveCard(null)}
            className="absolute top-[8%] left-[2%] bg-[#0c1222]/95 border border-white/15 rounded-2xl p-4 w-[165px] text-left transition-all duration-300 z-30 cursor-pointer shadow-2xl backdrop-blur-xl hover:border-[#4ade80]/60 hover:scale-105"
          >
            <div className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">AQI (DELHI NCR)</div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-black text-[#84cc16]">76</span>
              <span className="text-[9px] font-black text-[#84cc16] uppercase">SATISFACTORY</span>
            </div>
            <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-white/10">
              <span className="text-[8px] text-zinc-400">Updated 2m ago</span>
              <MiniSparkline values={[82, 79, 81, 75, 77, 76]} color="#84cc16" />
            </div>
          </div>

          {/* Floating Widget Card 2: Wind Velocity with Evading Wind Physics & Flowing Air Streams (Bottom Center) */}
          <div
            ref={windCardRef}
            onMouseEnter={() => {
              setActiveCard(2)
              setWindTrails(true)
            }}
            onMouseLeave={() => {
              setActiveCard(null)
            }}
            className={`absolute bottom-[10%] left-[25%] -translate-x-1/2 bg-[#0c1222]/95 border rounded-2xl p-3.5 w-[155px] text-left z-30 cursor-pointer transition-all duration-300 shadow-2xl backdrop-blur-xl ${
              activeCard === 2 || windTrails
                ? 'border-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.4)] scale-105' 
                : 'border-white/15 hover:border-emerald-500/50'
            }`}
          >
            {/* Animated Air Streams / Wind Trails flowing behind the escaping card */}
            {windTrails && (
              <div className="absolute -top-4 -left-6 -right-6 pointer-events-none opacity-80">
                <svg viewBox="0 0 160 30" className="w-full h-8 overflow-visible">
                  <path 
                    d="M 5,12 Q 35,4 70,14 T 145,8" 
                    fill="none" 
                    stroke="rgba(74,222,128,0.6)" 
                    strokeWidth="1.8" 
                    strokeDasharray="12 6"
                    className="animate-[windStream_1.2s_linear_infinite]"
                  />
                  <path 
                    d="M 15,22 Q 45,16 90,24 T 155,18" 
                    fill="none" 
                    stroke="rgba(34,197,94,0.4)" 
                    strokeWidth="1.5" 
                    strokeDasharray="8 4"
                    className="animate-[windStream_0.9s_linear_infinite]"
                  />
                </svg>
              </div>
            )}

            <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center text-zinc-300">
                <Wind size={12} className={`mr-1 text-[#4ade80] ${windTrails ? 'animate-bounce' : ''}`} /> WIND VELOCITY
              </span>
              {windTrails && (
                <span className="text-[7px] text-[#4ade80] font-mono font-bold animate-pulse">GUST</span>
              )}
            </div>
            <div className="text-xl font-extrabold text-white mt-1 flex items-baseline">
              <span>9</span> 
              <span className="text-[10px] font-normal text-zinc-400 ml-1">km/h</span>
            </div>
            <div className="text-[8px] text-[#4ade80] font-black mt-1 uppercase flex items-center justify-between">
              <span>MODERATE VECTOR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-ping"></span>
            </div>
          </div>

          {/* Floating Widget Card 3: Active Fires (Top Right) */}
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
            className={`absolute top-[10%] right-[3%] sm:right-[5%] bg-[#0c1222]/95 border rounded-2xl p-4 w-[165px] text-left transition-all duration-300 z-30 cursor-pointer shadow-2xl backdrop-blur-xl hover:scale-105 ${
              fireActive 
                ? 'border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.5)]' 
                : 'border-white/15 hover:border-orange-500/50'
            }`}
          >
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

            <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center text-orange-400">
                <Flame size={13} className="mr-1 text-orange-500" /> ACTIVE FIRES
              </span>
              {fireActive && (
                <span className="text-[7px] bg-orange-500/20 text-amber-300 border border-orange-400/40 px-1.5 py-0.5 rounded font-black uppercase">
                  IGNITED
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-black text-orange-500">
                3
              </span>
              <span className="text-[8px] font-black uppercase text-orange-400">DETECTED</span>
            </div>

            <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-white/10">
              <span className="text-[8px] text-zinc-400">Last 24 hrs</span>
              <MiniSparkline values={[1, 3, 2, 4, 3, 3]} color="#f97316" />
            </div>
          </div>

        </div>

      </main>

      {/* 3. VALUE PROPOSITIONS FEATURE ROW (5 SECTIONS) */}
      <section className="max-w-7xl mx-auto w-full px-6 py-6 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">

          {/* Card 1: Satellite-Powered */}
          <div className="bg-[#0c1222]/90 border border-white/10 p-4 rounded-2xl space-y-2 hover:border-[#4ade80]/50 transition-all duration-200 shadow-xl backdrop-blur-md group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-[#4ade80] group-hover:scale-110 transition-transform">
              <Satellite size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Satellite-Powered</h4>
              <p className="text-[11px] text-zinc-300 leading-normal mt-1">Real-time data from Sentinel, MODIS, VIIRS & more.</p>
            </div>
          </div>

          {/* Card 2: AI Intelligence */}
          <div className="bg-[#0c1222]/90 border border-white/10 p-4 rounded-2xl space-y-2 hover:border-purple-500/50 transition-all duration-200 shadow-xl backdrop-blur-md group">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Cpu size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">AI Intelligence</h4>
              <p className="text-[11px] text-zinc-300 leading-normal mt-1">Advanced models detect pollution trends, fires & air risks.</p>
            </div>
          </div>

          {/* Card 3: Hyperlocal Insights */}
          <div className="bg-[#0c1222]/90 border border-white/10 p-4 rounded-2xl space-y-2 hover:border-[#4ade80]/50 transition-all duration-200 shadow-xl backdrop-blur-md group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-[#4ade80] group-hover:scale-110 transition-transform">
              <Compass size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Hyperlocal Insights</h4>
              <p className="text-[11px] text-zinc-300 leading-normal mt-1">District-level AQI, hotspot mapping & forecasts.</p>
            </div>
          </div>

          {/* Card 4: Actionable Alerts */}
          <div className="bg-[#0c1222]/90 border border-white/10 p-4 rounded-2xl space-y-2 hover:border-amber-500/50 transition-all duration-200 shadow-xl backdrop-blur-md group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Bell size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Actionable Alerts</h4>
              <p className="text-[11px] text-zinc-300 leading-normal mt-1">Timely alerts on pollution, fires & hazardous levels.</p>
            </div>
          </div>

          {/* Card 5: Data You Can Trust */}
          <div className="bg-[#0c1222]/90 border border-white/10 p-4 rounded-2xl space-y-2 hover:border-blue-500/50 transition-all duration-200 shadow-xl backdrop-blur-md group">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Database size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Data You Can Trust</h4>
              <p className="text-[11px] text-zinc-300 leading-normal mt-1">Backed by global datasets & government standards.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. BOTTOM CTAs BANNER */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 z-10 relative">
        <div className="bg-[#0c1222]/95 border border-white/15 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl backdrop-blur-xl">
          <div className="text-left space-y-1.5">
            <div className="text-[9px] text-[#4ade80] font-black uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-[#4ade80] rounded-full mr-2 shadow-[0_0_8px_#4ade80]"></span> TOGETHER FOR CLEANER AIR
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Better Data. Better Decisions. Better Tomorrow.</h3>
            <p className="text-[11px] text-zinc-300 font-medium">Join us in building a healthier, sustainable future through intelligent air monitoring.</p>
          </div>
          <button
            onClick={onEnterDashboard}
            className="flex items-center space-x-2 bg-white hover:bg-zinc-100 text-black text-xs font-black px-6 py-3 rounded-xl transition-all duration-300 shadow-md whitespace-nowrap"
          >
            <span>Get Started</span>
            <ArrowRight size={13} className="stroke-[2.5]" />
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

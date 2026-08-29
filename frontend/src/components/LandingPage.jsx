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

// Procedural Starfield & Cosmic Space Atmosphere Environment Component with Interactive Cursor Constellations
const CosmicSpaceEnvironment = () => {
  const canvasRef = useRef(null)

  // Deterministic star field data (85 stars with varied depths and colors)
  const stars = [
    { top: 5, left: 12, size: 1.5, opacity: 0.7, color: '#93c5fd', dur: '2.5s', del: '0.2s' },
    { top: 8, left: 45, size: 2.2, opacity: 0.9, color: '#ffffff', dur: '3.8s', del: '1.1s' },
    { top: 12, left: 78, size: 1.0, opacity: 0.6, color: '#c7d2fe', dur: '4.2s', del: '0.5s' },
    { top: 15, left: 28, size: 1.8, opacity: 0.8, color: '#fef08a', dur: '2.1s', del: '1.8s' },
    { top: 18, left: 92, size: 2.5, opacity: 0.95, color: '#60a5fa', dur: '3.2s', del: '0.9s' },
    { top: 22, left: 63, size: 1.2, opacity: 0.5, color: '#ffffff', dur: '4.5s', del: '2.3s' },
    { top: 25, left: 8, size: 1.5, opacity: 0.7, color: '#e0e7ff', dur: '3.1s', del: '0.4s' },
    { top: 28, left: 37, size: 2.0, opacity: 0.85, color: '#93c5fd', dur: '2.7s', del: '1.5s' },
    { top: 32, left: 82, size: 1.0, opacity: 0.4, color: '#ffffff', dur: '5.0s', del: '3.0s' },
    { top: 35, left: 52, size: 2.8, opacity: 1.0, color: '#38bdf8', dur: '2.3s', del: '0.1s' },
    { top: 38, left: 19, size: 1.3, opacity: 0.6, color: '#fef08a', dur: '3.6s', del: '2.0s' },
    { top: 42, left: 71, size: 1.7, opacity: 0.75, color: '#ffffff', dur: '4.0s', del: '1.2s' },
    { top: 46, left: 89, size: 2.1, opacity: 0.9, color: '#c7d2fe', dur: '2.9s', del: '0.7s' },
    { top: 50, left: 33, size: 1.2, opacity: 0.5, color: '#93c5fd', dur: '4.8s', del: '2.5s' },
    { top: 54, left: 6, size: 2.4, opacity: 0.95, color: '#ffffff', dur: '3.3s', del: '1.0s' },
    { top: 58, left: 77, size: 1.5, opacity: 0.7, color: '#60a5fa', dur: '2.6s', del: '0.3s' },
    { top: 62, left: 48, size: 1.0, opacity: 0.45, color: '#e0e7ff', dur: '5.2s', del: '3.2s' },
    { top: 66, left: 22, size: 2.0, opacity: 0.8, color: '#fef08a', dur: '3.5s', del: '1.7s' },
    { top: 70, left: 95, size: 1.6, opacity: 0.75, color: '#ffffff', dur: '2.8s', del: '0.8s' },
    { top: 74, left: 61, size: 2.6, opacity: 1.0, color: '#38bdf8', dur: '3.7s', del: '2.2s' },
    { top: 78, left: 15, size: 1.1, opacity: 0.5, color: '#93c5fd', dur: '4.4s', del: '1.4s' },
    { top: 82, left: 85, size: 1.9, opacity: 0.85, color: '#ffffff', dur: '3.0s', del: '0.6s' },
    { top: 86, left: 41, size: 1.4, opacity: 0.65, color: '#c7d2fe', dur: '4.1s', del: '2.7s' },
    { top: 90, left: 68, size: 2.2, opacity: 0.9, color: '#60a5fa', dur: '2.4s', del: '1.3s' },
    { top: 94, left: 26, size: 1.2, opacity: 0.55, color: '#ffffff', dur: '3.9s', del: '0.5s' },
    { top: 6, left: 60, size: 1.0, opacity: 0.5, color: '#93c5fd', dur: '4.0s', del: '1.9s' },
    { top: 14, left: 96, size: 1.8, opacity: 0.8, color: '#ffffff', dur: '2.9s', del: '0.3s' },
    { top: 29, left: 15, size: 2.5, opacity: 0.95, color: '#38bdf8', dur: '3.4s', del: '2.4s' },
    { top: 48, left: 55, size: 1.3, opacity: 0.6, color: '#c7d2fe', dur: '4.6s', del: '1.1s' },
    { top: 67, left: 88, size: 2.0, opacity: 0.85, color: '#fef08a', dur: '2.7s', del: '0.8s' },
    { top: 83, left: 3, size: 1.6, opacity: 0.7, color: '#60a5fa', dur: '3.8s', del: '2.1s' },
    { top: 92, left: 50, size: 2.3, opacity: 0.9, color: '#ffffff', dur: '3.1s', del: '1.6s' }
  ]

  // Interactive Constellation Cursor Tracking on HTML5 Canvas
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

    // Calculate fixed pixel star positions
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

      // Smooth cursor interpolation
      mouseX += (targetMouseX - mouseX) * 0.15
      mouseY += (targetMouseY - mouseY) * 0.15

      // Draw interactive constellation connections to cursor
      if (mouseX > 0 && mouseY > 0) {
        const connectRadius = 150

        // Draw cursor beacon aura
        const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, connectRadius)
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.15)')
        grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, connectRadius, 0, Math.PI * 2)
        ctx.fill()

        // Connect nearby stars with luminous quantum filaments
        starPoints.forEach((pt) => {
          const dx = mouseX - pt.x
          const dy = mouseY - pt.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectRadius) {
            const alpha = (1 - dist / connectRadius) * 0.75
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(mouseX, mouseY)
            ctx.lineTo(pt.x, pt.y)
            ctx.stroke()

            // Draw glowing star connection halo
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Deep Space Cosmic Background Radial Voids */}
      <div className="absolute inset-0 bg-[#02040a]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(37,99,235,0.28),rgba(0,0,0,0))]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.15),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_65%,rgba(6,182,212,0.12),transparent_50%)]"></div>

      {/* 2. Drifting Cosmic Nebulae & Ionospheric Plasma Dust */}
      <div className="absolute top-[-10%] left-[-5%] w-[850px] h-[500px] bg-gradient-to-br from-indigo-600/18 via-blue-600/12 to-cyan-500/10 rounded-full blur-[120px] animate-nebula-drift"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[550px] bg-gradient-to-tl from-purple-700/16 via-indigo-600/14 to-sky-500/10 rounded-full blur-[140px] animate-nebula-drift" style={{ animationDelay: '-14s' }}></div>

      {/* 3. Luminous Stratospheric Aurora Wave Stream */}
      <div className="absolute top-[10%] left-[15%] w-[700px] h-[220px] bg-gradient-to-r from-emerald-500/12 via-teal-400/15 to-indigo-500/12 rounded-full blur-[90px] transform -rotate-12 animate-aurora"></div>

      {/* 4. Realistic Atmospheric Limb Horizon Arc (Earth's Curved Luminous Exosphere Horizon at Bottom) */}
      <div className="absolute bottom-[-320px] left-1/2 transform -translate-x-1/2 w-[1600px] sm:w-[2200px] h-[480px] rounded-[100%] bg-gradient-to-t from-sky-400/15 via-blue-500/8 to-transparent border-t border-sky-400/30 shadow-[0_-25px_90px_rgba(56,189,248,0.2)]"></div>
      <div className="absolute bottom-[-280px] left-1/2 transform -translate-x-1/2 w-[1400px] sm:w-[1900px] h-[380px] rounded-[100%] bg-gradient-to-t from-cyan-300/20 via-sky-500/10 to-transparent blur-[40px]"></div>

      {/* 5. Deep Space Twinkling Starfield */}
      {stars.map((star, idx) => (
        <div
          key={`star-${idx}`}
          className="absolute rounded-full animate-star-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: star.size > 2 ? `0 0 6px ${star.color}` : 'none',
            '--twinkle-duration': star.dur,
            '--twinkle-delay': star.del
          }}
        />
      ))}

      {/* 6. Periodic Shooting Stars / Meteor Streaks Traversing the Upper Atmosphere */}
      <div className="absolute top-[12%] left-[10%] w-[120px] h-[2px] bg-gradient-to-r from-transparent via-white to-sky-400 shadow-[0_0_8px_#ffffff] rounded-full animate-shooting-star" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute top-[35%] left-[55%] w-[150px] h-[2px] bg-gradient-to-r from-transparent via-white to-cyan-300 shadow-[0_0_8px_#38bdf8] rounded-full animate-shooting-star" style={{ animationDelay: '5.8s' }}></div>
      <div className="absolute top-[60%] left-[25%] w-[100px] h-[1.5px] bg-gradient-to-r from-transparent via-white to-indigo-300 shadow-[0_0_6px_#ffffff] rounded-full animate-shooting-star" style={{ animationDelay: '9.4s' }}></div>

      {/* 7. Interactive Constellation Canvas Filament Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* 8. Subtle Geospatial Latitude/Longitude Orbital Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf806_1px,transparent_1px),linear-gradient(to_bottom,#38bdf806_1px,transparent_1px)] bg-[size:64px_64px]"></div>
    </div>
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

      // 2. WIND CARD EVASION PHYSICS
      if (windCardRef.current && heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect()
        const cardRect = windCardRef.current.getBoundingClientRect()
        const cardCenterX = cardRect.left + cardRect.width / 2 - heroRect.left
        const cardCenterY = cardRect.top + cardRect.height / 2 - heroRect.top

        const dx = mouseCoords.current.x - cardCenterX
        const dy = mouseCoords.current.y - cardCenterY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repulseRadius = 140

        if (dist < repulseRadius && dist > 0 && mouseCoords.current.isInside) {
          const force = (repulseRadius - dist) / repulseRadius
          const pushX = -(dx / dist) * force * 45
          const pushY = -(dy / dist) * force * 45
          windPos.current.targetX = pushX
          windPos.current.targetY = pushY
          setWindTrails(true)
        } else {
          windPos.current.targetX = Math.sin(time) * 4
          windPos.current.targetY = Math.cos(time * 0.8) * 4
          if (Math.abs(windPos.current.x) < 2) setWindTrails(false)
        }

        windPos.current.x += (windPos.current.targetX - windPos.current.x) * 0.12
        windPos.current.y += (windPos.current.targetY - windPos.current.y) * 0.12

        windCardRef.current.style.transform = `translate(${windPos.current.x}px, ${windPos.current.y}px)`
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
      className="h-screen overflow-y-auto font-outfit overflow-x-hidden relative flex flex-col justify-between selection:bg-indigo-500/30"
      style={{ backgroundColor: '#010103', color: '#f4f4f5' }}
    >
      {/* Dynamic Deep Space Cosmic Atmosphere Environment Background with Interactive Quantum Constellation Cursor Tracker */}
      <CosmicSpaceEnvironment />

      {/* 1. HEADER ROW */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-3 group">
          <span className="text-3xl transition-transform duration-500 group-hover:rotate-[360deg]">🛰️</span>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center">
              VayuShetra
            </h1>
            <span className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase block mt-0.5">India's Atmospheric Intelligence</span>
          </div>
        </div>

        <button
          onClick={onEnterDashboard}
          className="flex items-center space-x-2 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-lg text-zinc-200 hover:text-white"
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
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300 bg-clip-text text-transparent">Live Smarter.</span>
          </h2>

          {/* Description Paragraph */}
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-medium">
            VayuShetra delivers real-time, hyperlocal air quality insights, fire & smoke detection, and wind intelligence using satellite data and AI models — for a cleaner, safer tomorrow.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-3">
            <button
              onClick={onEnterDashboard}
              className="flex items-center justify-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-350 transform active:scale-98"
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
            className={`absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full flex items-center justify-center z-10 transition-all duration-500 ease-out group cursor-grab active:cursor-grabbing ${
              fireActive 
                ? 'shadow-[0_0_100px_rgba(249,115,22,0.75),0_0_160px_rgba(220,38,38,0.55)]' 
                : 'shadow-[0_0_90px_rgba(56,189,248,0.45),0_0_150px_rgba(75,107,245,0.35)]'
            }`}
          >
            {/* The 3D Earth Globe Body */}
            <div className="w-full h-full rounded-full relative overflow-hidden bg-[#040a18] border-2 border-sky-400/60 shadow-inner">
              {/* Deep Ocean Gradient Base */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e3a8a_0%,#0f172a_65%,#01040f_100%)]"></div>

              {/* Atmospheric Ozone Glow Aura inside Globe */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.2),transparent_70%)] pointer-events-none"></div>

              {/* Ultra-Detailed India Centered Vector Map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <radialGradient id="earthGlow" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
                    </radialGradient>

                    <linearGradient id="indiaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#064e3b" />
                      <stop offset="35%" stopColor="#0f766e" />
                      <stop offset="70%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#0c4a6e" />
                    </linearGradient>

                    <linearGradient id="indiaStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="40%" stopColor="#38bdf8" />
                      <stop offset="80%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>

                    <linearGradient id="jetstreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Neighboring Eurasia & Tibet Plateau Background Landmass */}
                  <path 
                    d="M 25,48 Q 60,32 100,28 Q 150,22 185,42 Q 192,68 172,92 Q 162,82 142,82 Q 132,68 100,62 Q 60,68 38,78 Z" 
                    fill="#0f172a" 
                    stroke="#1e293b" 
                    strokeWidth="0.8"
                    opacity="0.8"
                  />
                  {/* Arabian Peninsula */}
                  <path 
                    d="M 20,88 Q 42,82 52,92 Q 48,114 32,118 Q 18,108 20,88 Z" 
                    fill="#0f172a" 
                    stroke="#1e293b" 
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
                    strokeWidth="2"
                    className="filter drop-shadow-[0_0_12px_rgba(56,189,248,0.75)]"
                  />

                  {/* High-Fidelity State Region Demarcation Grid */}
                  {/* Punjab - Haryana - Delhi Stubble Belt */}
                  <path d="M 95,68 Q 105,70 113,66" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1.5" opacity="0.75" />
                  {/* Indo-Gangetic Plains Corridor */}
                  <path d="M 97,70 Q 116,84 135,88" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                  {/* Western Gujarat / Thar Corridor */}
                  <path d="M 81,88 Q 97,94 115,92" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5" />
                  {/* Deccan Plateau Boundary */}
                  <path d="M 87,110 Q 107,116 135,110" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
                  {/* Southern Peninsular Grid */}
                  <path d="M 93,134 Q 107,138 123,132" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.45" />

                  {/* Atmospheric Jet Stream / Wind Flow Vector (NW to SE across North India) */}
                  <path 
                    d="M 75,64 Q 105,74 140,84" 
                    fill="none" 
                    stroke="url(#jetstreamGrad)" 
                    strokeWidth="2" 
                    strokeDasharray="6 3"
                    className="animate-[windStream_1.5s_linear_infinite]"
                  />

                  {/* Sri Lanka */}
                  <ellipse cx="115" cy="174" rx="4" ry="6" fill="#0f766e" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />

                  {/* REGIONAL AIR QUALITY MONITORING TELEMETRY STATIONS */}
                  {/* 1. Delhi-NCR (Central Live Beacon) */}
                  <g>
                    <circle cx="103" cy="72" r="6" fill="none" stroke="#10b981" strokeWidth="1.2" className="animate-ping" />
                    <circle cx="103" cy="72" r="3" fill="#34d399" className="shadow-[0_0_10px_#10b981]" />
                    <circle cx="103" cy="72" r="1.2" fill="#ffffff" />
                  </g>

                  {/* 2. Punjab / Amritsar Monitoring Station */}
                  <g>
                    <circle cx="94" cy="62" r="2.5" fill="#f97316" className="shadow-[0_0_8px_#ea580c] animate-pulse" />
                    <circle cx="94" cy="62" r="1" fill="#fef08a" />
                  </g>

                  {/* 3. Mumbai Coastal Station */}
                  <g>
                    <circle cx="83" cy="112" r="2.5" fill="#38bdf8" className="shadow-[0_0_8px_#38bdf8]" />
                    <circle cx="83" cy="112" r="1" fill="#ffffff" />
                  </g>

                  {/* 4. Bengaluru Southern Node */}
                  <g>
                    <circle cx="99" cy="146" r="2.5" fill="#10b981" className="shadow-[0_0_8px_#10b981]" />
                    <circle cx="99" cy="146" r="1" fill="#ffffff" />
                  </g>

                  {/* 5. Kolkata Eastern Node */}
                  <g>
                    <circle cx="137" cy="96" r="2.5" fill="#818cf8" className="shadow-[0_0_8px_#818cf8]" />
                    <circle cx="137" cy="96" r="1" fill="#ffffff" />
                  </g>

                  {/* Atmospheric Curved Isobars & Coordinate Grid */}
                  <ellipse cx="100" cy="100" rx="98" ry="98" fill="url(#earthGlow)" stroke="#38bdf8" strokeWidth="1.2" opacity="0.65" />
                  <ellipse cx="100" cy="100" rx="65" ry="98" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.35" />
                  <ellipse cx="100" cy="100" rx="30" ry="98" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.35" />
                  <line x1="2" y1="100" x2="198" y2="100" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.35" />
                  <line x1="14" y1="65" x2="186" y2="65" stroke="#38bdf8" strokeWidth="0.65" strokeDasharray="2 2" opacity="0.25" />
                  <line x1="14" y1="135" x2="186" y2="135" stroke="#38bdf8" strokeWidth="0.65" strokeDasharray="2 2" opacity="0.25" />

                  {/* Atmospheric Cloud Swirls */}
                  <path 
                    d="M 25,58 Q 65,42 115,56 T 175,68" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="2.8" 
                    opacity="0.32" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M 55,138 Q 95,118 145,132" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="2.2" 
                    opacity="0.28" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Atmospheric Rim Glow */}
              <div className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${
                fireActive 
                  ? 'bg-[radial-gradient(circle_at_30%_30%,rgba(254,240,138,0.3),rgba(249,115,22,0.45)_50%,rgba(220,38,38,0.35)_80%)]' 
                  : 'bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.4),rgba(56,189,248,0.3)_40%,transparent_75%)]'
              }`}></div>

              {/* Horizontal Satellite Radar Scan Line */}
              <div className={`absolute w-full h-[2px] top-0 animate-[scan_3s_infinite_linear] transition-colors duration-500 ${
                fireActive ? 'bg-orange-400 shadow-[0_0_12px_#f97316]' : 'bg-sky-400 shadow-[0_0_10px_#38bdf8]'
              }`}></div>

              {/* Active Satellite-Detected Thermal Hotspots on Northern India */}
              {fireActive && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Hotspot 1: Punjab / Stubble Core */}
                  <div className="absolute top-[34%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-red-500/50 animate-ping absolute"></span>
                    <span className="w-4 h-4 rounded-full bg-orange-500/80 animate-pulse absolute"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#ffedd5] relative z-10"></span>
                  </div>

                  {/* Hotspot 2: Delhi-NCR Basin Receptor */}
                  <div className="absolute top-[38%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-orange-500/50 animate-ping absolute" style={{ animationDelay: '0.4s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#f97316] relative z-10 animate-bounce"></span>
                  </div>

                  {/* Hotspot 3: Upwind Farm Fire Cluster */}
                  <div className="absolute top-[30%] left-[44%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
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
          <div className="bg-[#07070a]/90 border border-zinc-800/80 p-4 rounded-xl space-y-2 hover:border-zinc-700 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Bell size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Actionable Alerts</h4>
              <p className="text-[10px] text-zinc-400 leading-normal mt-1">Timely alerts on pollution, fires & hazardous levels.</p>
            </div>
          </div>

          {/* Card 5: Data You Can Trust */}
          <div className="bg-[#07070a]/90 border border-zinc-800/80 p-4 rounded-xl space-y-2 hover:border-zinc-700 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Database size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Data You Can Trust</h4>
              <p className="text-[10px] text-zinc-400 leading-normal mt-1">Backed by global datasets & government standards.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. BOTTOM CTAs BANNER */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 z-10 relative">
        <div className="bg-gradient-to-r from-[#070709] via-[#0a0a0d] to-[#070709] border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
          <div className="text-left space-y-1.5">
            <div className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span> Together for Cleaner Air
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Better Data. Better Decisions. Better Tomorrow.</h3>
            <p className="text-[10px] text-zinc-400">Join us in building a healthier, sustainable future through intelligent air monitoring.</p>
          </div>
          <button
            onClick={onEnterDashboard}
            className="flex items-center space-x-2 bg-white hover:bg-zinc-200 text-black text-xs font-extrabold px-6 py-3 rounded-xl transition-all duration-300 shadow-md whitespace-nowrap"
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


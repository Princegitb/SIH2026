import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { 
  Layers, Compass, Sparkles, HelpCircle, 
  Flame, Wind, MapPin, Eye, Play, ArrowRight,
  Shield, CheckCircle, Info, Thermometer
} from 'lucide-react'

export default function Atmospheric3DView() {
  const { selectedDate } = useStore()
  const mountRef = useRef(null)

  // Atmospheric API data
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Interactive 3D layer toggles
  const [showInversionLid, setShowInversionLid] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [altitudeScrub, setAltitudeScrub] = useState(500) // in meters
  const [activeStoryStep, setActiveStoryStep] = useState(0)

  // Three.js scene refs
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const lidMeshRef = useRef(null)
  const particlesRef = useRef(null)
  const particlePositionsRef = useRef(null)
  const particleCurvesRef = useRef([])
  const particleProgressRef = useRef([])

  // Fetch Atmospheric Sounding Data
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetch(`/api/atmospheric-profile?date=${selectedDate || ''}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setProfileData(data)
          setAltitudeScrub(data.telemetry?.blh_m || 500)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error("Failed to load atmospheric profile:", err)
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [selectedDate])

  // Build Three.js 3D Scene
  useEffect(() => {
    if (!mountRef.current || !profileData) return

    const container = mountRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 550

    // 1. Scene & Background
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060913)
    scene.fog = new THREE.FogExp2(0x060913, 0.008)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 48, 72)
    camera.lookAt(0, 6, 0)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    rendererRef.current = renderer

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x475569, 1.4)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(30, 60, 40)
    scene.add(dirLight)

    // Neon Ground Glow Light
    const groundLight = new THREE.PointLight(0x6366f1, 2.5, 90)
    groundLight.position.set(0, 2, 0)
    scene.add(groundLight)

    // 5. 3D Regional Ground Mesh & Glowing Wireframe
    const groundGeo = new THREE.PlaneGeometry(100, 70, 32, 32)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.8,
      metalness: 0.2
    })
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.y = 0
    scene.add(groundMesh)

    // Glowing coordinate grid lines
    const gridHelper = new THREE.GridHelper(100, 20, 0x475569, 0x1e293b)
    gridHelper.position.y = 0.05
    scene.add(gridHelper)

    // 6. Inversion Lid (Semi-Transparent Glowing Holographic Plane)
    const blhNormY = ((profileData.telemetry?.blh_m || 500) / 2500.0) * 35.0
    const lidGeo = new THREE.PlaneGeometry(100, 70, 16, 16)
    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.5,
      side: THREE.DoubleSide
    })
    const lidMesh = new THREE.Mesh(lidGeo, lidMat)
    lidMesh.rotation.x = -Math.PI / 2
    lidMesh.position.y = blhNormY
    lidMeshRef.current = lidMesh
    scene.add(lidMesh)

    // Inversion Lid Wireframe Grid Frame
    const lidWireGeo = new THREE.WireframeGeometry(lidGeo)
    const lidWireMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4 })
    const lidWire = new THREE.LineSegments(lidWireGeo, lidWireMat)
    lidWire.rotation.x = -Math.PI / 2
    lidWire.position.y = blhNormY
    scene.add(lidWire)

    // 7. 3D Regional Landmarks (Pillars & Rings)
    const landmarkGroup = new THREE.Group()
    profileData.landmarks?.forEach(lm => {
      // Pillar
      const pinGeo = new THREE.CylinderGeometry(0.6, 0.6, 3.0, 16)
      const pinMat = new THREE.MeshStandardMaterial({
        color: lm.color || 0x4b6bf5,
        emissive: lm.color || 0x4b6bf5,
        emissiveIntensity: 0.7
      })
      const pinMesh = new THREE.Mesh(pinGeo, pinMat)
      pinMesh.position.set(lm.x, 1.5, -lm.y)
      landmarkGroup.add(pinMesh)

      // Beacon Ground Ring
      const ringGeo = new THREE.RingGeometry(1.5, 2.2, 16)
      const ringMat = new THREE.MeshBasicMaterial({ color: lm.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.position.set(lm.x, 0.1, -lm.y)
      landmarkGroup.add(ringMesh)
    })
    scene.add(landmarkGroup)

    // 8. 3D Smoke Streamline Curves
    const streamlineGroup = new THREE.Group()
    const curves = []

    profileData.streamlines?.forEach(stream => {
      const pts3d = stream.points.map(p => new THREE.Vector3(p.x, (p.z / 2500.0) * 35.0, -p.y))
      const curve = new THREE.CatmullRomCurve3(pts3d)
      curves.push(curve)

      // Glowing tube line
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.45, 8, false)
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.4
      })
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat)
      streamlineGroup.add(tubeMesh)
    })
    particleCurvesRef.current = curves
    scene.add(streamlineGroup)

    // 9. Volumetric Smoke Particles
    const particleCount = 320
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const particleProgress = []

    for (let i = 0; i < particleCount; i++) {
      const curveIdx = i % curves.length
      const prog = Math.random()
      particleProgress.push({ curveIdx, prog, speed: 0.0018 + Math.random() * 0.0022 })

      const pos = curves[curveIdx] ? curves[curveIdx].getPoint(prog) : new THREE.Vector3(0, 0, 0)
      particlePositions[i * 3] = pos.x
      particlePositions[i * 3 + 1] = pos.y
      particlePositions[i * 3 + 2] = pos.z

      // Warm Fire Orange to Trapped Purple/Gray
      particleColors[i * 3] = 0.98
      particleColors[i * 3 + 1] = 0.4 + (1.0 - prog) * 0.5
      particleColors[i * 3 + 2] = 0.15 + prog * 0.7
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    particlesRef.current = particles
    particlePositionsRef.current = particlePositions
    particleProgressRef.current = particleProgress
    scene.add(particles)

    // 10. Mouse Drag & Orbit Interaction
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let rotX = 0
    let rotY = 0

    const onMouseDown = (e) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      prevMouseX = e.clientX
      prevMouseY = e.clientY

      rotY += deltaX * 0.008
      rotX += deltaY * 0.008
      rotX = Math.max(-0.1, Math.min(1.2, rotX))

      const radius = 80
      camera.position.x = radius * Math.sin(rotY) * Math.cos(rotX)
      camera.position.z = radius * Math.cos(rotY) * Math.cos(rotX)
      camera.position.y = Math.max(12, radius * Math.sin(rotX) + 20)
      camera.lookAt(0, 6, 0)
    }

    const onMouseUp = () => { isDragging = false }
    const onWheel = (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY * 0.05
      const newY = Math.max(15, Math.min(120, camera.position.y + zoomFactor))
      camera.position.y = newY
      camera.lookAt(0, 6, 0)
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })

    // 11. Animation Loop
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      // Subtle Inversion Lid Opacity Pulse
      if (lidMeshRef.current) {
        lidMeshRef.current.material.opacity = 0.28 + Math.sin(time * 2.2) * 0.06
      }

      // Animate Volumetric Particles
      if (particlesRef.current && particlePositionsRef.current && particleCurvesRef.current.length > 0) {
        const positions = particlePositionsRef.current
        const progressList = particleProgressRef.current

        for (let i = 0; i < progressList.length; i++) {
          const item = progressList[i]
          item.prog += item.speed
          if (item.prog > 1.0) item.prog = 0.0

          const curve = particleCurvesRef.current[item.curveIdx]
          if (curve) {
            const p = curve.getPoint(item.prog)
            positions[i * 3] = p.x
            positions[i * 3 + 1] = p.y
            positions[i * 3 + 2] = p.z
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [profileData])

  // 1-Click Guided Story Mode Tour
  const storySteps = [
    {
      step: 1,
      title: "1. Punjab Farm Fires (Origin)",
      desc: "Farmers ignite thousands of crop stubble fires in Punjab. High fire heat lofts thick smoke upwards into the sky.",
      camPos: { x: -45, y: 25, z: 45 },
      lookAt: { x: -40, y: 5, z: 20 },
      color: "border-amber-500/40 bg-amber-500/10 text-amber-300"
    },
    {
      step: 2,
      title: "2. Smoke Highway (Transport)",
      desc: "Strong North-Westerly winds (18 km/h) push the floating smoke southeast across Haryana towards Delhi.",
      camPos: { x: 0, y: 45, z: 65 },
      lookAt: { x: 0, y: 6, z: 0 },
      color: "border-blue-500/40 bg-blue-500/10 text-blue-300"
    },
    {
      step: 3,
      title: "3. The Inversion Lid (Invisible Ceiling)",
      desc: "At 500m altitude, cold winter air forms an impenetrable ceiling. Smoke cannot escape into the upper clean sky!",
      camPos: { x: 50, y: 20, z: 30 },
      lookAt: { x: 10, y: 8, z: -10 },
      color: "border-purple-500/40 bg-purple-500/10 text-purple-300"
    },
    {
      step: 4,
      title: "4. Delhi Smog Trap (Breathing Level)",
      desc: "Smoke hits the cold lid over Delhi and gets squashed down into the ground breathing zone where 3 Crore people live.",
      camPos: { x: 28, y: 16, z: 5 },
      lookAt: { x: 28, y: 2, z: -22 },
      color: "border-red-500/40 bg-red-500/10 text-red-300"
    }
  ]

  const playStoryStep = (idx) => {
    setActiveStoryStep(idx)
    const step = storySteps[idx]
    if (!cameraRef.current || !step) return
    const cam = cameraRef.current
    cam.position.set(step.camPos.x, step.camPos.y, step.camPos.z)
    cam.lookAt(step.lookAt.x, step.lookAt.y, step.lookAt.z)
  }

  const telemetry = profileData?.telemetry

  return (
    <div className="space-y-6">
      
      {/* 1. Hero Banner with Simple Real-Life Analogy */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-purple-950/50 via-slate-900/70 to-indigo-950/40 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
              <Layers size={13} className="text-purple-300" />
              <span>3D ATMOSPHERIC SCANNER • WHY SMOG GETS TRAPPED</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              3D Atmospheric Altitude Profiler
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              <strong className="text-purple-300">The Simple Analogy:</strong> In winter, cold air creates an invisible <strong className="text-purple-300">"Glass Ceiling" at {telemetry?.blh_m || 500}m height (The Inversion Lid)</strong>. Stubble smoke rises from Punjab, hits this cold ceiling, and gets squashed down into Delhi where people breathe!
            </p>
          </div>

          {/* Key Altitude Stat Pill */}
          <div className="bg-slate-900/90 border border-purple-500/40 px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping"></div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Inversion Lid Ceiling</div>
              <div className="text-xl font-black text-purple-300 font-mono">{telemetry?.blh_m || 500} Meters</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive 1-Click Story Mode Tour (4 Steps) */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Play size={14} className="text-purple-400" /> 1-Click 3D Guided Story Tour
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Click any step to fly the camera!</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {storySteps.map((step, idx) => (
            <button
              key={step.step}
              onClick={() => playStoryStep(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeStoryStep === idx
                  ? `${step.color} shadow-md scale-[1.02]`
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-black">{step.title}</div>
              <div className="text-[11px] mt-1 leading-snug opacity-90">{step.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main 3D Canvas Area (8 Cols) & Simple Altitude Elevator (4 Cols) */}
      <div className="grid grid-cols-12 gap-6">

        {/* 3D WebGL Canvas (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
            
            {/* Top 3D Toggles Bar */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
              <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 pointer-events-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Interactive 3D Hologram</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 pointer-events-auto">
                <button
                  onClick={() => setShowInversionLid(!showInversionLid)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    showInversionLid ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500'
                  }`}
                >
                  🟣 Inversion Lid
                </button>
                <button
                  onClick={() => setShowParticles(!showParticles)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    showParticles ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
                  }`}
                >
                  🔥 Smoke Trail
                </button>
              </div>
            </div>

            {/* 3D Canvas Mount */}
            <div 
              ref={mountRef} 
              className="w-full h-[520px] rounded-2xl cursor-grab active:cursor-grabbing relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-sm text-slate-300 font-bold">Building 3D Atmospheric Volume...</span>
                </div>
              )}
            </div>

            {/* Bottom 3D Helper Pill */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-center bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
              <span className="text-purple-300 font-bold">🟣 Purple Horizontal Plane = The {telemetry?.blh_m || 500}m Cold Inversion Trap Lid</span>
              <span>🖱️ Drag to rotate • Scroll to zoom</span>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Simple Altitude Elevator (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 bg-slate-900/60">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Atmospheric Elevator</span>
                <h3 className="text-sm font-black text-white">What's in the Air at Each Altitude?</h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                {altitudeScrub}m
              </span>
            </div>

            {/* Altitude Slider */}
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={altitudeScrub}
              onChange={(e) => setAltitudeScrub(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />

            {/* 4 Simple Human Altitude Layers */}
            <div className="space-y-2.5 pt-2">
              
              {/* Layer 1: Ground Level */}
              <div 
                onClick={() => setAltitudeScrub(75)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  altitudeScrub <= 150 ? 'bg-red-950/30 border-red-500/50 shadow-md' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    🚶‍♂️ 1. Ground Level (0 - 150m)
                  </span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    TOXIC SMOG
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  <strong>Where we breathe:</strong> 85% of heavy smoke & dust is trapped right at human breathing height.
                </p>
              </div>

              {/* Layer 2: City Skyline */}
              <div 
                onClick={() => setAltitudeScrub(300)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  altitudeScrub > 150 && altitudeScrub <= 450 ? 'bg-amber-950/30 border-amber-500/50 shadow-md' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    🏢 2. City Skyline (150 - 450m)
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    DENSE SMOKE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  High-rise building level where nighttime smoke pools together into thick haze.
                </p>
              </div>

              {/* Layer 3: The Inversion Lid */}
              <div 
                onClick={() => setAltitudeScrub(telemetry?.blh_m || 500)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  altitudeScrub > 450 && altitudeScrub <= 850 ? 'bg-purple-950/40 border-purple-500/60 shadow-lg' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    🛡️ 3. The Inversion Lid ({telemetry?.blh_m || 500}m)
                  </span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                    THE CEILING
                  </span>
                </div>
                <p className="text-[11px] text-purple-200 mt-1 font-medium">
                  <strong>The Cold Glass Ceiling:</strong> Smoke cannot penetrate above this barrier, forcing it to spread sideways over Delhi.
                </p>
              </div>

              {/* Layer 4: Upper Sky */}
              <div 
                onClick={() => setAltitudeScrub(1800)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  altitudeScrub > 850 ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    ✈️ 4. Clean Upper Sky (1000m+)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    PRISTINE AIR
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Where airplanes fly: 100% clean, crisp mountain-quality air completely free from farm smoke!
                </p>
              </div>

            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-purple-400" /> Why does this happen only in winter?
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In summer, the sun heats the ground, and hot air rises up to 2,500m (flushing smoke away). In winter, the ground gets cold at night, trapping cold air underneath warm air — creating the <strong>500m Inversion Lid</strong>.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { 
  Layers, Compass, Activity, Eye, EyeOff, RotateCcw, 
  Maximize2, Wind, Sparkles, Thermometer, CloudRain, 
  ShieldAlert, Info, Flame, MapPin
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Atmospheric3DView() {
  const { selectedDate } = useStore()
  const mountRef = useRef(null)

  // Atmospheric API data
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Interactive 3D layer toggles
  const [showInversionLid, setShowInversionLid] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [showStreamlines, setShowStreamlines] = useState(true)
  const [altitudeScrub, setAltitudeScrub] = useState(500) // in meters

  // Camera preset
  const [activeCameraView, setActiveCameraView] = useState('isometric')

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
    scene.background = new THREE.Color(0x070b14)
    scene.fog = new THREE.FogExp2(0x070b14, 0.007)
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
    const ambientLight = new THREE.AmbientLight(0x38425d, 1.2)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(30, 60, 40)
    scene.add(dirLight)

    // Blue ground glow
    const groundPointLight = new THREE.PointLight(0x4b6bf5, 2.5, 90)
    groundPointLight.position.set(0, 2, 0)
    scene.add(groundPointLight)

    // 5. 3D Regional Ground Mesh & Wireframe
    const groundGeo = new THREE.PlaneGeometry(100, 70, 32, 32)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: false
    })
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.y = 0
    scene.add(groundMesh)

    // Glowing coordinate grid lines
    const gridHelper = new THREE.GridHelper(100, 20, 0x334155, 0x1e293b)
    gridHelper.position.y = 0.05
    scene.add(gridHelper)

    // 6. Inversion Lid (Semi-Transparent Glowing Plane)
    const blhNormY = ((profileData.telemetry?.blh_m || 500) / 2500.0) * 35.0
    const lidGeo = new THREE.PlaneGeometry(100, 70, 16, 16)
    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.2,
      side: THREE.DoubleSide
    })
    const lidMesh = new THREE.Mesh(lidGeo, lidMat)
    lidMesh.rotation.x = -Math.PI / 2
    lidMesh.position.y = blhNormY
    lidMeshRef.current = lidMesh
    scene.add(lidMesh)

    // Inversion Lid Wireframe Frame
    const lidWireGeo = new THREE.WireframeGeometry(lidGeo)
    const lidWireMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.35 })
    const lidWire = new THREE.LineSegments(lidWireGeo, lidWireMat)
    lidWire.rotation.x = -Math.PI / 2
    lidWire.position.y = blhNormY
    scene.add(lidWire)

    // 7. 3D Regional Landmarks (Pins & Beacon Cylinders)
    const landmarkGroup = new THREE.Group()
    profileData.landmarks?.forEach(lm => {
      // Base Marker Pillar
      const pinGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 16)
      const pinMat = new THREE.MeshStandardMaterial({
        color: lm.color || 0x4b6bf5,
        emissive: lm.color || 0x4b6bf5,
        emissiveIntensity: 0.6
      })
      const pinMesh = new THREE.Mesh(pinGeo, pinMat)
      pinMesh.position.set(lm.x, 1.25, -lm.y)
      landmarkGroup.add(pinMesh)

      // Beacon Ring
      const ringGeo = new THREE.RingGeometry(1.2, 1.8, 16)
      const ringMat = new THREE.MeshBasicMaterial({ color: lm.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.position.set(lm.x, 0.1, -lm.y)
      landmarkGroup.add(ringMesh)
    })
    scene.add(landmarkGroup)

    // 8. 3D Streamlines & Animated Smoke Particles
    const streamlineGroup = new THREE.Group()
    const curves = []

    profileData.streamlines?.forEach(stream => {
      const pts3d = stream.points.map(p => new THREE.Vector3(p.x, (p.z / 2500.0) * 35.0, -p.y))
      const curve = new THREE.CatmullRomCurve3(pts3d)
      curves.push(curve)

      // Tube Geometry for streamline
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.35, 8, false)
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.45
      })
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat)
      streamlineGroup.add(tubeMesh)
    })
    particleCurvesRef.current = curves
    scene.add(streamlineGroup)

    // 9. Volumetric Smoke Particles along Streamlines
    const particleCount = 280
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const particleProgress = []

    for (let i = 0; i < particleCount; i++) {
      const curveIdx = i % curves.length
      const prog = Math.random()
      particleProgress.push({ curveIdx, prog, speed: 0.0015 + Math.random() * 0.002 })

      const pos = curves[curveIdx] ? curves[curveIdx].getPoint(prog) : new THREE.Vector3(0, 0, 0)
      particlePositions[i * 3] = pos.x
      particlePositions[i * 3 + 1] = pos.y
      particlePositions[i * 3 + 2] = pos.z

      // Color from warm fire orange to smog purple/grey
      particleColors[i * 3] = 0.95
      particleColors[i * 3 + 1] = 0.45 + (1.0 - prog) * 0.4
      particleColors[i * 3 + 2] = 0.2 + prog * 0.6
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
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
      rotX = Math.max(-0.2, Math.min(1.2, rotX)) // Restrict vertical angle

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

    // 11. Animation Loop (60 FPS)
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      // Pulse Inversion Lid opacity
      if (lidMeshRef.current) {
        lidMeshRef.current.material.opacity = 0.24 + Math.sin(time * 2.0) * 0.06
      }

      // Animate Smoke Particles along 3D CatmullRom Curves
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

    // Resize Handler
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

  // Camera presets
  const switchCameraPreset = (preset) => {
    setActiveCameraView(preset)
    if (!cameraRef.current) return
    const cam = cameraRef.current

    if (preset === 'isometric') {
      cam.position.set(0, 48, 72)
      cam.lookAt(0, 6, 0)
    } else if (preset === 'topdown') {
      cam.position.set(0, 95, 5)
      cam.lookAt(0, 0, 0)
    } else if (preset === 'delhi_basin') {
      cam.position.set(28, 16, -10)
      cam.lookAt(28, 4, -22)
    } else if (preset === 'cross_section') {
      cam.position.set(80, 15, 0)
      cam.lookAt(0, 8, 0)
    }
  }

  // Toggle Visibility Handlers
  useEffect(() => {
    if (lidMeshRef.current) lidMeshRef.current.visible = showInversionLid
  }, [showInversionLid])

  useEffect(() => {
    if (particlesRef.current) particlesRef.current.visible = showParticles
  }, [showParticles])

  const telemetry = profileData?.telemetry
  const activeLayer = profileData?.layers?.find(
    l => altitudeScrub <= l.altitude_m + 150 && altitudeScrub >= l.altitude_m - 150
  ) || profileData?.layers?.[2]

  // Chart data for Skew-T Temperature Inversion Sounding
  const soundingChartData = profileData?.sounding_profile?.altitudes_m?.map((alt, idx) => ({
    altitude: alt,
    temperature: profileData.sounding_profile.temperatures_c[idx],
    pm25: profileData.sounding_profile.pm25_concentrations[idx],
    humidity: profileData.sounding_profile.humidities_pct[idx]
  })) || []

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers size={20} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold theme-adapt-text tracking-tight flex items-center gap-2">
                3D Atmospheric Sounding & Altitude Volume Profiler
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase tracking-wider">
                  Three.js WebGL 3D
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Volumetric vertical profiling demonstrating Planetary Boundary Layer (PBL) thermal inversion lid, Briggs plume rise, and smoke trapping.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Status Pills */}
        {telemetry && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">Inversion Lid:</span>
              <span className="text-purple-400 font-bold">{telemetry.blh_m} m</span>
            </div>
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">Inversion Strength:</span>
              <span className="text-amber-400 font-bold">+{telemetry.inversion_strength_c} °C</span>
            </div>
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">Status:</span>
              <span className="text-red-400 font-bold">{telemetry.inversion_status}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main 3D Canvas + Slicing Controls (8 Cols) & Vertical Sounding Chart (4 Cols) */}
      <div className="grid grid-cols-12 gap-6">

        {/* 3D WebGL Canvas Container (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border border-slate-800">
            
            {/* Top Overlay Controls Bar */}
            <div className="absolute top-6 left-6 right-6 z-10 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
              {/* Camera Presets */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 pointer-events-auto">
                <span className="text-[9px] font-bold text-slate-500 uppercase px-1.5">Camera:</span>
                {[
                  { id: 'isometric', label: 'Isometric 3D' },
                  { id: 'delhi_basin', label: 'Delhi Receptor' },
                  { id: 'cross_section', label: 'Plume Axis' },
                  { id: 'topdown', label: 'Top View' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => switchCameraPreset(p.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      activeCameraView === p.id 
                        ? 'bg-[#4b6bf5] text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Layer Visibility Toggles */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 pointer-events-auto">
                <button
                  onClick={() => setShowInversionLid(!showInversionLid)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    showInversionLid ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500'
                  }`}
                  title="Toggle Inversion Lid Ceiling"
                >
                  <Layers size={11} /> Inversion Lid
                </button>
                <button
                  onClick={() => setShowParticles(!showParticles)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    showParticles ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500'
                  }`}
                  title="Toggle Smoke Particles"
                >
                  <Sparkles size={11} /> Smoke Particles
                </button>
              </div>
            </div>

            {/* 3D WebGL Canvas Mount */}
            <div 
              ref={mountRef} 
              className="w-full h-[520px] rounded-xl cursor-grab active:cursor-grabbing relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-sm text-slate-400 font-semibold">Generating 3D Atmospheric Volume...</span>
                </div>
              )}
            </div>

            {/* Bottom Floating Legend / Interaction Hint */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 font-mono pointer-events-none">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Purple Plane: Nocturnal Inversion Ceiling (BLH: {telemetry?.blh_m}m)
              </span>
              <span>🖱️ Drag to Orbit • Scroll to Zoom • Right-click to Pan</span>
            </div>

          </div>

          {/* Interactive Altitude Slicer Slider */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Compass size={14} className="text-[#4b6bf5]" /> Vertical Altitude Slicer
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                Altitude: {altitudeScrub} meters
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="2500"
              step="25"
              value={altitudeScrub}
              onChange={(e) => setAltitudeScrub(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Ground (0m)</span>
              <span>Nocturnal Layer (300m)</span>
              <span className="text-purple-400 font-bold">Inversion Lid ({telemetry?.blh_m}m)</span>
              <span>Plume Channel (1000m)</span>
              <span>Free Troposphere (2500m)</span>
            </div>

            {/* Active Altitude Slice Card */}
            {activeLayer && (
              <div className="mt-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeLayer.color }}></span>
                    <span className="text-xs font-bold text-white">{activeLayer.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({activeLayer.alt_range})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{activeLayer.description}</p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-extrabold text-purple-400">PM2.5: ~{activeLayer.pm25_avg} µg</div>
                  <div className="text-[10px] text-slate-400">{activeLayer.temp_c}°C Ambient</div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Skew-T Sounding Profile Chart & Layers Breakdown (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          
          {/* Skew-T Temperature Inversion Chart */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Atmospheric Physics</span>
                <h3 className="text-sm font-black text-white tracking-tight">Vertical Sounding Profile T(z)</h3>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                dT/dz Inversion
              </span>
            </div>

            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={soundingChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="temperature" unit="°C" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="altitude" unit="m" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 2500]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val, name) => [name === 'temperature' ? `${val} °C` : `${val} µg`, name]}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Temperature" />
                  <Line type="monotone" dataKey="pm25" stroke="#f97316" strokeWidth={2} dot={false} name="PM2.5 Conc" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
              <span className="text-purple-400 font-bold">Inversion Cap (400-650m):</span> Temperature increases with altitude, creating an impenetrable lid that traps ground smoke.
            </div>
          </div>

          {/* 5 Altitude Strata Breakdown */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-2">
              Atmospheric Stratification
            </span>

            <div className="space-y-2">
              {profileData?.layers?.map((layer) => (
                <div 
                  key={layer.id}
                  onClick={() => setAltitudeScrub(layer.altitude_m)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    altitudeScrub <= layer.altitude_m + 150 && altitudeScrub >= layer.altitude_m - 150
                      ? 'bg-purple-950/25 border-purple-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }}></span>
                      <span className="text-xs font-bold text-slate-200">{layer.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{layer.alt_range}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                    <span className="text-slate-500">{layer.status}</span>
                    <span className="text-purple-300 font-bold">~{layer.pm25_avg} µg/m³</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

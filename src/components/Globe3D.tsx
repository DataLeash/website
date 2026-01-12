'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Extended interface to match AccessLocation but only use what we need
interface GlobeLocation {
    id: string
    lat: number
    lon: number
    city: string
    country: string
    countryCode?: string
    isActive: boolean
    isBlocked: boolean
    viewerCount: number
    lastAccess?: string
    files?: string[]
}

interface Globe3DProps {
    locations: GlobeLocation[]
    onLocationClick?: (location: GlobeLocation) => void
    isAttackMode?: boolean
}

// NASA Blue Marble texture URLs
const EARTH_TEXTURE_URL = '/textures/earth-blue-marble.jpg'
const EARTH_TOPOLOGY_URL = '/textures/earth-topology.png'

export function Globe3D({ locations, onLocationClick, isAttackMode = false }: Globe3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<{
        scene: THREE.Scene
        camera: THREE.PerspectiveCamera
        renderer: THREE.WebGLRenderer
        globe: THREE.Mesh
        pins: THREE.Group
        arcs: THREE.Group
        frameId: number
    } | null>(null)
    const [hoveredLocation, setHoveredLocation] = useState<GlobeLocation | null>(null)
    const [textureLoaded, setTextureLoaded] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight

        // Scene setup
        const scene = new THREE.Scene()
        // Darker, more professional background/fog integration handled by gradient wrapper, keep scene transparent

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.z = 3.6 // Slightly tighter zoom
        camera.position.y = 0 // Center globe vertically
        camera.lookAt(0, 0, 0)

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Cap at 1.5x for performance
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2 // Brightened exposure
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0'
        renderer.domElement.style.left = '0'
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        container.appendChild(renderer.domElement)

        // Lighting - Needs to be much brighter to avoid "Black Ball" effect
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5) // High ambient
        scene.add(ambientLight)

        // Front Fill Light (Crucial for visibility)
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.2)
        frontLight.position.set(0, 0, 10)
        scene.add(frontLight)

        // Sun light (Top Right)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0)
        sunLight.position.set(5, 5, 5)
        scene.add(sunLight)

        // Rim lighting (Blue edge)
        const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.5)
        rimLight.position.set(-5, 0, -5)
        scene.add(rimLight)

        // Texture loader
        const textureLoader = new THREE.TextureLoader()

        // 1. Earth Sphere (Base) - Reduced segments for performance
        const earthGeometry = new THREE.SphereGeometry(1, 40, 40)
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('/textures/earth-day.jpg'),
            normalMap: textureLoader.load('/textures/earth-normal.jpg'),
            specularMap: textureLoader.load('/textures/earth-specular.jpg'),
            specular: new THREE.Color(0x333333),
            shininess: 15,
            color: 0xffffff,
            emissive: 0x112244, // Add slight blue glow to avoid pitch black
            emissiveIntensity: 0.1
        })
        const globe = new THREE.Mesh(earthGeometry, earthMaterial)
        globe.rotation.y = -Math.PI / 2
        scene.add(globe)

        // 2. Clouds Sphere (Layer) - Reduced segments
        const cloudGeometry = new THREE.SphereGeometry(1.015, 40, 40) // Slightly tighter fit
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('/textures/earth-clouds.jpg'),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
        })
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
        globe.add(clouds) // Attach to globe so they rotate together (or slightly different if we animate)

        if (sceneRef.current) {
            const { scene } = sceneRef.current
            // Remove old if exists (simplified logic as we are re-mounting usually)
            // But let's keep the ref update clean
            sceneRef.current.globe = globe
        }
        setTextureLoaded(true)

        // Sharper Atmosphere (No fuzzy glow) - Reduced segments
        const atmosphereGeometry = new THREE.SphereGeometry(1.1, 40, 40)
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x3b82f6) },
                viewVector: { value: new THREE.Vector3(0, 0, 3.6) } // Match camera z
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.6 - dot(vNormal, vNormel), 4.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float intensity;
                void main() {
                    gl_FragColor = vec4(color, intensity * 0.9);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        scene.add(atmosphere)

        // Starfield - Subtle, distinct points
        const starsGeometry = new THREE.BufferGeometry()
        const starPositions: number[] = []
        for (let i = 0; i < 2000; i++) {
            const r = 20 + Math.random() * 30
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            )
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
        const starsMaterial = new THREE.PointsMaterial({
            color: 0x64748b, // Slate-500
            size: 0.05,
            transparent: true,
            opacity: 0.6
        })
        const stars = new THREE.Points(starsGeometry, starsMaterial)
        scene.add(stars)

        // Groups
        const pins = new THREE.Group() // Data beams
        scene.add(pins)

        const arcs = new THREE.Group() // Network lines
        scene.add(arcs)

        // Placeholder globe for immediate render

        sceneRef.current = {
            scene,
            camera,
            renderer,
            globe,
            pins,
            arcs,
            frameId: 0
        }

        // Interaction
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let isDragging = false
        let previousMouse = { x: 0, y: 0 }
        let autoRotate = true
        let rotationVelocity = 0

        const onClick = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

            // Check beam intersection (traverse up from mesh to group)
            const beamMeshes: THREE.Object3D[] = []
            pins.children.forEach(g => beamMeshes.push(...g.children))

            const intersects = raycaster.intersectObjects(beamMeshes)
            if (intersects.length > 0) {
                let obj = intersects[0].object
                while (obj.parent && obj.parent !== pins) {
                    obj = obj.parent
                }
                const locData = (obj.userData as { location?: GlobeLocation }).location
                if (locData && onLocationClick) {
                    onLocationClick(locData)
                }
            }
        }

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true
            autoRotate = false
            previousMouse = { x: e.clientX, y: e.clientY }
        }

        const onMouseUp = () => {
            isDragging = false
            setTimeout(() => { autoRotate = true }, 5000) // Longer delay before resuming
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging && sceneRef.current?.globe) {
                const deltaX = e.clientX - previousMouse.x
                const deltaY = e.clientY - previousMouse.y
                sceneRef.current.globe.rotation.y += deltaX * 0.003
                sceneRef.current.globe.rotation.x += deltaY * 0.003
                sceneRef.current.globe.rotation.x = Math.max(-0.5, Math.min(0.5, sceneRef.current.globe.rotation.x))
                sceneRef.current.pins.rotation.copy(sceneRef.current.globe.rotation)
                sceneRef.current.arcs.rotation.copy(sceneRef.current.globe.rotation)
                previousMouse = { x: e.clientX, y: e.clientY }
            }

            // Hover
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

            // Check intersections with beam cylinders (children of pins are Groups, need to check mesh children)
            // Simplified: Checking standard intersection
            const beamMeshes: THREE.Object3D[] = []
            pins.children.forEach(g => beamMeshes.push(...g.children))

            const intersects = raycaster.intersectObjects(beamMeshes)
            if (intersects.length > 0) {
                // Traverse up to find the group with user data
                let obj = intersects[0].object
                while (obj.parent && obj.parent !== pins) {
                    obj = obj.parent
                }
                const locData = (obj.userData as { location?: GlobeLocation }).location
                if (locData) setHoveredLocation(locData)
                container.style.cursor = 'pointer'
            } else {
                setHoveredLocation(null)
                container.style.cursor = isDragging ? 'grabbing' : 'grab'
            }
        }

        container.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mouseup', onMouseUp) // Window to catch release outside
        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('mouseleave', onMouseUp)
        container.addEventListener('click', onClick)

        // Animation Loop
        const animate = () => {
            sceneRef.current!.frameId = requestAnimationFrame(animate)

            if (sceneRef.current?.globe) {
                if (autoRotate) {
                    sceneRef.current.globe.rotation.y += 0.0005 // Very slow, majestic rotation

                    // Independent Cloud Rotation (Parallax)
                    const clouds = sceneRef.current.globe.children.find(c => c.userData.isClouds)
                    if (clouds) {
                        clouds.rotation.y += 0.0002 // Clouds move slightly faster/different than earth
                    }
                }
                sceneRef.current.pins.rotation.copy(sceneRef.current.globe.rotation)
                sceneRef.current.arcs.rotation.copy(sceneRef.current.globe.rotation)
            }

            // Animate Packets along Arcs
            if (sceneRef.current?.arcs) {
                sceneRef.current.arcs.children.forEach((arcGroup) => {
                    const data = arcGroup.userData
                    if (data && data.curve && data.packet) {
                        data.progress += data.speed
                        if (data.progress >= 1) {
                            data.progress = 0
                            // Impact Ripple Effect
                            // We need to spawn a ripple at the end position
                            const endPoint = data.curve.getPoint(1)
                            spawnRipple(scene, endPoint, data.color)
                        }
                        const point = data.curve.getPoint(data.progress)
                        data.packet.position.copy(point)
                    }
                })
            }

            // Animate Ripples
            // We'll store ripples in a userData array on the scene or a separate group
            // For simplicity, let's look for objects with "isRipple" flag
            for (let i = scene.children.length - 1; i >= 0; i--) {
                const obj = scene.children[i]
                if (obj.userData.isRipple) {
                    const s = obj.scale.x + 0.02
                    obj.scale.setScalar(s)
                    const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
                    mat.opacity -= 0.02
                    if (mat.opacity <= 0) {
                        scene.remove(obj)
                            ; (obj.geometry as THREE.RingGeometry).dispose()
                        mat.dispose()
                    }
                }
            }

            // Pulse effect for Holographic Rings
            const time = Date.now() * 0.001
            pins.children.forEach((pinGroup, i) => {
                const ring = pinGroup.userData.ring as THREE.Mesh
                if (ring) {
                    const s = 1 + Math.sin(time * 3 + i) * 0.2
                    ring.scale.setScalar(s)
                        ; (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 - (s - 1)
                }
            })

            renderer.render(scene, camera)
        }
        animate()

        // Dynamic Arc Regeneration (The "Jump" effect)
        // Every few seconds, rebuild some arcs to change the network topology
        const regenInterval = setInterval(() => {
            if (!sceneRef.current?.arcs || locations.length < 2) return
            const { arcs } = sceneRef.current
            const activeLocs = locations.filter(l => l.isActive)

            // Allow larger pool of arcs
            if (arcs.children.length < 20) {
                // Add new ones
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start.id !== end.id) {
                    arcs.add(createAnimatedArc(start, end, isAttackMode))
                }
            } else {
                // Replace one random arc to shift traffic
                const indexToRemove = Math.floor(Math.random() * arcs.children.length)
                const oldArc = arcs.children[indexToRemove]
                arcs.remove(oldArc)

                // Add replacement
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start.id !== end.id) {
                    arcs.add(createAnimatedArc(start, end, isAttackMode))
                }
            }
        }, 300) // Fast updates for "Busy" feel

        // Handle resize properly
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                if (width && height) {
                    camera.aspect = width / height
                    camera.updateProjectionMatrix()
                    renderer.setSize(width, height)
                }
            }
        })
        resizeObserver.observe(container)

        return () => {
            cancelAnimationFrame(sceneRef.current?.frameId || 0)
            resizeObserver.disconnect()
            container.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mouseleave', onMouseUp)
            container.removeEventListener('click', onClick)

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
            renderer.dispose()
            clearInterval(regenInterval)
        }
    }, [])

    // Update markers
    useEffect(() => {
        if (!sceneRef.current) return
        const { pins, arcs, globe } = sceneRef.current

        // Clear existing
        pins.clear()
        arcs.clear()

        // Create Beams
        const activeLocs = locations.filter(l => l.isActive)
        locations.forEach(loc => {
            const beam = createDataBeam(loc)
            beam.userData.location = loc
            pins.add(beam)
        })

        // Create Arcs (Network connections)
        // Connect some random nodes to each other to visualize traffic
        if (activeLocs.length > 1) {
            for (let i = 0; i < 20; i++) { // Start with 20, regeneration will churn them
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start.id !== end.id) {
                    const arc = createAnimatedArc(start, end, isAttackMode)
                    arcs.add(arc)
                }
            }
        }

        if (globe) {
            pins.rotation.copy(globe.rotation)
            arcs.rotation.copy(globe.rotation)
        }

    }, [locations, isAttackMode])

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Tooltip */}
            {hoveredLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[150%] pointer-events-none z-20">
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl text-left min-w-[150px]">
                        <div className="text-xs text-slate-400 font-mono mb-1">ID: {hoveredLocation.id}</div>
                        <div className="text-sm font-bold text-white mb-1">{hoveredLocation.city}, {hoveredLocation.country}</div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${hoveredLocation.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className={hoveredLocation.isBlocked ? 'text-red-400' : 'text-green-400'}>
                                {hoveredLocation.isBlocked ? 'THREAT BLOCKED' : 'SECURE LINK'}
                            </span>
                        </div>
                    </div>
                    {/* Tail */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-700 mx-auto" />
                </div>
            )}
        </div>
    )
}

// ---------------- Helpers ----------------

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    // Phi (Lat): 90 at North Pole (0), -90 at South Pole (PI). 
    // Three.js Standard: Phi is angle from +Y axis (0 at North, PI at South).
    const phi = (90 - lat) * (Math.PI / 180)

    // Theta (Lon): -180 to 180.
    // Three.js Standard: Theta starts at +Z and rotates counter-clockwise around Y.
    // We usually need an offset to match the texture (Greenwich at Z).
    const theta = (lon + 180) * (Math.PI / 180) // +180 to prevent negative mods, generally aligns UVs

    // Spherical to Cartesian
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = (radius * Math.sin(phi) * Math.sin(theta))
    const y = (radius * Math.cos(phi))

    return new THREE.Vector3(x, y, z)
}

function createDataBeam(loc: GlobeLocation): THREE.Group {
    const group = new THREE.Group()
    const pos = latLonToVector3(loc.lat, loc.lon, 1.0)

    const color = loc.isBlocked ? 0xff3333 : (loc.isActive ? 0x00ff88 : 0x0099ff)

    // 1. Core Data Point
    const geometry = new THREE.SphereGeometry(0.008, 12, 12)
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
    })
    const dot = new THREE.Mesh(geometry, material)
    group.add(dot)

    // 2. Holographic Ring
    if (loc.isActive) {
        const ringGeo = new THREE.RingGeometry(0.015, 0.02, 32)
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.lookAt(pos.clone().multiplyScalar(1.1)) // Face outward
        group.add(ring)
        group.userData.ring = ring
    }

    // 3. Laser Line
    if (loc.isActive || loc.isBlocked) {
        const height = loc.viewerCount * 0.002 + 0.08
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, height, 0)
        ])
        const lineMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            linewidth: 1
        })
        const line = new THREE.Line(lineGeo, lineMat)
        line.lookAt(pos.clone().multiplyScalar(1.1))
        line.rotation.x = Math.PI / 2

        group.add(line)
    }

    // Position Group
    group.position.copy(pos)

    // Orient the huge group so "up" is away from center
    // We use lookAt to align the group's Z axis to the position vector
    group.lookAt(pos.clone().multiplyScalar(2))

    return group
}

// Palette for "Neon/Cyberpunk" look
const SECURE_COLORS = [
    0x00f3ff, // Neon Cyan
    0x2196f3, // Electric Blue
    0x8b5cf6, // Violet
]

const ATTACK_COLORS = [
    0xff0000, // Pure Red
    0xff3333, // Bright Red
    0xff5500, // Orange Red
]

function spawnRipple(scene: THREE.Scene, position: THREE.Vector3, color: number) {
    const geometry = new THREE.RingGeometry(0, 0.05, 32)
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    })
    const ripple = new THREE.Mesh(geometry, material)
    ripple.position.copy(position)
    ripple.lookAt(position.clone().multiplyScalar(2)) // Face outward
    ripple.userData.isRipple = true
    scene.add(ripple)
}

function createAnimatedArc(start: GlobeLocation, end: GlobeLocation, isAttackMode: boolean): THREE.Group {
    const group = new THREE.Group()

    const startPos = latLonToVector3(start.lat, start.lon, 1.0)
    const endPos = latLonToVector3(end.lat, end.lon, 1.0)
    const dist = startPos.distanceTo(endPos)
    const controlHeight = dist * 0.5 + 1.1

    const mid = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(controlHeight)
    const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos)

    // 1. The Line Path
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    // Mode-dependent Color
    const palette = isAttackMode ? ATTACK_COLORS : SECURE_COLORS
    const color = palette[Math.floor(Math.random() * palette.length)]

    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: isAttackMode ? 0.35 : 0.25,
        linewidth: 1,
        blending: THREE.AdditiveBlending
    })
    const line = new THREE.Line(geometry, material)
    group.add(line)

    // 2. The Data Packet (Glowing "Arrow"/Particle) - Larger, brighter
    const packetGeo = new THREE.SphereGeometry(0.015, 8, 8)
    const packetMat = new THREE.MeshBasicMaterial({
        color: color,
        toneMapped: false, // Super bright
    })
    const packet = new THREE.Mesh(packetGeo, packetMat)

    // Store animation state in userData
    group.userData = {
        curve: curve,
        packet: packet,
        progress: 0,
        speed: 0.005 + Math.random() * 0.015, // Faster packets
        color: color // Store color for ripple
    }

    group.add(packet)
    return group
}

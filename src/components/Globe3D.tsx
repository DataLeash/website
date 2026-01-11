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
}

// NASA Blue Marble texture URLs (public domain, hosted on various CDNs)
const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
const EARTH_NIGHT_URL = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg'
const EARTH_TOPOLOGY_URL = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png'

export function Globe3D({ locations, onLocationClick }: Globe3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<{
        scene: THREE.Scene
        camera: THREE.PerspectiveCamera
        renderer: THREE.WebGLRenderer
        globe: THREE.Mesh
        clouds: THREE.Mesh
        pins: THREE.Group
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
        scene.background = new THREE.Color(0x000510)

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.z = 2.5

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2
        container.appendChild(renderer.domElement)

        // Lighting for realistic look
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
        scene.add(ambientLight)

        // Sun light
        const sunLight = new THREE.DirectionalLight(0xffffff, 2)
        sunLight.position.set(5, 3, 5)
        scene.add(sunLight)

        // Rim lighting
        const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.3)
        rimLight.position.set(-5, 0, -5)
        scene.add(rimLight)

        // Texture loader
        const textureLoader = new THREE.TextureLoader()

        // Create Earth sphere with realistic NASA texture
        const geometry = new THREE.SphereGeometry(1, 128, 128)

        // Load textures
        textureLoader.load(
            EARTH_TEXTURE_URL,
            (dayTexture) => {
                dayTexture.colorSpace = THREE.SRGBColorSpace
                dayTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

                // Load bump/topology map
                textureLoader.load(EARTH_TOPOLOGY_URL, (bumpTexture) => {
                    const earthMaterial = new THREE.MeshPhongMaterial({
                        map: dayTexture,
                        bumpMap: bumpTexture,
                        bumpScale: 0.02,
                        specular: new THREE.Color(0x333333),
                        shininess: 5
                    })

                    const globe = new THREE.Mesh(geometry, earthMaterial)
                    scene.add(globe)

                    // Store reference
                    if (sceneRef.current) {
                        sceneRef.current.globe = globe
                    }

                    setTextureLoaded(true)
                })
            },
            undefined,
            () => {
                // Fallback to procedural if texture fails
                console.log('Using fallback Earth material')
                const fallbackMaterial = new THREE.MeshPhongMaterial({
                    color: 0x1a5276,
                    specular: 0x333333,
                    shininess: 5
                })
                const globe = new THREE.Mesh(geometry, fallbackMaterial)
                scene.add(globe)
                if (sceneRef.current) {
                    sceneRef.current.globe = globe
                }
                setTextureLoaded(true)
            }
        )

        // Atmosphere glow (outer)
        const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64)
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 color = vec3(0.3, 0.6, 1.0);
                    gl_FragColor = vec4(color, intensity * 0.6);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        scene.add(atmosphere)

        // Inner atmosphere glow 
        const innerAtmosphereGeometry = new THREE.SphereGeometry(1.02, 64, 64)
        const innerAtmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                    vec3 color = vec3(0.1, 0.4, 0.8);
                    gl_FragColor = vec4(color, intensity * 0.4);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            transparent: true,
            depthWrite: false
        })
        const innerAtmosphere = new THREE.Mesh(innerAtmosphereGeometry, innerAtmosphereMaterial)
        scene.add(innerAtmosphere)

        // Stars background with varying sizes
        const starsGeometry = new THREE.BufferGeometry()
        const starPositions: number[] = []
        const starSizes: number[] = []
        for (let i = 0; i < 5000; i++) {
            const r = 50 + Math.random() * 50
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            )
            starSizes.push(Math.random() * 0.5 + 0.1)
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
        starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1))

        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        })
        const stars = new THREE.Points(starsGeometry, starsMaterial)
        scene.add(stars)

        // Pin group
        const pins = new THREE.Group()
        scene.add(pins)

        // Placeholder globe
        const placeholderMaterial = new THREE.MeshPhongMaterial({ color: 0x1a5276 })
        const placeholderGlobe = new THREE.Mesh(geometry.clone(), placeholderMaterial)

        // Store refs
        sceneRef.current = {
            scene,
            camera,
            renderer,
            globe: placeholderGlobe,
            clouds: placeholderGlobe,
            pins,
            frameId: 0
        }

        // Mouse interaction
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let isDragging = false
        let previousMouse = { x: 0, y: 0 }
        let autoRotate = true
        let rotationVelocity = 0

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true
            autoRotate = false
            previousMouse = { x: e.clientX, y: e.clientY }
        }

        const onMouseUp = () => {
            isDragging = false
            setTimeout(() => { autoRotate = true }, 3000)
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging && sceneRef.current?.globe) {
                const deltaX = e.clientX - previousMouse.x
                const deltaY = e.clientY - previousMouse.y

                sceneRef.current.globe.rotation.y += deltaX * 0.005
                sceneRef.current.globe.rotation.x += deltaY * 0.003
                sceneRef.current.globe.rotation.x = Math.max(-0.5, Math.min(0.5, sceneRef.current.globe.rotation.x))

                sceneRef.current.pins.rotation.y = sceneRef.current.globe.rotation.y
                sceneRef.current.pins.rotation.x = sceneRef.current.globe.rotation.x

                rotationVelocity = deltaX * 0.001
                previousMouse = { x: e.clientX, y: e.clientY }
            }

            // Hover detection
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

            const intersects = raycaster.intersectObjects(pins.children, true)
            if (intersects.length > 0) {
                const pin = intersects[0].object
                const locData = (pin.userData as { location?: GlobeLocation }).location
                if (locData) setHoveredLocation(locData)
                container.style.cursor = 'pointer'
            } else {
                setHoveredLocation(null)
                container.style.cursor = isDragging ? 'grabbing' : 'grab'
            }
        }

        const onClick = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

            const intersects = raycaster.intersectObjects(pins.children, true)
            if (intersects.length > 0) {
                const locData = (intersects[0].object.userData as { location?: GlobeLocation }).location
                if (locData && onLocationClick) {
                    onLocationClick(locData)
                }
            }
        }

        container.addEventListener('mousedown', onMouseDown)
        container.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('mouseleave', onMouseUp)
        container.addEventListener('click', onClick)

        // Animation loop
        const animate = () => {
            sceneRef.current!.frameId = requestAnimationFrame(animate)

            if (sceneRef.current?.globe) {
                if (autoRotate) {
                    sceneRef.current.globe.rotation.y += 0.001
                    rotationVelocity *= 0.95
                }
                sceneRef.current.pins.rotation.y = sceneRef.current.globe.rotation.y
                sceneRef.current.pins.rotation.x = sceneRef.current.globe.rotation.x
            }

            // Animate pins
            const time = Date.now() * 0.001
            pins.children.forEach((pin, i) => {
                const userData = pin.userData as { location?: GlobeLocation }
                if (userData.location?.isActive) {
                    const scale = 1 + Math.sin(time * 3 + i) * 0.2
                    pin.scale.setScalar(scale)
                }
            })

            // Subtle star twinkle
            stars.rotation.y += 0.0001

            renderer.render(scene, camera)
        }
        animate()

        // Handle resize
        const handleResize = () => {
            const w = container.clientWidth
            const h = container.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            cancelAnimationFrame(sceneRef.current?.frameId || 0)
            container.removeEventListener('mousedown', onMouseDown)
            container.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mouseleave', onMouseUp)
            container.removeEventListener('click', onClick)
            window.removeEventListener('resize', handleResize)
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [onLocationClick])

    // Update pins when locations change
    useEffect(() => {
        if (!sceneRef.current) return

        const { pins, globe } = sceneRef.current

        // Clear existing pins
        while (pins.children.length) {
            const pin = pins.children[0]
            pins.remove(pin)
        }

        // Add new pins
        locations.forEach((loc) => {
            const pin = createLocationPin(loc)
            pin.userData.location = loc
            pins.add(pin)
        })

        // Sync rotation
        if (globe) {
            pins.rotation.copy(globe.rotation)
        }

    }, [locations])

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full cursor-grab" />

            {/* Loading overlay */}
            {!textureLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-cyan-400">Loading Earth...</p>
                    </div>
                </div>
            )}

            {/* Hover tooltip */}
            {hoveredLocation && (
                <div className="absolute top-4 left-4 glass-card p-3 pointer-events-none z-10 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${hoveredLocation.isBlocked ? 'bg-red-500' :
                            hoveredLocation.isActive ? 'bg-green-500 animate-pulse' : 'bg-cyan-500'
                            }`} />
                        <span className="font-bold">{hoveredLocation.city}, {hoveredLocation.country}</span>
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                        {hoveredLocation.viewerCount} viewer{hoveredLocation.viewerCount !== 1 ? 's' : ''}
                        {hoveredLocation.isActive && <span className="text-green-400 ml-1">● Live</span>}
                    </div>
                </div>
            )}

            {/* Controls hint */}
            <div className="absolute bottom-4 right-4 text-xs text-[var(--foreground-muted)] bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                🖱️ Drag to rotate • Click pin for details
            </div>

            {/* Stats overlay */}
            <div className="absolute top-4 right-4 text-xs text-[var(--foreground-muted)] bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg">
                <span className="text-cyan-400 font-bold">{locations.length}</span> locations tracked
            </div>
        </div>
    )
}

// Create location pin with 3D depth
function createLocationPin(loc: GlobeLocation): THREE.Group {
    // Standard spherical coordinate conversion for lat/lon
    // Latitude: -90 (south pole) to +90 (north pole)
    // Longitude: -180 to +180

    // Convert to radians
    const latRad = loc.lat * (Math.PI / 180)
    const lonRad = -loc.lon * (Math.PI / 180) // Negative because globe texture is mirrored

    // Spherical to Cartesian (radius = 1)
    // Y is up, X is right, Z is towards camera
    const x = Math.cos(latRad) * Math.sin(lonRad)
    const y = Math.sin(latRad)
    const z = Math.cos(latRad) * Math.cos(lonRad)

    const pinGroup = new THREE.Group()

    // Base size
    const baseSize = 0.015 + Math.min(loc.viewerCount * 0.003, 0.02)

    // Color based on status
    let color = 0x00d4ff // Cyan
    let glowColor = 0x00d4ff
    if (loc.isBlocked) {
        color = 0xff3333
        glowColor = 0xff0000
    } else if (loc.isActive) {
        color = 0x00ff88
        glowColor = 0x00ff88
    }

    // Main pin sphere
    const pinGeometry = new THREE.SphereGeometry(baseSize, 16, 16)
    const pinMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1
    })
    const pin = new THREE.Mesh(pinGeometry, pinMaterial)

    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(baseSize * 2, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.3
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)

    // Outer glow for active
    if (loc.isActive && !loc.isBlocked) {
        const outerGlowGeometry = new THREE.SphereGeometry(baseSize * 3.5, 16, 16)
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.15
        })
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial)
        pinGroup.add(outerGlow)
    }

    // Spike/beam pointing outward
    const spikeGeometry = new THREE.ConeGeometry(baseSize * 0.5, baseSize * 4, 8)
    const spikeMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.6
    })
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial)
    spike.position.set(0, baseSize * 2, 0)

    pinGroup.add(glow)
    pinGroup.add(pin)
    pinGroup.add(spike)

    // Position on globe surface (slightly above to be visible)
    const surfaceDistance = 1.02
    pinGroup.position.set(x * surfaceDistance, y * surfaceDistance, z * surfaceDistance)

    // Orient spike to point outward from center
    pinGroup.lookAt(0, 0, 0)
    pinGroup.rotateX(Math.PI)

    return pinGroup
}

export default Globe3D

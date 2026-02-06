'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

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

export function Globe3D({ locations, onLocationClick, isAttackMode = false }: Globe3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<{
        scene: THREE.Scene
        camera: THREE.PerspectiveCamera
        renderer: THREE.WebGLRenderer
        composer: EffectComposer
        globe: THREE.Mesh
        pins: THREE.Group
        arcs: THREE.Group
        frameId: number
    } | null>(null)
    const [hoveredLocation, setHoveredLocation] = useState<GlobeLocation | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight

        // Scene setup
        const scene = new THREE.Scene()

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.z = 3.5
        camera.position.y = 0.5
        camera.lookAt(0, 0, 0)

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, // Transparent
            powerPreference: 'high-performance',
            stencil: false
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.0
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(0x000000, 0) // Clear to transparent
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0'
        renderer.domElement.style.left = '0'
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        container.appendChild(renderer.domElement)

        // Post-Processing (Bloom) - Transparent Target
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat, // Force Alpha Channel
            colorSpace: THREE.SRGBColorSpace,
            samples: 4 // MSAA if possible
        })

        const renderScene = new RenderPass(scene, camera)
        renderScene.clearColor = new THREE.Color(0, 0, 0)
        renderScene.clearAlpha = 0
        renderScene.clear = true

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
        bloomPass.threshold = 0.6
        bloomPass.strength = 0.35 // Subtle boost for lines
        bloomPass.radius = 0.3

        const composer = new EffectComposer(renderer, renderTarget)
        composer.renderToScreen = true
        composer.addPass(renderScene)
        composer.addPass(bloomPass)

        // Lighting - Adjusted for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5) // Increased from 0.2 to 1.5 to make "dark side" visible
        scene.add(ambientLight)

        const sunPosition = new THREE.Vector3(2, 5, 8) // Moved to front-top
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0)
        sunLight.position.copy(sunPosition)
        scene.add(sunLight)

        const rimLight = new THREE.DirectionalLight(0x4455ff, 1.5)
        rimLight.position.set(-5, 0, 2) // Side rim light for depth
        scene.add(rimLight)

        // Texture loader
        const textureLoader = new THREE.TextureLoader()
        
        // Base path for assets (works both locally and on GitHub Pages)
        const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/website') ? '/website' : ''

        // 1. Earth Sphere (Max Realism)
        const earthGeometry = new THREE.SphereGeometry(1, 64, 64)
        const earthMaterial = new THREE.MeshPhysicalMaterial({
            map: textureLoader.load(`${basePath}/textures/earth-day.jpg`),
            normalMap: textureLoader.load(`${basePath}/textures/earth-normal.jpg`),
            roughnessMap: textureLoader.load(`${basePath}/textures/earth-specular.jpg`),
            roughness: 0.4, 
            metalness: 0.1,
            normalScale: new THREE.Vector2(3.0, 3.0),
            sheen: 0.2,
            sheenColor: new THREE.Color(0x00aaff),
            specularIntensity: 0.5, 
            specularColor: new THREE.Color(0xadc4ff),
            clearcoat: 0.2, 
            clearcoatRoughness: 0.1
        })
        const globe = new THREE.Mesh(earthGeometry, earthMaterial)
        globe.rotation.y = -Math.PI / 4 // Rotated to show more lit area initially
        globe.rotation.z = 23.5 * (Math.PI / 180)
        scene.add(globe)

        // 2. Cloud Shadows
        const shadowGeometry = new THREE.SphereGeometry(1.005, 64, 64)
        const shadowMaterial = new THREE.MeshBasicMaterial({
            alphaMap: textureLoader.load(`${basePath}/textures/earth-clouds.jpg`),
            color: 0x000000,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
        })
        const cloudShadows = new THREE.Mesh(shadowGeometry, shadowMaterial)
        cloudShadows.userData = { isShadows: true }
        globe.add(cloudShadows)

        // 3. Clouds
        const cloudGeometry = new THREE.SphereGeometry(1.015, 64, 64)
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load(`${basePath}/textures/earth-clouds.jpg`),
            normalMap: textureLoader.load(`${basePath}/textures/earth-clouds.jpg`),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            normalScale: new THREE.Vector2(0.4, 0.4)
        })
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
        clouds.userData = { isClouds: true }
        globe.add(clouds)

        // 4. Night Lights
        const nightGeometry = new THREE.SphereGeometry(1.002, 64, 64)
        const nightMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tNight: { value: textureLoader.load(`${basePath}/textures/earth-night.jpg`) },
                uLightDirection: { value: sunPosition.clone().normalize() }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tNight;
                uniform vec3 uLightDirection;
                varying vec2 vUv;
                varying vec3 vNormal;

                void main() {
                    vec3 nightColor = texture2D(tNight, vUv).rgb;
                    float lightIntensity = dot(vNormal, uLightDirection);
                    float darkness = smoothstep(0.1, -0.2, lightIntensity);
                    
                    // Golden Boost
                    vec3 finalColor = nightColor * vec3(4.0, 3.2, 1.0) * 3.0; 

                    float alpha = darkness * length(nightColor) * 2.0;
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
        const nightEarth = new THREE.Mesh(nightGeometry, nightMaterial)
        globe.add(nightEarth)

        // 5. Atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(1.25, 64, 64)
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.3 },
                p: { value: 5.0 },
                glowColor: { value: new THREE.Color(0x0066ff) },
                viewVector: { value: camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    gl_FragColor = vec4(glowColor, intensity * 0.4); 
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        })
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
        scene.add(atmosphere)

        // Groups for Traffic
        const pins = new THREE.Group()
        scene.add(pins)

        const arcs = new THREE.Group()
        scene.add(arcs)

        pins.rotation.copy(globe.rotation)
        arcs.rotation.copy(globe.rotation)

        sceneRef.current = {
            scene,
            camera,
            renderer,
            composer,
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
        let targetRotationY = globe.rotation.y
        let targetRotationX = globe.rotation.x
        let currentRotationY = globe.rotation.y
        let currentRotationX = globe.rotation.x
        let autoRotate = true

        const onClick = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

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
            setTimeout(() => { if (!isDragging) autoRotate = true }, 4000)
        }

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMouse.x
                const deltaY = e.clientY - previousMouse.y
                targetRotationY += deltaX * 0.005
                targetRotationX += deltaY * 0.005
                targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX))
                previousMouse = { x: e.clientX, y: e.clientY }
            }

            // Hover
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)

            const beamMeshes: THREE.Object3D[] = []
            pins.children.forEach(g => beamMeshes.push(...g.children))

            const intersects = raycaster.intersectObjects(beamMeshes)
            if (intersects.length > 0) {
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
        window.addEventListener('mouseup', onMouseUp)
        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('mouseleave', onMouseUp)
        container.addEventListener('click', onClick)

        // Animate
        const clock = new THREE.Clock()
        const animate = () => {
            sceneRef.current!.frameId = requestAnimationFrame(animate)
            const dt = clock.getDelta()
            const time = clock.getElapsedTime()

            if (!sceneRef.current?.globe) return
            const { globe, pins, arcs, composer } = sceneRef.current

            // Rotate
            if (autoRotate) targetRotationY += 0.0008

            // Inertia
            currentRotationY += (targetRotationY - currentRotationY) * 0.05
            currentRotationX += (targetRotationX - currentRotationX) * 0.05

            globe.rotation.y = currentRotationY
            globe.rotation.x = currentRotationX

            // Update children rotation
            pins.rotation.copy(globe.rotation)
            arcs.rotation.copy(globe.rotation)


            // Cloud/Shadow Parallax
            const cloudMesh = globe.children.find(c => c.userData.isClouds)
            const shadowMesh = globe.children.find(c => c.userData.isShadows)
            if (cloudMesh) {
                cloudMesh.rotation.y += 0.0002
                if (shadowMesh) shadowMesh.rotation.y = cloudMesh.rotation.y
            }

            // Arcs Update
            arcs.children.forEach((arcGroup) => {
                const data = arcGroup.userData
                if (data && data.curve && data.packet) {
                    data.progress += data.speed
                    if (data.progress >= 1) {
                        data.progress = 0
                        const endPoint = data.curve.getPoint(1)
                        spawnRipple(scene, endPoint, data.color)
                    }
                    data.packet.position.copy(data.curve.getPoint(data.progress))
                }
            })

            // Ripples Update
            for (let i = scene.children.length - 1; i >= 0; i--) {
                const obj = scene.children[i]
                if (obj.userData.isRipple) {
                    const s = obj.scale.x + 0.04
                    obj.scale.setScalar(s)
                    const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial
                    mat.opacity -= 0.03
                    if (mat.opacity <= 0) {
                        scene.remove(obj);
                        ((obj as THREE.Mesh).geometry as THREE.RingGeometry).dispose()
                    }
                }
            }

            // Render directly (bypass composer for transparency)
            renderer.render(scene, camera)
        }
        animate()

        // Arc Regen
        const regenInterval = setInterval(() => {
            if (!sceneRef.current?.arcs || locations.length < 2) return
            const { arcs } = sceneRef.current
            const activeLocs = locations.filter(l => l.isActive)

            if (arcs.children.length < 30) {
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start && end && start.id !== end.id) arcs.add(createAnimatedArc(start, end, isAttackMode))
            } else {
                const index = Math.floor(Math.random() * arcs.children.length)
                arcs.remove(arcs.children[index])
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start && end && start.id !== end.id) arcs.add(createAnimatedArc(start, end, isAttackMode))
            }
        }, 150)

        // Resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width && height) {
                    camera.aspect = width / height
                    camera.updateProjectionMatrix()
                    renderer.setSize(width, height)
                    // Update composer target size
                    composer.setSize(width, height)
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
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
            renderer.dispose()
            clearInterval(regenInterval)
        }

    }, [locations, isAttackMode, onLocationClick])

    // Update pins hook
    useEffect(() => {
        if (!sceneRef.current) return
        const { pins, arcs, globe } = sceneRef.current
        pins.clear()
        arcs.clear()

        const activeLocs = locations.filter(l => l.isActive)
        locations.forEach(loc => {
            const beam = createDataBeam(loc)
            beam.userData.location = loc
            pins.add(beam)
        })

        if (activeLocs.length > 1) {
            for (let i = 0; i < 30; i++) {
                const start = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                const end = activeLocs[Math.floor(Math.random() * activeLocs.length)]
                if (start && end && start.id !== end.id) {
                    arcs.add(createAnimatedArc(start, end, isAttackMode))
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[150%] pointer-events-none z-20 animate-fadeIn">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.2)] text-left min-w-[180px]">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-cyan-400 font-mono tracking-widest">{hoveredLocation.countryCode || 'UNK'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">#{hoveredLocation.id}</span>
                        </div>
                        <div className="text-lg font-bold text-white mb-1 leading-tight">{hoveredLocation.city}</div>
                        <div className="text-sm text-slate-400 mb-3">{hoveredLocation.country}</div>

                        <div className="flex items-center gap-2 text-xs border-t border-slate-800 pt-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${hoveredLocation.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className={`font-bold tracking-wide ${hoveredLocation.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                                {hoveredLocation.isBlocked ? 'THREAT DETECTED' : 'SECURE NODE'}
                            </span>
                        </div>
                    </div>
                    {/* Tail */}
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-slate-900/90 mx-auto -mt-[1px]" />
                </div>
            )}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -140%); }
                    to { opacity: 1; transform: translate(-50%, -150%); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    )
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = (radius * Math.sin(phi) * Math.sin(theta))
    const y = (radius * Math.cos(phi))
    return new THREE.Vector3(x, y, z)
}

function createDataBeam(loc: GlobeLocation): THREE.Group {
    const group = new THREE.Group()
    const pos = latLonToVector3(loc.lat, loc.lon, 1.0)
    const color = loc.isBlocked ? 0xff3333 : (loc.isActive ? 0x00ffcc : 0x0099ff)

    const geometry = new THREE.SphereGeometry(0.015, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: color })
    const dot = new THREE.Mesh(geometry, material)
    group.add(dot)

    if (loc.isActive) {
        const ringGeo = new THREE.RingGeometry(0.025, 0.03, 32)
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.lookAt(pos.clone().multiplyScalar(1.1))
        group.add(ring)
        group.userData.ring = ring
    }

    if (loc.isActive || loc.isBlocked) {
        const height = loc.viewerCount * 0.005 + 0.15
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, height, 0)
        ])
        const lineMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            linewidth: 1
        })
        const line = new THREE.Line(lineGeo, lineMat)
        line.lookAt(pos.clone().multiplyScalar(1.1))
        line.rotation.x = Math.PI / 2
        group.add(line)
    }
    group.position.copy(pos)
    group.lookAt(pos.clone().multiplyScalar(2))
    return group
}

const SECURE_COLORS = [0x00f3ff, 0x2196f3, 0x8b5cf6]
const ATTACK_COLORS = [0xff0000, 0xff3333, 0xff5500]

function spawnRipple(scene: THREE.Scene, position: THREE.Vector3, color: number) {
    const geometry = new THREE.RingGeometry(0, 0.05, 32)
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthTest: false
    })
    const ripple = new THREE.Mesh(geometry, material)
    ripple.position.copy(position)
    ripple.lookAt(position.clone().multiplyScalar(2))
    ripple.userData.isRipple = true
    scene.add(ripple)
}

function createAnimatedArc(start: GlobeLocation, end: GlobeLocation, isAttackMode: boolean): THREE.Group {
    const group = new THREE.Group()
    const startPos = latLonToVector3(start.lat, start.lon, 1.0)
    const endPos = latLonToVector3(end.lat, end.lon, 1.0)
    const dist = startPos.distanceTo(endPos)
    const controlHeight = dist * 0.5 + 1.25

    const mid = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(controlHeight)
    const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos)

    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const palette = isAttackMode ? ATTACK_COLORS : SECURE_COLORS
    const color = palette[Math.floor(Math.random() * palette.length)] * 1.5 // Boost for bloom

    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: isAttackMode ? 0.5 : 0.3,
        linewidth: 1,
        blending: THREE.AdditiveBlending
    })
    const line = new THREE.Line(geometry, material)
    group.add(line)

    const packetGeo = new THREE.SphereGeometry(0.015, 8, 8)
    const packetMat = new THREE.MeshBasicMaterial({ color: color })
    const packet = new THREE.Mesh(packetGeo, packetMat)

    group.userData = {
        curve: curve,
        packet: packet,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.015,
        color: color
    }
    group.add(packet)
    return group
}

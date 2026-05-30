'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { audioEngine } from '@/lib/audio-engine'

interface Props {
  onClose?: () => void
}

export function ThreeDScene({ onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<() => void>(() => {})

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = null
    scene.fog = null

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 16)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.minDistance = 10
    controls.maxDistance = 40

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 15, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.bias = -0.0005
    scene.add(dirLight)

    const lightBlue = new THREE.PointLight(0x00f0ff, 1.5, 20)
    lightBlue.position.set(4, 5, 2)
    scene.add(lightBlue)

    const lightPink = new THREE.PointLight(0xff00ff, 1.5, 20)
    lightPink.position.set(8, 2, 4)
    scene.add(lightPink)

    // Env map
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0xffffff)
    const boxGeo = new THREE.BoxGeometry(5, 5, 5)
    const m1 = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }))
    m1.position.set(20, 10, -20); envScene.add(m1)
    const m2 = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xff00ff }))
    m2.position.set(-20, 10, 20); envScene.add(m2)
    scene.environment = pmremGenerator.fromScene(envScene).texture

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -3.5
    floor.receiveShadow = true
    scene.add(floor)

    // Left: Desk & Computer
    const leftGroup = new THREE.Group()
    const matteWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.1 })

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3.5), matteWhite)
    deskTop.position.y = 0
    deskTop.castShadow = true
    deskTop.receiveShadow = true
    leftGroup.add(deskTop)

    const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 3.5, 32)
    const legPositions = [[-2.8, -1.85, -1.5], [2.8, -1.85, -1.5], [-2.8, -1.85, 1.5], [2.8, -1.85, 1.5]]
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, matteWhite)
      leg.position.set(pos[0], pos[1], pos[2])
      leg.castShadow = true
      leftGroup.add(leg)
    })

    const pcGroup = new THREE.Group()
    const silverMetal = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 })

    const pcBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.8), silverMetal)
    pcBase.position.y = 0.125
    pcBase.castShadow = true
    pcGroup.add(pcBase)

    const pcStand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.15), silverMetal)
    pcStand.position.set(0, 0.9, -0.6)
    pcStand.rotation.x = -0.1
    pcStand.castShadow = true
    pcGroup.add(pcStand)

    const monitorBack = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.3, 0.15), matteWhite)
    monitorBack.position.set(0, 2.2, -0.35)
    monitorBack.rotation.x = -0.05
    monitorBack.castShadow = true
    pcGroup.add(monitorBack)

    const monitorBezel = new THREE.Mesh(new THREE.BoxGeometry(5.25, 3.15, 0.03), new THREE.MeshStandardMaterial({ color: 0x111111 }))
    monitorBezel.position.set(0, 2.2, -0.28)
    monitorBezel.rotation.x = -0.05
    pcGroup.add(monitorBezel)

    // Screen texture - use album art or default gradient
    const defaultCanvas = document.createElement('canvas')
    defaultCanvas.width = 1024
    defaultCanvas.height = 1024
    const dCtx = defaultCanvas.getContext('2d')!
    const grad = dCtx.createLinearGradient(0, 0, 1024, 1024)
    grad.addColorStop(0, '#f43f5e')
    grad.addColorStop(0.5, '#8b5cf6')
    grad.addColorStop(1, '#3b82f6')
    dCtx.fillStyle = grad
    dCtx.fillRect(0, 0, 1024, 1024)
    dCtx.fillStyle = 'rgba(255,255,255,0.1)'
    dCtx.beginPath(); dCtx.arc(800, 200, 300, 0, Math.PI * 2); dCtx.fill()
    dCtx.beginPath(); dCtx.arc(200, 800, 400, 0, Math.PI * 2); dCtx.fill()

    const defaultTex = new THREE.CanvasTexture(defaultCanvas)
    defaultTex.colorSpace = THREE.SRGBColorSpace

    const screenGeo = new THREE.PlaneGeometry(5.1, 3.0)
    const screenMat = new THREE.MeshStandardMaterial({
      map: defaultTex,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0x222222,
    })
    const screenMesh = new THREE.Mesh(screenGeo, screenMat)
    screenMesh.position.set(0, 2.2, -0.25)
    screenMesh.rotation.x = -0.05
    pcGroup.add(screenMesh)

    pcGroup.position.set(0, 0, 0)
    leftGroup.add(pcGroup)
    leftGroup.position.set(-4, 0.5, 0)
    leftGroup.rotation.y = 0.3
    scene.add(leftGroup)

    // Right: Diamond lyrics
    const lyricsGroup = new THREE.Group()
    const diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1.0,
      opacity: 1,
      metalness: 0.1,
      roughness: 0.05,
      ior: 2.42,
      thickness: 1.5,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    })

    const rowMeshes: { mesh: THREE.Mesh; textCanvas: HTMLCanvasElement; baseY: number; phaseOffset: number }[] = []

    const maxLines = 6

    for (let i = 0; i < maxLines; i++) {
      const yOffset = (maxLines / 2 - i) * 1.0
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 200
      rowMeshes.push({ mesh: new THREE.Mesh(), textCanvas: canvas, baseY: yOffset, phaseOffset: i * 0.5 })

      const panelGeo = new THREE.BoxGeometry(8, 0.8, 0.2)
      const panelMesh = new THREE.Mesh(panelGeo, diamondMaterial)
      panelMesh.castShadow = true

      const textTex = new THREE.CanvasTexture(canvas)
      textTex.colorSpace = THREE.SRGBColorSpace
      const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true, opacity: 1 })
      const textGeo = new THREE.PlaneGeometry(8, 1.0)
      const textMesh = new THREE.Mesh(textGeo, textMat)
      textMesh.position.z = 0.12

      const rowGroup = new THREE.Group()
      rowGroup.add(panelMesh)
      rowGroup.add(textMesh)
      rowGroup.position.set(0, yOffset, 0)
      rowGroup.userData = { baseY: yOffset, phaseOffset: i * 0.5 }

      lyricsGroup.add(rowGroup)
    }

    // Diamond particles
    const diamondParticles: THREE.Mesh[] = []
    const crystalGeo = new THREE.IcosahedronGeometry(0.15, 0)
    for (let i = 0; i < 8; i++) {
      const crystal = new THREE.Mesh(crystalGeo, diamondMaterial)
      crystal.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3)
      crystal.userData = {
        rotX: Math.random() * 0.02,
        rotY: Math.random() * 0.02,
        baseY: crystal.position.y,
        phase: Math.random() * Math.PI * 2,
      }
      diamondParticles.push(crystal)
      lyricsGroup.add(crystal)
    }

    lyricsGroup.position.set(3.5, 1.5, 0)
    lyricsGroup.rotation.set(-0.1, -0.6, 0)
    scene.add(lyricsGroup)

    // Load album art
    const state = usePlayerStore.getState()
    if (state.currentMusic?.coverUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const tex = new THREE.Texture(img)
        tex.needsUpdate = true
        tex.colorSpace = THREE.SRGBColorSpace
        screenMesh.material.map = tex
        screenMesh.material.needsUpdate = true
      }
      img.src = state.currentMusic.coverUrl
    }

    // Unsubscribe from store for album art updates
    const unsubPlayer = usePlayerStore.subscribe((s, prev) => {
      if (s.currentMusic?.coverUrl !== prev.currentMusic?.coverUrl && s.currentMusic?.coverUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const tex = new THREE.Texture(img)
          tex.needsUpdate = true
          tex.colorSpace = THREE.SRGBColorSpace
          screenMesh.material.map = tex
          screenMesh.material.needsUpdate = true
        }
        img.src = s.currentMusic.coverUrl
      }
    })

    // Resize
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    let frameCount = 0
    const animate = () => {
      requestAnimationFrame(animate)
      const time = Date.now() * 0.001
      frameCount++

      const freq = audioEngine.frequencyData
      let bass = 0, mid = 0, high = 0
      if (freq && freq.length) {
        for (let i = 0; i < 16; i++) bass += freq[i] / 16
        for (let i = 16; i < 40; i++) mid += freq[i] / 24
        for (let i = 40; i < 64; i++) high += freq[i] / 24
      }
      const bassN = bass / 255
      const midN = mid / 255
      const energy = Math.min(1, (bass + mid + high) / 255 / 3 * 1.5)

      controls.update()

      // Animated lights
      lightBlue.position.x = 4 + Math.sin(time * 0.5) * (3 + bassN)
      lightBlue.position.z = 2 + Math.cos(time * 0.5) * (3 + bassN)
      lightBlue.intensity = 1.5 + bassN * 2
      lightPink.position.y = 2 + Math.sin(time * 0.7) * (2 + bassN)
      lightPink.position.z = 4 + Math.cos(time * 0.3) * (3 + bassN)
      lightPink.intensity = 1.5 + midN * 2

      // Floating lyrics
      lyricsGroup.children.forEach((child) => {
        const ud = child.userData as any
        if (ud.baseY !== undefined) {
          child.position.y = ud.baseY + Math.sin(time * 1.5 + ud.phaseOffset) * (0.08 + bassN * 0.05)
        }
      })

      // Diamond particles
      diamondParticles.forEach((p) => {
        const ud = p.userData as any
        p.rotation.x += ud.rotX
        p.rotation.y += ud.rotY
        p.position.y = ud.baseY + Math.sin(time + ud.phase) * (0.3 + bassN * 0.2)
      })

      // Update lyrics text (every other frame to reduce CPU)
      if (frameCount % 2 !== 0) { renderer.render(scene, camera); return }
      const lyricState = useLyricStore.getState()
      const lyricLines = lyricState.lyrics
      const currentIdx = lyricState.currentLineIndex
      const linesToShow = lyricLines.slice(Math.max(0, currentIdx - 2), Math.max(0, currentIdx - 2) + maxLines)

      lyricsGroup.children.forEach((child, idx) => {
        if (idx >= maxLines) return
        const textMesh = child.children[1] as THREE.Mesh
        if (!textMesh || !(textMesh.material as THREE.MeshBasicMaterial).map) return
        const tex = (textMesh.material as THREE.MeshBasicMaterial).map as THREE.CanvasTexture
        const canvas = tex.image as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!
        const line = linesToShow[idx]
        const isCurrent = line && lyricLines.indexOf(line) === currentIdx

        ctx.clearRect(0, 0, 1024, 200)
        if (line) {
          ctx.font = `bold ${isCurrent ? 72 : 48}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
          ctx.fillStyle = isCurrent ? '#f43f5e' : '#1e293b'
          ctx.shadowColor = isCurrent ? 'rgba(244,63,94,0.3)' : 'transparent'
          ctx.shadowBlur = isCurrent ? 12 : 0
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          const text = line.text || ''
          const displayText = text.length > 32 ? text.slice(0, 30) + '…' : text
          ctx.fillText(displayText, 24, 90)

          if (isCurrent) {
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            ctx.fillStyle = '#9ca3af'
            ctx.fillText('◀ 正在播放', 24, 160)
          }
        }
        tex.needsUpdate = true
      })

      renderer.render(scene, camera)
    }
    animate()

    cleanupRef.current = () => {
      unsubPlayer()
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    return () => cleanupRef.current()
  }, [])

  return (
    <>
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-xl border transition-all hover:bg-white/10"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderColor: 'rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 0, cursor: 'grab' }}
      />
    </>
  )
}

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Materials
const portalMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
        uTime: {
            value: 0
        },
        uColorStart: {
            value: new THREE.Color('#000')
        },
        uColorEnd: {
            value: new THREE.Color('#fff')
        },
    }
})

const poleLightMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffb9'
})

const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})

/**
 * Object
 */
gltfLoader.load(
    'portal.glb',
    (gltf) => {
        const append = gltf.scene

        append.traverse((child) => {
            if (['Lamp1', 'Lamp2'].includes(child.name)) {
                child.material = poleLightMaterial
            } else if (child.name === 'Portal') {
                child.material = portalMaterial
            } else {
                child.material = bakedMaterial
            }
        })

        scene.add(append)
    }
)

/**
 * Fireflies
 */
const firefliesMaterial = new THREE.ShaderMaterial({
    precision: 'lowp',
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    uniforms: {
        uPixelRation: {
            value: Math.min(window.devicePixelRatio, 2)
        },
        uSize: {
            value: 100
        },
        uTime: {
            value: 0
        }
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 120
const firefliesPositionArray = new Float32Array(firefliesCount * 3)
const firefliesScaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
    const i3 = i * 3
    firefliesPositionArray[i3 + 0] = (Math.random() - 0.5) * 4
    firefliesPositionArray[i3 + 1] = Math.random() * 1.5
    firefliesPositionArray[i3 + 2] = (Math.random() - 0.5) * 4

    firefliesScaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(firefliesPositionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(firefliesScaleArray, 1))

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    firefliesMaterial.uniforms.uPixelRation.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#201919')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
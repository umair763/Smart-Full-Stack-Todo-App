import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTheme } from '../context/ThemeContext';
import * as THREE from 'three';
import '../styles/background.css';
import FallbackBackground from './FallbackBackground';

// Simple performance hook
function useSimplePerformanceOptimization() {
   const [isLowPerformance, setIsLowPerformance] = useState(false);

   useEffect(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      const isSmallScreen = window.innerWidth < 768; // Mobile breakpoint

      console.log('Performance check:', {
         isMobile,
         isLowEndDevice,
         isSmallScreen,
         hardwareConcurrency: navigator.hardwareConcurrency,
      });
      setIsLowPerformance(isMobile || isLowEndDevice || isSmallScreen);
   }, []);

   return { isLowPerformance };
}

// Enhanced central diamond with more lines and creative cuts - Purple Layer
const CentralDiamond = ({ isLowPerformance }) => {
   const diamondRef = useRef();
   const { mouse } = useThree();

   const diamondGeometry = useMemo(() => {
      const detail = isLowPerformance ? 1 : 3; // Reduced detail for mobile
      const geometry = new THREE.OctahedronGeometry(isLowPerformance ? 2.0 : 3.0, detail);

      const positions = geometry.attributes.position.array;
      const newPositions = [];

      for (let i = 0; i < positions.length; i += 3) {
         const x = positions[i];
         const y = positions[i + 1];
         const z = positions[i + 2];

         const cutFactor = 0.9 + Math.sin(Math.atan2(y, x) * 8) * 0.1;
         newPositions.push(x * cutFactor, y * cutFactor, z * cutFactor);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      return geometry;
   }, [isLowPerformance]);

   useFrame((state) => {
      if (diamondRef.current) {
         const speed = isLowPerformance ? 0.2 : 0.5;
         diamondRef.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
         diamondRef.current.rotation.x = mouse.y * 0.3 + Math.sin(state.clock.elapsedTime * 0.3 * speed) * 0.1;
         diamondRef.current.rotation.z = mouse.x * 0.2 + Math.cos(state.clock.elapsedTime * 0.4 * speed) * 0.08;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * (isLowPerformance ? 0.1 : 0.2);
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.8 * speed) * 0.08;
         diamondRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });

   return (
      <mesh ref={diamondRef} position={[0, 0, 0]} geometry={diamondGeometry}>
         <meshBasicMaterial color="#9406E6" transparent opacity={isLowPerformance ? 0.3 : 0.5} wireframe={true} />
      </mesh>
   );
};

// Cyan diamond wireframe overlay - Second Layer
const DiamondWireframeOverlay = ({ isLowPerformance }) => {
   const overlayRef = useRef();
   const { mouse } = useThree();

   const overlayGeometry = useMemo(() => {
      const detail = isLowPerformance ? 1 : 2;
      return new THREE.IcosahedronGeometry(isLowPerformance ? 2.2 : 3.3, detail);
   }, [isLowPerformance]);

   useFrame((state) => {
      if (overlayRef.current) {
         const speed = isLowPerformance ? 0.2 : 0.5;
         overlayRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
         overlayRef.current.rotation.x = mouse.y * 0.2 + Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.15;
         overlayRef.current.rotation.z = mouse.x * 0.15 + Math.cos(state.clock.elapsedTime * 0.6 * speed) * 0.1;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * (isLowPerformance ? 0.08 : 0.15);
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.2 * speed) * 0.05;
         overlayRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });

   return (
      <mesh ref={overlayRef} position={[0, 0, 0.5]} geometry={overlayGeometry}>
         <meshBasicMaterial color="#00FFFF" transparent opacity={isLowPerformance ? 0.25 : 0.4} wireframe={true} />
      </mesh>
   );
};

// White diamond mesh layer - Third Layer (only on high performance)
const DiamondMeshLayer = ({ isLowPerformance }) => {
   const meshRef = useRef();
   const { mouse } = useThree();

   const meshGeometry = useMemo(() => {
      const detail = isLowPerformance ? 0 : 1;
      return new THREE.DodecahedronGeometry(3.6, detail);
   }, [isLowPerformance]);

   useFrame((state) => {
      if (meshRef.current) {
         const speed = isLowPerformance ? 0.2 : 0.5;
         meshRef.current.rotation.y = -state.clock.elapsedTime * 0.4 * speed;
         meshRef.current.rotation.x = mouse.y * 0.15 + Math.sin(state.clock.elapsedTime * 0.7 * speed) * 0.12;
         meshRef.current.rotation.z = mouse.x * 0.1 + Math.cos(state.clock.elapsedTime * 0.8 * speed) * 0.08;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * 0.05;
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.6 * speed) * 0.03;
         meshRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });

   // Don't render on mobile for performance
   if (isLowPerformance) return null;

   return (
      <mesh ref={meshRef} position={[0, 0, -0.5]} geometry={meshGeometry}>
         <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} wireframe={true} />
      </mesh>
   );
};

// Star-like particles rotating around the diamond
const StarParticlesAroundDiamond = ({ isLowPerformance }) => {
   const groupRef = useRef();
   const { mouse } = useThree();

   const particleCount = isLowPerformance ? 20 : 60; // Reduced for mobile
   const stars = useMemo(() => {
      return Array.from({ length: particleCount }, (_, i) => ({
         angle: (i / particleCount) * Math.PI * 2,
         radius: 4 + (i % 3) * 1.5, // Smaller radius for mobile
         speed: 0.08 + Math.random() * 0.1,
         verticalOffset: (Math.random() - 0.5) * 3,
         size: Math.random() * (isLowPerformance ? 0.04 : 0.06) + 0.02,
         delay: i * 0.15,
         orbitRadius: 4 + Math.sin(i * 0.3) * 1.5,
         layer: i % 3,
      }));
   }, [particleCount, isLowPerformance]);

   useFrame((state) => {
      if (groupRef.current) {
         groupRef.current.children.forEach((star, i) => {
            const speed = isLowPerformance ? 0.2 : 0.5;
            const time = state.clock.elapsedTime * stars[i].speed * speed + stars[i].delay;

            const angle = stars[i].angle + time;
            const radius = stars[i].orbitRadius + Math.sin(time * 0.5) * 0.8;

            const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
            const mouseInfluence = 1 + mouseDistance * (isLowPerformance ? 0.2 : 0.3);

            star.position.x = Math.cos(angle) * radius * mouseInfluence;
            star.position.z = Math.sin(angle) * radius * mouseInfluence;
            star.position.y = stars[i].verticalOffset + Math.sin(time * 0.8) * 0.6;

            star.position.x += mouse.x * 0.3;
            star.position.y += mouse.y * 0.3;

            star.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
            star.rotation.z = time * 0.6;
            star.rotation.x = time * 0.4;

            const twinkle = 1 + Math.sin(time * 2 + i) * 0.2;
            star.scale.setScalar(twinkle * (1 + mouseDistance * 0.15));
         });
      }
   });

   return (
      <group ref={groupRef}>
         {stars.map((star, i) => (
            <mesh key={i}>
               <sphereGeometry args={[star.size, isLowPerformance ? 4 : 6, isLowPerformance ? 4 : 6]} />
               <meshBasicMaterial
                  color={star.layer === 0 ? '#9406E6' : star.layer === 1 ? '#00FFFF' : '#FFFFFF'}
                  transparent
                  opacity={0.6}
               />
            </mesh>
         ))}
      </group>
   );
};

// High-density floating particles (reduced for mobile)
const HighDensityParticles = ({ isLowPerformance }) => {
   const ref = useRef();
   const velocities = useRef([]);
   const { mouse } = useThree();

   const particleCount = isLowPerformance ? 300 : 1200; // Significantly reduced for mobile
   const particlesPosition = useMemo(() => {
      const positions = new Float32Array(particleCount * 3);
      velocities.current = [];

      for (let i = 0; i < particleCount; i++) {
         positions[i * 3] = (Math.random() - 0.5) * (isLowPerformance ? 30 : 50);
         positions[i * 3 + 1] = (Math.random() - 0.5) * (isLowPerformance ? 25 : 40);
         positions[i * 3 + 2] = (Math.random() - 0.5) * (isLowPerformance ? 20 : 35);

         velocities.current.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.012,
         });
      }
      return positions;
   }, [particleCount, isLowPerformance]);

   useFrame((state) => {
      if (ref.current) {
         const positions = ref.current.geometry.attributes.position.array;
         const time = state.clock.elapsedTime;
         const speed = isLowPerformance ? 0.2 : 0.5;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const mouseInfluence = 1 + mouseDistance * 0.3;

         for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            velocities.current[i].x += Math.sin(time * 0.3 * speed + i * 0.01) * 0.0008;
            velocities.current[i].y += Math.cos(time * 0.2 * speed + i * 0.01) * 0.0006;

            positions[i3] += velocities.current[i].x * mouseInfluence;
            positions[i3 + 1] += velocities.current[i].y * mouseInfluence;
            positions[i3 + 2] += velocities.current[i].z;

            const particleX = positions[i3];
            const particleY = positions[i3 + 1];
            const distanceToMouse = Math.sqrt((particleX - mouse.x * 8) ** 2 + (particleY - mouse.y * 8) ** 2);

            if (distanceToMouse < 6) {
               const attraction = (6 - distanceToMouse) * 0.001;
               positions[i3] += (mouse.x * 8 - particleX) * attraction;
               positions[i3 + 1] += (mouse.y * 8 - particleY) * attraction;
            }

            positions[i3 + 2] += Math.sin(time * 0.6 * speed + particleX * 0.08 + particleY * 0.08) * 0.3;

            const boundary = isLowPerformance ? 15 : 25;
            if (positions[i3] > boundary) positions[i3] = -boundary;
            if (positions[i3] < -boundary) positions[i3] = boundary;
            if (positions[i3 + 1] > boundary * 0.8) positions[i3 + 1] = -boundary * 0.8;
            if (positions[i3 + 1] < -boundary * 0.8) positions[i3 + 1] = boundary * 0.8;
            if (positions[i3 + 2] > boundary * 0.7) positions[i3 + 2] = -boundary * 0.7;
            if (positions[i3 + 2] < -boundary * 0.7) positions[i3 + 2] = boundary * 0.7;
         }

         ref.current.geometry.attributes.position.needsUpdate = true;
         ref.current.rotation.y = state.clock.elapsedTime * 0.03 * speed + mouse.x * 0.1;
         ref.current.rotation.x = mouse.y * 0.05;
      }
   });

   return (
      <points ref={ref}>
         <bufferGeometry>
            <bufferAttribute
               attach="attributes-position"
               count={particleCount}
               array={particlesPosition}
               itemSize={3}
            />
         </bufferGeometry>
         <pointsMaterial
            transparent
            color="#9406E6"
            size={isLowPerformance ? 0.01 : 0.015}
            sizeAttenuation={true}
            opacity={isLowPerformance ? 0.15 : 0.2}
         />
      </points>
   );
};

// Enhanced background with theme-responsive gradient
const EnhancedBackgroundPlane = ({ isDark, isLowPerformance }) => {
   const meshRef = useRef();
   const { mouse, viewport } = useThree();

   useFrame((state) => {
      if (meshRef.current) {
         const time = state.clock.elapsedTime;
         const speed = isLowPerformance ? 0.2 : 0.5;
         
         meshRef.current.material.uniforms.uTime.value = time * speed;
         meshRef.current.material.uniforms.uMouse.value.set(mouse.x * 0.3, mouse.y * 0.3);
         meshRef.current.material.uniforms.uMouseVelocity.value = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
         meshRef.current.material.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;

         meshRef.current.position.z = -15 + Math.sin(time * 0.2 * speed) * 0.8 + mouse.y * 1.5;
         meshRef.current.rotation.x = mouse.y * 0.03;
         meshRef.current.rotation.y = mouse.x * 0.02;
      }
   });

   const gradientShader = useMemo(
      () => ({
         vertexShader: `
         varying vec2 vUv;
         uniform float uTime;
         uniform vec2 uMouse;
         uniform float uMouseVelocity;
         
         void main() {
            vUv = uv;
            vec3 pos = position;
            
            float mouseInfluence = uMouseVelocity * 0.2;
            pos.z += sin(pos.x * 0.1 + uTime * 0.15 + mouseInfluence) * 0.06;
            pos.z += sin(pos.y * 0.08 + uTime * 0.12 + mouseInfluence) * 0.04;
            
            float mouseDistance = distance(uv, uMouse + 0.5);
            pos.z += sin(mouseDistance * 6.0 - uTime * 2.0) * 0.03 * (1.0 - mouseDistance);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
         }
      `,
         fragmentShader: `
         uniform float uTime;
         uniform vec2 uMouse;
         uniform float uMouseVelocity;
         uniform float uIsDark;
         varying vec2 vUv;
         
         void main() {
            vec2 uv = vUv;
            float time = uTime * 0.06;
            
            // Your specified gradient colors
            vec3 purple = vec3(0.58, 0.024, 0.9);  // #9406E6
            vec3 cyan = vec3(0.0, 1.0, 1.0);       // #00FFFF
            
            // Create diagonal gradient from top-left to bottom-right (br direction)
            float gradientFactor = 1.0 - ((1.0 - uv.x) + uv.y) * 0.5;
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);
            
            // Add subtle wave animations to make it dynamic
            float wave1 = sin(uv.x * 2.5 + time * 1.2) * 0.04;
            float wave2 = sin(uv.y * 2.0 + time * 1.0) * 0.03;
            float wave3 = sin((uv.x + uv.y) * 1.5 + time * 1.5) * 0.025;
            
            // Mouse interaction creates subtle color shifts
            float mouseDistance = distance(uv, uMouse + 0.5);
            float mouseEffect = (1.0 - smoothstep(0.0, 0.5, mouseDistance)) * 0.08;
            float mouseWave = sin(mouseDistance * 10.0 - time * 5.0) * 0.04 * (1.0 - mouseDistance);
            
            // Apply waves and mouse effects to gradient
            gradientFactor += wave1 + wave2 + wave3 + mouseEffect + mouseWave;
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);
            
            // Smooth gradient interpolation from purple to cyan
            vec3 finalColor = mix(purple, cyan, gradientFactor);
            
            // Theme-based intensity adjustment
            float intensity = mix(0.85, 0.65, uIsDark);
            finalColor *= intensity;
            
            // Subtle breathing effect
            float breathe = 0.92 + sin(time * 0.5) * 0.04 + uMouseVelocity * 0.02;
            finalColor *= breathe;
            
            // Add gentle energy pulses
            float pulse1 = sin(time * 1.0 + uv.x * 1.5) * 0.015 + 0.985;
            float pulse2 = sin(time * 0.8 + uv.y * 1.2) * 0.015 + 0.985;
            finalColor *= pulse1 * pulse2;
            
            // Mouse creates subtle bright spots
            float mouseGlow = (1.0 - smoothstep(0.0, 0.2, mouseDistance)) * 0.1;
            finalColor += mouseGlow * mix(purple * 0.2, cyan * 0.2, sin(time * 2.0) * 0.5 + 0.5);
            
            gl_FragColor = vec4(finalColor, 1.0);
         }
      `,
         uniforms: {
            uTime: { value: 0.0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uMouseVelocity: { value: 0.0 },
            uIsDark: { value: 0.0 },
         },
      }),
      []
   );

   const segments = isLowPerformance ? 32 : 96; // Reduced segments for mobile
   
   // Calculate plane size to ensure full screen coverage
   const planeWidth = Math.max(viewport.width * 1.5, isLowPerformance ? 50 : 80);
   const planeHeight = Math.max(viewport.height * 1.5, isLowPerformance ? 50 : 80);

   return (
      <mesh ref={meshRef} rotation={[0, 0, 0]} position={[0, 0, -15]}>
         <planeGeometry args={[planeWidth, planeHeight, segments, segments]} />
         <shaderMaterial {...gradientShader} transparent={false} side={THREE.DoubleSide} />
      </mesh>
   );
};

// Main scene component
function EnhancedBackgroundScene({ isLowPerformance, isDark }) {
   useEffect(() => {
      console.log('Enhanced BackgroundScene mounted with:', { isLowPerformance, isDark });
   }, [isLowPerformance, isDark]);

   return (
      <>
         <ambientLight intensity={isLowPerformance ? 0.3 : 0.5} />
         {!isLowPerformance && (
            <>
               <pointLight position={[10, 10, 10]} intensity={0.3} color="#9406E6" />
               <pointLight position={[-10, -10, 10]} intensity={0.2} color="#00FFFF" />
               <pointLight position={[0, 15, 8]} intensity={0.2} color="#FFFFFF" />
            </>
         )}

         <EnhancedBackgroundPlane isDark={isDark} isLowPerformance={isLowPerformance} />
         <CentralDiamond isLowPerformance={isLowPerformance} />
         <DiamondWireframeOverlay isLowPerformance={isLowPerformance} />
         <DiamondMeshLayer isLowPerformance={isLowPerformance} />
         <StarParticlesAroundDiamond isLowPerformance={isLowPerformance} />
         <HighDensityParticles isLowPerformance={isLowPerformance} />
      </>
   );
}

// Error boundary component
class ErrorBoundary extends React.Component {
   constructor(props) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error) {
      console.error('ErrorBoundary caught error:', error);
      return { hasError: true };
   }

   componentDidCatch(error, errorInfo) {
      console.warn('Enhanced background rendering error, falling back to CSS:', error.message);
      console.error('Error details:', error, errorInfo);
   }

   render() {
      if (this.state.hasError) {
         console.log('ErrorBoundary: Rendering FallbackBackground');
         return <FallbackBackground />;
      }

      return this.props.children;
   }
}

// Main component
function EnhancedBackground() {
   const { isDark } = useTheme();
   const { isLowPerformance } = useSimplePerformanceOptimization();
   const [useThreeJS, setUseThreeJS] = useState(true);

   console.log('Enhanced Background render:', { isDark, isLowPerformance, useThreeJS });

   useEffect(() => {
      try {
         const canvas = document.createElement('canvas');
         const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
         if (!gl) {
            console.warn('WebGL not supported, using CSS fallback');
            setUseThreeJS(false);
         } else {
            console.log('WebGL is supported');
         }
      } catch (e) {
         console.warn('WebGL check failed, using CSS fallback');
         setUseThreeJS(false);
      }
   }, []);

   if (!useThreeJS || (isLowPerformance && navigator.hardwareConcurrency <= 1)) {
      console.log('Using CSS fallback background');
      return <FallbackBackground />;
   }

   console.log('Rendering Enhanced Three.js background');

   return (
      <ErrorBoundary>
         <div 
            className="dynamic-background-container"
            style={{
               position: 'fixed',
               top: 0,
               left: 0,
               width: '100vw',
               height: '100vh',
               minWidth: '100vw',
               minHeight: '100vh',
               maxWidth: '100vw',
               maxHeight: '100vh',
               overflow: 'hidden',
               zIndex: -1,
               margin: 0,
               padding: 0,
            }}
         >
            <div
               style={{
                  position: 'fixed',
                  top: '10px',
                  right: '10px',
                  color: 'white',
                  padding: '5px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  zIndex: 1000,
               }}
            >
            </div>

            <Suspense fallback={<FallbackBackground />}>
               <Canvas
                  style={{
                     position: 'fixed',
                     top: 0,
                     left: 0,
                     width: '100vw',
                     height: '100vh',
                     minWidth: '100vw',
                     minHeight: '100vh',
                     maxWidth: '100vw',
                     maxHeight: '100vh',
                     display: 'block',
                     zIndex: -1,
                     pointerEvents: 'auto',
                     margin: 0,
                     padding: 0,
                     border: 'none',
                     outline: 'none',
                  }}
                  camera={{
                     position: [0, 0, isLowPerformance ? 8 : 10],
                     fov: isLowPerformance ? 75 : 65, // Wider FOV for mobile to ensure coverage
                     aspect: window.innerWidth / window.innerHeight,
                     near: 0.1,
                     far: 1000,
                  }}
                  dpr={isLowPerformance ? [0.5, 1] : [1, 1.2]} // Lower DPR for mobile
                  performance={{ min: isLowPerformance ? 0.3 : 0.5 }}
                  gl={{
                     antialias: !isLowPerformance,
                     alpha: false,
                     powerPreference: 'low-power',
                     precision: isLowPerformance ? 'lowp' : 'highp',
                     preserveDrawingBuffer: false,
                  }}
                  resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
                  onCreated={({ gl, camera, size }) => {
                     console.log('Enhanced Three.js Canvas created successfully');
                     console.log('Canvas size:', size);
                     console.log('Camera aspect:', camera.aspect);
                     
                     // Ensure canvas fills the screen properly
                     gl.setSize(size.width, size.height, false);
                     camera.aspect = size.width / size.height;
                     camera.updateProjectionMatrix();
                  }}
               >
                  <EnhancedBackgroundScene isLowPerformance={isLowPerformance} isDark={isDark} />
               </Canvas>
            </Suspense>
         </div>
      </ErrorBoundary>
   );
}

export default EnhancedBackground;

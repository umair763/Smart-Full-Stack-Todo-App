'use client';

import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTheme } from '../app/context/ThemeContext';
import * as THREE from 'three';
import '../styles/background.css';
import FallbackBackground from './FallbackBackground';

// Simple performance hook
function useSimplePerformanceOptimization() {
   const [isLowPerformance, setIsLowPerformance] = useState(true); // Default to low performance for safety

   useEffect(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
      const isSmallScreen = window.innerWidth < 768; // Mobile breakpoint

      console.log('Performance check:', {
         isMobile,
         isLowEndDevice,
         isSmallScreen,
         hardwareConcurrency: navigator.hardwareConcurrency,
      });

      // More conservative performance detection
      setIsLowPerformance(isMobile || isLowEndDevice || isSmallScreen || true);
   }, []);

   return { isLowPerformance };
}

// Enhanced central diamond with more lines and creative cuts - Purple Layer
const CentralDiamond = ({ isLowPerformance }) => {
   const diamondRef = useRef();
   const { mouse } = useThree();

   const diamondGeometry = useMemo(() => {
      const detail = isLowPerformance ? 0 : 1; // Reduced detail for mobile
      const geometry = new THREE.OctahedronGeometry(isLowPerformance ? 1.5 : 2.0, detail);

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
         const speed = isLowPerformance ? 0.1 : 0.2;
         diamondRef.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
         diamondRef.current.rotation.x = mouse.y * 0.3 + Math.sin(state.clock.elapsedTime * 0.3 * speed) * 0.1;
         diamondRef.current.rotation.z = mouse.x * 0.2 + Math.cos(state.clock.elapsedTime * 0.4 * speed) * 0.08;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * (isLowPerformance ? 0.05 : 0.1);
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.8 * speed) * 0.05;
         diamondRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });

   return (
      <mesh ref={diamondRef} position={[0, 0, 0]} geometry={diamondGeometry}>
         <meshBasicMaterial color="#9406E6" transparent opacity={isLowPerformance ? 0.2 : 0.3} wireframe={true} />
      </mesh>
   );
};

// Cyan diamond wireframe overlay - Second Layer
const DiamondWireframeOverlay = ({ isLowPerformance }) => {
   const overlayRef = useRef();
   const { mouse } = useThree();

   const overlayGeometry = useMemo(() => {
      const detail = isLowPerformance ? 0 : 1;
      return new THREE.IcosahedronGeometry(isLowPerformance ? 1.7 : 2.2, detail);
   }, [isLowPerformance]);

   useFrame((state) => {
      if (overlayRef.current) {
         const speed = isLowPerformance ? 0.1 : 0.2;
         overlayRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
         overlayRef.current.rotation.x = mouse.y * 0.2 + Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.15;
         overlayRef.current.rotation.z = mouse.x * 0.15 + Math.cos(state.clock.elapsedTime * 0.6 * speed) * 0.1;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * (isLowPerformance ? 0.04 : 0.08);
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.2 * speed) * 0.03;
         overlayRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });
};

// White diamond mesh layer - Third Layer (only on high performance)
const DiamondMeshLayer = ({ isLowPerformance }) => {
   // Don't render on mobile for performance
   const meshRef = useRef(null); // Initialize with null
   const { mouse } = useThree();

   const meshGeometry = useMemo(() => {
      return new THREE.DodecahedronGeometry(2.6, 0);
   }, []);

   useFrame((state) => {
      if (meshRef.current) {
         const speed = 0.2;
         meshRef.current.rotation.y = -state.clock.elapsedTime * 0.4 * speed;
         meshRef.current.rotation.x = mouse.y * 0.15 + Math.sin(state.clock.elapsedTime * 0.7 * speed) * 0.12;
         meshRef.current.rotation.z = mouse.x * 0.1 + Math.cos(state.clock.elapsedTime * 0.8 * speed) * 0.08;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const interactiveScale = 1 + mouseDistance * 0.03;
         const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.6 * speed) * 0.02;
         meshRef.current.scale.setScalar(breathe * interactiveScale);
      }
   });

   if (isLowPerformance) return null;

   return (
      <mesh ref={meshRef} position={[0, 0, -0.5]} geometry={meshGeometry}>
         <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} wireframe={true} />
      </mesh>
   );
};

// Star-like particles rotating around the diamond
const StarParticlesAroundDiamond = ({ isLowPerformance }) => {
   const groupRef = useRef();
   const { mouse } = useThree();

   const particleCount = isLowPerformance ? 10 : 20; // Reduced for mobile
   const stars = useMemo(() => {
      return Array.from({ length: particleCount }, (_, i) => ({
         angle: (i / particleCount) * Math.PI * 2,
         radius: 3 + (i % 3) * 1.0, // Smaller radius for mobile
         speed: 0.05 + Math.random() * 0.05,
         verticalOffset: (Math.random() - 0.5) * 2,
         size: Math.random() * (isLowPerformance ? 0.02 : 0.03) + 0.01,
         delay: i * 0.15,
         orbitRadius: 3 + Math.sin(i * 0.3) * 1.0,
         layer: i % 3,
      }));
   }, [particleCount, isLowPerformance]);

   useFrame((state) => {
      if (groupRef.current) {
         groupRef.current.children.forEach((star, i) => {
            const speed = isLowPerformance ? 0.1 : 0.2;
            const time = state.clock.elapsedTime * stars[i].speed * speed + stars[i].delay;

            const angle = stars[i].angle + time;
            const radius = stars[i].orbitRadius + Math.sin(time * 0.5) * 0.5;

            const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
            const mouseInfluence = 1 + mouseDistance * (isLowPerformance ? 0.1 : 0.15);

            star.position.x = Math.cos(angle) * radius * mouseInfluence;
            star.position.z = Math.sin(angle) * radius * mouseInfluence;
            star.position.y = stars[i].verticalOffset + Math.sin(time * 0.8) * 0.4;

            star.position.x += mouse.x * 0.2;
            star.position.y += mouse.y * 0.2;

            star.material.opacity = 0.2 + Math.sin(time * 2 + i) * 0.1;
            star.rotation.z = time * 0.3;
            star.rotation.x = time * 0.2;

            const twinkle = 1 + Math.sin(time * 2 + i) * 0.1;
            star.scale.setScalar(twinkle * (1 + mouseDistance * 0.1));
         });
      }
   });

   return (
      <group ref={groupRef}>
         {stars.map((star, i) => (
            <mesh key={i}>
               <sphereGeometry args={[star.size, isLowPerformance ? 3 : 4, isLowPerformance ? 3 : 4]} />
               <meshBasicMaterial
                  color={star.layer === 0 ? '#9406E6' : star.layer === 1 ? '#00FFFF' : '#FFFFFF'}
                  transparent
                  opacity={0.4}
               />
            </mesh>
         ))}
      </group>
   );
};

// High-density floating particles (reduced for mobile)
const HighDensityParticles = ({ isLowPerformance }) => {
   // Skip this component entirely on low performance devices
   if (isLowPerformance) return null;

   const ref = useRef();
   const velocities = useRef([]);
   const { mouse } = useThree();

   const particleCount = 300; // Significantly reduced
   const particlesPosition = useMemo(() => {
      const positions = new Float32Array(particleCount * 3);
      velocities.current = [];

      for (let i = 0; i < particleCount; i++) {
         positions[i * 3] = (Math.random() - 0.5) * 20;
         positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
         positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

         velocities.current.push({
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.005,
            z: (Math.random() - 0.5) * 0.008,
         });
      }
      return positions;
   }, [particleCount]);

   useFrame((state) => {
      if (ref.current) {
         const positions = ref.current.geometry.attributes.position.array;
         const time = state.clock.elapsedTime;
         const speed = 0.1;

         const mouseDistance = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
         const mouseInfluence = 1 + mouseDistance * 0.1;

         for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            velocities.current[i].x += Math.sin(time * 0.3 * speed + i * 0.01) * 0.0004;
            velocities.current[i].y += Math.cos(time * 0.2 * speed + i * 0.01) * 0.0003;

            positions[i3] += velocities.current[i].x * mouseInfluence;
            positions[i3 + 1] += velocities.current[i].y * mouseInfluence;
            positions[i3 + 2] += velocities.current[i].z;

            const boundary = 10;
            if (positions[i3] > boundary) positions[i3] = -boundary;
            if (positions[i3] < -boundary) positions[i3] = boundary;
            if (positions[i3 + 1] > boundary * 0.8) positions[i3 + 1] = -boundary * 0.8;
            if (positions[i3 + 1] < -boundary * 0.8) positions[i3 + 1] = boundary * 0.8;
            if (positions[i3 + 2] > boundary * 0.7) positions[i3 + 2] = -boundary * 0.7;
            if (positions[i3 + 2] < -boundary * 0.7) positions[i3 + 2] = boundary * 0.7;
         }

         ref.current.geometry.attributes.position.needsUpdate = true;
         ref.current.rotation.y = state.clock.elapsedTime * 0.01 * speed + mouse.x * 0.05;
         ref.current.rotation.x = mouse.y * 0.02;
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
         <pointsMaterial transparent color="#9406E6" size={0.01} sizeAttenuation={true} opacity={0.1} />
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
         const speed = isLowPerformance ? 0.1 : 0.2;

         meshRef.current.material.uniforms.uTime.value = time * speed;
         meshRef.current.material.uniforms.uMouse.value.set(mouse.x * 0.3, mouse.y * 0.3);
         meshRef.current.material.uniforms.uMouseVelocity.value = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
         meshRef.current.material.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;

         meshRef.current.position.z = -15 + Math.sin(time * 0.2 * speed) * 0.5 + mouse.y * 0.8;
         meshRef.current.rotation.x = mouse.y * 0.02;
         meshRef.current.rotation.y = mouse.x * 0.01;
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
            
            float mouseInfluence = uMouseVelocity * 0.1;
            pos.z += sin(pos.x * 0.05 + uTime * 0.1 + mouseInfluence) * 0.03;
            pos.z += sin(pos.y * 0.04 + uTime * 0.08 + mouseInfluence) * 0.02;
            
            float mouseDistance = distance(uv, uMouse + 0.5);
            pos.z += sin(mouseDistance * 3.0 - uTime * 1.0) * 0.02 * (1.0 - mouseDistance);
            
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
            float time = uTime * 0.03;
            
            // Your specified gradient colors
            vec3 purple = vec3(0.58, 0.024, 0.9);  // #9406E6
            vec3 cyan = vec3(0.0, 1.0, 1.0);       // #00FFFF
            
            // Create diagonal gradient from top-left to bottom-right (br direction)
            float gradientFactor = 1.0 - ((1.0 - uv.x) + uv.y) * 0.5;
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);
            
            // Add subtle wave animations to make it dynamic
            float wave1 = sin(uv.x * 1.5 + time * 1.0) * 0.02;
            float wave2 = sin(uv.y * 1.0 + time * 0.8) * 0.015;
            float wave3 = sin((uv.x + uv.y) * 1.0 + time * 1.2) * 0.01;
            
            // Mouse interaction creates subtle color shifts
            float mouseDistance = distance(uv, uMouse + 0.5);
            float mouseEffect = (1.0 - smoothstep(0.0, 0.5, mouseDistance)) * 0.04;
            float mouseWave = sin(mouseDistance * 5.0 - time * 2.0) * 0.02 * (1.0 - mouseDistance);
            
            // Apply waves and mouse effects to gradient
            gradientFactor += wave1 + wave2 + wave3 + mouseEffect + mouseWave;
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);
            
            // Smooth gradient interpolation from purple to cyan
            vec3 finalColor = mix(purple, cyan, gradientFactor);
            
            // Theme-based intensity adjustment
            float intensity = mix(0.85, 0.65, uIsDark);
            finalColor *= intensity;
            
            // Subtle breathing effect
            float breathe = 0.92 + sin(time * 0.5) * 0.02 + uMouseVelocity * 0.01;
            finalColor *= breathe;
            
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

   const segments = isLowPerformance ? 16 : 32; // Reduced segments for mobile

   // Calculate plane size to ensure full screen coverage
   const planeWidth = Math.max(viewport.width * 1.5, isLowPerformance ? 30 : 50);
   const planeHeight = Math.max(viewport.height * 1.5, isLowPerformance ? 30 : 50);

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
         <ambientLight intensity={isLowPerformance ? 0.2 : 0.3} />
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
   const [useThreeJS, setUseThreeJS] = useState(false); // Default to false for safety

   console.log('Enhanced Background render:', { isDark, isLowPerformance, useThreeJS });

   useEffect(() => {
      try {
         // Check if WebGL is supported
         const canvas = document.createElement('canvas');
         const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

         if (!gl) {
            console.warn('WebGL not supported, using CSS fallback');
            setUseThreeJS(false);
         } else {
            // Even if WebGL is supported, use a simpler version for most devices
            // Only enable full Three.js for high-end devices
            const isHighEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8;
            const hasGoodGPU =
               gl.getParameter(gl.RENDERER).toLowerCase().includes('nvidia') ||
               gl.getParameter(gl.RENDERER).toLowerCase().includes('amd');

            setUseThreeJS(false); // Disable Three.js for now to prevent errors
            console.log('Three.js disabled for stability');
         }
      } catch (error) {
         console.warn('WebGL check failed, using CSS fallback:', error);
         setUseThreeJS(false);
      }
   }, []);

   if (!useThreeJS) {
      console.log('Rendering FallbackBackground');
      return <FallbackBackground />;
   }

   console.log('Rendering Enhanced Three.js background');

   return (
      <ErrorBoundary>
         <div className="enhanced-background">
            <Canvas
               camera={{ position: [0, 0, 10], fov: 60 }}
               gl={{
                  antialias: !isLowPerformance,
                  alpha: true,
                  powerPreference: 'high-performance',
                  preserveDrawingBuffer: false,
                  failIfMajorPerformanceCaveat: true,
               }}
               onCreated={({ gl, camera, size }) => {
                  console.log('Enhanced Three.js Canvas created successfully');
                  console.log('Canvas size:', {
                     width: size.width,
                     height: size.height,
                     top: size.top,
                     left: size.left,
                     updateStyle: size.updateStyle,
                  });
                  console.log('Camera aspect:', camera.aspect);

                  // Optimize renderer settings
                  gl.setPixelRatio(Math.min(window.devicePixelRatio, isLowPerformance ? 1 : 2));
                  gl.setClearColor(0x000000, 0);

                  // Handle context loss
                  gl.domElement.addEventListener('webglcontextlost', (event) => {
                     console.warn('WebGL context lost');
                     event.preventDefault();
                  });

                  gl.domElement.addEventListener('webglcontextrestored', () => {
                     console.log('WebGL context restored');
                  });
               }}
               onError={(error) => {
                  console.error('Three.js Canvas error:', error);
               }}
               style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: -1,
                  pointerEvents: 'none',
               }}
            >
               <Suspense fallback={null}>
                  <EnhancedBackgroundScene isLowPerformance={isLowPerformance} isDark={isDark} />
               </Suspense>
            </Canvas>
         </div>
      </ErrorBoundary>
   );
}

export default EnhancedBackground;

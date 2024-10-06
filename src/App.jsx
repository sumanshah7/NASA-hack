import React, { useRef, useState, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import 'tailwindcss/tailwind.css';
import Navbar from './components/Navbar';
import ChatBox from './components/ChatBox';
import ContactFormPage from './components/ContactFormPage';
import HowWeBuiltPage from './components/HowWeBuiltPage'; 





// Function to create a wave-like path for the arrow
const createWavelengthPath = (start, end, amplitude, frequency, segments) => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const position = new THREE.Vector3().lerpVectors(start, end, t);
    position.y += Math.sin(t * frequency * Math.PI * 2) * amplitude;
    points.push(position);
  }
  return new THREE.CatmullRomCurve3(points); // Create a smooth path
};

// Starfield Component
const Starfield = () => {
  const starGroup = useRef();
  useFrame(() => {
    starGroup.current.rotation.y += 0.0002;
  });
  const stars = new Array(2000).fill().map(() => {
    const x = THREE.MathUtils.randFloatSpread(500);
    const y = THREE.MathUtils.randFloatSpread(500);
    const z = THREE.MathUtils.randFloatSpread(500);
    return [x, y, z];
  });
  return (
    <group ref={starGroup}>
      {stars.map((star, i) => (
        <mesh key={i} position={star}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
};

// PlanetScene Component
const PlanetScene = ({ arrowActive, magnitude, showMars }) => {
  const earthRef = useRef();
  const moonRef = useRef();
  const marsRef = useRef();
  const tubeRef = useRef();
  const orbitRadiusMoon = 50;
  const orbitRadiusMars = 100;

  // Load textures for Earth, Moon, Mars
  const earthTexture = useLoader(TextureLoader, './textures/00_earthmap1k.jpg');
  const moonTexture = useLoader(TextureLoader, './textures/moon_texture2.jpg');
  const marsTexture = useLoader(TextureLoader, './textures/mars_texture2.jpg');

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }

    // Orbit Moon around Earth
    if (!showMars && moonRef.current && earthRef.current) {
      moonRef.current.rotation.y += 0.002;
      moonRef.current.position.x = earthRef.current.position.x + orbitRadiusMoon * Math.sin(time * 0.05);
      moonRef.current.position.z = earthRef.current.position.z + orbitRadiusMoon * Math.cos(time * 0.05);
    }

    // Rotate Mars if showing Mars
    if (showMars && marsRef.current) {
      marsRef.current.rotation.y += 0.002;
      marsRef.current.position.x = earthRef.current.position.x + orbitRadiusMars * Math.sin(time * 0.03);
      marsRef.current.position.z = earthRef.current.position.z + orbitRadiusMars * Math.cos(time * 0.03);
    }

    // Update the wave-like arrow path if arrowActive is true
    if (tubeRef.current && arrowActive) {
      const startPosition = showMars ? marsRef.current.position.clone() : moonRef.current.position.clone();
      const endPosition = earthRef.current.position.clone();
      const curve = createWavelengthPath(startPosition, endPosition, magnitude * 0.5, magnitude, 600);
      tubeRef.current.geometry.setFromPoints(curve.getPoints(600));
    }
  });

  return (
    <group>
      <Starfield />
      <mesh ref={earthRef} scale={4.5} position={[0, 0, 0]}>
        <sphereGeometry args={[4.5, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {!showMars && (
        <mesh ref={moonRef} scale={2.0}>
          <sphereGeometry args={[2.0, 64, 64]} />
          <meshStandardMaterial map={moonTexture} />
        </mesh>
      )}

      {showMars && (
        <mesh ref={marsRef} scale={2.65}>
          <sphereGeometry args={[2.65, 64, 64]} />
          <meshStandardMaterial map={marsTexture} />
        </mesh>
      )}

      {arrowActive && (
        <line ref={tubeRef}>
          <bufferGeometry />
          <lineBasicMaterial color="yellow" linewidth={6} />
        </line>
      )}
    </group>
  );
};

// Main application page component
const MainPage = () => {
  const [arrowActive, setArrowActive] = useState(false);
  const [magnitude, setMagnitude] = useState(5);
  const [showMars, setShowMars] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [canvasKey, setCanvasKey] = useState(0);

  const resetScene = (mars) => {
    setShowMars(mars);
    setArrowActive(false);
    setMessages([]);
    setShowChat(false);
    setCanvasKey((prevKey) => prevKey + 1);
  };

  const handleGenerate = () => {
    if (magnitude > 0 && magnitude <= 12) {
      setMessages([]);
      addMessage('User', `Earthquake magnitude ${magnitude} recorded.`);
      addMessage('System', 'Generating wavelength animation...');
      setArrowActive(true);
      setShowChat(true);
      setTimeout(() => {
        setArrowActive(false);
        addMessage('System', 'Simulation complete.');
      }, 3000);
    } else {
      alert('Please enter a magnitude between 1 and 12');
    }
  };

  const addMessage = (sender, text) => {
    setMessages((prevMessages) => [...prevMessages, { sender, text }]);
  };

  const handleSendMessage = (message) => {
    addMessage('User', message);
    setTimeout(() => {
      addMessage('System', 'Received your message.');
    }, 1000);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas key={canvasKey} camera={{ position: [0, 0, 120], fov: 75 }}>
          <ambientLight intensity={2.0} />
          <directionalLight position={[-2, 5, 5]} intensity={3.0} />
          <PlanetScene arrowActive={arrowActive} magnitude={magnitude} showMars={showMars} />
          <OrbitControls />
        </Canvas>
      </Suspense>

      {showChat && (
        <ChatBox
          isVisible={showChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <div className="flex flex-col items-center">
          <input
            type="number"
            min="1"
            max="12"
            value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
            className="text-white bg-black px-4 py-2 rounded-lg shadow-lg outline-none"
            placeholder="Magnitude"
          />
        </div>
        <button
          onClick={handleGenerate}
          className="bg-green-600 px-6 py-3 text-lg rounded-full hover:bg-green-700 shadow-lg transition-all"
        >
          Generate
        </button>
        <button
          onClick={() => resetScene(false)}
          className="bg-blue-600 px-6 py-3 text-lg rounded-full hover:bg-blue-700 shadow-lg transition-all"
        >
          Earth & Moon
        </button>
        <button
          onClick={() => resetScene(true)}
          className="bg-red-600 px-6 py-3 text-lg rounded-full hover:bg-red-700 shadow-lg transition-all"
        >
          Mars & Earth
        </button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="relative bg-gradient-to-b from-blue-900 to-black text-white min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/contact" element={<ContactFormPage />} />
          <Route path="/how-we-built" element={<HowWeBuiltPage />} />
        </Routes>
      </div>
    </Router>
  );

};

export default App;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-rotatedmarker';
import { FaSun, FaMoon } from 'react-icons/fa';

const busSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80">
    <!-- Shadow -->
    <rect x="4" y="4" width="32" height="72" rx="8" ry="8" fill="rgba(0,0,0,0.4)" filter="blur(2px)"/>
    <!-- Bus Body -->
    <rect x="2" y="2" width="36" height="76" rx="8" ry="8" fill="#38bdf8" stroke="#0ea5e9" stroke-width="2"/>
    <!-- Front Windshield -->
    <rect x="6" y="6" width="28" height="14" rx="3" ry="3" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <!-- Rear Window -->
    <rect x="6" y="64" width="28" height="10" rx="3" ry="3" fill="#0f172a"/>
    <!-- Roof AC Unit -->
    <rect x="12" y="30" width="16" height="20" rx="2" ry="2" fill="#94a3b8" />
    <line x1="14" y1="35" x2="26" y2="35" stroke="#475569" stroke-width="1"/>
    <line x1="14" y1="40" x2="26" y2="40" stroke="#475569" stroke-width="1"/>
    <line x1="14" y1="45" x2="26" y2="45" stroke="#475569" stroke-width="1"/>
    <!-- Headlights -->
    <circle cx="8" cy="3" r="2" fill="#fef08a"/>
    <circle cx="32" cy="3" r="2" fill="#fef08a"/>
    <!-- Taillights -->
    <circle cx="8" cy="77" r="2" fill="#ef4444"/>
    <circle cx="32" cy="77" r="2" fill="#ef4444"/>
    <!-- Indicator Glow -->
    <path d="M 2 12 Q -2 6 6 2" fill="none" stroke="#fef08a" stroke-width="0.5" opacity="0.5"/>
    <path d="M 38 12 Q 42 6 34 2" fill="none" stroke="#fef08a" stroke-width="0.5" opacity="0.5"/>
  </svg>
`;

const customBusIcon = L.divIcon({
  className: 'custom-bus-wrapper',
  html: `<div style="transform: rotate(0deg); display: flex; align-items: center; justify-content: center;">${busSvg}</div>`,
  iconSize: [40, 80],
  iconAnchor: [20, 40] // Perfect geometric centroid lock for rotation
});

// Hardware-accelerated dynamic vehicle rendering leveraging CSS translations and native DOM rotation mutations
const AnimatedMarker = ({ position, icon, heading }) => {
  const markerRef = React.useRef(null);

  useEffect(() => {
    if (markerRef.current && typeof markerRef.current.setRotationAngle === 'function') {
      markerRef.current.setRotationAngle(heading);
      markerRef.current.setRotationOrigin('center center'); // Lock anchor to geometrical center
    }
  }, [heading]);

  return <Marker ref={markerRef} position={position} icon={icon} rotationAngle={heading} rotationOrigin="center center" />;
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Geographic Matrix (Real-World Path Plots)
const STATIC_FULL_ROUTES = {
  'B101': [[15.3344, 74.7570], [15.5344, 74.6570], [15.7344, 74.5570], [15.8497, 74.4977]], // Haliyal -> Belgaum
  'B102': [[15.3344, 74.7570], [15.3000, 74.7000], [15.2667, 74.6667], [15.2361, 74.6173]], // Haliyal -> Dandeli
  'B103': [[15.3344, 74.7570], [15.4200, 74.9200], [15.4600, 75.0100], [15.3500, 75.1300]]  // Haliyal -> Hubli
};

const ROUTE_STOPS_DATA = {
  'B101': [
    { name: 'Haliyal Campus', lat: 15.3344, lng: 74.7570 },
    { name: 'Kittur Cross', lat: 15.5344, lng: 74.6570 },
    { name: 'MK Hubli', lat: 15.7344, lng: 74.5570 },
    { name: 'Belgaum City', lat: 15.8497, lng: 74.4977 }
  ],
  'B102': [
    { name: 'Haliyal Campus', lat: 15.3344, lng: 74.7570 },
    { name: 'Mavinkoppa', lat: 15.3000, lng: 74.7000 },
    { name: 'Barchi', lat: 15.2667, lng: 74.6667 },
    { name: 'Dandeli', lat: 15.2361, lng: 74.6173 }
  ],
  'B103': [
    { name: 'Haliyal Campus', lat: 15.3344, lng: 74.7570 },
    { name: 'Dharwad Toll', lat: 15.4200, lng: 74.9200 },
    { name: 'Navanagar', lat: 15.4600, lng: 75.0100 },
    { name: 'Hubli Hub', lat: 15.3500, lng: 75.1300 }
  ]
};

export default function Dashboard({ role }) {

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  }, [isDark]);

  const t = {
    bg: isDark ? '#0f172a' : 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.08) 0%, transparent 40%), linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 50%, #e0f2fe 100%)',
    text: isDark ? 'white' : '#0f172a',
    subtext: isDark ? '#94a3b8' : '#64748b',
    panelBg: isDark ? '#1e293b' : 'linear-gradient(145deg, #ffffff, #f8fafc)',
    panelGrad: isDark ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'linear-gradient(145deg, #ffffff, #f0f9ff)',
    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
    shadow: isDark ? '0 15px 35px rgba(0,0,0,0.4)' : '0 15px 35px rgba(0,0,0,0.08)',
    mapBorder: isDark ? '2px solid #334155' : '2px solid #cbd5e1',
    mapShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
    btnBgOff: isDark ? '#1e293b' : '#f1f5f9',
    tableBgHover: isDark ? "scale(1.03)" : "scale(1.03)",
    primaryText: isDark ? '#38bdf8' : '#0284c7',
    primaryGrad: isDark ? 'linear-gradient(45deg, #0ea5e9, #6f00ff)' : 'linear-gradient(45deg, #0284c7, #4f46e5)',
    haltGrad: isDark ? 'linear-gradient(45deg, #ff3366, #e11d48)' : 'linear-gradient(45deg, #ef4444, #b91c1c)',
    inputBg: isDark ? '#0f172a' : '#f8fafc',
    inputColor: isDark ? 'white' : '#0f172a',
    stopPassed: isDark ? '#10b981' : '#059669',
    stopFuture: isDark ? '#475569' : '#cbd5e1',
    innerPanelBg: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(248,250,252,0.8)',
    innerBorder: isDark ? 'none' : '1px solid #e2e8f0',
    signOutGrad: isDark ? 'linear-gradient(45deg, #1e293b, #334155)' : 'linear-gradient(45deg, #f8fafc, #e2e8f0)',
    signOutColor: isDark ? '#e2e8f0' : '#475569',
    signOutBorder: isDark ? '#475569' : '#cbd5e1',
    toastBg: isDark ? '#0ea5e9' : '#0284c7',
    toastText: isDark ? '#0f172a' : '#ffffff',
    pathColor: isDark ? '#ffffff' : '#0284c7'
  };
  const socket = React.useMemo(() => {
    return io(import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000', { transports: ['websocket'] })
  }, []);

  const navigate = useNavigate();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW STATES (added)
  const [isTripActive, setIsTripActive] = useState(false);
  const [busLocation, setBusLocation] = useState([15.3344, 74.7570]);
  const [busHeading, setBusHeading] = useState(0);
  const [liveLocation, setLiveLocation] = useState([15.3344, 74.7570]);
  const [liveHeading, setLiveHeading] = useState(0);

  // 🔥 Bi-directional State
  const [isReversed, setIsReversed] = useState(false); // Driver internal toggle
  const [tripDirection, setTripDirection] = useState(false); // Student listener
  const [isReached, setIsReached] = useState(false); // Driver Arrival Hook
  const [studentReached, setStudentReached] = useState(false); // Student Arrival Hook

  const [toasts, setToasts] = useState([]); // Array of toasts
  const addToast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const [nextStopIndex, setNextStopIndex] = useState(1); // Track next stop index

  const [currentUser, setCurrentUser] = useState(null);

  const tripProgressRef = React.useRef(0);
  const lastHeadingRef = React.useRef(0); // Protect CSS cartwheeling

  // Global Dynamic Bus ID Resolution (Injects strict mapping for offline legacy mock accounts!)
  let activeBusId = 'B101';
  if (currentUser) {
    if (currentUser.assignedBus) {
      activeBusId = typeof currentUser.assignedBus === 'object' ? currentUser.assignedBus.busNumber : currentUser.assignedBus;
    } else if (currentUser.email) {
      const numMatch = currentUser.email.match(/\d+/);
      if (numMatch) activeBusId = `B10${numMatch[0]}`;
    }
  }

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

  // ✅ Load current user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // ✅ Fetch pending students
  useEffect(() => {
    if (role === 'Admin') {
      fetch(`${BASE_URL}/api/auth/pending-students`)
        .then(res => res.json())
        .then(data => {
          console.log("PENDING:", data);
          setPendingStudents(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [role]);

  // ✅ Driver movement
  useEffect(() => {
    let interval;

    if (role === 'Driver' && isTripActive && currentUser) {
      interval = setInterval(() => {
        const baseRoute = STATIC_FULL_ROUTES[activeBusId] || STATIC_FULL_ROUTES['B101'];
        // Compute active array sequence
        const route = isReversed ? [...baseRoute].reverse() : baseRoute;

        let previousIndex = Math.floor(tripProgressRef.current);
        let nextProg = tripProgressRef.current + 0.05; // Simulation speed factor
        let currentIndex = Math.floor(nextProg);

        // Check if we hit a new stop
        if (currentIndex > previousIndex && currentIndex < route.length) {
          const isFinal = currentIndex >= route.length - 1;
          console.log(`[DRIVER SOCKET PROBE]: Emitting busEvent ${isFinal ? 'DESTINATION_REACHED' : 'STOP_REACHED'} at stopIndex ${currentIndex}`);
          socket.emit('busEvent', {
            busId: activeBusId,
            type: isFinal ? 'DESTINATION_REACHED' : 'STOP_REACHED',
            stopIndex: currentIndex,
            isReversed: isReversed
          });

          if (!isFinal) {
             const baseStops = ROUTE_STOPS_DATA[activeBusId] || ROUTE_STOPS_DATA['B101'];
             const orderedStops = isReversed ? [...baseStops].reverse() : baseStops;
             addToast(`📍 Reached Waypoint: ${orderedStops[currentIndex]?.name}`);
          }
        }

        // Auto-Stop Trip Upon Destination Arrival!
        if (currentIndex >= route.length - 1) {
          setIsTripActive(false);
          setIsReached(true);

          const baseStops = ROUTE_STOPS_DATA[activeBusId] || ROUTE_STOPS_DATA['B101'];
          const orderedStops = isReversed ? [...baseStops].reverse() : baseStops;
          addToast(`✅ Journey Complete: Arrived at ${orderedStops[route.length - 1]?.name}`);

          socket.emit('updateLocation', {
            busId: activeBusId,
            location: {
              latitude: route[route.length - 1][0],
              longitude: route[route.length - 1][1],
              heading: busHeading,
              isReversed: isReversed,
              isReached: true,
              nextStopIndex: route.length - 1
            }
          });
          return;
        }

        tripProgressRef.current = nextProg;

        const nextIndex = currentIndex + 1;
        const faction = nextProg - currentIndex;

        const currentPoint = route[currentIndex];
        const nextPoint = route[nextIndex];

        // Exact vector interpolation between active road segments!
        const newLat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * faction;
        const newLng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * faction;

        // Real-Time Vector bearing math
        const dLng = nextPoint[1] - currentPoint[1];
        const dLat = nextPoint[0] - currentPoint[0];
        let rawHeading = Math.atan2(dLng, dLat) * (180 / Math.PI);
        if (rawHeading < 0) rawHeading += 360;

        // Mathematically unwrap the 360-degree boundary to prevent CSS reverse-cartwheeling illusions!
        let diff = rawHeading - (lastHeadingRef.current % 360);
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;

        let headingVec = lastHeadingRef.current + diff;
        lastHeadingRef.current = headingVec;

        console.log(`📍 DRIVER EMIT: Bus ${activeBusId} at [${newLat.toFixed(5)}, ${newLng.toFixed(5)}] rawHead: ${Math.floor(rawHeading)} unwrapped: ${Math.floor(headingVec)}`);

        setBusLocation([newLat, newLng]);
        setBusHeading(headingVec);
        setIsReached(false); // Clear notification seamlessly upon motion

        socket.emit('updateLocation', {
          busId: activeBusId,
          location: {
            latitude: newLat,
            longitude: newLng,
            heading: headingVec,
            isReversed: isReversed,
            isReached: false,
            nextStopIndex: nextIndex
          }
        });

      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isTripActive, role, currentUser, isReversed]);

  // ✅ Student receives updates for THEIR assigned bus only
  useEffect(() => {
    if (role === 'Student') {
      const handleLocationUpdate = (data) => {
        // Enforce rigorous bus payload locking via explicit parsed strings globally!
        if (currentUser && currentUser.assignedBus) {
          const expectedNumber = typeof currentUser.assignedBus === 'object'
            ? currentUser.assignedBus.busNumber
            : currentUser.assignedBus;

          if (data.busId !== expectedNumber) {
            console.log(`Discarded socket belonging to ${data.busId} since I am mapped to ${expectedNumber}`);
            return;
          }
        }

        console.log(`📡 STUDENT RECEIVED: Bus ${data.busId} at [${data.location.latitude.toFixed(5)}, ${data.location.longitude.toFixed(5)}]`);

        setLiveLocation([
          data.location.latitude,
          data.location.longitude
        ]);

        if (data.location.heading !== undefined) {
          setLiveHeading(data.location.heading);
        }
        if (data.location.isReversed !== undefined) {
          setTripDirection(data.location.isReversed);
        }
        if (data.location.isReached !== undefined) {
          setStudentReached(prev => {
            if (!prev && data.location.isReached) {
              const baseStops = ROUTE_STOPS_DATA[data.busId] || ROUTE_STOPS_DATA['B101'];
              const orderedStops = data.location.isReversed ? [...baseStops].reverse() : baseStops;
              const reachedStopName = orderedStops[orderedStops.length - 1]?.name || 'Destination';
              addToast(`✅ Journey Complete: Arrived at ${reachedStopName}`);
            }
            return data.location.isReached;
          });
        }
        if (data.location.nextStopIndex !== undefined) {
          setNextStopIndex(prev => {
            if (prev !== undefined && prev !== data.location.nextStopIndex && !data.location.isReached) {
              const baseStops = ROUTE_STOPS_DATA[data.busId] || ROUTE_STOPS_DATA['B101'];
              const orderedStops = data.location.isReversed ? [...baseStops].reverse() : baseStops;
              const reachedStopName = orderedStops[prev]?.name || 'Next Stop';
              addToast(`📍 Bus reached ${reachedStopName}`);
            }
            return data.location.nextStopIndex;
          });
        }
      };

      const handleBusEvent = (data) => {
        // Fallback for STARTED events since they are standalone
        if (currentUser && currentUser.assignedBus) {
          const expectedNumber = typeof currentUser.assignedBus === 'object'
            ? currentUser.assignedBus.busNumber
            : currentUser.assignedBus;

          if (data.busId === expectedNumber && data.type === 'STARTED') {
             addToast(data.message || `🚌 Bus ${data.busId} started its route!`);
          }
        }
      };

      socket.on('locationUpdate', handleLocationUpdate);
      socket.on('busEvent', handleBusEvent);

      return () => {
        socket.off('locationUpdate', handleLocationUpdate);
        socket.off('busEvent', handleBusEvent);
      };
    }
  }, [role, currentUser, addToast]);

  // ✅ Approve + assign bus
  const assignBus = async (userId, busNumber) => {
    try {
      if (!busNumber) return;

      const res = await fetch(`${BASE_URL}/api/auth/approve-student`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, busNumber })
      });

      const data = await res.json();
      console.log("RESPONSE:", data);

      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }

      alert("Student Approved!");

      setPendingStudents(prev =>
        prev.filter(s => s._id !== userId)
      );

    } catch (err) {
      console.error(err);
      alert("Error approving student");
    }
  };

  // 🎯 UI
  return (
    <div style={{
      padding: "20px",
      background: t.bg,
      minHeight: "100vh",
      color: t.text,
      transition: "all 0.3s ease",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* TOAST NOTIFICATION RENDERER */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: t.toastBg,
            color: t.toastText,
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            animation: 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
          }}>
            {toast.msg}
          </div>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: "1280px", boxSizing: "border-box" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
        <h1 style={{
          fontSize: "28px",
          margin: 0,
          color: t.primaryText,
          transition: "all 0.3s ease"
        }}>
          🚍 Nexus Transit - {role} Panel
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={toggleTheme}
            style={{
              padding: '10px 15px',
              background: t.signOutGrad,
              color: t.signOutColor,
              border: `1px solid ${t.signOutBorder}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              transition: 'all 0.3s'
            }}
          >
            {isDark ? <FaSun color="#fef08a" /> : <FaMoon color="#475569" />}
          </button>
          
          <button
          onClick={() => {
            localStorage.removeItem('userToken');
            navigate('/');
          }}
          style={{
            padding: '10px 20px',
            background: t.signOutGrad,
            color: t.signOutColor,
            border: `1px solid ${t.signOutBorder}`,
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ff3366'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff3366'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = t.signOutGrad; e.currentTarget.style.color = t.signOutColor; e.currentTarget.style.borderColor = t.signOutBorder; }}
        >
          <span>⟵</span> SIGN OUT
        </button>
        </div>
      </div>

      {/* ================= ADMIN ================= */}
      {role === 'Admin' && (
        <>
          <h2 style={{ marginBottom: "15px" }}>
            Pending Student Approvals
          </h2>

          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading...</p>
          ) : pendingStudents.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No pending requests</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px"
            }}>
              {pendingStudents.map(student => (
                <div
                  key={student._id}
                  style={{
                    background: t.panelBg,
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: t.shadow,
                    color: t.text,
                    transition: "0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <h3>{student.name}</h3>
                  <p style={{ color: t.subtext }}>{student.email}</p>
                  <p style={{ color: t.primaryText }}>
                    Preferred: {student.preferredRoute}
                  </p>

                  <select
                    onChange={(e) =>
                      assignBus(student._id, e.target.value)
                    }
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: t.inputBg,
                      color: t.inputColor,
                      border: t.border
                    }}
                  >
                    <option value="">Assign Bus</option>
                    <option value="B101">B101 - Belgaum</option>
                    <option value="B102">B102 - Dandeli</option>
                    <option value="B103">B103 - Dharwad/Hubli</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= DRIVER ================= */}
      {role === 'Driver' && currentUser && (() => {

        // Static geographical fallback if the MongoDB populated fields trace offline
        const ROUTE_NAMES = {
          'B101': { source: 'Haliyal', destination: 'Belgaum' },
          'B102': { source: 'Haliyal', destination: 'Dandeli' },
          'B103': { source: 'Haliyal', destination: 'Dharwad/Hubli' }
        };
        const fallbackRoute = ROUTE_NAMES[activeBusId] || { source: "Unknown Hub", destination: "Unknown Depot" };

        const dInfo = typeof currentUser.assignedBus === 'object' && currentUser.assignedBus.source
          ? { from: currentUser.assignedBus.source, to: currentUser.assignedBus.destination }
          : { from: fallbackRoute.source, to: fallbackRoute.destination };

        const dFrom = isReversed ? dInfo.to : dInfo.from;
        const dTo = isReversed ? dInfo.from : dInfo.to;

        return (

          <div style={{ marginTop: "20px", paddingBottom: '40px', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ marginBottom: "25px", textAlign: "center" }}>Driver Terminal</h2>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>

              {/* Mobile-Style Control Panel - Positioned Beside Map */}
              <div style={{
                flex: '1 1 320px',
                maxWidth: '450px',
                padding: '28px',
                background: t.panelGrad,
                borderRadius: '20px',
                border: t.border,
                boxShadow: t.shadow,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: t.subtext, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Vehicle Assigned</span>
                    <h2 style={{ margin: 0, color: t.primaryText, fontSize: '2.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🚌 {activeBusId}
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: t.innerPanelBg, border: t.innerBorder, padding: '12px 16px', borderRadius: '12px', boxSizing: 'border-box' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: isTripActive ? '#00ffd5' : '#ff3366', boxShadow: isTripActive ? '0 0 12px #00ffd5' : '0 0 12px #ff3366' }}></div>
                  <strong style={{ color: isTripActive ? '#00ffd5' : '#ff3366', fontSize: '1.2rem', letterSpacing: '1px' }}>{isTripActive ? "SYSTEM ACTIVE" : "SYSTEM OFFLINE"}</strong>
                </div>

                <div style={{ background: t.innerPanelBg, border: t.innerBorder, borderLeftWidth: '4px', padding: '16px 20px', borderRadius: '14px', borderLeft: `4px solid ${isDark ? '#6f00ff' : '#4f46e5'}` }}>
                  <span style={{ fontSize: '0.85rem', color: t.subtext, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Active Route</span>
                  <p style={{ fontSize: '1.3rem', margin: '6px 0 0 0', color: t.text, fontWeight: '500' }}>{dFrom} <strong style={{ color: '#6f00ff', margin: '0 10px' }}>&rarr;</strong> {dTo}</p>

                  {isReached && (
                    <p style={{ color: '#00ffd5', fontSize: '1.2rem', margin: '15px 0 0 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✅ Target Destination Reached!
                    </p>
                  )}
                </div>

                {(() => {
                  const baseStopsDriver = ROUTE_STOPS_DATA[activeBusId] || ROUTE_STOPS_DATA['B101'];
                  const orderedStopsDriver = isReversed ? [...baseStopsDriver].reverse() : baseStopsDriver;
                  
                  let driverNextStopIndex = isTripActive || tripProgressRef.current > 0 
                     ? Math.min(Math.floor(tripProgressRef.current) + 1, orderedStopsDriver.length - 1)
                     : 1;

                  if (isReached) driverNextStopIndex = orderedStopsDriver.length;

                  return (
                    <div style={{ marginTop: '5px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: t.subtext, fontSize: '0.9rem', textTransform: 'uppercase' }}>Route Progress</h4>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        {orderedStopsDriver.map((stop, index) => {
                          const isPast = index < driverNextStopIndex && !isReached;
                          const isCurrent = index === driverNextStopIndex && !isReached;
                          
                          let color = t.stopFuture;
                          if (isReached || isPast) color = t.stopPassed;
                          else if (isCurrent) color = t.primaryText;

                          return (
                            <React.Fragment key={index}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                  width: '14px', 
                                  height: '14px', 
                                  borderRadius: '50%', 
                                  background: color,
                                  boxShadow: isCurrent ? `0 0 12px ${t.primaryText}` : (isReached || isPast ? `0 0 8px ${t.stopPassed}` : 'none'),
                                  border: 'none'
                                }} />
                                <span style={{ 
                                  fontSize: '0.95rem', 
                                  color: isCurrent ? t.text : (isPast || isReached ? (isDark ? '#cbd5e1' : '#64748b') : t.subtext),
                                  fontWeight: isCurrent ? 'bold' : 'normal'
                                }}>
                                  {stop.name}
                                </span>
                              </div>
                              {index < orderedStopsDriver.length - 1 && (
                                <div style={{ flex: 1, minWidth: '15px', maxWidth: '30px', height: '2px', background: isReached || isPast ? t.stopPassed : (isDark ? '#334155' : '#e2e8f0') }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <button
                    disabled={isTripActive}
                    onClick={() => {
                      if (!currentUser) return;
                      if (!isTripActive && isReached) {
                        setIsReversed(!isReversed);
                        setIsReached(false);
                        tripProgressRef.current = 0;
                      }
                      setIsTripActive(true);
                      addToast(`▶ System Online: Navigating to ${dTo}`);
                      console.log(`📤 DRIVER SENDING RAW SOCKET EVENT:`, { busId: activeBusId, type: 'STARTED' });
                      socket.emit('busEvent', { busId: activeBusId, type: 'STARTED', message: `🚌 Bus ${activeBusId} has started its route!` });
                    }}
                    style={{ padding: '18px', borderRadius: '14px', background: isTripActive ? t.btnBgOff : t.primaryGrad, color: isTripActive ? t.subtext : 'white', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: isTripActive ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: isTripActive ? 'none' : (isDark ? '0 6px 20px rgba(111, 0, 255, 0.4)' : '0 6px 20px rgba(2, 132, 199, 0.4)') }}>
                    ▶ INITIATE ROUTE
                  </button>
                  <button
                    disabled={!isTripActive}
                    onClick={() => setIsTripActive(false)}
                    style={{ padding: '18px', borderRadius: '14px', background: !isTripActive ? t.btnBgOff : t.haltGrad, color: !isTripActive ? t.subtext : 'white', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: !isTripActive ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: !isTripActive ? 'none' : '0 6px 20px rgba(225, 29, 72, 0.4)' }}>
                    ⏹ HALT MOVEMENT
                  </button>
                </div>
              </div>

              {/* Responsive Map View - Positioned on Right */}
              <div style={{ flex: '1 1 400px', height: "65vh", minHeight: "400px", borderRadius: "16px", border: t.mapBorder, boxShadow: t.mapShadow, overflow: "hidden", boxSizing: "border-box" }}>
                <MapContainer
                  center={busLocation}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {/* Draw Path Visually */}
                  <Polyline
                    positions={STATIC_FULL_ROUTES[activeBusId] || STATIC_FULL_ROUTES['B101']}
                    pathOptions={{ color: t.pathColor, weight: 6, opacity: isDark ? 0.9 : 0.7, className: 'glowing-path' }}
                  />

                  <AnimatedMarker position={busLocation} icon={customBusIcon} heading={busHeading} />
                </MapContainer>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= STUDENT ================= */}
      {role === 'Student' && (
        <div style={{ marginTop: "20px" }}>

          {currentUser && currentUser.assignedBus && (() => {
            const assignedBusId = typeof currentUser.assignedBus === 'object' ? currentUser.assignedBus.busNumber : currentUser.assignedBus;
            const sFrom = tripDirection ? currentUser.route?.to : currentUser.route?.from;
            const sTo = tripDirection ? currentUser.route?.from : currentUser.route?.to;

            // Resolve Stops
            const baseStops = ROUTE_STOPS_DATA[assignedBusId] || ROUTE_STOPS_DATA['B101'];
            const orderedStops = tripDirection ? [...baseStops].reverse() : baseStops;
           
            let nextStop = orderedStops[nextStopIndex];
            if (!nextStop) nextStop = orderedStops[orderedStops.length - 1]; // fallback

            let distanceToNextStop = 0;
            if (nextStop) {
               distanceToNextStop = getDistance(liveLocation[0], liveLocation[1], nextStop.lat, nextStop.lng);
            }
            const etaMins = Math.max(1, Math.ceil(distanceToNextStop * 1.5)); // 40 km/h -> 1.5 mins per km

            return (
              <div style={{
                background: t.panelBg,
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '20px',
                borderLeft: `5px solid ${t.primaryText}`,
                boxShadow: t.shadow,
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h2 style={{ color: t.primaryText, marginBottom: '8px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🚌 Assigned Bus: {assignedBusId || "Unknown"}
                  </h2>
                  {currentUser.route && (
                    <p style={{ color: t.text, fontSize: '1.2rem', margin: 0 }}>
                      <strong style={{ color: t.subtext }}>Active Journey:</strong> {sFrom} &rarr; {sTo}
                    </p>
                  )}
                  {studentReached && (
                    <p style={{ color: '#00ffd5', fontSize: '1.4rem', margin: '15px 0 0 0', fontWeight: 'bold' }}>
                      ✅ Destination Reached: {sTo}
                    </p>
                  )}
                  
                  {!studentReached && (
                    <div style={{ marginTop: '16px', padding: '12px', background: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.05)', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)'}` }}>
                      <h4 style={{ margin: '0 0 4px 0', color: t.subtext, fontSize: '0.9rem', textTransform: 'uppercase' }}>Upcoming Stop</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1.3rem', color: t.text, fontWeight: '600' }}>{nextStop.name}</span>
                        <span style={{ fontSize: '1.1rem', color: t.primaryText, fontWeight: 'bold' }}>Arriving in ~{etaMins} mins</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ flex: '1 1 100%', borderTop: t.border, paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: t.subtext, fontSize: '0.9rem', textTransform: 'uppercase' }}>Route Progress</h4>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    {orderedStops.map((stop, index) => {
                      const isPast = index < nextStopIndex && !studentReached;
                      const isCurrent = index === nextStopIndex && !studentReached;
                      const isReachedObj = studentReached && index === orderedStops.length - 1;
                      
                      let color = t.stopFuture; // Future stop
                      if (studentReached || isPast) color = t.stopPassed; // Passed / Reached whole trip
                      else if (isCurrent) color = t.primaryText; // Next

                      return (
                        <React.Fragment key={index}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ 
                              width: '14px', 
                              height: '14px', 
                              borderRadius: '50%', 
                              background: color,
                              boxShadow: isCurrent ? `0 0 12px ${t.primaryText}` : (studentReached || isPast ? `0 0 8px ${t.stopPassed}` : 'none'),
                              border: 'none'
                            }} />
                            <span style={{ 
                              fontSize: '0.95rem', 
                              color: isCurrent ? t.text : (isPast || studentReached ? (isDark ? '#cbd5e1' : '#64748b') : t.subtext),
                              fontWeight: isCurrent ? 'bold' : 'normal'
                            }}>
                              {stop.name}
                            </span>
                          </div>
                          {index < orderedStops.length - 1 && (
                            <div style={{ flex: 1, minWidth: '20px', maxWidth: '40px', height: '2px', background: studentReached || isPast ? t.stopPassed : (isDark ? '#334155' : '#e2e8f0') }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })()}

          <h2>Live Bus Tracking</h2>

          <MapContainer
            center={liveLocation}
            zoom={13}
            style={{ height: "65vh", width: "100%", borderRadius: "12px", border: `2px solid ${t.primaryText}`, boxShadow: t.mapShadow }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Draw Path Visually */}
            {currentUser && currentUser.assignedBus && (
              <Polyline
                positions={STATIC_FULL_ROUTES[typeof currentUser.assignedBus === 'object' ? currentUser.assignedBus.busNumber : currentUser.assignedBus] || STATIC_FULL_ROUTES['B101']}
                pathOptions={{ color: t.pathColor, weight: 6, opacity: isDark ? 0.9 : 0.7, className: 'glowing-path' }}
              />
            )}

            <AnimatedMarker position={liveLocation} icon={customBusIcon} heading={liveHeading} />
          </MapContainer>
        </div>
      )}
      </div>
    </div>
  );
}
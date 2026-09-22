import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE_URL = 'https://15-252-191-202.nip.io';

// Verified real dataset presets from model/creditcard.csv
const PRESETS = [
  {
    id: 'legit-1',
    name: 'Verified In-Store Purchase',
    tag: 'Legitimate',
    tagClass: 'tag-legit',
    expected: 'Low Risk (0.0%)',
    amount: 149.62,
    time: 0.0,
    features: [
      0.0, -1.3598, -0.0728, 2.5363, 1.3782, -0.3383, 0.4624, 0.2396,
      0.0987, 0.3638, 0.0908, -0.5516, -0.6178, -0.9914, -0.3112, 1.4682,
      -0.4704, 0.2080, 0.0258, 0.4040, 0.2514, -0.0183, 0.2778, -0.1105,
      0.0669, 0.1285, -0.1891, 0.1336, -0.0211, 149.62
    ]
  },
  {
    id: 'legit-2',
    name: 'Everyday Coffee / Digital Sub',
    tag: 'Legitimate',
    tagClass: 'tag-legit',
    expected: 'Low Risk (0.0%)',
    amount: 2.69,
    time: 0.0,
    features: [
      0.0, 1.1919, 0.2662, 0.1665, 0.4482, 0.0600, -0.0824, -0.0788,
      0.0851, -0.2554, -0.1670, 1.6127, 1.0652, 0.4891, -0.1438, 0.6356,
      0.4639, -0.1148, -0.1834, -0.1458, -0.0691, -0.2258, -0.6387, 0.1013,
      -0.3398, 0.1672, 0.1259, -0.0090, 0.0147, 2.69
    ]
  },
  {
    id: 'suspicious-1',
    name: 'Zero-Dollar Bot Card Ping',
    tag: 'Suspicious',
    tagClass: 'tag-suspicious',
    expected: 'Medium Risk (55.0%)',
    amount: 0.0,
    time: 406.0,
    features: [
      406.0, -2.3122, 1.9520, -1.6099, 3.9979, -0.5222, -1.4265, -2.5374,
      1.3917, -2.7701, -2.7723, 3.2020, -2.8999, -0.5952, -4.2893, 0.3897,
      -1.1407, -2.8301, -0.0168, 0.4170, 0.1269, 0.5172, -0.0350, -0.4652,
      0.3202, 0.0445, 0.1778, 0.2611, -0.1433, 0.0
    ]
  },
  {
    id: 'fraud-1',
    name: 'Account Takeover / Stolen Card',
    tag: 'High Risk',
    tagClass: 'tag-fraud',
    expected: 'High Risk (100.0%)',
    amount: 239.93,
    time: 4462.0,
    features: [
      4462.0, -2.3033, 1.7592, -0.3597, 2.3302, -0.8216, -0.0758, 0.5623,
      -0.3991, -0.2383, -1.5254, 2.0329, -6.5601, 0.0229, -1.4701, -0.6988,
      -2.2822, -4.7818, -2.6157, -1.3344, -0.4300, -0.2942, -0.9324, 0.1727,
      -0.0873, -0.1561, -0.5426, 0.0396, -0.1530, 239.93
    ]
  },
  {
    id: 'fraud-2',
    name: 'Midnight Offshore Wire Transfer',
    tag: 'High Risk',
    tagClass: 'tag-fraud',
    expected: 'High Risk (>60.0%)',
    amount: 529.0,
    time: 472.0,
    features: [
      472.0, -3.0435, -3.1573, 1.0885, 2.2886, 1.3598, -1.0648, 0.3256,
      -0.0678, -0.2710, -0.8386, -0.4146, -0.5031, 0.6765, -1.6920, 2.0006,
      0.6668, 0.5997, 1.7253, 0.2833, 2.1023, 0.6617, 0.4355, 1.3760,
      -0.2938, 0.2798, -0.1454, -0.2528, 0.0358, 529.0
    ]
  }
];

export default function App() {
  const [activePreset, setActivePreset] = useState('legit-1');
  const [amount, setAmount] = useState(149.62);
  const [timeVal, setTimeVal] = useState(0.0);
  const [vFeatures, setVFeatures] = useState(
    PRESETS[0].features.slice(1, 29)
  );
  const [activeTab, setActiveTab] = useState('critical');

  // Backend state
  const [backendStatus, setBackendStatus] = useState('checking');
  const [latency, setLatency] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvResults, setCsvResults] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [savedPredictions, setSavedPredictions] = useState([]);

  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }

    setCsvLoading(true);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/predict-csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("CSV upload failed");
      }

      const data = await response.json();

      setCsvResults(data);

      console.log("CSV Prediction Results:", data);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong while uploading the CSV.");
    } finally {
      setCsvLoading(false);
    }
  };

  const csvSummary = csvResults?.results?.reduce(
    (summary, transaction) => {
      summary[transaction.risk_level.toLowerCase()] += 1;
      summary.totalProbability += transaction.fraud_probability;
      return summary;
    },
    { high: 0, medium: 0, low: 0, totalProbability: 0 }
  );

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/predictions`);

        if (!response.ok) {
          throw new Error("Failed to fetch predictions");
        }

        const data = await response.json();

        setSavedPredictions(data.predictions || []);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      }
    };

    fetchPredictions();
  }, []);


  // Auto Live Demo State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoBanner, setDemoBanner] = useState({ text: '', color: '#38bdf8' });
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, isClicking: false, visible: false });

  // DOM Refs for targeting elements during demo
  const presetRefs = useRef({});
  const tabRef = useRef(null);
  const analyzeBtnRef = useRef(null);
  const verdictCardRef = useRef(null);
  const auditSectionRef = useRef(null);

  // Check backend health
  const checkBackendHealth = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
      if (res.ok) {
        const ping = Math.round(performance.now() - startTime);
        setLatency(ping);
        setBackendStatus('online');
        setErrorMsg(null);
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackendHealth();
    executePrediction(PRESETS[0].features, PRESETS[0].amount);

    // Auto-launch demo if ?demo=true or if requested
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setTimeout(() => {
        startLiveDemo();
      }, 1200);
    }
  }, []);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setAmount(preset.amount);
    setTimeVal(preset.time);
    setVFeatures(preset.features.slice(1, 29));
    executePrediction(preset.features, preset.amount);
  };

  const handleFeatureChange = (index, value) => {
    const num = parseFloat(value);
    const updated = [...vFeatures];
    updated[index] = isNaN(num) ? 0.0 : num;
    setVFeatures(updated);
  };

  const constructPayload = () => {
    return [
      parseFloat(timeVal) || 0.0,
      ...vFeatures.map((v) => parseFloat(v) || 0.0),
      parseFloat(amount) || 0.0
    ];
  };

  const executePrediction = async (featuresOverride, amountOverride) => {
    setIsLoading(true);
    setErrorMsg(null);
    const fullVector = featuresOverride || constructPayload();
    const currentAmt = amountOverride !== undefined ? amountOverride : amount;

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: fullVector })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data);
      setBackendStatus('online');

      setHistory((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          amount: currentAmt,
          probability: data.fraud_probability,
          result: data.result,
          risk_level: data.risk_level,
          features: fullVector
        },
        ...prev.slice(0, 7)
      ]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to connect to backend.');
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const randomizeFeatures = () => {
    const randomized = vFeatures.map((v) => +(v + (Math.random() * 2 - 1)).toFixed(4));
    setVFeatures(randomized);
    setActivePreset(null);
  };

  const resetToZero = () => {
    setVFeatures(new Array(28).fill(0.0));
    setAmount(100.0);
    setTimeVal(0.0);
    setActivePreset(null);
  };

  const getRiskClass = () => {
    if (!prediction) return 'legit';
    if (prediction.risk_level === 'High' || prediction.prediction === 1) return 'fraud';
    if (prediction.risk_level === 'Medium') return 'medium';
    return 'legit';
  };

  const getRiskColor = () => {
    if (!prediction) return '#10b981';
    if (prediction.risk_level === 'High' || prediction.prediction === 1) return '#ef4444';
    if (prediction.risk_level === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  const getTopDeviations = () => {
    return vFeatures
      .map((val, idx) => ({ name: `V${idx + 1}`, val, abs: Math.abs(val) }))
      .sort((a, b) => b.abs - a.abs)
      .slice(0, 5);
  };

  const getTabFeatures = () => {
    if (activeTab === 'critical') {
      return vFeatures.slice(0, 10).map((val, i) => ({ index: i, name: `V${i + 1}`, val }));
    }
    if (activeTab === 'latent') {
      return vFeatures.slice(10, 20).map((val, i) => ({ index: i + 10, name: `V${i + 11}`, val }));
    }
    if (activeTab === 'extended') {
      return vFeatures.slice(20, 28).map((val, i) => ({ index: i + 20, name: `V${i + 21}`, val }));
    }
    return vFeatures.map((val, i) => ({ index: i, name: `V${i + 1}`, val }));
  };

  // --- AUTOMATED LIVE DEMO TOUR ---
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const animateCursorTo = async (element, click = false) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    setCursorPos({ x: targetX, y: targetY, isClicking: false, visible: true });
    await sleep(600);

    if (click) {
      setCursorPos({ x: targetX, y: targetY, isClicking: true, visible: true });
      await sleep(250);
      setCursorPos({ x: targetX, y: targetY, isClicking: false, visible: true });
      element.click();
      await sleep(400);
    }
  };

  const startLiveDemo = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setDemoBanner({
      text: '🤖 Live Agent Demonstration Starting... Initializing AI Pipeline',
      color: '#38bdf8'
    });
    await sleep(1500);

    // Step 1: Click High-Risk Fraud Preset
    setDemoBanner({
      text: 'Step 1/5: Clicking [Account Takeover / Stolen Card] Preset ($239.93)...',
      color: '#ef4444'
    });
    const fraudPreset = presetRefs.current['fraud-1'];
    if (fraudPreset) {
      await animateCursorTo(fraudPreset, true);
    }
    await sleep(2000);

    setDemoBanner({
      text: '🚨 Model Inference: 100.0% FRAUD PROBABILITY -> TRANSACTION BLOCKED!',
      color: '#ef4444'
    });

    // Step 2: Smooth scroll down to view the Crimson Gauge
    if (verdictCardRef.current) {
      verdictCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    await sleep(2500);

    // Step 3: Switch Tabs to Latent Vectors
    setDemoBanner({
      text: 'Step 2/5: Inspecting Deep Feature Space -> Switching to [Latent Vectors (V11-V20)]...',
      color: '#6366f1'
    });
    if (tabRef.current) {
      await animateCursorTo(tabRef.current, true);
    }
    await sleep(1800);

    // Step 4: Click 'Analyze Transaction with AI'
    setDemoBanner({
      text: 'Step 3/5: Submitting 30-feature vector payload to FastAPI Backend (/predict)...',
      color: '#06b6d4'
    });
    if (analyzeBtnRef.current) {
      await animateCursorTo(analyzeBtnRef.current, true);
    }
    await sleep(2200);

    // Step 5: Click Suspicious Medium Risk Preset
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await sleep(800);
    setDemoBanner({
      text: 'Step 4/5: Testing Suspicious [Zero-Dollar Bot Card Ping] -> Medium Risk (55.0%)...',
      color: '#f59e0b'
    });
    const suspPreset = presetRefs.current['suspicious-1'];
    if (suspPreset) {
      await animateCursorTo(suspPreset, true);
    }
    await sleep(2200);

    // Step 6: Click Legitimate Preset
    setDemoBanner({
      text: 'Step 5/5: Testing [Verified In-Store Purchase ($149.62)] -> Legitimate (0.0%)...',
      color: '#10b981'
    });
    const legitPreset = presetRefs.current['legit-1'];
    if (legitPreset) {
      await animateCursorTo(legitPreset, true);
    }
    await sleep(2200);

    setDemoBanner({
      text: '✅ Model Decision: APPROVED! Feature signature matches legitimate consumer profile.',
      color: '#10b981'
    });
    await sleep(1500);

    // Step 7: Scroll to Audit Log
    if (auditSectionRef.current) {
      auditSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setDemoBanner({
      text: '🎉 LIVE DEMO COMPLETE! All evaluated transactions logged to session audit trail.',
      color: '#10b981'
    });
    await sleep(3000);

    setCursorPos((prev) => ({ ...prev, visible: false }));
    setIsDemoRunning(false);
  };

  const probPercent = prediction ? (prediction.fraud_probability * 100).toFixed(1) : '0.0';

  return (
    <div className="app-container">
      {/* Visual Mouse Cursor Overlay for live demo */}
      {cursorPos.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: cursorPos.isClicking ? 'rgba(239, 68, 68, 0.95)' : 'rgba(56, 189, 248, 0.85)',
            border: '3px solid #ffffff',
            boxShadow: cursorPos.isClicking
              ? '0 0 25px #ef4444, 0 0 45px #ef4444'
              : '0 0 20px #06b6d4, 0 0 40px #6366f1',
            pointerEvents: 'none',
            zIndex: 1000000,
            transform: `translate(-50%, -50%) scale(${cursorPos.isClicking ? 1.6 : 1})`,
            transition: 'left 0.55s cubic-bezier(0.25, 1, 0.5, 1), top 0.55s cubic-bezier(0.25, 1, 0.5, 1), transform 0.15s ease, background-color 0.2s ease'
          }}
        />
      )}

      {/* Floating Demo Status Banner */}
      {isDemoRunning && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${demoBanner.color}`,
            borderRadius: '16px',
            padding: '12px 28px',
            color: '#fff',
            zIndex: 999999,
            boxShadow: `0 10px 40px ${demoBanner.color}66`,
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            pointerEvents: 'none',
            maxWidth: '90%'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            ⚡ LIVE AGENT BROWSER DEMO IN PROGRESS
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
            {demoBanner.text}
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-icon-wrapper">
              <svg className="brand-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="brand-title">SENTINEL AI</div>
              <div className="brand-subtitle">Real-Time Fraud Intelligence Engine</div>
            </div>
          </div>

          <div className="header-badges">
            {/* Live Interactive Demo Button */}
            <button
              onClick={startLiveDemo}
              disabled={isDemoRunning}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
                border: 'none',
                cursor: isDemoRunning ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isDemoRunning ? 'Demo Running...' : '▶ Play Live Demo'}</span>
            </button>

            <div className="badge">
              <span>Random Forest (100 Trees)</span>
            </div>

            <div className="badge">
              <span>Threshold: <strong>0.60</strong></span>
            </div>

            <button
              onClick={checkBackendHealth}
              className={`badge badge-backend ${backendStatus === 'online' ? 'online' : 'offline'}`}
              title="Click to re-ping backend"
            >
              <div className={`pulse-dot ${backendStatus === 'online' ? 'green' : 'red'}`} />
              <span>
                {backendStatus === 'online'
                  ? `API Live (HTTPS ${latency ? `• ${latency}ms` : ''})`
                  : 'API Offline (HTTPS)'}
              </span>
            </button>
          </div>
        </div>  
      </header>

      {/* Main Container */}
      <main className="main-wrapper">
        {backendStatus === 'offline' && (
          <div className="pipeline-banner">
            <div className="pipeline-banner-text">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>FastAPI backend is offline or disconnected.</strong> Ensure server is running at <code>https://15-252-191-202.nip.io</code>.
              </span>
            </div>
            <button onClick={checkBackendHealth} className="pipeline-retry-btn">
              Re-check Pipeline
            </button>
          </div>
        )}

        {/* Real Scenario Presets Strip */}
        <div className="presets-strip">
          <div className="presets-header">
            <div className="presets-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Real Transaction Test Vectors (CreditCard Dataset)
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              Click any scenario to load 30 verified features & evaluate immediately
            </span>
          </div>

          <div className="presets-grid">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                ref={(el) => (presetRefs.current[p.id] = el)}
                onClick={() => applyPreset(p)}
                className={`preset-chip ${activePreset === p.id ? 'active' : ''}`}
              >
                <div className="preset-title">
                  <span>{p.name}</span>
                  <span className={p.tagClass}>{p.tag}</span>
                </div>
                <div className="preset-meta">
                  ${p.amount.toFixed(2)} • Expected: {p.expected}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              📂 CSV Transaction Analysis
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              Upload transaction data for batch prediction
            </span>
          </div>

          <div style={{ padding: '1rem' }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="text-input"
            />

            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || csvLoading}
              className="btn-primary"
              style={{ marginTop: '1rem' }}
            >
              {csvLoading ? 'Processing CSV...' : 'Analyze CSV File'}
            </button>

            {csvResults && csvSummary && (
              <div style={{ marginTop: '1rem' }}>
                <strong>
                  Transactions Processed: {csvResults.total_transactions}
                </strong>

                <p style={{ marginTop: '0.5rem' }}>
                  CSV analysis completed successfully.
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  Average Fraud Probability:{' '}
                  <strong>
                    {(
                      csvSummary.totalProbability /
                      csvResults.total_transactions *
                      100
                    ).toFixed(2)}%
                  </strong>
                </p>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginTop: '1rem'
                }}>
                  <div>
                    🟢 Low Risk: <strong>{csvSummary.low}</strong>
                  </div>

                  <div>
                    🟡 Medium Risk: <strong>{csvSummary.medium}</strong>
                  </div>

                  <div>
                    🔴 High Risk: <strong>{csvSummary.high}</strong>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <strong>Risk Distribution</strong>

                    <div style={{
                      display: 'flex',
                      height: '18px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginTop: '0.7rem',
                      background: '#1f2937'
                    }}>
                      <div style={{
                        width: `${(csvSummary.low / csvResults.total_transactions) * 100}%`,
                        background: '#22c55e'
                      }}></div>

                      <div style={{
                        width: `${(csvSummary.medium / csvResults.total_transactions) * 100}%`,
                        background: '#facc15'
                      }}></div>

                      <div style={{
                        width: `${(csvSummary.high / csvResults.total_transactions) * 100}%`,
                        background: '#ef4444'
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Workstation Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Input Vector */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Transaction Signature Parameters
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={randomizeFeatures} className="shortcut-btn">
                    Randomize
                  </button>
                  <button onClick={resetToZero} className="shortcut-btn">
                    Reset
                  </button>
                </div>
              </div>

              {/* Primary Inputs */}
              <div className="form-section-title">Primary Metadata</div>
              <div className="primary-inputs-row">
                <div className="input-field-group">
                  <label className="input-label">
                    <span>Transaction Amount</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>USD ($)</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => {
                        setAmount(parseFloat(e.target.value) || 0);
                        setActivePreset(null);
                      }}
                      className="text-input"
                    />
                  </div>
                  <div className="amount-shortcuts">
                    {[10, 50, 149.62, 239.93, 529, 1200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className="shortcut-btn"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <span>Elapsed Time</span>
                    <span style={{ color: 'var(--text-subtle)' }}>Seconds from Genesis</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={timeVal}
                      onChange={(e) => {
                        setTimeVal(parseFloat(e.target.value) || 0);
                        setActivePreset(null);
                      }}
                      className="text-input no-prefix"
                    />
                  </div>
                  <div className="amount-shortcuts">
                    {[0, 406, 472, 4462, 86400].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeVal(t)}
                        className="shortcut-btn"
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Space */}
              <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
                Latent Feature Space (28 PCA Principal Components)
              </div>

              {/* Tabs */}
              <div className="vector-tabs">
                <button
                  className={`vector-tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
                  onClick={() => setActiveTab('critical')}
                >
                  Key Drivers (V1 - V10)
                </button>
                <button
                  ref={tabRef}
                  className={`vector-tab-btn ${activeTab === 'latent' ? 'active' : ''}`}
                  onClick={() => setActiveTab('latent')}
                >
                  Latent Vectors (V11 - V20)
                </button>
                <button
                  className={`vector-tab-btn ${activeTab === 'extended' ? 'active' : ''}`}
                  onClick={() => setActiveTab('extended')}
                >
                  Extended (V21 - V28)
                </button>
                <button
                  className={`vector-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All 28 Components
                </button>
              </div>

              {/* Feature Grid */}
              <div className="features-grid">
                {getTabFeatures().map((f) => {
                  const isAnomaly = Math.abs(f.val) > 2.5;
                  return (
                    <div
                      key={f.name}
                      className={`feature-box ${isAnomaly ? 'highlight' : ''}`}
                    >
                      <div className="feature-box-header">
                        <span className="feature-name">{f.name}</span>
                        <div
                          className={`feature-indicator ${isAnomaly ? 'anomaly' : ''}`}
                          title={isAnomaly ? 'Significant deviation' : 'Normal range'}
                        />
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        value={f.val}
                        onChange={(e) => handleFeatureChange(f.index, e.target.value)}
                        className="feature-input"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="action-controls-bar">
                <button
                  ref={analyzeBtnRef}
                  onClick={() => executePrediction()}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>Evaluating Model Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Analyze Transaction with AI</span>
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--color-fraud)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Verdict */}
          <div>
            <div ref={verdictCardRef} className={`verdict-card ${getRiskClass()}`}>
              <div className="verdict-header">
                <div className={`verdict-icon ${getRiskClass()}`}>
                  {getRiskClass() === 'fraud' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {getRiskClass() === 'medium' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                  {getRiskClass() === 'legit' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>

                <div className="verdict-title-wrap">
                  <h3>
                    {prediction
                      ? prediction.prediction === 1
                        ? 'TRANSACTION BLOCKED: FRAUD DETECTED'
                        : prediction.risk_level === 'Medium'
                          ? 'TRANSACTION SUSPICIOUS: STEP-UP 2FA'
                          : 'TRANSACTION APPROVED: LEGITIMATE'
                      : 'AWAITING TRANSACTION EVALUATION'}
                  </h3>
                  <p>
                    {prediction
                      ? `Risk Severity: ${prediction.risk_level.toUpperCase()} | Model Verdict: ${prediction.result}`
                      : 'Submit transaction parameters to obtain real-time inference'}
                  </p>
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="gauge-wrapper">
                <svg className="gauge-svg" viewBox="0 0 200 110">
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={getRiskColor()}
                    strokeWidth="14"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * (prediction?.fraud_probability || 0))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
                  />
                </svg>

                <div className="gauge-score-display">
                  <div className="gauge-score-val" style={{ color: getRiskColor() }}>
                    {probPercent}%
                  </div>
                  <div className="gauge-score-lbl">Fraud Probability</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="metrics-grid">
                <div className="metric-pill">
                  <span className="metric-pill-title">Model Decision</span>
                  <span className="metric-pill-value" style={{ color: getRiskColor() }}>
                    {prediction ? (prediction.prediction === 1 ? '1 (Fraud)' : '0 (Legit)') : '—'}
                  </span>
                </div>

                <div className="metric-pill">
                  <span className="metric-pill-title">Decision Threshold</span>
                  <span className="metric-pill-value">0.60 (60%)</span>
                </div>

                <div className="metric-pill">
                  <span className="metric-pill-title">Risk Classification</span>
                  <span className="metric-pill-value" style={{ color: getRiskColor() }}>
                    {prediction ? prediction.risk_level : '—'}
                  </span>
                </div>

                <div className="metric-pill">
                  <span className="metric-pill-title">Evaluated Amount</span>
                  <span className="metric-pill-value">${parseFloat(amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Box */}
              <div className="recommendation-box">
                <div className="recommendation-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Automated Gateway Protocol
                </div>
                <div className="recommendation-desc">
                  {prediction ? (
                    prediction.prediction === 1 ? (
                      <span style={{ color: '#fca5a5' }}>
                        <strong>Immediate Decline & Card Lock:</strong> The transaction signature exceeds the 60% fraud threshold. Block payment gateway authorization, notify the cardholder via SMS/email, and route case to the risk operations queue.
                      </span>
                    ) : prediction.risk_level === 'Medium' ? (
                      <span style={{ color: '#fde68a' }}>
                        <strong>Challenge with 3D Secure / OTP:</strong> Transaction demonstrates anomalous latent features (probability 30%–60%). Trigger multi-factor authentication before permitting settlement.
                      </span>
                    ) : (
                      <span style={{ color: '#a7f3d0' }}>
                        <strong>Auto-Approve & Settle:</strong> Low risk indicators detected. Feature distribution conforms with standard consumer spending behavior. Pass directly to clearinghouse.
                      </span>
                    )
                  ) : (
                    'Ready for transaction evaluation.'
                  )}
                </div>
              </div>
            </div>

            {/* Feature Impact Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Top Component Deviations
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Distance from mean
                </span>
              </div>

              <div className="feature-impacts-list">
                {getTopDeviations().map((item) => {
                  const percentWidth = Math.min(100, Math.round((item.abs / 6.0) * 100));
                  const isHighDev = item.abs > 2.5;
                  return (
                    <div key={item.name} className="impact-row">
                      <span className="impact-feature-name">{item.name}</span>
                      <div className="impact-bar-track">
                        <div
                          className="impact-bar-fill"
                          style={{
                            width: `${percentWidth}%`,
                            background: isHighDev ? 'var(--color-fraud)' : 'var(--accent-indigo)'
                          }}
                        />
                      </div>
                      <span className="impact-value">
                        {item.val > 0 ? `+${item.val.toFixed(2)}` : item.val.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log / History Table */}
        <div ref={auditSectionRef} className="audit-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="12 8 12 12 14 14" />
                  <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                </svg>
                Session Transaction Audit Log
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                Click any historical row to re-load into analyzer
              </span>
            </div>

            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Evaluated Amount</th>
                    <th>Fraud Probability</th>
                    <th>Classification</th>
                    <th>Risk Severity</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No transactions evaluated yet this session.
                      </td>
                    </tr>
                  ) : (
                    history.map((row) => {
                      const isFraud = row.result === 'Fraudulent' || row.risk_level === 'High';
                      const isMedium = row.risk_level === 'Medium';
                      const badgeClass = isFraud ? 'fraud' : isMedium ? 'medium' : 'legit';

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setAmount(row.amount);
                            setTimeVal(row.features[0]);
                            setVFeatures(row.features.slice(1, 29));
                            setPrediction({
                              fraud_probability: row.probability,
                              prediction: isFraud ? 1 : 0,
                              result: row.result,
                              risk_level: row.risk_level
                            });
                          }}
                        >
                          <td>{row.time}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                            ${parseFloat(row.amount).toFixed(2)}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {(row.probability * 100).toFixed(1)}%
                          </td>
                          <td>
                            <span className={`status-badge ${badgeClass}`}>
                              {row.result}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: isFraud ? 'var(--color-fraud)' : isMedium ? 'var(--color-medium)' : 'var(--color-legit)'
                            }}>
                              {row.risk_level}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {isFraud ? '❌ Blocked' : isMedium ? '⚠️ 2FA Required' : '✅ Auto-Approved'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

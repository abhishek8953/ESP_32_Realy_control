import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Loading from "../Loading";
import "./control.css"


const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

function Control() {
    const [state, setState] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
    const [loading, setLoading] = useState(true);
    const [buttonName, setButtonName] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const audioContextRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get button state
                const healthRes = await axios.get(url + "/health");
                if (healthRes.data?.status) {
                    // Convert any truthy value to 1, falsy to 0 for consistency
                    const normalizedData = healthRes.data.data.map(val => val ? 1 : 0);
                    setState(normalizedData);
                }

                // Get button names from /v2/buttons
                const buttonsRes = await axios.get(url + "/buttons", { withCredentials: true });
                if (Array.isArray(buttonsRes.data?.buttonName)) {
                    setButtonName(buttonsRes.data.buttonName);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Sync state with server every 3 seconds to prevent race conditions
        const syncInterval = setInterval(async () => {
            try {
                const healthRes = await axios.get(url + "/health");
                if (healthRes.data?.status) {
                    const normalizedData = healthRes.data.data.map(val => val ? 1 : 0);
                    setState(normalizedData);
                    setConnectionStatus('connected');
                }
            } catch (error) {
                console.error("Error syncing state:", error);
                setConnectionStatus('disconnected');
            }
        }, 3000);

        return () => clearInterval(syncInterval);
    }, []);

    function getPinLabel(index) {
        return buttonName[index]?.name || `Pin ${index + 1}`;
    }

    // Helper function to show toast notifications
    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type }), 4000);
    };

    // Initialize or get AudioContext once
    const getAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    // Play click sound
    const playClickSound = () => {
        if (!soundEnabled) return;
        
        const audioContext = getAudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    function submitHandler(index) {
        playClickSound();

        const newState = state.map((value, i) =>
            i === index ? (value === 0 ? 1 : 0) : value
        );

        const sendData = async () => {
            try {
                await axios.post(url + "/data", {
                    data: newState,
                });
                setConnectionStatus('connected');
                // Fetch latest state from server after update to sync
                setTimeout(async () => {
                    const healthRes = await axios.get(url + "/health");
                    if (healthRes.data?.status) {
                        const normalizedData = healthRes.data.data.map(val => val ? 1 : 0);
                        setState(normalizedData);
                    }
                }, 200);
            } catch (err) {
                console.error("Error toggling pin:", err);
                setConnectionStatus('disconnected');
                showToast('Failed to update pin. Please check your connection.');
            }
        };
        sendData();
        setState(newState);
    }

    const playBatchSound = () => {
        if (!soundEnabled) return;
        
        const audioContext = getAudioContext();
        // First beep
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 900;
        osc1.type = "sine";
        gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.08);

        // Second beep
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.18);
        osc2.start(audioContext.currentTime + 0.1);
        osc2.stop(audioContext.currentTime + 0.18);
    };

    const handleBatch = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        playBatchSound();

        const newState = e.target.name === "off" ? Array(8).fill(0) : Array(8).fill(1);
        
        try {
            await axios.post(url + "/data", { data: newState });
            setState(newState);
            setConnectionStatus('connected');
            // Fetch latest state from server to ensure sync
            setTimeout(async () => {
                const healthRes = await axios.get(url + "/health");
                if (healthRes.data?.status) {
                    const normalizedData = healthRes.data.data.map(val => val ? 1 : 0);
                    setState(normalizedData);
                }
            }, 500);
        } catch (error) {
            console.error("Error in batch operation:", error);
            setConnectionStatus('disconnected');
            showToast('Failed to update devices. Please check your connection.');
        }
    };

    return (
        <>
            {loading && <Loading />}
            {!loading && (
                <div className="control-container">
                    {/* Toast Notification */}
                    {toast.show && (
                        <div className={`toast toast-${toast.type}`}>
                            <span>{toast.message}</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="control-header">
                        <div className="header-top">
                            <div>
                                <h1>Device Control Panel</h1>
                                <p>Control your connected devices</p>
                            </div>
                            <div className="header-controls">
                                <div className={`connection-status status-${connectionStatus}`}>
                                    <span className="status-dot"></span>
                                    <span className="status-text">
                                        {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                            <button 
                                className="sound-toggle"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                title={soundEnabled ? "Sound ON" : "Sound OFF"}
                            >
                                <span className="sound-icon">
                                    {soundEnabled ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <path d="M15.54 8.46a7 7 0 0 1 0 9.9M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                            <line x1="23" y1="9" x2="17" y2="15"></line>
                                            <line x1="17" y1="9" x2="23" y2="15"></line>
                                        </svg>
                                    )}
                                </span>
                            </button>
                            </div>
                        </div>
                    </div>

                    {/* Pins Grid */}
                    <div className="pins-section">
                        <div className="pins-grid">
                            {[...Array(8)].map((_, i) => {
                                const pinName = `pin${i + 1}`;
                                const isOn = state[i];
                                return (
                                    <button
                                        key={pinName}
                                        name={pinName}
                                        className={`pin-card ${isOn ? "active" : ""}`}
                                        onClick={() => submitHandler(i)}
                                    >
                                        <div className="pin-indicator">
                                            {isOn ? "●" : "○"}
                                        </div>
                                        <div className="pin-name">{getPinLabel(i)}</div>
                                        <div className="pin-status">
                                            {isOn ? "ON" : "OFF"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Batch Controls */}
                    <div className="batch-section">
                        <h2>Quick Actions</h2>
                        <div className="batch-buttons">
                            <button
                                name="off"
                                className="batch-btn batch-off"
                                onClick={handleBatch}
                            >
                                <span className="batch-icon">⊖</span>
                                Turn All OFF
                            </button>
                            <button
                                name="on"
                                className="batch-btn batch-on"
                                onClick={handleBatch}
                            >
                                <span className="batch-icon">⊕</span>
                                Turn All ON
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Control;

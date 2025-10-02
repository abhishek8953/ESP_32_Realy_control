import React, { useEffect, useRef, useState } from "react";

const VoiceRecognition = ({ onCommand }) => {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const lastCommandRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
        .map((res) => res[0].transcript)
        .join(" ")
        .toLowerCase()
        .trim();

      setTranscript(results);
      console.log("Transcript:", results);

      // Avoid repeating the same command
      if (results === lastCommandRef.current) return;
      lastCommandRef.current = results;

      if (results.includes("turn on fan")) onCommand("fan", true);
      else if (results.includes("turn off fan")) onCommand("fan", false);
      else if (results.includes("turn on fridge")) onCommand("fridge", true);
      else if (results.includes("turn off fridge")) onCommand("fridge", false);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognition.abort();
    };
  }, [onCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }

    setIsListening((prev) => !prev);
  };

  if (!isSupported) {
    return (
      <p style={{ color: "red" }}>
        ❌ Your browser does not support Speech Recognition. Please use Chrome or Edge.
      </p>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <button
        onClick={toggleListening}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: isListening ? "#f44336" : "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {isListening ? "🛑 Stop Listening" : "🎙️ Start Voice Control"}
      </button>
      <p style={{ marginTop: "10px", fontWeight: "bold" }}>
        Transcript:{" "}
        <span style={{ color: "#555", fontStyle: "italic" }}>{transcript}</span>
      </p>
    </div>
  );
};

export default VoiceRecognition;

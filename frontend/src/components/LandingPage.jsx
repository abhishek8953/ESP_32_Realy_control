import React from "react";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="hero">
        <h1>Smart Home Automation</h1>
        <p>Control and monitor your home from anywhere, at any time.</p>
        <button onClick={() => window.location.href="./control"}>
          Open Control Panel
        </button>
      </header>

      {/* Features */}
      <section className="features">
        <h2>Features</h2>
        <div className="feature-list">
          <div className="feature">
            <h3>Real-Time Control</h3>
            <p>Control lights, fans, and appliances instantly from your dashboard.</p>
          </div>
          
          <div className="feature">
            <h3>Smart Automation</h3>
            <p>Automate tasks based on schedules .</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Connect Devices</h3>
            <p>Plug in your smart devices and register them to the system.</p>
          </div>
          <div className="step">
            <h3>2. Configure Rules</h3>
            <p>Set schedules, automation triggers, or remote control settings.</p>
          </div>
          <div className="step">
            <h3>3. Relax</h3>
            <p>Your home is now smart, responsive, and remotely accessible.</p>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="status-section">
        <h2>System Status</h2>
        <p className="status online">✅ Online & Connected</p>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <h2>Stay Updated</h2>
        <p>Subscribe to get updates about new features and devices.</p>
        <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }}>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} SmartHome Inc.</p>
        <p>
          <a href="https://github.com/abhishek8953" target="_blank" rel="noreferrer">GitHub</a> |{" "}
          <a href="mailto:abhishektiwarirt39@gmail.com">Contact</a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

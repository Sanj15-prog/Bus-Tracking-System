import re

# 1. Update index.css
with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write('''

/* Light Mode Overrides */
body.light {
  --bg-dark: #f1f5f9;
  --panel-bg: rgba(255, 255, 255, 0.9);
  --primary-neon: #0284c7;
  --secondary-accent: #6f00ff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --danger: #ef4444;
  --glass-border: rgba(0, 0, 0, 0.15);
}
body.light .landing-container {
  background: radial-gradient(circle at top left, rgba(111, 0, 255, 0.05) 0%, transparent 40%),
              radial-gradient(circle at bottom right, rgba(2, 132, 199, 0.05) 0%, transparent 40%),
              var(--bg-dark);
}
body.light .landing-card {
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
}
body.light .input-group input, body.light .input-group select, body.light .role-selector {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-main);
}
body.light .role-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
body.light .input-group input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}
''')

# 2. Update LandingPage.jsx
with open('src/components/LandingPage.jsx', 'r', encoding='utf-8') as f:
    landing = f.read()

landing_imports = "import React, { useState, useEffect } from 'react';"
landing = landing.replace("import React, { useState } from 'react';", landing_imports)
landing = landing.replace("import { FaEye, FaEyeSlash } from 'react-icons/fa';", "import { FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';")

theme_logic = """  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
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

  const [role, setRole] = useState('Student');"""

landing = landing.replace("  const [role, setRole] = useState('Student');", theme_logic)

button_html = """    <div className="landing-container">
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px',
          background: isDark ? 'linear-gradient(45deg, #1e293b, #334155)' : 'linear-gradient(45deg, #ffffff, #e2e8f0)',
          color: isDark ? '#e2e8f0' : '#475569',
          border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          zIndex: 1000,
          transition: 'all 0.3s'
        }}
      >
        {isDark ? <FaSun color="#fef08a" /> : <FaMoon color="#475569" />}
      </button>"""

landing = landing.replace('    <div className="landing-container">', button_html)

with open('src/components/LandingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(landing)

# 3. Update Dashboard.jsx to ALSO append the body class dynamically!
with open('src/components/Dashboard.jsx', 'r', encoding='utf-8') as f:
    dashboard = f.read()

if "document.body.classList.remove('light')" not in dashboard:
    dash_logic = """  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  }, [isDark]);"""
    dashboard = dashboard.replace("  const isDark = theme === 'dark';", dash_logic)

with open('src/components/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dashboard)

print("Done")

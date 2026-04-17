import re
import sys

with open('src/components/Dashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
text = text.replace("import 'leaflet-rotatedmarker';", "import 'leaflet-rotatedmarker';\nimport { FaSun, FaMoon } from 'react-icons/fa';")

# 2. Theme State inside Dashboard
theme_state = """
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  const isDark = theme === 'dark';

  const t = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    text: isDark ? 'white' : '#0f172a',
    subtext: isDark ? '#94a3b8' : '#64748b',
    panelBg: isDark ? '#1e293b' : '#ffffff',
    panelGrad: isDark ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'linear-gradient(145deg, #ffffff, #f1f5f9)',
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
"""
text = text.replace("export default function Dashboard({ role }) {\n  const socket = React.useMemo(", "export default function Dashboard({ role }) {\n" + theme_state + "  const socket = React.useMemo(")

# 3. Apply style variable logic throughout string replacements
text = text.replace('background: "#0f172a",\n      minHeight: "100vh",\n      color: "white",', 'background: t.bg,\n      minHeight: "100vh",\n      color: t.text,\n      transition: "all 0.3s ease",')
text = text.replace("background: '#0ea5e9',\n            color: '#0f172a',", "background: t.toastBg,\n            color: t.toastText,")

text = text.replace('color: "#38bdf8"\n        }}>', 'color: t.primaryText,\n          transition: "all 0.3s ease"\n        }}>')

button_group = """        <div style={{ display: 'flex', gap: '15px' }}>
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
          
          <button"""

initial_btn = """        <button
          onClick={() => {
            localStorage.removeItem('userToken');"""

text = text.replace(initial_btn, button_group + "\n          onClick={() => {\n            localStorage.removeItem('userToken');")
text = text.replace("<span>⟵</span> SIGN OUT\n        </button>", "<span>⟵</span> SIGN OUT\n        </button>\n        </div>")

text = text.replace("background: 'linear-gradient(45deg, #1e293b, #334155)',\n            color: '#e2e8f0',\n            border: '1px solid #475569',", "background: t.signOutGrad,\n            color: t.signOutColor,\n            border: `1px solid ${t.signOutBorder}`,")
text = text.replace("e.currentTarget.style.background = 'linear-gradient(45deg, #1e293b, #334155)'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569';", "e.currentTarget.style.background = t.signOutGrad; e.currentTarget.style.color = t.signOutColor; e.currentTarget.style.borderColor = t.signOutBorder;")

# Admin styles
text = text.replace('background: "#1e293b",\n                    padding: "20px",\n                    borderRadius: "12px",\n                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",', 'background: t.panelBg,\n                    padding: "20px",\n                    borderRadius: "12px",\n                    boxShadow: t.shadow,\n                    color: t.text,')
text = text.replace('<p style={{ color: "#94a3b8" }}>{student.email}</p>', '<p style={{ color: t.subtext }}>{student.email}</p>')
text = text.replace('<p style={{ color: "#38bdf8" }}>', '<p style={{ color: t.primaryText }}>')
text = text.replace('background: "#0f172a",\n                      color: "white"', 'background: t.inputBg,\n                      color: t.inputColor,\n                      border: t.border')

# Driver styles
text = text.replace("background: 'linear-gradient(145deg, #1e293b, #0f172a)',\n                borderRadius: '20px',\n                border: '1px solid rgba(255,255,255,0.05)',\n                boxShadow: '0 15px 35px rgba(0,0,0,0.4)',", "background: t.panelGrad,\n                borderRadius: '20px',\n                border: t.border,\n                boxShadow: t.shadow,\n                transition: 'all 0.3s ease',")
text = text.replace("color: '#94a3b8'", "color: t.subtext")
text = text.replace("color: '#38bdf8'", "color: t.primaryText")

text = text.replace("background: 'rgba(0,0,0,0.2)'", "background: t.innerPanelBg, border: t.innerBorder")
text = text.replace("background: 'rgba(0,0,0,0.25)'", "background: t.innerPanelBg, border: t.innerBorder, borderLeftWidth: '4px'")
text = text.replace("color: '#f0f4f8'", "color: t.text")
text = text.replace("borderLeft: '4px solid #6f00ff'", "borderLeft: `4px solid ${isDark ? '#6f00ff' : '#4f46e5'}`")

text = text.replace("background: isTripActive ? '#1e293b' : 'linear-gradient(45deg, #0ea5e9, #6f00ff)', color: isTripActive ? '#64748b' : 'white'", "background: isTripActive ? t.btnBgOff : t.primaryGrad, color: isTripActive ? t.subtext : 'white'")
text = text.replace("boxShadow: isTripActive ? 'none' : '0 6px 20px rgba(111, 0, 255, 0.4)'", "boxShadow: isTripActive ? 'none' : (isDark ? '0 6px 20px rgba(111, 0, 255, 0.4)' : '0 6px 20px rgba(2, 132, 199, 0.4)')")

text = text.replace("background: !isTripActive ? '#1e293b' : 'linear-gradient(45deg, #ff3366, #e11d48)', color: !isTripActive ? '#64748b' : 'white'", "background: !isTripActive ? t.btnBgOff : t.haltGrad, color: !isTripActive ? t.subtext : 'white'")

text = text.replace('border: "2px solid #334155", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"', 'border: t.mapBorder, boxShadow: t.mapShadow')


# Student styles
text = text.replace("background: '#1e293b'", "background: t.panelBg")
text = text.replace("borderLeft: '5px solid #38bdf8'", "borderLeft: `5px solid ${t.primaryText}`")
text = text.replace("boxShadow: '0 8px 25px rgba(0,0,0,0.3)'", "boxShadow: t.shadow")
text = text.replace("color: '#e2e8f0'", "color: t.text")
text = text.replace("background: 'rgba(56, 189, 248, 0.1)'", "background: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.05)'")
text = text.replace("border: '1px solid rgba(56, 189, 248, 0.3)'", "border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)'}`")
text = text.replace("color: '#f8fafc'", "color: t.text")

text = text.replace("borderTop: '1px solid rgba(255,255,255,0.1)'", "borderTop: t.border")

text = text.replace("let color = '#475569'; // Future stop", "let color = t.stopFuture; // Future stop")
text = text.replace("if (studentReached || isPast) color = '#10b981';", "if (studentReached || isPast) color = t.stopPassed;")
text = text.replace("else if (isCurrent) color = '#38bdf8';", "else if (isCurrent) color = t.primaryText;")
text = text.replace("boxShadow: isCurrent ? '0 0 12px #38bdf8' : (studentReached || isPast ? '0 0 8px #10b981' : 'none')", "boxShadow: isCurrent ? `0 0 12px ${t.primaryText}` : (studentReached || isPast ? `0 0 8px ${t.stopPassed}` : 'none')")
text = text.replace("color: isCurrent ? '#f8fafc' : (isPast || studentReached ? '#cbd5e1' : '#94a3b8')", "color: isCurrent ? t.text : (isPast || studentReached ? (isDark ? '#cbd5e1' : '#64748b') : t.subtext)")

text = text.replace("background: studentReached || isPast ? '#10b981' : '#334155'", "background: studentReached || isPast ? t.stopPassed : (isDark ? '#334155' : '#e2e8f0')")

text = text.replace('border: "2px solid #38bdf8", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"', 'border: `2px solid ${t.primaryText}`, boxShadow: t.mapShadow')

text = text.replace("pathOptions={{ color: '#ffffff', weight: 6, opacity: 0.9, className: 'glowing-path' }}", "pathOptions={{ color: t.pathColor, weight: 6, opacity: isDark ? 0.9 : 0.7, className: 'glowing-path' }}")
text = text.replace("pathOptions={{ color: '#ffffff', weight: 6, className: 'glowing-path' }}", "pathOptions={{ color: t.pathColor, weight: 6, opacity: isDark ? 0.9 : 0.7, className: 'glowing-path' }}")


if text.count('onClick={toggleTheme}') == 0:
    print('Failed to inject toggle button logic!', file=sys.stderr)

with open('src/components/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Successfully refactored Dashboard.jsx for Theme Support!')

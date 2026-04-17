import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Cut off everything after `/* Light Mode Overrides */` safely
if '/* Light Mode Overrides */' in css:
    css = css[:css.index('/* Light Mode Overrides */')].strip() + '\n\n'

if 'body.light' in css:
    css = css[:css.index('body.light')].strip() + '\n\n'

# Re-append cleanly with the new vibrant light mode gradient
css += '''/* Light Mode Overrides */
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
  background: radial-gradient(circle at top left, rgba(111, 0, 255, 0.06) 0%, transparent 40%),
              radial-gradient(circle at bottom right, rgba(2, 132, 199, 0.08) 0%, transparent 40%),
              linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
'''

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

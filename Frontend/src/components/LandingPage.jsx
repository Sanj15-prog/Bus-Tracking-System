import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function LandingPage() {
  const [view, setView] = useState('initial');

  // ✅ role state (used only for login selection)
  const [role, setRole] = useState('Student');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    preferredRoute: 'Belgaum'
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ✅ LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        import.meta.env.VITE_BACKEND_URL + '/api/auth/login',
        {
          email: formData.email,
          password: formData.password,
          role
        }
      );

      localStorage.setItem('user', JSON.stringify(res.data));
      redirectByRole(res.data.role); // ✅ backend role
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  // ✅ SIGNUP (ONLY STUDENT)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000') + '/api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "Student",
          preferredRoute: formData.preferredRoute
        }
      );

      if (res.data.accountStatus === 'Pending') {
        alert("Registration successful! Waiting for admin approval.");
        setView('login');
        return;
      }

      localStorage.setItem('user', JSON.stringify(res.data));
      redirectByRole("Student");
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  const redirectByRole = (selectedRole) => {
    if (selectedRole === 'Student') navigate('/student-dashboard');
    if (selectedRole === 'Admin') navigate('/admin-dashboard');
    if (selectedRole === 'Driver') navigate('/driver-panel');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-brand">
          <div className="brand-icon-large">
            <Bus size={64} />
          </div>
          <h1>Nexus Transit</h1>
          <p>Smart Mobility System</p>
        </div>

        <div className="landing-card">
          {view === 'initial' && (
            <div className="landing-actions">
              <h2>Welcome</h2>
              <p className="welcome-text">Select an option to begin your journey.</p>
              <button className="btn btn-primary" onClick={() => setView('login')}>
                Login
              </button>
              <button className="btn btn-secondary" onClick={() => setView('signup')}>
                Create Account
              </button>
            </div>
          )}

          {(view === 'login' || view === 'signup') && (
            <div className="auth-form-container">
              <button className="btn-back" onClick={() => setView('initial')}>
                <ArrowLeft size={16} /> Back
              </button>

              <h2>{view === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>

              {/* ✅ ROLE SELECTOR ONLY FOR LOGIN */}
              {view === 'login' && (
                <div className="role-selector">
                  {['Student', 'Admin', 'Driver'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-btn ${role === r ? 'active' : ''}`}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="auth-form"
                onSubmit={view === 'login' ? handleLoginSubmit : handleSignupSubmit}
              >
                {view === 'signup' && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

                {/* ✅ ONLY STUDENT ROUTE */}
                {view === 'signup' && (
                  <div className="input-group">
                    <label>Select Preferred Route</label>
                    <select
                      name="preferredRoute"
                      value={formData.preferredRoute}
                      onChange={handleChange}
                      required
                    >
                      <option value="Belgaum">Belgaum</option>
                      <option value="Dandeli">Dandeli</option>
                      <option value="Dharwad">Dharwad</option>
                      <option value="Hubli">Hubli</option>
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@campus.edu"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  {view === 'login' ? 'Login to Dashboard' : 'Create Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
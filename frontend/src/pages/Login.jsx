import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Shield, Lock, User, Mail, Phone, RefreshCw, AlertCircle, Cpu, CheckCircle2, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('CUSTOMER'); // 'CUSTOMER' or 'ADMIN'
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (searchParams.get('expired')) {
      setError('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  // Handle switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsRegister(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister && activeTab === 'CUSTOMER') {
        // Registration Flow (Customers only)
        await authAPI.register({
          username,
          password,
          email,
          firstName,
          lastName,
          phoneNumber
        });
        setSuccess('Registration successful! You can now log in.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Login Flow
        const response = await authAPI.login({ username, password });
        const { token, roles } = response.data;
        
        // Safety verification: Prevent regular customer from logging into admin tab, or vice versa
        if (activeTab === 'ADMIN' && !roles.includes('ROLE_ADMIN')) {
          throw new Error('Access denied: You do not possess administrative permissions.');
        }
        if (activeTab === 'CUSTOMER' && roles.includes('ROLE_ADMIN')) {
          throw new Error('Please log in through the Administrator Console tab.');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        if (roles.includes('ROLE_ADMIN')) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-teal-950/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-blue-950/20 blur-[130px] pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        
        {/* LEFT COLUMN: BRAND PROMOTION & BANNER */}
        <div className="hidden md:flex flex-col space-y-6 pr-4">
          <div className="flex items-center gap-2.5 text-teal-400">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-black tracking-widest text-white">Nexus Bank</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight">
            The next generation of intelligent financial management.
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Welcome to Nexus Bank. Enjoy secure accounts, instant atomic transfers, automated risk monitors, and personalized AI budgeting assistance.
          </p>

          <div className="space-y-4 pt-2">
            {[
              { title: "AI-Driven Fraud Detection", desc: "Automated machine-learning risk scoring to flag anomalies instantly.", icon: Cpu },
              { title: "Gemini Conversational Chatbot", desc: "Personalized savings tips, spending analysis, and budgeting feedback.", icon: ShieldCheck },
              { title: "Structured Statement Generation", desc: "Generate professional audited PDF account statements on demand.", icon: LayoutDashboard }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex gap-3">
                  <div className="p-1.5 h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generated Banner Image */}
          <div className="pt-4">
            <img 
              src="/bank_hero_banner.png" 
              alt="Nexus Bank Banner" 
              className="rounded-xl shadow-2xl border border-slate-800 w-full max-h-48 object-cover object-center"
              onError={(e) => {
                e.target.style.display = 'none'; // Fallback if image fails to load
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: DUAL LOGIN GATEWAY */}
        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel rounded-2xl p-8">
            
            {/* Header branding for mobile */}
            <div className="text-center md:hidden mb-6">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-teal-500/10 text-teal-400 mb-3 border border-teal-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-white">Nexus Bank</h1>
            </div>

            {/* Portal Navigation Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => handleTabChange('CUSTOMER')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'CUSTOMER'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Customer Access
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('ADMIN')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'ADMIN'
                    ? 'bg-red-955/60 text-red-200 shadow-md border border-red-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Administrator Console
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-xs text-slate-400">
                {activeTab === 'CUSTOMER' 
                  ? 'Sign in to manage accounts, make transfers, and chat with AI.' 
                  : 'Administrative access controls for systems oversight.'}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'ADMIN' ? 'admin' : 'customer'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                  />
                </div>
              </div>

              {isRegister && activeTab === 'CUSTOMER' && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 0199"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs transition-colors text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 text-xs ${
                  activeTab === 'ADMIN'
                    ? 'bg-red-700 hover:bg-red-650 active:bg-red-800'
                    : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700'
                } disabled:bg-slate-700`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  isRegister ? 'Register Account' : 'Authenticate Portal'
                )}
              </button>
            </form>

            {/* Toggle registry for customers only */}
            {activeTab === 'CUSTOMER' && (
              <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[11px] text-teal-400 hover:underline focus:outline-none font-semibold"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Open Profile"}
                </button>
              </div>
            )}



          </div>
        </div>

      </div>
    </div>
  );
}

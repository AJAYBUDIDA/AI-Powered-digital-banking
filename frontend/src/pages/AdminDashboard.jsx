import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  Users, CreditCard, ShieldAlert, FileText, Check, X,
  Activity, ShieldAlert as AlertIcon, RefreshCw, LogOut,
  Search, Lock, Unlock, Eye, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalDeposits: 0,
    totalCustomers: 0,
    totalAccounts: 0,
    pendingApprovals: 0,
    frozenAccounts: 0,
    activeFraudAlerts: 0
  });

  const [activeTab, setActiveTab] = useState('ACCOUNTS');
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [cards, setCards] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Filter States
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      // 1. Fetch Core Analytics
      const analRes = await adminAPI.getAnalytics();
      setAnalytics(analRes.data);

      // 2. Fetch specific tab data
      if (activeTab === 'ACCOUNTS') {
        const accRes = await adminAPI.getAccounts();
        setAccounts(accRes.data || []);
      } else if (activeTab === 'CARDS') {
        const cardsRes = await adminAPI.getCards();
        setCards(cardsRes.data || []);
      } else if (activeTab === 'LOANS') {
        const loansRes = await adminAPI.getLoans();
        setLoans(loansRes.data || []);
      } else if (activeTab === 'CUSTOMERS') {
        const custRes = await adminAPI.getCustomers();
        setCustomers(custRes.data || []);
      } else if (activeTab === 'FRAUD') {
        const fraudRes = await adminAPI.getFraudAlerts();
        setFraudAlerts(fraudRes.data || []);
      } else if (activeTab === 'AUDIT') {
        const auditRes = await adminAPI.getAuditLogs();
        setAuditLogs(auditRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ error: 'Failed to synchronize administrative dashboard data', success: '' });
    } finally {
      setLoading(false);
    }
  };

  // --- Administrative Handlers ---
  const handleApproveAccount = async (id) => {
    try {
      await adminAPI.approveAccount(id);
      setFeedback({ error: '', success: 'Account application successfully approved.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to approve account.', success: '' });
    }
  };

  const handleRejectAccount = async (id) => {
    try {
      await adminAPI.rejectAccount(id);
      setFeedback({ error: '', success: 'Account application rejected.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to reject account.', success: '' });
    }
  };

  const toggleFreezeAccount = async (accNum, currentStatus) => {
    try {
      if (currentStatus === 'FROZEN') {
        await adminAPI.unfreezeAccount(accNum);
        setFeedback({ error: '', success: `Account ${accNum} unfrozen successfully.` });
      } else {
        await adminAPI.freezeAccount(accNum);
        setFeedback({ error: '', success: `Account ${accNum} frozen successfully.` });
      }
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to toggle account lock state.', success: '' });
    }
  };

  const toggleFreezeCustomer = async (userId, currentStatus) => {
    try {
      if (currentStatus === 'FROZEN') {
        await adminAPI.unfreezeCustomer(userId);
        setFeedback({ error: '', success: 'Customer profile unlocked.' });
      } else {
        await adminAPI.freezeCustomer(userId);
        setFeedback({ error: '', success: 'Customer profile frozen successfully.' });
      }
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to toggle customer profile block.', success: '' });
    }
  };

  const handleResolveFraudAlert = async (id, status) => {
    try {
      await adminAPI.resolveFraudAlert(id, status);
      setFeedback({ error: '', success: `Fraud alert resolved as ${status}.` });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to resolve fraud alert.', success: '' });
    }
  };

  const handleApproveLoan = async (id) => {
    try {
      await adminAPI.approveLoan(id);
      setFeedback({ error: '', success: 'Loan application approved and funds disbursed successfully.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to approve loan application.', success: '' });
    }
  };

  const handleRejectLoan = async (id) => {
    try {
      await adminAPI.rejectLoan(id);
      setFeedback({ error: '', success: 'Loan application rejected.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to reject loan application.', success: '' });
    }
  };

  const handleApproveCard = async (id) => {
    try {
      await adminAPI.approveCard(id);
      setFeedback({ error: '', success: 'Card application approved and activated.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to approve card application.', success: '' });
    }
  };

  const handleRejectCard = async (id) => {
    try {
      await adminAPI.rejectCard(id);
      setFeedback({ error: '', success: 'Card application rejected.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to reject card application.', success: '' });
    }
  };

  const handleToggleCardLock = async (id) => {
    try {
      await adminAPI.toggleCardLock(id);
      setFeedback({ error: '', success: 'Card lock/unlock state toggled.' });
      fetchAdminData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to toggle card lock state.', success: '' });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Customer Filtering
  const filteredCustomers = customers.filter(c => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const username = c.username.toLowerCase();
    const email = c.email.toLowerCase();
    const search = customerSearch.toLowerCase();
    return fullName.includes(search) || username.includes(search) || email.includes(search);
  });

  // Recharts Chart Data
  const barChartData = [
    { name: 'Total Accounts', Count: analytics.totalAccounts, fill: '#334155' },
    { name: 'Pending Review', Count: analytics.pendingApprovals, fill: '#F59E0B' },
    { name: 'Active Alerts', Count: analytics.activeFraudAlerts, fill: '#EF4444' },
    { name: 'Frozen Accounts', Count: analytics.frozenAccounts, fill: '#64748B' }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] pb-12 text-slate-200">
      
      {/* Admin Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-teal-400">🛡️ Nexus Bank</span>
            <span className="text-xs bg-teal-500/10 text-teal-300 font-semibold px-2 py-0.5 rounded border border-teal-500/20">Admin Console</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm bg-red-955/20 hover:bg-red-955/40 text-red-300 border border-red-900/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Banner Alert Feedback */}
        {feedback.success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-start gap-2">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}
        {feedback.error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}

        {/* Global Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Core Deposits</span>
              <CreditCard className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-xl font-black text-white mt-2">₹{analytics.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-teal-400 mt-1">Across active client balances</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Customers</span>
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-xl font-black text-white mt-2">{analytics.totalCustomers}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Profiles registered in platform</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Accounts</span>
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-black text-white mt-2">{analytics.pendingApprovals}</h3>
            <p className="text-[10px] text-amber-400 mt-1">Awaiting opening approval</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Fraud Alerts</span>
              <AlertIcon className="w-5 h-5 text-red-500" />
            </div>
            <h3 className={`text-xl font-black mt-2 ${analytics.activeFraudAlerts > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {analytics.activeFraudAlerts}
            </h3>
            <p className="text-[10px] text-red-400 mt-1">Pending risk investigations</p>
          </div>

        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-6 overflow-x-auto pb-1">
          {[
            { id: 'ACCOUNTS', label: 'Accounts Review', icon: CreditCard },
            { id: 'CARDS', label: 'Cards Review', icon: CreditCard },
            { id: 'LOANS', label: 'Loans Review', icon: FileText },
            { id: 'CUSTOMERS', label: 'Customer Registry', icon: Users },
            { id: 'FRAUD', label: 'Fraud Operations', icon: AlertIcon },
            { id: 'AUDIT', label: 'Audit Logs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/40 min-h-[300px]">
          
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-teal-500 animate-spin" /></div>
          ) : (
            <>
              {/* TAB 1: ACCOUNTS REVIEW */}
              {activeTab === 'ACCOUNTS' && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Pending Account Opening Requests</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Owner</th>
                          <th className="p-4">Account Number</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">PAN Card</th>
                          <th className="p-4">Aadhar Card</th>
                          <th className="p-4 text-right">Initial Balance</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {accounts.filter(a => a.status === 'PENDING').length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500">No pending account approvals found.</td>
                          </tr>
                        ) : (
                          accounts.filter(a => a.status === 'PENDING').map(acc => (
                            <tr key={acc.id} className="hover:bg-slate-800/20">
                              <td className="p-4 font-semibold text-white">{acc.ownerName}</td>
                              <td className="p-4 font-mono">{acc.accountNumber}</td>
                              <td className="p-4 font-bold text-slate-350">{acc.accountType}</td>
                              <td className="p-4 font-mono">{acc.panNumber || 'N/A'}</td>
                              <td className="p-4 font-mono">{acc.aadharNumber || 'N/A'}</td>
                              <td className="p-4 text-right">₹{acc.balance.toFixed(2)}</td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApproveAccount(acc.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition-colors"
                                  title="Approve Account"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectAccount(acc.id)}
                                  className="bg-red-650 hover:bg-red-600 text-white p-1.5 rounded transition-colors"
                                  title="Reject Account"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h4 className="text-sm font-bold text-white uppercase tracking-wider pt-6 border-t border-slate-800">All Platform Accounts</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Owner</th>
                          <th className="p-4">Account Number</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">PAN Card</th>
                          <th className="p-4">Aadhar Card</th>
                          <th className="p-4 text-right">Balance</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Admin Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {accounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-800/20">
                            <td className="p-4 font-semibold text-white">{acc.ownerName}</td>
                            <td className="p-4 font-mono">{acc.accountNumber}</td>
                            <td className="p-4">{acc.accountType}</td>
                            <td className="p-4 font-mono">{acc.panNumber || 'N/A'}</td>
                            <td className="p-4 font-mono">{acc.aadharNumber || 'N/A'}</td>
                            <td className="p-4 text-right font-bold text-slate-350">₹{acc.balance.toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                acc.status === 'FROZEN' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {acc.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {acc.status !== 'PENDING' && (
                                <button
                                  onClick={() => toggleFreezeAccount(acc.accountNumber, acc.status)}
                                  className={`p-1.5 rounded transition-colors text-xs font-bold text-white ${
                                    acc.status === 'FROZEN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-650/80 hover:bg-red-605'
                                  }`}
                                >
                                  {acc.status === 'FROZEN' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: CARDS REVIEW */}
              {activeTab === 'CARDS' && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Debit & Credit Cards Applications</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Owner Name</th>
                          <th className="p-4">Linked Account</th>
                          <th className="p-4 font-mono">Assigned Card Number</th>
                          <th className="p-4">Card Type</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {cards.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-500">No card records found in database.</td>
                          </tr>
                        ) : (
                          cards.map(c => (
                            <tr key={c.id} className="hover:bg-slate-800/20">
                              <td className="p-4 font-semibold text-white">{c.ownerName}</td>
                              <td className="p-4 font-mono">{c.accountNumber}</td>
                              <td className="p-4 font-mono text-slate-300 font-bold">{c.cardNumber}</td>
                              <td className="p-4 font-bold text-slate-350">{c.cardType}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                  c.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {c.status === 'PENDING' ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleApproveCard(c.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition-colors"
                                      title="Approve / Activate Card"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectCard(c.id)}
                                      className="bg-red-650 hover:bg-red-600 text-white p-1.5 rounded transition-colors"
                                      title="Reject Card"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  c.status !== 'REJECTED' && (
                                    <button
                                      onClick={() => handleToggleCardLock(c.id)}
                                      className={`p-1.5 rounded transition-colors text-white ${
                                        c.status === 'BLOCKED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-650 hover:bg-red-600'
                                      }`}
                                      title={c.status === 'BLOCKED' ? 'Unlock / Unblock Card' : 'Lock / Block Card'}
                                    >
                                      {c.status === 'BLOCKED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                    </button>
                                  )
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: LOANS REVIEW */}
              {activeTab === 'LOANS' && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Credit Loan Applications</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Applicant Name</th>
                          <th className="p-4">Loan Type</th>
                          <th className="p-4 text-right">Principal</th>
                          <th className="p-4 font-mono">Aadhar Number</th>
                          <th className="p-4">Supporting Document Logs</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {loans.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500">No loan records found in database.</td>
                          </tr>
                        ) : (
                          loans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-800/20">
                              <td className="p-4 font-semibold text-white">{l.customerName}</td>
                              <td className="p-4 font-bold text-slate-350">{l.loanType.replace('_', ' ')}</td>
                              <td className="p-4 text-right font-black text-white">₹{l.amount.toLocaleString()}</td>
                              <td className="p-4 font-mono text-slate-350">{l.aadharNumber}</td>
                              <td className="p-4 max-w-[220px] truncate font-mono text-[10px] text-slate-400" title={l.additionalDocument}>
                                {l.additionalDocument}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                  l.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                  {l.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {l.status === 'PENDING' ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleApproveLoan(l.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition-colors"
                                      title="Approve Loan (Credit balance)"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectLoan(l.id)}
                                      className="bg-red-650 hover:bg-red-650 text-white p-1.5 rounded transition-colors"
                                      title="Reject Loan"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-[10px]">Closed</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOMER REGISTRY */}
              {activeTab === 'CUSTOMERS' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Customer Profiles</h4>
                    
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left List */}
                    <div className="lg:col-span-2 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredCustomers.map(cust => (
                            <tr key={cust.id} className="hover:bg-slate-800/20 cursor-pointer" onClick={() => setSelectedCustomer(cust)}>
                              <td className="p-4 font-semibold text-white">{cust.firstName} {cust.lastName}</td>
                              <td className="p-4 font-mono">{cust.username}</td>
                              <td className="p-4 text-slate-300">{cust.email}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  cust.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {cust.status}
                                </span>
                              </td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFreezeCustomer(cust.id, cust.status);
                                  }}
                                  className={`p-1.5 rounded transition-colors text-white ${
                                    cust.status === 'FROZEN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-650/80 hover:bg-red-600'
                                  }`}
                                  title={cust.status === 'FROZEN' ? 'Unfreeze Account' : 'Freeze Account'}
                                >
                                  {cust.status === 'FROZEN' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right Info Panel */}
                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 text-xs">
                      {selectedCustomer ? (
                        <div className="space-y-4">
                          <h5 className="font-extrabold text-white text-sm pb-2 border-b border-slate-800">Customer Profile Details</h5>
                          
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Full Name</span>
                            <span className="text-white font-semibold">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Registered Email</span>
                            <span className="text-white font-semibold">{selectedCustomer.email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Phone Number</span>
                            <span className="text-white font-semibold">{selectedCustomer.phoneNumber || 'N/A'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block mb-1.5">User Accounts ({selectedCustomer.accounts.length})</span>
                            <div className="space-y-2">
                              {selectedCustomer.accounts.map(acc => (
                                <div key={acc.id} className="p-2 rounded bg-slate-950/40 border border-slate-800 flex justify-between items-center">
                                  <div>
                                    <span className="font-mono text-white text-[10px]">{acc.accountNumber}</span>
                                    <span className="text-[8px] block text-slate-500">{acc.accountType}</span>
                                  </div>
                                  <span className="font-black text-teal-400">₹{acc.balance.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-center py-12">
                          Select a customer from the registry list to view detailed accounts and profile logs.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 5: FRAUD OPERATIONS */}
              {activeTab === 'FRAUD' && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Fraud Alerts Monitor</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Alert ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4 font-mono">TX Reference</th>
                          <th className="p-4 text-right">Risk Score</th>
                          <th className="p-4">Risk Factors</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Resolution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {fraudAlerts.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500">No fraud alerts registered in the system.</td>
                          </tr>
                        ) : (
                          fraudAlerts.map(alert => (
                            <tr key={alert.id} className="hover:bg-slate-850/10">
                              <td className="p-4 font-bold text-white">#0{alert.id}</td>
                              <td className="p-4">{alert.customerName}</td>
                              <td className="p-4 font-mono">{alert.transactionNumber}</td>
                              <td className="p-4 text-right font-black">
                                <span className={`px-2 py-0.5 rounded ${
                                  alert.riskScore >= 0.85 ? 'bg-red-500/10 text-red-400 glow-red' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {(alert.riskScore * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 max-w-[200px] truncate" title={alert.alertReason}>{alert.alertReason}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  alert.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 pulse-glow-red'
                                }`}>
                                  {alert.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {alert.status === 'PENDING' && (
                                  <div className="flex gap-1.5 justify-center">
                                    <button
                                      onClick={() => handleResolveFraudAlert(alert.id, 'RESOLVED')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                                    >
                                      Dismiss
                                    </button>
                                    <button
                                      onClick={() => handleResolveFraudAlert(alert.id, 'INVESTIGATED')}
                                      className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                                    >
                                      Investigate
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: AUDIT TRAIL */}
              {activeTab === 'AUDIT' && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">System Audit Logs</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Account ID / User</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-500">No logs found.</td>
                          </tr>
                        ) : (
                          auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-800/20 text-[11px]">
                              <td className="p-4 text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4 text-white font-semibold">
                                {log.user ? `${log.user.username} (ID: ${log.user.id})` : 'System / Anonymous'}
                              </td>
                              <td className="p-4 text-teal-400 font-bold">{log.action}</td>
                              <td className="p-4 text-slate-400 font-sans">{log.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}

        </div>

        {/* Visual Charts Analytics */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/40">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" /> Administrative Metrics Distribution
          </h3>
          <div className="h-64 w-full text-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="Count" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>

    </div>
  );
}

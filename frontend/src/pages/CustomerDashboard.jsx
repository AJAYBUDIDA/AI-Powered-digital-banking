import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';
import AIChatbot from '../components/AIChatbot';
import {
  CreditCard, ArrowUpRight, ArrowDownLeft, Send,
  PlusCircle, FileText, Search, Filter, Bell,
  LogOut, ShieldAlert, CheckCircle, RefreshCw, HelpCircle,
  Home, Compass, BarChart3, Settings, AlertTriangle, X, Info, Sparkles, User
} from 'lucide-react';
import { LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Main Dashboard Tab State
  const [dashboardTab, setDashboardTab] = useState('OVERVIEW'); // 'OVERVIEW', 'CARDS', 'LOANS'

  // Operations Console Tab State (Right Column)
  const [consoleTab, setConsoleTab] = useState('TRANSFER'); // 'TRANSFER', 'CASH', 'OPEN_ACCOUNT'

  // Modal / UI States
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Manual Transfer Form Fields
  const [transferSource, setTransferSource] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferDistance, setTransferDistance] = useState('1.2');
  const [transferFrequency, setTransferFrequency] = useState('1');
  const [sendingTransfer, setSendingTransfer] = useState(false);

  // Manual Cash Simulation Form Fields
  const [cashAction, setCashAction] = useState('DEPOSIT'); // 'DEPOSIT' or 'WITHDRAWAL'
  const [cashAccount, setCashAccount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashDesc, setCashDesc] = useState('');
  const [cashDistance, setCashDistance] = useState('1.2');
  const [cashFrequency, setCashFrequency] = useState('1');
  const [submittingCashOp, setSubmittingCashOp] = useState(false);

  // New Account Form Fields (PAN & Aadhar required)
  const [accType, setAccType] = useState('SAVINGS');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [accAadhar, setAccAadhar] = useState('');
  const [accPan, setAccPan] = useState('');
  const [submittingAccount, setSubmittingAccount] = useState(false);
  
  // Loan Form State
  const [loanType, setLoanType] = useState('EDUCATION_LOAN');
  const [loanAmount, setLoanAmount] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [additionalDocument, setAdditionalDocument] = useState('');
  const [applyingLoan, setApplyingLoan] = useState(false);

  // Card Form State
  const [cardType, setCardType] = useState('DEBIT');
  const [cardAccount, setCardAccount] = useState('');
  const [applyingCard, setApplyingCard] = useState(false);

  // Quick Deposit State (Balance shortcut)
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Custom alerts feedback
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      const userObj = JSON.parse(userStr);
      setCurrentUser(userObj);

      // Fetch accounts
      const accRes = await customerAPI.getAccounts();
      const accountsList = accRes.data || [];
      setAccounts(accountsList);
      
      if (accountsList.length > 0) {
        const activeAccs = accountsList.filter(a => a.status === 'ACTIVE');
        if (activeAccs.length > 0) {
          setCardAccount(activeAccs[0].accountNumber);
          setDepositAccount(activeAccs[0].accountNumber);
          // Set manual console defaults
          setTransferSource(activeAccs[0].accountNumber);
          setCashAccount(activeAccs[0].accountNumber);
        }
      }

      // Fetch transactions
      const txRes = await customerAPI.getTransactions();
      setTransactions(txRes.data || []);

      // Fetch notifications
      const notifRes = await customerAPI.getNotifications();
      setNotifications(notifRes.data || []);

      // Fetch loans
      const loansRes = await customerAPI.getLoans();
      setLoans(loansRes.data || []);

      // Fetch cards
      const cardsRes = await customerAPI.getCards();
      setCards(cardsRes.data || []);
    } catch (err) {
      console.error(err);
      setFeedback({ error: 'Failed to synchronize account metrics', success: '' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler: New Account Application
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!accAadhar || accAadhar.trim().length !== 12) {
      setFeedback({ error: 'A valid 12-digit Aadhar Identification Number is required.', success: '' });
      return;
    }
    if (!accPan || accPan.trim().length !== 10) {
      setFeedback({ error: 'A valid 10-character PAN Card Number is required.', success: '' });
      return;
    }
    setSubmittingAccount(true);
    try {
      await customerAPI.createAccount({
        accountType: accType,
        initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
        panNumber: accPan.toUpperCase(),
        aadharNumber: accAadhar
      });
      setFeedback({ error: '', success: 'Account application requested! Awaiting admin verification.' });
      setInitialDeposit('');
      setAccAadhar('');
      setAccPan('');
      setShowAccountModal(false);
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to submit account request.', success: '' });
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Submit Handler: Loan Application
  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!aadharNumber) {
      setFeedback({ error: 'Aadhar Number is required', success: '' });
      return;
    }
    if (!additionalDocument) {
      setFeedback({ error: 'Supporting document details are required', success: '' });
      return;
    }
    setApplyingLoan(true);
    try {
      await customerAPI.applyForLoan({
        loanType,
        amount: parseFloat(loanAmount),
        aadharNumber,
        additionalDocument
      });
      setFeedback({ error: '', success: 'Loan application submitted successfully! Pending admin approval.' });
      setLoanAmount('');
      setAadharNumber('');
      setAdditionalDocument('');
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to submit loan application.', success: '' });
    } finally {
      setApplyingLoan(false);
    }
  };

  // Submit Handler: Card Application
  const handleApplyCard = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!cardAccount) {
      setFeedback({ error: 'Please select an account for the card', success: '' });
      return;
    }
    setApplyingCard(true);
    try {
      await customerAPI.applyForCard({
        cardType,
        accountNumber: cardAccount
      });
      setFeedback({ error: '', success: 'Card application submitted! Pending admin activation.' });
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to request card.', success: '' });
    } finally {
      setApplyingCard(false);
    }
  };

  // Submit Handler: Quick Balance Deposit
  const handleQuickDeposit = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!depositAccount) {
      setFeedback({ error: 'Select a destination account', success: '' });
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setFeedback({ error: 'Enter a valid amount to deposit', success: '' });
      return;
    }
    setDepositing(true);
    try {
      await customerAPI.executeTransaction({
        transactionType: 'DEPOSIT',
        amount: parseFloat(depositAmount),
        description: 'Quick Balance Deposit',
        targetAccountNumber: depositAccount
      });
      setFeedback({ error: '', success: `Deposited ₹${depositAmount} successfully!` });
      setShowDepositModal(false);
      setDepositAmount('');
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Failed to make deposit.', success: '' });
    } finally {
      setDepositing(false);
    }
  };

  // Submit Handler: Manual Money Transfer
  const handleManualTransfer = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!transferSource) {
      setFeedback({ error: 'Select source account', success: '' });
      return;
    }
    if (!transferTarget) {
      setFeedback({ error: 'Enter target account number', success: '' });
      return;
    }
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setFeedback({ error: 'Enter a valid amount', success: '' });
      return;
    }
    setSendingTransfer(true);
    try {
      const res = await customerAPI.executeTransaction({
        transactionType: 'TRANSFER',
        amount: parseFloat(transferAmount),
        description: transferDesc || 'Fund Transfer',
        sourceAccountNumber: transferSource,
        targetAccountNumber: transferTarget,
        distance: parseFloat(transferDistance) || 1.2,
        frequency: parseInt(transferFrequency) || 1,
        hour: new Date().getHours()
      });
      setFeedback({ error: '', success: `Transferred ₹${transferAmount} successfully! Ref: ${res.data.transactionNumber}` });
      setTransferTarget('');
      setTransferAmount('');
      setTransferDesc('');
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Transfer failed.', success: '' });
    } finally {
      setSendingTransfer(false);
    }
  };

  // Submit Handler: Manual Cash Simulation (Deposits & Withdrawals with Fraud indicators)
  const handleManualCashOp = async (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    if (!cashAccount) {
      setFeedback({ error: 'Select source/target account', success: '' });
      return;
    }
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      setFeedback({ error: 'Enter a valid amount', success: '' });
      return;
    }
    setSubmittingCashOp(true);
    try {
      const payload = {
        transactionType: cashAction,
        amount: parseFloat(cashAmount),
        description: cashDesc || `Simulated ${cashAction.toLowerCase()}`
      };

      if (cashAction === 'DEPOSIT') {
        payload.targetAccountNumber = cashAccount;
      } else {
        payload.sourceAccountNumber = cashAccount;
        payload.distance = parseFloat(cashDistance) || 1.2;
        payload.frequency = parseInt(cashFrequency) || 1;
        payload.hour = new Date().getHours();
      }

      await customerAPI.executeTransaction(payload);
      setFeedback({ error: '', success: `Simulated ${cashAction.toLowerCase()} of ₹${cashAmount} completed successfully!` });
      setCashAmount('');
      setCashDesc('');
      fetchDashboardData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || 'Simulation operation failed.', success: '' });
    } finally {
      setSubmittingCashOp(false);
    }
  };

  // Statement PDF Generation & Download
  const downloadStatement = async (accNum) => {
    try {
      const response = await customerAPI.downloadStatement(accNum);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement_${accNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setFeedback({ error: 'Failed to generate PDF statement', success: '' });
    }
  };

  const markNotifRead = async (id) => {
    try {
      await customerAPI.markNotificationRead(id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Helper text mapping for dynamic loan documentations
  const getDocPlaceholder = (type) => {
    switch (type) {
      case 'EDUCATION_LOAN':
        return 'e.g. Admission Letter Ref, University name, course duration';
      case 'CROP_LOAN':
        return 'e.g. Land survey number, acreage, crop type description';
      case 'GOLD_LOAN':
        return 'e.g. Gold purity weight in grams, appraisal certificate ref';
      case 'BUSINESS_LOAN':
        return 'e.g. GSTIN (GST identification number), Corporate Registration ID';
      default:
        return 'Enter required supporting document details';
    }
  };

  const getDocLabel = (type) => {
    switch (type) {
      case 'EDUCATION_LOAN':
        return 'Admission Letter / University Details';
      case 'CROP_LOAN':
        return 'Land Survey Number & Acreage';
      case 'GOLD_LOAN':
        return 'Gold Weight & Purity Certificate';
      case 'BUSINESS_LOAN':
        return 'GSTIN / Business Registration ID';
      default:
        return 'Supporting Documents Details';
    }
  };

  // Safety list extraction variables
  const safeAccounts = accounts || [];
  const safeTransactions = transactions || [];
  const safeNotifications = notifications || [];
  const safeLoans = loans || [];
  const safeCards = cards || [];

  // Aggregated totals
  const totalBalance = safeAccounts
    .filter(acc => acc.status === 'ACTIVE')
    .reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="min-h-screen bg-[#020617] py-6 px-4 md:px-8 flex items-center justify-center text-slate-100 relative overflow-hidden font-sans">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-teal-950/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[600px] rounded-full bg-blue-950/20 blur-[130px] pointer-events-none"></div>

      {/* Main Glass Panel */}
      <div className="w-full max-w-7xl glass-panel rounded-[32px] shadow-2xl p-6 md:p-8 border border-slate-800/80 z-10">
        
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-extrabold text-lg shadow-sm">
              N
            </div>
            <span className="text-xl font-black tracking-widest text-white">Nexus Bank</span>
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center bg-slate-950/50 border border-slate-800 px-3 py-2 rounded-full gap-4 shadow-inner">
            <button 
              onClick={() => setDashboardTab('OVERVIEW')} 
              className={`p-2 rounded-full transition-all flex items-center gap-1 text-xs font-semibold ${
                dashboardTab === 'OVERVIEW' 
                  ? 'bg-teal-600 text-white shadow-md glow-teal' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Overview"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline px-1">Overview</span>
            </button>

            <button 
              onClick={() => setDashboardTab('CARDS')} 
              className={`p-2 rounded-full transition-all flex items-center gap-1 text-xs font-semibold ${
                dashboardTab === 'CARDS' 
                  ? 'bg-teal-600 text-white shadow-md glow-teal' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cards portal"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline px-1">Cards</span>
            </button>

            <button 
              onClick={() => setDashboardTab('LOANS')} 
              className={`p-2 rounded-full transition-all flex items-center gap-1 text-xs font-semibold ${
                dashboardTab === 'LOANS' 
                  ? 'bg-teal-600 text-white shadow-md glow-teal' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Loans portal"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline px-1">Loans</span>
            </button>
          </div>

          {/* Search, Notifications & Profile */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search statements..."
                className="pl-9 pr-4 py-1.5 bg-slate-950/40 border border-slate-800 rounded-full text-xs text-white focus:outline-none w-48 shadow-sm focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Notification triggers */}
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className="relative p-2 rounded-full bg-slate-950/40 shadow-sm border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {safeNotifications.filter(n => n.status === 'UNREAD').length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-[#020617]"></span>
              )}
            </button>

            {/* Profile trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 rounded-full bg-slate-950/40 shadow-sm border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
              title="View Profile Details"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-slate-950/40 shadow-sm border border-slate-800 text-red-400 hover:text-red-200 hover:bg-red-955/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {(feedback.error || feedback.success) && (
          <div className="mt-6">
            {feedback.error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0 text-red-400" /> {feedback.error}</span>
                <button onClick={() => setFeedback({ ...feedback, error: '' })}><X className="w-4 h-4" /></button>
              </div>
            )}
            {feedback.success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> {feedback.success}</span>
                <button onClick={() => setFeedback({ ...feedback, success: '' })}><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        )}

        {/* LOADING SHIMMER */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Synchronizing secure vault metrics...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* TAB 1: OVERVIEW */}
            {dashboardTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-8">
                
                {/* COLUMN 1: BALANCES & TRENDS */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Balance Overview */}
                  <div className="glass-card rounded-3xl p-6 border border-slate-800/60 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-mono">Net Worth Summary</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (safeAccounts.filter(a => a.status === 'ACTIVE').length > 0) {
                              setDepositAccount(safeAccounts.filter(a => a.status === 'ACTIVE')[0].accountNumber);
                              setShowDepositModal(true);
                            } else {
                              setFeedback({ error: 'You need an active approved account to make deposits.', success: '' });
                            }
                          }}
                          className="text-[9px] bg-teal-500/10 hover:bg-teal-500/25 text-teal-400 px-2.5 py-1 rounded font-extrabold border border-teal-500/30 flex items-center gap-1 transition-all glow-teal"
                        >
                          <PlusCircle className="w-3 h-3" /> Quick Deposit
                        </button>
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mt-2">
                      ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h2>

                    {/* Credit Card Carousel */}
                    <div className="flex gap-4 mt-6 overflow-x-auto pb-2 scroll-smooth">
                      
                      {/* Active Cards display */}
                      {safeCards.filter(c => c.status === 'ACTIVE').map((c, i) => (
                        <div 
                          key={c.id} 
                          className={`w-48 h-28 rounded-2xl p-4 shrink-0 bg-gradient-to-tr ${
                            c.cardType === 'DEBIT' ? 'from-teal-900 to-emerald-700' : 'from-indigo-900 to-purple-800'
                          } text-white flex flex-col justify-between shadow-md relative overflow-hidden border border-white/10`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold tracking-wider">{c.cardType} CARD</span>
                            <span className="text-[9px] font-black italic">{c.cardType === 'DEBIT' ? 'VISA' : 'MC'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] opacity-90 block tracking-widest font-mono">{c.cardNumber}</span>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[8px] opacity-75 font-semibold uppercase">{currentUser?.firstName} {currentUser?.lastName}</span>
                              <span className="text-[8px] bg-white/20 px-1 rounded text-white font-bold">Active</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Mockup fallback card if no cards approved */}
                      {safeCards.filter(c => c.status === 'ACTIVE').length === 0 && (
                        <div className="w-48 h-28 rounded-2xl p-4 shrink-0 bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-400 flex flex-col justify-between shadow-md relative overflow-hidden border border-slate-700">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold tracking-wider">NO ACTIVE CARDS</span>
                            <HelpCircle className="w-4 h-4 opacity-50" />
                          </div>
                          <div>
                            <span className="text-[9px] opacity-75 leading-relaxed block text-[10px]">Apply for a Debit or Credit Card in the Cards tab.</span>
                          </div>
                        </div>
                      )}

                      {/* Add Card Button */}
                      <button
                        onClick={() => setDashboardTab('CARDS')}
                        className="w-24 h-28 rounded-2xl border-2 border-dashed border-slate-800 hover:border-teal-500/50 hover:bg-slate-900/40 transition-colors flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 gap-2 shrink-0"
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span className="text-[9px] font-extrabold uppercase">Apply Card</span>
                      </button>
                    </div>

                    {/* Active Accounts Balance List */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
                      <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Active Accounts ({safeAccounts.filter(a => a.status === 'ACTIVE').length})
                      </span>
                      <div className="space-y-2">
                        {safeAccounts.filter(a => a.status === 'ACTIVE').map(acc => (
                          <div key={acc.id} className="flex justify-between items-center text-xs bg-slate-950/30 p-3 rounded-xl border border-slate-800/80 hover:border-teal-500/30 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-200">{acc.accountNumber}</span>
                                <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">{acc.accountType}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                                <span>PAN: <strong className="font-mono text-slate-350">{acc.panNumber || 'N/A'}</strong></span>
                                <span className="text-slate-700">|</span>
                                <span>Aadhar: <strong className="font-mono text-slate-350">{acc.aadharNumber || 'N/A'}</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-white block">₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <button
                                onClick={() => downloadStatement(acc.accountNumber)}
                                className="text-[9px] text-teal-400 hover:text-teal-300 font-bold underline mt-1 block"
                              >
                                Download Statement
                              </button>
                            </div>
                          </div>
                        ))}
                        {safeAccounts.filter(a => a.status === 'ACTIVE').length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-500">
                            No active accounts. Please wait for admin approval or apply for an account.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Accounts Status Section */}
                    {safeAccounts.filter(a => a.status === 'PENDING').length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                        <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Pending Account Requests ({safeAccounts.filter(a => a.status === 'PENDING').length})
                        </span>
                        <div className="space-y-1.5">
                          {safeAccounts.filter(a => a.status === 'PENDING').map(acc => (
                            <div key={acc.id} className="flex flex-col gap-1 text-[10px] text-slate-450 bg-amber-950/10 p-2.5 rounded-lg border border-amber-500/10">
                              <div className="flex justify-between items-center">
                                <span className="font-mono font-semibold">{acc.accountNumber} ({acc.accountType})</span>
                                <span className="font-extrabold text-amber-500 italic">Awaiting Approval</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 border-t border-slate-800/50 pt-1 flex justify-between">
                                <span>PAN: <strong className="font-mono">{acc.panNumber || 'N/A'}</strong></span>
                                <span>Aadhar: <strong className="font-mono">{acc.aadharNumber || 'N/A'}</strong></span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 border-t border-slate-800/50 pt-1 flex justify-between">
                                <span>Pending Deposit: <strong className="font-mono text-amber-500">₹{acc.balance.toFixed(2)}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Open Account Prompt if no accounts exist */}
                  {safeAccounts.length === 0 && (
                    <div className="glass-card rounded-3xl p-6 border border-teal-500/20 bg-teal-950/10 shadow-lg text-center relative overflow-hidden">
                      <div className="absolute right-[-10px] top-[-10px] text-teal-500/10 opacity-20"><Sparkles className="w-16 h-16" /></div>
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Welcome to Nexus Bank</h3>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        To unlock deposits, transfers, debit/credit cards, and loan applications, you must first apply to open a bank account.
                      </p>
                      <button
                        onClick={() => setShowAccountModal(true)}
                        className="w-full mt-4 bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md glow-teal flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" /> Open savings/current account
                      </button>
                    </div>
                  )}

                  {/* Income & Spending Trends */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-4 border border-slate-800/60 shadow flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Active Loans Amount</span>
                        <h4 className="text-sm font-bold text-teal-400 mt-1 font-mono">
                          ₹{safeLoans.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + l.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="h-2 w-full mt-3 bg-slate-900 rounded overflow-hidden">
                        <div className="h-full bg-teal-500 w-3/4 rounded"></div>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-4 border border-slate-800/60 shadow flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Pending Loans</span>
                        <h4 className="text-sm font-bold text-amber-500 mt-1 font-mono">
                          ₹{safeLoans.filter(l => l.status === 'PENDING').reduce((sum, l) => sum + l.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="h-2 w-full mt-3 bg-slate-900 rounded overflow-hidden">
                        <div className="h-full bg-amber-500 w-1/2 rounded"></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* COLUMN 2: TRANSACTIONS & STATEMENT DOWNLOADS */}
                <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
                  
                  {/* Transactions list */}
                  <div className="glass-card rounded-3xl p-6 border border-slate-800/60 shadow-lg flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-extrabold text-white">Ledger Movements</h3>
                        <span className="text-[10px] text-slate-500 font-extrabold">Audit Ledger</span>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {safeTransactions.length === 0 ? (
                          <div className="text-[10px] text-slate-500 text-center py-12">No recent account movements found.</div>
                        ) : (
                          safeTransactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  tx.transactionType === 'DEPOSIT' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                }`}>
                                  {tx.transactionType.substring(0, 1)}
                                </div>
                                <div className="max-w-[110px]">
                                  <h4 className="font-bold text-slate-200 truncate" title={tx.description}>{tx.description || 'Ledger movement'}</h4>
                                  <span className="text-[9px] text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={`font-extrabold ${
                                  tx.transactionType === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-200'
                                }`}>
                                  {tx.transactionType === 'DEPOSIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* PDF Download statements */}
                    {safeAccounts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Account Statements</span>
                        {safeAccounts.filter(a => a.status === 'ACTIVE').map(a => (
                          <button
                            key={a.id}
                            onClick={() => downloadStatement(a.accountNumber)}
                            className="w-full flex justify-between items-center p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:bg-slate-850 transition-colors text-[10px] font-bold text-slate-300"
                          >
                            <span className="font-mono text-slate-400">{a.accountNumber} ({a.accountType})</span>
                            <FileText className="w-3.5 h-3.5 text-teal-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wealth Premium Banner */}
                  <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-3xl p-6 text-white text-center shadow-lg border border-teal-900/20 flex flex-col justify-between h-40 relative overflow-hidden">
                    <div className="absolute right-[-10px] top-[-10px] text-teal-500/10 opacity-30"><Sparkles className="w-24 h-24" /></div>
                    <div>
                      <h4 className="text-sm font-extrabold leading-tight tracking-wider text-teal-400">Nexus Wealth</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Unlock AI-powered wealth optimization advisors.</p>
                    </div>
                    <button 
                      onClick={() => alert("Nexus Wealth Advisory is currently undergoing beta staging.")}
                      className="w-full bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2 rounded-xl mt-4 transition-all shadow-md glow-teal"
                    >
                      Explore Advisory
                    </button>
                  </div>

                </div>

                {/* COLUMN 3: OPERATIONS & TRANSACTIONS CONSOLE */}
                <div className="lg:col-span-3 glass-card rounded-3xl p-6 border border-slate-800/60 shadow-lg flex flex-col justify-between min-h-[460px]">
                  
                  {/* Console Headers / Tabs */}
                  <div>
                    <div className="flex bg-slate-950/50 p-1 rounded-xl mb-4 border border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setConsoleTab('TRANSFER')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          consoleTab === 'TRANSFER' ? 'bg-teal-600 text-white shadow-md glow-teal' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsoleTab('CASH')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          consoleTab === 'CASH' ? 'bg-teal-600 text-white shadow-md glow-teal' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Deposit/Withdraw
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsoleTab('OPEN_ACCOUNT')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          consoleTab === 'OPEN_ACCOUNT' ? 'bg-teal-600 text-white shadow-md glow-teal' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Open Acc
                      </button>
                    </div>

                    {/* Tab A: Transfer Form */}
                    {consoleTab === 'TRANSFER' && (
                      <form onSubmit={handleManualTransfer} className="space-y-3">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Execute Fund Transfer</h4>
                        
                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Source Account</label>
                          <select
                            value={transferSource}
                            onChange={(e) => setTransferSource(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          >
                            <option value="">-- Select Source Account --</option>
                            {safeAccounts.filter(a => a.status === 'ACTIVE').map(a => (
                              <option key={a.id} value={a.accountNumber}>
                                {a.accountType} - {a.accountNumber.substring(a.accountNumber.length - 4)} (₹{a.balance.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Target Account Number</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter 10-digit account"
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            required
                            placeholder="Amount in INR (₹)"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="e.g. rent payment"
                            value={transferDesc}
                            onChange={(e) => setTransferDesc(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingTransfer}
                          className="w-full bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md glow-teal flex items-center justify-center gap-1.5 disabled:bg-slate-800"
                        >
                          {sendingTransfer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Confirm Transfer
                        </button>
                      </form>
                    )}

                    {/* Tab B: Cash Operations Simulator */}
                    {consoleTab === 'CASH' && (
                      <form onSubmit={handleManualCashOp} className="space-y-3">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Simulate Cash Operations</h4>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCashAction('DEPOSIT')}
                            className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              cashAction === 'DEPOSIT' 
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' 
                                : 'bg-slate-950/30 border-slate-800 text-slate-400'
                            }`}
                          >
                            Deposit (+)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashAction('WITHDRAWAL')}
                            className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all text-center ${
                              cashAction === 'WITHDRAWAL' 
                                ? 'bg-red-500/15 border-red-500 text-red-400' 
                                : 'bg-slate-950/30 border-slate-800 text-slate-400'
                            }`}
                          >
                            Withdraw (-)
                          </button>
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Target Account</label>
                          <select
                            value={cashAccount}
                            onChange={(e) => setCashAccount(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          >
                            {safeAccounts.filter(a => a.status === 'ACTIVE').map(a => (
                              <option key={a.id} value={a.accountNumber}>
                                {a.accountType} - {a.accountNumber.substring(a.accountNumber.length - 4)} (₹{a.balance.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            required
                            placeholder="Amount in INR (₹)"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="e.g. ATM withdrawal"
                            value={cashDesc}
                            onChange={(e) => setCashDesc(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        {/* Advanced AI Fraud simulation variables (only for withdrawals) */}
                        {cashAction === 'WITHDRAWAL' && (
                          <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-850 space-y-2 mt-2">
                            <span className="text-[8px] font-extrabold text-amber-500 tracking-wider block uppercase">AI Fraud Parameters Simulator</span>
                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                              <div>
                                <label className="block text-[8px] text-slate-500 uppercase mb-0.5">Distance (km)</label>
                                <input
                                  type="number"
                                  value={cashDistance}
                                  onChange={(e) => setCashDistance(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none focus:border-teal-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] text-slate-500 uppercase mb-0.5">Frequency</label>
                                <input
                                  type="number"
                                  value={cashFrequency}
                                  onChange={(e) => setCashFrequency(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none focus:border-teal-500"
                                />
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-505 block leading-tight">
                              Tip: Set distance to **&gt; 800 km** to simulate an out-of-state fraud block.
                            </span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingCashOp}
                          className="w-full bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md glow-teal flex items-center justify-center gap-1.5 disabled:bg-slate-800"
                        >
                          {submittingCashOp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                          Simulate {cashAction}
                        </button>
                      </form>
                    )}

                    {/* Tab C: Open Account Application Form */}
                    {consoleTab === 'OPEN_ACCOUNT' && (
                      <form onSubmit={handleCreateAccount} className="space-y-3">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Apply for Bank Account</h4>
                        
                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Account Class Type</label>
                          <select
                            value={accType}
                            onChange={(e) => setAccType(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          >
                            <option value="SAVINGS">Savings Account (4.5% APY)</option>
                            <option value="CURRENT">Current Checking Account</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">PAN Card Number</label>
                          <input
                            type="text"
                            required
                            maxLength="10"
                            placeholder="10-character PAN (e.g. ABCDE1234F)"
                            value={accPan}
                            onChange={(e) => setAccPan(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Aadhar Card Number</label>
                          <input
                            type="text"
                            required
                            maxLength="12"
                            placeholder="12-digit Aadhar (e.g. 541278964512)"
                            value={accAadhar}
                            onChange={(e) => setAccAadhar(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-1">Initial Opening Deposit (₹)</label>
                          <input
                            type="number"
                            required
                            placeholder="Amount in INR (₹)"
                            value={initialDeposit}
                            onChange={(e) => setInitialDeposit(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingAccount}
                          className="w-full bg-teal-600 hover:bg-teal-555 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-md glow-teal flex items-center justify-center gap-1.5 disabled:bg-slate-800"
                        >
                          {submittingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                          Submit Application
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-850/80 flex gap-2 items-start mt-4">
                    <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      All account requests go to the Administrator Console for KYC vetting before being activated.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: CARDS MANAGEMENT */}
            {dashboardTab === 'CARDS' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                
                {/* Apply Card Form */}
                <div className="glass-card rounded-3xl p-6 border border-slate-800/60 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-teal-400" />
                      <h3 className="text-sm font-extrabold text-white">Apply for a Debit or Credit Card</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Request a physical or virtual card linked to your active accounts. Cards are approved by system operators and assigned a formatted 16-digit card number automatically.
                    </p>

                    <form onSubmit={handleApplyCard} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Linked Bank Account</label>
                        <select
                          value={cardAccount}
                          onChange={(e) => setCardAccount(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-350 font-bold focus:outline-none focus:border-teal-500"
                        >
                          <option value="">-- Select Destination Account --</option>
                          {safeAccounts.filter(a => a.status === 'ACTIVE').map(a => (
                            <option key={a.id} value={a.accountNumber}>
                              {a.accountType} - {a.accountNumber} (Bal: ₹{a.balance.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Card Product Type</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setCardType('DEBIT')}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                              cardType === 'DEBIT' 
                                ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                                : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Debit Card (Visa)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardType('CREDIT')}
                            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                              cardType === 'CREDIT' 
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                                : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Credit Card (Mastercard)
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={applyingCard}
                        className="w-full bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md glow-teal disabled:bg-slate-700 flex items-center justify-center gap-2 mt-4"
                      >
                        {applyingCard ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Card Application'}
                      </button>
                    </form>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850/80 flex gap-2.5 items-start mt-6">
                    <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Approved cards will immediately display here. You can toggle active status blocks or lock cards instantly in the Administrator console.
                    </p>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-6">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">My Cards Collection</h3>

                  {safeCards.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-800">
                      You have not applied for any cards yet. Use the form on the left to apply.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {safeCards.map(c => (
                        <div 
                          key={c.id} 
                          className={`rounded-2xl p-5 border text-white flex flex-col justify-between h-36 relative overflow-hidden shadow-lg ${
                            c.status === 'PENDING' ? 'bg-slate-900 border-slate-800 opacity-60' :
                            c.status === 'BLOCKED' ? 'bg-red-950/40 border-red-900/30' :
                            c.cardType === 'DEBIT' ? 'bg-gradient-to-tr from-slate-900 to-teal-900 border-slate-850' : 
                            'bg-gradient-to-tr from-slate-900 to-indigo-900 border-slate-850'
                          }`}
                        >
                          <div className="flex justify-between items-start z-10">
                            <div>
                              <span className="text-[9px] font-extrabold block text-slate-400 uppercase tracking-widest">{c.cardType} PRODUCT</span>
                              <span className="text-[8px] text-slate-500 font-mono">Linked to: {c.accountNumber}</span>
                            </div>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === 'ACTIVE' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                              c.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {c.status}
                            </span>
                          </div>

                          <div className="z-10 mt-2">
                            <span className="text-sm font-black block tracking-widest font-mono text-slate-100">{c.cardNumber}</span>
                            <div className="flex justify-between items-end mt-2">
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Cardholder</span>
                                <span className="text-[9px] font-bold text-slate-350">{c.ownerName}</span>
                              </div>
                              <span className="text-[10px] font-extrabold italic text-slate-400">{c.cardType === 'DEBIT' ? 'VISA' : 'MC'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: LOANS MANAGEMENT */}
            {dashboardTab === 'LOANS' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                
                {/* Apply Loan Form */}
                <div className="glass-card rounded-3xl p-6 border border-slate-800/60 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-teal-400" />
                      <h3 className="text-sm font-extrabold text-white">Apply for a New Loan</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Apply for Education, Business, Crop or Gold loans. Note that Aadhar is required, and unique supporting documents are mapped dynamically according to the chosen loan type.
                    </p>

                    <form onSubmit={handleApplyLoan} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Loan Category Type</label>
                        <select
                          value={loanType}
                          onChange={(e) => setLoanType(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-teal-500"
                        >
                          <option value="EDUCATION_LOAN">Education Loan (Admission Letter required)</option>
                          <option value="CROP_LOAN">Crop Loan (Land Records / Survey Number required)</option>
                          <option value="GOLD_LOAN">Gold Loan (Gold Purity Certificate required)</option>
                          <option value="BUSINESS_LOAN">Business Loan (GST Identification details required)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Request Loan Principal (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="Amount in INR (₹)"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Customer Aadhar Identification Number</label>
                        <input
                          type="text"
                          required
                          maxLength="12"
                          placeholder="12-digit Aadhar (e.g. 541278964512)"
                          value={aadharNumber}
                          onChange={(e) => setAadharNumber(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                        />
                      </div>

                      {/* Dynamic Field */}
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                          {getDocLabel(loanType)} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          required
                          rows="3"
                          placeholder={getDocPlaceholder(loanType)}
                          value={additionalDocument}
                          onChange={(e) => setAdditionalDocument(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={applyingLoan}
                        className="w-full bg-teal-600 hover:bg-teal-555 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md glow-teal disabled:bg-slate-700 flex items-center justify-center gap-2 mt-4"
                      >
                        {applyingLoan ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Loan Application'}
                      </button>
                    </form>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850/80 flex gap-2.5 items-start mt-6">
                    <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      <strong className="text-teal-400">Balance disbursement check:</strong> Once an Administrator approves your pending loan application, the principal amount is instantly credited to your primary checking/savings account as a deposit.
                    </p>
                  </div>
                </div>

                {/* Loans List */}
                <div className="space-y-6">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">My Loan Portfolios</h3>

                  {safeLoans.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-800">
                      You have no active or pending loan records. Use the form on the left to apply.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeLoans.map(l => (
                        <div key={l.id} className="glass-card rounded-2xl p-5 border border-slate-850 shadow-md relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">{l.loanType.replace('_', ' ')}</span>
                              <span className="text-lg font-black text-white mt-1 block font-mono">₹{l.amount.toLocaleString()}</span>
                            </div>
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                              l.status === 'APPROVED' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30' :
                              l.status === 'PENDING' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30' :
                              'bg-red-500/25 text-red-400 border border-red-500/30'
                            }`}>
                              {l.status}
                            </span>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-850/80 grid grid-cols-2 gap-4 text-[10px]">
                            <div>
                              <span className="text-slate-500 block">Aadhar Number</span>
                              <span className="font-mono text-slate-300 font-bold">{l.aadharNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Application Date</span>
                              <span className="text-slate-350">{new Date(l.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="mt-3 bg-slate-950/30 p-2 rounded-lg border border-slate-900/50">
                            <span className="text-[8px] text-slate-500 block font-bold uppercase tracking-wider">{getDocLabel(l.loanType)}</span>
                            <p className="text-[10px] text-slate-300 font-mono mt-0.5 break-words">{l.additionalDocument}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

      </div>

      {/* FLOAT CHATBOT */}
      <AIChatbot />

      {/* MODAL 1: Request Account */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[24px] p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-extrabold text-white">Apply for a New Bank Account</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Account Class Type</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="SAVINGS">Savings Account (4.5% APY)</option>
                  <option value="CURRENT">Current Checking Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">PAN Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  placeholder="e.g. ABCDE1234F"
                  value={accPan}
                  onChange={(e) => setAccPan(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Aadhar Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="12"
                  placeholder="e.g. 541278964512"
                  value={accAadhar}
                  onChange={(e) => setAccAadhar(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Initial Deposit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAccount}
                className="w-full bg-teal-600 hover:bg-teal-555 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-md glow-teal flex items-center justify-center gap-1.5"
              >
                {submittingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[24px] p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-extrabold text-white">Instant Balance Deposit</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleQuickDeposit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Destination Account</label>
                <select
                  value={depositAccount}
                  onChange={(e) => setDepositAccount(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-350 font-bold focus:outline-none focus:border-teal-500"
                >
                  {safeAccounts.filter(a => a.status === 'ACTIVE').map(a => (
                    <option key={a.id} value={a.accountNumber}>
                      {a.accountType} - {a.accountNumber} (Bal: ₹{a.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Deposit Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={depositing}
                className="w-full bg-teal-600 hover:bg-teal-555 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-md glow-teal flex items-center justify-center gap-2"
              >
                {depositing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Deposit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER */}
      {showNotificationDrawer && (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-400" /> Notifications Feed
              </h3>
              <button onClick={() => setShowNotificationDrawer(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {safeNotifications.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-12">Your notifications feed is clear.</p>
              ) : (
                safeNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => n.status === 'UNREAD' && markNotifRead(n.id)}
                    className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all cursor-pointer ${
                      n.status === 'UNREAD'
                        ? 'bg-slate-950/40 border-teal-500/20 shadow-sm text-slate-200'
                        : 'bg-slate-900 border-slate-850/60 text-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        n.type === 'FRAUD' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        n.type === 'TRANSACTION' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        'bg-slate-850 text-slate-400'
                      }`}>
                        {n.type}
                      </span>
                      {n.status === 'UNREAD' && (
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                      )}
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[24px] p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" /> Customer Profile Details
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">First Name</span>
                  <span className="text-slate-200 font-semibold">{currentUser?.firstName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Last Name</span>
                  <span className="text-slate-200 font-semibold">{currentUser?.lastName || 'N/A'}</span>
                </div>
              </div>

              <div className="pb-4 border-b border-slate-800/60 space-y-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Username</span>
                  <span className="text-slate-200 font-mono font-semibold">{currentUser?.username || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Email Address</span>
                  <span className="text-slate-200 font-semibold">{currentUser?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Phone Number</span>
                  <span className="text-slate-200 font-semibold">{currentUser?.phoneNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Profile Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    currentUser?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {currentUser?.status || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KYC Verification Details</span>
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">PAN Card</span>
                    <span className="text-teal-400 font-mono font-bold uppercase">{safeAccounts.length > 0 ? safeAccounts[0].panNumber || 'N/A' : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Aadhar Card</span>
                    <span className="text-teal-400 font-mono font-bold">{safeAccounts.length > 0 ? safeAccounts[0].aadharNumber || 'N/A' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2.5 rounded-xl transition-all mt-6"
            >
              Close Profile View
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

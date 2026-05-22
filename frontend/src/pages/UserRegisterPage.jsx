/**
 * UserRegisterPage — Submit a join request to an existing Organisation.
 * The user picks an org from a dropdown, fills in details,
 * and their account is created with status: 'pending'.
 * They are NOT logged in — they see a success/pending screen.
 * Route: /register/user
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Lock, User, Building2, Film, ChevronLeft,
  CheckCircle2, Clock, Search, ChevronDown, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrganisations } from '../api/auth.api';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const UserRegisterPage = () => {
  const [step, setStep] = useState('form'); // 'form' | 'pending'
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgSearch, setOrgSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organisation: '',
  });
  const [loading, setLoading] = useState(false);
  const { requestToJoinOrg } = useAuth();
  const dropdownRef = useRef(null);

  // Fetch list of registered orgs
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await getOrganisations();
        setOrgs(res.data.data.organisations);
      } catch {
        toast.error('Failed to load organisations');
      } finally {
        setOrgsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  // Close dropdown when clicking outside the dropdown container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectOrg = (orgName) => {
    setFormData({ ...formData, organisation: orgName });
    setOrgSearch(orgName);
    setDropdownOpen(false);
  };

  const filteredOrgs = orgs.filter((o) =>
    o.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organisation) {
      toast.error('Please select an organisation');
      return;
    }
    setLoading(true);
    try {
      const result = await requestToJoinOrg(formData);
      setPendingData(result.data);
      setStep('pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // ─── Pending Success Screen ───────────────────────────────
  if (step === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-cyan-500/10 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md text-center animate-fade-in">
          {/* Animated check icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Clock size={40} className="text-indigo-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Request Submitted!</h2>
          <p className="text-slate-400 mb-2">
            Your request to join <span className="text-white font-semibold">"{pendingData?.organisation}"</span> has been sent to the organisation admin.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            You'll be able to sign in once your request is approved and a role is assigned.
          </p>

          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 text-left space-y-3 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Your request details</p>
            <div className="flex items-center gap-3">
              <User size={15} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300">{pendingData?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300">{pendingData?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 size={15} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300">{pendingData?.organisation}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-left mb-8">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              If you do not hear back, please contact your organisation's admin directly.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors text-sm"
          >
            <CheckCircle2 size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ─── Registration Form ────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#020617] text-white">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-500/10" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Film size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Pulse</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
              <User size={13} />
              Join Your Team
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Request access to your organisation's workspace.
            </h1>
            <p className="text-lg text-slate-400 mb-12 max-w-lg">
              Select your organisation, fill in your details, and an admin will review your request and assign your role.
            </p>

            <div className="space-y-4">
              {[
                { step: '1', label: 'Select your organisation' },
                { step: '2', label: 'Fill in your details' },
                { step: '3', label: 'Admin approves & assigns your role' },
              ].map(({ step: s, label }) => (
                <div key={s} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
                    {s}
                  </div>
                  <p className="text-slate-300 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="w-full max-w-md animate-fade-in relative z-10 py-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back to Sign In
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Join Organisation</h2>
            <p className="text-slate-400">Request access to your team's Pulse workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organisation Searchable Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Select Organisation</label>
              {/* dropdownRef wraps both the input and the dropdown list so outside-clicks are detected correctly */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Search size={18} />
                  </div>
                  <input
                    id="user-reg-org-search"
                    type="text"
                    value={orgSearch}
                    onChange={(e) => {
                      setOrgSearch(e.target.value);
                      setFormData({ ...formData, organisation: '' });
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder={orgsLoading ? 'Loading organisations...' : 'Search for your organisation...'}
                    disabled={orgsLoading}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    autoComplete="off"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Dropdown — use onMouseDown so selection fires before any blur event */}
                {dropdownOpen && !orgsLoading && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-52 overflow-y-auto">
                    {filteredOrgs.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        {orgSearch ? `No organisations matching "${orgSearch}"` : 'No organisations found'}
                      </div>
                    ) : (
                      filteredOrgs.map((org) => (
                        <button
                          key={org}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent input blur before selection
                            handleSelectOrg(org);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-800 transition-colors
                            ${formData.organisation === org ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-300'}`}
                        >
                          <Building2 size={14} className="text-slate-500 shrink-0" />
                          <span className="capitalize">{org}</span>
                          {formData.organisation === org && (
                            <CheckCircle2 size={14} className="text-indigo-400 ml-auto" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {formData.organisation && (
                <p className="text-xs text-indigo-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Selected: <span className="capitalize font-semibold">{formData.organisation}</span>
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input
                  id="user-reg-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="user-reg-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="user-reg-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-slate-500">Minimum 6 characters.</p>
            </div>

            <div className="pt-4">
              <Button
                id="user-reg-submit"
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                disabled={!formData.organisation}
              >
                Submit Join Request
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default UserRegisterPage;

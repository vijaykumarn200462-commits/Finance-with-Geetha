'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  Share2,
  CreditCard,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';
import { getSettingsDoc, saveSettingsDoc } from '@/lib/firebase/firestore';
import { useAdminAuth } from '@/lib/firebase/auth';
import { GeneralSettings, ContactSettings, SocialSettings, PaymentSettings, RegionalSettings } from '@/types/settings';
import { SUPPORTED_CURRENCIES, CurrencyCode, BASE_CURRENCY } from '@/lib/geo/country-currency';

type SettingsTab = 'general' | 'regional' | 'contact' | 'social' | 'payments' | 'security';

const DEFAULT_GENERAL: GeneralSettings = {
  businessName: 'Finance with Geetha',
  websiteUrl: 'https://financewithgeetha.com',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
};

const DEFAULT_REGIONAL: RegionalSettings = {
  baseCurrency: 'INR',
  autoDetectCountry: true,
  showCurrencySelector: true,
  defaultFallbackCountry: 'IN',
  defaultFallbackCurrency: 'INR',
  supportedCurrencies: ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD'],
  showIpInformation: true,
  rateCacheTtlMinutes: 60,
};

const DEFAULT_CONTACT: ContactSettings = {
  supportEmail: 'cageethanofficial@gmail.com',
  notificationEmail: 'cageethanofficial@gmail.com',
  phone: '',
  address: 'Finance with Geetha',
};

const DEFAULT_SOCIAL: SocialSettings = {
  youtubeUrl: '',
  linkedinUrl: 'https://www.linkedin.com/in/financewithgeetha',
  twitterUrl: '',
};

const DEFAULT_PAYMENTS: PaymentSettings = {
  stripeMode: 'test',
  communityPriceId: '',
  bookPriceId: '',
  cheatsheetsPriceId: '',
  workflowPriceId: '',
  callPriceId: '',
  calendlyUrl: 'https://calendly.com/geetha/30min-strategy',
};

export default function AdminSettingsClient() {
  const { user, adminRecord, changePassword } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL);
  const [regional, setRegional] = useState<RegionalSettings>(DEFAULT_REGIONAL);
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [social, setSocial] = useState<SocialSettings>(DEFAULT_SOCIAL);
  const [payments, setPayments] = useState<PaymentSettings>(DEFAULT_PAYMENTS);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const [genDoc, conDoc, socDoc, payDoc, regDoc] = await Promise.all([
        getSettingsDoc<GeneralSettings>('general'),
        getSettingsDoc<ContactSettings>('contact'),
        getSettingsDoc<SocialSettings>('social'),
        getSettingsDoc<PaymentSettings>('payments'),
        getSettingsDoc<RegionalSettings>('regional'),
      ]);

      if (genDoc) setGeneral((p) => ({ ...p, ...genDoc }));
      if (conDoc) setContact((p) => ({ ...p, ...conDoc }));
      if (socDoc) setSocial((p) => ({ ...p, ...socDoc }));
      if (payDoc) setPayments((p) => ({ ...p, ...payDoc }));
      if (regDoc) setRegional((p) => ({ ...p, ...regDoc }));
    } catch (err: unknown) {
      console.warn('Error loading settings from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (activeTab === 'general') {
        await saveSettingsDoc('general', general);
      } else if (activeTab === 'regional') {
        await saveSettingsDoc('regional', regional);
      } else if (activeTab === 'contact') {
        await saveSettingsDoc('contact', contact);
      } else if (activeTab === 'social') {
        const urlPattern = /^https?:\/\/.+/i;
        if (social.youtubeUrl && !urlPattern.test(social.youtubeUrl.trim())) {
          setErrorMessage('Please enter a valid YouTube URL including https://');
          setSaving(false);
          return;
        }
        if (social.linkedinUrl && !urlPattern.test(social.linkedinUrl.trim())) {
          setErrorMessage('Please enter a valid LinkedIn URL including https://');
          setSaving(false);
          return;
        }
        if (social.twitterUrl && !urlPattern.test(social.twitterUrl.trim())) {
          setErrorMessage('Please enter a valid Twitter/X URL including https://');
          setSaving(false);
          return;
        }
        await saveSettingsDoc('social', {
          youtubeUrl: social.youtubeUrl.trim(),
          linkedinUrl: social.linkedinUrl.trim(),
          twitterUrl: (social.twitterUrl || '').trim(),
        });
      } else if (activeTab === 'payments') {
        if (payments.calendlyUrl && !/^https?:\/\/.+/i.test(payments.calendlyUrl.trim())) {
          setErrorMessage('Please enter a valid Calendly URL including https://');
          setSaving(false);
          return;
        }
        await saveSettingsDoc('payments', payments);
      }

      setSuccessMessage(`Settings for "${activeTab.toUpperCase()}" saved to Firestore!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current administrator password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to change password. Please verify current password.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing password.';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
            System Configuration
          </span>
          <h1 className="text-2xl font-editorial text-[#181918] mt-1">Platform Settings</h1>
          <p className="text-sm text-[#706E69]">
            Configure platform branding, contact routing, social profiles, and payment integration metadata.
          </p>
        </div>

        <button
          onClick={loadSettings}
          title="Reload from Firestore"
          className="p-2 text-[#706E69] hover:text-[#181918] bg-white border border-[#E2DBD0] rounded-lg hover:bg-[#F9F7F4] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[#EAF0EC] border border-[#244634]/30 text-[#244634] text-sm animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2DBD0] overflow-x-auto pb-px">
        {[
          { key: 'general', label: 'General', icon: Globe },
          { key: 'regional', label: 'Regional & Currency', icon: Compass },
          { key: 'contact', label: 'Contact', icon: Mail },
          { key: 'social', label: 'Social Links', icon: Share2 },
          { key: 'payments', label: 'Payments & Stripe', icon: CreditCard },
          { key: 'security', label: 'Security & Password', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SettingsTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isSelected
                  ? 'border-[#244634] text-[#244634] bg-white rounded-t-lg'
                  : 'border-transparent text-[#706E69] hover:text-[#181918] hover:border-[#C5D8CC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm p-6 sm:p-8 space-y-6">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#706E69]">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#244634]" />
            Loading settings from Cloud Firestore...
          </div>
        ) : (
          <>
            {/* 1. GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Business & General Identity</h2>
                  <p className="text-xs text-[#706E69]">Primary brand identity displayed across emails and metadata.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Business Name</label>
                    <input
                      type="text"
                      value={general.businessName}
                      onChange={(e) => setGeneral({ ...general, businessName: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Website Domain / URL</label>
                    <input
                      type="url"
                      value={general.websiteUrl}
                      onChange={(e) => setGeneral({ ...general, websiteUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Timezone</label>
                    <input
                      type="text"
                      value={general.timezone}
                      onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Default Currency</label>
                    <input
                      type="text"
                      value={general.currency}
                      onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>
                </div>

                {/* Profile Photo Quick Access */}
                <div className="pt-4 border-t border-[#E2DBD0]">
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#0f2c59] bg-slate-100 shrink-0 shadow-xs">
                        <img
                          src="/images/geetha-profile.jpg"
                          alt="Geetha N."
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#181918]">Geetha N. Profile Photograph</p>
                        <p className="text-[11px] text-[#706E69]">
                          Centrally managed in CMS Site Content (Hero Banner). Displayed in hero card, navbar, and footer.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/admin/site-content"
                      className="px-4 py-2 rounded-lg bg-[#244634] text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shrink-0 shadow-xs"
                    >
                      Manage Profile Photo
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* REGIONAL & CURRENCY */}
            {activeTab === 'regional' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Regional Settings & Multi-Currency</h2>
                  <p className="text-xs text-[#706E69]">
                    Manage international visitor detection, currency selector display, exchange rate policies, and checkout currencies.
                  </p>
                </div>

                {/* Base Currency Notice */}
                <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#244634] flex items-center justify-center font-bold text-sm shrink-0 border border-[#C5D8CC]">
                    ₹
                  </div>
                  <div className="text-xs leading-relaxed text-[#5C5E5B]">
                    <strong className="text-[#181918] block text-sm mb-0.5">Authoritative Base Currency: INR (₹)</strong>
                    All core product prices in Cloud Firestore are denominated in Indian Rupees (INR).
                    International display amounts and Stripe checkout conversions are computed dynamically via server-side exchange rates.
                  </div>
                </div>

                {/* Detection & Selector Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#E2DBD0] bg-white space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-[#181918]">
                      <input
                        type="checkbox"
                        checked={regional.autoDetectCountry}
                        onChange={(e) => setRegional({ ...regional, autoDetectCountry: e.target.checked })}
                        className="w-4 h-4 rounded text-[#244634] focus:ring-[#244634]"
                      />
                      <span>Automatic Country Detection</span>
                    </label>
                    <p className="text-xs text-[#706E69] pl-6">
                      Use trusted hosting headers (Vercel / Cloudflare) to suggest visitor currency on first visit.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E2DBD0] bg-white space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-[#181918]">
                      <input
                        type="checkbox"
                        checked={regional.showCurrencySelector}
                        onChange={(e) => setRegional({ ...regional, showCurrencySelector: e.target.checked })}
                        className="w-4 h-4 rounded text-[#244634] focus:ring-[#244634]"
                      />
                      <span>Show Currency Selector</span>
                    </label>
                    <p className="text-xs text-[#706E69] pl-6">
                      Display currency dropdown in Navbar and Footer for manual overrides.
                    </p>
                  </div>
                </div>

                {/* Fallbacks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">
                      Default Country Fallback
                    </label>
                    <select
                      value={regional.defaultFallbackCountry}
                      onChange={(e) => setRegional({ ...regional, defaultFallbackCountry: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg bg-white"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="DE">Germany (DE / EUR)</option>
                      <option value="CA">Canada (CA)</option>
                      <option value="AU">Australia (AU)</option>
                      <option value="SG">Singapore (SG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">
                      Default Fallback Currency
                    </label>
                    <select
                      value={regional.defaultFallbackCurrency}
                      onChange={(e) => setRegional({ ...regional, defaultFallbackCurrency: e.target.value as CurrencyCode })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg bg-white"
                    >
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="CAD">CAD — Canadian Dollar (CA$)</option>
                      <option value="AUD">AUD — Australian Dollar (A$)</option>
                      <option value="SGD">SGD — Singapore Dollar (S$)</option>
                    </select>
                  </div>
                </div>

                {/* Supported Currencies Checkboxes */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#706E69] mb-2 font-semibold">
                    Supported Visitor Display Currencies
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
                      const isChecked = regional.supportedCurrencies.includes(curr.code);
                      const isBase = curr.code === BASE_CURRENCY;
                      return (
                        <label
                          key={curr.code}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#EAF0EC] border-[#244634] text-[#244634] font-medium'
                              : 'bg-white border-[#E2DBD0] text-[#5C5E5B]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isBase}
                            checked={isChecked}
                            onChange={(e) => {
                              if (isBase) return;
                              if (e.target.checked) {
                                setRegional({
                                  ...regional,
                                  supportedCurrencies: [...regional.supportedCurrencies, curr.code],
                                });
                              } else {
                                setRegional({
                                  ...regional,
                                  supportedCurrencies: regional.supportedCurrencies.filter((c) => c !== curr.code),
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-[#244634] focus:ring-[#244634]"
                          />
                          <span>{curr.flag}</span>
                          <span className="font-mono">{curr.code} ({curr.symbol})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* IP Info & Cache TTL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#E2DBD0] bg-white space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-[#181918]">
                      <input
                        type="checkbox"
                        checked={regional.showIpInformation}
                        onChange={(e) => setRegional({ ...regional, showIpInformation: e.target.checked })}
                        className="w-4 h-4 rounded text-[#244634] focus:ring-[#244634]"
                      />
                      <span>Enable Connection & IP Information</span>
                    </label>
                    <p className="text-xs text-[#706E69] pl-6">
                      Allow visitors to view their own detected network details in the footer popover.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">
                      Exchange Rate Cache TTL (Minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="1440"
                      value={regional.rateCacheTtlMinutes}
                      onChange={(e) => setRegional({ ...regional, rateCacheTtlMinutes: Number(e.target.value) || 60 })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                    <span className="text-[11px] text-[#706E69] mt-1 block">
                      Recommended: 60 minutes. Prevents external API throttling.
                    </span>
                  </div>
                </div>

                {/* Status & Diagnostic Card */}
                <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl p-4 text-xs space-y-2 text-[#5C5E5B] font-mono">
                  <div className="flex items-center justify-between">
                    <span>Base Currency:</span>
                    <span className="text-[#244634] font-semibold">INR (₹)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Country Detection:</span>
                    <span className="text-[#244634] font-semibold">Vercel Headers + Cloudflare + Server IP Fallback</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exchange Rate Engine:</span>
                    <span className="text-[#244634] font-semibold">Open Exchange Rates + In-Memory Server Cache</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IP Privacy Compliance:</span>
                    <span className="text-[#244634] font-semibold">Strict (Zero DB logging of client IPs)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONTACT */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Contact & Inbound Channels</h2>
                  <p className="text-xs text-[#706E69]">Routing destinations for contact submissions and customer inquiries.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Public Support Email</label>
                    <input
                      type="email"
                      value={contact.supportEmail}
                      onChange={(e) => setContact({ ...contact, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Admin Notification Email</label>
                    <input
                      type="email"
                      value={contact.notificationEmail}
                      onChange={(e) => setContact({ ...contact, notificationEmail: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Phone Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={contact.phone || ''}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Physical / Postal Location</label>
                    <input
                      type="text"
                      value={contact.address || ''}
                      onChange={(e) => setContact({ ...contact, address: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. SOCIAL */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Social Channels & Media Links</h2>
                  <p className="text-xs text-[#706E69]">Official external channels linked across the footer and navigation.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">YouTube Channel</label>
                    <input
                      type="url"
                      value={social.youtubeUrl}
                      onChange={(e) => setSocial({ ...social, youtubeUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={social.linkedinUrl}
                      onChange={(e) => setSocial({ ...social, linkedinUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Twitter / X Profile (Optional)</label>
                    <input
                      type="url"
                      value={social.twitterUrl || ''}
                      onChange={(e) => setSocial({ ...social, twitterUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. PAYMENTS & STRIPE */}
            {activeTab === 'payments' && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Stripe & Booking Integration</h2>
                  <p className="text-xs text-[#706E69]">Public price identifiers and booking schedule integrations.</p>
                </div>

                {/* Security Notice */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                    <Lock className="w-4 h-4 text-amber-700" />
                    Security Notice: Secret Keys Are Protected
                  </div>
                  <p>
                    In accordance with strict security architecture, Stripe Secret Keys (<code>STRIPE_SECRET_KEY</code>)
                    and Webhook Signing Secrets (<code>STRIPE_WEBHOOK_SECRET</code>) must NEVER be exposed here or in the browser.
                    They are kept safely in server-only environment variables (<code>.env.local</code>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Stripe Mode</label>
                    <select
                      value={payments.stripeMode}
                      onChange={(e) => setPayments({ ...payments, stripeMode: e.target.value as 'test' | 'live' })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg bg-white"
                    >
                      <option value="test">Test Mode (Sandbox)</option>
                      <option value="live">Live Mode (Production)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Calendly / Booking URL</label>
                    <input
                      type="url"
                      value={payments.calendlyUrl || ''}
                      onChange={(e) => setPayments({ ...payments, calendlyUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-mono uppercase text-[#706E69] block mb-2">Optional Stripe Price IDs</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#706E69] mb-1">Community (₹150/mo Price ID)</label>
                      <input
                        type="text"
                        placeholder="price_..."
                        value={payments.communityPriceId || ''}
                        onChange={(e) => setPayments({ ...payments, communityPriceId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#706E69] mb-1">Book (₹29 Price ID)</label>
                      <input
                        type="text"
                        placeholder="price_..."
                        value={payments.bookPriceId || ''}
                        onChange={(e) => setPayments({ ...payments, bookPriceId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#706E69] mb-1">Cheat Sheets (₹40 Price ID)</label>
                      <input
                        type="text"
                        placeholder="price_..."
                        value={payments.cheatsheetsPriceId || ''}
                        onChange={(e) => setPayments({ ...payments, cheatsheetsPriceId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#706E69] mb-1">Workflow (₹25 Price ID)</label>
                      <input
                        type="text"
                        placeholder="price_..."
                        value={payments.workflowPriceId || ''}
                        onChange={(e) => setPayments({ ...payments, workflowPriceId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SECURITY & PASSWORD CHANGE */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#E2DBD0]">
                  <h2 className="text-base font-semibold text-[#181918]">Administrator Security & Credentials</h2>
                  <p className="text-xs text-[#706E69]">
                    Manage your administrator credentials and update your password securely in Firebase Authentication.
                  </p>
                </div>

                {/* Current Admin Account Details */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#244634] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#244634]" />
                    <span>Active Administrator Profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[#706E69] block">Administrator Email:</span>
                      <strong className="text-[#181918] font-medium">{user?.email || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#706E69] block">Display Name:</span>
                      <strong className="text-[#181918] font-medium">{adminRecord?.name || 'Administrator'}</strong>
                    </div>
                    <div>
                      <span className="text-[#706E69] block">Role:</span>
                      <strong className="text-[#181918] font-medium uppercase font-mono">{adminRecord?.role || 'admin'}</strong>
                    </div>
                    <div>
                      <span className="text-[#706E69] block">Firebase UID:</span>
                      <span className="text-[#706E69] font-mono text-[11px] truncate block">{user?.uid || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Password Change Feedback */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#EAF0EC] border border-[#244634]/30 text-[#244634] text-xs animate-fadeIn">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Change Password Form */}
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-[#244634]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-[#244634]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#706E69] mt-1 block">Minimum 6 characters. Must differ from current password.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#706E69] mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-[#244634]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <KeyRound className="w-4 h-4" />
                      {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action (for general, contact, social, payments) */}
            {activeTab !== 'security' && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2DBD0]">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#244634] text-[#FAF7F2] text-sm font-medium rounded-xl hover:bg-[#1B3527] transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : `Save ${activeTab.toUpperCase()} Settings`}
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}

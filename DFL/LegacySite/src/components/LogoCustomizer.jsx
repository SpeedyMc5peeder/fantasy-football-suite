import React, { useState } from 'react';
import { X, Upload, Check, Palette, Sparkles, Image as ImageIcon } from 'lucide-react';

const PRESET_MASCOTS = [
  { name: 'War Rhinoceros', icon: '🦏', url: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=200&auto=format&fit=crop&q=80' },
  { name: 'Cyber Wolf', icon: '🐺', url: 'https://images.unsplash.com/photo-1564865878688-9a244444042a?w=200&auto=format&fit=crop&q=80' },
  { name: 'Gunslinger', icon: '🤠', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' },
  { name: 'Heisenberg Hazmat', icon: '🧪', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&auto=format&fit=crop&q=80' },
  { name: 'Shadow Ronin', icon: '🥷', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
  { name: 'Valkyrie Blade', icon: '⚔️', url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=200&auto=format&fit=crop&q=80' },
  { name: 'Washed Laundry', icon: '🧺', url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200&auto=format&fit=crop&q=80' },
  { name: 'Island Palm', icon: '🏝️', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80' },
];

export default function LogoCustomizer({ isOpen, onClose, currentUser, onSaveProfile }) {
  const [logoUrl, setLogoUrl] = useState(currentUser?.customLogoUrl || currentUser?.avatar || '');
  const [slogan, setSlogan] = useState(currentUser?.slogan || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('franchiseKey', currentUser.franchiseKey);

    setUploading(true);
    try {
      const res = await fetch('/api/profile/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.logoUrl) {
        setLogoUrl(data.logoUrl);
      }
    } catch (err) {
      // Fallback: create local object URL preview
      setLogoUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveProfile(currentUser.franchiseKey, {
      customLogoUrl: logoUrl,
      slogan,
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#111726] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display tracking-wide uppercase text-white">
              Franchise Branding Studio
            </h3>
            <p className="text-xs text-slate-400">
              Customize {currentUser.teamName} ({currentUser.name})
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Preview Badge */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <img
              src={logoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
              alt="Logo Preview"
              className="w-16 h-16 rounded-2xl border-2 border-cyan-400 object-cover shadow-md"
            />
            <div>
              <span className="text-[10px] font-bold uppercase text-cyan-400 block">Live Preview</span>
              <h4 className="font-bold text-sm text-white">{currentUser.teamName}</h4>
              <p className="text-xs text-slate-400 italic">"{slogan || 'No team slogan set'}"</p>
            </div>
          </div>

          {/* Option 1: File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Upload Logo From Device
            </label>
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/80">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-300">
                {uploading ? 'Uploading image...' : 'Click or tap to choose photo (PNG/JPG)'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Works on iPhone, Android, or PC</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Option 2: Choose Mascot Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Or Choose Preset Mascot Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_MASCOTS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLogoUrl(m.url)}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center ${
                    logoUrl === m.url
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-glow-cyan'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl mb-1">{m.icon}</span>
                  <span className="text-[10px] font-bold text-slate-300 truncate w-full">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Team Motto / Slogan
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="e.g. 44-12 speaks for itself or Shaving close since '22"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs rounded-xl shadow-glow-cyan hover:from-cyan-400 transition"
            >
              {success ? 'Saved!' : 'Save Branding Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

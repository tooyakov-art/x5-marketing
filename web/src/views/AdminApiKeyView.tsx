
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Key, Save, Lock, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { db } from '../firebase';
import { GoogleGenAI } from "@google/genai";

interface AdminApiKeyViewProps {
  onBack: () => void;
}

export const AdminApiKeyView: React.FC<AdminApiKeyViewProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current key from Firestore so admin sees what is active
    const fetchKey = async () => {
        try {
            const doc = await db.collection('system').doc('api_config').get();
            if (doc.exists && doc.data()?.key) {
                setApiKey(doc.data()?.key);
            }
        } catch (e) {
            console.error("Failed to load key", e);
        }
    };
    fetchKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey || apiKey.length < 20) {
        alert("Invalid API Key format");
        return;
    }

    setLoading(true);
    setStatus('idle');

    try {
        await db.collection('system').doc('api_config').set({
            key: apiKey,
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin'
        });
        setStatus('success');
        // Do not clear key, keep it visible for confirmation
        setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
        console.error(e);
        setStatus('error');
    } finally {
        setLoading(false);
    }
  };

  const handleTest = async () => {
      if (!apiKey) return;
      setTestLoading(true);
      setTestResult(null);

      try {
          // Direct test using the input key to verify it works before (or after) saving
          const ai = new GoogleGenAI({ apiKey: apiKey });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: 'Reply with strictly: "System Operational. AI Connection Verified."',
          });
          setTestResult(response.text || "No response text");
      } catch (e: any) {
          console.error(e);
          setTestResult(`Error: ${e.message || "Connection failed"}`);
      } finally {
          setTestLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6]">
        {/* HEADER */}
        <div className="pt-16 pb-6 px-6 bg-white shadow-sm shrink-0 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-200">
                    <ChevronLeft size={22} className="text-slate-800" />
                </button>
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-none">Global Config</h2>
                    <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">Admin Access Only</p>
                </div>
            </div>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner relative">
                        <Key size={32} />
                        {testResult && !testResult.startsWith('Error') && (
                            <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-scale-in">
                                <CheckCircle2 size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Master API Key</h3>
                <p className="text-center text-slate-500 text-sm mb-8 leading-relaxed">
                    Этот ключ будет применен для <b>ВСЕХ</b> пользователей приложения немедленно.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">New Gemini API Key</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-[20px] py-4 pl-12 pr-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                            />
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleTest}
                            disabled={testLoading || !apiKey}
                            className={`flex-1 py-4 rounded-[20px] font-bold text-slate-700 bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200 hover:bg-slate-200`}
                        >
                            {testLoading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Zap size={18} className="text-orange-500 fill-orange-500" />}
                            Test
                        </button>

                        <button 
                            onClick={handleSave}
                            disabled={loading || !apiKey}
                            className={`flex-[2] py-4 rounded-[20px] font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${status === 'success' ? 'bg-green-500' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {loading ? 'Saving...' : (status === 'success' ? 'Saved' : 'Update Key')}
                            {!loading && status !== 'success' && <Save size={18} />}
                        </button>
                    </div>
                </div>

                {status === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                        <AlertTriangle size={16} /> Failed to update database.
                    </div>
                )}

                {testResult && (
                    <div className={`mt-6 p-4 rounded-2xl border text-sm font-mono leading-relaxed animate-fade-in ${testResult.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                            {testResult.startsWith('Error') ? 'Test Failed' : 'AI Response'}
                        </p>
                        {testResult}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

import React, { useState } from 'react';
import { apiCall } from '../../services/api';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Apne backend ke login endpoint ke mutabiq route check kar lein (e.g. /teachers/login ya /auth/login)
        const res = await apiCall('/teachers/login', 'POST', { email, password });

        setLoading(false);
        if (res.success) {
            // Token save karein jo backend return karega
            localStorage.setItem('teacherToken', res.data.token);
            alert('Login Successful!');
            onLoginSuccess(); // Dashboard par redirect karne ke liye
        } else {
            alert(res.message || 'Login failed!');
        }
    };

    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-8 border border-white/50 w-full max-w-md";
    const neumorphicInput = "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-3 outline-none text-slate-700 border border-transparent w-full text-xs";

    return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-6 font-sans">
            <div className={neumorphicCard}>
                <h2 className="text-xl font-black text-slate-800 mb-2">Teacher Portal Login</h2>
                <p className="text-xs text-slate-500 mb-6">Enter your credentials to access dashboard.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={neumorphicInput} placeholder="teacher@school.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={neumorphicInput} placeholder="********" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
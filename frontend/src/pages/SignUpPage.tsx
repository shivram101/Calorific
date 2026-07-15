// src/pages/SignUpPage.tsx
import { useState } from 'react';
import { register } from '../api/client';

// Scores 0–5 based on length, character variety, and mixed case.
// Not a security guarantee — just a helpful visual nudge for the user.
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '#E8E4DC' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { label: 'Very weak', color: '#DC4C3F' },
        { label: 'Weak', color: '#DC4C3F' },
        { label: 'Fair', color: '#EF9F27' },
        { label: 'Good', color: '#EFC927' },
        { label: 'Strong', color: '#8BC34A' },
        { label: 'Very strong', color: '#188159' },
    ];

    return { score, ...levels[score] };
}

function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const strength = getPasswordStrength(password);

    async function handleSignUp(e: any) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const parts = name.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        try {
            await register(email, password, firstName, lastName);
            setSuccess('Account created! Please check your email to verify.');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', fontSize: '110px', top: '-30px', left: '-30px', opacity: 0.5 }}>🍃</div>
            <div style={{ position: 'absolute', fontSize: '90px', bottom: '-20px', right: '-10px', opacity: 0.5 }}>🥑</div>
            <div style={{ position: 'absolute', fontSize: '50px', top: '10%', right: '12%', opacity: 0.35 }}>🍓</div>

            <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 34px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '26px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥗</div>
                    <h1 style={{ fontSize: '21px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Calorific</h1>
                    <p style={{ fontSize: '12px', color: '#777167', marginTop: '5px' }}>Create your account</p>
                </div>

                {error && (
                    <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ background: '#E1F5EE', border: '1px solid #1FA873', color: '#0F6E56', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSignUp}>
                    <label htmlFor="signup-name" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>Full name</label>
                    <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <i className="ti ti-user" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true" />
                        <input id="signup-name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#2D2A26', width: '100%' }} required />
                    </div>

                    <label htmlFor="signup-email" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>Email address</label>
                    <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <i className="ti ti-mail" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true" />
                        <input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#2D2A26', width: '100%' }} required />
                    </div>

                    <label htmlFor="signup-password" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>Password</label>
                    <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="ti ti-lock" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true" />
                        <input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#2D2A26', width: '100%' }} required />
                    </div>

                    {/* Password strength meter */}
                    {password && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }} aria-hidden="true">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} style={{
                                        flex: 1,
                                        height: 4,
                                        borderRadius: 2,
                                        background: i < strength.score ? strength.color : '#E8E4DC',
                                        transition: 'background-color 0.2s ease',
                                    }} />
                                ))}
                            </div>
                            <div
                                role="status"
                                style={{ fontSize: 11, fontWeight: 600, color: strength.color }}
                            >
                                {strength.label}
                            </div>
                        </div>
                    )}

                    <label htmlFor="signup-confirm-password" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>Confirm password</label>
                    <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <i className="ti ti-lock" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true" />
                        <input id="signup-confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#2D2A26', width: '100%' }} required />
                    </div>

                    <button type="submit"
                        style={{ width: '100%', background: '#188159', color: '#fff', border: 'none', borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)' }}>
                        Sign Up
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '13px', color: '#777167', marginTop: '20px' }}>
                    Already have an account?{' '}
                    <a href="/login" style={{ color: '#188159', fontWeight: 600, textDecoration: 'none' }}>Log In</a>
                </p>
            </div>
        </div>
    );
}

export default SignUpPage;
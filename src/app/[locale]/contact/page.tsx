'use client';

import Link from '@/i18n/link';
import { useState } from 'react';
import { useT } from '@/i18n/provider';
import { interpolate } from '@/i18n/messages';
import { getContact } from '@/i18n/copy/contact';

export default function ContactPage() {
  const { locale } = useT();
  const copy = getContact(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, company, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('ok');
      } else {
        setState('error');
        setErrorMsg(data.error ?? copy.errorGeneric);
      }
    } catch {
      setState('error');
      setErrorMsg(copy.errorNetwork);
    }
  }

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">CONTACT</div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-lead">{copy.lead}</p>

          <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {copy.trust.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>{t.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="page-split">

            {state === 'ok' ? (
              <div className="card" style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklch, var(--acc-mint) 15%, var(--bg-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 22, letterSpacing: '-0.02em' }}>{copy.successTitle}</h3>
                <p style={{ color: 'var(--text-3)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  {interpolate(copy.successBody, { email })}
                </p>
                <Link href="/" className="btn btn-ghost">{copy.backHome}</Link>
              </div>
            ) : (
              <form className="card" style={{ padding: 32 }} onSubmit={handleSubmit}>
                <h3 style={{ margin: '0 0 24px', fontSize: 18, letterSpacing: '-0.015em' }}>{copy.formTitle}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-row-2">
                    <div className="field">
                      <label>{copy.name}</label>
                      <input
                        className="input"
                        placeholder={copy.namePlaceholder}
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={state === 'loading'}
                      />
                    </div>
                    <div className="field">
                      <label>{copy.email}</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="you@company.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={state === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>{copy.typeLabel}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {copy.types.map(ct => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => setType(ct.value)}
                          disabled={state === 'loading'}
                          style={{
                            padding: '7px 13px',
                            borderRadius: 8,
                            border: `1px solid ${type === ct.value ? 'var(--acc-blue)' : 'var(--line-2)'}`,
                            background: type === ct.value ? 'color-mix(in oklch, var(--acc-blue) 10%, var(--bg-1))' : 'var(--bg-2)',
                            color: type === ct.value ? 'var(--acc-blue)' : 'var(--text-2)',
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 140ms',
                            fontWeight: type === ct.value ? 600 : 400,
                          }}
                        >
                          {ct.icon} {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>{copy.company} <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>{copy.optional}</span></label>
                    <input
                      className="input"
                      placeholder="Company name"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      disabled={state === 'loading'}
                    />
                  </div>

                  <div className="field">
                    <label>{copy.message}</label>
                    <textarea
                      className="input"
                      rows={5}
                      placeholder={copy.messagePlaceholder}
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={state === 'loading'}
                      style={{ resize: 'vertical', minHeight: 120 }}
                    />
                  </div>

                  {state === 'error' && (
                    <p style={{ color: 'var(--acc-rose)', fontSize: 13, margin: 0 }}>{errorMsg}</p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.03em' }}>
                      {copy.encrypted}
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={state === 'loading'}>
                      {state === 'loading' ? copy.sending : copy.send}
                      {state !== 'loading' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7M7 7h10v10" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.08em', marginBottom: 14 }}>DIRECT CONTACT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
                  {copy.direct.map(item => (
                    <div key={item.label}>
                      <div style={{ color: 'var(--text-3)', fontSize: 11.5, marginBottom: 3, fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>{item.label}</div>
                      <a href={`mailto:${item.mail}`} style={{ color: 'var(--acc-blue)', fontWeight: 500 }}>{item.mail}</a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-widget">
                <span className="ai-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  {copy.faqTag}
                </span>
                <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.55 }}>
                  {copy.faqBody}
                </p>
                <Link href="/faq" className="btn btn-sm">
                  {copy.faqCta}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </Link>
              </div>

              <div className="card" style={{ padding: 22, background: 'color-mix(in oklch, var(--acc-purple) 5%, var(--bg-2))' }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--acc-purple)', letterSpacing: '0.08em', marginBottom: 10 }}>NEWSLETTER</div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                  {copy.newsletterBody}
                </p>
                <Link href="/subscribe" className="btn btn-sm btn-primary">{copy.newsletterCta}</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

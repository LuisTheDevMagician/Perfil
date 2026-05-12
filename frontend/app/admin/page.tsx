'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { DisciplinasTab } from './components/DisciplinasTab';
import { TemasTab } from './components/TemasTab';
import { CartasTab } from './components/CartasTab';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#07070E', paper: '#0E0E1A' },
    primary: { main: '#7C3AED' },
    error: { main: '#EF4444' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: { background: '#0E0E1A', border: '1px solid rgba(255,255,255,0.08)', backgroundImage: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

const TABS = ['Disciplinas', 'Temas', 'Cartas'];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: '#07070E', fontFamily: 'var(--font-body)' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,7,14,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AdminPanelSettingsIcon sx={{ color: '#C4B5FD', fontSize: 22 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.08em', color: '#C4B5FD' }}>
            PAINEL ADMIN
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)',
            }}>
            <ArrowBackIcon sx={{ fontSize: 15 }} /> Voltar
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(14,14,26,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex' }}>
          {TABS.map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '14px 22px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === i ? '#7C3AED' : 'transparent'}`,
              color: tab === i ? '#C4B5FD' : 'rgba(255,255,255,0.4)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
              transition: 'color 0.15s, border-color 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ThemeProvider theme={darkTheme}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          {tab === 0 && <DisciplinasTab />}
          {tab === 1 && <TemasTab />}
          {tab === 2 && <CartasTab />}
        </div>
      </ThemeProvider>
    </div>
  );
}

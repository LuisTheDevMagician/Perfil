'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, Tab, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DisciplinasTab } from './components/DisciplinasTab';
import { TemasTab } from './components/TemasTab';
import { CartasTab } from './components/CartasTab';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#9333EA' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Painel de Administração
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => router.push('/')}
            sx={{ color: 'white' }}
            startIcon={<ArrowBackIcon />}
          >
            Voltar
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ bgcolor: 'white' }}>
          <Tab label="Disciplinas" />
          <Tab label="Temas" />
          <Tab label="Cartas" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}><DisciplinasTab /></TabPanel>
      <TabPanel value={tabValue} index={1}><TemasTab /></TabPanel>
      <TabPanel value={tabValue} index={2}><CartasTab /></TabPanel>
    </Box>
  );
}
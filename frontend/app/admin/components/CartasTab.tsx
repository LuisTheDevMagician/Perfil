'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Carta {
  id: number;
  nome: string;
  tema_id: number;
  tema_nome: string;
  disciplina_nome: string;
  disciplina_id: number;
  dicas: string;
}

interface Tema {
  id: number;
  nome: string;
  disciplina_id: number;
  disciplina_nome: string;
}

interface Disciplina {
  id: number;
  nome: string;
}

const API_URL = 'http://localhost:3001/api';

export function CartasTab() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Carta | null>(null);
  const [nome, setNome] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number>(0);
  const [temaId, setTemaId] = useState<number>(0);
  const [dicas, setDicas] = useState<string[]>(Array(10).fill(''));

  const temasFiltrados = temas.filter(t => t.disciplina_id === disciplinaId);

  const fetchData = async () => {
    const [cartasRes, temasRes, discRes] = await Promise.all([
      fetch(`${API_URL}/cartas`),
      fetch(`${API_URL}/temas`),
      fetch(`${API_URL}/disciplinas`),
    ]);
    const cartasData = await cartasRes.json();
    setCartas(cartasData.map((c: any) => ({
      ...c,
      dicas: typeof c.dicas === 'string' ? c.dicas : JSON.stringify(c.dicas || []),
    })));
    setTemas(await temasRes.json());
    setDisciplinas(await discRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAbrirEditor = (carta?: Carta) => {
    if (carta) {
      setEditando(carta);
      setNome(carta.nome);
      setDisciplinaId(carta.disciplina_id);
      setTemaId(carta.tema_id);
      try {
        const parsedDicas = JSON.parse(carta.dicas);
        setDicas(Array.isArray(parsedDicas) ? parsedDicas : Array(10).fill(''));
      } catch {
        setDicas(Array(10).fill(''));
      }
    } else {
      setEditando(null);
      setNome('');
      setDisciplinaId(disciplinas[0]?.id || 0);
      setTemaId(0);
      setDicas(Array(10).fill(''));
    }
    setOpen(true);
  };

  const handleDisciplinaChange = (newDisciplinaId: number) => {
    setDisciplinaId(newDisciplinaId);
    setTemaId(0);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) { alert('Nome é obrigatório'); return; }
    if (!temaId) { alert('Tema é obrigatório'); return; }
    if (dicas.some(d => !d.trim())) { alert('Todas as 10 dicas devem ser preenchidas'); return; }
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `${API_URL}/cartas/${editando.id}` : `${API_URL}/cartas`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, temaId, dicas }),
    });
    if (res.ok) {
      setOpen(false);
      fetchData();
    } else {
      const error = await res.json();
      alert(error.error || 'Erro ao salvar');
    }
  };

  const handleExcluir = async (id: number) => {
    if (confirm('Excluir esta carta?')) {
      await fetch(`${API_URL}/cartas/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
          Gerenciar Cartas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAbrirEditor()}
          sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
        >
          Nova Carta
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(14,14,26,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              {['ID', 'Nome', 'Tema', 'Disciplina'].map((h) => (
                <TableCell key={h} sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderColor: 'rgba(255,255,255,0.07)' }}>
                  {h}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderColor: 'rgba(255,255,255,0.07)' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cartas.map((c) => (
              <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}>{c.id}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.05)' }}>{c.nome}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.05)' }}>{c.tema_nome}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.05)' }}>{c.disciplina_nome}</TableCell>
                <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <IconButton onClick={() => handleAbrirEditor(c)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#C4B5FD' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(c.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {cartas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  Nenhuma carta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.07)', pb: 2 }}>
          {editando ? 'Editar' : 'Nova'} Carta
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.35)', mt: 0.5 }}>
            10 dicas obrigatórias
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nome da Carta"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Disciplina</InputLabel>
              <Select
                value={disciplinaId}
                label="Disciplina"
                onChange={(e) => handleDisciplinaChange(e.target.value as number)}
              >
                {disciplinas.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tema</InputLabel>
              <Select
                value={temaId}
                label="Tema"
                onChange={(e) => setTemaId(e.target.value as number)}
                disabled={!disciplinaId}
              >
                {temasFiltrados.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', mt: 1 }}>
              10 Dicas
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {dicas.map((dica, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Dica ${index + 1}`}
                  value={dica}
                  onChange={(e) => {
                    const newDicas = [...dicas];
                    newDicas[index] = e.target.value;
                    setDicas(newDicas);
                  }}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

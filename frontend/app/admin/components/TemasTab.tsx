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

export function TemasTab() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Tema | null>(null);
  const [nome, setNome] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number>(0);

  const fetchData = async () => {
    const [temasRes, discRes] = await Promise.all([
      fetch(`${API_URL}/temas`),
      fetch(`${API_URL}/disciplinas`),
    ]);
    setTemas(await temasRes.json());
    setDisciplinas(await discRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSalvar = async () => {
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `${API_URL}/temas/${editando.id}` : `${API_URL}/temas`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, disciplinaId }),
    });
    setOpen(false);
    setNome('');
    setDisciplinaId(0);
    setEditando(null);
    fetchData();
  };

  const handleExcluir = async (id: number) => {
    if (confirm('Excluir este tema? Isso também excluirá todas as cartas vinculadas.')) {
      await fetch(`${API_URL}/temas/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setDisciplinaId(disciplinas[0]?.id || 0);
    setOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
          Gerenciar Temas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNovo}
          sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
        >
          Novo Tema
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(14,14,26,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              {['ID', 'Nome', 'Disciplina'].map((h) => (
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
            {temas.map((t) => (
              <TableRow key={t.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}>{t.id}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.05)' }}>{t.nome}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.05)' }}>{t.disciplina_nome}</TableCell>
                <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <IconButton onClick={() => { setEditando(t); setNome(t.nome); setDisciplinaId(t.disciplina_id); setOpen(true); }} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#C4B5FD' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(t.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {temas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  Nenhum tema encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.07)', pb: 2 }}>
          {editando ? 'Editar' : 'Novo'} Tema
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Disciplina</InputLabel>
            <Select
              value={disciplinaId}
              label="Disciplina"
              onChange={(e) => setDisciplinaId(e.target.value as number)}
            >
              {disciplinas.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

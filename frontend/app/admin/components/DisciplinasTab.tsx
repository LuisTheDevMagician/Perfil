'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Disciplina {
  id: number;
  nome: string;
}

const API_URL = 'http://localhost:3001/api';

export function DisciplinasTab() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Disciplina | null>(null);
  const [nome, setNome] = useState('');

  const fetchDisciplinas = async () => {
    const res = await fetch(`${API_URL}/disciplinas`);
    setDisciplinas(await res.json());
  };

  useEffect(() => {
    fetchDisciplinas();
  }, []);

  const handleSalvar = async () => {
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `${API_URL}/disciplinas/${editando.id}` : `${API_URL}/disciplinas`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    setOpen(false);
    setNome('');
    setEditando(null);
    fetchDisciplinas();
  };

  const handleExcluir = async (id: number) => {
    if (confirm('Excluir esta disciplina? Isso também excluirá todos os temas e cartas vinculados.')) {
      await fetch(`${API_URL}/disciplinas/${id}`, { method: 'DELETE' });
      fetchDisciplinas();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem' }}>
          Gerenciar Disciplinas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditando(null); setNome(''); setOpen(true); }}
          sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
        >
          Nova Disciplina
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(14,14,26,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              <TableCell sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderColor: 'rgba(255,255,255,0.07)' }}>ID</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderColor: 'rgba(255,255,255,0.07)' }}>Nome</TableCell>
              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, borderColor: 'rgba(255,255,255,0.07)' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {disciplinas.map((d) => (
              <TableRow key={d.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}>{d.id}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.05)' }}>{d.nome}</TableCell>
                <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <IconButton onClick={() => { setEditando(d); setNome(d.nome); setOpen(true); }} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#C4B5FD' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(d.id)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {disciplinas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  Nenhuma disciplina encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.07)', pb: 2 }}>
          {editando ? 'Editar' : 'Nova'} Disciplina
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

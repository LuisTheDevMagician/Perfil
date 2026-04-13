'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography } from '@mui/material';
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
      body: JSON.stringify({ nome })
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
        <Typography variant="h5" sx={{ color: '#000000' }}>Gerenciar Disciplinas</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => { setEditando(null); setNome(''); setOpen(true); }}
          sx={{ bgcolor: '#9333EA', '&:hover': { bgcolor: '#7e22ce' } }}
        >
          Nova Disciplina
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell align="right"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {disciplinas.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{d.nome}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setEditando(d); setNome(d.nome); setOpen(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(d.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {disciplinas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhuma disciplina encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editando ? 'Editar' : 'Nova'} Disciplina</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#9333EA' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
      fetch(`${API_URL}/disciplinas`)
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
      body: JSON.stringify({ nome, disciplinaId })
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
        <Typography variant="h5" sx={{ color: '#000000' }}>Gerenciar Temas</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={abrirNovo}
          sx={{ bgcolor: '#9333EA', '&:hover': { bgcolor: '#7e22ce' } }}
        >
          Novo Tema
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Disciplina</strong></TableCell>
              <TableCell align="right"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {temas.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.nome}</TableCell>
                <TableCell>{t.disciplina_nome}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setEditando(t); setNome(t.nome); setDisciplinaId(t.disciplina_id); setOpen(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(t.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {temas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum tema encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editando ? 'Editar' : 'Novo'} Tema</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
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
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#9333EA' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
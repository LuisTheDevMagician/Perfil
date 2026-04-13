'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Carta {
  id: number;
  nome: string;
  tema_id: number;
  tema_nome: string;
  disciplina_nome: string;
  dicas: string;
}

interface Tema {
  id: number;
  nome: string;
  disciplina_nome: string;
}

const API_URL = 'http://localhost:3001/api';

export function CartasTab() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Carta | null>(null);
  const [nome, setNome] = useState('');
  const [temaId, setTemaId] = useState<number>(0);
  const [dicas, setDicas] = useState<string[]>(Array(10).fill(''));

  const fetchData = async () => {
    const [cartasRes, temasRes] = await Promise.all([
      fetch(`${API_URL}/cartas`),
      fetch(`${API_URL}/temas`)
    ]);
    const cartasData = await cartasRes.json();
    setCartas(cartasData.map((c: any) => ({
      ...c,
      dicas: typeof c.dicas === 'string' ? c.dicas : JSON.stringify(c.dicas || [])
    })));
    setTemas(await temasRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAbrirEditor = (carta?: Carta) => {
    if (carta) {
      setEditando(carta);
      setNome(carta.nome);
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
      setTemaId(temas[0]?.id || 0);
      setDicas(Array(10).fill(''));
    }
    setOpen(true);
  };

  const handleSalvar = async () => {
    if (dicas.some(d => !d.trim())) {
      alert('Todas as 10 dicas devem ser preenchidas');
      return;
    }
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `${API_URL}/cartas/${editando.id}` : `${API_URL}/cartas`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, temaId, dicas })
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
        <Typography variant="h5" sx={{ color: '#000000' }}>Gerenciar Cartas</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleAbrirEditor()}
          sx={{ bgcolor: '#9333EA', '&:hover': { bgcolor: '#7e22ce' } }}
        >
          Nova Carta
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Tema</strong></TableCell>
              <TableCell><strong>Disciplina</strong></TableCell>
              <TableCell align="right"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cartas.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.nome}</TableCell>
                <TableCell>{c.tema_nome}</TableCell>
                <TableCell>{c.disciplina_nome}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleAbrirEditor(c)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleExcluir(c.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {cartas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhuma carta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editando ? 'Editar' : 'Nova'} Carta (10 dicas obrigatórias)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome da Carta"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tema</InputLabel>
              <Select
                value={temaId}
                label="Tema"
                onChange={(e) => setTemaId(e.target.value as number)}
              >
                {temas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nome} ({t.disciplina_nome})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="h6" sx={{ mb: 1 }}>10 Dicas:</Typography>
            <Grid container spacing={1}>
              {dicas.map((dica, index) => (
                <Grid item xs={12} key={index}>
                  <TextField
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
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" sx={{ bgcolor: '#9333EA' }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
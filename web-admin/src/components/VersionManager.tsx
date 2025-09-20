import React, { useState } from 'react';
import {
  Box, TextField, Button, List, ListItem, ListItemText, IconButton, Typography, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppVersion, addAppVersion } from '../api';

interface VersionManagerProps {
  versions: AppVersion[];
  onVersionChange: () => void; // Callback to refresh versions in parent
  onDelete: (id: number) => void;
}

export const VersionManager: React.FC<VersionManagerProps> = ({ versions, onVersionChange, onDelete }) => {
  const [newVersion, setNewVersion] = useState('');

  const handleAddVersion = async () => {
    if (!newVersion.trim()) return;
    try {
      await addAppVersion(newVersion.trim());
      setNewVersion('');
      onVersionChange();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Не удалось добавить версию');
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Управление версиями приложений</Typography>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          size="small"
          label="Новая версия (напр. 1.2.0)"
          value={newVersion}
          onChange={(e) => setNewVersion(e.target.value)}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button variant="contained" onClick={handleAddVersion}>Добавить</Button>
      </Box>
      <List dense>
        {versions.map(v => (
          <ListItem
            key={v.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => onDelete(v.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={v.version} />
          </ListItem>
        ))}
      </List>
      {versions.length === 0 && (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>Нет добавленных версий.</Typography>
      )}
    </Paper>
  );
}

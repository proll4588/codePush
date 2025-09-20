import React, { useState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent
} from '@mui/material';
import { uploadArtifact, AppVersion } from '../api';

interface UploadArtifactDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  appVersions: AppVersion[];
}

export const UploadArtifactDialog: React.FC<UploadArtifactDialogProps> = ({ open, onClose, onUploadSuccess, appVersions }) => {
  const [file, setFile] = useState<File | null>(null);
  const [appVersionId, setAppVersionId] = useState<string>('');
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [notes, setNotes] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !appVersionId) {
      alert('Пожалуйста, выберите файл и версию приложения.');
      return;
    }

    const formData = new FormData();
    formData.append('artifact', file);
    formData.append('app_version_id', appVersionId);
    formData.append('platform', platform);
    formData.append('notes', notes);

    try {
      await uploadArtifact(formData);
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка загрузки артефакта:', error);
      alert('Не удалось загрузить артефакт.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Загрузить новую сборку</DialogTitle>
      <DialogContent>
        <Button variant="contained" component="label" fullWidth sx={{ mt: 2, mb: 2 }}>
          Выбрать файл (.apk, .aab, .ipa)
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {file && <p>Выбранный файл: {file.name}</p>}
        
        <FormControl fullWidth margin="dense" required>
          <InputLabel>Версия приложения</InputLabel>
          <Select value={appVersionId} label="Версия приложения" onChange={(e) => setAppVersionId(e.target.value)}>
            {appVersions.map((v) => (
              <MenuItem key={v.id} value={v.id}>{v.version}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" required>
          <InputLabel>Платформа</InputLabel>
          <Select value={platform} label="Платформа" onChange={(e) => setPlatform(e.target.value as any)}>
            <MenuItem value="android">Android</MenuItem>
            <MenuItem value="ios">iOS</MenuItem>
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="Заметки к релизу"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleUpload} variant="contained">Загрузить</Button>
      </DialogActions>
    </Dialog>
  );
};

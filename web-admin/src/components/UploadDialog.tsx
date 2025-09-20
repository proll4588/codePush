import React, { useState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, OutlinedInput, Box, Chip
} from '@mui/material';
import { uploadBundle, AppVersion } from '../api';
import { FormControlLabel, Checkbox } from '@mui/material';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  appVersions: AppVersion[];
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onUploadSuccess, appVersions }) => {
  const [file, setFile] = useState<File | null>(null);
  const [bundleVersion, setBundleVersion] = useState('');
  const [compatibleVersions, setCompatibleVersions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'all'>('all');
  const [isTestOnly, setIsTestOnly] = useState<boolean>(true);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !bundleVersion || compatibleVersions.length === 0) {
      alert('Пожалуйста, заполните все обязательные поля и выберите хотя бы одну совместимую версию.');
      return;
    }

    const formData = new FormData();
    formData.append('bundle', file);
    formData.append('version', bundleVersion);
    formData.append('compatibleVersions', compatibleVersions.join(','));
    formData.append('description', description);
    formData.append('platform', platform);
    formData.append('is_test_only', String(isTestOnly));

    try {
      await uploadBundle(formData);
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить бандл.');
    }
  };

  const handleCompatibleVersionChange = (event: SelectChangeEvent<typeof compatibleVersions>) => {
    const { target: { value } } = event;
    setCompatibleVersions(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Загрузить новый бандл</DialogTitle>
      <DialogContent>
        <Button variant="contained" component="label" fullWidth sx={{ mt: 2, mb: 2 }}>
          Выбрать файл
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {file && <p>Выбранный файл: {file.name}</p>}
        <TextField
          autoFocus
          margin="dense"
          label="Версия бандла (напр. 1.0.1)"
          fullWidth
          variant="outlined"
          value={bundleVersion}
          onChange={(e) => setBundleVersion(e.target.value)}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Совместимые версии</InputLabel>
          <Select
            multiple
            value={compatibleVersions}
            onChange={handleCompatibleVersionChange}
            input={<OutlinedInput label="Совместимые версии" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {appVersions.map((v) => (
              <MenuItem key={v.id} value={v.version}>
                {v.version}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Платформа</InputLabel>
          <Select value={platform} label="Платформа" onChange={(e) => setPlatform(e.target.value as any)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="ios">iOS</MenuItem>
            <MenuItem value="android">Android</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Описание"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormControlLabel
          control={<Checkbox checked={isTestOnly} onChange={(e) => setIsTestOnly(e.target.checked)} />}
          label="Загрузить как тестовый бандл"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleUpload} variant="contained">Загрузить</Button>
      </DialogActions>
    </Dialog>
  );
};

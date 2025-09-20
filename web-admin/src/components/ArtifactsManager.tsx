import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Button, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { BuildArtifact } from '../api';

interface ArtifactsManagerProps {
  artifacts: BuildArtifact[];
  onDelete: (id: number) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const ArtifactsManager: React.FC<ArtifactsManagerProps> = ({ artifacts, onDelete }) => {

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Версия</TableCell>
            <TableCell>Платформа</TableCell>
            <TableCell>Имя файла</TableCell>
            <TableCell>Размер</TableCell>
            <TableCell>Дата загрузки</TableCell>
            <TableCell>Заметки</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {artifacts.map((artifact) => (
            <TableRow key={artifact.id}>
              <TableCell>{artifact.app_version_string}</TableCell>
              <TableCell>{artifact.platform}</TableCell>
              <TableCell>{artifact.original_filename}</TableCell>
              <TableCell>{formatBytes(artifact.size)}</TableCell>
              <TableCell>{new Date(artifact.createdAt).toLocaleString()}</TableCell>
              <TableCell>{artifact.notes}</TableCell>
              <TableCell align="right">
                <Tooltip title="Скачать">
                  <IconButton href={`/api/artifacts/download/${artifact.id}`} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton onClick={() => onDelete(artifact.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {artifacts.length === 0 && (
        <Typography sx={{ p: 2, textAlign: 'center' }}>Нет загруженных сборок.</Typography>
      )}
    </TableContainer>
  );
};

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Typography, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Bundle } from '../api';

interface BundleTableProps {
  bundles: Bundle[];
  onDelete: (id: number) => void;
  onPromote: (id: number) => void;
}

export const BundleTable: React.FC<BundleTableProps> = ({ bundles, onDelete, onPromote }) => {

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Версия бандла</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Платформа</TableCell>
            <TableCell>Совместимые версии</TableCell>
            <TableCell>Размер</TableCell>
            <TableCell>Дата загрузки</TableCell>
            <TableCell>Описание</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>{bundle.bundleVersion}</TableCell>
              <TableCell>
                {bundle.is_test_only 
                  ? <Chip label="Тестовый" color="warning" size="small" /> 
                  : <Chip label="Релиз" color="success" size="small" />
                }
              </TableCell>
              <TableCell>{bundle.platform}</TableCell>
              <TableCell>
                {bundle.compatibleVersions.map(v => <Chip key={v} label={v} size="small" sx={{ mr: 0.5 }} />)}
              </TableCell>
              <TableCell>{formatBytes(bundle.size)}</TableCell>
              <TableCell>{new Date(bundle.createdAt).toLocaleString()}</TableCell>
              <TableCell>{bundle.description}</TableCell>
              <TableCell align="right">
                {bundle.is_test_only && (
                  <Tooltip title="Опубликовать">
                    <IconButton onClick={() => onPromote(bundle.id)} color="primary">
                      <RocketLaunchIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Удалить">
                  <IconButton onClick={() => onDelete(bundle.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {bundles.length === 0 && (
        <Typography sx={{ p: 2, textAlign: 'center' }}>Нет загруженных бандлов.</Typography>
      )}
    </TableContainer>
  );
};

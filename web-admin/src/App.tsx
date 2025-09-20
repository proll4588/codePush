import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Container, CssBaseline, Box, Fab, CircularProgress, Alert, Grid, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { 
  Bundle, getBundles, deleteBundle, promoteBundle, 
  AppVersion, getAppVersions, deleteAppVersion, 
  BuildArtifact, getArtifacts, deleteArtifact
} from './api';
import { BundleTable } from './components/BundleTable';
import { UploadDialog } from './components/UploadDialog';
import { VersionManager } from './components/VersionManager';
import { ArtifactsManager } from './components/ArtifactsManager';
import { UploadArtifactDialog } from './components/UploadArtifactDialog';

function App() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [appVersions, setAppVersions] = useState<AppVersion[]>([]);
  const [artifacts, setArtifacts] = useState<BuildArtifact[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploadBundleDialogOpen, setUploadBundleDialogOpen] = useState<boolean>(false);
  const [isUploadArtifactDialogOpen, setUploadArtifactDialogOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [bundlesData, versionsData, artifactsData] = await Promise.all([
        getBundles(),
        getAppVersions(),
        getArtifacts()
      ]);
      setBundles(bundlesData);
      setAppVersions(versionsData);
      setArtifacts(artifactsData);
    } catch (err) {
      setError('Не удалось загрузить данные. Убедитесь, что сервер запущен.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // --- Handlers ---
  const handleBundleDelete = async (id: number) => {
    if (window.confirm('Удалить бандл?')) { await deleteBundle(id); fetchData(); }
  };
  const handleBundlePromote = async (id: number) => {
    if (window.confirm('Опубликовать бандл?')) { await promoteBundle(id); fetchData(); }
  };
  const handleVersionDelete = async (id: number) => {
    if (window.confirm('Удалить версию?')) { await deleteAppVersion(id); fetchData(); }
  };
  const handleArtifactDelete = async (id: number) => {
    if (window.confirm('Удалить сборку?')) { await deleteArtifact(id); fetchData(); }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CodePush Admin Panel
          </Typography>
          <Tabs value={currentTab} onChange={handleTabChange} textColor="inherit">
            <Tab label="CodePush" />
            <Tab label="Сборки" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 10, mb: 4 }} maxWidth="xl">
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : (
          <Box>
            {currentTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}><BundleTable bundles={bundles} onDelete={handleBundleDelete} onPromote={handleBundlePromote} /></Grid>
                <Grid item xs={12} md={4}><VersionManager versions={appVersions} onVersionChange={fetchData} onDelete={handleVersionDelete} /></Grid>
              </Grid>
            )}
            {currentTab === 1 && (
              <ArtifactsManager artifacts={artifacts} onDelete={handleArtifactDelete} />
            )}
          </Box>
        )}
        
        {currentTab === 0 && (
          <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => setUploadBundleDialogOpen(true)}><AddIcon /></Fab>
        )}
        {currentTab === 1 && (
          <Fab color="secondary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => setUploadArtifactDialogOpen(true)}><AddIcon /></Fab>
        )}

        <UploadDialog open={isUploadBundleDialogOpen} onClose={() => setUploadBundleDialogOpen(false)} onUploadSuccess={fetchData} appVersions={appVersions} />
        <UploadArtifactDialog open={isUploadArtifactDialogOpen} onClose={() => setUploadArtifactDialogOpen(false)} onUploadSuccess={fetchData} appVersions={appVersions} />

      </Container>
    </Box>
  );
}

export default App;

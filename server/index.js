const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const version = req.body.version || timestamp;
    cb(null, `bundle-${version}.js`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB лимит
  },
  fileFilter: (req, file, cb) => {
    // Проверяем, что это JavaScript файл
    if (
      file.mimetype === 'application/javascript' ||
      file.originalname.endsWith('.js') ||
      file.originalname.endsWith('.bundle')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Только JavaScript bundle файлы разрешены'), false);
    }
  },
});

const { db, setupDatabase } = require('./db');

// Инициализация папок и БД
fs.ensureDirSync('uploads');
fs.ensureDirSync('artifacts');
setupDatabase();

// Настройка multer для загрузки артефактов
const artifactStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'artifacts/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});
const uploadArtifact = multer({ storage: artifactStorage });

// API Routes

// ... (существующие роуты для CodePush)

// Проверка обновлений
app.get('/api/check-update', async (req, res) => {
  const { appVersion, platform, isTestBuild } = req.query;

  if (!appVersion) {
    return res.status(400).json({ error: 'appVersion is required' });
  }

  console.log(
    `Проверка обновлений для ${isTestBuild === 'true' ? 'ТЕСТОВОЙ' : 'РЕЛИЗНОЙ'} сборки. Версия: ${appVersion}, платформа: ${platform}`,
  );

  try {
    const query = db('bundles')
      .where(builder => 
        builder.where('platform', platform).orWhere('platform', 'all')
      )
      .where('compatibleVersions', 'like', `%"${appVersion}"%`);

    // Если это не тестовая сборка, ищем только релизные бандлы
    if (isTestBuild !== 'true') {
      query.where('is_test_only', false);
    }
    // Для тестовых сборок ищутся все (и тестовые, и релизные)

    const latestCompatibleUpdate = await query.orderBy('createdAt', 'desc').first();

    if (!latestCompatibleUpdate) {
      return res.json({
        hasUpdate: false,
        message: 'Нет совместимых обновлений для вашей версии приложения.',
      });
    }

    res.json({
      hasUpdate: true,
      version: latestCompatibleUpdate.bundleVersion,
      downloadUrl: `/api/download/${latestCompatibleUpdate.filename}`,
      size: latestCompatibleUpdate.size,
      createdAt: latestCompatibleUpdate.createdAt,
      description: latestCompatibleUpdate.description || 'Обновление JavaScript кода',
    });

  } catch (error) {
    console.error('Ошибка при проверке обновлений в БД:', error);
    res.status(500).json({ error: 'Ошибка сервера при проверке обновлений' });
  }
});

// Загрузка bundle файла
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Файл не найден' });
  }

  res.download(filePath, err => {
    if (err) {
      console.error('Ошибка при загрузке файла:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
      }
    }
  });
});

// Загрузка нового bundle
app.post('/api/upload', upload.single('bundle'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл bundle не предоставлен' });
    }

    const { version, platform, description, compatibleVersions, is_test_only } = req.body;

    if (!compatibleVersions) {
      return res
        .status(400)
        .json({ error: 'compatibleVersions (comma-separated string) is required' });
    }

    const newBundle = {
      bundleVersion: version || Date.now().toString(),
      filename: req.file.filename,
      size: req.file.size,
      platform: platform || 'all',
      compatibleVersions: JSON.stringify(compatibleVersions.split(',').map(v => v.trim())),
      description: description || 'Обновление JavaScript кода',
      is_test_only: is_test_only === 'true', // Приводим к boolean
    };

    const [insertedBundle] = await db('bundles').insert(newBundle).returning('*');

    console.log('Новое обновление сохранено в БД:', insertedBundle);

    res.status(201).json({
      success: true,
      message: 'Bundle успешно загружен и сохранен в БД',
      update: insertedBundle,
    });
  } catch (error) {
    console.error('Ошибка при загрузке:', error);
    res.status(500).json({
      error: 'Ошибка при загрузке файла',
      details: error.message,
    });
  }
});

// Публикация (promote) бандла
app.post('/api/bundles/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCount = await db('bundles')
      .where('id', id)
      .update({ is_test_only: false });

    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Бандл не найден' });
    }

    const updatedBundle = await db('bundles').where('id', id).first();
    res.status(200).json({ success: true, message: 'Бандл опубликован', bundle: updatedBundle });

  } catch (error) {
    console.error('Ошибка публикации бандла:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка всех обновлений
app.get('/api/updates', async (req, res) => {
  try {
    const allUpdates = await db('bundles').select('*').orderBy('createdAt', 'desc');
    res.json({
      updates: allUpdates,
      total: allUpdates.length,
    });
  } catch (error) {
    console.error('Ошибка получения списка обновлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление обновления
app.delete('/api/updates/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const bundleToDelete = await db('bundles').where('id', id).first();

    if (!bundleToDelete) {
      return res.status(404).json({ error: 'Обновление не найдено' });
    }

    const filePath = path.join(__dirname, 'uploads', bundleToDelete.filename);
    fs.removeSync(filePath);

    await db('bundles').where('id', id).del();

    res.json({
      success: true,
      message: 'Обновление успешно удалено',
    });
  } catch (error) {
    console.error('Ошибка при удалении обновления:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- API для управления версиями приложений ---

app.get('/api/app-versions', async (req, res) => {
  try {
    const versions = await db('app_versions').select('*').orderBy('id', 'desc');
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения версий' });
  }
});

app.post('/api/app-versions', async (req, res) => {
  const { version } = req.body;
  if (!version) {
    return res.status(400).json({ error: 'Поле version обязательно' });
  }
  try {
    const [inserted] = await db('app_versions').insert({ version }).returning('*');
    res.status(201).json(inserted);
  } catch (error) {
    // Обработка ошибки уникальности
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Версия "${version}" уже существует` });
    }
    res.status(500).json({ error: 'Ошибка добавления версии' });
  }
});

app.delete('/api/app-versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await db('app_versions').where('id', id).del();
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Версия не найдена' });
    }
    res.status(200).json({ success: true, message: 'Версия удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления версии' });
  }
});

// --- API для управления артефактами сборок ---

app.get('/api/artifacts', async (req, res) => {
  try {
    const artifacts = await db('build_artifacts')
      .join('app_versions', 'build_artifacts.app_version_id', 'app_versions.id')
      .select(
        'build_artifacts.*'
        , 'app_versions.version as app_version_string'
      )
      .orderBy('build_artifacts.createdAt', 'desc');
    res.json(artifacts);
  } catch (error) {
    console.error('Ошибка получения артефактов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/artifacts/upload', uploadArtifact.single('artifact'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл сборки не предоставлен' });
    }
    const { app_version_id, platform, notes } = req.body;
    if (!app_version_id || !platform) {
      return res.status(400).json({ error: 'app_version_id и platform обязательны' });
    }

    const newArtifact = {
      app_version_id: parseInt(app_version_id, 10),
      platform,
      notes,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      size: req.file.size,
    };

    const [inserted] = await db('build_artifacts').insert(newArtifact).returning('*');
    res.status(201).json(inserted);

  } catch (error) {
    console.error('Ошибка загрузки артефакта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/artifacts/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artifact = await db('build_artifacts').where('id', id).first();
    if (!artifact) {
      return res.status(404).json({ error: 'Артефакт не найден' });
    }
    const filePath = path.join(__dirname, 'artifacts', artifact.filename);
    res.download(filePath, artifact.original_filename);
  } catch (error) {
    console.error('Ошибка скачивания артефакта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/artifacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artifact = await db('build_artifacts').where('id', id).first();
    if (!artifact) {
      return res.status(404).json({ error: 'Артефакт не найден' });
    }

    // Удаляем файл и запись в БД
    const filePath = path.join(__dirname, 'artifacts', artifact.filename);
    fs.removeSync(filePath);
    await db('build_artifacts').where('id', id).del();

    res.status(200).json({ success: true, message: 'Артефакт удален' });
  } catch (error) {
    console.error('Ошибка удаления артефакта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статус сервера
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    uptime: process.uptime(),
    // updatesCount: updates.length, // 'updates' is no longer in memory
    timestamp: new Date().toISOString(),
  });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Ошибка сервера:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: error.message,
  });
});

// 404 обработчик
app.use((req, res) => {
  res.status(404).json({
    error: 'Эндпоинт не найден',
    path: req.path,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Code Push Server запущен на порту ${PORT}`);
  console.log(`📁 Папка для загрузок: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌐 API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`📊 Статус сервера: http://localhost:${PORT}/api/status`);
});

module.exports = app;
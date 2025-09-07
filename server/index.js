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

// Метаданные обновлений (в реальном проекте это должно быть в БД)
let updates = [];

// Инициализация папки uploads
fs.ensureDirSync('uploads');

// API Routes

// Проверка обновлений
app.get('/api/check-update', (req, res) => {
  const { currentVersion, platform } = req.query;

  console.log(
    `Проверка обновлений для версии: ${currentVersion}, платформа: ${platform}`,
  );

  // Находим последнее обновление
  const latestUpdate = updates
    .filter(update => update.platform === platform || update.platform === 'all')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  if (!latestUpdate) {
    return res.json({
      hasUpdate: false,
      message: 'Нет доступных обновлений',
    });
  }

  // Проверяем, есть ли обновление
  const hasUpdate =
    !currentVersion ||
    currentVersion === '0' ||
    latestUpdate.version !== currentVersion;

  if (hasUpdate) {
    res.json({
      hasUpdate: true,
      version: latestUpdate.version,
      downloadUrl: `/api/download/${latestUpdate.filename}`,
      size: latestUpdate.size,
      createdAt: latestUpdate.createdAt,
      description: latestUpdate.description || 'Обновление JavaScript кода',
    });
  } else {
    res.json({
      hasUpdate: false,
      message: 'У вас уже установлена последняя версия',
    });
  }
});

// Загрузка bundle файла
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Файл не найден' });
  }

  // Отправляем файл
  res.download(filePath, err => {
    if (err) {
      console.error('Ошибка при загрузке файла:', err);
      res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
  });
});

// Загрузка нового bundle
app.post('/api/upload', upload.single('bundle'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл bundle не предоставлен' });
    }

    const { version, platform, description } = req.body;
    const timestamp = Date.now();

    // Создаем метаданные обновления
    const update = {
      id: timestamp,
      version: version || timestamp.toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      platform: platform || 'all',
      description: description || 'Обновление JavaScript кода',
      createdAt: new Date().toISOString(),
      uploadedBy: req.body.uploadedBy || 'admin',
    };

    // Добавляем в список обновлений
    updates.push(update);

    console.log('Новое обновление загружено:', update);

    res.json({
      success: true,
      message: 'Bundle успешно загружен',
      update: update,
    });
  } catch (error) {
    console.error('Ошибка при загрузке:', error);
    res.status(500).json({
      error: 'Ошибка при загрузке файла',
      details: error.message,
    });
  }
});

// Получение списка всех обновлений
app.get('/api/updates', (req, res) => {
  res.json({
    updates: updates.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    ),
    total: updates.length,
  });
});

// Удаление обновления
app.delete('/api/updates/:id', (req, res) => {
  const { id } = req.params;
  const updateIndex = updates.findIndex(update => update.id == id);

  if (updateIndex === -1) {
    return res.status(404).json({ error: 'Обновление не найдено' });
  }

  const update = updates[updateIndex];
  const filePath = path.join(__dirname, 'uploads', update.filename);

  // Удаляем файл
  fs.removeSync(filePath);

  // Удаляем из списка
  updates.splice(updateIndex, 1);

  res.json({
    success: true,
    message: 'Обновление удалено',
  });
});

// Статус сервера
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    uptime: process.uptime(),
    updatesCount: updates.length,
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

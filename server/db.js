const knex = require('knex');
const config = require('./knexfile').development;

const db = knex(config);

async function setupDatabase() {
  const hasBundlesTable = await db.schema.hasTable('bundles');
  if (!hasBundlesTable) {
    console.log('Создание таблицы bundles...');
    await db.schema.createTable('bundles', table => {
      table.increments('id').primary();
      table.string('filename').notNullable().unique();
      table.string('bundleVersion').notNullable();
      table.string('platform').notNullable();
      table.text('description');
      table.json('compatibleVersions').notNullable();
      table.integer('size');
      table.boolean('is_test_only').notNullable().defaultTo(true);
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
    console.log('Таблица bundles создана.');
  } else {
    console.log('Таблица bundles уже существует.');
    // Проверяем и добавляем недостающую колонку
    const hasColumn = await db.schema.hasColumn('bundles', 'is_test_only');
    if (!hasColumn) {
      console.log('Добавляем колонку is_test_only в таблицу bundles...');
      await db.schema.alterTable('bundles', table => {
        table.boolean('is_test_only').notNullable().defaultTo(true);
      });
      console.log('Колонка is_test_only добавлена.');
    }
  }

  const hasVersionsTable = await db.schema.hasTable('app_versions');
  if (!hasVersionsTable) {
    console.log('Создание таблицы app_versions...');
    await db.schema.createTable('app_versions', table => {
      table.increments('id').primary();
      table.string('version').notNullable().unique();
    });
    // Добавим несколько версий по умолчанию для примера
    await db('app_versions').insert([
      { version: '1.0.0' },
      { version: '1.0.1' },
      { version: '1.1.0' },
    ]);
    console.log('Таблица app_versions создана и заполнена начальными данными.');
  } else {
    console.log('Таблица app_versions уже существует.');
  }

  const hasArtifactsTable = await db.schema.hasTable('build_artifacts');
  if (!hasArtifactsTable) {
    console.log('Создание таблицы build_artifacts...');
    await db.schema.createTable('build_artifacts', table => {
      table.increments('id').primary();
      table.integer('app_version_id').unsigned().references('id').inTable('app_versions').onDelete('CASCADE');
      table.string('platform').notNullable();
      table.string('filename').notNullable().unique();
      table.string('original_filename').notNullable();
      table.integer('size');
      table.text('notes');
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
    console.log('Таблица build_artifacts создана.');
  }
}

module.exports = {
  db,
  setupDatabase,
};

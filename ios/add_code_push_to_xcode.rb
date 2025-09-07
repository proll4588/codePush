#!/usr/bin/env ruby

# Скрипт для добавления файлов CodePush в Xcode проект
# Использование: ruby add_code_push_to_xcode.rb

require 'xcodeproj'

# Путь к проекту
project_path = 'codePush.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Находим target
target = project.targets.find { |t| t.name == 'codePush' }

if target.nil?
  puts "❌ Target 'codePush' не найден"
  exit 1
end

puts "✅ Найден target: #{target.name}"

# Файлы для добавления
files_to_add = [
  'codePush/CodePushManager/CodePushManager.swift',
  'codePush/CodePushManager/CodePushManager.m'
]

# Группа для файлов
group = project.main_group.find_subpath('codePush', true)

files_to_add.each do |file_path|
  # Проверяем, существует ли файл
  unless File.exist?(file_path)
    puts "⚠️  Файл не найден: #{file_path}"
    next
  end
  
  # Проверяем, не добавлен ли уже файл
  existing_file = group.find_subpath(File.dirname(file_path), true).files.find { |f| f.path == File.basename(file_path) }
  
  if existing_file
    puts "✅ Файл уже добавлен: #{file_path}"
    next
  end
  
  # Добавляем файл
  file_ref = group.find_subpath(File.dirname(file_path), true).new_reference(File.basename(file_path))
  
  # Добавляем в target
  target.add_file_references([file_ref])
  
  puts "✅ Добавлен файл: #{file_path}"
end

# Сохраняем проект
project.save

puts "🎉 Файлы CodePush успешно добавлены в Xcode проект!"
puts "📝 Теперь можно собрать проект в Xcode"

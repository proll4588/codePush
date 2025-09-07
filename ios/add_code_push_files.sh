#!/bin/bash

# Скрипт для добавления файлов CodePush в Xcode проект
# Этот скрипт добавляет новые файлы в project.pbxproj

PROJECT_FILE="codePush.xcodeproj/project.pbxproj"
TEMP_FILE="temp_project.pbxproj"

echo "Добавление файлов CodePush в Xcode проект..."

# Создаем резервную копию
cp "$PROJECT_FILE" "${PROJECT_FILE}.backup"

# Добавляем новые файлы в PBXFileReference секцию
sed -i '' '/761780EC2CA45674006654EE \/\* AppDelegate.swift \*\/ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = AppDelegate.swift; path = codePush\/AppDelegate.swift; sourceTree = "<group>"; };/a\
		761780ED2CA45674006654EF \/\* CodePushManager.swift \*\/ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = CodePushManager.swift; path = codePush\/CodePushManager\/CodePushManager.swift; sourceTree = "<group>"; };\
		761780EE2CA45674006654F0 \/\* CodePushManager.m \*\/ = {isa = PBXFileReference; lastKnownFileType = sourcecode.c.objc; name = CodePushManager.m; path = codePush\/CodePushManager\/CodePushManager.m; sourceTree = "<group>"; };
' "$PROJECT_FILE"

# Добавляем файлы в PBXBuildFile секцию
sed -i '' '/761780ED2CA45674006654EE \/\* AppDelegate.swift in Sources \*\/ = {isa = PBXBuildFile; fileRef = 761780EC2CA45674006654EE \/\* AppDelegate.swift \*\/; };/a\
		761780EF2CA45674006654F1 \/\* CodePushManager.swift in Sources \*\/ = {isa = PBXBuildFile; fileRef = 761780ED2CA45674006654EF \/\* CodePushManager.swift \*\/; };\
		761780F02CA45674006654F2 \/\* CodePushManager.m in Sources \*\/ = {isa = PBXBuildFile; fileRef = 761780EE2CA45674006654F0 \/\* CodePushManager.m \*\/; };
' "$PROJECT_FILE"

# Добавляем файлы в Sources секцию
sed -i '' '/761780ED2CA45674006654EE \/\* AppDelegate.swift in Sources \*\/,/a\
				761780EF2CA45674006654F1 \/\* CodePushManager.swift in Sources \*\/,\
				761780F02CA45674006654F2 \/\* CodePushManager.m in Sources \*\/,
' "$PROJECT_FILE"

# Добавляем папку CodePushManager в группу
sed -i '' '/761780EC2CA45674006654EE \/\* AppDelegate.swift \*\/,/a\
				761780F12CA45674006654F3 \/\* CodePushManager \*\/,
' "$PROJECT_FILE"

# Добавляем группу CodePushManager
sed -i '' '/13B07FAE1A68108700A75B9A \/\* codePush \*\/ = {/a\
		761780F12CA45674006654F3 \/\* CodePushManager \*\/ = {\
			isa = PBXGroup;\
			children = (\
				761780ED2CA45674006654EF \/\* CodePushManager.swift \*\/,\
				761780EE2CA45674006654F0 \/\* CodePushManager.m \*\/,\
			);\
			path = CodePushManager;\
			sourceTree = "<group>";\
		};
' "$PROJECT_FILE"

echo "✅ Файлы CodePush добавлены в Xcode проект"
echo "📁 Резервная копия сохранена как: ${PROJECT_FILE}.backup"
echo "🔧 Теперь можно открыть проект в Xcode и проверить добавленные файлы"

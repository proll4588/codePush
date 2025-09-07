package com.codepush

import android.content.Context
import android.util.Log
import java.io.File

object CodePushBundleManager {
    private const val TAG = "CodePushBundleManager"
    private const val CODE_PUSH_FOLDER = "CodePush"
    private const val BUNDLE_FILE_NAME = "main.jsbundle"

    /**
     * Получает путь к JavaScript bundle файлу
     * Приоритет: Code Push bundle > встроенный bundle
     */
    fun getBundlePath(context: Context): String? {
        return try {
            // Проверяем наличие Code Push bundle
            val codePushBundle = getCodePushBundlePath(context)
            if (codePushBundle != null && codePushBundle.exists()) {
                Log.d(TAG, "Используем Code Push bundle: ${codePushBundle.absolutePath}")
                return codePushBundle.absolutePath
            }

            // Fallback на встроенный bundle
            val builtInBundle = getBuiltInBundlePath(context)
            if (builtInBundle != null && builtInBundle.exists()) {
                Log.d(TAG, "Используем встроенный bundle: ${builtInBundle.absolutePath}")
                return builtInBundle.absolutePath
            }

            Log.w(TAG, "Bundle файл не найден")
            null
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении пути к bundle", e)
            null
        }
    }

    /**
     * Получает путь к Code Push bundle
     */
    private fun getCodePushBundlePath(context: Context): File? {
        return try {
            val codePushDir = File(context.filesDir, CODE_PUSH_FOLDER)
            File(codePushDir, BUNDLE_FILE_NAME)
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении пути к Code Push bundle", e)
            null
        }
    }

    /**
     * Получает путь к встроенному bundle
     */
    private fun getBuiltInBundlePath(context: Context): File? {
        return try {
            // В Release режиме bundle обычно находится в assets
            val assetsBundle = File(context.filesDir, "index.android.bundle")
            if (assetsBundle.exists()) {
                return assetsBundle
            }

            // Альтернативные пути
            val alternativePaths = listOf(
                File(context.filesDir, "main.jsbundle"),
                File(context.filesDir, "index.bundle"),
                File(context.cacheDir, "index.android.bundle")
            )

            alternativePaths.firstOrNull { it.exists() }
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении пути к встроенному bundle", e)
            null
        }
    }

    /**
     * Проверяет наличие Code Push обновления
     */
    fun hasCodePushUpdate(context: Context): Boolean {
        return try {
            val codePushBundle = getCodePushBundlePath(context)
            codePushBundle?.exists() == true
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при проверке Code Push обновления", e)
            false
        }
    }

    /**
     * Получает информацию о Code Push bundle
     */
    fun getCodePushInfo(context: Context): Map<String, Any> {
        return try {
            val codePushBundle = getCodePushBundlePath(context)
            if (codePushBundle != null && codePushBundle.exists()) {
                mapOf(
                    "hasUpdate" to true,
                    "bundlePath" to codePushBundle.absolutePath,
                    "bundleSize" to codePushBundle.length(),
                    "lastModified" to codePushBundle.lastModified()
                )
            } else {
                mapOf(
                    "hasUpdate" to false,
                    "bundlePath" to null,
                    "bundleSize" to 0L,
                    "lastModified" to 0L
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении информации о Code Push", e)
            mapOf(
                "hasUpdate" to false,
                "bundlePath" to null,
                "bundleSize" to 0L,
                "lastModified" to 0L,
                "error" to e.message
            )
        }
    }
}

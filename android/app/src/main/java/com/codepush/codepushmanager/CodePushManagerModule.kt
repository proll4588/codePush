package com.codepush.codepushmanager

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.*
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class CodePushManagerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "CodePushManager"
        private const val SERVER_URL = "http://192.168.0.160:3000"
        private const val CODE_PUSH_FOLDER = "CodePush"
        private const val BUNDLE_FILE_NAME = "main.jsbundle"
        private const val METADATA_FILE_NAME = "metadata.json"
        private const val CONNECT_TIMEOUT = 30000
        private const val READ_TIMEOUT = 30000
        private const val MAX_RETRY_ATTEMPTS = 3
        private const val RETRY_DELAY = 1000L
    }

    override fun getName(): String {
        return "CodePushManager"
    }

    override fun getConstants(): MutableMap<String, Any> {
        val constants = HashMap<String, Any>()
        constants["serverURL"] = SERVER_URL
        constants["codePushPath"] = getCodePushPath()
        return constants
    }

    private fun getCodePushPath(): String {
        return File(reactContext.filesDir, CODE_PUSH_FOLDER).absolutePath
    }

    private fun getBundlePath(): File {
        return File(getCodePushPath(), BUNDLE_FILE_NAME)
    }

    private fun getMetadataPath(): File {
        return File(getCodePushPath(), METADATA_FILE_NAME)
    }

    private fun createCodePushDirectory() {
        try {
            val codePushDir = File(getCodePushPath())
            if (!codePushDir.exists()) {
                codePushDir.mkdirs()
                Log.d(TAG, "CodePush директория создана: ${codePushDir.absolutePath}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка создания CodePush директории", e)
        }
    }

    private fun loadMetadata(): JSONObject? {
        return try {
            val metadataFile = getMetadataPath()
            if (metadataFile.exists()) {
                val content = metadataFile.readText()
                JSONObject(content)
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка загрузки метаданных", e)
            null
        }
    }

    private fun saveMetadata(metadata: JSONObject) {
        try {
            createCodePushDirectory()
            val metadataFile = getMetadataPath()
            metadataFile.writeText(metadata.toString())
            Log.d(TAG, "Метаданные сохранены: ${metadataFile.absolutePath}")
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка сохранения метаданных", e)
        }
    }

    @ReactMethod
    fun checkForUpdate(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Проверка обновлений...")
                
                val currentMetadata = loadMetadata()
                val currentVersion = currentMetadata?.getString("version") ?: "0"
                val platform = "android"
                
                val url = URL("$SERVER_URL/api/check-update?currentVersion=$currentVersion&platform=$platform")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "GET"
                    connectTimeout = CONNECT_TIMEOUT
                    readTimeout = READ_TIMEOUT
                }
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val jsonResponse = JSONObject(response)
                    
                    val result = Arguments.createMap().apply {
                        putBoolean("hasUpdate", jsonResponse.getBoolean("hasUpdate"))
                        if (jsonResponse.has("version")) putString("version", jsonResponse.getString("version"))
                        if (jsonResponse.has("downloadUrl")) putString("downloadUrl", jsonResponse.getString("downloadUrl"))
                        if (jsonResponse.has("size")) putInt("size", jsonResponse.getInt("size"))
                        if (jsonResponse.has("createdAt")) putString("createdAt", jsonResponse.getString("createdAt"))
                        if (jsonResponse.has("description")) putString("description", jsonResponse.getString("description"))
                        if (jsonResponse.has("message")) putString("message", jsonResponse.getString("message"))
                    }
                    
                    Log.d(TAG, "Проверка обновлений завершена: $result")
                    promise.resolve(result)
                } else {
                    promise.reject("HTTP_ERROR", "HTTP $responseCode: ${connection.responseMessage}")
                }
                
                connection.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Ошибка при проверке обновлений", e)
                promise.reject("NETWORK_ERROR", "Ошибка сети: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun downloadUpdate(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Начинаем загрузку обновления...")
                
                // Сначала проверяем наличие обновлений
                val currentMetadata = loadMetadata()
                val currentVersion = currentMetadata?.getString("version") ?: "0"
                val platform = "android"
                
                val url = URL("$SERVER_URL/api/check-update?currentVersion=$currentVersion&platform=$platform")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "GET"
                    connectTimeout = CONNECT_TIMEOUT
                    readTimeout = READ_TIMEOUT
                }
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val jsonResponse = JSONObject(response)
                    
                    val hasUpdate = jsonResponse.getBoolean("hasUpdate")
                    if (!hasUpdate) {
                        val result = Arguments.createMap().apply {
                            putBoolean("success", false)
                            putString("message", "Нет доступных обновлений")
                        }
                        promise.resolve(result)
                        connection.disconnect()
                        return@launch
                    }
                    
                    val downloadUrl = jsonResponse.getString("downloadUrl")
                    if (downloadUrl == null) {
                        promise.reject("INVALID_URL", "URL для скачивания не найден")
                        connection.disconnect()
                        return@launch
                    }
                    
                    // Скачиваем обновление
                    performDownload("$SERVER_URL$downloadUrl", jsonResponse, promise)
                } else {
                    promise.reject("HTTP_ERROR", "HTTP $responseCode: ${connection.responseMessage}")
                }
                
                connection.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Ошибка при загрузке обновления", e)
                promise.reject("DOWNLOAD_ERROR", "Ошибка загрузки: ${e.message}", e)
            }
        }
    }

    private suspend fun performDownload(downloadUrl: String, updateInfo: JSONObject, promise: Promise) {
        withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Скачивание bundle с: $downloadUrl")
                
                val url = URL(downloadUrl)
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "GET"
                    connectTimeout = CONNECT_TIMEOUT
                    readTimeout = READ_TIMEOUT
                }
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    createCodePushDirectory()
                    
                    val bundleFile = getBundlePath()
                    
                    // Удаляем старый bundle если есть
                    if (bundleFile.exists()) {
                        bundleFile.delete()
                    }
                    
                    // Скачиваем новый bundle
                    connection.inputStream.use { inputStream ->
                        bundleFile.outputStream().use { outputStream ->
                            inputStream.copyTo(outputStream)
                        }
                    }
                    
                    // Сохраняем метаданные
                    val metadata = JSONObject().apply {
                        put("version", updateInfo.getString("version"))
                        put("downloadUrl", updateInfo.getString("downloadUrl"))
                        put("size", updateInfo.getInt("size"))
                        put("createdAt", updateInfo.getString("createdAt"))
                        put("description", updateInfo.getString("description"))
                    }
                    saveMetadata(metadata)
                    
                    val result = Arguments.createMap().apply {
                        putBoolean("success", true)
                        putString("message", "Обновление успешно загружено")
                        putString("version", updateInfo.getString("version"))
                    }
                    
                    Log.d(TAG, "Bundle успешно скачан: ${bundleFile.absolutePath}")
                    promise.resolve(result)
                } else {
                    promise.reject("HTTP_ERROR", "HTTP $responseCode: ${connection.responseMessage}")
                }
                
                connection.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Ошибка при скачивании bundle", e)
                promise.reject("SAVE_ERROR", "Ошибка сохранения файла: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun getCurrentVersion(promise: Promise) {
        try {
            val metadata = loadMetadata()
            val bundleFile = getBundlePath()
            
            val result = Arguments.createMap().apply {
                putString("version", metadata?.getString("version") ?: "0")
                putBoolean("hasUpdate", bundleFile.exists())
            }
            
            Log.d(TAG, "Текущая версия: $result")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении версии", e)
            promise.reject("VERSION_ERROR", "Ошибка получения версии: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getBundlePath(promise: Promise) {
        try {
            val bundleFile = getBundlePath()
            val result = if (bundleFile.exists()) {
                bundleFile.absolutePath
            } else {
                null
            }
            
            Log.d(TAG, "Путь к bundle: $result")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при получении пути к bundle", e)
            promise.reject("PATH_ERROR", "Ошибка получения пути: ${e.message}", e)
        }
    }

    @ReactMethod
    fun clearUpdates(promise: Promise) {
        try {
            val bundleFile = getBundlePath()
            val metadataFile = getMetadataPath()
            
            var deletedFiles = 0
            
            if (bundleFile.exists()) {
                bundleFile.delete()
                deletedFiles++
            }
            
            if (metadataFile.exists()) {
                metadataFile.delete()
                deletedFiles++
            }
            
            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Обновления очищены (удалено файлов: $deletedFiles)")
            }
            
            Log.d(TAG, "Обновления очищены: $deletedFiles файлов")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Ошибка при очистке обновлений", e)
            promise.reject("CLEAR_ERROR", "Ошибка очистки: ${e.message}", e)
        }
    }

}

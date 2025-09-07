import Foundation
import React

@objc(CodePushManager)
class CodePushManager: NSObject {
  
  // MARK: - Constants
  private let serverURL = "http://192.168.0.160:3000"
  private let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
  private let codePushPath: URL
  
  // MARK: - Initialization
  override init() {
    codePushPath = documentsPath.appendingPathComponent("CodePush")
    super.init()
    createCodePushDirectory()
  }
  
  // MARK: - Private Methods
  private func createCodePushDirectory() {
    do {
      try FileManager.default.createDirectory(at: codePushPath, withIntermediateDirectories: true, attributes: nil)
    } catch {
      print("CodePush: Ошибка создания папки: \(error)")
    }
  }
  
  private func getBundlePath() -> URL {
    return codePushPath.appendingPathComponent("main.jsbundle")
  }
  
  private func getMetadataPath() -> URL {
    return codePushPath.appendingPathComponent("metadata.json")
  }
  
  private func loadMetadata() -> [String: Any]? {
    let metadataPath = getMetadataPath()
    guard FileManager.default.fileExists(atPath: metadataPath.path) else {
      return nil
    }
    
    do {
      let data = try Data(contentsOf: metadataPath)
      return try JSONSerialization.jsonObject(with: data) as? [String: Any]
    } catch {
      print("CodePush: Ошибка загрузки метаданных: \(error)")
      return nil
    }
  }
  
  private func saveMetadata(_ metadata: [String: Any]) {
    let metadataPath = getMetadataPath()
    
    do {
      let data = try JSONSerialization.data(withJSONObject: metadata)
      try data.write(to: metadataPath)
    } catch {
      print("CodePush: Ошибка сохранения метаданных: \(error)")
    }
  }
  
  // MARK: - Public Methods
  
  @objc
  func checkForUpdate(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    print("🔍 CodePush Swift: Начинаем проверку обновлений...")
    
    // Всегда пытаемся проверить обновления на сервере, даже если нет метаданных
    let currentVersion = "0" // По умолчанию версия 0
    let platform = "ios"
    
    let urlString = "\(serverURL)/api/check-update?currentVersion=\(currentVersion)&platform=\(platform)"
    print("🔍 CodePush Swift: URL запроса:", urlString)
    
    guard let url = URL(string: urlString) else {
      print("🔍 CodePush Swift: Ошибка создания URL")
      reject("INVALID_URL", "Неверный URL сервера", nil)
      return
    }
    
    print("🔍 CodePush Swift: Отправляем запрос на сервер...")
    let task = URLSession.shared.dataTask(with: url) { data, response, error in
      if let error = error {
        print("🔍 CodePush Swift: Ошибка сети:", error.localizedDescription)
        reject("NETWORK_ERROR", "Ошибка сети: \(error.localizedDescription)", error)
        return
      }
      
      guard let data = data else {
        print("🔍 CodePush Swift: Нет данных от сервера")
        reject("NO_DATA", "Нет данных от сервера", nil)
        return
      }
      
      print("🔍 CodePush Swift: Получены данные от сервера, размер:", data.count)
      
      do {
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        print("🔍 CodePush Swift: Парсинг JSON успешен:", json)
        resolve(json)
      } catch {
        print("🔍 CodePush Swift: Ошибка парсинга JSON:", error.localizedDescription)
        reject("JSON_ERROR", "Ошибка парсинга JSON: \(error.localizedDescription)", error)
      }
    }
    
    task.resume()
  }
  
  @objc
  func downloadUpdate(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Сначала проверяем наличие обновлений
    checkForUpdate { [weak self] result in
      guard let self = self else { return }
      
      if let resultDict = result as? [String: Any],
         let hasUpdate = resultDict["hasUpdate"] as? Bool,
         hasUpdate,
         let downloadUrl = resultDict["downloadUrl"] as? String {
        
        self.performDownload(downloadUrl: downloadUrl, metadata: resultDict, resolve: resolve, reject: reject)
      } else {
        resolve([
          "success": false,
          "message": "Нет доступных обновлений"
        ])
      }
    } reject: { error, message, errorObj in
      reject(error, message, errorObj)
    }
  }
  
  private func performDownload(downloadUrl: String, metadata: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let url = URL(string: "\(serverURL)\(downloadUrl)") else {
      reject("INVALID_URL", "Неверный URL для скачивания", nil)
      return
    }
    
    let task = URLSession.shared.downloadTask(with: url) { [weak self] localURL, response, error in
      guard let self = self else { return }
      
      if let error = error {
        reject("DOWNLOAD_ERROR", "Ошибка скачивания: \(error.localizedDescription)", error)
        return
      }
      
      guard let localURL = localURL else {
        reject("NO_LOCAL_URL", "Нет локального URL файла", nil)
        return
      }
      
      do {
        let bundlePath = self.getBundlePath()
        
        // Удаляем старый bundle если есть
        if FileManager.default.fileExists(atPath: bundlePath.path) {
          try FileManager.default.removeItem(at: bundlePath)
        }
        
        // Перемещаем новый bundle
        try FileManager.default.moveItem(at: localURL, to: bundlePath)
        
        // Сохраняем метаданные
        self.saveMetadata(metadata)
        
        resolve([
          "success": true,
          "message": "Обновление успешно загружено",
          "version": metadata["version"] as? String ?? "unknown"
        ])
        
      } catch {
        reject("SAVE_ERROR", "Ошибка сохранения файла: \(error.localizedDescription)", error)
      }
    }
    
    task.resume()
  }
  
  @objc
  func getCurrentVersion(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if let metadata = loadMetadata() {
      resolve([
        "version": metadata["version"] as? String ?? "unknown",
        "hasUpdate": FileManager.default.fileExists(atPath: getBundlePath().path)
      ])
    } else {
      resolve([
        "version": "0",
        "hasUpdate": false
      ])
    }
  }
  
  @objc
  func getBundlePath(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let bundlePath = getBundlePath()
    
    if FileManager.default.fileExists(atPath: bundlePath.path) {
      resolve(bundlePath.path)
    } else {
      resolve(nil)
    }
  }
  
  @objc
  func clearUpdates(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let bundlePath = getBundlePath()
      let metadataPath = getMetadataPath()
      
      if FileManager.default.fileExists(atPath: bundlePath.path) {
        try FileManager.default.removeItem(at: bundlePath)
      }
      
      if FileManager.default.fileExists(atPath: metadataPath.path) {
        try FileManager.default.removeItem(at: metadataPath)
      }
      
      resolve([
        "success": true,
        "message": "Обновления очищены"
      ])
    } catch {
      reject("CLEAR_ERROR", "Ошибка очистки: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - React Native Bridge Methods
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func constantsToExport() -> [String: Any] {
    return [
      "serverURL": serverURL,
      "codePushPath": codePushPath.path
    ]
  }
}

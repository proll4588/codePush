import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    self.reactNativeDelegate = delegate
    self.reactNativeFactory = factory
    self.window = UIWindow(frame: UIScreen.main.bounds)

    // Показываем Launch Screen
    let launchScreenVC = UIStoryboard(name: "LaunchScreen", bundle: nil).instantiateInitialViewController()
    self.window?.rootViewController = launchScreenVC
    self.window?.makeKeyAndVisible()

    // Запускаем проверку обновления в фоновом потоке
    DispatchQueue.global(qos: .userInitiated).async {
      self.performBlockingUpdateCheck {
        // После завершения проверки, запускаем React Native в основном потоке
        DispatchQueue.main.async {
          print("CodePush: Проверка завершена, запускаем React Native...")
          factory.startReactNative(
            withModuleName: "codePush",
            in: self.window,
            launchOptions: launchOptions
          )
        }
      }
    }

    return true
  }

  func performBlockingUpdateCheck(completion: @escaping () -> Void) {
    print("CodePush: Запуск блокирующей проверки обновлений...")
    
    // 1. Получаем версию приложения
    guard let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String else {
      print("CodePush: Не удалось получить версию приложения для проверки.")
      completion()
      return
    }
    
    // 2. Формируем URL для проверки
    let platform = "ios"
    var isTestBuild = "false"
    #if TEST_BUILD
      isTestBuild = "true"
    #endif
    #if DEBUG
      isTestBuild = "true"
    #endif
    let serverURL = "http://192.168.0.160:3000" // TODO: Вынести в константы
    let urlString = "\(serverURL)/api/check-update?appVersion=\(appVersion)&platform=\(platform)&isTestBuild=\(isTestBuild)"
    
    guard let checkURL = URL(string: urlString) else {
      print("CodePush: Неверный URL для проверки: \(urlString)")
      completion()
      return
    }
    
    let group = DispatchGroup()
    group.enter()
    
    // 3. Выполняем запрос на проверку обновления
    let checkTask = URLSession.shared.dataTask(with: checkURL) { data, response, error in
      defer { group.leave() } // Покидаем группу в любом случае
      
      if let error = error {
        print("CodePush: Ошибка сети при проверке: \(error.localizedDescription)")
        return
      }
      
      guard let data = data,
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let hasUpdate = json["hasUpdate"] as? Bool,
            hasUpdate,
            let downloadUrlString = json["downloadUrl"] as? String,
            let downloadURL = URL(string: "\(serverURL)\(downloadUrlString)") else {
        print("CodePush: Нет доступных обновлений или ошибка данных.")
        return
      }
      
      print("CodePush: Найдено обновление. Начинаем загрузку с \(downloadURL)...")
      group.enter()
      
      // 4. Если есть обновление, выполняем загрузку
      let downloadTask = URLSession.shared.downloadTask(with: downloadURL) { localURL, _, downloadError in
        defer { group.leave() } // Покидаем вторую группу
        
        if let downloadError = downloadError {
          print("CodePush: Ошибка при загрузке бандла: \(downloadError.localizedDescription)")
          return
        }
        
        guard let localURL = localURL else {
          print("CodePush: Локальный URL не найден после загрузки.")
          return
        }
        
        // 5. Перемещаем загруженный бандл в нужное место
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let codePushPath = documentsPath.appendingPathComponent("CodePush")
        let destinationURL = codePushPath.appendingPathComponent("main.jsbundle")
        
        do {
          try FileManager.default.createDirectory(at: codePushPath, withIntermediateDirectories: true, attributes: nil)
          // Удаляем старый файл, если он есть
          if FileManager.default.fileExists(atPath: destinationURL.path) {
            try FileManager.default.removeItem(at: destinationURL)
          }
          try FileManager.default.moveItem(at: localURL, to: destinationURL)
          print("CodePush: Бандл успешно сохранен в: \(destinationURL.path)")

          // 6. Сохраняем метаданные
          self.saveMetadata(json)

        } catch {
          print("CodePush: Ошибка при сохранении бандла: \(error.localizedDescription)")
        }
      }
      downloadTask.resume()
    }
    checkTask.resume()
    
    // Ждем завершения всех сетевых операций
    group.wait()
    print("CodePush: Блокирующая проверка завершена.")
    completion()
  }

  private func saveMetadata(_ metadata: [String: Any]) {
    let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let codePushPath = documentsPath.appendingPathComponent("CodePush")
    let metadataPath = codePushPath.appendingPathComponent("metadata.json")
    
    do {
      let data = try JSONSerialization.data(withJSONObject: metadata, options: .prettyPrinted)
      try data.write(to: metadataPath)
      print("CodePush: Метаданные сохранены в: \(metadataPath.path)")
    } catch {
      print("CodePush: Ошибка сохранения метаданных: \(error)")
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    // Проверяем наличие Code Push обновления
    if let codePushBundleURL = getCodePushBundleURL() {
      print("CodePush: Загружаем bundle из Code Push: \(codePushBundleURL.path)")
      return codePushBundleURL
    }
    
    // Fallback на встроенный bundle
    print("CodePush: Загружаем встроенный bundle")
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  
  private func getCodePushBundleURL() -> URL? {
    let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let codePushPath = documentsPath.appendingPathComponent("CodePush")
    let bundlePath = codePushPath.appendingPathComponent("main.jsbundle")
    
    if FileManager.default.fileExists(atPath: bundlePath.path) {
      return bundlePath
    }
    
    return nil
  }
}

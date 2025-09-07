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

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "codePush",
      in: window,
      launchOptions: launchOptions
    )

    return true
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

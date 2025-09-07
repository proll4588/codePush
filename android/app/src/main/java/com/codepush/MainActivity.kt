package com.codepush

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "codePush"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        CodePushReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Проверяем наличие Code Push обновления
        val codePushInfo = CodePushBundleManager.getCodePushInfo(this)
        Log.d(TAG, "Code Push информация: $codePushInfo")
        
        if (codePushInfo["hasUpdate"] == true) {
            Log.i(TAG, "Найдено Code Push обновление, будет использован обновленный bundle")
        } else {
            Log.i(TAG, "Code Push обновления не найдены, используется встроенный bundle")
        }
    }
}

/**
 * Кастомный ReactActivityDelegate для поддержки Code Push
 */
class CodePushReactActivityDelegate(
    activity: ReactActivity,
    mainComponentName: String,
    private val fabricEnabled: Boolean
) : DefaultReactActivityDelegate(activity, mainComponentName, fabricEnabled) {

    companion object {
        private const val TAG = "CodePushReactActivityDelegate"
    }

    override fun createRootView(): com.facebook.react.ReactRootView {
        val rootView = super.createRootView()
        
        // Логируем информацию о bundle
        val bundlePath = CodePushBundleManager.getBundlePath(activity)
        Log.d(TAG, "Используемый bundle: $bundlePath")
        
        return rootView
    }
}

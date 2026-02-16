plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "dev.rholden.dot"
    compileSdk = 35

    defaultConfig {
        applicationId = "dev.rholden.dot"
        minSdk = 26
        targetSdk = 35
        versionCode = (findProperty("app.versionCode") as String?)?.toIntOrNull() ?: 1
        versionName = (findProperty("app.versionName") as String?) ?: "1.0"

        manifestPlaceholders["appAuthRedirectScheme"] = "dev.rholden.dot"
    }

    signingConfigs {
        val keystorePath = findProperty("release.keystorePath") as String?
        if (keystorePath != null) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = findProperty("release.storePassword") as String?
                keyAlias = findProperty("release.keyAlias") as String?
                keyPassword = findProperty("release.keyPassword") as String?
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (signingConfigs.names.contains("release")) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.activity.compose)
    implementation(libs.navigation.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.datastore.preferences)

    implementation(libs.appauth)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
}

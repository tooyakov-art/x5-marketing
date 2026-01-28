# Proguard rules for Flutter

# Flutter wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Google Play Core (required for Flutter deferred components)
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# WebView
-keep class android.webkit.** { *; }
-keep class com.pichillilorenzo.flutter_inappwebview.** { *; }
-dontwarn com.pichillilorenzo.flutter_inappwebview.**

# In-App Purchase
-keep class com.android.vending.billing.** { *; }

# Google Sign In
-keep class com.google.android.gms.auth.** { *; }

# Crypto
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

# Keep annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature

# JavaScript Interfaces for WebView Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# OkHttp/Retrofit (if used by dependencies)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# General
-dontwarn javax.**
-dontwarn java.awt.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep R8 from removing any classes used via reflection
-keep,allowobfuscation,allowshrinking class * extends android.app.Activity

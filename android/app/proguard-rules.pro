# Keep retrofit-kotlinx-serialization models used reflectively
-keepattributes Signature, InnerClasses, *Annotation*
-keepclassmembers,allowobfuscation class com.proximity.dating.network.** { *; }
-keep class kotlinx.serialization.** { *; }
-keep class com.proximity.dating.push.** { *; }

# OkHttp / Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
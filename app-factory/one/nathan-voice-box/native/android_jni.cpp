// Android JNI adapter. Build this file only with Android NDK and edge_dsp.cpp.
// No dynamic allocations or network calls during processNative().
#include <jni.h>
#include <cstddef>
#include "NathanVoiceBox.h"

extern "C" JNIEXPORT jlong JNICALL
Java_org_nathanai_voicebox_EdgeDSP_createNative(JNIEnv*, jobject, jint rate, jint effect) {
  return reinterpret_cast<jlong>(nathan_edge_create(rate, effect));
}
extern "C" JNIEXPORT jboolean JNICALL
Java_org_nathanai_voicebox_EdgeDSP_processNative(
    JNIEnv* env, jobject, jlong handle, jobject buffer, jint count) {
  if (!handle || !buffer || count < 0) return JNI_FALSE;
  const jlong bytes = env->GetDirectBufferCapacity(buffer);
  if (bytes < 0 || static_cast<jlong>(count) * sizeof(float) > bytes)
    return JNI_FALSE;
  void* ptr = env->GetDirectBufferAddress(buffer);
  if (!ptr) return JNI_FALSE;
  nathan_edge_process(reinterpret_cast<void*>(handle),
                      static_cast<float*>(ptr), static_cast<size_t>(count));
  return JNI_TRUE;
}
extern "C" JNIEXPORT void JNICALL
Java_org_nathanai_voicebox_EdgeDSP_destroyNative(JNIEnv*, jobject, jlong handle) {
  nathan_edge_destroy(reinterpret_cast<void*>(handle));
}

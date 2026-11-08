#include "TrafficEngine.hpp"

#include <jni.h>

// Vrući pozivi (findPath, addLoads) ne stvaraju Java objekte i ne kopiraju nizove.
// Čitaju i pišu u DirectByteBuffer koji je Kotlin alocirao jednom.

static TrafficEngine* engineOf(jlong handle) {
  return reinterpret_cast<TrafficEngine*>(static_cast<intptr_t>(handle));
}

static void* direct(JNIEnv* env, jobject buf, jint count, int elem) {
  if (!buf || count < 0) return nullptr;
  void* addr = env->GetDirectBufferAddress(buf);
  if (!addr) return nullptr;
  const jlong bytes = env->GetDirectBufferCapacity(buf);
  if (bytes < static_cast<jlong>(count) * elem) return nullptr;
  return addr;
}

extern "C" JNIEXPORT jlong JNICALL
Java_com_example_game_TrafficManager_initNetwork(
    JNIEnv* env, jobject /*thiz*/, jfloatArray nodeXY, jintArray edgeFrom,
    jintArray edgeTo, jfloatArray edgeLen, jboolean undirected) {
  if (!nodeXY || !edgeFrom || !edgeTo) return 0;
  const jsize xyN = env->GetArrayLength(nodeXY);
  const jsize edgeN = env->GetArrayLength(edgeFrom);
  if ((xyN & 1) != 0 || edgeN != env->GetArrayLength(edgeTo)) return 0;
  if (edgeLen && env->GetArrayLength(edgeLen) != edgeN) return 0;

  jfloat* xy = env->GetFloatArrayElements(nodeXY, nullptr);
  jint* from = env->GetIntArrayElements(edgeFrom, nullptr);
  jint* to = env->GetIntArrayElements(edgeTo, nullptr);
  jfloat* len = edgeLen ? env->GetFloatArrayElements(edgeLen, nullptr) : nullptr;
  if (!xy || !from || !to || (edgeLen && !len)) {
    if (xy) env->ReleaseFloatArrayElements(nodeXY, xy, JNI_ABORT);
    if (from) env->ReleaseIntArrayElements(edgeFrom, from, JNI_ABORT);
    if (to) env->ReleaseIntArrayElements(edgeTo, to, JNI_ABORT);
    if (len) env->ReleaseFloatArrayElements(edgeLen, len, JNI_ABORT);
    return 0;
  }

  auto* engine = new TrafficEngine();
  const bool ok = engine->load(xy, xyN / 2, from, to, len, edgeN, undirected == JNI_TRUE);
  env->ReleaseFloatArrayElements(nodeXY, xy, JNI_ABORT);
  env->ReleaseIntArrayElements(edgeFrom, from, JNI_ABORT);
  env->ReleaseIntArrayElements(edgeTo, to, JNI_ABORT);
  if (len) env->ReleaseFloatArrayElements(edgeLen, len, JNI_ABORT);
  if (!ok) {
    delete engine;
    return 0;
  }
  return static_cast<jlong>(reinterpret_cast<intptr_t>(engine));
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_game_TrafficManager_clearLoad(JNIEnv* /*env*/, jobject /*thiz*/, jlong handle) {
  if (TrafficEngine* engine = engineOf(handle)) engine->clearLoad();
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_game_TrafficManager_addLoads(
    JNIEnv* env, jobject /*thiz*/, jlong handle, jobject edges, jobject amounts, jint count) {
  TrafficEngine* engine = engineOf(handle);
  if (!engine || count <= 0) return;
  auto* ids = static_cast<int*>(direct(env, edges, count, 4));
  auto* amt = static_cast<float*>(direct(env, amounts, count, 4));
  if (!ids || !amt) return;
  engine->addLoads(ids, amt, count);
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_game_TrafficManager_bakeCosts(JNIEnv* /*env*/, jobject /*thiz*/, jlong handle) {
  if (TrafficEngine* engine = engineOf(handle)) engine->bakeCosts();
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_game_TrafficManager_costGeneration(JNIEnv* /*env*/, jobject /*thiz*/, jlong handle) {
  TrafficEngine* engine = engineOf(handle);
  return engine ? engine->net.costGeneration : 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_game_TrafficManager_tryAdvanceAll(
    JNIEnv* env, jobject /*thiz*/, jlong handle, jobject routes, jint stride,
    jobject pos, jobject lens, jobject states, jobject seen, jint count) {
  TrafficEngine* engine = engineOf(handle);
  if (!engine || count <= 0 || stride <= 0 || count > 200000 || stride > 4096) return 0;
  auto* nodes = static_cast<int*>(direct(env, routes, count * stride, 4));
  auto* posN = static_cast<int*>(direct(env, pos, count, 4));
  auto* lenN = static_cast<int*>(direct(env, lens, count, 4));
  auto* stateN = static_cast<int*>(direct(env, states, count, 4));
  auto* seenN = static_cast<int*>(direct(env, seen, count, 4));
  if (!nodes || !posN || !lenN || !stateN || !seenN) return 0;
  int moved = 0;
  for (int i = 0; i < count; ++i) {
    RouteCursor cursor;
    cursor.pos = posN[i];
    cursor.routeLen = lenN[i];
    cursor.state = stateN[i];
    cursor.seenGen = seenN[i];
    moved += engine->advance(nodes + static_cast<std::size_t>(i) * static_cast<std::size_t>(stride), cursor);
    posN[i] = cursor.pos;
    lenN[i] = cursor.routeLen;
    stateN[i] = cursor.state;
    seenN[i] = cursor.seenGen;
  }
  return moved;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_game_TrafficManager_findPath(
    JNIEnv* env, jobject /*thiz*/, jlong handle, jint start, jint goal, jobject out, jint cap) {
  TrafficEngine* engine = engineOf(handle);
  if (!engine) return 0;
  auto* nodes = static_cast<int*>(direct(env, out, cap, 4));
  if (!nodes) return 0;
  return engine->findPath(start, goal, nodes, cap);
}

extern "C" JNIEXPORT void JNICALL
Java_com_example_game_TrafficManager_destroy(JNIEnv* /*env*/, jobject /*thiz*/, jlong handle) {
  delete engineOf(handle);
}

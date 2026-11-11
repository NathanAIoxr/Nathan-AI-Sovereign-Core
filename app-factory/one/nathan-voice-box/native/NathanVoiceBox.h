#pragma once
#include <stddef.h>
#ifdef __cplusplus
extern "C" {
#endif
// Create/destroy away from the real-time audio callback. Mono float PCM in [-1, 1].
void* nathan_edge_create(int sample_rate, int effect);
void nathan_edge_process(void* handle, float* samples, size_t count);
void nathan_edge_destroy(void* handle);
#ifdef __cplusplus
}
#endif

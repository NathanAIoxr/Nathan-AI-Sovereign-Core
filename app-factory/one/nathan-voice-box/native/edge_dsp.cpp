// Nathan AI Voice Box / platform-neutral real-time DSP.
// Copyright: project root license. No network, no heap allocation in audio callback.
// Native host provides CoreAudio AudioUnit, Android AAudio/Oboe, or desktop audio routing.
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <new>
#include <vector>

namespace nathan {
enum class Effect : int { Clean = 0, Cave = 1, Echo = 2, Wind = 3, SpeechClean = 4 };

class EdgeDSP {
 public:
  EdgeDSP(int sample_rate, Effect effect)
      : sample_rate_(sample_rate), effect_(effect),
        ring_(static_cast<size_t>(sample_rate / ((effect == Effect::Cave) ? 6 : 9) + 1), 0.0f),
        hp_alpha_((1.0f / (6.2831853f * 75.0f)) /
                  ((1.0f / (6.2831853f * 75.0f)) + (1.0f / sample_rate))) {}

  // Samples are planar or interleaved mono. Must be called only on the audio thread.
  void process(float* samples, size_t count) noexcept {
    if (!samples || effect_ == Effect::Clean) return;
    for (size_t i = 0; i < count; ++i) {
      const float x = samples[i];
      const float delayed = ring_[head_];
      ring_[head_] = x;
      head_ = (head_ + 1) % ring_.size();
      float y = x;
      if (effect_ == Effect::Cave) {
        y = 0.84f * x + 0.18f * delayed;
      } else if (effect_ == Effect::Echo) {
        y = 0.82f * x + 0.28f * delayed;
      } else if (effect_ == Effect::SpeechClean) {
        const float high_pass = hp_alpha_ * (high_pass_ + x - prev_input_);
        prev_input_ = x;
        high_pass_ = high_pass;
        envelope_ = 0.995f * envelope_ + 0.005f * (high_pass < 0 ? -high_pass : high_pass);
        const float target = envelope_ < 0.004f ? 0.25f : 1.0f;
        gate_gain_ += 0.003f * (target - gate_gain_);
        y = high_pass * gate_gain_ * 0.94f;
      } else if (effect_ == Effect::Wind) {
        state_ = 1664525u * state_ + 1013904223u;
        const float u = static_cast<float>((state_ >> 16) & 65535u) / 65535.0f;
        // Low-level audible sound texture; NOT 19 Hz infrasound or psychological manipulation.
        y = 0.91f * x + 0.008f * (2.0f * u - 1.0f);
      }
      samples[i] = std::clamp(y, -0.96f, 0.96f);
    }
  }

 private:
  int sample_rate_;
  Effect effect_;
  std::vector<float> ring_;  // Pre-allocated at engine creation.
  size_t head_ = 0;
  uint32_t state_ = 1u;
  float prev_input_ = 0.0f;
  float high_pass_ = 0.0f;
  float envelope_ = 0.0f;
  float gate_gain_ = 1.0f;
  float hp_alpha_ = 0.0f;
};
}  // namespace nathan

// Portable C ABI for JNI / Swift / C / Rust wrappers. Call create BEFORE audio callback.
// Destroy only AFTER audio stream stops. Not designed for concurrent processing.
extern "C" {
void* nathan_edge_create(int sample_rate, int effect) noexcept {
  if (sample_rate < 8000 || sample_rate > 192000 || effect < 0 || effect > 4)
    return nullptr;
  try {
    return new nathan::EdgeDSP(sample_rate, static_cast<nathan::Effect>(effect));
  } catch (...) {
    return nullptr;
  }
}
void nathan_edge_process(void* ptr, float* samples, size_t count) noexcept {
  if (ptr) static_cast<nathan::EdgeDSP*>(ptr)->process(samples, count);
}
void nathan_edge_destroy(void* ptr) noexcept {
  delete static_cast<nathan::EdgeDSP*>(ptr);
}
}

#include <cassert>
#include <cmath>
#include <vector>
#include "edge_dsp.cpp"

int main() {
    assert(nathan_edge_create(1, 0) == nullptr);
    assert(nathan_edge_create(16000, 12) == nullptr);
    void* clean = nathan_edge_create(16000, 0);
    assert(clean);
    float a[] = {0.25f, -0.15f, 0.0f};
    nathan_edge_process(clean, a, 3);
    assert(a[0] == 0.25f && a[1] == -0.15f);
    nathan_edge_destroy(clean);
    for (int effect = 1; effect <= 3; ++effect) {
        void* dsp = nathan_edge_create(16000, effect);
        assert(dsp);
        std::vector<float> signal(32000, 0.0f);
        signal[0] = 1.0f;
        nathan_edge_process(dsp, signal.data(), signal.size());
        for (float x : signal) assert(std::isfinite(x) && x <= 0.96f && x >= -0.96f);
        nathan_edge_destroy(dsp);
    }
    return 0;
}
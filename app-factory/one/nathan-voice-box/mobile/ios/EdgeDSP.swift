import Foundation

// Add ../.. /native/NathanVoiceBox.h to the Swift target's bridging header.
// Call from an AVAudioEngine / AudioUnit render adapter; no external network path.
public final class EdgeDSP {
    private var handle: UnsafeMutableRawPointer?

    public init?(sampleRate: Int, effect: Int) {
        guard let h = nathan_edge_create(Int32(sampleRate), Int32(effect)) else { return nil }
        handle = h
    }

    public func process(_ buffer: UnsafeMutableBufferPointer<Float>) {
        guard let handle = handle, let base = buffer.baseAddress else { return }
        nathan_edge_process(handle, base, buffer.count)
    }

    deinit { if let handle = handle { nathan_edge_destroy(handle) } }
}

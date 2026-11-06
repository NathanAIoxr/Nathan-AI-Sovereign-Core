"use strict";
// Offline-only worker. Receives transferable Float32Array samples; never accesses network.
importScripts("/voice-mapper-core.js");
self.onmessage = function (event) {
  try {
    const data = event.data;
    if (!data || data.kind !== "analyze" || !(data.samples instanceof Float32Array))
      throw Error("Invalid local audio");
    const result = self.NathanVoiceMapper.analyze(data.samples, data.sampleRate);
    self.postMessage({id:data.id, ok:true, result});
  } catch (error) {
    self.postMessage({id:event.data && event.data.id, ok:false, error:String(error.message)});
  }
};

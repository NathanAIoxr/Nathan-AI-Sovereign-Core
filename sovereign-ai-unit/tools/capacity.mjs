import {readFile} from "node:fs/promises";
const [receipt,target,active,plannedGpuRate,pricePerGpuHour,artifactBytes,inputBytes,transferWindowSeconds="3600"]=process.argv.slice(2);
const [desired,available,gpuRate,gpuPrice,outBytes,inBytes,window]=[target,active,plannedGpuRate,pricePerGpuHour,artifactBytes,inputBytes,transferWindowSeconds].map(Number);
const vars=[desired,available,gpuRate,gpuPrice,outBytes,inBytes,window];
if(!receipt||vars.some(n=>!Number.isFinite(n)||n<0)||gpuRate<=0||window<=0) throw Error("Usage: capacity.mjs receipt.json target_per_hour available_devices measured_results_per_device_hour hourly_device_price output_bytes input_bytes transfer_window_seconds");
const source=JSON.parse(await readFile(receipt,"utf8"));
const devices=Math.ceil(desired/gpuRate);
console.log(JSON.stringify({baselineRun:source.runId,baselineAcceptedPerHour:source.summary.acceptedPerHour,
  plan:{targetPerHour:desired,devicesRequired:devices,availableDevices:available,devicesToAcquire:Math.max(0,devices-available),
    deviceHoursPerHour:desired/gpuRate,allocatedGpuCostPerHour:devices*gpuPrice,artifactBytesPerHour:desired*outBytes,
    incomingBytesPerHour:desired*inBytes,minimumTransferGbps:desired*inBytes*8/window/1e9},
  assumptions:{measuredResultsPerDeviceHour:gpuRate,devicePriceUsdPerHour:gpuPrice,outBytes,inBytes,window},
  evidence:"User-supplied per-device rate. Procurement, storage and egress prices require separate quotes."},null,2));

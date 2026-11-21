/** TABOR Universal Digital Hardware — deterministic, dependency-free simulation kernel.
 * Physical components are modeled, not conjured into physical capacity.
 */
export type HardwareKind = "compute" | "memory" | "fabric" | "power" | "thermal" | "storage";
export type DigitalDevice = { id:string; kind:HardwareKind; capacity:number; demand:number; health:number; latencyMs:number; metadata:Record<string,string|number|boolean> };
export type DeviceReceipt = { id:string; kind:HardwareKind; accepted:number; rejected:number; utilization:number; healthy:boolean; simulatedLatencyMs:number };
export function simulateDevice(device:DigitalDevice):DeviceReceipt {
 for(const [name,value] of Object.entries({capacity:device.capacity,demand:device.demand,health:device.health,latencyMs:device.latencyMs})){
  if(!Number.isFinite(value)||value<0)throw new RangeError("Invalid "+name);
 }
 if(device.health>1)throw new RangeError("health must be <= 1");
 const usable=device.capacity*device.health;
 const accepted=Math.min(device.demand,usable);
 return {id:device.id,kind:device.kind,accepted,rejected:Math.max(0,device.demand-accepted),utilization:usable>0?accepted/usable:0,healthy:device.health>0,simulatedLatencyMs:device.latencyMs};
}
export function simulateFabric(devices:DigitalDevice[]):{receipts:DeviceReceipt[];acceptedTotal:number;rejectedTotal:number;fullyServed:boolean}{
 const ids=new Set<string>();
 for(const d of devices){if(!d.id||ids.has(d.id))throw new Error("Device IDs must be unique and nonempty");ids.add(d.id)}
 const receipts=devices.map(simulateDevice);
 return {receipts,acceptedTotal:receipts.reduce((s,x)=>s+x.accepted,0),rejectedTotal:receipts.reduce((s,x)=>s+x.rejected,0),fullyServed:receipts.every(x=>x.rejected===0)};
}

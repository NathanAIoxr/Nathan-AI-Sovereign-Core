/** Tabor universal digital logic: pure, deterministic Boolean primitives. */
export type Bit=0|1;
export const bit=(value:number):Bit=>{if(value!==0&&value!==1)throw new RangeError("bit must be 0 or 1");return value as Bit};
export const NOT=(a:Bit):Bit=>a===1?0:1;
export const AND=(a:Bit,b:Bit):Bit=>a===1&&b===1?1:0;
export const OR=(a:Bit,b:Bit):Bit=>a===1||b===1?1:0;
export const XOR=(a:Bit,b:Bit):Bit=>a===b?0:1;
export const NAND=(a:Bit,b:Bit):Bit=>NOT(AND(a,b));
export const NOR=(a:Bit,b:Bit):Bit=>NOT(OR(a,b));
export const XNOR=(a:Bit,b:Bit):Bit=>NOT(XOR(a,b));
export const halfAdder=(a:Bit,b:Bit)=>({sum:XOR(a,b),carry:AND(a,b)});
export const fullAdder=(a:Bit,b:Bit,carryIn:Bit)=>{
 const first=halfAdder(a,b),second=halfAdder(first.sum,carryIn);
 return {sum:second.sum,carry:OR(first.carry,second.carry)};
};
export function addBinary(a:readonly Bit[],b:readonly Bit[]):{sum:Bit[];overflow:Bit}{
 if(a.length!==b.length||a.length===0)throw new RangeError("equal nonempty bit widths required");
 let carry:Bit=0;const sum:Bit[]=new Array(a.length);
 for(let i=a.length-1;i>=0;i--){const x=fullAdder(a[i],b[i],carry);sum[i]=x.sum;carry=x.carry}
 return {sum,overflow:carry};
}
export type UniversalLayer="io"|"compute"|"memory-storage"|"control-power";
export type DeploymentTopology="centralized"|"edge"|"hybrid"|"local";
export interface DigitalHardwareDescriptor{
 id:string;physicalReference:string;digitalCounterpart:string;
 layers:UniversalLayer[];topology:DeploymentTopology;
 attributes:Record<string,string|number|boolean>;
 continuation:"CONTINUE BUILDING";
}
export function validateDescriptor(x:DigitalHardwareDescriptor):boolean{
 const layers:UniversalLayer[]=["io","compute","memory-storage","control-power"];
 return x.id.trim().length>0&&x.physicalReference.trim().length>0&&x.digitalCounterpart.trim().length>0&&x.layers.length>0&&x.layers.every(v=>layers.includes(v))&&x.continuation==="CONTINUE BUILDING";
}

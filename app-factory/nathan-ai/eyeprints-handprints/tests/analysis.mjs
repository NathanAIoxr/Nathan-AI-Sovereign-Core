import assert from 'node:assert/strict';
class Canvas {
  width=0;height=0;
  getContext(){const canvas=this;return {
    drawImage(){},getImageData(_x,_y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++){data[i*4]=185;data[i*4+1]=128;data[i*4+2]=111;data[i*4+3]=255;}return {data};},
    createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}
  };}
  toDataURL(){return 'data:image/png;base64,ZGF0YQ==';}
}
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return new Canvas()}};
const {measureImage,polarIris}=await import('../analysis.js');
const img={naturalWidth:480,naturalHeight:640};
const hand=measureImage(img,'hand');
assert.equal(hand.width,480);assert.equal(hand.height,640);
assert.ok(hand.meanLuminance>130&&hand.meanLuminance<170);
assert.equal(hand.clippedPercent,0);
assert.ok(hand.skinCandidatePercent>0);
const eye=measureImage(img,'iris');
assert.equal(eye.skinCandidatePercent,null);
const pol=polarIris(img,{x:.5,y:.5},.16);
assert.equal(pol.validPercent,100);
assert.ok(pol.image.startsWith('data:image/png'));
console.log('PASS: hand/iris image metrics, quality calculations, and polar normalization using controlled synthetic fixture');

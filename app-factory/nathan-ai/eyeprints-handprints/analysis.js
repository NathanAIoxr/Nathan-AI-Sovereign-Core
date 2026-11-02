/* Image statistics are image-space observations, not diagnoses or biometric verification. */
export async function decodeImage(source) {
  return new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Image could not be decoded.'));image.src=source;
  });
}
export function imageCanvas(image,maxDim=950) {
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  const scale=Math.min(1,maxDim/Math.max(w,h));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
  c.getContext('2d',{willReadFrequently:true}).drawImage(image,0,0,c.width,c.height);
  return c;
}
export async function imageFromFile(file,maxSize=1800,quality=.89) {
  if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type))throw new Error('Use JPEG, PNG, WebP or a browser-supported HEIC photo.');
  if(file.size>18*1024*1024)throw new Error('Maximum image size is 18 MB.');
  const source=await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Could not read file.'));r.onload=()=>resolve(r.result);r.readAsDataURL(file);});
  const im=await decodeImage(source);
  if((im.naturalWidth||0)<160||(im.naturalHeight||0)<160)throw new Error('Photo needs at least 160 × 160 pixels.');
  const c=imageCanvas(im,maxSize);
  return {source:c.toDataURL('image/jpeg',quality),width:im.naturalWidth,height:im.naturalHeight};
}
export async function cameraFrame(video){
  const c=document.createElement('canvas');const w=video.videoWidth,h=video.videoHeight;
  if(!w||!h) throw new Error('Camera is not ready.');
  const f=Math.min(1,1800/Math.max(w,h));c.width=Math.round(w*f);c.height=Math.round(h*f);
  c.getContext('2d').drawImage(video,0,0,c.width,c.height);
  return {source:c.toDataURL('image/jpeg',.90),width:w,height:h};
}
function inBounds(a,b,n){return a>=0&&b>=0&&a<n&&b<n;}
export function measureImage(image,kind='hand') {
  const canvas=imageCanvas(image,384);const w=canvas.width,h=canvas.height;
  const px=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  const luminance=new Float32Array(w*h);let sum=0,ss=0,clipped=0,red=0,green=0,blue=0;
  let skinMask=new Uint8Array(w*h),skinCount=0;
  for(let i=0;i<w*h;i++) {
    const p=i*4,r=px[p],g=px[p+1],b=px[p+2],Y=.2126*r+.7152*g+.0722*b;
    luminance[i]=Y;sum+=Y;ss+=Y*Y;red+=r;green+=g;blue+=b;
    if(Y<=8||Y>=247)clipped++;
    const cb=128-.168736*r-.331264*g+.5*b,cr=128+.5*r-.418688*g-.081312*b;
    // Unvalidated color-space heuristic, used for visual previews only.
    if(kind==='hand'&&Y>35&&cb>=74&&cb<=140&&cr>=125&&cr<=177&&r>=g*.78){skinMask[i]=1;skinCount++;}
  }
  let lap=0,edge=0,count=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x,l=luminance[i-1]+luminance[i+1]+luminance[i-w]+luminance[i+w]-4*luminance[i];
    lap+=l*l;const gx=luminance[i+1]-luminance[i-1],gy=luminance[i+w]-luminance[i-w];
    if(Math.hypot(gx,gy)>40)edge++;count++;
  }
  let roi=null;
  if(kind==='hand'){
    let minX=w,minY=h,maxX=0,maxY=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(skinMask[y*w+x]){
      minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);
    }
    if(skinCount>0&&skinCount<w*h*.89){roi={x:+(minX/w).toFixed(3),y:+(minY/h).toFixed(3),w:+((maxX-minX+1)/w).toFixed(3),h:+((maxY-minY+1)/h).toFixed(3),method:'unvalidated color candidate'};}
  }
  return {width:image.naturalWidth||image.width,height:image.naturalHeight||image.height,meanLuminance:+(sum/(w*h)).toFixed(1),contrast:+Math.sqrt(Math.max(0,ss/(w*h)-(sum/(w*h))**2)).toFixed(1),clippedPercent:+(100*clipped/(w*h)).toFixed(2),sharpnessProxy:+(lap/Math.max(count,1)).toFixed(1),edgePercent:+(100*edge/Math.max(1,count)).toFixed(1),colorRGB:[red,green,blue].map(v=>Math.round(v/(w*h))),skinCandidatePercent:kind==='hand'?+(100*skinCount/(w*h)).toFixed(1):null,roi,qualityFlags:qualityFlags(sum/(w*h),clipped/(w*h),lap/Math.max(1,count))};
}
function qualityFlags(lum,clip,sharp){
 const flags=[];
 if(lum<65) flags.push('Dim image; improve diffuse lighting.');
 if(lum>208) flags.push('Bright image; lower exposure.');
 if(clip>.13) flags.push('Substantial clipped highlights/shadows.');
 if(sharp<90)flags.push('Low edge sharpness proxy; check for blur.');
 return flags.length?flags:['No major whole-image exposure warnings. Background may affect statistics.'];
}
function grayscale(r,g,b){return .2126*r+.7152*g+.0722*b;}
export function paintMode(ctx,canvas,mode='original') {
  if(mode==='original')return;
  const w=canvas.width,h=canvas.height,im=ctx.getImageData(0,0,w,h),p=im.data;
  if(mode==='contrast'||mode==='gray'||mode==='nir-candidates'){
    for(let i=0;i<p.length;i+=4){const y=grayscale(p[i],p[i+1],p[i+2]);let v=mode==='gray'?y:Math.max(0,Math.min(255,(y-127)*1.55+127));
      if(mode==='nir-candidates'){p[i]=Math.min(255,Math.max(0,(135-v)*3));p[i+1]=Math.min(255,v*.8+35);p[i+2]=Math.min(255,240-v*.36);}
      else {p[i]=p[i+1]=p[i+2]=Math.round(v);} }
  }else if(mode==='edges'){
    const gray=new Float32Array(w*h);for(let i=0;i<w*h;i++)gray[i]=grayscale(p[i*4],p[i*4+1],p[i*4+2]);
    p.fill(0);for(let i=3;i<p.length;i+=4)p[i]=255;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x,gx=gray[i+1]-gray[i-1],gy=gray[i+w]-gray[i-w],v=Math.min(255,Math.hypot(gx,gy)*2.6);
      p[i*4]=v;p[i*4+1]=v;p[i*4+2]=v;
    }
  }
  ctx.putImageData(im,0,0);
}
export function polarIris(image, center, radius) {
  if(!center||radius<=.015)return null;
  const source=imageCanvas(image,1100),ctx=source.getContext('2d',{willReadFrequently:true}),sw=source.width,sh=source.height;
  const pix=ctx.getImageData(0,0,sw,sh).data;const target=document.createElement('canvas');target.width=420;target.height=110;
  const d=target.getContext('2d');const out=d.createImageData(target.width,target.height);
  let sum=0,sq=0,valid=0;
  for(let y=0;y<target.height;y++)for(let x=0;x<target.width;x++){
    const angle=x/target.width*Math.PI*2,r=radius*(.42+.56*y/(target.height-1));
    const xx=Math.round(center.x*sw+Math.cos(angle)*r*Math.min(sw,sh)),yy=Math.round(center.y*sh+Math.sin(angle)*r*Math.min(sw,sh));
    const p=(y*target.width+x)*4;
    if(xx>=0&&yy>=0&&xx<sw&&yy<sh){let ix=(yy*sw+xx)*4;out.data[p]=pix[ix];out.data[p+1]=pix[ix+1];out.data[p+2]=pix[ix+2];let v=grayscale(pix[ix],pix[ix+1],pix[ix+2]);sum+=v;sq+=v*v;valid++;}
    out.data[p+3]=255;
  }
  d.putImageData(out,0,0);
  return {image:target.toDataURL('image/png'),validPercent:+(100*valid/(target.width*target.height)).toFixed(1),meanLuminance:valid?+(sum/valid).toFixed(1):0,textureVariation:valid?+Math.sqrt(Math.max(0,sq/valid-(sum/valid)**2)).toFixed(2):0};
}
export function paintAnnotated(canvas,image,annotations=[],mode='original',kind='hand',iris=null) {
  const f=Math.min(1,1000/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
  canvas.width=Math.round((image.naturalWidth||image.width)*f);canvas.height=Math.round((image.naturalHeight||image.height)*f);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
  paintMode(ctx,canvas,mode);
  ctx.lineWidth=Math.max(2,canvas.width/280);ctx.font=`bold ${Math.max(14,canvas.width/32)}px system-ui`;
  if(iris?.center){const x=iris.center.x*canvas.width,y=iris.center.y*canvas.height,r=iris.radius*Math.min(canvas.width,canvas.height);
    ctx.strokeStyle='#60e0dc';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*.42,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<annotations.length;i++){
    const a=annotations[i],x=a.x*canvas.width,y=a.y*canvas.height;
    ctx.fillStyle='#051f31';ctx.strokeStyle='#f2ce83';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(String(i+1),x,y+5);
  }
}

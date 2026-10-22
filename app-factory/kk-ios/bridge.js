(() => {
  'use strict';
  const seed = __KK_SEED__;
  const data = Object.assign(Object.create(null), seed);
  const send = (body) => window.webkit.messageHandlers.kkNative.postMessage(body);
  const methods = {
    getItem(key) { key = String(key); return Object.hasOwn(data, key) ? data[key] : null; },
    setItem(key, value) {
      key = String(key); value = String(value);
      if (key.length > 256 || value.length > 2000000) throw new DOMException('Save exceeds native limit', 'QuotaExceededError');
      data[key] = value; send({action:'set', key, value});
    },
    removeItem(key) { key = String(key); delete data[key]; send({action:'remove', key}); },
    clear() { for (const key of Object.keys(data)) methods.removeItem(key); },
    key(index) { return Object.keys(data)[Number(index)] ?? null; }
  };
  const storage = new Proxy(methods, {
    get(target, prop) { if (prop === 'length') return Object.keys(data).length; if (prop in target) return target[prop]; return data[prop]; },
    set(target, prop, value) { methods.setItem(prop, value); return true; },
    deleteProperty(target, prop) { methods.removeItem(prop); return true; },
    ownKeys() { return Object.keys(data); },
    getOwnPropertyDescriptor(target, prop) { if (Object.hasOwn(data,prop)) return {configurable:true,enumerable:true,writable:true,value:data[prop]}; }
  });
  Object.defineProperty(window, 'localStorage', {value:storage, configurable:false});
  window.KKNative = Object.freeze({version:1, snapshot:() => ({...data})});
  const click = HTMLAnchorElement.prototype.click;
  async function exportLink(anchor) {
    if (!anchor.href.startsWith('blob:')) return false;
    const response = await fetch(anchor.href), blob = await response.blob();
    if (blob.size > 5000000) throw Error('Export is larger than 5 MB. Use native source archive export for originals.');
    const reader = new FileReader();
    reader.onload = () => send({action:'export', name:anchor.download || 'KK-export.json', data:String(reader.result).split(',')[1]});
    reader.readAsDataURL(blob); return true;
  }
  HTMLAnchorElement.prototype.click = function() {
    if (this.href.startsWith('blob:')) { exportLink(this).catch(e => alert(e.message)); return; }
    return click.call(this);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a');
    if (a?.href.startsWith('blob:')) { e.preventDefault(); exportLink(a).catch(err => alert(err.message)); }
  }, true);
  window.addEventListener('error', event => send({action:'error', message:String(event.message).slice(0,1000)}));
  window.addEventListener('unhandledrejection', event => send({action:'error', message:String(event.reason).slice(0,1000)}));
})();

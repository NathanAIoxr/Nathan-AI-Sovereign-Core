(function(){
  'use strict';
  const install=document.getElementById('install-nathan'),offline=document.getElementById('offline-nathan'),status=document.getElementById('install-status');
  if(!install||!offline||!status)return;
  let prompt;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;install.textContent='Install Nathan AI';});
  window.addEventListener('appinstalled',()=>{prompt=null;status.textContent='Nathan AI installed. Your browser profile still holds your local data; keep backups.';});
  install.onclick=async()=>{if(!prompt){status.textContent='Use your browser’s Install app or Add to Home Screen command. Installation support varies by browser; HTTPS is required.';return;}try{await prompt.prompt();const result=await prompt.userChoice;status.textContent=result.outcome==='accepted'?'Installation requested.':'Installation dismissed.';prompt=null;}catch(e){status.textContent='Installation could not be started. Use your browser’s installation menu.';}};
  offline.onclick=async()=>{
    if(!window.isSecureContext||!('serviceWorker' in navigator)){status.textContent='Offline support requires HTTPS or localhost and a browser with service workers.';return;}
    offline.disabled=true;status.textContent='Saving the named public core screens and catalogs for offline use…';
    try{
      const registration=await navigator.serviceWorker.register(new URL('sw.js',document.currentScript?.src||location.href),{scope:'./'});
      const worker=registration.installing||registration.waiting||registration.active;
      if(!worker)throw Error('No service worker');
      if(!['installed','activated'].includes(worker.state))await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Offline preparation timed out')),60000);worker.addEventListener('statechange',()=>{if(['installed','activated'].includes(worker.state)){clearTimeout(timer);resolve();}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error('Offline installation failed'));}});});
      status.textContent=registration.waiting&&registration.active?'Core files saved. Close other Nathan AI tabs and reopen the app to activate the updated offline screens.':'Core home, public Original Works, research catalogs, Work & Assets, Assistant source mode and Appearance Studio are saved offline. Other modules and private Library files are not included.';
    }catch(e){status.textContent='Offline preparation failed. Check your connection and browser storage, then try again. Existing local records were kept.';}
    finally{offline.disabled=false;}
  };
})();

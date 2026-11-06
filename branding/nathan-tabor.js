/* Additive site-wide visitor navigation. Existing apps and identities remain unchanged. */
(function(){
'use strict';
var current=document.currentScript || document.querySelector('script[data-nathan-site-chrome]');
if(!current || !current.src || document.querySelector('[data-nathan-bar]'))return;
var base=new URL('../',current.src);
function local(path){return new URL(path,base).href;}
var links=[
 ['Home',''],['All Websites','app-factory/sites/'],['Church of Innocence','app-factory/sites/church-of-innocence/'],
 ['Apps & Games','app-factory/nathan-ai/'],['Books & Library','app-factory/one/library-mind/'],
 ['My Original Works','app-factory/nathan-ai/original-works/']
];
var bar=document.createElement('div');bar.className='nt-top';bar.setAttribute('data-nathan-bar','');bar.setAttribute('aria-label','Nathan Tabor navigation');
var brand=document.createElement('a');brand.className='nt-logo';brand.href=local('');brand.innerHTML='<span class="nt-symbol" aria-hidden="true">N</span><span>NATHAN TABOR<small>NATHAN AI · ONE</small></span>';bar.append(brand);
var nav=document.createElement('nav');nav.className='nt-nav';nav.setAttribute('aria-label','Main visitor navigation');
links.forEach(function(item,i){var a=document.createElement('a');a.href=local(item[1]);a.textContent=item[0];if(i===2)a.className='nt-highlight';if(location.pathname.replace(/index\.html$/,'').replace(/\/$/,'')===new URL(a.href).pathname.replace(/\/$/,''))a.setAttribute('aria-current','page');nav.append(a);});
var source=document.createElement('a');source.href='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core';source.textContent='GitHub Source';source.rel='noopener noreferrer';nav.append(source);bar.append(nav);
document.body.classList.add('nt-enhanced');
var notice=document.getElementById('nathan-record-notice');
if(notice)notice.insertAdjacentElement('afterend',bar);else document.body.prepend(bar);
})();
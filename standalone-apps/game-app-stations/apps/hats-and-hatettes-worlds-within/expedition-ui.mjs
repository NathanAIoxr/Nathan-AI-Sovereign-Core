import {expeditions,expeditionGroups,evidenceLabels} from './expedition-data.mjs'
import {variantCount,findExpedition,makePair,stageFor,showInscription,hasPair,restorePair,countPairs,foldText} from './expedition.mjs'
import {paint} from './landscape.mjs'
import {styles} from './headwear.mjs'

const $=id=>document.getElementById(id)
const realmsByGroup=Object.fromEntries(Object.keys(expeditionGroups).map(key=>[key,expeditions.filter(realm=>realm.group===key)]))
const pairTotal=expeditions.length*variantCount
const pageSize=18
const pairIndex=expeditions.flatMap(realm=>Array.from({length:variantCount},(_,i)=>makePair(realm,i)))

function element(tag,text) {
  const node=document.createElement(tag)
  node.textContent=text
  return node
}

function control(text,act) {
  const node=element('button',text)
  node.className='quiet'
  node.type='button'
  node.addEventListener('click',act)
  return node
}

function option(value,label) {
  const node=element('option',label)
  node.value=value
  return node
}

function sourceLink(url,label) {
  const node=element('a',label)
  node.href=url
  node.target='_blank'
  node.rel='noopener noreferrer'
  return node
}

export function setupExpeditions(getProgress,saveProgress) {
  if (!$('expeditions')) return ()=>{}
  let group='water'
  let realm=expeditions[0]
  let variant=0
  let step=-1
  let mode='pi'
  let direction='az'
  let tab='styles'
  let page=0
  let museum=null
  let museumError=false

  function redraw() {
    paint($('expedition-landscape'),realm.id,mode,group,expeditionGroups[group].color)
  }

  function updateTotals() {
    const progress=getProgress()
    $('expedition-progress').textContent=countPairs(progress).toLocaleString()+' / '+pairTotal.toLocaleString()+' pairs restored'
  }

  function renderQuest() {
    const current=step>=0&&step<3?stageFor(realm,variant,step):null
    $('expedition-quest').hidden=!current
    if (current) {
      $('expedition-stages').replaceChildren(...expeditionGroups[group].stages.map((label,index)=>{
        const item=element('li',label)
        if (index===step) item.setAttribute('aria-current','step')
        if (index<step) item.className='completed'
        return item
      }))
      $('expedition-clue').textContent=(current.mode==='pi'?'Follow the circle. ':'Follow the spiral. ')+(current.order==='az'?'Read forward.':'Read backward.')
      $('expedition-inscription').textContent=showInscription(current.word,direction)
      for(const [name,value] of [['pi',mode],['phi',mode],['az',direction],['za',direction]]) $('expedition-'+name).setAttribute('aria-pressed',String(name===value))
    }
    updateTotals()
    redraw()
  }

  function syncPlace() {
    const current=expeditionGroups[group]
    $('expeditions').style.setProperty('--expedition-accent',current.color)
    $('expedition-coordinate').textContent=current.coordinate.toUpperCase()+' · '+current.label.toUpperCase()
    $('expedition-name').textContent=realm.name
    $('expedition-lore').textContent=realm.lore
    $('expedition-evidence').textContent=evidenceLabels[realm.evidence]+' · '+realm.place
    $('expedition-context').textContent=realm.context+' The playable headwear pair is a Worlds Within design.'
    $('expedition-source').hidden=!realm.source
    if (realm.source) $('expedition-source').href=realm.source
    for(const button of $('expedition-groups').children) button.setAttribute('aria-pressed',String(button.dataset.group===group))
    $('expedition-place').replaceChildren(...realmsByGroup[group].map(item=>option(item.id,item.name)))
    $('expedition-place').value=realm.id
    const pairs=Array.from({length:variantCount},(_,index)=>{
      const pair=makePair(realm,index)
      const prefix=hasPair(getProgress(),realm.id,index)?'Restored · ':''
      return option(String(index),prefix+pair.hat+' / '+pair.hatette)
    })
    $('expedition-variant').replaceChildren(...pairs)
    $('expedition-variant').value=String(variant)
    $('expedition-result').textContent=hasPair(getProgress(),realm.id,variant)?'This pair is in your journey. You can replay its expedition.':''
    step=-1
    renderQuest()
  }

  function openPair(pair) {
    realm=findExpedition(pair.realm)
    group=realm.group
    variant=pair.variant
    syncPlace()
    $('expeditions').scrollIntoView({block:'start'})
    $('expedition-enter').focus({preventScroll:true})
  }

  function renderCatalog() {
    for (const button of $('wardrobe-tabs').children) button.setAttribute('aria-pressed',String(button.dataset.catalog===tab))
    const query=foldText($('wardrobe-search').value.trim()).split(/\s+/).filter(Boolean)
    const matches=(...values)=>{
      const text=foldText(values.join(' '))
      return query.every(word=>text.includes(word))
    }
    const data=tab==='styles'?styles.filter(row=>matches(row.family,row.name))
      :tab==='museum'?(museum??[]).filter(row=>matches(...row))
      :pairIndex.filter(row=>matches(row.hat,row.hatette,findExpedition(row.realm).name,expeditionGroups[findExpedition(row.realm).group].label))
    const pages=Math.max(1,Math.ceil(data.length/pageSize))
    page=Math.min(page,pages-1)
    $('wardrobe-count').textContent=tab==='museum'&&!museum?(museumError?'Museum catalog unavailable':'Loading museum records…'):data.length.toLocaleString()+' matches'
    $('wardrobe-page').textContent=(page+1)+' / '+pages
    $('wardrobe-prev').disabled=page===0
    $('wardrobe-next').disabled=page>=pages-1
    $('wardrobe-provenance').replaceChildren()
    if(tab==='styles'){
      $('wardrobe-provenance').append('Headwear vocabulary. See also ',sourceLink('https://www.vam.ac.uk/collections/hats','V&A Hats'),' and ',sourceLink('https://www.bgc.bard.edu/exhibitions/exhibitions/21/hats','Hats at the Bard Graduate Center'),'.')
    } else if(tab==='museum'){
      $('wardrobe-provenance').append(sourceLink('https://www.metmuseum.org/hubs/open-access','The Metropolitan Museum of Art Open Access'),' · Cataloged objects and fragments · CC0 metadata')
    } else {
      $('wardrobe-provenance').textContent='Play each pair’s expedition to add both brims to your journey.'
    }
    $('wardrobe-list').replaceChildren(...data.slice(page*pageSize,(page+1)*pageSize).map(row=>{
      const card=element('article','')
      card.className='wardrobe-card'
      if (tab==='styles') {
        card.append(element('h3',row.name),element('p',row.family))
      } else if (tab==='museum') {
        const [id,kind,title,date,culture,department]=row
        card.append(element('h3',title||kind),element('p',[title?kind:'',date,culture,department].filter(Boolean).join(' · ')),sourceLink('https://www.metmuseum.org/art/collection/search/'+id,'View Met object '+id))
      } else {
        const owner=findExpedition(row.realm)
        const restored=hasPair(getProgress(),row.realm,row.variant)
        card.append(element('h3',row.hat),element('p',row.hatette+' · '+owner.name),control(restored?'Replay expedition':'Find this pair',()=>openPair(row)))
      }
      return card
    }))
    if(!data.length && (tab!=='museum'||museum||museumError)) $('wardrobe-list').append(element('p',museumError&&tab==='museum'?'Select Museum objects to retry.':'No matches. Try a shorter search.'))
  }

  for (const [key,entry] of Object.entries(expeditionGroups)) {
    const item=control(entry.label,()=>{
      group=key
      realm=realmsByGroup[key][0]
      variant=0
      syncPlace()
    })
    item.dataset.group=key
    $('expedition-groups').append(item)
  }

  $('expedition-place').addEventListener('change',event=>{
    realm=findExpedition(event.target.value)
    variant=0
    syncPlace()
  })
  $('expedition-variant').addEventListener('change',event=>{
    variant=Number(event.target.value)
    step=-1
    $('expedition-result').textContent=hasPair(getProgress(),realm.id,variant)?'This pair is in your journey.':''
    renderQuest()
  })
  $('expedition-enter').addEventListener('click',()=>{
    step=0
    $('expedition-result').textContent=''
    renderQuest()
    $('expedition-pi').focus()
  })
  for (const name of ['pi','phi']) $('expedition-'+name).addEventListener('click',()=>{mode=name;renderQuest()})
  for (const name of ['az','za']) $('expedition-'+name).addEventListener('click',()=>{direction=name;renderQuest()})
  $('expedition-open').addEventListener('click',()=>{
    if (step<0||step>=3) return
    const current=stageFor(realm,variant,step)
    if (current.mode!==mode||current.order!==direction) {
      $('expedition-result').textContent='The passage is sealed. Match both parts of the clue.'
      return
    }
    step++
    if (step===3) {
      saveProgress(restorePair(getProgress(),realm,variant))
      const pair=makePair(realm,variant)
      syncPlace()
      $('expedition-result').textContent='Pair restored · '+pair.hat+' + '+pair.hatette
      $('expedition-enter').focus({preventScroll:true})
      renderCatalog()
    } else {
      $('expedition-result').textContent='Passage open. There is another inscription ahead.'
      renderQuest()
    }
  })

  for(const [key,label] of [['styles','Known styles'],['museum','Museum objects'],['pairs','Game pairs']]){
    const item=control(label,async()=>{
      tab=key
      page=0
      museumError=false
      renderCatalog()
      if(tab==='museum'&&!museum){
        try { museum=(await import('./met-headwear.mjs')).metRecords }
        catch { museumError=true }
        renderCatalog()
      }
    })
    item.dataset.catalog=key
    $('wardrobe-tabs').append(item)
  }
  $('wardrobe-search').addEventListener('input',()=>{page=0;renderCatalog()})
  $('wardrobe-prev').addEventListener('click',()=>{page=Math.max(0,page-1);renderCatalog()})
  $('wardrobe-next').addEventListener('click',()=>{page++;renderCatalog()})
  new ResizeObserver(redraw).observe($('expedition-landscape'))
  syncPlace()
  renderCatalog()
  return ()=>{
    updateTotals()
    if (tab==='pairs') renderCatalog()
    if (step<0) {
      const restored=hasPair(getProgress(),realm.id,variant)
      const current=$('expedition-variant').options[variant]
      const pair=makePair(realm,variant)
      current.textContent=(restored?'Restored · ':'')+pair.hat+' / '+pair.hatette
    }
  }
}

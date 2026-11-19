import {readFile} from 'node:fs/promises'
import {expeditions} from './expedition-data.mjs'
import {makePair,variantCount} from './expedition.mjs'
import {styles} from './headwear.mjs'
import {metRecords,metSnapshot} from './met-headwear.mjs'

const recipes=[
  {
    table:'expedition', key:'id',
    columns:['id','name','realm_group','evidence','place','source','context','lore'],
    rows:expeditions.map(row=>[row.id,row.name,row.group,row.evidence,row.place,row.source,row.context,row.lore]),
  },
  {
    table:'pair', key:'id', columns:['id','realm','variant','hat','hatette'],
    rows:expeditions.flatMap(realm=>Array.from({length:variantCount},(_,i)=>{
      const {id,variant,hat,hatette}=makePair(realm,i)
      return [id,realm.id,variant,hat,hatette]
    })),
  },
  {
    table:'headwear_style', key:'name', columns:['name','family'],
    rows:styles.map(({name,family})=>[name,family]),
  },
  {
    table:'museum_object', key:'object_id', columns:['object_id','kind','title','dating','culture','department'],
    rows:metRecords,
  },
]

const schema=(await readFile(new URL('catalog.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean)
const writes=recipes.flatMap(({table,key,columns,rows})=>{
  const values=columns.map((_,i)=>"json_extract(value,'$["+i+"]')")
  const updates=columns.filter(column=>column!==key).map(column=>column+'=excluded.'+column)
  const sql='INSERT INTO '+table+' ('+columns.join(',')+') SELECT '+values.join(',')+
    ' FROM json_each(?1) WHERE 1 ON CONFLICT ('+key+') DO UPDATE SET '+updates.join(',')
  const chunkSize=225
  return Array.from({length:Math.ceil(rows.length/chunkSize)},(_,index)=>({
    table,sql,params:[JSON.stringify(rows.slice(index*chunkSize,(index+1)*chunkSize))],
  }))
})
const totals=Object.fromEntries(recipes.map(({table,rows})=>[table,rows.length]))
process.stdout.write(JSON.stringify({schema,writes,totals,metSnapshot}))

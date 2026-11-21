import { pathToFileURL } from "node:url";
import { jumpStatements } from "../src/matrix.mjs";

const point = (row,col,dimension,scale,tick) => ({row,col,dimension,scale,tick,marker:"0xFF"});
const entrance = point(0,0,0,"ME_MICRO",0);

export const matrixSeeds = [
  ["kjv","king-james-bible",entrance,point(0,0,0,"ME_MICRO",1),
    "The King James Bible","Published source edition. Open the work for its U.S. reading copy and SHA-256 receipt."],
  ["flood-tablet","gilgamesh-flood-tablet",entrance,point(0,0,0,"ME_MICRO",2),
    "The Flood Tablet","Surviving clay tablet. Follow the work to British Museum K.3375 and its documented witnesses."],
  ["gutenberg","gutenberg-bible-loc",entrance,point(12,12,29,"CRO_MECRO",29),
    "Gutenberg Bible","The Library of Congress copy is cataloged as a surviving printed book."],
  ["darani","hyakumanto-darani",entrance,point(12,12,20,"CRO_MECRO",20),
    "Hyakumantō Darani","This printed scroll has its own source record and coordinate."],
  ["sibylline","sibylline-books",point(0,0,0,"ME_MICRO",2),point(0,0,0,"ME_MICRO",1),
    "Sibylline Books","Backward portal to a lost-work dossier with a classical testimony discovery source."]
].map(([id,work,origin,destination,label,note])=>({
  requestId:"archive-matrix-v1-"+id,work,origin,destination,payload:{label,note}
}));

const sourceSql = `INSERT INTO archive_sources (work_id,provider,external_id,material,holding,dating,shelfmark,snapshot)
  VALUES (?,'loc',?,?,?,?,?,?) ON CONFLICT DO NOTHING`;
const sourceBatch = [
  ["gutenberg-bible-loc","otto-vollbehr-gutenberg-bible","book","Library of Congress","circa 1455",
    "Otto Vollbehr Collection","Library of Congress Bible Collection exhibition"],
  ["hyakumanto-darani","2021667586","scroll","Library of Congress","8th century",
    "2021667586","Library of Congress item catalog"]
].map(params=>({sql:sourceSql,params}));

const eventBatch = await Promise.all(matrixSeeds.map(async entry => {
  const statements = await jumpStatements(entry);
  if (!statements) throw new Error("Invalid matrix seed: "+entry.requestId);
  return statements.insert;
}));

export const matrixSeedBatch = [...sourceBatch,...eventBatch];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(matrixSeedBatch,null,2)+"\n");
}

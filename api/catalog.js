import { put, list, head, del } from '@vercel/blob';

function authorized(req){
  const expected=process.env.ADMIN_PASSWORD || 'retro123';
  return req.headers['x-admin-password']===expected;
}
async function readCatalog(){
  const result=await list({prefix:'catalog/',limit:1000});
  const items=await Promise.all(result.blobs.filter(b=>b.pathname.endsWith('.json')).map(async b=>{
    try{const r=await fetch(b.url,{cache:'no-store'});const j=await r.json();return {...j,metadataPath:b.pathname}}catch{return null}
  }));
  return items.filter(Boolean).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
}

export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      if(req.query?.adminCheck==='1' && !authorized(req)) return res.status(401).json({error:'Senha inválida'});
      const games=await readCatalog();
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({games});
    }
    if(!authorized(req)) return res.status(401).json({error:'Senha administrativa inválida'});
    if(req.method==='POST'){
      const {id,name,system,coverPath,romPath,romName}=req.body||{};
      if(!id||!name||!system||!romPath) return res.status(400).json({error:'Dados incompletos'});
      const rom=await head(romPath);
      let cover=null;if(coverPath){try{cover=await head(coverPath)}catch{}}
      const game={id:String(id),name:String(name),system:String(system),cover:cover?.url||'',rom:rom.url,coverPath:coverPath||'',romPath,romName:romName||'',createdAt:Date.now()};
      const metadataPath=`catalog/${String(id)}.json`;
      await put(metadataPath,JSON.stringify(game),{access:'public',contentType:'application/json',allowOverwrite:true});
      return res.status(200).json({ok:true,game:{...game,metadataPath}});
    }
    if(req.method==='DELETE'){
      const {coverUrl,romUrl,metadataPath}=req.body||{};
      const targets=[coverUrl,romUrl,metadataPath].filter(Boolean);
      if(targets.length) await del(targets);
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'Método não permitido'});
  }catch(e){return res.status(500).json({error:e?.message||String(e)})}
}

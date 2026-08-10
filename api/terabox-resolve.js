function cleanUrl(u){
  return String(u||'')
    .replace(/\\u002F/g,'/')
    .replace(/\\\//g,'/')
    .replace(/&amp;/g,'&');
}

function isHttp(u){
  try{
    const x=new URL(u);
    return x.protocol==='http:' || x.protocol==='https:';
  }catch{
    return false;
  }
}

function pushCandidate(arr,u){
  u=cleanUrl(u);
  if(!isHttp(u)) return;
  if(!arr.includes(u)) arr.push(u);
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');

  const shareUrl=String(req.query?.url || '').trim();
  if(!shareUrl){
    return res.status(400).json({ok:false,error:'Informe o link público do TeraBox.'});
  }

  let parsed;
  try{ parsed=new URL(shareUrl); }
  catch{
    return res.status(400).json({ok:false,error:'Link inválido.'});
  }

  if(!/(^|\.)((1024)?terabox\.com|teraboxapp\.com)$/i.test(parsed.hostname)){
    return res.status(400).json({
      ok:false,
      error:'Este endpoint aceita somente links públicos do TeraBox.'
    });
  }

  try{
    const r=await fetch(shareUrl,{
      redirect:'follow',
      headers:{
        'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'accept':'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'accept-language':'pt-BR,pt;q=0.9,en;q=0.8'
      }
    });

    if(!r.ok){
      return res.status(502).json({
        ok:false,
        error:`O TeraBox respondeu HTTP ${r.status}.`
      });
    }

    const page=await r.text();
    const candidates=[];

    const patterns=[
      /["'](?:dlink|download_url|downloadUrl|direct_url|directUrl|url)["']\s*:\s*["'](https?:[^"']+)["']/gi,
      /(https?:\\?\/\\?\/[^"'<> ]+\.(?:iso|sfc|smc|nes|gba|gbc|gb|z64|n64|v64|nds|3ds|cci|cxi|bin|cue|chd|pbp|cso|zip|jsdos)(?:\?[^"'<> ]*)?)/gi,
      /(https?:\\?\/\\?\/[^"'<> ]+(?:download|dlink)[^"'<> ]*)/gi
    ];

    for(const p of patterns){
      let m;
      while((m=p.exec(page))!==null){
        pushCandidate(candidates,m[1]);
        if(candidates.length>=30) break;
      }
      if(candidates.length>=30) break;
    }

    const scored=candidates.map(u=>{
      let score=0;
      if(/\.(iso|sfc|smc|nes|gba|gbc|gb|z64|n64|v64|nds|3ds|cci|cxi|bin|cue|chd|pbp|cso|zip|jsdos)(\?|$)/i.test(u)) score+=6;
      if(/download|dlink/i.test(u)) score+=3;
      if(!/terabox\.com\/s\//i.test(u)) score+=1;
      return {u,score};
    }).sort((a,b)=>b.score-a.score);

    if(!scored.length){
      return res.status(422).json({
        ok:false,
        error:'O compartilhamento foi encontrado, mas o TeraBox não expôs uma URL direta utilizável nesta página.'
      });
    }

    const directUrl=scored[0].u;

    let probe={};
    try{
      const h=await fetch(directUrl,{
        method:'HEAD',
        redirect:'follow',
        headers:{'user-agent':'Mozilla/5.0'}
      });
      probe={
        status:h.status,
        contentType:h.headers.get('content-type')||'',
        contentLength:h.headers.get('content-length')||'',
        acceptRanges:h.headers.get('accept-ranges')||'',
        cors:h.headers.get('access-control-allow-origin')||''
      };
    }catch{}

    return res.status(200).json({
      ok:true,
      directUrl,
      probe
    });

  }catch(e){
    return res.status(500).json({
      ok:false,
      error:e?.message || String(e)
    });
  }
}

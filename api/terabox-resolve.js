
function safeUrl(v){
  try{
    const u=new URL(String(v||''));
    return /^https?:$/.test(u.protocol) ? u.toString() : '';
  }catch{
    return '';
  }
}

function getShareParts(raw){
  const u=new URL(raw);
  const m=u.pathname.match(/\/s\/1([^/?#]+)/i);
  if(!m) throw new Error('Link TeraBox não está no formato /s/1...');
  return { fullShort:'1'+m[1], shortNoOne:m[1] };
}

async function getJson(url){
  const r=await fetch(url,{
    redirect:'follow',
    headers:{
      'accept':'application/json, text/plain, */*',
      'user-agent':'Mozilla/5.0'
    }
  });
  const text=await r.text();
  let data;
  try{ data=JSON.parse(text); }
  catch{ throw new Error('Resposta não-JSON do TeraBox'); }
  if(!r.ok) throw new Error(data?.show_msg || data?.errmsg || `HTTP ${r.status}`);
  return data;
}

async function resolveOfficial(shareUrl, token){
  const {fullShort,shortNoOne}=getShareParts(shareUrl);
  const variants=[fullShort,shortNoOne];

  let info=null;
  for(const shorturl of variants){
    try{
      const url='https://www.terabox.com/openapi/api/shorturlinfo'
        +'?access_tokens='+encodeURIComponent(token)
        +'&shorturl='+encodeURIComponent(shorturl)
        +'&root=1&spd=';
      const data=await getJson(url);
      if(data && Number(data.errno||0)===0){ info=data; break; }
    }catch{}
  }

  let listData=null;
  for(const shorturl of variants){
    try{
      const url='https://www.terabox.com/openapi/share/list'
        +'?access_tokens='+encodeURIComponent(token)
        +'&shorturl='+encodeURIComponent(shorturl)
        +'&root=1&page=1&num=100';
      const data=await getJson(url);
      if(data && Array.isArray(data.list)){ listData=data; break; }
    }catch{}
  }

  if(!listData) throw new Error('A OpenAPI não conseguiu listar esse compartilhamento.');

  const file=listData.list.find(x=>Number(x.isdir||0)===0);
  if(!file) throw new Error('Nenhum arquivo foi encontrado nesse link.');

  const direct1=safeUrl(file.dlink || file.download_url);
  if(direct1){
    return {
      directUrl:direct1,
      filename:file.server_filename || '',
      size:file.size || 0,
      source:'terabox-openapi-list'
    };
  }

  const shareid=listData.shareid || listData.share_id || info?.shareid || info?.share_id;
  const uk=listData.uk || listData.user_id || info?.uk || info?.user_id;
  const fid=file.fid_id || file.fs_id || file.fid || file.id;

  if(!shareid || !uk || !fid){
    throw new Error('Faltaram shareid/uk/fid para gerar o link direto.');
  }

  for(const tokenName of ['access_token','access_tokens']){
    try{
      const params=new URLSearchParams();
      params.set(tokenName,token);
      params.set('shareid',String(shareid));
      params.set('fid_list',JSON.stringify([Number(fid)]));
      params.set('uk',String(uk));
      params.set('sekey','');

      const data=await getJson(
        'https://www.terabox.com/openapi/share/download?'+params.toString()
      );

      const candidates=[
        data?.dlink,
        data?.download_url,
        data?.list?.[0]?.dlink,
        data?.list?.[0]?.download_url
      ];

      for(const c of candidates){
        const direct=safeUrl(c);
        if(direct){
          return {
            directUrl:direct,
            filename:file.server_filename || '',
            size:file.size || 0,
            source:'terabox-openapi-download'
          };
        }
      }
    }catch{}
  }

  throw new Error('A OpenAPI encontrou o arquivo, mas não retornou dlink.');
}

async function htmlFallback(shareUrl){
  const r=await fetch(shareUrl,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0',
      'accept':'text/html,application/xhtml+xml,*/*'
    }
  });
  if(!r.ok) throw new Error(`TeraBox HTTP ${r.status}`);

  const html=await r.text();
  const patterns=[
    /["']dlink["']\s*:\s*["'](https?:[^"']+)["']/i,
    /["']download_url["']\s*:\s*["'](https?:[^"']+)["']/i,
    /["']downloadUrl["']\s*:\s*["'](https?:[^"']+)["']/i
  ];

  for(const p of patterns){
    const m=html.match(p);
    if(m){
      const direct=safeUrl(
        m[1].replace(/\\u002F/g,'/').replace(/\\\//g,'/')
      );
      if(direct) return {directUrl:direct,source:'html-fallback'};
    }
  }

  throw new Error('A página pública não expôs uma URL direta.');
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');

  const raw=String(req.query?.url || '').trim();
  if(!raw){
    return res.status(400).json({ok:false,error:'Informe o link do TeraBox.'});
  }

  let u;
  try{ u=new URL(raw); }
  catch{
    return res.status(400).json({ok:false,error:'Link inválido.'});
  }

  if(!/(^|\.)((1024)?terabox\.com|teraboxapp\.com)$/i.test(u.hostname)){
    return res.status(400).json({ok:false,error:'Este resolvedor aceita somente links TeraBox.'});
  }

  const token=String(process.env.TERABOX_ACCESS_TOKEN || '').trim();
  const details=[];

  if(token){
    try{
      const result=await resolveOfficial(raw,token);
      return res.status(200).json({ok:true,...result});
    }catch(e){
      details.push('OpenAPI: '+(e?.message||String(e)));
    }
  }

  try{
    const result=await htmlFallback(raw);
    return res.status(200).json({
      ok:true,
      ...result,
      warning: token
        ? 'OpenAPI falhou; fallback HTML usado.'
        : 'TERABOX_ACCESS_TOKEN não configurado; fallback HTML usado.'
    });
  }catch(e){
    details.push('Fallback: '+(e?.message||String(e)));
  }

  return res.status(422).json({
    ok:false,
    needsTeraboxToken:!token,
    error:!token
      ? 'O TeraBox não liberou link direto. Configure TERABOX_ACCESS_TOKEN na Vercel.'
      : 'O TeraBox encontrou o arquivo, mas não liberou um dlink utilizável.',
    details
  });
}

export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const hasAdmin=!!process.env.ADMIN_PASSWORD;
  const hasGithub=!!(process.env.GITHUB_TOKEN||process.env.GH_TOKEN);
  return res.status(200).json({
    ok:true,
    ADMIN_PASSWORD:hasAdmin,
    GITHUB_TOKEN:hasGithub,
    deployment:process.env.VERCEL_URL||''
  });
}

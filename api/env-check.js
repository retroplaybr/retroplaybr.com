export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    ADMIN_PASSWORD:!!process.env.ADMIN_PASSWORD,
    GITHUB_TOKEN:!!process.env.GITHUB_TOKEN,
    TERABOX_ACCESS_TOKEN:!!process.env.TERABOX_ACCESS_TOKEN
  });
}

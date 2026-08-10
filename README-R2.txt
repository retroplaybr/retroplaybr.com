RETROHUB v3.9 — CLOUDFLARE R2 EDITION

Fluxo:
RetroHub Admin -> PUBLICAR TURBO R2 -> Cloudflare R2 -> catálogo público -> PC / celular / TV

IMPORTANTE:
A ROM/ISO não passa pela Vercel.
A Vercel apenas gera URLs temporárias assinadas.
O navegador envia os arquivos direto para o R2.

Antes de usar:
1. Crie um bucket Cloudflare R2 chamado retrohub-games.
2. Crie credenciais S3/API com leitura e gravação no bucket.
3. Habilite uma URL pública para o bucket.
4. Configure o CORS usando cloudflare-r2-cors.json.
5. Na Vercel, adicione:
   ADMIN_PASSWORD
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET
   R2_PUBLIC_BASE_URL
6. Substitua todos os arquivos do projeto e faça Redeploy sem Build Cache.

O Admin deve mostrar:
Painel de jogos • v3.9 R2

O botão deve mostrar:
🚀 PUBLICAR TURBO R2

Arquivos acima de 100 MB:
- multipart
- partes de 64 MB
- até 3 partes simultâneas
- barra de progresso

Use somente arquivos que você tenha direito de armazenar/disponibilizar.

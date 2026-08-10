RetroHub v3.5 — correção do client token do Vercel Blob

CORREÇÕES:
- /api/upload usa BLOB_READ_WRITE_TOKEN explicitamente.
- O body do handleUpload é normalizado antes de gerar o client token.
- Removida a lista rígida de MIME types, evitando falhas com ISO/ROM.
- /api/blob-check confirma se o deployment realmente recebeu o token.
- Mantém upload multipart para arquivos grandes.
- Mantém barra de progresso.
- Mantém catálogo e seletor completo de sistemas.

INSTALAÇÃO:
1. Substitua TODOS os arquivos no GitHub, inclusive a pasta api.
2. Confirme que existem:
   api/upload.js
   api/blob-check.js
   api/catalog.js
3. Faça Redeploy sem marcar "Use existing Build Cache".
4. Abra o Admin e confirme "Painel de jogos • v3.5".
5. Teste novamente "Publicar para todos".

Se o preflight funcionar, o Admin começa a transferência.
Se o token ainda não estiver no deployment, a v3.5 mostra a causa ANTES de enviar a ISO.

Use somente arquivos que você tenha direito de armazenar/disponibilizar.

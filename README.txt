RetroHub v3.7 — PUBLICAR TURBO

1. Substitua TODOS os arquivos do projeto, inclusive a pasta api.
2. Confirme que api/upload.js está no GitHub.
3. Faça Redeploy sem Build Cache.
4. O Admin deve mostrar "Painel de jogos • v3.7".
5. Escolha o jogo e clique 🚀 PUBLICAR TURBO.

Antes de enviar um arquivo grande, a v3.7 testa:
- se /api/upload existe;
- se BLOB_READ_WRITE_TOKEN chegou ao deployment;
- se ADMIN_PASSWORD chegou ao deployment.

Só depois começa o upload. Acima de 100 MB usa multipart e mostra progresso.

Use somente arquivos que você tenha direito de armazenar/disponibilizar.

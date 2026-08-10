RetroHub v3.4 — upload grande / multipart

ALTERAÇÕES:
- Upload de ROM/ISO grande diretamente do navegador para o Vercel Blob.
- Arquivos acima de 100 MB usam multipart automaticamente.
- Barra de progresso mostra porcentagem e MB enviados.
- O catálogo usa exatamente a URL retornada pelo Blob, sem esperar a listagem aparecer.
- Mantém o seletor completo v3.3 com PS2, PS3, PSP, Xbox, Sega etc.
- Mantém ADMIN_PASSWORD e o catálogo público já existente.

INSTALAÇÃO:
1. Substitua TODOS os arquivos no projeto, incluindo a pasta api.
2. É essencial enviar o novo arquivo api/upload.js.
3. Faça Redeploy na Vercel SEM Build Cache.
4. Confirme no Admin: "Painel de jogos • v3.4".
5. Para ISO grande, mantenha a aba aberta até chegar a 100%.

Observação:
O Vercel Blob recomenda multipart para arquivos acima de 100 MB.
O fato de uma ISO poder ser armazenada/publicada não significa que o console correspondente
tenha emulador web compatível para rodar no navegador.
Use somente arquivos que você tenha direito de armazenar/disponibilizar.

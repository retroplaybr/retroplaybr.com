RETROHUB + VERCEL BLOB (CATALOGO ONLINE)

1. Envie TODOS os arquivos e a pasta api/ para a raiz do repositório conectado à Vercel.
2. O Blob Store retrohub-games precisa continuar conectado ao projeto retroplaybr.com.
3. Em Vercel > Project > Settings > Environment Variables, crie:
   ADMIN_PASSWORD = uma senha forte que somente você conhece
   Marque Production e Preview.
4. Faça novo Deploy/Redeploy.
5. Abra /admin.html, use a senha definida em ADMIN_PASSWORD e adicione um jogo.
6. O Admin envia capa e ROM diretamente ao Vercel Blob e grava um JSON em catalog/.
7. Abra o site no celular: o catálogo é carregado da API e será o mesmo em todos os aparelhos.

IMPORTANTE
- O Blob Store está PUBLIC: qualquer pessoa com a URL direta de um arquivo consegue acessá-lo.
- Use apenas arquivos que você tenha direito de hospedar/distribuir.
- GameCube ainda não possui core funcional neste player.
- Vercel Blob tem limites de uso conforme o plano.

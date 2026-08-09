RETROHUB — PUBLICAR PARA TODOS — v2.1 (correção "requested blob does not exist")

1. Envie TODOS os arquivos e a pasta api/ para o repositório conectado à Vercel.
2. Confirme que o Vercel Blob retrohub-games continua conectado ao projeto.
3. ADMIN_PASSWORD pode ser configurada em Vercel > Project > Environment Variables.
4. Faça um novo Production Deploy / Redeploy sem Build Cache.
5. Abra /admin.html. O topo deve mostrar "Painel de jogos • v2.1".
6. Escolha capa + ROM e clique em “🌐 Publicar para todos”.

Esta versão não usa head() para tentar acessar um Blob por pathname. Ela localiza o arquivo recém-enviado com list(), aguarda a propagação do upload e só então grava o metadado público em catalog/<id>.json.

O Blob é público. Use somente arquivos que você tenha autorização para disponibilizar publicamente.

RETROHUB — PUBLICAR PARA TODOS — v2.1 (correção "requested blob does not exist")

1. Envie TODOS os arquivos e a pasta api/ para o repositório conectado à Vercel.
2. Confirme que o Vercel Blob retrohub-games continua conectado ao projeto.
3. ADMIN_PASSWORD pode ser configurada em Vercel > Project > Environment Variables.
4. Faça um novo Production Deploy / Redeploy sem Build Cache.
5. Abra /admin.html. O topo deve mostrar "Painel de jogos • v2.1".
6. Escolha capa + ROM e clique em “🌐 Publicar para todos”.

Esta versão não usa head() para tentar acessar um Blob por pathname. Ela localiza o arquivo recém-enviado com list(), aguarda a propagação do upload e só então grava o metadado público em catalog/<id>.json.

O Blob é público. Use somente arquivos que você tenha autorização para disponibilizar publicamente.


VERSAO 2.2
- Corrige a deteccao de uploads do Vercel Blob quando o servico adiciona sufixo aleatorio ao pathname.
- Novos signed uploads pedem addRandomSuffix=false.
- O catalogo aceita tanto pathname exato quanto blobs antigos com sufixo.


V2.3: Nintendo Switch adicionado ao menu e ao painel admin. Arquivos .NSP/.XCI podem ser cadastrados/armazenados, mas o player web atual não emula Nintendo Switch.

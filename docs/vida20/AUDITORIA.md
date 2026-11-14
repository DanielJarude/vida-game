# VIDA 20 — Matriz de auditoria inicial (base `c630645`, main)

Feita antes de qualquer alteração, a partir do código, dos relatórios (`docs/VIDA19-NPCS-CONECTADA-INTEGRACAO-REPORT.md`,
`docs/vida19/AUDITORIA.md`) e de medições (galeria de cômodos, simulações). Eras Históricas: fora do escopo (nada lido para alterar).
Sistemas da VIDA 19 considerados entregues (NPCs autônomos, VIDA Conectada, pendências da VIDA 18, seis profissões): não reabertos.

Classificação: **Validado** · **Implementado, não validado** · **Parcial** · **Ausente** · **Defeito comprovado** · **Bloqueado**.

## 1. Móveis e objetos dos cômodos

| Item | Onde | Evidência | Estado |
|---|---|---|---|
| Vaso sanitário | `ui/ilustracao/fixosDaCena._vaso`, `volumes13._vaso`, `disposicao.fixosDe` | desenho 68×80 no quadro, escalado pela largura de 0,40 m → **0,36 m de altura** (catálogo real: ~0,78 m); mais largo que alto (foto `docs/vida20/fotos/banheiro-antes.png`) | **Defeito comprovado** |
| Mesas de cabeceira | `comodos.metadeDe` (o par) | cada metade levava o desenho do PAR inteiro; a caixa do desenho cobria as duas mesas → cada uma saía com **~17 cm** ao lado da cama king (foto `quarto-antes.png`) | **Defeito comprovado** |
| Altura dos demais objetos | `medidas.ts` × desenhos | auditoria numérica de todos os objetos (`a20/escala.ts`): altura desenhada/catálogo < 0,75 em ~27 objetos — geladeira 0,67 (1,24 m), geladeira inox 0,55, fliperama 0,48 (0,88 m), estante de escritório 0,54, guarda-roupa 0,68, box 0,46, pia 0,53, fogão 0,47, luminária de pé 0,47, ducha 0,41, beliche 0,56, cadeira ergonômica 0,60, churrasqueira 0,61, organizadores 0,64… | **Defeito comprovado** |
| Objetos "de cima" (celular, tablet, videogame) e mesas largas (sinuca, ping-pongue) | idem | o desenho é em perspectiva/tampo: a "altura" medida é o tampo visto de cima — sem defeito visível nas fotos | Validado (sem mudança) |

## 2. Vícios

| Item | Onde | Evidência | Estado |
|---|---|---|---|
| Sistema de dependências (uso, risco, dependência, grave, recuperação, tratamento, recaída, apoio) | `v14/crencas/dependencias14.ts` | completo desde a VIDA 14 | Implementado e validado |
| Idade mínima | `processarDependencias14` | o ano processava a partir dos **12** (sincroniza hábitos) | **Defeito** (regra pedida: 14) |
| Sucessão | `sucessao.continuarComo` | `v.dependencias14` e `v.apostas` de quem morreu **ficavam** com o herdeiro — a filha de 10 anos herdava a dependência e o cigarro voltava aos hábitos dela | **Defeito comprovado** |
| NPCs | `corpo.habitosDaPessoa` | cigarro só ≥ 16; nenhum outro vício de NPC | Validado |
| Efeitos em estudos e amizades | `processarDependencias14` | só trabalho, parceria, saúde, humor e dinheiro | **Parcial** |

## 3. Automobilismo

| Item | Estado |
|---|---|
| Carreira de piloto (kart → F1) | **Ausente** (só habilitação de piloto de avião e o perfil esportivo genérico prevendo "automobilismo") |

## 4. Clubes

| Item | Onde | Estado |
|---|---|---|
| Catálogo de clubes (onde se joga) | `dados/clubes` (BR) + perfis do mundo (`esporte.clubes`) — 469 clubes em 28 países carregados | Implementado |
| Liga partida a partida (VIDA 19) | `sistemas/ligas`, `jogosDaLiga` — força pelo porte | Implementado e validado |
| Comprar/administrar clube | — | **Ausente** |

## 5. Joias

| Item | Onde | Estado |
|---|---|---|
| Lugares de uso | `dados/estilo` (pescoço, orelhas, pulso, pulseira, anel) — um por lugar (`umPorLugar`) | Implementado |
| Catálogo | ~18 peças (corrente, brincos, pulseiras, 4 anéis, colar de pérolas/diamantes) | **Parcial** (sem ouro branco/rosé, aço, platina; sem pedras de cor; sem aliança, tornozeleira, bracelete rígido, argolas por tamanho) |
| Desenho | retrato: corrente genérica (2 cores), brincos por modelo; figura: relógio, pulseira, anel, colar | **Parcial** (o colar comprado não aparecia como o anunciado) |
| Piercings | `dados/piercings129`, `piercings13` | Implementado (não reaberto) |

## 6. Apps sociais (complemento de escopo)

| Item | Onde | Evidência | Estado |
|---|---|---|---|
| Infraestrutura (contas, publicações, alcance, viral, monetização, moderação) | `sistemas/redes`, `redesBase`, `dados/redes` | VIDA 19 e antes | Implementado e validado (não recriado) |
| Apps independentes | `v15/celular/Celular` → app "Rede" → `Feed19` (abas Feed/Em alta/Minhas contas) → `Redes.RedesSociais` (faixa de plataformas) → `Plataforma` (Perfil/Publicar/Feed/Conta) | uma tela genérica; 4 níveis de navegação (foto `redes-antes-390.png`) | **Parcial** |
| Publicar | `FluxoPublicar` | Rede → Minhas contas → plataforma → Publicar → "1. O quê" → "2. Como / Continuar" → "3. Publicar" | **Defeito de usabilidade** |
| Interface | idem | faixa de plataformas com **rolagem horizontal** dentro do aparelho (Facebook cortado), três barras de abas empilhadas, contador "Início 3" solto, botões de estilos diferentes na mesma lista (link × botão), muito espaço de cabeçalho | **Defeito comprovado** |
| Imagem enviada pelo usuário | — | não chegou a esta sessão; os problemas descritos foram reproduzidos nas capturas acima | — |

// @vitest-environment jsdom
/**
 * Gerador de folha de contato do avatar (ferramenta de inspeção visual).
 *
 * Não é um teste de regressão: é como o retrato é OLHADO. Renderiza o
 * `AvatarFace` em todas as combinações relevantes e escreve um HTML que
 * pode ser aberto no navegador ou capturado por screenshot.
 *
 * Só roda quando `VIDA_VISUAL_OUT` está definida — na suíte normal ele
 * passa sem produzir nada.
 */
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { AvatarFace } from '../components/character/AvatarFace';
import {
  APARENCIA_PADRAO,
  CORES_CABELO,
  ESTILOS_BARBA,
  ESTILOS_CABELO,
  TONS_PELE,
  derivarAparenciaDeSemente,
  type CorCabelo
} from '../data/avatar/avatarData';

const SAIDA = process.env.VIDA_VISUAL_OUT;

describe('folha de contato do avatar', () => {
  it('gera o HTML de inspeção quando pedido', () => {
    if (!SAIDA) return;

    const blocos: string[] = [];
    const linha = (titulo: string, itens: { rotulo: string; el: ReactElement }[]) =>
      `<section><h2>${titulo}</h2><div class="row">` +
      itens
        .map(i => `<figure>${renderToStaticMarkup(i.el)}<figcaption>${i.rotulo}</figcaption></figure>`)
        .join('') +
      `</div></section>`;

    blocos.push(
      linha(
        'Envelhecimento — a mesma pessoa atravessando a vida',
        [0, 2, 5, 9, 14, 20, 30, 45, 60, 75, 88].map(idade => ({
          rotulo: `${idade} anos`,
          el: <AvatarFace idade={idade} aparencia={APARENCIA_PADRAO} tamanho={150} />
        }))
      )
    );

    blocos.push(
      linha(
        'Estilos de cabelo (24 anos)',
        ESTILOS_CABELO.map(e => ({
          rotulo: e.rotulo,
          el: <AvatarFace idade={24} aparencia={{ ...APARENCIA_PADRAO, estiloCabelo: e.id }} tamanho={150} />
        }))
      )
    );

    blocos.push(
      linha(
        'Cacheado — o caso crítico: não pode parecer bolinhas coladas',
        ([[6, 'preto'], [14, 'castanho'], [24, 'preto'], [40, 'ruivo'], [70, 'preto']] as [number, CorCabelo][]).map(
          ([idade, cor]) => ({
            rotulo: `${idade} anos / ${cor}`,
            el: (
              <AvatarFace
                idade={idade}
                aparencia={{ ...APARENCIA_PADRAO, estiloCabelo: 'cacheado', corCabelo: cor }}
                tamanho={180}
              />
            )
          })
        )
      )
    );

    blocos.push(
      linha(
        'Tons de pele (30 anos, cacheado)',
        TONS_PELE.map(t => ({
          rotulo: t.rotulo,
          el: (
            <AvatarFace
              idade={30}
              aparencia={{ ...APARENCIA_PADRAO, tomPele: t.id, estiloCabelo: 'cacheado', corCabelo: 'preto' }}
              tamanho={150}
            />
          )
        }))
      )
    );

    blocos.push(
      linha(
        'Pelo facial (34 anos)',
        ESTILOS_BARBA.map(b => ({
          rotulo: b.rotulo,
          el: <AvatarFace idade={34} aparencia={{ ...APARENCIA_PADRAO, barba: b.id }} tamanho={150} />
        }))
      )
    );

    blocos.push(
      linha(
        'Cores de cabelo (26 anos, médio)',
        CORES_CABELO.map(c => ({
          rotulo: c.rotulo,
          el: <AvatarFace idade={26} aparencia={{ ...APARENCIA_PADRAO, estiloCabelo: 'medio', corCabelo: c.id }} tamanho={150} />
        }))
      )
    );

    blocos.push(
      linha(
        'Rostos derivados de id (NPCs) — variedade sem custo de save',
        ['fam_pai', 'fam_mae', 'fam_irma', 'npc_colega_1', 'npc_colega_2', 'npc_vizinha', 'npc_chefe', 'npc_amigo'].map(
          semente => ({
            rotulo: semente,
            el: <AvatarFace idade={32} aparencia={derivarAparenciaDeSemente(semente)} tamanho={120} />
          })
        )
      )
    );

    writeFileSync(
      SAIDA,
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>VIDA — avatares</title><style>
        body{background:#0a1116;color:#a8bcba;font:14px system-ui,sans-serif;margin:0;padding:24px}
        h2{font-size:12px;letter-spacing:.11em;text-transform:uppercase;color:#88a0a2;font-weight:600;margin:30px 0 10px}
        .row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}
        figure{margin:0;text-align:center}
        figure svg{background:#16242c;border-radius:12px;display:block}
        figcaption{font-size:11px;margin-top:5px;color:#7e9492}
      </style></head><body>${blocos.join('')}</body></html>`
    );
  });
});

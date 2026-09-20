import { describe, expect, it } from 'vitest';
import {
  criarAvatarPadrao,
  normalizarAvatar,
  obterFaseAvatar,
  sortearAvatar
} from '../avatarSystem';
import {
  CORES_DE_CABELO,
  CORES_DE_OLHOS,
  ESTILOS_DE_CABELO,
  TONS_DE_PELE,
  corDaOpcao,
  formaDoCabelo
} from '../../data/avatar/avatarOptions';
import { criarPersonagemTeste } from './fixtures';

describe('B4-FIX.1 · dados de aparência', () => {
  it('há opções suficientes e distintas em cada eixo', () => {
    expect(TONS_DE_PELE.length).toBeGreaterThanOrEqual(5);
    expect(ESTILOS_DE_CABELO.length).toBeGreaterThanOrEqual(5);
    expect(CORES_DE_CABELO.length).toBeGreaterThanOrEqual(5);
    expect(CORES_DE_OLHOS.length).toBeGreaterThanOrEqual(4);
  });

  it('IDs são únicos em cada eixo', () => {
    const eixos = [TONS_DE_PELE, ESTILOS_DE_CABELO, CORES_DE_CABELO, CORES_DE_OLHOS];
    for (const eixo of eixos) {
      const ids = eixo.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('cores são hexadecimais distintas dentro do eixo', () => {
    for (const eixo of [TONS_DE_PELE, CORES_DE_CABELO, CORES_DE_OLHOS]) {
      const cores = eixo.map(o => o.cor);
      for (const cor of cores) expect(cor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(new Set(cores).size).toBe(cores.length);
    }
  });

  it('cada estilo de cabelo tem uma forma de desenho', () => {
    for (const estilo of ESTILOS_DE_CABELO) {
      expect(formaDoCabelo(estilo.id)).toBe(estilo.forma);
    }
  });

  it('busca de cor tem fallback seguro para ID desconhecido', () => {
    expect(corDaOpcao(TONS_DE_PELE, 'nao_existe')).toBe(TONS_DE_PELE[0].cor);
    expect(formaDoCabelo('nao_existe')).toBe('curto');
  });
});

describe('B4-FIX.1 · criação e sorteio de avatar', () => {
  it('o avatar padrão é válido', () => {
    const a = criarAvatarPadrao();
    expect(TONS_DE_PELE.some(o => o.id === a.tomDePele)).toBe(true);
    expect(ESTILOS_DE_CABELO.some(o => o.id === a.estiloCabelo)).toBe(true);
    expect(CORES_DE_CABELO.some(o => o.id === a.corCabelo)).toBe(true);
    expect(CORES_DE_OLHOS.some(o => o.id === a.corOlhos)).toBe(true);
  });

  it('o sorteio sempre produz combinação válida', () => {
    for (let i = 0; i < 100; i++) {
      const a = sortearAvatar();
      expect(TONS_DE_PELE.some(o => o.id === a.tomDePele)).toBe(true);
      expect(ESTILOS_DE_CABELO.some(o => o.id === a.estiloCabelo)).toBe(true);
    }
  });

  it('o sorteio produz variedade, não sempre o mesmo rosto', () => {
    const combinacoes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const a = sortearAvatar();
      combinacoes.add(`${a.tomDePele}|${a.estiloCabelo}|${a.corCabelo}|${a.corOlhos}`);
    }
    expect(combinacoes.size).toBeGreaterThan(20);
  });
});

describe('B4-FIX.1 · persistência e migração do avatar', () => {
  it('save sem avatar recebe o padrão, não quebra', () => {
    expect(normalizarAvatar(undefined)).toEqual(criarAvatarPadrao());
    expect(normalizarAvatar(null)).toEqual(criarAvatarPadrao());
    expect(normalizarAvatar('lixo')).toEqual(criarAvatarPadrao());
    expect(normalizarAvatar({})).toEqual(criarAvatarPadrao());
  });

  it('um avatar válido sobrevive intacto ao ciclo de normalização', () => {
    const escolhido = {
      tomDePele: TONS_DE_PELE[4].id,
      estiloCabelo: ESTILOS_DE_CABELO[3].id,
      corCabelo: CORES_DE_CABELO[2].id,
      corOlhos: CORES_DE_OLHOS[4].id
    };
    const ciclo = normalizarAvatar(JSON.parse(JSON.stringify(escolhido)));
    expect(ciclo).toEqual(escolhido);
  });

  it('campo inválido cai no padrão sem contaminar os válidos', () => {
    const r = normalizarAvatar({
      tomDePele: TONS_DE_PELE[5].id,
      estiloCabelo: 'penteado_inexistente',
      corCabelo: CORES_DE_CABELO[3].id,
      corOlhos: 42
    });
    expect(r.tomDePele).toBe(TONS_DE_PELE[5].id);
    expect(r.corCabelo).toBe(CORES_DE_CABELO[3].id);
    expect(r.estiloCabelo).toBe(criarAvatarPadrao().estiloCabelo);
    expect(r.corOlhos).toBe(criarAvatarPadrao().corOlhos);
  });
});

describe('B4-FIX.1 · aparência não afeta gameplay', () => {
  it('nenhuma opção de aparência carrega campo de atributo', () => {
    const todas = [
      ...TONS_DE_PELE,
      ...CORES_DE_CABELO,
      ...CORES_DE_OLHOS
    ];
    for (const o of todas) {
      expect(Object.keys(o).sort()).toEqual(['cor', 'id', 'nome']);
    }
    for (const e of ESTILOS_DE_CABELO) {
      expect(Object.keys(e).sort()).toEqual(['forma', 'id', 'nome']);
    }
  });

  it('trocar o avatar não altera nenhum atributo do personagem', () => {
    const base = criarPersonagemTeste({ idade: 20 });
    const trocado = { ...base, avatar: sortearAvatar() };

    expect(trocado.stats).toEqual(base.stats);
    expect(trocado.hiddenStats).toEqual(base.hiddenStats);
    expect(trocado.classeSocial).toBe(base.classeSocial);
    expect(trocado.flags).toEqual(base.flags);
  });

  it('personagens com avatares opostos têm gameplay idêntico', () => {
    const claro = criarPersonagemTeste({
      avatar: { ...criarAvatarPadrao(), tomDePele: TONS_DE_PELE[0].id }
    });
    const escuro = criarPersonagemTeste({
      avatar: { ...criarAvatarPadrao(), tomDePele: TONS_DE_PELE[5].id }
    });

    const semAvatar = (p: typeof claro) => {
      const { avatar: _ignorado, ...resto } = p;
      return resto;
    };

    expect(semAvatar(claro)).toEqual(semAvatar(escuro));
  });
});

describe('B4-FIX.1 · fase do avatar', () => {
  it('bebê, criança e adulto têm representações distintas', () => {
    expect(obterFaseAvatar(0)).toBe('bebe');
    expect(obterFaseAvatar(2)).toBe('bebe');
    expect(obterFaseAvatar(3)).toBe('crianca');
    expect(obterFaseAvatar(11)).toBe('crianca');
    expect(obterFaseAvatar(12)).toBe('adulto');
    expect(obterFaseAvatar(70)).toBe('adulto');
  });

  it('a fase é definida para qualquer idade de uma vida', () => {
    for (let idade = 0; idade <= 100; idade++) {
      expect(['bebe', 'crianca', 'adulto']).toContain(obterFaseAvatar(idade));
    }
  });
});

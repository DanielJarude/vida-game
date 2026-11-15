# Gera src/motor/eras/base/economiaSeries.ts — renda real por época, preços relativos por categoria e a cesta básica.
import json, os, sys, math
F = os.path.expanduser('~/vida-trabalho/eras2/fontes')
OUT = sys.argv[1]
ld = lambda n: json.load(open(os.path.join(F, n)))

# ---------------------------------------------------------------- renda média real do trabalho (2025 = 1)
pnad1 = {int(r['D3N']): float(r['V']) for r in ld('sidra1172.json')[1:]}
pnad2 = {int(r['D3N']): float(r['V']) for r in ld('sidra5797.json')[1:] if r.get('D4N') == 'Total'}
pc = {}
for x in ld('PNADC12_RRTH12.json')['value']:
    pc.setdefault(int(x['VALDATA'][:4]), []).append(x['VALVALOR'])
pc = {a: sum(v) / len(v) for a, v in pc.items() if a <= 2025}
r = {a: v / pc[2025] for a, v in pc.items()}                       # 2012–2025: PNAD Contínua
k = r[2012] / pnad2[2012]
for a in range(2004, 2012):
    if a in pnad2: r[a] = pnad2[a] * k                               # 2004–2011: PNAD (15+), emendada em 2012
k = r[2004] / pnad1[2004]
for a in range(1992, 2004):
    if a in pnad1: r[a] = pnad1[a] * k                               # 1992–2003: PNAD (10+), emendada em 2004
for a in (1994, 2000, 2010):                                         # anos sem PNAD (Censo e 1994): média geométrica
    r[a] = math.sqrt(r[a - 1] * r[a + 1])
# 1980–1991: APROXIMAÇÃO — o PIB per capita real (PIB do IBGE ÷ população a 1,93% a.a., média intercensitária 1980–1991)
PIB = {1970: 10.4, 1971: 11.34, 1972: 11.94, 1973: 13.97, 1974: 8.15, 1975: 5.17, 1976: 10.26, 1977: 4.93, 1978: 4.97, 1979: 6.76, 1980: 9.2, 1981: -4.25, 1982: 0.83, 1983: -2.93, 1984: 5.4, 1985: 7.85, 1986: 7.49, 1987: 3.53, 1988: -0.06, 1989: 3.16, 1990: -4.35, 1991: 1.03, 1992: -0.54}
for a in range(1991, 1969, -1):
    pop = 1.0193 if a >= 1980 else 1.0248   # crescimento da população: 1980–1991 e 1970–1980 (Censos)
    r[a] = r[a + 1] / ((1 + PIB[a + 1] / 100) / pop)
RENDA = {a: round(r[a], 4) for a in sorted(r)}

# ---------------------------------------------------------------- preços relativos (grupo ÷ índice geral; dez/2025 = 1)
rel = ld('ipca_relativos.json')
CAT = {  # categoria do jogo → grupo/item do IPCA (só os grupos amplos e estáveis; ver o cabeçalho do arquivo gerado)
    'alimentacao': 'Alimentação e bebidas', 'comer_fora': 'Alimentação fora do domicílio', 'aluguel': 'Aluguel residencial',
    'moveis': 'Mobiliário', 'eletrodomesticos': 'Eletrodomésticos e equipamentos', 'roupas': 'Vestuário',
    'onibus': 'Ônibus urbano', 'gasolina': 'Gasolina', 'remedios': 'Produtos farmacêuticos', 'higiene': 'Higiene pessoal',
    'lazer': 'Recreação', 'educacao': 'Educação', 'plano_saude': 'Plano de saúde', 'domestica': 'Empregado doméstico',
    'passagem_aerea': 'Passagem aérea', 'automovel': 'Automóvel novo', 'motocicleta': 'Motocicleta', 'joias': 'Joias e bijuterias',
    'energia': 'Energia elétrica residencial', 'comunicacao': 'Comunicação'
}
# Na hiperinflação (1989–1994), a média anual de um índice relativo oscila com o calendário dos reajustes: até 1994 usamos o
# nível de 1995 (o primeiro ano de moeda estável), e para trás de onde a série começa, o primeiro ano disponível.
PRECO = {}
for c, g in CAT.items():
    s = {int(a): v for a, v in rel[g].items() if int(a) <= 2025}
    ini = max(min(s), 1995)
    PRECO[c] = {a: round(s[a], 3) for a in range(ini, 2026) if a in s}
    PRECO[c]['_desde'] = ini

# ---------------------------------------------------------------- cesta básica DIEESE (São Paulo), em unidades do motor
import re
moedas = open(os.path.expanduser('~/vida-trabalho/r129/src/motor/eras/base/series.ts')).read()
ipca = [float(x) for x in re.search(r'IPCA: readonly number\[\] = \[(.*?)\];', moedas, re.S).group(1).replace('\n', ' ').split(',') if x.strip()]
T0 = int(eval(re.search(r'export const IPCA_T0 = (.*?);', moedas).group(1)))
CADEIA = [(-1e9, 2750e9), (1986 * 12 + 2, 2750e6), (1989 * 12 + 1, 2750e3), (1990 * 12 + 3, 2750e3), (1993 * 12 + 7, 2750), (1994 * 12 + 6, 1)]
def por_real(t):
    p = CADEIA[0][1]
    for d, x in CADEIA:
        if t >= d: p = x
    return p
cesta = {}
for x in ld('DIEESE12_CBSP12.json')['value']:
    a, m = int(x['VALDATA'][:4]), int(x['VALDATA'][5:7]) - 1
    t = a * 12 + m
    if a < 1970 or a > 2025 or x['VALVALOR'] is None: continue
    real = x['VALVALOR'] / (ipca[t - T0] * por_real(t))
    cesta.setdefault(a, []).append(real)
CESTA = {a: round(sum(v) / len(v)) for a, v in sorted(cesta.items())}

def obj(d):
    return '{ ' + ', '.join(f'{k}: {v}' for k, v in d.items()) + ' }'
with open(OUT, 'w') as o:
    o.write('''/**
 * ERAS HISTÓRICAS · A ECONOMIA DA ÉPOCA — séries GERADAS (não editar à mão: ~/vida-trabalho/eras2/scripts/gerar_economia.py).
 * Fontes e método em docs/eras/FONTES.md (seção "Economia histórica").
 *
 * RENDA_REAL: o rendimento médio real do trabalho no ano ÷ o de 2025 (o "nível de renda" da época).
 *   - 2012–2025: PNAD Contínua, rendimento médio real habitual de todos os trabalhos (Ipeadata PNADC12_RRTH12), média anual.
 *   - 2004–2011: PNAD, rendimento médio mensal real das pessoas de 15+ com rendimento (SIDRA 5797), emendada em 2012.
 *   - 1992–2003: PNAD, idem, 10+ (SIDRA 1172), emendada em 2004. 1994, 2000 e 2010 (sem PNAD): média geométrica dos vizinhos.
 *   - 1970–1991: APROXIMAÇÃO — a variação do PIB per capita real (PIB do IBGE ÷ população a 2,48% a.a. em 1970–1980 e
 *     1,93% em 1980–1991, médias intercensitárias).
 *
 * PRECO_RELATIVO: o preço da categoria ÷ o nível geral de preços (IPCA por grupo/item, SIDRA 1692/58/655/2938/1419/7060),
 *   média anual, dez/2025 = 1. Como o motor conta em reais de hoje (deflacionados pelo IPCA geral), este é o fator que leva
 *   um preço de referência de hoje ao da época: 1,5 = custava, em poder de compra, 50% a mais que hoje. Antes de `_desde`
 *   (1995, o primeiro ano de moeda estável; a média anual de um índice relativo na hiperinflação oscila com o calendário dos
 *   reajustes), vale o primeiro ano disponível — APROXIMAÇÃO.
 *
 * CESTA_SP: o custo médio anual da cesta básica do DIEESE em São Paulo (Ipeadata DIEESE12_CBSP12, nominal), convertido para
 *   unidades do motor pela cadeia oficial das moedas e pelo nível de preços do mês (IPCA; antes de dez/1979, IGP-DI).
 */

''')
    o.write(f'export const RENDA_REAL: Readonly<Record<number, number>> = {obj(RENDA)};\n\n')
    o.write('export const PRECO_RELATIVO: Readonly<Record<string, Readonly<Record<number, number>> & { _desde: number }>> = {\n')
    for c, d in PRECO.items():
        dd = {k: v for k, v in d.items() if k != '_desde'}
        o.write(f"  {c}: {{ _desde: {d['_desde']}, {', '.join(f'{k}: {v}' for k, v in dd.items())} }},\n")
    o.write('};\n\n')
    o.write(f'export const CESTA_SP: Readonly<Record<number, number>> = {obj(CESTA)};\n')
print('RENDA', {a: RENDA[a] for a in (1970, 1975, 1985, 1986, 1990, 1992, 1995, 2000, 2004, 2010, 2014, 2020, 2025)})
print('CESTA', {a: CESTA[a] for a in (1970, 1975, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025)})

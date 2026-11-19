# ERAS v3 · estende as séries brasileiras de 1970 para 1900 (idempotente: recusa se já estendido).
#   Nível de preços: IGP-DI (FGV; Ipeadata IGP12_IGPDI12), mensal, fev/1944–dez/1969, encadeado no valor de jan/1970;
#   1900–1943: deflator implícito do PIB (IBGE, Estatísticas do Século XX; Ipeadata SCN10_DIPIBG10), anual, com os meses
#   por interpolação geométrica entre as médias (APROXIMAÇÃO: outro índice).
#   PIB real 1901–1969: Ipeadata SCN10_PIBG10 (IBGE). Renda 1900–1969: Maddison 2023 (gdppc), encadeada em 1970.
#   Salário mínimo: Ipeadata MTE12_SALMIN12 (desde jul/1940, Decreto-Lei 2.162/1940).
import json, os, re, math
import pandas as pd
F = os.path.expanduser('~/vida-trabalho/e3/fontes'); F2 = os.path.expanduser('~/vida-trabalho/eras2/fontes')
B = os.path.expanduser('~/vida-trabalho/r129/src/motor/eras')
S = f'{B}/base/series.ts'
s = open(S).read()
if 'export const IPCA_T0 = 1900 * 12;' in s: raise SystemExit('já estendido')
ipca = [float(x) for x in re.search(r'IPCA: readonly number\[\] = \[(.*?)\];', s, re.S).group(1).replace('\n', ' ').split(',') if x.strip()]
igp = {}
for x in json.load(open(f'{F}/IGP12_IGPDI12.json' if os.path.exists(f'{F}/IGP12_IGPDI12.json') else f'{F}/igpdi.json'))['value']:
    a, m = int(x['VALDATA'][:4]), int(x['VALDATA'][5:7]) - 1
    igp[a * 12 + m] = x['VALVALOR']
t70 = 1970 * 12
k = ipca[0] / igp[t70]
mensal = {t: igp[t] * k for t in range(1944 * 12, t70) if t in igp}
t0igp = min(mensal)
# Antes do IGP-DI: o deflator (variação anual) → nível médio anual, encadeado na média de 1944 do IGP-DI.
defl = {int(x['VALDATA'][:4]): x['VALVALOR'] for x in json.load(open(f'{F}/SCN10_DIPIBG10.json'))['value']}
med44 = sum(mensal[t] for t in range(1944 * 12, 1945 * 12) if t in mensal) / len([t for t in range(1944 * 12, 1945 * 12) if t in mensal])
anual = {1944: med44}
for a in range(1943, 1899, -1):
    anual[a] = anual[a + 1] / (1 + defl[a + 1] / 100)
# Meses de 1900 até o início do IGP-DI: interpolação geométrica entre os meios dos anos (junho).
pts = {a * 12 + 6: v for a, v in anual.items()}
for t in range(1900 * 12, t0igp):
    ks = sorted(pts)
    if t <= ks[0]: v = pts[ks[0]]
    else:
        a = max(x for x in ks if x <= t); b = min((x for x in ks if x >= t), default=a)
        v = pts[a] if a == b else math.exp(math.log(pts[a]) + (math.log(pts[b]) - math.log(pts[a])) * (t - a) / (b - a))
    mensal[t] = v
novo = [mensal[t] for t in range(1900 * 12, t70)]
todos = novo + ipca
corpo = '\n'.join('  ' + ', '.join(f'{v:.8g}' for v in todos[i:i + 12]) + ',' for i in range(0, len(todos), 12))
s = re.sub(r'IPCA: readonly number\[\] = \[(.*?)\];', 'IPCA: readonly number[] = [\n' + corpo + '\n];', s, flags=re.S)
s = s.replace('export const IPCA_T0 = 1970 * 12;', 'export const IPCA_T0 = 1900 * 12;')
# Salário mínimo de jul/1940 a 1968 (o de 1969 em diante já está).
sm, ult = [], None
for x in json.load(open(f'{F2}/MTE12_SALMIN12.json'))['value']:
    a, m = int(x['VALDATA'][:4]), int(x['VALDATA'][5:7]) - 1
    t = a * 12 + m
    if t >= 1969 * 12: break
    if x['VALVALOR'] != ult: sm.append((t, x['VALVALOR'])); ult = x['VALVALOR']
pre = ', '.join(f'[{t}, {v:.8g}]' for t, v in sm)
s = s.replace('export const SALARIO_MINIMO_BR: readonly (readonly [number, number])[] = [\n', 'export const SALARIO_MINIMO_BR: readonly (readonly [number, number])[] = [\n  ' + pre + ',\n', 1)
s = s.replace(' * ERAS v2 · DE JAN/1970', ' * ERAS v3 · DE 1900 A 1969: fev/1944–dez/1969 pelo IGP-DI mensal (FGV; Ipeadata IGP12_IGPDI12), encadeado em jan/1970;\n * 1900–1943 pelo deflator implícito do PIB (IBGE, Estatísticas do Século XX; Ipeadata SCN10_DIPIBG10), anual, com os meses\n * interpolados — APROXIMAÇÃO (o deflator mede todos os preços da economia, não só os do consumidor). Salário mínimo desde\n * jul/1940 (Decreto-Lei 2.162/1940; Ipeadata MTE12_SALMIN12).\n *\n * ERAS v2 · DE JAN/1970', 1)
open(S, 'w').write(s)
# PIB real 1901–1969
pib = {int(x['VALDATA'][:4]): x['VALVALOR'] for x in json.load(open(f'{F}/SCN10_PIBG10.json'))['value']}
A = f'{B}/dados/acontecimentosBR.ts'
a = open(A).read()
lin = ' ' + ', '.join(f'{y}: {round(pib[y], 2)}' for y in range(1901, 1970)) + ','
a = a.replace('export const PIB_BR: Readonly<Record<number, number>> = {\n', 'export const PIB_BR: Readonly<Record<number, number>> = {\n ' + lin + '\n', 1)
a = a.replace('/** PIB real, variação anual (%), Ipeadata SCN10_PIBG10', '/** PIB real, variação anual (%), Ipeadata SCN10_PIBG10 (ERAS v3: desde 1901, IBGE — Estatísticas do Século XX)', 1)
open(A, 'w').write(a)
# Renda 1900–1969: PIB per capita do Maddison encadeado no valor de 1970.
E = f'{B}/base/economiaSeries.ts'
e = open(E).read()
r70 = float(re.search(r'RENDA_REAL: Readonly<Record<number, number>> = \{ 1970: ([0-9.]+)', e).group(1))
mpd = pd.read_excel(f'{F}/mpd2023.xlsx', sheet_name='Full data')
g = mpd[mpd.countrycode == 'BRA'].set_index('year').gdppc
pre = ', '.join(f'{y}: {r70 * float(g[y]) / float(g[1970]):.4f}' for y in range(1900, 1970))
e = e.replace('RENDA_REAL: Readonly<Record<number, number>> = { 1970:', 'RENDA_REAL: Readonly<Record<number, number>> = { ' + pre + ', 1970:', 1)
e = e.replace(' * RENDA_REAL: o rendimento médio real do trabalho no ano ÷ o de 2025 (o "nível de renda" da época).', ' * RENDA_REAL: o rendimento médio real do trabalho no ano ÷ o de 2025 (o "nível de renda" da época).\n *   - ERAS v3 · 1900–1969: PIB per capita do Maddison Project Database 2023, encadeado no valor de 1970 (APROXIMAÇÃO).', 1)
open(E, 'w').write(e)
print('meses novos', len(novo), '1900-01', novo[0], '1944-02', mensal[t0igp], 'mínimos', len(sm), 'renda1900', r70 * float(g[1900]) / float(g[1970]))

# Estende series.ts para 1970-01: o nível de preços pelo IGP-DI (encadeado no IPCA de dez/1979) e o salário mínimo do MTE.
import json, re, os
F = os.path.expanduser('~/vida-trabalho/eras2/fontes'); P = os.path.expanduser('~/vida-trabalho/r129/src/motor/eras/base/series.ts')
s = open(P).read()
if 'IGP-DI' in s.split('export const IPCA_T0')[0]:
    raise SystemExit('já estendido')
ipca = [float(x) for x in re.search(r'IPCA: readonly number\[\] = \[(.*?)\];', s, re.S).group(1).replace('\n', ' ').split(',') if x.strip()]
igp = {}
for x in json.load(open(f'{F}/IGP12_IGPDI12.json'))['value']:
    a, m = int(x['VALDATA'][:4]), int(x['VALDATA'][5:7]) - 1
    igp[a * 12 + m] = x['VALVALOR']
t79 = 1979 * 12 + 11
novo = [ipca[0] * igp[t] / igp[t79] for t in range(1970 * 12, t79)]
todos = novo + ipca
lin = []
for i in range(0, len(todos), 12):
    lin.append('  ' + ', '.join(f'{v:.8g}' for v in todos[i:i + 12]) + ',')
corpo = '\n'.join(lin)
s = re.sub(r'IPCA: readonly number\[\] = \[(.*?)\];', 'IPCA: readonly number[] = [\n' + corpo + '\n];', s, flags=re.S)
s = s.replace('export const IPCA_T0 = 1979 * 12 + 11;', 'export const IPCA_T0 = 1970 * 12;')
sm = []
ult = None
for x in json.load(open(f'{F}/MTE12_SALMIN12.json'))['value']:
    a, m = int(x['VALDATA'][:4]), int(x['VALDATA'][5:7]) - 1
    t = a * 12 + m
    if t < 1969 * 12 or t >= 23759: continue
    if x['VALVALOR'] != ult: sm.append((t, x['VALVALOR'])); ult = x['VALVALOR']
pre = ', '.join(f'[{t}, {v:.8g}]' for t, v in sm)
s = s.replace('export const SALARIO_MINIMO_BR: readonly (readonly [number, number])[] = [\n', 'export const SALARIO_MINIMO_BR: readonly (readonly [number, number])[] = [\n  ' + pre + ',\n', 1)
s = s.replace(' * IPCA — número-índice mensal do IBGE', ' * ERAS v2 · DE JAN/1970 A NOV/1979 (antes do IPCA): o IGP-DI da FGV (Ipeadata IGP12_IGPDI12), encadeado no IPCA de dez/1979 —\n * APROXIMAÇÃO (outro índice; o IPCA só começa em dez/1979). O salário mínimo de 1969 a 1979 vem da mesma série do MTE.\n *\n * IPCA — número-índice mensal do IBGE', 1)
open(P, 'w').write(s)
print(len(novo), 'meses de IGP-DI;', len(sm), 'mínimos;', 'nível 1970-01 =', novo[0], ' 1975-01 =', novo[60])

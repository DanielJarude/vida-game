# Índice de preço RELATIVO de cada grupo/item (grupo ÷ índice geral), dez/2025 = 1, média anual.
import json, os
os.chdir(os.path.expanduser('~/vida-trabalho/eras2/fontes'))
var = json.load(open('ipca_var.json'))
g = var['Índice geral']
meses = sorted(g)
out = {}
for n, s in var.items():
    if n == 'Índice geral': continue
    ks = sorted(s)
    nivel, idx = 1.0, {}
    for m in meses:
        if m < ks[0]: continue
        if m not in s: continue  # lacuna: mantém
        nivel *= (1 + s[m] / 100) / (1 + g[m] / 100)
        idx[m] = nivel
    ref = idx.get('202512')
    if not ref: continue
    anual = {}
    for m, x in idx.items():
        anual.setdefault(m[:4], []).append(x / ref)
    out[n] = {a: round(sum(v) / len(v), 4) for a, v in anual.items() if len(v) >= 6}
json.dump(out, open('ipca_relativos.json', 'w'), ensure_ascii=False, indent=0)
anos = ['1990','1992','1995','1998','2000','2003','2006','2010','2014','2018','2022','2025']
print(f"{'':32s}" + ''.join(f'{a:>7s}' for a in anos))
for n, s in out.items():
    print(f'{n[:32]:32s}' + ''.join(f"{s.get(a, float('nan')):7.2f}" for a in anos))

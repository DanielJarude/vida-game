# Baixa as variações mensais do IPCA por grupo/item (SIDRA) e encadeia num índice relativo ao índice geral.
import json, urllib.request, sys, os, time
os.chdir(os.path.expanduser('~/vida-trabalho/eras2/fontes'))
cod = {}
for linha in open('codigos.txt'):
    t, cls, n, js = linha.split(' ', 3)
    cod[int(t)] = (cls, json.loads(js))
ordem = [1692, 58, 655, 2938, 1419, 7060]
var = {}  # nome -> {aaaamm: variação %}
for t in ordem:
    cls, cats = cod[t]
    ids = ','.join(str(i) for i in cats.values())
    url = f'https://apisidra.ibge.gov.br/values/t/{t}/n1/all/v/63/p/all/c{cls}/{ids}'
    arq = f'ipca_{t}.json'
    if not os.path.exists(arq):
        for k in range(3):
            try:
                urllib.request.urlretrieve(url, arq); break
            except Exception as e:
                print('retry', t, e); time.sleep(5)
    d = json.load(open(arq))
    inv = {str(v): k for k, v in cats.items()}
    hdr = d[0]
    kp = [k for k, v in hdr.items() if v.startswith('Mês (Código)')][0]
    kc = [k for k, v in hdr.items() if v.startswith('Geral') and v.endswith('(Código)')][0]
    for r in d[1:]:
        try: x = float(r['V'])
        except: continue
        var.setdefault(inv[r[kc]], {})[r[kp]] = x
json.dump(var, open('ipca_var.json', 'w'), ensure_ascii=False)
for n, s in var.items():
    ks = sorted(s)
    print(f'{n:40s} {len(ks):4d} {ks[0]}–{ks[-1]}')

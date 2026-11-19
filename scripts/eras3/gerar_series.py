# ERAS v3 · gera as séries históricas por país (dados puros) a partir das fontes baixadas em ~/vida-trabalho/e3/fontes.
#   JST Macrohistory Database R6 (Jordà–Schularick–Taylor): cpi, rgdpbarro (PIB real per capita), unemp — 1870–2020.
#   Banco Mundial (API): FP.CPI.TOTL.ZG (inflação anual) e NY.GDP.PCAP.KD.ZG (PIB per capita real) — 2021–2025.
#   Maddison Project Database 2023: gdppc (Argentina; Brasil antes de 1970).
#   INDEC (datos.gob.ar, IPC histórico empalmado, mensal 1943–2008).
#   Ipeadata: IGP-DI mensal (1944–), deflator implícito do PIB (1900–) e PIB real (1901–) do Brasil.
# Uso: ~/vida-trabalho/e3/venv/bin/python scripts/eras3/gerar_series.py
import json, os, math
import pandas as pd
F = os.path.expanduser('~/vida-trabalho/e3/fontes')
R = os.path.expanduser('~/vida-trabalho/r129/src/motor/eras')
jst = pd.read_stata(f'{F}/jst.xlsx')
mpd = pd.read_excel(f'{F}/mpd2023.xlsx', sheet_name='Full data')

def wb(c, k):
    d = json.load(open(f'{F}/wb_{k}_{c}.json'))[1]
    return {int(x['date']): x['value'] for x in d if x['value'] is not None}

# Aproximações declaradas (faltam no Banco Mundial em nov/2026): inflação média de 2025.
EXTRA_CPI = {'USA': {2025: 2.7}, 'ARG': {2025: 41.3}}
# Argentina 2008–2017: o IPC oficial do INDEC de 2007 a 2015 foi declarado não confiável (Decreto 55/2016, emergência
# estatística). APROXIMAÇÃO: inflação média anual pelos índices provinciais e de consultorias usados na época.
AR_APROX = {2008: 23.0, 2009: 15.0, 2010: 25.0, 2011: 23.0, 2012: 25.0, 2013: 26.0, 2014: 38.0, 2015: 27.0, 2016: 40.0, 2017: 25.7}

def serie_jst(iso, desde=1870):
    s = jst[jst.iso == iso].set_index('year')
    anos = list(range(desde, 2026))
    cpi, rg, un = {}, {}, {}
    for a in range(desde, 2021):
        if not math.isnan(s.cpi.get(a, float('nan'))): cpi[a] = float(s.cpi[a])
        if not math.isnan(s.rgdpbarro.get(a, float('nan'))): rg[a] = float(s.rgdpbarro[a])
        u = s.unemp.get(a, float('nan'))
        if u is not None and not math.isnan(u): un[a] = float(u)
    wc, wg = wb(iso, 'cpi'), wb(iso, 'gdppc')
    wc.update(EXTRA_CPI.get(iso, {}))
    for a in range(2021, 2026):
        cpi[a] = cpi[a - 1] * (1 + wc[a] / 100)
        rg[a] = rg[a - 1] * (1 + wg[a] / 100)
    return anos, cpi, rg, un

def rel(d, ano_base=2025):
    b = d[ano_base]
    return {a: v / b for a, v in d.items()}

def cresc(rg):
    return {a: (rg[a] / rg[a - 1] - 1) * 100 for a in rg if a - 1 in rg}

def fmt(vals, casas=6):
    return ', '.join('null' if v is None else f'{v:.{casas}g}' for v in vals)

def escrever(pais, nome, anos, precos, renda, pib, desemprego, fonte, mensal=None):
    t0 = anos[0]
    linhas = [
        f'/**\n * ERAS v3 · {nome}: as séries anuais (dados puros, GERADOS por scripts/eras3/gerar_series.py — não editar à mão).\n *',
        *[f' * {l}' for l in fonte],
        ' *\n * precos: nível médio de preços do ano ÷ o de 2025, na moeda de hoje (a cadeia das moedas antigas fica em `moedas`).\n * renda: PIB real per capita do ano ÷ o de 2025. pib: variação real do PIB per capita (%). desemprego: taxa (%), null sem dado.\n */',
        f'export const T0 = {t0};',
        f'export const PRECOS: readonly number[] = [{fmt([precos.get(a) for a in anos])}];',
        f'export const RENDA: readonly number[] = [{fmt([renda.get(a) for a in anos], 4)}];',
        f'export const PIB: readonly (number | null)[] = [{fmt([None if pib.get(a) is None else round(pib[a], 2) for a in anos], 4)}];',
        f'export const DESEMPREGO: readonly (number | null)[] = [{fmt([None if desemprego.get(a) is None else round(desemprego[a], 1) for a in anos], 3)}];',
    ]
    if mensal:
        linhas.append(f'/** Nível de preços MENSAL (÷ o médio de 2025), de {mensal[0][0]}/{mensal[0][1]+1}: sobrepõe a interpolação das médias anuais. */')
        linhas.append(f'export const MENSAL_T0 = {mensal[0][0] * 12 + mensal[0][1]};')
        linhas.append(f'export const MENSAL: readonly number[] = [{fmt(mensal[1], 6)}];')
    else:
        linhas.append('export const MENSAL_T0 = 0;\nexport const MENSAL: readonly number[] = [];')
    os.makedirs(f'{R}/paises/{pais}', exist_ok=True)
    open(f'{R}/paises/{pais}/serie.ts', 'w').write('\n'.join(linhas) + '\n')
    print(pais, 'ok', anos[0], anos[-1])

FONTE_JST = ['Fontes: Jordà, Schularick & Taylor, Macrohistory Database R6 (macrohistory.net), 1870–2020 [S];',
             'Banco Mundial, FP.CPI.TOTL.ZG e NY.GDP.PCAP.KD.ZG, 2021–2025 [S] (baixado em 18/11/2026).']

# ---------------------------------------------------------------- EUA, Reino Unido, Japão
for iso, p, nome in [('USA', 'us', 'Estados Unidos'), ('GBR', 'gb', 'Reino Unido'), ('JPN', 'jp', 'Japão')]:
    anos, cpi, rg, un = serie_jst(iso)
    extra = ['Inflação de 2025 dos EUA: 2,7% (estimativa — aproximação [A]).'] if iso == 'USA' else []
    escrever(p, nome, anos, rel(cpi), rel(rg), cresc(rg), un, FONTE_JST + extra)

# ---------------------------------------------------------------- Alemanha (a hiperinflação de 1919–1923 em meses)
anos, cpi, rg, un = serie_jst('DEU')
# A JST encadeia o marco de papel no Rentenmark (1 RM = 1 bilhão de marcos — 10^12). Em 1922–1923 a média anual não diz nada
# sobre o mês: APROXIMAÇÃO [A] — o nível de preços mensal acompanha a cotação do dólar em Berlim (marcos por dólar, médias
# mensais; Statistisches Reichsamt, "Zahlen zur Geldentwertung in Deutschland 1914 bis 1923", 1925), ancorado no nível de
# 1913 da JST × (cotação ÷ 4,2 marcos de 1913).
DOLAR = [  # (ano, mês 0..11, marcos por dólar)
    (1919, 0, 8.9), (1919, 6, 15.1), (1920, 0, 64.8), (1920, 6, 39.5), (1921, 0, 64.9), (1921, 6, 76.7), (1921, 10, 263.0),
    (1922, 0, 191.8), (1922, 6, 493.2), (1922, 7, 1134.6), (1922, 8, 1465.9), (1922, 9, 3180.9), (1922, 10, 7183.1), (1922, 11, 7589.3),
    (1923, 0, 17972.0), (1923, 1, 27918.0), (1923, 2, 21190.0), (1923, 3, 24457.0), (1923, 4, 47670.0), (1923, 5, 109996.0),
    (1923, 6, 353412.0), (1923, 7, 4620455.0), (1923, 8, 98860000.0), (1923, 9, 25260208000.0), (1923, 10, 2193600000000.0)]
n1913 = cpi[1913] / 4.2
pts = {a * 12 + m: n1913 * d for a, m, d in DOLAR}
pts[1923 * 12 + 11] = cpi[1924] / 1.03  # o Rentenmark estabiliza: dez/1923 ≈ o nível de 1924
ks = sorted(pts)
mensal = []
for t in range(ks[0], ks[-1] + 1):
    a = max(k for k in ks if k <= t); b = min(k for k in ks if k >= t)
    v = pts[a] if a == b else math.exp(math.log(pts[a]) + (math.log(pts[b]) - math.log(pts[a])) * (t - a) / (b - a))
    mensal.append(v / cpi[2025])
escrever('de', 'Alemanha', anos, rel(cpi), rel(rg), cresc(rg), un,
         FONTE_JST + ['Hiperinflação 1919–1923 por mês: cotação do dólar (Statistisches Reichsamt, 1925) — aproximação [A].'],
         mensal=((ks[0] // 12, ks[0] % 12), mensal))

# ---------------------------------------------------------------- Argentina (desde 1943)
ar = pd.read_csv(f'{F}/ar_ipc_hist.csv')
men = {}
for _, x in ar.iterrows():
    a, m = int(x.indice_tiempo[:4]), int(x.indice_tiempo[5:7]) - 1
    men[a * 12 + m] = float(x.nivel_general)
anual = {}
for a in range(1943, 2008):
    anual[a] = sum(men[a * 12 + m] for m in range(12)) / 12
wc = wb('ARG', 'cpi'); wc.update(EXTRA_CPI['ARG'])
for a in range(2008, 2026):
    anual[a] = anual[a - 1] * (1 + (AR_APROX.get(a) if a in AR_APROX else wc[a]) / 100)
m = mpd[mpd.countrycode == 'ARG'].set_index('year').gdppc
rg = {a: float(m[a]) for a in range(1900, 2023)}
wg = wb('ARG', 'gdppc')
for a in range(2023, 2026): rg[a] = rg[a - 1] * (1 + wg[a] / 100)
anos = list(range(1943, 2026))
b = anual[2025]
mensal_ar = [men[t] / b for t in range(1943 * 12, 2008 * 12)]
escrever('ar', 'Argentina', anos, {a: v / b for a, v in anual.items()}, rel(rg), cresc(rg), {},
         ['Preços: INDEC, IPC (GBA) empalmado, mensal 1943–2008 (datos.gob.ar, serie 178) [S]; 2008–2017: APROXIMAÇÃO [A] por',
          'índices provinciais e privados (IPC oficial de 2007–2015 sem confiabilidade, Decreto 55/2016); 2018–2024: Banco Mundial [S];',
          '2025: 41,3% (estimativa [A]). Renda: Maddison Project Database 2023 (gdppc) [S] até 2022; Banco Mundial 2023–2025 [S].'],
         mensal=((1943, 0), mensal_ar))

import pandas as pd, math, json
le=pd.read_csv('fontes/le.csv'); cm=pd.read_csv('fontes/cm.csv')
GUERRA={'USA':[1918,1942,1943,1944,1945],'GBR':list(range(1914,1919))+list(range(1939,1946)),'JPN':list(range(1937,1947)),'DEU':list(range(1914,1919))+list(range(1939,1947)),'BRA':[1918],'ARG':[1918]}
EXTRA={'DEU':{1905:46.5,1925:57.4,1933:61.3,1950:66.5},'USA':{1900:47.3}}
BANDA=[(27.5,38.4),(32.5,36.8),(37.5,30.8),(42.5,25.7),(47.5,20.7),(52.5,16.1),(57.5,11.5),(62.5,8.6),(70,3.5),(80,0.6)]
def u_de_e0(e):
    if e<=BANDA[0][0]: return BANDA[0][1]
    for (a,ua),(b,ub) in zip(BANDA,BANDA[1:]):
        if e<=b: return math.exp(math.log(ua)+(math.log(ub)-math.log(ua))*(e-a)/(b-a))
    return BANDA[-1][1]
def serie(c):
    s=le[le.code==c].set_index('year').life_expectancy_0.dropna()
    d={y:v for y,v in s.items() if y>=1890 and y not in GUERRA[c]}; d.update(EXTRA.get(c,{}))
    ys=sorted(d); out={}
    for y in range(1900,2026):
        if y in d: out[y]=d[y]; continue
        a=[k for k in ys if k<y]; b=[k for k in ys if k>y]
        out[y]=d[a[-1]]+(d[b[0]]-d[a[-1]])*(y-a[-1])/(b[0]-a[-1]) if a and b else d[b[0]] if b else d[a[-1]]
    return out
def e5_motor(k):
    tot=0
    for masc in (True,False):
        surv=1; e=0
        for i in range(5,120):
            q=min(0.95,0.0000085*math.exp(0.1*i)*(1.35 if masc else 1)*k+((0.0018 if masc else 0.0004) if 15<=i<=34 else 0))
            e+=surv*(1-q/2); surv*=(1-q)
        tot+=e
    return tot/2
REF=e5_motor(1)
res={}
for c in GUERRA:
    e0=serie(c)
    s=cm[cm.code==c].set_index('year').child_mortality_rate.dropna()
    out=[]
    for y in range(1900,2026,5):
        U=(s[y] if y in s.index and y not in GUERRA[c] else u_de_e0(e0[y]))/100
        e5=(e0[y]-U*1.0)/(1-U)-5
        lo,hi=0.05,60.0
        for _ in range(70):
            mid=math.sqrt(lo*hi)
            if e5_motor(mid)>e5: lo=mid
            else: hi=mid
        k=math.sqrt(lo*hi)
        out.append([y,round(e0[y],1),round(U,4),round(max(1.0,k),2),round(1-(1-U)**0.2,5)])
    res[c]=out
    print(c,[o for o in out if o[0] in (1900,1920,1940,1950,1970,2000,2020)])
json.dump(res,open('mort.json','w'))

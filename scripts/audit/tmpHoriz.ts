import { definirFonteAleatoria, resetarFonteAleatoria } from '../../src/utils/random';
import { executarPassagemDeAno } from '../../src/systems/agingSystem';
import { aplicarConsequenciasEscolha, avaliarRequisitoOpcao } from '../../src/systems/eventSystem';
import { criarPersonalidadeInicial, obterTracosPercebidos } from '../../src/systems/personalitySystem';
import { criarEstadoTeste } from '../../src/systems/__tests__/fixtures';
import { criarCalendarioInicial } from '../../src/systems/calendario/tipos';
import type { EventOccurrence, PersonalityState, TracoComportamental } from '../../src/types';
function mul(seed:number){let a=seed;return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
const SEEDS=[11,22,33,44,55,66,77,88,99,111];
const S:Record<string,(o:any[])=>any>={
 prosocial:o=>[...o].sort((a,b)=>p(b)-p(a))[0],
 impulsiva:o=>[...o].sort((a,b)=>i(b)-i(a))[0],
 sociavel:o=>[...o].sort((a,b)=>(b.consequencias.impactosComportamentais?.sociabilidade??0)-(a.consequencias.impactosComportamentais?.sociabilidade??0))[0],
};
const p=(x:any)=>{const t=x.consequencias.impactosComportamentais??{};return (t.empatia??0)+(t.generosidade??0)+(t.disciplina??0)+(t.familia??0)-(t.impulsividade??0);};
const i=(x:any)=>{const t=x.consequencias.impactosComportamentais??{};return (t.impulsividade??0)+(t.coragem??0)+(t.independencia??0)-(t.disciplina??0);};
for(const H of [40,50,60,70]){
  let multi=0,total=0; const dom:Record<string,Map<string,number>>={};
  for(const nome of Object.keys(S)){dom[nome]=new Map();
   for(const seed of SEEDS){
    definirFonteAleatoria(mul(seed));
    const e=criarEstadoTeste({idade:0});
    let c=e.personagem,fam=e.familia,edu=e.educacao,car=e.carreira,eco=e.economia;
    let pers:PersonalityState=criarPersonalidadeInicial();
    let hist:string[]=[];let occ:EventOccurrence[]=[];let cal=criarCalendarioInicial();
    while(c.idade<H){
      const r=executarPassagemDeAno(c,fam,edu,car,eco,hist,pers,occ,cal);
      c=r.personagemAtualizado;fam=r.familiaAtualizada;edu=r.educacaoAtualizada;car=r.carreiraAtualizada;eco=r.economiaAtualizada;cal=r.calendario;
      if(r.morreu)break;
      if(r.ocorrencia){hist=[...hist,r.ocorrencia.eventId];occ=[...occ,r.ocorrencia];}
      if(r.eventoDisparado){
        const el=r.eventoDisparado.opcoes.filter(o=>avaliarRequisitoOpcao(o,c,eco,pers).aprovado);
        if(!el.length)continue;
        const res=aplicarConsequenciasEscolha(S[nome](el),c,car,edu,eco,fam,c.anoAtual,{eventoId:r.eventoDisparado.id,personalidade:pers});
        if(!res.recusado){c=res.personagemAtualizado;car=res.carreiraAtualizada;edu=res.educacaoAtualizada;eco=res.economiaAtualizada;fam=res.familiaAtualizada;if(res.personalidadeAtualizada)pers=res.personalidadeAtualizada;}
      }
    }
    resetarFonteAleatoria();
    const tr=obterTracosPercebidos(pers);total++;if(tr.length>=2)multi++;
    for(const t of tr)dom[nome].set(t.traco,(dom[nome].get(t.traco)??0)+1);
   }
  }
  const top=(m:Map<string,number>)=>[...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]??null;
  console.log(`H=${H} multi=${multi}/${total} prosocial=${top(dom.prosocial)} impulsiva=${top(dom.impulsiva)} sociavel=${top(dom.sociavel)}`);
}

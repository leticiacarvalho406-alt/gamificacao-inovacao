
var MANAGERS=["luciana gomes","alan kadri"];
function isMgr(name){return MANAGERS.indexOf((name||"").toLowerCase().trim())>=0;}




const MONDAY_KEY="eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzMTkxMzAzOSwiYWFpIjoxMSwidWlkIjo2MDYyMjc5OCwiaWFkIjoiMjAyNi0wMy0xMVQxNzo0MToxMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY0ODM4OTEsInJnbiI6InVzZTEifQ.g3HAx1OKRnapboEbgGOD3VKR4ABPKoZung9IyjLzC2Q";
const BOARD_ID="4879086777";
const SC={
  "assistente1":{"Cotacao":{"Baixa":2,"Media":3,"Alta":4}},
  "assistente2":{"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}},
  "analista_jr":{"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}},
  "analista_sr":{"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}}
};
// Map display names to internal keys
const ETAPA_KEY={"Estruturacao":"Estrutura\u00e7\u00e3o","Cotacao":"Cota\u00e7\u00e3o","Contrato":"Contrato","Implantacao":"Implanta\u00e7\u00e3o","Medicao":"Medi\u00e7\u00e3o"};
const ETAPA_TO_KEY={"Estrutura\u00e7\u00e3o":"Estruturacao","Cota\u00e7\u00e3o":"Cotacao","Contrato":"Contrato","Implanta\u00e7\u00e3o":"Implantacao","Medi\u00e7\u00e3o":"Medicao","Conclu\u00eddo":"Concluido"};
const BT={
  "assistente1":[{min:0,b:0},{min:30,b:800},{min:60,b:1400},{min:80,b:2000}],
  "assistente2":[{min:0,b:0},{min:11,b:900},{min:35,b:1600},{min:70,b:2250}],
  "analista_jr":[{min:0,b:0},{min:45,b:800},{min:100,b:1500},{min:150,b:2250},{min:200,b:3250}],
  "analista_sr":[{min:0,b:0},{min:45,b:1800},{min:100,b:2500},{min:150,b:3400},{min:200,b:4250}]
};
const DB={
  "assistente1":[0,50,100,120,150,200],
  "assistente2":[0,50,100,120,150,200],
  "analista_jr":[0,80,150,220,270,300],
  "analista_sr":[0,150,250,400,550,600]
};
const RL={
  "assistente1":"Assistente I","assistente2":"Assistente II",
  "analista_jr":"Analista J\u00fanior","analista_sr":"Analista S\u00eanior",
  "gerente":"Gerente","diretor":"Diretor"
};
const COLS=["#7C3AED","#EC4899","#10B981","#F59E0B","#3B82F6","#8B5CF6","#06B6D4","#F97316"];
const ETAPAS=[
  {key:"Estrutura\u00e7\u00e3o",sk:"Estruturacao",icon:"fas fa-drafting-compass",desc:"Escopo completo no Monday, an\u00e1lise de viabilidade, cronograma e valida\u00e7\u00e3o gerencial.",prazo:"7 dias \u00fateis"},
  {key:"Cota\u00e7\u00e3o",sk:"Cotacao",icon:"fas fa-search-dollar",desc:"Cota\u00e7\u00e3o com fornecedores, comparativo em farol e valida\u00e7\u00e3o da analista respons\u00e1vel.",prazo:"30 dias corridos"},
  {key:"Contrato",sk:"Contrato",icon:"fas fa-file-contract",desc:"Negocia\u00e7\u00e3o, revis\u00e3o jur\u00eddica, assinatura e registro completo no Monday.",prazo:"30 dias corridos"},
  {key:"Implanta\u00e7\u00e3o",sk:"Implantacao",icon:"fas fa-rocket",desc:"Execu\u00e7\u00e3o do plano com evid\u00eancias, checklists e valida\u00e7\u00e3o da ger\u00eancia para go-live.",prazo:"Conforme cronograma"},
  {key:"Medi\u00e7\u00e3o",sk:"Medicao",icon:"fas fa-chart-bar",desc:"Levantamento de resultados (m\u00edn. 6 meses p\u00f3s-implanta\u00e7\u00e3o) e apresenta\u00e7\u00e3o \u00e0 diretoria.",prazo:"6+ meses p\u00f3s-implanta\u00e7\u00e3o"}
];
let S={user:null,projects:[],approvals:{},timer:null};

// ── MONDAY API ─────────────────────────────────────
async function fetchBoard(){
  var q="{boards(ids:[BOARD_ID_PLACEHOLDER]){items_page(limit:200){items{id name state created_at updated_at column_values{id text value}}}}}";
  // First try to get board ID from server config
  var boardId="4879086777";
  try{
    var cfg=await fetch("/api/config");
    if(cfg.ok){var c=await cfg.json();if(c.boardId)boardId=c.boardId;}
  }catch(e){}
  q=q.replace("BOARD_ID_PLACEHOLDER",boardId);

  // Call via server proxy (no CORS issues)
  try{
    var r=await fetch("/api/monday",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({query:q})
    });
    if(r.ok){
      var d=await r.json();
      if(d&&d.data&&d.data.boards&&d.data.boards[0]){
        console.log("[Monday] Sincronizado via proxy:",d.data.boards[0].items_page.items.length,"itens");
        return{items:d.data.boards[0].items_page.items,live:true};
      }
      if(d&&d.errors){console.warn("[Monday] Erro API:",d.errors[0].message);}
    }
  }catch(e){console.warn("[Monday] Proxy error:",e.message);}

  // Direct call removed - only proxy works

  return{items:null,live:false};
}

// ── PARSE ─────────────────────────────────────────
function cv(item, kws){
  for(var i=0;i<kws.length;i++){
    var kw = kws[i].toLowerCase().replace(/ /g,"_");
    var kw2 = kws[i].toLowerCase().replace(/_/g," ");
    var col = (item.column_values||[]).find(function(c){
      var cid = c.id.toLowerCase();
      return cid.indexOf(kw) >= 0 || cid.indexOf(kw2.replace(/ /g,"_")) >= 0;
    });
    if(col && col.text) return col.text;
  }
  return "";
}
function pComp(r){r=(r||"").toLowerCase();if(r.indexOf("alta")>=0||r.indexOf("high")>=0)return"Alta";if(r.indexOf("m")>=0&&(r.indexOf("dia")>=0||r.indexOf("ed")>=0))return"Media";return"Baixa";}
function pEtapa(r){
  r=(r||"").toLowerCase().trim();
  if(!r) return "Estruturacao";
  // Exact values seen in the Monday board
  if(r==="medir resultado"||r==="medir resultados") return "Medicao";
  if(r==="implementacao"||r==="implementação")      return "Implantacao";
  if(r==="instalacao"||r==="instalação")            return "Implantacao";
  if(r==="assinatura cont."||r==="assinatura contrato"||r==="contrato fechado") return "Contrato";
  if(r==="cotacao"||r==="cotação")                  return "Cotacao";
  if(r==="estruturacao"||r==="estruturação")        return "Estruturacao";
  // Partial matches
  if(r.indexOf("medir")>=0||r.indexOf("medicao")>=0||r.indexOf("mediç")>=0) return "Medicao";
  if(r.indexOf("implement")>=0||r.indexOf("instal")>=0||r.indexOf("go-live")>=0) return "Implantacao";
  if(r.indexOf("assinatura")>=0||r.indexOf("contrat")>=0||r.indexOf("poc")>=0)   return "Contrato";
  if(r.indexOf("cota")>=0)    return "Cotacao";
  if(r.indexOf("estrut")>=0) return "Estruturacao";
  if(r.indexOf("conclu")>=0||r==="done") return "Concluido";
  return "Estruturacao";
}

function pCargo(r){r=(r||"").toLowerCase();
  if(r.indexOf("s\u00eanior")>=0||r.indexOf("senior")>=0||r.indexOf(" sr")>=0)return"analista_sr";
  if(r.indexOf("j\u00fanior")>=0||r.indexOf("junior")>=0||r.indexOf(" jr")>=0)return"analista_jr";
  if(r.indexOf("analista")>=0)return"analista_jr";
  if(r.indexOf("ii")>=0||r.indexOf(" 2")>=0)return"assistente2";
  return"assistente1";
}
function mapItem(item){
  if(!window._colsLogged && item.column_values && item.column_values.length){
    window._colsLogged=true;
    console.log("[Monday] IDs das colunas:");
    item.column_values.forEach(function(c){console.log("  id:'"+c.id+"' text:'"+c.text+"'");});
  }

  function getCol(kws){
    for(var k=0;k<kws.length;k++){
      var kw=kws[k].toLowerCase().replace(/ /g,"_");
      var col=(item.column_values||[]).find(function(c){
        return c.id.toLowerCase().indexOf(kw)>=0;
      });
      if(col&&col.text) return col.text;
    }
    return "";
  }

  function getDate(kws){
    for(var k=0;k<kws.length;k++){
      var kw=kws[k].toLowerCase().replace(/ /g,"_");
      var col=(item.column_values||[]).find(function(c){
        return c.id.toLowerCase().indexOf(kw)>=0;
      });
      if(col){
        if(col.value){try{var v=JSON.parse(col.value);if(v&&v.date)return v.date;}catch(e){}}
        if(col.text){var m=col.text.match(/(\d{4}-\d{2}-\d{2})/);if(m)return m[1];}
      }
    }
    return null;
  }

  var statusRaw=getCol(["status"])||"";
  var comp=pComp(getCol(["complexidade","complexity"]));
  var resp=getCol(["analista_responsavel","analista_respons","responsavel"])||"";
  if(resp.indexOf(",")>=0) resp=resp.split(",")[0].trim();
  if(resp.indexOf(" e ")>=0) resp=resp.split(" e ")[0].trim();
  var cargo=pCargo(getCol(["cargo","role","funcao","nivel"]));

  var drEstrut  =getDate(["data_real_estruturacao","data_real_estrutu"]);
  var drCotacao =getDate(["data_real_cotacao","data_real_cota"]);
  var drContrato=getDate(["data_real_contrato_fechado","data_real_contrato"]);
  var drImpl    =getDate(["data_real_implantacao","data_real_impl"]);
  var drMedicao =getDate(["data_real_medicao_resultados","data_real_medicao"]);

  var dpEstrut  =getDate(["fim_previsto_estruturacao"]);
  var dpCotacao =getDate(["fim_previsto_cotacao"]);
  var dpContrato=getDate(["fim_previsto_contrato_fechado"]);
  var dpImpl    =getDate(["fim_previsto_implantacao"]);
  var dpMedicao =getDate(["fim_previsto_medicao_resultados"]);

  var etapaKey=pEtapa(statusRaw);
  var realDate={Estruturacao:drEstrut,Cotacao:drCotacao,Contrato:drContrato,Implantacao:drImpl,Medicao:drMedicao}[etapaKey]||null;
  var prazo   ={Estruturacao:dpEstrut,Cotacao:dpCotacao,Contrato:dpContrato,Implantacao:dpImpl,Medicao:dpMedicao}[etapaKey]||null;
  var onTime=null;
  if(realDate&&prazo){onTime=new Date(realDate)<=new Date(prazo);}

  return{
    id:item.id,name:item.name,
    etapaKey:etapaKey,etapa:ETAPA_KEY[etapaKey]||etapaKey,
    comp:comp,resp:resp,cargo:cargo,
    dl:prazo,realDate:realDate,onTime:onTime,
    pts:calcPts(cargo,etapaKey,comp),
    updatedAt:item.updated_at,createdAt:item.created_at
  };
}

// ── SCORING ───────────────────────────────────────
function calcPts(cargo,etapaKey,comp){
  if(cargo==="assistente1")return etapaKey==="Cotacao"?(SC["assistente1"]["Cotacao"][comp]||2):0;
  var t=SC[cargo];if(!t)return 0;var e=t[etapaKey];if(!e)return 0;return e[comp]||0;
}
function calcBase(role,pts){var t=BT[role];if(!t)return 0;var b=0;for(var i=0;i<t.length;i++)if(pts>=t[i].min)b=t[i].b;return b;}
function dlIdx(pct){if(pct<50)return 0;if(pct<70)return 1;if(pct<80)return 2;if(pct<90)return 3;if(pct<100)return 4;return 5;}
function calcDL(role,pct){return(DB[role]||[])[dlIdx(pct)]||0;}
function curTier(role,pts){var t=BT[role];if(!t)return null;var ct=t[0];for(var i=0;i<t.length;i++)if(pts>=t[i].min)ct=t[i];return ct;}
function nextTier(role,pts){return(BT[role]||[]).find(function(x){return pts<x.min;})||null;}
function currQ(){var n=new Date();return"Q"+Math.ceil((n.getMonth()+1)/3)+" "+n.getFullYear();}
function inCurrQ(d){
  if(!d) return false; // sem data real → não conta no trimestre
  var n = new Date(), q = Math.ceil((n.getMonth()+1)/3);
  var s = new Date(n.getFullYear(),(q-1)*3,1);
  var e = new Date(n.getFullYear(),q*3,0,23,59,59);
  var dt = new Date(d);
  return dt >= s && dt <= e;
}
function userProjects(name){
  if(!name) return S.projects;
  if(isMgr(name)) return S.projects;
  var n=name.toLowerCase().trim();
  return S.projects.filter(function(p){
    var r=(p.resp||"").toLowerCase().trim();
    // Exact match OR name is contained in responsible field
    return r===n || r.indexOf(n)>=0 || n.indexOf(r)>=0;
  });
}
function calcStats(projs, role){
  // Projetos que têm data real da etapa atual no trimestre corrente
  var qp = projs.filter(function(p){ return inCurrQ(p.realDate); });

  // Se nenhum tem data real, fallback para updatedAt (dados incompletos)
  if(qp.length === 0){
    qp = projs.filter(function(p){
      if(!p.updatedAt) return false;
      var n=new Date(), q2=Math.ceil((n.getMonth()+1)/3);
      var s=new Date(n.getFullYear(),(q2-1)*3,1), e=new Date(n.getFullYear(),q2*3,0,23,59,59);
      return new Date(p.updatedAt) >= s && new Date(p.updatedAt) <= e;
    });
  }

  var totalPts  = qp.reduce(function(s,p){ return s+p.pts; }, 0);
  var bonusBase = calcBase(role, totalPts);
  var tot       = qp.length;
  var onT       = qp.filter(function(p){ return p.onTime === true; }).length;
  var pct       = tot ? Math.round(onT/tot*100) : 0;
  var dlBonus   = calcDL(role, pct);
  var impl      = qp.filter(function(p){ return p.etapaKey === "Implantacao"; }).length;

  return {
    totalPts:  totalPts,
    bonusBase: bonusBase,
    dlBonus:   dlBonus,
    total:     bonusBase + dlBonus,
    pct:       pct,
    impl:      impl,
    qp:        qp,
    allProjs:  projs
  };
}

// ── DEMO DATA ─────────────────────────────────────
function demoData(){
  var people=[{nome:"Ana Souza",cargo:"analista_sr"},{nome:"Beatriz Lima",cargo:"analista_jr"},{nome:"Carla Matos",cargo:"assistente2"},{nome:"Daniela Costa",cargo:"assistente1"}];
  var etKeys=["Estruturacao","Cotacao","Contrato","Implantacao","Medicao","Implantacao","Contrato","Estruturacao","Cotacao","Medicao"];
  var comps=["Baixa","Media","Alta","Media","Alta","Baixa","Alta","Media","Baixa","Alta"];
  var nomes=["Projeto Gas Natural","Renova\u00e7\u00e3o Contratos","Automa\u00e7\u00e3o Faturamento","Lei do Bem 2025","Expans\u00e3o SP Interior","BI Comercial","Integra\u00e7\u00e3o ERP","Eventos Q2","Startup Log\u00edstica","POC IA Previs\u00e3o"];
  var now=new Date();
  return nomes.map(function(n,i){
    var p=people[i%people.length],ek=etKeys[i],comp=comps[i];
    var days=Math.floor(Math.random()*70);
    var updatedAt=new Date(now-days*86400000).toISOString();
    return{id:"d"+i,name:n,etapaKey:ek,etapa:ETAPA_KEY[ek]||ek,comp:comp,resp:p.nome,cargo:p.cargo,dl:new Date(now-(days-5)*86400000).toISOString().split("T")[0],onTime:Math.random()>.3,pts:calcPts(p.cargo,ek,comp),updatedAt:updatedAt,createdAt:updatedAt};
  });
}

// ── SYNC ──────────────────────────────────────────
async function doSync(){
  document.getElementById("sdot").classList.add("spin");
  document.getElementById("sTime").textContent="Sincronizando...";
  document.getElementById("sIcon").classList.add("fa-spin");
  var res=await fetchBoard();
  var banner="";
  if(res.items&&res.items.length){
    S.projects=res.items.map(mapItem);
    banner='<div class="sync-banner"><i class="fas fa-check-circle"></i> '+res.items.length+' projetos sincronizados do Monday.com</div>';
  }else{
    S.projects=demoData();
    banner='<div class="sync-banner warn"><i class="fas fa-exclamation-triangle"></i> Erro ao conectar com Monday.com via proxy. Verifique os logs do Railway.</div>';
  }
  var b=document.getElementById("syncBanner");if(b)b.innerHTML=banner;
  document.getElementById("sdot").classList.remove("spin");
  document.getElementById("sTime").textContent=res.live?"Monday \u2713 "+new Date().toLocaleTimeString("pt-BR"):"Demo "+new Date().toLocaleTimeString("pt-BR");
  document.getElementById("sIcon").classList.remove("fa-spin");
  refreshCurrent();
}

// ── LOGIN ─────────────────────────────────────────
// Managers/directors with full access

function doLogin(){
  var role = document.getElementById("loginRole").value;
  var name = document.getElementById("loginName").value.trim();
  if(!role){ notif("⚠️ Selecione seu cargo!"); return; }
  if(!name){ notif("⚠️ Digite seu nome!"); return; }
  // Luciana e Alan: cargo fixo independente do que selecionou
  var ln = name.toLowerCase().trim();
  if(ln === "luciana gomes") role = "gerente";
  if(ln === "alan kadri")    role = "diretor";
  S.user = {role:role, name:name};
  startApp();
}

function doLogout(){
  if(S.timer)clearInterval(S.timer);
  S.user=null;
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}
function startApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  var role=S.user.role,name=S.user.name;
  var init=name.split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();
  document.getElementById("sbAv").textContent=init;
  document.getElementById("sbName").textContent=name;
  document.getElementById("sbRole").textContent=RL[role]||role;
  document.getElementById("dName").textContent=name.split(" ")[0];
  document.getElementById("qLabel").textContent=currQ();
  var mgr=role==="gerente"||role==="diretor";
  document.querySelectorAll(".mgr").forEach(function(el){el.classList.toggle("hidden",!mgr);});
  go("dashboard");
  doSync();
  if(S.timer)clearInterval(S.timer);
  S.timer=setInterval(doSync,5*60*1000);
}

// ── NAVIGATION ───────────────────────────────────
var PNAMES={dashboard:"Dashboard",trilha:"Minha Trilha",pontos:"Pontua\u00e7\u00e3o",projetos:"Projetos",equipe:"Equipe",validacao:"Valida\u00e7\u00e3o",relatorio:"Relat\u00f3rios"};
function go(name){
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("act");p.style.display="none";});
  var pg=document.getElementById("p-"+name);if(pg){pg.classList.add("act");pg.style.display="block";}
  document.querySelectorAll(".ni").forEach(function(n){n.classList.remove("act");});
  var nav=document.getElementById("n-"+name);if(nav)nav.classList.add("act");
  document.getElementById("bc").textContent=PNAMES[name]||name;
  refresh(name);
}
function refresh(n){
  if(n==="dashboard")rDash();
  else if(n==="trilha")rTrilha();
  else if(n==="pontos")rPontos();
  else if(n==="projetos")rProjetos();
  else if(n==="equipe")rEquipe();
  else if(n==="validacao")rValidacao();
  else if(n==="relatorio")rRelatorio();
  else if(n==="avatar")rAvatar();
}
function refreshCurrent(){var pg=document.querySelector(".page.act");if(pg)refresh(pg.id.replace("p-",""));}
function toggleSB(){document.getElementById("sb").classList.toggle("col");}

// ── DASHBOARD ─────────────────────────────────────
function rDash(){
  var role=S.user.role,name=S.user.name;
  var mgr=role==="gerente"||role==="diretor";
  var projs=mgr?S.projects:userProjects(name);
  var st=calcStats(projs,role);
  var pctLabel=st.pct>=80?"\u00d3timo desempenho":st.pct>=50?"Pode melhorar":"Aten\u00e7\u00e3o";
  var pctIcon=st.pct>=80?"check":"minus";
  document.getElementById("sg").innerHTML=
    '<div class="sc pri"><div class="si"><i class="fas fa-star"></i></div><div><div class="sv" id="svPts">0</div><div class="sl">Pontos no Trimestre</div></div><div class="st up"><i class="fas fa-arrow-up"></i> Trimestre atual</div></div>'+
    '<div class="sc suc"><div class="si"><i class="fas fa-trophy"></i></div><div><div class="sv">'+fmt(st.bonusBase)+'</div><div class="sl">B\u00f4nus Base Projetado</div></div><div class="st"><i class="fas fa-info-circle"></i> Baseado nos pontos</div></div>'+
    '<div class="sc war"><div class="si"><i class="fas fa-clock"></i></div><div><div class="sv">'+st.pct+'%</div><div class="sl">Entregas no Prazo</div></div><div class="st '+(st.pct>=80?"up":"")+'"><i class="fas fa-'+pctIcon+'-circle"></i> '+pctLabel+'</div></div>'+
    '<div class="sc inf"><div class="si"><i class="fas fa-layer-group"></i></div><div><div class="sv">'+projs.filter(function(p){return p.etapaKey!=="Concluido";}).length+'</div><div class="sl">Projetos Ativos</div></div><div class="st"><i class="fas fa-project-diagram"></i> Monday.com</div></div>';
  animN("svPts",st.totalPts);
  document.getElementById("bBase").textContent=fmt(st.bonusBase);
  document.getElementById("bPrazo").textContent=fmt(st.dlBonus);
  document.getElementById("bTotal").textContent=fmt(st.total);
  var ct=curTier(role,st.totalPts);
  document.getElementById("fi").textContent=ct&&ct.b>0?"\uD83C\uDFAF Faixa: "+st.totalPts+" pts \u2192 B\u00f4nus Base "+fmt(ct.b):"\uD83C\uDFAF Acumule pontos para seu primeiro b\u00f4nus!";
  var nt=nextTier(role,st.totalPts),ct2=curTier(role,st.totalPts);
  var pct2=0,lbl="";
  if(!nt){pct2=100;lbl="\uD83C\uDFC6 Teto m\u00e1ximo atingido!";}
  else{var rng=nt.min-(ct2?ct2.min:0),prog=st.totalPts-(ct2?ct2.min:0);pct2=Math.min(100,Math.round(prog/rng*100));lbl=st.totalPts+" pts \u2192 pr\u00f3xima faixa em "+nt.min+" pts ("+fmt(nt.b)+")";}
  document.getElementById("pLabel").textContent=lbl;
  document.getElementById("pPts").textContent=st.totalPts+" pts";
  document.getElementById("pBar").style.width=pct2+"%";
  document.getElementById("pTiers").innerHTML=(BT[role]||[]).map(function(t){return'<div class="pt '+(st.totalPts>=t.min?"act":"")+'"><div class="pp">'+t.min+'+</div><div class="pg">'+fmt(t.b)+'</div></div>';}).join("");
  var rec=st.qp.slice().sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).slice(0,6);
  document.getElementById("recAct").innerHTML=rec.length?rec.map(function(p){
    return '<div class="ai"><div class="aic '+eClass(p.etapaKey)+'">'+eIcon(p.etapaKey)+'</div><div style="flex:1"><div class="an">'+p.name+'</div><div class="am">'+p.etapa+' \u00b7 '+p.comp+' \u00b7 '+(p.resp||"\u2014")+'</div></div><div class="ap">'+(p.pts?"+"+p.pts:"\u2014")+" pts</div></div>";
  }).join(""):'<div class="empty"><i class="fas fa-inbox"></i><p>Nenhuma atividade este trimestre</p></div>';
}


// ── TRILHA ────────────────────────────────────────
function rTrilha(){
  var role = S.user.role, name = S.user.name;
  var myProjs = isMgr(name) ? S.projects : userProjects(name);
  var wrap = document.getElementById("trilhaWrap");

  if(!myProjs.length){
    wrap.innerHTML = '<div class="empty"><i class="fas fa-inbox"></i><p>Nenhum projeto encontrado.</p></div>';
    return;
  }

  // Validate selection
  if(S.trilhaSelectedId && !myProjs.find(function(p){return p.id===S.trilhaSelectedId;}))
    S.trilhaSelectedId = null;
  if(!S.trilhaSelectedId) S.trilhaSelectedId = myProjs[0].id;

  var proj = myProjs.find(function(p){return p.id===S.trilhaSelectedId;}) || myProjs[0];
  var ec   = ETAPA_COLORS[proj.etapaKey] || "#7C3AED";

  var html = '<div class="trilha-page">';

  // ── Dropdown select ──────────────────────────────────────
  html += '<div class="trilha-drop-wrap">';
  html += '<label class="trilha-sel-label"><i class="fas fa-project-diagram"></i> Projeto</label>';
  html += '<select class="trilha-dropdown" onchange="selectTrilhaProject(this.value)">';
  myProjs.forEach(function(p){
    var color = ETAPA_COLORS[p.etapaKey]||"#7C3AED";
    html += '<option value="'+p.id+'"'+(p.id===S.trilhaSelectedId?' selected':'')+'>'+p.name+' — '+eBadgeName(p.etapaKey)+'</option>';
  });
  html += '</select></div>';

  // ── Project header ───────────────────────────────────────
  html += '<div class="roadmap-proj-header">';
  html += '<div class="rph-left"><i class="fas fa-project-diagram" style="color:'+ec+'"></i><div>';
  html += '<div class="rph-name">'+proj.name+'</div>';
  html += '<div class="rph-sub">'+(proj.resp||"—")+' &nbsp;·&nbsp; '+proj.comp+'</div></div></div>';
  html += '<span class="rph-etapa" style="background:'+ec+'22;color:'+ec+';border:1px solid '+ec+'44">'+eBadgeName(proj.etapaKey)+'</span>';
  html += '</div>';

  // ── Roadmap SVG ──────────────────────────────────────────
  html += buildRoadmap(proj, myProjs, name);
  html += '</div>';
  wrap.innerHTML = html;
}

var ETAPA_COLORS={
  "Estruturacao":"#3B82F6",
  "Cotacao":"#10B981",
  "Contrato":"#7C3AED",
  "Implantacao":"#EC4899",
  "Medicao":"#F59E0B",
  "Concluido":"#6B7280"
};

function eBadgeName(sk){
  return{"Estruturacao":"Estrutura\u00e7\u00e3o","Cotacao":"Cota\u00e7\u00e3o","Contrato":"Contrato","Implantacao":"Implanta\u00e7\u00e3o","Medicao":"Medi\u00e7\u00e3o","Concluido":"Conclu\u00eddo"}[sk]||sk;
}

function selectTrilhaProject(id){
  S.trilhaSelectedId = id;
  rTrilha();
}

function buildRoadmap(proj,myProjs,userName){
  // Current step index
  var curIdx=ETAPAS.findIndex(function(e){return e.sk===proj.etapaKey;});
  if(curIdx===-1)curIdx=ETAPAS.length-1;

  var personColor="#7C3AED";
  var personInit=(userName||"?").split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();

  // Node positions in SVG (serpentine: starts bottom-left, goes up-right)
  var W=980, H=340;
  var nodes=[
    {x:100, y:280},
    {x:270, y:185},
    {x:470, y:120},
    {x:670, y:70},
    {x:870, y:48}
  ];

  var html='<div class="roadmap-container">';

  // Project info header
  var ec=ETAPA_COLORS[proj.etapaKey]||"#7C3AED";
  html+='<div class="roadmap-proj-header">';
  html+='<div class="rph-left"><i class="fas fa-project-diagram" style="color:'+ec+'"></i><div><div class="rph-name">'+proj.name+'</div><div class="rph-sub">'+proj.comp+' &nbsp;\u00b7&nbsp; '+(proj.resp||"\u2014")+'</div></div></div>';
  html+='<span class="rph-etapa" style="background:'+ec+'22;color:'+ec+';border:1px solid '+ec+'44">'+eBadgeName(proj.etapaKey)+'</span>';
  html+='</div>';

  // SVG road
  html+='<div class="roadmap-svg-outer"><svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" class="roadmap-svg">';

  // Defs
  html+='<defs>';
  // Glow filter
  html+='<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  html+='<filter id="glowSm" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  // Avatar clip
  html+='<clipPath id="avClip"><circle cx="0" cy="0" r="18"/></clipPath>';
  html+='</defs>';

  // Road path control points
  var road="M60,300 C110,300 140,250 210,210 C290,165 350,155 430,130 C510,105 580,95 650,80 C730,65 800,58 900,45";

  // Road shadow
  html+='<path d="'+road+'" stroke="rgba(0,0,0,0.45)" stroke-width="58" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  // Road body dark
  html+='<path d="'+road+'" stroke="#1e293b" stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  // Road texture
  html+='<path d="'+road+'" stroke="#0f172a" stroke-width="44" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  // Road edges (lighter strip)
  html+='<path d="'+road+'" stroke="rgba(71,85,105,0.6)" stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
  html+='<path d="'+road+'" stroke="#0f172a" stroke-width="44" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  // Center dashed line yellow
  html+='<path d="'+road+'" stroke="rgba(250,204,21,0.55)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="22 16"/>';

  // Completed road highlight (up to current step)
  if(curIdx>=0){
    // We approximate by drawing a gradient line on top for done portion
    for(var ci=0;ci<=curIdx;ci++){
      var nc=nodes[ci];
      if(ci>0){
        var np=nodes[ci-1];
        html+='<line x1="'+np.x+'" y1="'+np.y+'" x2="'+nc.x+'" y2="'+nc.y+'" stroke="'+ec+'" stroke-width="4" opacity="0.35" stroke-linecap="round"/>';
      }
    }
  }

  // Arrow at end
  html+='<polygon points="935,38 910,28 912,45 880,48 882,58 912,55 910,72" fill="#F59E0B" opacity="0.85"/>';

  // Draw step nodes
  ETAPAS.forEach(function(e,i){
    var n=nodes[i];
    var done=i<curIdx;
    var current=i===curIdx;
    var locked=i>curIdx;
    var color=ETAPA_COLORS[e.sk]||"#7C3AED";

    // Outer glow ring (current only)
    if(current){
      html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="40" fill="'+color+'" opacity="0.12" filter="url(#glow)"/>';
      html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="34" fill="none" stroke="'+color+'" stroke-width="2.5" opacity="0.5" stroke-dasharray="6 4"/>';
    }

    // Circle fill
    var fillColor=done?color:current?color:"rgba(30,41,59,0.95)";
    var strokeColor=done?color:current?color:"rgba(100,116,139,0.5)";
    var strokeW=done?0:current?0:1.5;
    html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="28" fill="'+fillColor+'" stroke="'+strokeColor+'" stroke-width="'+strokeW+'" filter="url(#glowSm)"/>';

    // Inner dark overlay for text contrast
    if(!locked)html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="21" fill="rgba(0,0,0,0.3)"/>';

    // Number or check
    if(done){
      html+='<text x="'+n.x+'" y="'+(n.y+6)+'" text-anchor="middle" font-size="16" font-family="Inter,sans-serif" fill="white">\u2713</text>';
    }else if(locked){
      html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="28" fill="rgba(15,23,42,0.8)" stroke="rgba(100,116,139,0.3)" stroke-width="1.5"/>';
      html+='<text x="'+n.x+'" y="'+(n.y+5)+'" text-anchor="middle" font-size="18" font-family="Inter,sans-serif" fill="rgba(100,116,139,0.5)">\uD83D\uDD12</text>';
    }else{
      html+='<text x="'+n.x+'" y="'+(n.y+6)+'" text-anchor="middle" font-size="14" font-weight="900" font-family="Inter,sans-serif" fill="white">0'+(i+1)+'</text>';
    }

    // Label — alternate above/below
    var lblY=i%2===0?n.y+64:n.y-52;
    var lineY1=i%2===0?n.y+28:n.y-28;
    var lineY2=i%2===0?lblY-20:lblY+20;
    var lColor=locked?"rgba(100,116,139,0.4)":done?"rgba(255,255,255,0.5)":color;

    // Connector line
    html+='<line x1="'+n.x+'" y1="'+lineY1+'" x2="'+n.x+'" y2="'+lineY2+'" stroke="'+lColor+'" stroke-width="1.5" stroke-dasharray="4 3"/>';

    // Label box
    var boxW=140, boxH=40, bx=n.x-boxW/2, by=i%2===0?lblY-20:lblY-20;
    if(bx<4)bx=4; if(bx+boxW>W-4)bx=W-4-boxW;
    var boxFill=current?"rgba(15,12,41,0.95)":"rgba(15,23,42,0.82)";
    var boxBorder=locked?"rgba(100,116,139,0.2)":done?color+"66":color;
    html+='<rect x="'+bx+'" y="'+by+'" width="'+boxW+'" height="'+boxH+'" rx="10" fill="'+boxFill+'" stroke="'+boxBorder+'" stroke-width="'+(current?"2":"1.2")+'"/>';
    html+='<text x="'+n.x+'" y="'+(by+15)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="'+lColor+'" font-family="Inter,sans-serif">'+e.key+'</text>';

    var subTxt=done?"\u2705 Conclu\u00edda":current?"\u{1F4CD} Etapa atual":"\u{1F512} Bloqueada";
    var subColor=done?"rgba(52,211,153,0.8)":current?"rgba(255,255,255,0.7)":"rgba(100,116,139,0.45)";
    html+='<text x="'+n.x+'" y="'+(by+30)+'" text-anchor="middle" font-size="9.5" fill="'+subColor+'" font-family="Inter,sans-serif">'+subTxt+'</text>';
  });

  // Avatar of the user at current position
  if(curIdx>=0&&curIdx<nodes.length){
    var an=nodes[curIdx];
    var avX=an.x+36, avY=an.y-36;
    // Shadow
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="22" fill="rgba(0,0,0,0.45)"/>';
    // Avatar
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="20" fill="'+personColor+'" stroke="white" stroke-width="2.5" filter="url(#glow)"/>';
    html+='<text x="'+avX+'" y="'+(avY+5)+'" text-anchor="middle" font-size="11" font-weight="800" fill="white" font-family="Inter,sans-serif">'+personInit+'</text>';
    // Pulse ring
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="22" fill="none" stroke="'+personColor+'" stroke-width="2" opacity="0.5"><animate attributeName="r" values="22;30;22" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite"/></circle>';
    // "Você está aqui" label
    html+='<rect x="'+(avX-38)+'" y="'+(avY-38)+'" width="76" height="18" rx="9" fill="'+ec+'" opacity="0.9"/>';
    html+='<text x="'+avX+'" y="'+(avY-25)+'" text-anchor="middle" font-size="9" font-weight="700" fill="white" font-family="Inter,sans-serif">Voc\u00ea est\u00e1 aqui!</text>';
  }

  html+='</svg></div>';

  // Step detail cards
  html+='<div class="roadmap-steps-row">';
  ETAPAS.forEach(function(e,i){
    var done=i<curIdx;
    var current=i===curIdx;
    var locked=i>curIdx;
    var color=ETAPA_COLORS[e.sk]||"#7C3AED";
    var t=SC[S.user.role]||SC["analista_jr"];
    var te=t[e.sk];
    var pts=te?Object.values(te).join("/"):"-";

    html+='<div class="rs-card'+(current?" rs-current":"")+(done?" rs-done":"")+(locked?" rs-locked":"")+(current?" rs-cur-color":"")+'" style="'+(current?"border-color:"+color+";box-shadow:0 0 0 1px "+color+"33":"")+(done?"border-color:rgba(52,211,153,0.3)":"")+(locked?"opacity:0.45":"")+'">';
    html+='<div class="rs-num" style="background:'+(locked?"rgba(30,41,59,0.8)":color)+'">';
    if(done)html+='\u2713'; else if(locked)html+='\uD83D\uDD12'; else html+='0'+(i+1);
    html+='</div>';
    html+='<div class="rs-name" style="color:'+(locked?"rgba(100,116,139,0.5)":done?"rgba(255,255,255,0.65)":color)+'">'+e.key+'</div>';
    if(!locked&&te)html+='<div class="rs-pts">'+pts+' pts</div>';
    if(current)html+='<div class="rs-badge-here">\u{1F4CD} Aqui</div>';
    if(done)html+='<div class="rs-badge-done">\u2713 OK</div>';
    html+='</div>';
  });
  html+='</div>';

  // Info box for current step
  html+='<div class="roadmap-info-box" style="border-color:'+ec+'33;background:'+ec+'0a">';
  html+='<div class="rib-title" style="color:'+ec+'"><i class="fas fa-info-circle"></i> Etapa atual: '+eBadgeName(proj.etapaKey)+'</div>';
  var curEtapa=ETAPAS.find(function(e){return e.sk===proj.etapaKey;})||ETAPAS[0];
  html+='<div class="rib-desc">'+curEtapa.desc+'</div>';
  html+='<div class="rib-meta"><span><i class="fas fa-clock" style="color:'+ec+'"></i> Prazo: '+curEtapa.prazo+'</span>';
  var t2=SC[S.user.role]||SC["analista_jr"];var te2=t2[curEtapa.sk];
  if(te2)html+='<span><i class="fas fa-star" style="color:'+ec+'"></i> Pontos: '+Object.values(te2).join(" / ")+' (B/M/A)</span>';
  html+='</div></div>';

  html+='</div>'; // roadmap-container
  return html;
}


// ── PONTOS ────────────────────────────────────────
function rPontos(){
  var role=S.user.role,name=S.user.name;
  var mgr=role==="gerente"||role==="diretor";
  var projs=mgr?S.projects:userProjects(name);
  var st=calcStats(projs,role);
  var th="";
  if(role==="assistente1"){
    th='<table class="ptable"><tr><th>Etapa</th><th>Compl.</th><th>Pontos</th></tr><tr><td>Cota\u00e7\u00e3o</td><td>Baixa</td><td class="pts-b">2</td></tr><tr><td>Cota\u00e7\u00e3o</td><td>M\u00e9dia</td><td class="pts-b">3</td></tr><tr><td>Cota\u00e7\u00e3o</td><td>Alta</td><td class="pts-b">4</td></tr></table>';
  }else{
    var t=SC[role]||SC["analista_jr"];
    th='<table class="ptable"><tr><th>Etapa</th><th>Baixa</th><th>M\u00e9dia</th><th>Alta</th></tr>';
    ETAPAS.forEach(function(e){var te=t[e.sk];if(te)th+='<tr><td>'+e.key+'</td><td class="pts-b">'+te.Baixa+'</td><td class="pts-b">'+te.Media+'</td><td class="pts-b">'+te.Alta+'</td></tr>';});
    th+='</table>';
  }
  document.getElementById("ptWrap").innerHTML=th;
  var sorted=st.qp.slice().sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);});
  document.getElementById("histPts").innerHTML=sorted.length?sorted.map(function(p){
    return '<div class="ai"><div class="aic '+eClass(p.etapaKey)+'">'+eIcon(p.etapaKey)+'</div><div style="flex:1"><div class="an">'+p.name+'</div><div class="am">'+p.etapa+' \u00b7 '+p.comp+' \u00b7 '+fmtD(p.updatedAt)+'</div></div><div style="text-align:right"><div class="ap">'+(p.pts?"+"+p.pts:"\u2014")+" pts</div><div style=\"font-size:11px;color:rgba(255,255,255,.3);margin-top:2px\">"+(p.onTime===true?"\u2705 No prazo":p.onTime===false?"\u26a0\ufe0f Atrasado":"\u2014")+"</div></div></div>";
  }).join(""):'<div class="empty"><i class="fas fa-inbox"></i><p>Nenhuma atividade este trimestre</p></div>';
}

// ── PROJETOS ─────────────────────────────────────
var _ap=[];
function rProjetos(){
  var mgr=S.user.role==="gerente"||S.user.role==="diretor";
  _ap=mgr?S.projects:userProjects(S.user.name);
  renderCards(_ap);
}
function renderCards(projs){
  var el=document.getElementById("pGrid");
  if(!projs.length){el.innerHTML='<div class="empty" style="grid-column:1/-1"><i class="fas fa-inbox"></i><p>Nenhum projeto encontrado</p></div>';return;}
  el.innerHTML=projs.map(function(p){
    var dlHtml="";
    if(p.onTime===true)dlHtml='<div class="pdl dl-ok"><i class="fas fa-check-circle"></i> No prazo</div>';
    else if(p.onTime===false)dlHtml='<div class="pdl dl-late"><i class="fas fa-exclamation-circle"></i> Atrasado</div>';
    else dlHtml='<div class="pdl dl-na"><i class="fas fa-clock"></i> '+(p.dl?"Prazo: "+p.dl:"Sem prazo")+'</div>';
    return '<div class="pcard" onclick="openMod(\''+p.id+'\')"><div class="pch"><div class="pname">'+p.name+'</div><span class="pe '+eBadge(p.etapaKey)+'">'+p.etapa+'</span></div><div class="pmeta"><span class="pbadge '+cBadge(p.comp)+'">'+p.comp+'</span><span class="pbadge">'+(RL[p.cargo]||p.cargo)+'</span></div><div class="pperson"><i class="fas fa-user-circle"></i> '+(p.resp||"\u2014")+'</div>'+(p.pts?'<div class="ppts">'+p.pts+' <span>pontos</span></div>':"")+dlHtml+'</div>';
  }).join("");
}
function filt(){
  var s=document.getElementById("srch").value.toLowerCase();
  var e=document.getElementById("fEtapa").value;
  var c=document.getElementById("fComp").value;
  renderCards(_ap.filter(function(p){
    return(!s||p.name.toLowerCase().indexOf(s)>=0||(p.resp||"").toLowerCase().indexOf(s)>=0)&&(!e||p.etapa===e)&&(!c||p.comp===c);
  }));
}
function openMod(id){
  var p=S.projects.find(function(x){return x.id===id;});if(!p)return;
  document.getElementById("modTitle").textContent=p.name;
  var t=SC[p.cargo]||SC["analista_jr"];var row=t[p.etapaKey];
  var rowHtml="";
  if(p.cargo==="assistente1"&&p.etapaKey!=="Cotacao")rowHtml="<p style='color:rgba(255,255,255,.4);font-size:13px'>Assistente I pontua apenas na Cota\u00e7\u00e3o.</p>";
  else if(row)rowHtml='<table class="ptable"><tr><th>Etapa</th><th>Baixa</th><th>M\u00e9dia</th><th>Alta</th></tr><tr><td>'+p.etapa+'</td><td class="pts-b">'+row.Baixa+'</td><td class="pts-b">'+row.Media+'</td><td class="pts-b">'+row.Alta+'</td></tr></table>';
  else rowHtml="<p style='color:rgba(255,255,255,.4);font-size:13px'>Etapa n\u00e3o pontu\u00e1vel para este cargo.</p>";
  document.getElementById("modBody").innerHTML='<div class="mgrid"><div class="mf"><label>Etapa</label><value><span class="pe '+eBadge(p.etapaKey)+'" style="display:inline-block">'+p.etapa+'</span></value></div><div class="mf"><label>Complexidade</label><value><span class="pbadge '+cBadge(p.comp)+'" style="display:inline-block">'+p.comp+'</span></value></div><div class="mf"><label>Respons\u00e1vel</label><value>'+(p.resp||"\u2014")+'</value></div><div class="mf"><label>Cargo</label><value>'+(RL[p.cargo]||p.cargo)+'</value></div><div class="mf"><label>Prazo</label><value>'+(p.dl||"N\u00e3o definido")+'</value></div><div class="mf"><label>Status</label><value>'+(p.onTime===true?"\u2705 No prazo":p.onTime===false?"\u26a0\ufe0f Atrasado":"\u2014")+'</value></div><div class="mf"><label>Pontos</label><value style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#A78BFA,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">'+p.pts+'</value></div><div class="mf"><label>Atualizado</label><value>'+fmtD(p.updatedAt)+'</value></div></div><div class="msect">Pontua\u00e7\u00e3o \u2014 '+p.etapa+'</div>'+rowHtml;
  document.getElementById("modOv").classList.remove("hidden");
}
function closeMod(){document.getElementById("modOv").classList.add("hidden");}

// ── EQUIPE ────────────────────────────────────────
function rEquipe(){
  var arr=groupByPerson().map(function(m,i){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo),ci:i});});
  arr.sort(function(a,b){return b.stats.totalPts-a.stats.totalPts;});
  document.getElementById("teamGrid").innerHTML=arr.length?arr.map(function(m){
    var init=m.name.split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();
    return '<div class="tmcard"><div class="tmav" style="background:'+COLS[m.ci%COLS.length]+'">'+init+'</div><div class="tmname">'+m.name+'</div><div class="tmrole">'+(RL[m.cargo]||m.cargo)+'</div><div class="tmst"><div class="tmstv"><div class="tmstval">'+m.stats.totalPts+'</div><div class="tmslab">Pontos</div></div><div class="tmstv"><div class="tmstval">'+m.stats.pct+'%</div><div class="tmslab">No prazo</div></div><div class="tmstv"><div class="tmstval">'+m.stats.impl+'</div><div class="tmslab">Impl.</div></div></div><div class="tmbonus">\uD83D\uDCB0 '+fmt(m.stats.total)+' b\u00f4nus projetado</div></div>';
  }).join(""):'<div class="empty"><i class="fas fa-users"></i><p>Sem dados</p></div>';
  document.getElementById("rankList").innerHTML=arr.map(function(m,i){
    var rc=i===0?"r1":i===1?"r2":i===2?"r3":"ro";var em=i===0?"\uD83E\uDD47":i===1?"\uD83E\uDD48":i===2?"\uD83E\uDD49":i+1;
    return '<div class="ri"><div class="rn '+rc+'">'+em+'</div><div style="flex:1"><div class="riname">'+m.name+'</div><div class="rirole">'+(RL[m.cargo]||m.cargo)+'</div></div><div class="ripts">'+m.stats.totalPts+' pts</div></div>';
  }).join("");
}

// ── VALIDAÇÃO ─────────────────────────────────────
function rValidacao(){
  var arr=groupByPerson().map(function(m){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo)});});
  var q=currQ();
  document.getElementById("valList").innerHTML=arr.map(function(m){
    var key=m.name+"_"+q;var appr=S.approvals[key];
    var btns=appr?'<button class="btn-aprd"><i class="fas fa-check-circle"></i> Aprovado</button>':'<button class="btn-adj" onclick="notif(\u0027Ajuste dispon\u00edvel no servidor Node.js\u0027)"><i class="fas fa-edit"></i> Ajustar</button><button class="btn-apr" onclick="aprBonus(\''+key+'\',\''+m.name+'\')"><i class="fas fa-check"></i> Aprovar '+fmt(m.stats.total)+'</button>';
    return '<div class="vc"><div class="vch"><div class="vperson">'+m.name+' \u2014 '+(RL[m.cargo]||m.cargo)+'</div><div class="vq">'+q+'</div></div><div class="vd"><div class="vdv"><div class="vdval">'+m.stats.totalPts+'</div><div class="vdlab">Pontos</div></div><div class="vdv"><div class="vdval">'+m.stats.pct+'%</div><div class="vdlab">No prazo</div></div><div class="vdv"><div class="vdval">'+fmt(m.stats.bonusBase)+'</div><div class="vdlab">B\u00f4nus Base</div></div><div class="vdv"><div class="vdval" style="color:#34D399">'+fmt(m.stats.total)+'</div><div class="vdlab">Total</div></div></div><div class="va">'+btns+'</div></div>';
  }).join("")||'<div class="empty"><i class="fas fa-inbox"></i><p>Sem dados</p></div>';
}
function aprBonus(key,name){S.approvals[key]=true;rValidacao();notif("\u2705 B\u00f4nus de "+name+" aprovado!");}

// ── RELATÓRIO ─────────────────────────────────────
var _ch={};
function rRelatorio(){
  var arr=groupByPerson().map(function(m){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo)});});
  document.getElementById("relSg").innerHTML=
    '<div class="sc pri"><div class="si"><i class="fas fa-users"></i></div><div><div class="sv">'+arr.length+'</div><div class="sl">Colaboradores</div></div></div>'+
    '<div class="sc suc"><div class="si"><i class="fas fa-star"></i></div><div><div class="sv">'+arr.reduce(function(s,m){return s+m.stats.totalPts;},0)+'</div><div class="sl">Pontos Totais</div></div></div>'+
    '<div class="sc war"><div class="si"><i class="fas fa-coins"></i></div><div><div class="sv">'+fmt(arr.reduce(function(s,m){return s+m.stats.total;},0))+'</div><div class="sl">B\u00f4nus Projetado</div></div></div>'+
    '<div class="sc inf"><div class="si"><i class="fas fa-layer-group"></i></div><div><div class="sv">'+arr.reduce(function(s,m){return s+m.stats.impl;},0)+'</div><div class="sl">Implementa\u00e7\u00f5es</div></div></div>';
  setTimeout(function(){
    var c1=document.getElementById("chPts"),c2=document.getElementById("chEt");
    if(_ch.p)_ch.p.destroy();
    _ch.p=new Chart(c1,{type:"bar",data:{labels:arr.map(function(m){return m.name.split(" ")[0];}),datasets:[{label:"Pontos",data:arr.map(function(m){return m.stats.totalPts;}),backgroundColor:COLS.slice(0,arr.length),borderRadius:8}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{color:"rgba(255,255,255,.45)"},grid:{color:"rgba(255,255,255,.055)"}},x:{ticks:{color:"rgba(255,255,255,.45)"},grid:{display:false}}}}});
    var ecnt={};ETAPAS.forEach(function(e){ecnt[e.key]=0;});S.projects.forEach(function(p){if(ecnt[p.etapa]!==undefined)ecnt[p.etapa]++;});
    if(_ch.e)_ch.e.destroy();
    _ch.e=new Chart(c2,{type:"doughnut",data:{labels:Object.keys(ecnt),datasets:[{data:Object.values(ecnt),backgroundColor:COLS,borderWidth:2,borderColor:"rgba(10,8,30,.8)"}]},options:{responsive:true,plugins:{legend:{position:"bottom",labels:{color:"rgba(255,255,255,.55)",padding:12}}}}});
  },100);
  var rows=['<table class="rtable"><tr><th>COLABORADOR</th><th>CARGO</th><th>PONTOS</th><th>% PRAZO</th><th>B\u00d4NUS BASE</th><th>B\u00d4NUS PRAZO</th><th>TOTAL</th></tr>'];
  arr.forEach(function(m){rows.push('<tr><td style="font-weight:600">'+m.name+'</td><td>'+(RL[m.cargo]||m.cargo)+'</td><td style="font-weight:800;background:linear-gradient(135deg,#A78BFA,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">'+m.stats.totalPts+'</td><td>'+m.stats.pct+'%</td><td>'+fmt(m.stats.bonusBase)+'</td><td>'+fmt(m.stats.dlBonus)+'</td><td style="font-weight:800;color:#34D399">'+fmt(m.stats.total)+'</td></tr>');});
  rows.push('</table>');
  document.getElementById("relTable").innerHTML=rows.join("");
  window._expData=arr;
}
function expCSV(){
  var data=window._expData||[];
  var rows=[["Colaborador","Cargo","Pontos","% No Prazo","Bonus Base","Bonus Prazo","Total"]];
  data.forEach(function(m){rows.push([m.name,RL[m.cargo]||m.cargo,m.stats.totalPts,m.stats.pct+"%",m.stats.bonusBase,m.stats.dlBonus,m.stats.total]);});
  var csv=rows.map(function(r){return r.join(";");}).join("\n");
  var blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="bonus_"+currQ().replace(" ","_")+".csv";a.click();
}

// ── HELPERS ──────────────────────────────────────
function groupByPerson(){
  var ppl={};
  S.projects.forEach(function(p){var k=p.resp||"Sem respons\u00e1vel";if(!ppl[k])ppl[k]={name:k,cargo:p.cargo,projs:[]};ppl[k].projs.push(p);});
  return Object.values(ppl);
}
function fmt(v){return"R$ "+(v||0).toLocaleString("pt-BR");}
function fmtD(s){if(!s)return"\u2014";return new Date(s).toLocaleDateString("pt-BR");}
function animN(id,target){
  var el=document.getElementById(id);if(!el)return;
  var cur=0,step=Math.max(1,Math.floor(target/30));
  var t=setInterval(function(){cur=Math.min(cur+step,target);el.textContent=cur;if(cur>=target)clearInterval(t);},30);
}
function eClass(sk){return{"Estruturacao":"e1","Cotacao":"e2","Contrato":"e3","Implantacao":"e4","Medicao":"e5"}[sk]||"e1";}
function eIcon(sk){return{"Estruturacao":'<i class="fas fa-drafting-compass"></i>',"Cotacao":'<i class="fas fa-search-dollar"></i>',"Contrato":'<i class="fas fa-file-contract"></i>',"Implantacao":'<i class="fas fa-rocket"></i>',"Medicao":'<i class="fas fa-chart-bar"></i>'}[sk]||'<i class="fas fa-star"></i>';}
function eBadge(sk){return{"Estruturacao":"pe-e1","Cotacao":"pe-e2","Contrato":"pe-e3","Implantacao":"pe-e4","Medicao":"pe-e5","Concluido":"pe-e6"}[sk]||"pe-e6";}
function cBadge(c){return{"Baixa":"pb-low","Media":"pb-med","Alta":"pb-hi"}[c]||"";}
function notif(msg){var n=document.createElement("div");n.className="notif";n.textContent=msg;document.body.appendChild(n);setTimeout(function(){n.remove();},3500);}



// ── AVATAR CREATOR ────────────────────────────────
var AV = {
  skin: "#F5C5A3",
  hair: "short",
  hairColor: "#3D2B1F",
  eyes: "normal",
  eyeColor: "#2C3E50",
  mouth: "smile",
  top: "#7C3AED",
  bg: "#1E1B4B",
  accessory: "none"
};
var AV_SAVED = false;

var AV_OPTIONS = {
  skin: ["#FDDBB4","#F5C5A3","#E8A87C","#C68642","#8D5524","#4A2912"],
  hairColor: ["#3D2B1F","#1C1C1C","#8B4513","#D4A017","#C0392B","#7F8C8D","#F0E6D3","#7C3AED"],
  eyeColor: ["#2C3E50","#1ABC9C","#3498DB","#8E44AD","#27AE60","#E67E22","#95A5A6"],
  top: ["#7C3AED","#EC4899","#10B981","#3B82F6","#F59E0B","#EF4444","#1E293B","#0EA5E9","#8B5CF6","#F97316"],
  bg: ["#1E1B4B","#0F172A","#134E4A","#450A0A","#1E3A5F","#3B0764","#1A2E05","#1C1917"]
};

var AV = {skin:"#F5C5A3",hair:"short",hairColor:"#3D2B1F",eyes:"normal",eyeColor:"#2C3E50",mouth:"smile",top:"#7C3AED",bg:"#1E1B4B",accessory:"none"};
var AV_OPTS = {
  skin:      ["#FDDBB4","#F5C5A3","#E8A87C","#C68642","#8D5524","#4A2912"],
  hairColor: ["#3D2B1F","#1C1C1C","#8B4513","#D4A017","#C0392B","#7F8C8D","#F0E6D3","#7C3AED"],
  eyeColor:  ["#2C3E50","#1ABC9C","#3498DB","#8E44AD","#27AE60","#E67E22","#95A5A6"],
  top:       ["#7C3AED","#EC4899","#10B981","#3B82F6","#F59E0B","#EF4444","#1E293B","#0EA5E9","#8B5CF6"],
  bg:        ["#1E1B4B","#0F172A","#134E4A","#450A0A","#1E3A5F","#3B0764","#1A2E05","#1C1917"]
};

function drawAvatar(cfg, id){
  var svg = document.getElementById(id); if(!svg) return;
  var c = cfg||AV;
  var hair={
    short:    '<path d="M30,42 Q30,18 50,18 Q70,18 70,42 Q68,28 50,26 Q32,28 30,42Z" fill="'+c.hairColor+'"/>',
    long:     '<path d="M28,46 Q28,16 50,16 Q72,16 72,46 Q70,30 50,28 Q30,30 28,46Z" fill="'+c.hairColor+'"/><rect x="28" y="55" width="6" height="28" rx="3" fill="'+c.hairColor+'"/><rect x="66" y="55" width="6" height="28" rx="3" fill="'+c.hairColor+'"/>',
    curly:    '<path d="M29,44 Q29,17 50,17 Q71,17 71,44Z" fill="'+c.hairColor+'"/><circle cx="30" cy="40" r="7" fill="'+c.hairColor+'"/><circle cx="38" cy="28" r="6" fill="'+c.hairColor+'"/><circle cx="50" cy="24" r="6" fill="'+c.hairColor+'"/><circle cx="62" cy="28" r="6" fill="'+c.hairColor+'"/><circle cx="70" cy="40" r="7" fill="'+c.hairColor+'"/>',
    bun:      '<path d="M31,44 Q31,19 50,19 Q69,19 69,44Z" fill="'+c.hairColor+'"/><circle cx="50" cy="19" r="11" fill="'+c.hairColor+'"/>',
    ponytail: '<path d="M30,43 Q30,18 50,18 Q70,18 70,43Z" fill="'+c.hairColor+'"/><rect x="47" y="17" width="6" height="30" rx="3" fill="'+c.hairColor+'"/>',
    none:     ''
  };
  var eyes={
    normal: '<ellipse cx="41" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="41" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="42" cy="51" r="1" fill="white"/><ellipse cx="59" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="59" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="60" cy="51" r="1" fill="white"/>',
    happy:  '<path d="M37,52 Q41,57 45,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M55,52 Q59,57 63,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    wink:   '<ellipse cx="41" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="41" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="42" cy="51" r="1" fill="white"/><path d="M55,52 Q59,56 63,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    cool:   '<rect x="35" y="49" width="11" height="7" rx="3.5" fill="#111"/><ellipse cx="40.5" cy="52.5" rx="3" ry="2.5" fill="'+c.eyeColor+'"/><rect x="54" y="49" width="11" height="7" rx="3.5" fill="#111"/><ellipse cx="59.5" cy="52.5" rx="3" ry="2.5" fill="'+c.eyeColor+'"/>',
    stars:  '<text x="36" y="57" font-size="10" fill="'+c.eyeColor+'">★</text><text x="54" y="57" font-size="10" fill="'+c.eyeColor+'">★</text>'
  };
  var mouth={
    smile:   '<path d="M41,64 Q50,71 59,64" stroke="#922B21" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    grin:    '<path d="M40,63 Q50,73 60,63" stroke="#922B21" stroke-width="2" fill="#E74C3C" stroke-linecap="round"/><path d="M44,68 Q50,72 56,68" stroke="white" stroke-width="1.5" fill="none"/>',
    neutral: '<line x1="43" y1="65" x2="57" y2="65" stroke="#922B21" stroke-width="2.5" stroke-linecap="round"/>',
    open:    '<ellipse cx="50" cy="65" rx="8" ry="5.5" fill="#922B21"/><ellipse cx="50" cy="65" rx="6" ry="3.5" fill="#7B241C"/>'
  };
  var acc={
    none:     '',
    glasses:  '<rect x="33" y="48" width="13" height="9" rx="4" stroke="#7C3AED" stroke-width="2" fill="none"/><rect x="54" y="48" width="13" height="9" rx="4" stroke="#7C3AED" stroke-width="2" fill="none"/><line x1="46" y1="52" x2="54" y2="52" stroke="#7C3AED" stroke-width="1.5"/>',
    headband: '<rect x="25" y="35" width="50" height="7" rx="3.5" fill="'+c.top+'" opacity="0.9"/>',
    hat:      '<ellipse cx="50" cy="29" rx="27" ry="5" fill="'+c.hairColor+'"/><rect x="33" y="17" width="34" height="14" rx="4" fill="'+c.hairColor+'"/>',
    earrings: '<circle cx="26" cy="57" r="3.5" fill="#F59E0B"/><circle cx="74" cy="57" r="3.5" fill="#F59E0B"/>'
  };

  svg.innerHTML =
    '<circle cx="50" cy="50" r="50" fill="'+c.bg+'"/>'+
    '<ellipse cx="50" cy="96" rx="30" ry="18" fill="'+c.top+'"/>'+
    '<rect x="20" y="88" width="60" height="14" rx="8" fill="'+c.top+'"/>'+
    '<rect x="43" y="72" width="14" height="13" rx="5" fill="'+c.skin+'"/>'+
    '<ellipse cx="50" cy="50" rx="22" ry="24" fill="'+c.skin+'"/>'+
    (hair[c.hair]||'')+
    '<ellipse cx="28" cy="52" rx="4" ry="5.5" fill="'+c.skin+'"/>'+
    '<ellipse cx="72" cy="52" rx="4" ry="5.5" fill="'+c.skin+'"/>'+
    (eyes[c.eyes]||'')+
    '<path d="M47,57 Q50,61 53,57" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" fill="none" stroke-linecap="round"/>'+
    (mouth[c.mouth]||'')+
    '<path d="M37,47 Q41,44 45,47" stroke="'+c.hairColor+'" stroke-width="2" fill="none" stroke-linecap="round"/>'+
    '<path d="M55,47 Q59,44 63,47" stroke="'+c.hairColor+'" stroke-width="2" fill="none" stroke-linecap="round"/>'+
    (acc[c.accessory]||'');
}

function shadeColor(color, percent){
  var num=parseInt(color.replace('#',''),16),
    amt=Math.round(2.55*percent),
    R=(num>>16)+amt, G=(num>>8&0x00FF)+amt, B=(num&0x0000FF)+amt;
  return '#'+(0x1000000+(Math.max(0,Math.min(255,R)))*0x10000+(Math.max(0,Math.min(255,G)))*0x100+Math.max(0,Math.min(255,B))).toString(16).slice(1);
}

function rAvatar(){
  if(!S.user) return;
  try{var s=localStorage.getItem("av_"+S.user.name);if(s)Object.assign(AV,JSON.parse(s));}catch(e){}
  document.getElementById("avPrevName").textContent = S.user.name;
  document.getElementById("avPrevRole").textContent = RL[S.user.role]||S.user.role;
  buildAvControls();
  drawAvatar(AV,"avatarSVG");
}

function buildAvatarControls(){
  var sections=[
    {id:"skin",  label:"Tom de pele",   icon:"fa-hand-paper",  type:"color",  key:"skin",  opts:AV_OPTIONS.skin},
    {id:"hair",  label:"Cabelo",        icon:"fa-cut",         type:"btn",    key:"hair",  opts:[{v:"short",l:"Curto"},{v:"long",l:"Longo"},{v:"curly",l:"Cacheado"},{v:"bun",l:"Coque"},{v:"ponytail",l:"Rabo"},{v:"none",l:"Careca"}]},
    {id:"hcol",  label:"Cor do cabelo", icon:"fa-palette",     type:"color",  key:"hairColor", opts:AV_OPTIONS.hairColor},
    {id:"eyes",  label:"Olhos",         icon:"fa-eye",         type:"btn",    key:"eyes",  opts:[{v:"normal",l:"Normal"},{v:"happy",l:"Feliz"},{v:"wink",l:"Piscadela"},{v:"cool",l:"Cool"},{v:"stars",l:"Estrelas"}]},
    {id:"ecol",  label:"Cor dos olhos", icon:"fa-circle",      type:"color",  key:"eyeColor", opts:AV_OPTIONS.eyeColor},
    {id:"mouth", label:"Boca",          icon:"fa-smile",       type:"btn",    key:"mouth", opts:[{v:"smile",l:"Sorriso"},{v:"grin",l:"Risada"},{v:"neutral",l:"Neutro"},{v:"open",l:"Aberta"}]},
    {id:"acc",   label:"Acessório",     icon:"fa-glasses",     type:"btn",    key:"accessory", opts:[{v:"none",l:"Nenhum"},{v:"glasses",l:"Óculos"},{v:"headband",l:"Faixa"},{v:"hat",l:"Chapéu"},{v:"earrings",l:"Brinco"}]},
    {id:"top",   label:"Cor da roupa",  icon:"fa-tshirt",      type:"color",  key:"top",   opts:AV_OPTIONS.top},
    {id:"bg",    label:"Fundo",         icon:"fa-circle",      type:"color",  key:"bg",    opts:AV_OPTIONS.bg},
  ];

  var html="";
  sections.forEach(function(sec){
    html+='<div class="av-section"><div class="av-section-title"><i class="fas '+sec.icon+'"></i>'+sec.label+'</div>';
    if(sec.type==="color"){
      html+='<div class="av-colors">';
      sec.opts.forEach(function(col){
        html+='<div class="av-color'+(AV[sec.key]===col?" sel":"")+'" style="background:'+col+'" onclick="setAV(\''+sec.key+'\',\''+col+'\')"></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="av-options">';
      sec.opts.forEach(function(opt){
        html+='<button class="av-opt'+(AV[sec.key]===opt.v?" sel":"")+'" onclick="setAV(\''+sec.key+'\',\''+opt.v+'\')">'+opt.l+'</button>';
      });
      html+='</div>';
    }
    html+='</div>';
  });

  document.getElementById("avatarControls").innerHTML=html;
}

function setAV(key,val){
  AV[key]=val;
  buildAvControls();
  drawAvatar(AV,"avatarSVG");
}

function saveAvatar(){
  try{localStorage.setItem("av_"+S.user.name,JSON.stringify(AV));}catch(e){}
  var badge=document.getElementById("avBadge");
  if(badge){badge.classList.remove("hidden");setTimeout(function(){badge.classList.add("hidden");},3000);}
  updateSbAvatar();
  notif("✅ Avatar salvo com sucesso!");
}

function updateSidebarAvatar(){
  var el=document.getElementById("sbAv");
  if(!el)return;
  try{
    var saved=localStorage.getItem("av_"+S.user.name);
    if(saved){
      var av=JSON.parse(saved);
      // Replace text avatar with SVG mini
      el.innerHTML='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:44px;height:44px;border-radius:12px"></svg>';
      var miniSvg=el.querySelector("svg");
      if(miniSvg){miniSvg.id="sbAvSVG";drawAvatar(av,"sbAvSVG");}
      return;
    }
  }catch(e){}
}

function loadSavedAvatar(){
  if(!S.user) return;
  try{var s=localStorage.getItem("av_"+S.user.name);if(s)Object.assign(AV,JSON.parse(s));}catch(e){}
  updateSbAvatar();
}


function cvDate(item,keywords){
  for(var i=0;i<keywords.length;i++){
    var kw=keywords[i].toLowerCase();
    var col=(item.column_values||[]).find(function(c){
      var cid=c.id.toLowerCase().replace(/_/g," ");
      return cid.indexOf(kw)>=0||kw.indexOf(cid)>=0;
    });
    if(col){
      if(col.value){try{var v=JSON.parse(col.value);if(v&&v.date)return v.date;}catch(e){}}
      if(col.text&&col.text.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/))return col.text;
    }
  }
  return null;
}

function updateSbAvatar(){
  var el=document.getElementById("sbAv");if(!el)return;
  try{
    var s=localStorage.getItem("av_"+(S.user?S.user.name:""));
    if(s){
      var av=JSON.parse(s);
      el.style.padding="0";
      el.innerHTML='<svg id="sbAvSVG" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:44px;height:44px;border-radius:12px;display:block"></svg>';
      drawAvatar(av,"sbAvSVG");
    }
  }catch(e){}
}


function cvDate(item,keywords){
  for(var i=0;i<keywords.length;i++){
    var kw=keywords[i].toLowerCase().replace(/_/g," ");
    var col=(item.column_values||[]).find(function(c){
      var cid=c.id.toLowerCase().replace(/_/g," ");
      return cid.indexOf(kw)>=0;
    });
    if(col){
      if(col.value){try{var v=JSON.parse(col.value);if(v&&v.date)return v.date;}catch(e){}}
      if(col.text){var tm=col.text.match(/(\d{4}-\d{2}-\d{2})/);if(tm)return tm[1];}
    }
  }
  return null;
}

function buildAvControls(){
  var AVO=AV_OPTS;
  var secs=[
    {label:"Tom de pele",   icon:"fa-hand-paper", type:"color", key:"skin",      opts:AVO.skin},
    {label:"Cabelo",        icon:"fa-cut",         type:"btn",   key:"hair",      opts:[{v:"short",l:"Curto"},{v:"long",l:"Longo"},{v:"curly",l:"Cacheado"},{v:"bun",l:"Coque"},{v:"ponytail",l:"Rabo de cavalo"},{v:"none",l:"Careca"}]},
    {label:"Cor do cabelo", icon:"fa-palette",     type:"color", key:"hairColor", opts:AVO.hairColor},
    {label:"Olhos",         icon:"fa-eye",         type:"btn",   key:"eyes",      opts:[{v:"normal",l:"Normal"},{v:"happy",l:"Feliz"},{v:"wink",l:"Piscadela"},{v:"cool",l:"Oculos"},{v:"stars",l:"Estrelas"}]},
    {label:"Cor dos olhos", icon:"fa-circle",      type:"color", key:"eyeColor",  opts:AVO.eyeColor},
    {label:"Boca",          icon:"fa-smile",       type:"btn",   key:"mouth",     opts:[{v:"smile",l:"Sorriso"},{v:"grin",l:"Risada"},{v:"neutral",l:"Neutro"},{v:"open",l:"Aberta"}]},
    {label:"Acessorio",     icon:"fa-glasses",     type:"btn",   key:"accessory", opts:[{v:"none",l:"Nenhum"},{v:"glasses",l:"Oculos"},{v:"headband",l:"Faixa"},{v:"hat",l:"Chapeu"},{v:"earrings",l:"Brincos"}]},
    {label:"Cor da roupa",  icon:"fa-tshirt",      type:"color", key:"top",       opts:AVO.top},
    {label:"Fundo",         icon:"fa-circle",      type:"color", key:"bg",        opts:AVO.bg}
  ];
  var h="";
  secs.forEach(function(sec){
    h+='<div class="av-sec"><div class="av-sec-title"><i class="fas '+sec.icon+'"></i>'+sec.label+'</div>';
    if(sec.type==="color"){
      h+='<div class="av-colors">';
      sec.opts.forEach(function(col){
        var sel=AV[sec.key]===col?" sel":"";
        h+='<div class="av-col'+sel+'" style="background:'+col+'" onclick="setAV(\''+sec.key+'\',\''+col+'\')"></div>';
      });
      h+='</div>';
    } else {
      h+='<div class="av-btns">';
      sec.opts.forEach(function(o){
        var sel=AV[sec.key]===o.v?" sel":"";
        h+='<button class="av-btn'+sel+'" onclick="setAV(\''+sec.key+'\',\''+o.v+'\')">'+o.l+'</button>';
      });
      h+='</div>';
    }
    h+='</div>';
  });
  document.getElementById("avControls").innerHTML=h;
}

function updateSbAvatar(){
  var el=document.getElementById("sbAv");if(!el)return;
  try{
    var stored=localStorage.getItem("av_"+(S.user?S.user.name:""));
    if(stored){
      var av=JSON.parse(stored);
      el.style.padding="0";
      el.innerHTML='<svg id="sbAvSVG" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:44px;height:44px;border-radius:12px;display:block"></svg>';
      drawAvatar(av,"sbAvSVG");
    }
  }catch(ex){}
}


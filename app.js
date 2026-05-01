// ═══════════════════════════════════════════════════════
// GAMIFICAÇÃO INOVAÇÃO — app.js v3
// ═══════════════════════════════════════════════════════

// ── MANAGERS ────────────────────────────────────────────
var MANAGERS = ["luciana gomes","alan kadri"];
function isMgr(name){ return MANAGERS.indexOf((name||"").toLowerCase().trim()) >= 0; }

// ── CONFIG ───────────────────────────────────────────────
const MONDAY_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzMTkxMzAzOSwiYWFpIjoxMSwidWlkIjo2MDYyMjc5OCwiaWFkIjoiMjAyNi0wMy0xMVQxNzo0MToxMS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY0ODM4OTEsInJnbiI6InVzZTEifQ.g3HAx1OKRnapboEbgGOD3VKR4ABPKoZung9IyjLzC2Q";
const BOARD_ID  = "4879086777";

// ── SCORING ──────────────────────────────────────────────
const SC = {
  "assistente1":{"Cotacao":{"Baixa":2,"Media":3,"Alta":4}},
  "assistente2":{"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}},
  "analista_jr": {"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}},
  "analista_sr": {"Estruturacao":{"Baixa":2,"Media":3,"Alta":4},"Cotacao":{"Baixa":3,"Media":4,"Alta":6},"Contrato":{"Baixa":10,"Media":16,"Alta":24},"Implantacao":{"Baixa":10,"Media":30,"Alta":50},"Medicao":{"Baixa":5,"Media":8,"Alta":12}}
};

// ── BONUS TABLES ─────────────────────────────────────────
const BT = {
  "assistente1":[{min:0,b:0},{min:30,b:800},{min:60,b:1400},{min:80,b:2000}],
  "assistente2":[{min:0,b:0},{min:11,b:900},{min:35,b:1600},{min:70,b:2250}],
  "analista_jr":[{min:0,b:0},{min:45,b:800},{min:100,b:1500},{min:150,b:2250},{min:200,b:3250}],
  "analista_sr":[{min:0,b:0},{min:45,b:1800},{min:100,b:2500},{min:150,b:3400},{min:200,b:4250}]
};

// ── DEADLINE BONUS ───────────────────────────────────────
// index: 0=<50%, 1=50-69%, 2=70-79%, 3=80-89%, 4=90-99%, 5=100%
const DB = {
  "assistente1":[0,50,100,120,150,200],
  "assistente2":[0,50,100,120,150,200],
  "analista_jr":[0,80,150,220,270,300],
  "analista_sr":[0,150,250,400,550,600]
};

const RL = {
  "assistente1":"Assistente I","assistente2":"Assistente II",
  "analista_jr":"Analista J\u00fanior","analista_sr":"Analista S\u00eanior",
  "gerente":"Gerente","diretor":"Diretor"
};

const ETAPA_KEY = {
  "Estruturacao":"Estrutura\u00e7\u00e3o","Cotacao":"Cota\u00e7\u00e3o",
  "Contrato":"Contrato","Implantacao":"Implanta\u00e7\u00e3o","Medicao":"Medi\u00e7\u00e3o"
};

const ETAPAS = [
  {key:"Estrutura\u00e7\u00e3o",sk:"Estruturacao",icon:"fas fa-drafting-compass",prazo:"7 dias \u00fateis",
   desc:"Escopo completo no Monday, cronograma e valida\u00e7\u00e3o gerencial."},
  {key:"Cota\u00e7\u00e3o",sk:"Cotacao",icon:"fas fa-search-dollar",prazo:"30 dias corridos",
   desc:"Cota\u00e7\u00e3o com fornecedores, comparativo em farol e valida\u00e7\u00e3o."},
  {key:"Contrato",sk:"Contrato",icon:"fas fa-file-contract",prazo:"30 dias corridos",
   desc:"Negocia\u00e7\u00e3o, revis\u00e3o jur\u00eddica e assinatura do contrato."},
  {key:"Implanta\u00e7\u00e3o",sk:"Implantacao",icon:"fas fa-rocket",prazo:"Conforme cronograma",
   desc:"Execu\u00e7\u00e3o com evid\u00eancias, checklists e valida\u00e7\u00e3o da ger\u00eancia."},
  {key:"Medi\u00e7\u00e3o",sk:"Medicao",icon:"fas fa-chart-bar",prazo:"6+ meses p\u00f3s-implanta\u00e7\u00e3o",
   desc:"Levantamento de resultados e apresenta\u00e7\u00e3o \u00e0 diretoria."}
];

const COLS = ["#7C3AED","#EC4899","#10B981","#F59E0B","#3B82F6","#8B5CF6","#06B6D4","#F97316"];

// ── STATE ─────────────────────────────────────────────────
let S = {user:null, projects:[], approvals:{}, timer:null, filterQ:null, filterYear:null};

// ── MONDAY API ───────────────────────────────────────────
async function fetchBoard(){
  var q = "{boards(ids:["+BOARD_ID+"]){items_page(limit:200){items{id name state created_at updated_at column_values{id text value}}}}}";
  try {
    var r = await fetch("/api/monday",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q})});
    if(r.ok){
      var d = await r.json();
      if(d&&d.data&&d.data.boards&&d.data.boards[0]){
        var items = d.data.boards[0].items_page.items;
        console.log("[Monday] OK! Items:", items.length);
        return {items:items, live:true};
      }
      if(d&&d.errors) console.error("[Monday] Errors:", d.errors[0].message);
    }
  } catch(e){ console.warn("[Monday] proxy error:", e.message); }
  return {items:null, live:false};
}

// ── COLUMN HELPERS ────────────────────────────────────────
function getCol(item, keywords){
  for(var k=0;k<keywords.length;k++){
    var kw = keywords[k].toLowerCase().replace(/ /g,"_");
    var col = (item.column_values||[]).find(function(c){
      return c.id.toLowerCase().indexOf(kw) >= 0;
    });
    if(col && col.text) return col.text;
  }
  return "";
}

function getDate(item, keywords){
  for(var k=0;k<keywords.length;k++){
    var kw = keywords[k].toLowerCase().replace(/ /g,"_");
    var col = (item.column_values||[]).find(function(c){
      return c.id.toLowerCase().indexOf(kw) >= 0;
    });
    if(col){
      if(col.value){ try{ var v=JSON.parse(col.value); if(v&&v.date) return v.date; }catch(e){} }
      if(col.text){ var m=col.text.match(/(\d{4}-\d{2}-\d{2})/); if(m) return m[1]; }
    }
  }
  return null;
}

// ── PARSE HELPERS ─────────────────────────────────────────
function pComp(r){
  r=(r||"").toLowerCase();
  if(r.indexOf("alta")>=0||r.indexOf("high")>=0) return "Alta";
  if(r.indexOf("m")>=0&&(r.indexOf("dia")>=0||r.indexOf("ed")>=0)) return "Media";
  return "Baixa";
}

function pEtapa(r){
  r=(r||"").toLowerCase().trim();
  if(!r) return "Estruturacao";
  if(r.indexOf("medir result")>=0||r==="medir resultado"||r==="medir resultados") return "Medicao";
  if(r.indexOf("implement")>=0||r.indexOf("instal")>=0||r.indexOf("go-live")>=0) return "Implantacao";
  if(r.indexOf("assinatura")>=0||r.indexOf("contrat")>=0||r.indexOf("poc")>=0) return "Contrato";
  if(r.indexOf("cota")>=0) return "Cotacao";
  if(r.indexOf("estrut")>=0) return "Estruturacao";
  if(r.indexOf("conclu")>=0||r==="done") return "Concluido";
  return "Estruturacao";
}

function pCargo(r){
  r=(r||"").toLowerCase();
  if(r.indexOf("s\u00eanior")>=0||r.indexOf("senior")>=0||r.indexOf(" sr")>=0) return "analista_sr";
  if(r.indexOf("j\u00fanior")>=0||r.indexOf("junior")>=0||r.indexOf(" jr")>=0) return "analista_jr";
  if(r.indexOf("analista")>=0) return "analista_jr";
  if(r.indexOf("ii")>=0||r.indexOf(" 2")>=0) return "assistente2";
  return "assistente1";
}

// ── MAP MONDAY ITEM ───────────────────────────────────────
function mapItem(item){
  if(!window._colsLogged && item.column_values && item.column_values.length){
    window._colsLogged = true;
    console.log("[Monday] Column IDs:");
    item.column_values.forEach(function(c){ console.log("  '"+c.id+"' => '"+c.text+"'"); });
  }

  var statusRaw = getCol(item,["status"]) || "";
  var etapaKey  = pEtapa(statusRaw);
  var comp      = pComp(getCol(item,["complexidade","complexity","complex"]));

  // Responsible — "analista_responsavel" column
  var resp = getCol(item,["analista_responsavel","analista_respons","responsavel"]) || "";
  if(resp.indexOf(",")>=0) resp = resp.split(",")[0].trim();
  if(resp.indexOf(" e ")>=0) resp = resp.split(" e ")[0].trim();

  var cargo = pCargo(getCol(item,["cargo","role","funcao","nivel"]));

  // ── Real completion dates per stage ──────────────────────
  // Points only counted when "Data Real" is filled = stage completed
  var drEstrut   = getDate(item,["data_real_estruturacao","data_real_estrutu"]);
  var drCotacao  = getDate(item,["data_real_cotacao","data_real_cota"]);
  var drContrato = getDate(item,["data_real_contrato_fechado","data_real_contrato"]);
  var drImpl     = getDate(item,["data_real_implantacao","data_real_impl"]);
  var drMedicao  = getDate(item,["data_real_medicao_resultados","data_real_medicao"]);

  // ── Planned deadline dates per stage ─────────────────────
  var dpEstrut   = getDate(item,["fim_previsto_estruturacao"]);
  var dpCotacao  = getDate(item,["fim_previsto_cotacao"]);
  var dpContrato = getDate(item,["fim_previsto_contrato_fechado"]);
  var dpImpl     = getDate(item,["fim_previsto_implantacao"]);
  var dpMedicao  = getDate(item,["fim_previsto_medicao_resultados"]);

  // Real date & deadline for current stage
  var realDateMap = {Estruturacao:drEstrut,Cotacao:drCotacao,Contrato:drContrato,Implantacao:drImpl,Medicao:drMedicao};
  var prazoMap    = {Estruturacao:dpEstrut,Cotacao:dpCotacao,Contrato:dpContrato,Implantacao:dpImpl,Medicao:dpMedicao};

  var realDate = realDateMap[etapaKey] || null;
  var prazo    = prazoMap[etapaKey] || null;
  var onTime   = null;
  if(realDate && prazo) onTime = new Date(realDate) <= new Date(prazo);

  // Build all completed stages (those with a real date filled)
  var completedStages = [];
  var stageData = [
    {sk:"Estruturacao", realDate:drEstrut, prazo:dpEstrut},
    {sk:"Cotacao",      realDate:drCotacao, prazo:dpCotacao},
    {sk:"Contrato",     realDate:drContrato, prazo:dpContrato},
    {sk:"Implantacao",  realDate:drImpl,     prazo:dpImpl},
    {sk:"Medicao",      realDate:drMedicao,  prazo:dpMedicao}
  ];
  stageData.forEach(function(sd){
    if(sd.realDate){ // stage is complete only if real date filled
      var ot = sd.prazo ? new Date(sd.realDate) <= new Date(sd.prazo) : null;
      var pts = calcPts(cargo, sd.sk, comp);
      completedStages.push({sk:sd.sk, realDate:sd.realDate, prazo:sd.prazo, onTime:ot, pts:pts});
    }
  });

  return {
    id:item.id, name:item.name,
    etapaKey:etapaKey, etapa:ETAPA_KEY[etapaKey]||etapaKey,
    comp:comp, resp:resp, cargo:cargo,
    realDate:realDate, prazo:prazo, onTime:onTime,
    pts:calcPts(cargo,etapaKey,comp),
    completedStages:completedStages,
    updatedAt:item.updated_at, createdAt:item.created_at,
    _dr:{e:drEstrut,c:drCotacao,ct:drContrato,i:drImpl,m:drMedicao}
  };
}

// ── SCORING ENGINE ────────────────────────────────────────
function calcPts(cargo,sk,comp){
  if(cargo==="assistente1") return sk==="Cotacao"?(SC["assistente1"]["Cotacao"][comp]||2):0;
  var t=SC[cargo]; if(!t) return 0;
  var e=t[sk]; if(!e) return 0;
  return e[comp]||0;
}

function calcBase(role,pts){
  var t=BT[role]; if(!t) return 0;
  var b=0;
  for(var i=0;i<t.length;i++) if(pts>=t[i].min) b=t[i].b;
  return b;
}

function dlBonusIdx(pct){
  if(pct<50)  return 0;
  if(pct<70)  return 1;
  if(pct<80)  return 2;
  if(pct<90)  return 3;
  if(pct<100) return 4;
  return 5;
}

function calcDL(role,pct){
  return (DB[role]||[])[dlBonusIdx(pct)]||0;
}

function curTier(role,pts){
  var t=BT[role]; if(!t) return null;
  var ct=t[0];
  for(var i=0;i<t.length;i++) if(pts>=t[i].min) ct=t[i];
  return ct;
}

function nextTier(role,pts){
  return (BT[role]||[]).find(function(x){return pts<x.min;})||null;
}

// ── QUARTER UTILS ─────────────────────────────────────────
function currQ(){ var n=new Date(); return {q:Math.ceil((n.getMonth()+1)/3), y:n.getFullYear()}; }

function currQLabel(){ var c=currQ(); return "Q"+c.q+" "+c.y; }

function inQ(dateStr, q, y){
  if(!dateStr) return false;
  var d=new Date(dateStr);
  var s=new Date(y,(q-1)*3,1);
  var e=new Date(y,q*3,0,23,59,59);
  return d>=s && d<=e;
}

function getQRange(q,y){
  return {start:new Date(y,(q-1)*3,1), end:new Date(y,q*3,0,23,59,59)};
}

// ── FILTER PROJECTS BY USER ───────────────────────────────
function userProjects(name){
  if(!name) return S.projects;
  if(isMgr(name)) return S.projects;
  var n=name.toLowerCase().trim();
  return S.projects.filter(function(p){
    var r=(p.resp||"").toLowerCase().trim();
    return r===n || r.indexOf(n)>=0 || n.indexOf(r)>=0;
  });
}

// ── CALC STATS (uses completedStages + quarter filter) ────
function calcStats(projs, role, q, y){
  // Get quarter to evaluate
  var cq = q || currQ().q;
  var cy = y || currQ().y;

  // Collect all completed stages within the quarter
  var stagesInQ = [];
  projs.forEach(function(p){
    (p.completedStages||[]).forEach(function(st){
      if(inQ(st.realDate, cq, cy)){
        stagesInQ.push({proj:p, stage:st});
      }
    });
  });

  // Calculate points from completed stages in the quarter
  var totalPts = stagesInQ.reduce(function(s,x){ return s+x.stage.pts; }, 0);
  var bonusBase = calcBase(role, totalPts);

  // On-time calculation
  var withDeadline = stagesInQ.filter(function(x){ return x.stage.onTime !== null; });
  var onTimeCount  = withDeadline.filter(function(x){ return x.stage.onTime === true; }).length;
  var pct = withDeadline.length ? Math.round(onTimeCount/withDeadline.length*100) : 0;
  var dlBonus = calcDL(role, pct);

  var implCount = stagesInQ.filter(function(x){ return x.stage.sk==="Implantacao"; }).length;

  return {
    totalPts:totalPts, bonusBase:bonusBase, dlBonus:dlBonus,
    total:bonusBase+dlBonus, pct:pct, impl:implCount,
    stagesInQ:stagesInQ, withDeadline:withDeadline.length, onTimeCount:onTimeCount
  };
}

// ── SYNC ─────────────────────────────────────────────────
async function doSync(){
  document.getElementById("sdot").classList.add("spin");
  document.getElementById("sTime").textContent = "Sincronizando...";
  document.getElementById("sIcon").classList.add("fa-spin");

  var res = await fetchBoard();
  var banner = "";
  if(res.items && res.items.length){
    S.projects = res.items.map(mapItem);
    banner = '<div class="sync-banner"><i class="fas fa-check-circle"></i> '+res.items.length+' projetos sincronizados</div>';
  } else {
    S.projects = demoData();
    banner = '<div class="sync-banner warn"><i class="fas fa-exclamation-triangle"></i> Monday indispon\u00edvel \u2014 dados demo ativos</div>';
  }

  var b=document.getElementById("syncBanner"); if(b) b.innerHTML=banner;
  document.getElementById("sdot").classList.remove("spin");
  document.getElementById("sTime").textContent = res.live?"Monday \u2713 "+new Date().toLocaleTimeString("pt-BR"):"Demo "+new Date().toLocaleTimeString("pt-BR");
  document.getElementById("sIcon").classList.remove("fa-spin");
  refreshCurrent();
}

// ── DEMO DATA ─────────────────────────────────────────────
function demoData(){
  var people=[{nome:"Leticia Novo",cargo:"analista_jr"},{nome:"Ivone Pineda",cargo:"analista_sr"},{nome:"Carla Matos",cargo:"assistente2"},{nome:"Daniela Costa",cargo:"assistente1"}];
  var now=new Date();
  var cq=currQ();
  // Create demo with real dates in current quarter
  function qDate(daysIn){ var d=new Date(now.getFullYear(),(cq.q-1)*3,1); d.setDate(d.getDate()+daysIn); return d.toISOString().split("T")[0]; }
  function prazoDate(daysIn){ var d=new Date(now.getFullYear(),(cq.q-1)*3,1); d.setDate(d.getDate()+daysIn+5); return d.toISOString().split("T")[0]; }

  return [
    {id:"d1",name:"Telemetria de Tanques",etapaKey:"Implantacao",etapa:"Implanta\u00e7\u00e3o",comp:"Alta",resp:"Leticia Novo",cargo:"analista_jr",realDate:qDate(5),prazo:prazoDate(5),onTime:true,pts:50,completedStages:[{sk:"Estruturacao",realDate:qDate(2),prazo:prazoDate(2),onTime:true,pts:4},{sk:"Cotacao",realDate:qDate(4),prazo:prazoDate(4),onTime:true,pts:6},{sk:"Implantacao",realDate:qDate(5),prazo:prazoDate(5),onTime:true,pts:50}],updatedAt:new Date().toISOString()},
    {id:"d2",name:"Desconto Conta de Luz",etapaKey:"Cotacao",etapa:"Cota\u00e7\u00e3o",comp:"Baixa",resp:"Leticia Novo",cargo:"analista_jr",realDate:qDate(10),prazo:prazoDate(8),onTime:false,pts:3,completedStages:[{sk:"Estruturacao",realDate:qDate(3),prazo:prazoDate(3),onTime:true,pts:2},{sk:"Cotacao",realDate:qDate(10),prazo:prazoDate(8),onTime:false,pts:3}],updatedAt:new Date().toISOString()},
    {id:"d3",name:"Sistema Cilindros Barueri",etapaKey:"Medicao",etapa:"Medi\u00e7\u00e3o",comp:"Alta",resp:"Ivone Pineda",cargo:"analista_sr",realDate:qDate(7),prazo:prazoDate(7),onTime:true,pts:12,completedStages:[{sk:"Implantacao",realDate:qDate(5),prazo:prazoDate(5),onTime:true,pts:50},{sk:"Medicao",realDate:qDate(7),prazo:prazoDate(7),onTime:true,pts:12}],updatedAt:new Date().toISOString()},
    {id:"d4",name:"Programa Sa\u00fade Conta SIM",etapaKey:"Contrato",etapa:"Contrato",comp:"Media",resp:"Ivone Pineda",cargo:"analista_sr",realDate:qDate(12),prazo:prazoDate(10),onTime:false,pts:16,completedStages:[{sk:"Contrato",realDate:qDate(12),prazo:prazoDate(10),onTime:false,pts:16}],updatedAt:new Date().toISOString()},
    {id:"d5",name:"Medidor Remoto Condom\u00ednios",etapaKey:"Estruturacao",etapa:"Estrutura\u00e7\u00e3o",comp:"Media",resp:"Carla Matos",cargo:"assistente2",realDate:qDate(6),prazo:prazoDate(6),onTime:true,pts:3,completedStages:[{sk:"Estruturacao",realDate:qDate(6),prazo:prazoDate(6),onTime:true,pts:3}],updatedAt:new Date().toISOString()}
  ];
}

// ── LOGIN ─────────────────────────────────────────────────
function doLogin(){
  var role=document.getElementById("loginRole").value;
  var name=document.getElementById("loginName").value.trim();
  if(!role){notif("\u26a0\ufe0f Selecione seu cargo!"); return;}
  if(!name){notif("\u26a0\ufe0f Digite seu nome!"); return;}
  var ln=name.toLowerCase().trim();
  if(ln==="luciana gomes") role="gerente";
  if(ln==="alan kadri")    role="diretor";
  S.user={role:role,name:name};
  startApp();
}

function doLogout(){
  if(S.timer) clearInterval(S.timer);
  S.user=null;
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function startApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  var role=S.user.role, name=S.user.name;
  var init=name.split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();
  document.getElementById("sbAv").textContent=init;
  document.getElementById("sbName").textContent=name;
  document.getElementById("sbRole").textContent=RL[role]||role;
  document.getElementById("dName").textContent=name.split(" ")[0];
  document.getElementById("qLabel").textContent=currQLabel();
  var mgr=role==="gerente"||role==="diretor";
  document.querySelectorAll(".mgr").forEach(function(el){el.classList.toggle("hidden",!mgr);});
  // Init quarter filter
  S.filterQ=currQ().q; S.filterYear=currQ().y;
  go("dashboard");
  doSync();
  if(S.timer) clearInterval(S.timer);
  S.timer=setInterval(doSync,5*60*1000);
  loadSavedAvatar();
}

// ── NAVIGATION ────────────────────────────────────────────
var PNAMES={dashboard:"Dashboard",trilha:"Minha Trilha",pontos:"Pontua\u00e7\u00e3o",projetos:"Projetos",equipe:"Equipe",validacao:"Valida\u00e7\u00e3o",relatorio:"Relat\u00f3rios",avatar:"Meu Avatar"};

function go(name){
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("act");p.style.display="none";});
  var pg=document.getElementById("p-"+name);
  if(pg){pg.classList.add("act");pg.style.display="block";}
  document.querySelectorAll(".ni").forEach(function(n){n.classList.remove("act");});
  var nav=document.getElementById("n-"+name);
  if(nav) nav.classList.add("act");
  document.getElementById("bc").textContent=PNAMES[name]||name;
  refresh(name);
}

function refresh(n){
  if(n==="dashboard")  rDash();
  else if(n==="trilha")    rTrilha();
  else if(n==="pontos")    rPontos();
  else if(n==="projetos")  rProjetos();
  else if(n==="equipe")    rEquipe();
  else if(n==="validacao") rValidacao();
  else if(n==="relatorio") rRelatorio();
  else if(n==="avatar")    rAvatar();
}

function refreshCurrent(){
  if(!S.user) return;
  var pg=document.querySelector(".page.act");
  if(pg) refresh(pg.id.replace("p-",""));
}

function toggleSB(){ document.getElementById("sb").classList.toggle("col"); }

// ── QUARTER FILTER WIDGET ─────────────────────────────────
function buildQFilter(onChangeFn){
  var cq=currQ();
  var html='<div class="q-filter">';
  html+='<span class="q-filter-label"><i class="fas fa-calendar-alt"></i> Trimestre:</span>';
  html+='<select id="qSelect" onchange="'+onChangeFn+'">';
  // Show last 4 quarters + next 2
  for(var offset=-3; offset<=1; offset++){
    var tq=cq.q+offset, ty=cq.y;
    while(tq<1){tq+=4;ty--;}
    while(tq>4){tq-=4;ty++;}
    var val=tq+"|"+ty;
    var lbl="Q"+tq+" "+ty;
    var sel=(tq===S.filterQ&&ty===S.filterYear)?" selected":"";
    html+='<option value="'+val+'"'+sel+'>'+lbl+'</option>';
  }
  html+='</select></div>';
  return html;
}

function setQFilter(val){
  var p=val.split("|");
  S.filterQ=parseInt(p[0]);
  S.filterYear=parseInt(p[1]);
  refreshCurrent();
}

// ── DASHBOARD ─────────────────────────────────────────────
function rDash(){
  if(!S.user) return;
  var role=S.user.role, name=S.user.name;
  var mgr=role==="gerente"||role==="diretor";
  var projs=mgr?S.projects:userProjects(name);
  var st=calcStats(projs,role,S.filterQ,S.filterYear);

  // Quarter filter
  document.getElementById("q-filter-dash").innerHTML=buildQFilter("setQFilter(this.value)");

  // Stats cards
  document.getElementById("sg").innerHTML=
    '<div class="sc pri"><div class="si"><i class="fas fa-star"></i></div><div><div class="sv" id="svPts">0</div><div class="sl">Pontos no Trimestre</div></div><div class="st up"><i class="fas fa-arrow-up"></i> Q'+S.filterQ+' '+S.filterYear+'</div></div>'+
    '<div class="sc suc"><div class="si"><i class="fas fa-trophy"></i></div><div><div class="sv">'+fmt(st.bonusBase)+'</div><div class="sl">B\u00f4nus Base</div></div><div class="st"><i class="fas fa-info-circle"></i> Baseado nos pontos</div></div>'+
    '<div class="sc war"><div class="si"><i class="fas fa-clock"></i></div><div><div class="sv">'+st.pct+'%</div><div class="sl">Entregas no Prazo</div></div><div class="st '+(st.pct>=80?"up":"")+'"><i class="fas fa-'+(st.pct>=80?"check":"minus")+'-circle"></i> '+(st.pct>=80?"\u00d3timo!":st.pct>=50?"Pode melhorar":"Aten\u00e7\u00e3o")+'</div></div>'+
    '<div class="sc inf"><div class="si"><i class="fas fa-layer-group"></i></div><div><div class="sv">'+projs.filter(function(p){return p.etapaKey!=="Concluido";}).length+'</div><div class="sl">Projetos Ativos</div></div></div>';

  animN("svPts",st.totalPts);

  // Bonus preview
  document.getElementById("bBase").textContent=fmt(st.bonusBase);
  document.getElementById("bPrazo").textContent=fmt(st.dlBonus);
  document.getElementById("bTotal").textContent=fmt(st.total);
  var ct=curTier(role,st.totalPts);
  document.getElementById("fi").textContent=ct&&ct.b>0?"\uD83C\uDFAF Faixa: "+st.totalPts+" pts \u2192 B\u00f4nus Base "+fmt(ct.b):"\uD83C\uDFAF Acumule pontos para seu primeiro b\u00f4nus!";

  // Progress bar
  var nt=nextTier(role,st.totalPts),ct2=curTier(role,st.totalPts);
  var pct2=0,lbl="";
  if(!nt){pct2=100;lbl="\uD83C\uDFC6 Teto m\u00e1ximo atingido!";}
  else{var rng=nt.min-(ct2?ct2.min:0),prog=st.totalPts-(ct2?ct2.min:0);pct2=Math.min(100,Math.round(prog/rng*100));lbl=st.totalPts+" pts \u2192 pr\u00f3xima faixa em "+nt.min+" pts ("+fmt(nt.b)+")";}
  document.getElementById("pLabel").textContent=lbl;
  document.getElementById("pPts").textContent=st.totalPts+" pts";
  document.getElementById("pBar").style.width=pct2+"%";
  document.getElementById("pTiers").innerHTML=(BT[role]||[]).map(function(t){
    return'<div class="pt '+(st.totalPts>=t.min?"act":"")+'"><div class="pp">'+t.min+'+</div><div class="pg">'+fmt(t.b)+'</div></div>';
  }).join("");

  // Recent activity — completed stages in quarter
  var rec=st.stagesInQ.slice().sort(function(a,b){return new Date(b.stage.realDate)-new Date(a.stage.realDate);}).slice(0,6);
  document.getElementById("recAct").innerHTML=rec.length?rec.map(function(x){
    var ot=x.stage.onTime===true?'<span style="color:#34D399;font-size:11px">\u2705 No prazo</span>':x.stage.onTime===false?'<span style="color:#FCA5A5;font-size:11px">\u26a0\ufe0f Atrasado</span>':'';
    return '<div class="ai"><div class="aic '+eClass(x.stage.sk)+'">'+eIcon(x.stage.sk)+'</div>'+
           '<div style="flex:1"><div class="an">'+x.proj.name+'</div><div class="am">'+ETAPA_KEY[x.stage.sk]+' \u00b7 '+x.proj.comp+' \u00b7 '+fmtD(x.stage.realDate)+'</div></div>'+
           '<div style="text-align:right"><div class="ap">+'+x.stage.pts+' pts</div>'+ot+'</div></div>';
  }).join(""):'<div class="empty"><i class="fas fa-inbox"></i><p>Nenhuma etapa conclu\u00edda em Q'+S.filterQ+' '+S.filterYear+'</p></div>';
}

// ── TRILHA ────────────────────────────────────────────────
function rTrilha(){
  if(!S.user) return;
  var role=S.user.role,name=S.user.name;
  var myProjs=isMgr(name)?S.projects:userProjects(name);
  var wrap=document.getElementById("trilhaWrap");
  if(!myProjs.length){wrap.innerHTML='<div class="empty"><i class="fas fa-inbox"></i><p>Nenhum projeto encontrado.</p></div>';return;}

  if(S.trilhaSelectedId&&!myProjs.find(function(p){return p.id===S.trilhaSelectedId;})) S.trilhaSelectedId=null;
  if(!S.trilhaSelectedId) S.trilhaSelectedId=myProjs[0].id;
  var proj=myProjs.find(function(p){return p.id===S.trilhaSelectedId;})||myProjs[0];
  var ec=ETAPA_COLORS[proj.etapaKey]||"#7C3AED";

  var html='<div class="trilha-page">';
  // Dropdown
  html+='<div class="trilha-drop-wrap"><label class="trilha-sel-label"><i class="fas fa-project-diagram"></i> Projeto</label>';
  html+='<select class="trilha-dropdown" onchange="selectTrilhaProject(this.value)">';
  myProjs.forEach(function(p){
    var col=ETAPA_COLORS[p.etapaKey]||"#7C3AED";
    html+='<option value="'+p.id+'"'+(p.id===S.trilhaSelectedId?" selected":"")+'>'+p.name+' \u2014 '+eBadgeName(p.etapaKey)+'</option>';
  });
  html+='</select></div>';

  // Header
  html+='<div class="roadmap-proj-header"><div class="rph-left"><i class="fas fa-project-diagram" style="color:'+ec+'"></i><div><div class="rph-name">'+proj.name+'</div><div class="rph-sub">'+(proj.resp||"\u2014")+' \u00b7 '+proj.comp+'</div></div></div><span class="rph-etapa" style="background:'+ec+'22;color:'+ec+';border:1px solid '+ec+'44">'+eBadgeName(proj.etapaKey)+'</span></div>';

  html+=buildRoadmap(proj,role,name);
  html+='</div>';
  wrap.innerHTML=html;
}

function selectTrilhaProject(id){S.trilhaSelectedId=id;rTrilha();}

var ETAPA_COLORS={"Estruturacao":"#3B82F6","Cotacao":"#10B981","Contrato":"#7C3AED","Implantacao":"#EC4899","Medicao":"#F59E0B","Concluido":"#6B7280"};

function eBadgeName(sk){
  return {"Estruturacao":"Estrutura\u00e7\u00e3o","Cotacao":"Cota\u00e7\u00e3o","Contrato":"Contrato","Implantacao":"Implanta\u00e7\u00e3o","Medicao":"Medi\u00e7\u00e3o","Concluido":"Conclu\u00eddo"}[sk]||sk;
}

function buildRoadmap(proj, role, userName){
  var curIdx=ETAPAS.findIndex(function(e){return e.sk===proj.etapaKey;});
  if(curIdx===-1) curIdx=0;
  var personColor="#7C3AED";
  var personInit=(userName||"?").split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();
  var W=980,H=340;
  var nodes=[{x:100,y:280},{x:270,y:185},{x:470,y:120},{x:670,y:70},{x:870,y:48}];
  var road="M60,300 C110,300 140,250 210,210 C290,165 350,155 430,130 C510,105 580,95 650,80 C730,65 800,58 900,45";
  var ec=ETAPA_COLORS[proj.etapaKey]||"#7C3AED";
  var completedSKs={};
  (proj.completedStages||[]).forEach(function(s){completedSKs[s.sk]=s;});

  var html='<div class="roadmap-container">';
  html+='<div class="roadmap-svg-outer"><svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" class="roadmap-svg">';
  html+='<defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  html+='<path d="'+road+'" stroke="rgba(0,0,0,0.45)" stroke-width="58" fill="none" stroke-linecap="round"/>';
  html+='<path d="'+road+'" stroke="#0f172a" stroke-width="44" fill="none" stroke-linecap="round"/>';
  html+='<path d="'+road+'" stroke="rgba(250,204,21,0.55)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="22 16"/>';

  ETAPAS.forEach(function(e,i){
    var n=nodes[i];
    var isDone=completedSKs[e.sk];
    var isCurrent=i===curIdx;
    var isLocked=!isDone&&i>curIdx;
    var color=ETAPA_COLORS[e.sk]||"#7C3AED";

    if(isCurrent){html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="40" fill="'+color+'" opacity="0.12"/>';}
    var fill=isDone||isCurrent?color:"rgba(30,41,59,0.95)";
    var stroke=isLocked?"rgba(100,116,139,0.4)":color;
    html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="28" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5" filter="url(#glow)"/>';
    if(isDone) html+='<text x="'+n.x+'" y="'+(n.y+6)+'" text-anchor="middle" font-size="16" fill="white">\u2713</text>';
    else if(isLocked){html+='<circle cx="'+n.x+'" cy="'+n.y+'" r="28" fill="rgba(15,23,42,0.8)" stroke="rgba(100,116,139,0.3)" stroke-width="1.5"/>';html+='<text x="'+n.x+'" y="'+(n.y+5)+'" text-anchor="middle" font-size="16" fill="rgba(100,116,139,0.5)">\uD83D\uDD12</text>';}
    else html+='<text x="'+n.x+'" y="'+(n.y+6)+'" text-anchor="middle" font-size="14" font-weight="900" fill="white">0'+(i+1)+'</text>';

    // Label
    var lblY=i%2===0?n.y+64:n.y-52;
    var lColor=isLocked?"rgba(100,116,139,0.4)":isDone?"rgba(255,255,255,0.6)":color;
    html+='<line x1="'+n.x+'" y1="'+(i%2===0?n.y+28:n.y-28)+'" x2="'+n.x+'" y2="'+(i%2===0?lblY-20:lblY+20)+'" stroke="'+lColor+'" stroke-width="1.5" stroke-dasharray="4 3"/>';
    var bx=n.x-70,by=i%2===0?lblY-20:lblY-20;
    var onTimeTxt=isDone?(isDone.onTime===true?"\u2705 No prazo":isDone.onTime===false?"\u26a0\ufe0f Atrasado":"\u2014"):isCurrent?"Em andamento":"\uD83D\uDD12 Bloqueado";
    html+='<rect x="'+bx+'" y="'+by+'" width="140" height="40" rx="10" fill="rgba(15,12,41,0.92)" stroke="'+(isCurrent?color:"rgba(100,116,139,0.2)")+'" stroke-width="'+(isCurrent?"2":"1")+'"/>';
    html+='<text x="'+n.x+'" y="'+(by+15)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="'+lColor+'">'+e.key+'</text>';
    html+='<text x="'+n.x+'" y="'+(by+30)+'" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.6)">'+onTimeTxt+'</text>';
  });

  // Avatar
  if(curIdx>=0&&curIdx<nodes.length){
    var an=nodes[curIdx];var avX=an.x+36,avY=an.y-36;
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="22" fill="rgba(0,0,0,0.45)"/>';
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="20" fill="'+personColor+'" stroke="white" stroke-width="2.5" filter="url(#glow)"/>';
    html+='<text x="'+avX+'" y="'+(avY+5)+'" text-anchor="middle" font-size="11" font-weight="800" fill="white">'+personInit+'</text>';
    html+='<circle cx="'+avX+'" cy="'+avY+'" r="22" fill="none" stroke="'+personColor+'" stroke-width="2" opacity="0.5"><animate attributeName="r" values="22;30;22" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite"/></circle>';
    html+='<rect x="'+(avX-38)+'" y="'+(avY-38)+'" width="76" height="18" rx="9" fill="'+ec+'" opacity="0.9"/>';
    html+='<text x="'+avX+'" y="'+(avY-25)+'" text-anchor="middle" font-size="9" font-weight="700" fill="white">Voc\u00ea est\u00e1 aqui!</text>';
  }
  html+='</svg></div>';

  // Step cards
  html+='<div class="roadmap-steps-row">';
  ETAPAS.forEach(function(e,i){
    var isDone=completedSKs[e.sk];
    var isCurrent=i===curIdx;
    var isLocked=!isDone&&i>curIdx;
    var color=ETAPA_COLORS[e.sk]||"#7C3AED";
    var t=SC[role]||SC["analista_jr"];var te=t[e.sk];
    var pts=te?Object.values(te).join("/"):"-";
    html+='<div class="rs-card'+(isCurrent?" rs-current":"")+(isDone?" rs-done":"")+(isLocked?" rs-locked":"")+'" style="'+(isCurrent?"border-color:"+color:"")+(isDone?"border-color:rgba(52,211,153,0.3)":"")+(isLocked?"opacity:0.45":"")+'">';
    html+='<div class="rs-num" style="background:'+(isLocked?"rgba(30,41,59,0.8)":color)+'">'+(isDone?"\u2713":isLocked?"\uD83D\uDD12":"0"+(i+1))+'</div>';
    html+='<div class="rs-name" style="color:'+(isLocked?"rgba(100,116,139,0.5)":isDone?"rgba(255,255,255,0.65)":color)+'">'+e.key+'</div>';
    if(!isLocked&&te) html+='<div class="rs-pts">'+pts+' pts</div>';
    if(isCurrent) html+='<div class="rs-badge-here">\uD83D\uDCCD Aqui</div>';
    if(isDone) html+='<div class="rs-badge-done">'+(isDone.onTime===true?"\u2705 No prazo":isDone.onTime===false?"\u26a0\ufe0f Atrasado":"\u2714 Feito")+'</div>';
    html+='</div>';
  });
  html+='</div>';

  // Info box
  var curEtapa=ETAPAS.find(function(e){return e.sk===proj.etapaKey;})||ETAPAS[0];
  html+='<div class="roadmap-info-box" style="border-color:'+ec+'33;background:'+ec+'0a">';
  html+='<div class="rib-title" style="color:'+ec+'"><i class="fas fa-info-circle"></i> Etapa: '+eBadgeName(proj.etapaKey)+'</div>';
  html+='<div class="rib-desc">'+curEtapa.desc+'</div>';
  html+='<div class="rib-meta"><span><i class="fas fa-clock" style="color:'+ec+'"></i> Prazo: '+curEtapa.prazo+'</span>';
  var t2=SC[role]||SC["analista_jr"];var te2=t2[curEtapa.sk];
  if(te2) html+='<span><i class="fas fa-star" style="color:'+ec+'"></i> Pts: '+Object.values(te2).join(" / ")+'</span>';
  html+='</div></div>';
  html+='</div>';
  return html;
}

// ── PONTOS ────────────────────────────────────────────────
function rPontos(){
  if(!S.user) return;
  var role=S.user.role,name=S.user.name;
  var mgr=role==="gerente"||role==="diretor";
  var projs=mgr?S.projects:userProjects(name);
  var st=calcStats(projs,role,S.filterQ,S.filterYear);

  // Scoring table
  var th="";
  if(role==="assistente1"){
    th='<table class="ptable"><tr><th>Etapa</th><th>Compl.</th><th>Pontos</th></tr><tr><td>Cota\u00e7\u00e3o</td><td>Baixa</td><td class="pts-b">2</td></tr><tr><td>Cota\u00e7\u00e3o</td><td>M\u00e9dia</td><td class="pts-b">3</td></tr><tr><td>Cota\u00e7\u00e3o</td><td>Alta</td><td class="pts-b">4</td></tr></table>';
  } else {
    var t=SC[role]||SC["analista_jr"];
    th='<table class="ptable"><tr><th>Etapa</th><th>Baixa</th><th>M\u00e9dia</th><th>Alta</th></tr>';
    ETAPAS.forEach(function(e){var te=t[e.sk];if(te)th+='<tr><td>'+e.key+'</td><td class="pts-b">'+te.Baixa+'</td><td class="pts-b">'+te.Media+'</td><td class="pts-b">'+te.Alta+'</td></tr>';});
    th+='</table>';
  }
  document.getElementById("ptWrap").innerHTML=th;

  // History — completed stages in quarter
  document.getElementById("q-filter-pontos").innerHTML=buildQFilter("setQFilter(this.value)");
  var sorted=st.stagesInQ.slice().sort(function(a,b){return new Date(b.stage.realDate)-new Date(a.stage.realDate);});
  document.getElementById("histPts").innerHTML=sorted.length?sorted.map(function(x){
    var ot=x.stage.onTime===true?'\u2705 No prazo':x.stage.onTime===false?'\u26a0\ufe0f Atrasado':'\u2014';
    return '<div class="ai"><div class="aic '+eClass(x.stage.sk)+'">'+eIcon(x.stage.sk)+'</div>'+
           '<div style="flex:1"><div class="an">'+x.proj.name+'</div><div class="am">'+ETAPA_KEY[x.stage.sk]+' \u00b7 '+x.proj.comp+' \u00b7 '+fmtD(x.stage.realDate)+'</div></div>'+
           '<div style="text-align:right"><div class="ap">+'+x.stage.pts+' pts</div><div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:2px">'+ot+'</div></div></div>';
  }).join(""):'<div class="empty"><i class="fas fa-inbox"></i><p>Nenhuma etapa conclu\u00edda em Q'+S.filterQ+' '+S.filterYear+'</p></div>';
}

// ── PROJETOS ─────────────────────────────────────────────
var _ap=[];
function rProjetos(){
  var mgr=S.user.role==="gerente"||S.user.role==="diretor";
  _ap=mgr?S.projects:userProjects(S.user.name);
  document.getElementById("q-filter-proj").innerHTML=buildQFilter("setQFilter(this.value)");
  renderCards(_ap);
}

function renderCards(projs){
  var el=document.getElementById("pGrid");
  if(!projs.length){el.innerHTML='<div class="empty" style="grid-column:1/-1"><i class="fas fa-inbox"></i><p>Nenhum projeto</p></div>';return;}
  var cq=S.filterQ,cy=S.filterYear;
  el.innerHTML=projs.map(function(p){
    // Check if any stage completed in selected quarter
    var inQtr=p.completedStages&&p.completedStages.some(function(s){return inQ(s.realDate,cq,cy);});
    var dlHtml='';
    if(p.onTime===true) dlHtml='<div class="pdl dl-ok"><i class="fas fa-check-circle"></i> No prazo</div>';
    else if(p.onTime===false) dlHtml='<div class="pdl dl-late"><i class="fas fa-exclamation-circle"></i> Atrasado</div>';
    else dlHtml='<div class="pdl dl-na"><i class="fas fa-clock"></i> '+(p.prazo?"Prazo: "+p.prazo:"Sem prazo definido")+'</div>';
    var qBadge=inQtr?'<span style="font-size:10px;background:rgba(16,185,129,.15);color:#34D399;padding:2px 8px;border-radius:20px;font-weight:600;margin-left:6px">Q'+cq+' '+cy+'</span>':'';
    return '<div class="pcard" onclick="openMod(\''+p.id+'\')">'+
      '<div class="pch"><div class="pname">'+p.name+qBadge+'</div><span class="pe '+eBadge(p.etapaKey)+'">'+p.etapa+'</span></div>'+
      '<div class="pmeta"><span class="pbadge '+cBadge(p.comp)+'">'+p.comp+'</span><span class="pbadge">'+(RL[p.cargo]||p.cargo)+'</span></div>'+
      '<div class="pperson"><i class="fas fa-user-circle"></i> '+(p.resp||"\u2014")+'</div>'+
      (p.pts?'<div class="ppts">'+p.pts+' <span>pontos</span></div>':"")+dlHtml+'</div>';
  }).join("");
}

function filt(){
  var s=document.getElementById("srch").value.toLowerCase();
  var e=document.getElementById("fEtapa").value;
  var c=document.getElementById("fComp").value;
  var status=document.getElementById("fStatus").value;
  var cq=S.filterQ,cy=S.filterYear;
  renderCards(_ap.filter(function(p){
    if(s&&p.name.toLowerCase().indexOf(s)<0&&(p.resp||"").toLowerCase().indexOf(s)<0) return false;
    if(e&&p.etapa!==e) return false;
    if(c&&p.comp!==c) return false;
    if(status==="prazo" && p.onTime!==true) return false;
    if(status==="atraso" && p.onTime!==false) return false;
    if(status==="trimestre" && !(p.completedStages&&p.completedStages.some(function(s){return inQ(s.realDate,cq,cy);}))) return false;
    return true;
  }));
}

function openMod(id){
  var p=S.projects.find(function(x){return x.id===id;}); if(!p) return;
  document.getElementById("modTitle").textContent=p.name;
  var t=SC[p.cargo]||SC["analista_jr"];var row=t[p.etapaKey];
  var stagesHtml='<div class="msect">Etapas Conclu\u00eddas</div>';
  if(p.completedStages&&p.completedStages.length){
    stagesHtml+=p.completedStages.map(function(s){
      var ot=s.onTime===true?'<span style="color:#34D399">\u2705 No prazo</span>':s.onTime===false?'<span style="color:#FCA5A5">\u26a0\ufe0f Atrasado</span>':'<span style="color:rgba(255,255,255,.4)">\u2014</span>';
      return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">'+
             '<span style="color:rgba(255,255,255,.7)">'+ETAPA_KEY[s.sk]+'</span>'+
             '<span style="display:flex;gap:12px;align-items:center">'+ot+
             '<span style="color:#A78BFA;font-weight:700">+'+s.pts+' pts</span>'+
             '<span style="color:rgba(255,255,255,.4);font-size:11px">'+fmtD(s.realDate)+'</span></span></div>';
    }).join("");
  } else { stagesHtml+='<p style="color:rgba(255,255,255,.4);font-size:13px">Nenhuma etapa conclu\u00edda ainda.</p>'; }

  document.getElementById("modBody").innerHTML=
    '<div class="mgrid">'+
    '<div class="mf"><label>Etapa Atual</label><value><span class="pe '+eBadge(p.etapaKey)+'" style="display:inline-block">'+p.etapa+'</span></value></div>'+
    '<div class="mf"><label>Complexidade</label><value><span class="pbadge '+cBadge(p.comp)+'" style="display:inline-block">'+p.comp+'</span></value></div>'+
    '<div class="mf"><label>Respons\u00e1vel</label><value>'+(p.resp||"\u2014")+'</value></div>'+
    '<div class="mf"><label>Cargo</label><value>'+(RL[p.cargo]||p.cargo)+'</value></div>'+
    '<div class="mf"><label>Prazo</label><value>'+(p.prazo||"N\u00e3o definido")+'</value></div>'+
    '<div class="mf"><label>Status</label><value>'+(p.onTime===true?"\u2705 No prazo":p.onTime===false?"\u26a0\ufe0f Atrasado":"\u2014")+'</value></div>'+
    '</div>'+stagesHtml;
  document.getElementById("modOv").classList.remove("hidden");
}
function closeMod(){document.getElementById("modOv").classList.add("hidden");}

// ── EQUIPE ────────────────────────────────────────────────
function rEquipe(){
  var arr=groupByPerson().map(function(m,i){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo,S.filterQ,S.filterYear),ci:i});});
  arr.sort(function(a,b){return b.stats.totalPts-a.stats.totalPts;});
  document.getElementById("q-filter-equipe").innerHTML=buildQFilter("setQFilter(this.value)");
  document.getElementById("teamGrid").innerHTML=arr.length?arr.map(function(m){
    var init=m.name.split(" ").map(function(w){return w[0];}).join("").substring(0,2).toUpperCase();
    return '<div class="tmcard"><div class="tmav" style="background:'+COLS[m.ci%COLS.length]+'">'+init+'</div>'+
      '<div class="tmname">'+m.name+'</div><div class="tmrole">'+(RL[m.cargo]||m.cargo)+'</div>'+
      '<div class="tmst">'+
      '<div class="tmstv"><div class="tmstval">'+m.stats.totalPts+'</div><div class="tmslab">Pontos</div></div>'+
      '<div class="tmstv"><div class="tmstval">'+m.stats.pct+'%</div><div class="tmslab">No prazo</div></div>'+
      '<div class="tmstv"><div class="tmstval">'+m.stats.impl+'</div><div class="tmslab">Impl.</div></div>'+
      '</div><div class="tmbonus">\uD83D\uDCB0 '+fmt(m.stats.total)+' b\u00f4nus projetado</div></div>';
  }).join(""):'<div class="empty"><i class="fas fa-users"></i><p>Sem dados</p></div>';

  document.getElementById("rankList").innerHTML=arr.map(function(m,i){
    var rc=i===0?"r1":i===1?"r2":i===2?"r3":"ro";
    var em=i===0?"\uD83E\uDD47":i===1?"\uD83E\uDD48":i===2?"\uD83E\uDD49":i+1;
    return '<div class="ri"><div class="rn '+rc+'">'+em+'</div>'+
      '<div style="flex:1"><div class="riname">'+m.name+'</div><div class="rirole">'+(RL[m.cargo]||m.cargo)+'</div></div>'+
      '<div class="ripts">'+m.stats.totalPts+' pts</div></div>';
  }).join("");
}

// ── VALIDAÇÃO ────────────────────────────────────────────
function rValidacao(){
  var arr=groupByPerson().map(function(m){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo,S.filterQ,S.filterYear)});});
  document.getElementById("q-filter-val").innerHTML=buildQFilter("setQFilter(this.value)");
  document.getElementById("valList").innerHTML=arr.map(function(m){
    var key=m.name+"_Q"+S.filterQ+"_"+S.filterYear;var appr=S.approvals[key];
    return '<div class="vc"><div class="vch"><div class="vperson">'+m.name+' \u2014 '+(RL[m.cargo]||m.cargo)+'</div><div class="vq">Q'+S.filterQ+' '+S.filterYear+'</div></div>'+
      '<div class="vd">'+
      '<div class="vdv"><div class="vdval">'+m.stats.totalPts+'</div><div class="vdlab">Pontos</div></div>'+
      '<div class="vdv"><div class="vdval">'+m.stats.pct+'%</div><div class="vdlab">No prazo</div></div>'+
      '<div class="vdv"><div class="vdval">'+fmt(m.stats.bonusBase)+'</div><div class="vdlab">B\u00f4nus Base</div></div>'+
      '<div class="vdv"><div class="vdval" style="color:#34D399">'+fmt(m.stats.total)+'</div><div class="vdlab">Total</div></div>'+
      '</div><div class="va">'+(appr?'<button class="btn-aprd"><i class="fas fa-check-circle"></i> Aprovado</button>':
      '<button class="btn-adj" onclick="notif(\'Ajuste dispon\u00edvel no servidor\')"><i class="fas fa-edit"></i> Ajustar</button>'+
      '<button class="btn-apr" onclick="aprBonus(\''+key+'\',\''+m.name+'\')"><i class="fas fa-check"></i> Aprovar '+fmt(m.stats.total)+'</button>')+'</div></div>';
  }).join("")||'<div class="empty"><i class="fas fa-inbox"></i><p>Sem dados</p></div>';
}
function aprBonus(key,name){S.approvals[key]=true;rValidacao();notif("\u2705 B\u00f4nus de "+name+" aprovado!");}

// ── RELATÓRIO ────────────────────────────────────────────
var _ch={};
function rRelatorio(){
  var arr=groupByPerson().map(function(m){return Object.assign({},m,{stats:calcStats(m.projs,m.cargo,S.filterQ,S.filterYear)});});
  document.getElementById("q-filter-rel").innerHTML=buildQFilter("setQFilter(this.value)");
  document.getElementById("relSg").innerHTML=
    '<div class="sc pri"><div class="si"><i class="fas fa-users"></i></div><div><div class="sv">'+arr.length+'</div><div class="sl">Colaboradores</div></div></div>'+
    '<div class="sc suc"><div class="si"><i class="fas fa-star"></i></div><div><div class="sv">'+arr.reduce(function(s,m){return s+m.stats.totalPts;},0)+'</div><div class="sl">Pontos Totais</div></div></div>'+
    '<div class="sc war"><div class="si"><i class="fas fa-coins"></i></div><div><div class="sv">'+fmt(arr.reduce(function(s,m){return s+m.stats.total;},0))+'</div><div class="sl">B\u00f4nus Projetado</div></div></div>'+
    '<div class="sc inf"><div class="si"><i class="fas fa-layer-group"></i></div><div><div class="sv">'+arr.reduce(function(s,m){return s+m.stats.impl;},0)+'</div><div class="sl">Implementa\u00e7\u00f5es</div></div></div>';
  setTimeout(function(){
    var c1=document.getElementById("chPts"),c2=document.getElementById("chEt");
    if(_ch.p)_ch.p.destroy();
    _ch.p=new Chart(c1,{type:"bar",data:{labels:arr.map(function(m){return m.name.split(" ")[0];}),datasets:[{label:"Pontos",data:arr.map(function(m){return m.stats.totalPts;}),backgroundColor:COLS.slice(0,arr.length),borderRadius:8}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{color:"rgba(255,255,255,.45)"},grid:{color:"rgba(255,255,255,.055)"}},x:{ticks:{color:"rgba(255,255,255,.45)"},grid:{display:false}}}}});
    var ecnt={};ETAPAS.forEach(function(e){ecnt[e.key]=0;});
    S.projects.forEach(function(p){if(ecnt[p.etapa]!==undefined)ecnt[p.etapa]++;});
    if(_ch.e)_ch.e.destroy();
    _ch.e=new Chart(c2,{type:"doughnut",data:{labels:Object.keys(ecnt),datasets:[{data:Object.values(ecnt),backgroundColor:COLS,borderWidth:2,borderColor:"rgba(10,8,30,.8)"}]},options:{responsive:true,plugins:{legend:{position:"bottom",labels:{color:"rgba(255,255,255,.55)",padding:12}}}}});
  },100);
  document.getElementById("relTable").innerHTML='<table class="rtable"><tr><th>COLABORADOR</th><th>CARGO</th><th>PONTOS</th><th>% PRAZO</th><th>B\u00d4NUS BASE</th><th>B\u00d4NUS PRAZO</th><th>TOTAL</th></tr>'+
    arr.map(function(m){return'<tr><td style="font-weight:600">'+m.name+'</td><td>'+(RL[m.cargo]||m.cargo)+'</td><td style="font-weight:800;background:linear-gradient(135deg,#A78BFA,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">'+m.stats.totalPts+'</td><td>'+m.stats.pct+'%</td><td>'+fmt(m.stats.bonusBase)+'</td><td>'+fmt(m.stats.dlBonus)+'</td><td style="font-weight:800;color:#34D399">'+fmt(m.stats.total)+'</td></tr>';}).join("")+'</table>';
  window._expData=arr;
}
function expCSV(){
  var data=window._expData||[];
  var rows=[["Colaborador","Cargo","Pontos","% No Prazo","Bonus Base","Bonus Prazo","Total"]];
  data.forEach(function(m){rows.push([m.name,RL[m.cargo]||m.cargo,m.stats.totalPts,m.stats.pct+"%",m.stats.bonusBase,m.stats.dlBonus,m.stats.total]);});
  var blob=new Blob(["\ufeff"+rows.map(function(r){return r.join(";");}).join("\n")],{type:"text/csv;charset=utf-8"});
  var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="bonus_Q"+S.filterQ+"_"+S.filterYear+".csv";a.click();
}

// ── AVATAR CREATOR ────────────────────────────────────────
var AV={skin:"#F5C5A3",hair:"short",hairColor:"#3D2B1F",eyes:"normal",eyeColor:"#2C3E50",mouth:"smile",top:"#7C3AED",bg:"#1E1B4B",accessory:"none"};
var AV_OPTS={
  skin:["#FDDBB4","#F5C5A3","#E8A87C","#C68642","#8D5524","#4A2912"],
  hairColor:["#3D2B1F","#1C1C1C","#8B4513","#D4A017","#C0392B","#7F8C8D","#F0E6D3","#7C3AED"],
  eyeColor:["#2C3E50","#1ABC9C","#3498DB","#8E44AD","#27AE60","#E67E22","#95A5A6"],
  top:["#7C3AED","#EC4899","#10B981","#3B82F6","#F59E0B","#EF4444","#1E293B","#0EA5E9","#8B5CF6"],
  bg:["#1E1B4B","#0F172A","#134E4A","#450A0A","#1E3A5F","#3B0764","#1A2E05","#1C1917"]
};

function drawAvatar(cfg,id){
  var svg=document.getElementById(id);if(!svg)return;
  var c=cfg||AV;
  var hair={
    short:'<path d="M30,42 Q30,18 50,18 Q70,18 70,42 Q68,28 50,26 Q32,28 30,42Z" fill="'+c.hairColor+'"/>',
    long:'<path d="M28,46 Q28,16 50,16 Q72,16 72,46Z" fill="'+c.hairColor+'"/><rect x="28" y="55" width="6" height="28" rx="3" fill="'+c.hairColor+'"/><rect x="66" y="55" width="6" height="28" rx="3" fill="'+c.hairColor+'"/>',
    curly:'<path d="M29,44 Q29,17 50,17 Q71,17 71,44Z" fill="'+c.hairColor+'"/><circle cx="30" cy="40" r="7" fill="'+c.hairColor+'"/><circle cx="38" cy="28" r="6" fill="'+c.hairColor+'"/><circle cx="50" cy="24" r="6" fill="'+c.hairColor+'"/><circle cx="62" cy="28" r="6" fill="'+c.hairColor+'"/><circle cx="70" cy="40" r="7" fill="'+c.hairColor+'"/>',
    bun:'<path d="M31,44 Q31,19 50,19 Q69,19 69,44Z" fill="'+c.hairColor+'"/><circle cx="50" cy="19" r="11" fill="'+c.hairColor+'"/>',
    ponytail:'<path d="M30,43 Q30,18 50,18 Q70,18 70,43Z" fill="'+c.hairColor+'"/><rect x="47" y="17" width="6" height="30" rx="3" fill="'+c.hairColor+'"/>',
    none:''
  };
  var eyes={
    normal:'<ellipse cx="41" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="41" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="42" cy="51" r="1" fill="white"/><ellipse cx="59" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="59" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="60" cy="51" r="1" fill="white"/>',
    happy:'<path d="M37,52 Q41,57 45,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M55,52 Q59,57 63,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    wink:'<ellipse cx="41" cy="52" rx="4.5" ry="4" fill="white"/><circle cx="41" cy="52" r="2.8" fill="'+c.eyeColor+'"/><circle cx="42" cy="51" r="1" fill="white"/><path d="M55,52 Q59,56 63,52" stroke="'+c.eyeColor+'" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    cool:'<rect x="35" y="49" width="11" height="7" rx="3.5" fill="#111"/><ellipse cx="40.5" cy="52.5" rx="3" ry="2.5" fill="'+c.eyeColor+'"/><rect x="54" y="49" width="11" height="7" rx="3.5" fill="#111"/><ellipse cx="59.5" cy="52.5" rx="3" ry="2.5" fill="'+c.eyeColor+'"/>',
    stars:'<text x="36" y="57" font-size="10" fill="'+c.eyeColor+'">&#9733;</text><text x="54" y="57" font-size="10" fill="'+c.eyeColor+'">&#9733;</text>'
  };
  var mouth={
    smile:'<path d="M41,64 Q50,71 59,64" stroke="#922B21" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    grin:'<path d="M40,63 Q50,73 60,63" stroke="#922B21" stroke-width="2" fill="#E74C3C" stroke-linecap="round"/><path d="M44,68 Q50,72 56,68" stroke="white" stroke-width="1.5" fill="none"/>',
    neutral:'<line x1="43" y1="65" x2="57" y2="65" stroke="#922B21" stroke-width="2.5" stroke-linecap="round"/>',
    open:'<ellipse cx="50" cy="65" rx="8" ry="5.5" fill="#922B21"/><ellipse cx="50" cy="65" rx="6" ry="3.5" fill="#7B241C"/>'
  };
  var acc={
    none:'',
    glasses:'<rect x="33" y="48" width="13" height="9" rx="4" stroke="#7C3AED" stroke-width="2" fill="none"/><rect x="54" y="48" width="13" height="9" rx="4" stroke="#7C3AED" stroke-width="2" fill="none"/><line x1="46" y1="52" x2="54" y2="52" stroke="#7C3AED" stroke-width="1.5"/>',
    headband:'<rect x="25" y="35" width="50" height="7" rx="3.5" fill="'+c.top+'" opacity="0.9"/>',
    hat:'<ellipse cx="50" cy="29" rx="27" ry="5" fill="'+c.hairColor+'"/><rect x="33" y="17" width="34" height="14" rx="4" fill="'+c.hairColor+'"/>',
    earrings:'<circle cx="26" cy="57" r="3.5" fill="#F59E0B"/><circle cx="74" cy="57" r="3.5" fill="#F59E0B"/>'
  };
  svg.innerHTML=
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

function rAvatar(){
  if(!S.user)return;
  try{var sv=localStorage.getItem("av_"+S.user.name);if(sv)Object.assign(AV,JSON.parse(sv));}catch(e){}
  document.getElementById("avPrevName").textContent=S.user.name;
  document.getElementById("avPrevRole").textContent=RL[S.user.role]||S.user.role;
  buildAvControls();
  drawAvatar(AV,"avatarSVG");
}

function buildAvControls(){
  var secs=[
    {label:"Tom de pele",   icon:"fa-hand-paper", type:"color", key:"skin",      opts:AV_OPTS.skin},
    {label:"Cabelo",        icon:"fa-cut",         type:"btn",   key:"hair",      opts:[{v:"short",l:"Curto"},{v:"long",l:"Longo"},{v:"curly",l:"Cacheado"},{v:"bun",l:"Coque"},{v:"ponytail",l:"Rabo de cavalo"},{v:"none",l:"Careca"}]},
    {label:"Cor do cabelo", icon:"fa-palette",     type:"color", key:"hairColor", opts:AV_OPTS.hairColor},
    {label:"Olhos",         icon:"fa-eye",         type:"btn",   key:"eyes",      opts:[{v:"normal",l:"Normal"},{v:"happy",l:"Feliz"},{v:"wink",l:"Piscadela"},{v:"cool",l:"Oculos"},{v:"stars",l:"Estrelas"}]},
    {label:"Cor dos olhos", icon:"fa-circle",      type:"color", key:"eyeColor",  opts:AV_OPTS.eyeColor},
    {label:"Boca",          icon:"fa-smile",       type:"btn",   key:"mouth",     opts:[{v:"smile",l:"Sorriso"},{v:"grin",l:"Risada"},{v:"neutral",l:"Neutro"},{v:"open",l:"Aberta"}]},
    {label:"Acessorio",     icon:"fa-glasses",     type:"btn",   key:"accessory", opts:[{v:"none",l:"Nenhum"},{v:"glasses",l:"Oculos"},{v:"headband",l:"Faixa"},{v:"hat",l:"Chapeu"},{v:"earrings",l:"Brincos"}]},
    {label:"Cor da roupa",  icon:"fa-tshirt",      type:"color", key:"top",       opts:AV_OPTS.top},
    {label:"Fundo",         icon:"fa-circle",      type:"color", key:"bg",        opts:AV_OPTS.bg}
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

function setAV(key,val){AV[key]=val;buildAvControls();drawAvatar(AV,"avatarSVG");}

function saveAvatar(){
  try{localStorage.setItem("av_"+S.user.name,JSON.stringify(AV));}catch(e){}
  var badge=document.getElementById("avBadge");
  if(badge){badge.classList.remove("hidden");setTimeout(function(){badge.classList.add("hidden");},3000);}
  updateSbAvatar();
  notif("\u2705 Avatar salvo!");
}

function updateSbAvatar(){
  var el=document.getElementById("sbAv");if(!el)return;
  try{
    var sv=localStorage.getItem("av_"+(S.user?S.user.name:""));
    if(sv){
      var av=JSON.parse(sv);
      el.style.padding="0";
      el.innerHTML='<svg id="sbAvSVG" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:44px;height:44px;border-radius:12px;display:block"></svg>';
      drawAvatar(av,"sbAvSVG");
    }
  }catch(ex){}
}

function loadSavedAvatar(){
  if(!S.user)return;
  try{var sv=localStorage.getItem("av_"+S.user.name);if(sv)Object.assign(AV,JSON.parse(sv));}catch(e){}
  updateSbAvatar();
}

// ── HELPERS ──────────────────────────────────────────────
function groupByPerson(){
  var ppl={};
  S.projects.forEach(function(p){var k=p.resp||"Sem respons\u00e1vel";if(!ppl[k])ppl[k]={name:k,cargo:p.cargo,projs:[]};ppl[k].projs.push(p);});
  return Object.values(ppl);
}
function fmt(v){return"R$ "+(v||0).toLocaleString("pt-BR");}
function fmtD(s){if(!s)return"\u2014";try{return new Date(s).toLocaleDateString("pt-BR");}catch(e){return s;}}
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

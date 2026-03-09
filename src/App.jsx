

import { useState, useMemo, useEffect } from “react”;


const TIPOS = [“Paquete Disney”,“Paquete Universal”,“Tickets Disney”,“Tickets Disney Expedia”,“Tickets Universal Expedia”,“Tickets Universal VAX”,“Hotel Expedia”,“Crucero Disney”,“Disneyland París”];
const ETAPAS = [“Pago en curso”,“Pago completo”,“Viajó ✓”];
const ETAPA_META = {
“Pago en curso”: {color:”#c2185b”,bg:”#fce4ec”,emoji:“💳”},
“Pago completo”: {color:”#880e4f”,bg:”#f8bbd0”,emoji:“✅”},
“Viajó ✓”:      {color:”#059669”,bg:”#d1fae5”,emoji:“🏰”},
};
const TIPO_EMOJI = {
“Paquete Disney”:“🏨”,“Paquete Universal”:“🎢”,“Tickets Disney”:“🎟️”,
“Tickets Disney Expedia”:“🎟️”,“Tickets Universal Expedia”:“🎟️”,
“Tickets Universal VAX”:“🎟️”,“Hotel Expedia”:“🏩”,“Crucero Disney”:“🚢”,“Disneyland París”:“🗼”,
};
const MESES = [“ene”,“feb”,“mar”,“abr”,“may”,“jun”,“jul”,“ago”,“sep”,“oct”,“nov”,“dic”];
const STORAGE_KEY = “magic-travel-v4”;
const USUARIOS = [
{user:“sofia”,pass:“Berlin2018”,nombre:“Sofía”},
{user:“juan”,pass:“Roma2019”,nombre:“Juan”},
{user:“fer”,pass:“Pinchu2024”,nombre:“Fernando”},
];
const JSONBIN_ID = “69aef20543b1c97be9c58c5b”;
const JSONBIN_KEY = “$2a$10$R7kpT4HdEAoHgYHARRdu3eryJy/DLcwiiffS0Lf/qYVfSXXfjxZSe”;


function fmt(iso){ if(!iso) return “—”; const [y,m,d]=iso.split(”-”); return d+” “+MESES[+m-1]+” “+y; }
function restar(iso,dias){ const d=new Date(iso+“T12:00:00”); d.setDate(d.getDate()-dias); return d.toISOString().split(“T”)[0]; }
function sumar(iso,dias){ const d=new Date(iso+“T12:00:00”); d.setDate(d.getDate()+dias); return d.toISOString().split(“T”)[0]; }
function diasHasta(iso){ if(!iso) return null; const hoy=new Date(); hoy.setHours(12,0,0,0); return Math.round((new Date(iso+“T12:00:00”)-hoy)/86400000); }


function etiquetaDestino(tipo){
if(tipo===“Crucero Disney”) return “🚢 En crucero”;
if(tipo===“Disneyland París”) return “🗼 En París”;
if([“Paquete Disney”,“Tickets Disney”,“Tickets Disney Expedia”].includes(tipo)) return “🏰 En parque Disney”;
if([“Paquete Universal”,“Tickets Universal Expedia”,“Tickets Universal VAX”].includes(tipo)) return “🎢 En parque Universal”;
return “✈️ En destino”;
}


function recordatoriosPaquete(pkg){
const r=[];
if(!pkg.fechaInicio) return r;
if(pkg.tipo===“Tickets Disney”||pkg.tipo===“Tickets Disney Expedia”){
r.push({label:“📍 Enseñar Multipass al viajero”,fecha:restar(pkg.fechaInicio,21),info:“3 semanas antes del primer día”});
r.push({label:“📍 Hacer Multipass”,fecha:restar(pkg.fechaInicio,3),info:“3 días antes del primer día”});
}
if(pkg.tipo===“Paquete Disney”){
r.push({label:“❓ Preguntar actividades especiales”,fecha:restar(pkg.fechaInicio,70),info:“Boutique, sable Star Wars, etc.”});
r.push({label:“🍽️ Reservar restaurantes”,fecha:restar(pkg.fechaInicio,60),info:“60 días antes del check-in”});
r.push({label:“🌟 Reservar actividades confirmadas”,fecha:restar(pkg.fechaInicio,60),info:“Solo si confirmaron”});
r.push({label:“💰 Cobrar saldo final”,fecha:restar(pkg.fechaInicio,35),info:“35 días antes — 5 días de margen”});
r.push({label:“📍 Enseñar Multipass al viajero”,fecha:restar(pkg.fechaInicio,21),info:“3 semanas antes del check-in”});
r.push({label:“📍 Hacer Multipass”,fecha:restar(pkg.fechaInicio,7),info:“7 días antes del check-in”});
}
if(pkg.tipo===“Paquete Universal”){
r.push({label:“💰 Avisar que se viene el pago final”,fecha:restar(pkg.fechaInicio,50),info:“50 días antes del check-in”});
}
if(pkg.tipo===“Disneyland París”){
r.push({label:“🗼 Faltan 3 semanas — hacer seguimiento”,fecha:restar(pkg.fechaInicio,21),info:“Avisar al viajero que se acerca el viaje”});
}
if(pkg.tipo===“Crucero Disney”){
r.push({label:“💰 Avisar que se viene el pago final”,fecha:restar(pkg.fechaInicio,70),info:“70 días antes de embarcar”});
r.push({label:“🚢 Preparar embarque”,fecha:restar(pkg.fechaInicio,7),info:“1 semana antes de abordar”});
}
if([“Tickets Universal Expedia”,“Tickets Universal VAX”,“Hotel Expedia”].includes(pkg.tipo)){
r.push({label:“💬 Contactar — ¿tienen alguna duda?”,fecha:restar(pkg.fechaInicio,7),info:“1 semana antes del viaje”});
}
if(pkg.fechaFin){
r.push({label:“⭐ Preguntar cómo les fue”,fecha:sumar(pkg.fechaFin,2),info:“2 días después del regreso”,postViaje:true});
}
return r;
}


function recKey(r){ return r.label.replace(/[^a-z0-9]/gi,””).toLowerCase(); }


function exportarCSV(viajeros){
const cols=[“Viajero”,“Personas”,“Estado”,“WhatsApp”,“Notas”,“Tipo”,“Nro Reserva”,“Inicio”,“Fin”,“Monto”,“Comision”,“Pagado”,“Falta”];
const rows=[];
viajeros.forEach(v=>(v.paquetes||[]).forEach(p=>{
rows.push([v.nombre,v.personas,v.etapa,v.whatsapp||””,v.notas||””,p.tipo,p.nroReserva||””,p.fechaInicio||””,p.fechaFin||””,p.montoTotal||0,p.comision||0,p.pagado||0,(p.montoTotal||0)-(p.pagado||0)]);
}));
const csv=[cols,…rows].map(r=>r.map(v=>’”’+String(v).replace(/”/g,’””’)+’”’).join(”,”)).join(”\n”);
const uri=“data:text/csv;charset=utf-8,”+encodeURIComponent(”\uFEFF”+csv);
const a=document.createElement(“a”); a.href=uri; a.download=“magic-travel.csv”; a.click();
}


function descargarPlantilla(){
const cols=[“Nombre”,“WhatsApp”,“Personas”,“Tipo de paquete”,“Nro reserva”,“Fecha inicio AAAA-MM-DD”,“Fecha fin AAAA-MM-DD”,“Monto total USD”,“Pagado USD”,“Comision USD”,“Notas”];
const ej=[“Familia Garcia”,“5491112345678”,“4”,“Paquete Disney”,“DSN-2025-001”,“2025-07-15”,“2025-07-22”,“3200”,“1600”,“384”,“2 adultos 2 ninos”];
const csv=[cols,ej].map(r=>r.map(v=>’”’+String(v).replace(/”/g,’””’)+’”’).join(”,”)).join(”\n”);
const uri=“data:text/csv;charset=utf-8,”+encodeURIComponent(”\uFEFF”+csv);
const a=document.createElement(“a”); a.href=uri; a.download=“plantilla-magic-travel.csv”; a.click();
}


function mapearTipo(raw){
if(!raw) return “Paquete Disney”;
const r=raw.toLowerCase();
if(r.includes(“cruise”)||r.includes(“crucero”)) return “Crucero Disney”;
if(r.includes(“paris”)||r.includes(“parís”)) return “Disneyland París”;
if(r.includes(“universal”)&&r.includes(“expedia”)) return “Tickets Universal Expedia”;
if(r.includes(“universal”)&&r.includes(“vax”)) return “Tickets Universal VAX”;
if(r.includes(“universal”)) return “Paquete Universal”;
if(r.includes(“expedia”)&&r.includes(“hotel”)) return “Hotel Expedia”;
if(r.includes(“expedia”)) return “Tickets Disney Expedia”;
if(r.includes(“ticket”)&&r.includes(“disney”)) return “Tickets Disney”;
if(r.includes(“disney”)||r.includes(“wdw”)) return “Paquete Disney”;
if(r.includes(“hotel”)) return “Hotel Expedia”;
return “Paquete Disney”;
}


function parsearFecha(raw){
if(!raw||!raw.trim()) return “”;
const m1=raw.match(/^(\d{1,2})/(\d{1,2})/(\d{2,4})$/);
if(m1){ const y=m1[3].length===2?“20”+m1[3]:m1[3]; return y+”-”+m1[1].padStart(2,“0”)+”-”+m1[2].padStart(2,“0”); }
const m2=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
if(m2) return m2[1]+”-”+m2[2]+”-”+m2[3];
const m3=raw.match(/^(\d{1,2})/(\d{1,2})/(\d{4})$/);
if(m3) return m3[3]+”-”+m3[2].padStart(2,“0”)+”-”+m3[1].padStart(2,“0”);
return “”;
}


function procesarCSV(text){
const lines=text.split(/\r?\n/).filter(l=>l.trim());
if(lines.length<2) return [];
const sep=lines[0].includes(”;”)?”;”:”,”
function parseRow(line){ const res=[]; let cur=””; let inQ=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c===’”’){inQ=!inQ;}else if(c===sep&&!inQ){res.push(cur.trim());cur=””;}else{cur+=c;} } res.push(cur.trim()); return res; }
const headers=parseRow(lines[0]);
const h=headers.map(x=>x.toLowerCase().replace(/[^a-z]/g,””));
const fi=((…keys)=>{ for(const k of keys){ const i=h.findIndex(x=>x.includes(k)); if(i>=0) return i; } return -1; });
const cols={ nombre:fi(“customerfirstname”,“nombre”,“customer”,“name”,“client”), apellido:fi(“lastname”,“apellido”), celular:fi(“cell”,“celular”,“whatsapp”,“phone”), tipo:fi(“product”,“tipo”,“type”,“paquete”,“saletyp”), destino:fi(“destination”,“destino”,“resort”), reserva:fi(“number”,“reserva”,“booking”,“nro”), checkIn:fi(“checkin”,“inicio”,“entrada”,“fecha”), checkOut:fi(“checkout”,“fin”,“salida”), total:fi(“total”,“monto”,“amount”), comision:fi(“commission”,“comision”,“agency”) };
const clientes=[];
for(let i=1;i<lines.length;i++){
const row=parseRow(lines[i]);
if(row.length<2) continue;
const get=(idx)=>idx>=0?(row[idx]||””).replace(/^”|”$/g,””).trim():””;
const nombre=[get(cols.nombre),get(cols.apellido)].filter(Boolean).join(” “);
if(!nombre) continue;
const checkIn=parsearFecha(get(cols.checkIn));
const checkOut=parsearFecha(get(cols.checkOut));
const total=parseFloat(get(cols.total))||0;
const comision=parseFloat(get(cols.comision))||0;
const tipo=mapearTipo(get(cols.tipo)||get(cols.destino));
clientes.push({id:Date.now()+Math.random(),nombre,personas:2,etapa:“Pago en curso”,whatsapp:get(cols.celular),notas:””,paquetes:[{id:Date.now()+Math.random(),tipo,nroReserva:get(cols.reserva),fechaInicio:checkIn,fechaFin:checkOut,montoTotal:total,comision,pagado:0,cargadoCRM:false,multipassListo:false,notas:””}]});
}
return clientes;
}


const lbl={display:“block”,fontSize:11,fontWeight:800,color:”#ad5c7a”,marginBottom:4,textTransform:“uppercase”,letterSpacing:0.5};
const inp={width:“100%”,border:“1.5px solid #e2e8f0”,borderRadius:10,padding:“9px 12px”,fontSize:13,fontFamily:“inherit”,fontWeight:600,color:”#3d0026”,outline:“none”,background:”#fff”,boxSizing:“border-box”};


function Badge({etapa}){
const m=ETAPA_META[etapa]||ETAPA_META[“Pago en curso”];
return <span style={{background:m.bg,color:m.color,borderRadius:20,padding:“3px 10px”,fontSize:11,fontWeight:800,whiteSpace:“nowrap”}}>{m.emoji} {etapa}</span>;
}


function CheckRow({checked,onChange,label}){
return(
<div onClick={onChange} style={{display:“flex”,alignItems:“center”,gap:10,cursor:“pointer”,padding:“9px 0”,borderBottom:“1px solid #f1f5f9”}}>
<div style={{width:22,height:22,borderRadius:6,border:checked?“2px solid #059669”:“2px solid #cbd5e1”,background:checked?”#059669”:”#fff”,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>
{checked&&<span style={{color:”#fff”,fontSize:13,fontWeight:900}}>✓</span>}
</div>
<span style={{fontSize:13,fontWeight:700,color:checked?”#059669”:”#ad5c7a”}}>{label}</span>
</div>
);
}


const PKG_BASE={tipo:“Paquete Disney”,nroReserva:””,fechaInicio:””,fechaFin:””,montoTotal:0,comision:0,pagado:0,cargadoCRM:false,multipassListo:false,notas:””,recsDone:{}};


function PaqueteCard({pkg,onChange,onDelete}){
const [open,setOpen]=useState(true);
const [montoPago,setMontoPago]=useState(””);


const set=(k,v)=>onChange({…pkg,[k]:v});
const falta=(pkg.montoTotal||0)-(pkg.pagado||0);
const pct=(pkg.montoTotal||0)>0?Math.min(100,((pkg.pagado||0)/(pkg.montoTotal||0))*100):0;
const recs=recordatoriosPaquete(pkg);
const diasViaje=diasHasta(pkg.fechaInicio);


function pagarMonto(){ const m=Number(montoPago); if(!m||m<=0) return; onChange({…pkg,pagado:Math.min((pkg.pagado||0)+m,pkg.montoTotal||0)}); setMontoPago(””); }


return(
<div style={{border:“1.5px solid #e2e8f0”,borderRadius:16,marginBottom:12,overflow:“hidden”}}>
<div onClick={()=>setOpen(o=>!o)} style={{background:”#fff9fc”,padding:“13px 16px”,display:“flex”,alignItems:“center”,gap:10,cursor:“pointer”,userSelect:“none”}}>
<span style={{fontSize:20}}>{TIPO_EMOJI[pkg.tipo]||“📦”}</span>
<div style={{flex:1}}>
<div style={{fontWeight:800,fontSize:14,color:”#3d0026”}}>{pkg.tipo}</div>
<div style={{fontSize:11,color:“rgba(255,255,255,0.6)”,fontWeight:700,marginTop:1}}>
{pkg.nroReserva||“Sin nro reserva”}{pkg.fechaInicio?” · “+fmt(pkg.fechaInicio):””}
{diasViaje!==null&&diasViaje>=0&&<span style={{color:diasViaje<=7?”#dc2626”:diasViaje<=30?”#d97706”:”#059669”,fontWeight:800}}> · {diasViaje===0?”¡Hoy viaja!”:diasViaje===1?“Mañana viaja”:“en “+diasViaje+” días”}</span>}
</div>
</div>
<div style={{textAlign:“right”,marginRight:8}}>
{(pkg.montoTotal||0)>0&&<div style={{fontWeight:900,fontSize:14}}>${(pkg.montoTotal||0).toLocaleString()}</div>}
{falta>0&&(pkg.montoTotal||0)>0&&<div style={{fontSize:10,color:”#dc2626”,fontWeight:800}}>Falta ${falta.toLocaleString()}</div>}
{falta<=0&&(pkg.montoTotal||0)>0&&<div style={{fontSize:10,color:”#059669”,fontWeight:800}}>✓ Saldado</div>}
</div>
<span style={{color:“rgba(255,255,255,0.6)”,fontSize:14}}>{open?“▲”:“▼”}</span>
<button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:”#fee2e2”,border:“none”,color:”#dc2626”,borderRadius:8,width:28,height:28,cursor:“pointer”,fontSize:16,display:“flex”,alignItems:“center”,justifyContent:“center”,flexShrink:0}}>×</button>
</div>
{open&&(
<div style={{padding:16}}>
<div style={{display:“flex”,flexDirection:“column”,gap:10,marginBottom:14}}>
<div><label style={lbl}>Tipo de paquete</label><select style={inp} value={pkg.tipo} onChange={e=>set(“tipo”,e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
<div><label style={lbl}>Nro de reserva</label><input style={inp} value={pkg.nroReserva||””} onChange={e=>set(“nroReserva”,e.target.value)} placeholder=“DSN-2024-XXX”/></div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:10}}>
<div><label style={lbl}>Fecha inicio</label><input style={inp} type=“date” value={pkg.fechaInicio||””} onChange={e=>set(“fechaInicio”,e.target.value)}/></div>
<div><label style={lbl}>Fecha fin</label><input style={inp} type=“date” value={pkg.fechaFin||””} onChange={e=>set(“fechaFin”,e.target.value)}/></div>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:10}}>
<div><label style={lbl}>Monto total (USD)</label><input style={inp} type=“number” min=“0” value={pkg.montoTotal||0} onChange={e=>set(“montoTotal”,+e.target.value)}/></div>
<div><label style={lbl}>Comisión (USD)</label><input style={inp} type=“number” min=“0” value={pkg.comision||0} onChange={e=>set(“comision”,+e.target.value)}/></div>
</div>
</div>
<div style={{background:”#fff9fc”,borderRadius:12,padding:14,marginBottom:12}}>
<div style={{fontWeight:800,fontSize:13,marginBottom:10,color:”#3d0026”}}>💳 Pagos</div>
<div style={{display:“flex”,gap:10,marginBottom:10}}>
<div style={{flex:1,background:”#fce4ec”,borderRadius:10,padding:“10px 8px”,textAlign:“center”}}><div style={{fontSize:10,fontWeight:800,color:”#e91e8c”}}>PAGADO</div><div style={{fontSize:19,fontWeight:900,color:”#c2185b”}}>${(pkg.pagado||0).toLocaleString()}</div></div>
<div style={{flex:1,background:falta>0?”#fee2e2”:”#d1fae5”,borderRadius:10,padding:“10px 8px”,textAlign:“center”}}><div style={{fontSize:10,fontWeight:800,color:falta>0?”#dc2626”:”#059669”}}>FALTA</div><div style={{fontSize:19,fontWeight:900,color:falta>0?”#dc2626”:”#059669”}}>${falta.toLocaleString()}</div></div>
<div style={{flex:1,background:”#fce4ec”,borderRadius:10,padding:“10px 8px”,textAlign:“center”}}><div style={{fontSize:10,fontWeight:800,color:”#ad1457”}}>COMISIÓN</div><div style={{fontSize:19,fontWeight:900,color:”#880e4f”}}>${(pkg.comision||0).toLocaleString()}</div></div>
</div>
<div style={{background:”#fce4ec”,borderRadius:6,height:7,marginBottom:10}}><div style={{background:pct===100?”#059669”:“linear-gradient(90deg,#f06292,#e91e8c)”,borderRadius:6,height:7,width:pct+”%”,transition:“width 0.3s”}}/></div>
<div style={{display:“flex”,gap:8}}>
<input style={{…inp,flex:1}} type=“number” value={montoPago} onChange={e=>setMontoPago(e.target.value)} placeholder=“Registrar pago (USD)”/>
<button onClick={pagarMonto} style={{background:”#e91e8c”,border:“none”,color:”#fff”,borderRadius:10,padding:“0 16px”,fontWeight:900,fontSize:13,cursor:“pointer”,fontFamily:“inherit”,whiteSpace:“nowrap”}}>+ Pago</button>
</div>
</div>
<div style={{background:”#fff9fc”,borderRadius:12,padding:“10px 14px”,marginBottom:12}}>
<div style={{fontWeight:800,fontSize:13,marginBottom:4,color:”#3d0026”}}>✅ Checks</div>
<CheckRow checked={!!pkg.cargadoCRM} onChange={()=>set(“cargadoCRM”,!pkg.cargadoCRM)} label=“Cargado en CRM / PCO”/>
<CheckRow checked={!!pkg.multipassListo} onChange={()=>{
const newVal=!pkg.multipassListo;
const newRecsDone={…(pkg.recsDone||{})};
if(newVal){
newRecsDone[“hacermultipass”]=true;
newRecsDone[“hacermultipassviajero”]=true;
newRecsDone[“ensearMultipassAlViajero”]=true;
newRecsDone[“ensearMultipassAlViajero”]=true;
// mark all multipass-related keys
recordatoriosPaquete({…pkg,multipassListo:false}).forEach(r=>{
if(r.label.toLowerCase().includes(“multipass”)){newRecsDone[recKey(r)]=true;}
});
}
onChange({…pkg,multipassListo:newVal,recsDone:newRecsDone});
}} label=“Multipass listo”/>
</div>
<div style={{marginBottom:12}}>
<label style={lbl}>Notas del paquete</label>
<textarea style={{…inp,height:60,resize:“vertical”}} value={pkg.notas||””} onChange={e=>set(“notas”,e.target.value)} placeholder=“Actividades especiales, observaciones, detalles del paquete…”/>
</div>
{recs.length>0&&(
<div style={{background:”#fce4ec”,borderRadius:12,padding:14,border:“1.5px solid #bae6fd”}}>
<div style={{fontWeight:800,fontSize:13,marginBottom:10,color:”#c2185b”}}>🔔 Recordatorios de este paquete</div>
{recs.map((r,i)=>{
const diff=diasHasta(r.fecha);
const pasado=diff!==null&&diff<0;
const hoyRec=diff!==null&&diff<=1;
return(
<div key={i} style={{display:“flex”,alignItems:“center”,gap:10,background:hoyRec?”#fff7ed”:pasado?”#fff9fc”:”#fff”,borderRadius:8,padding:“9px 12px”,marginBottom:6,opacity:pasado?0.5:1}}>
<div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:hoyRec?”#d97706”:”#3d0026”}}>{r.label}</div><div style={{fontSize:10,color:“rgba(255,255,255,0.6)”,marginTop:1}}>{r.info}</div></div>
<div style={{textAlign:“right”,flexShrink:0}}>
<div style={{fontWeight:900,color:hoyRec?”#d97706”:”#c2185b”,fontSize:12}}>{fmt(r.fecha)}</div>
{diff!==null&&<div style={{fontSize:10,color:diff<=0?”#dc2626”:diff<=7?”#d97706”:”#ad5c7a”,fontWeight:800}}>{diff<0?“hace “+Math.abs(diff)+“d”:diff===0?“hoy”:diff===1?“mañana”:“en “+diff+“d”}</div>}
</div>
</div>
);
})}
</div>
)}
</div>
)}
</div>
);
}


function ModalViajero({viajero,onClose,onSave,onDelete}){
const [form,setForm]=useState({…viajero,paquetes:[…(viajero.paquetes||[])]});
const [confirmDelete,setConfirmDelete]=useState(false);
const set=(k,v)=>setForm(f=>({…f,[k]:v}));
const totalMonto=form.paquetes.reduce((s,p)=>s+(p.montoTotal||0),0);
const totalPagado=form.paquetes.reduce((s,p)=>s+(p.pagado||0),0);
const totalComision=form.paquetes.reduce((s,p)=>s+(p.comision||0),0);
const totalFalta=totalMonto-totalPagado;
function updatePkg(i,pkg){setForm(f=>({…f,paquetes:f.paquetes.map((p,j)=>j===i?pkg:p)}));}
function deletePkg(i){setForm(f=>({…f,paquetes:f.paquetes.filter((_,j)=>j!==i)}));}
function addPkg(){setForm(f=>({…f,paquetes:[…f.paquetes,{…PKG_BASE,id:Date.now()}]}));}
function handleSave(){onSave({…form,id:form.id||Date.now()});}
return(
<div style={{position:“fixed”,inset:0,background:“rgba(15,23,42,0.72)”,zIndex:200,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={onClose}>
<div style={{background:”#fff”,borderRadius:22,width:“100%”,maxWidth:620,maxHeight:“93vh”,overflowY:“auto”,boxShadow:“0 30px 80px rgba(0,0,0,0.4)”}} onClick={e=>e.stopPropagation()}>
<div style={{background:“linear-gradient(135deg,#c2185b,#e91e8c)”,borderRadius:“22px 22px 0 0”,padding:“20px 24px”,position:“sticky”,top:0,zIndex:10}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“flex-start”}}>
<div>
<div style={{fontSize:20,fontWeight:900,color:”#fff”}}>👥 {form.nombre||“Nuevo cliente”}</div>
<div style={{fontSize:12,color:”#f48fb1”,fontWeight:700,marginTop:3}}>{form.personas} pers. · {form.paquetes.length} paquete{form.paquetes.length!==1?“s”:””} · <Badge etapa={form.etapa}/></div>
</div>
<button onClick={onClose} style={{background:“rgba(255,255,255,0.12)”,border:“none”,color:”#fff”,borderRadius:10,width:34,height:34,cursor:“pointer”,fontSize:16,fontFamily:“inherit”}}>✕</button>
</div>
{form.paquetes.length>0&&(
<div style={{display:“flex”,gap:8,marginTop:12}}>
{[{l:“TOTAL”,v:”$”+totalMonto.toLocaleString(),c:”#fff”},{l:“PAGADO”,v:”$”+totalPagado.toLocaleString(),c:”#86efac”},{l:“FALTA”,v:”$”+totalFalta.toLocaleString(),c:totalFalta>0?”#fca5a5”:”#86efac”},{l:“COMISIÓN”,v:”$”+totalComision.toLocaleString(),c:”#f48fb1”}].map((s,i)=>(
<div key={i} style={{flex:1,background:“rgba(255,255,255,0.08)”,borderRadius:10,padding:“8px 6px”,textAlign:“center”}}>
<div style={{fontSize:9,fontWeight:800,color:“rgba(255,255,255,0.6)”}}>{s.l}</div>
<div style={{fontSize:13,fontWeight:900,color:s.c}}>{s.v}</div>
</div>
))}
</div>
)}
</div>
<div style={{padding:24}}>
<div style={{display:“flex”,flexDirection:“column”,gap:10,marginBottom:20}}>
<div><label style={lbl}>Nombre del cliente / grupo</label><input style={inp} value={form.nombre} onChange={e=>set(“nombre”,e.target.value)} placeholder=“Ej: Familia García”/></div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:10}}>
<div><label style={lbl}>Personas</label><input style={inp} type=“number” min=“1” value={form.personas} onChange={e=>set(“personas”,+e.target.value)}/></div>
<div><label style={lbl}>Estado</label><select style={inp} value={form.etapa} onChange={e=>set(“etapa”,e.target.value)}>{ETAPAS.map(e=><option key={e}>{e}</option>)}</select></div>
</div>
<div><label style={lbl}>WhatsApp (con código de país)</label><input style={inp} value={form.whatsapp||””} onChange={e=>set(“whatsapp”,e.target.value)} placeholder=“Ej: 5491112345678”/></div>
<div><label style={lbl}>Notas</label><textarea style={{…inp,height:56,resize:“vertical”}} value={form.notas||””} onChange={e=>set(“notas”,e.target.value)} placeholder=“Observaciones del cliente…”/></div>
</div>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,marginBottom:12}}>
<div style={{fontWeight:900,fontSize:15,color:”#3d0026”}}>📦 Paquetes ({form.paquetes.length})</div>
<button onClick={addPkg} style={{background:“linear-gradient(135deg,#c2185b,#e91e8c)”,border:“none”,color:”#fff”,borderRadius:12,padding:“8px 16px”,fontWeight:800,fontSize:12,cursor:“pointer”,fontFamily:“inherit”}}>+ Agregar paquete</button>
</div>
{form.paquetes.length===0&&<div onClick={addPkg} style={{border:“2px dashed #cbd5e1”,borderRadius:14,padding:“30px 20px”,textAlign:“center”,cursor:“pointer”,color:“rgba(255,255,255,0.6)”,fontWeight:700,marginBottom:16}}>Tap para agregar el primer paquete</div>}
{form.paquetes.map((pkg,i)=><PaqueteCard key={pkg.id||i} pkg={pkg} onChange={p=>updatePkg(i,p)} onDelete={()=>deletePkg(i)}/>)}
<div style={{display:“flex”,justifyContent:“space-between”,gap:10,marginTop:8}}>
{form.id
? confirmDelete
? <div style={{display:“flex”,alignItems:“center”,gap:8,background:”#fee2e2”,borderRadius:12,padding:“8px 14px”}}>
<span style={{fontSize:12,fontWeight:800,color:”#dc2626”,flex:1}}>¿Eliminar a {form.nombre}?</span>
<button onClick={()=>onDelete(form.id)} style={{background:”#dc2626”,border:“none”,color:”#fff”,borderRadius:8,padding:“6px 12px”,fontWeight:900,cursor:“pointer”,fontFamily:“inherit”,fontSize:12}}>Sí, eliminar</button>
<button onClick={()=>setConfirmDelete(false)} style={{background:”#fff”,border:“1px solid #fca5a5”,color:”#dc2626”,borderRadius:8,padding:“6px 10px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”,fontSize:12}}>Cancelar</button>
</div>
: <button onClick={()=>setConfirmDelete(true)} style={{background:”#fee2e2”,border:“none”,color:”#dc2626”,borderRadius:12,padding:“11px 18px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”,fontSize:13}}>Eliminar</button>
: <div/>
}
<div style={{display:“flex”,gap:10}}>
<button onClick={onClose} style={{background:”#fdf2f8”,border:“none”,color:”#ad5c7a”,borderRadius:12,padding:“11px 18px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”,fontSize:13}}>Cancelar</button>
<button onClick={handleSave} style={{background:“linear-gradient(135deg,#c2185b,#e91e8c)”,border:“none”,color:”#fff”,borderRadius:12,padding:“11px 26px”,fontWeight:900,cursor:“pointer”,fontFamily:“inherit”,fontSize:13}}>Guardar ✓</button>
</div>
</div>
</div>
</div>
</div>
);
}


const FILA_BASE={nombre:””,whatsapp:””,personas:2,tipo:“Paquete Disney”,nroReserva:””,fechaInicio:””,fechaFin:””,montoTotal:””,pagado:””,comision:””,notas:””};


function ModalCargaRapida({onClose,onSave}){
const [filas,setFilas]=useState([{…FILA_BASE}]);
const [filaActiva,setFilaActiva]=useState(0);
function setFila(i,k,v){setFilas(fs=>fs.map((f,j)=>j===i?{…f,[k]:v}:f));}
function addFila(){setFilas(fs=>[…fs,{…FILA_BASE}]);setFilaActiva(filas.length);}
function removeFila(i){setFilas(fs=>fs.filter((_,j)=>j!==i));setFilaActiva(Math.max(0,i-1));}
function guardarTodo(){
const validos=filas.filter(f=>f.nombre.trim()&&f.fechaInicio);
if(!validos.length) return;
onSave(validos.map(f=>({id:Date.now()+Math.random(),nombre:f.nombre.trim(),personas:+f.personas||2,etapa:“Pago en curso”,notas:f.notas||””,whatsapp:f.whatsapp||””,paquetes:[{id:Date.now()+Math.random(),tipo:f.tipo,nroReserva:f.nroReserva||””,fechaInicio:f.fechaInicio,fechaFin:f.fechaFin||””,montoTotal:+f.montoTotal||0,comision:+f.comision||0,pagado:+f.pagado||0,cargadoCRM:false,multipassListo:false,notas:””}]})));
onClose();
}
const f=filas[filaActiva]||filas[0];
const validos=filas.filter(f=>f.nombre.trim()&&f.fechaInicio).length;
return(
<div style={{position:“fixed”,inset:0,background:“rgba(15,23,42,0.72)”,zIndex:200,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={onClose}>
<div style={{background:”#fff”,borderRadius:22,width:“100%”,maxWidth:540,maxHeight:“92vh”,overflowY:“auto”,boxShadow:“0 30px 80px rgba(0,0,0,0.4)”}} onClick={e=>e.stopPropagation()}>
<div style={{background:“linear-gradient(135deg,#c2185b,#e91e8c)”,borderRadius:“22px 22px 0 0”,padding:“18px 22px”}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”}}>
<div><div style={{fontSize:17,fontWeight:900,color:”#fff”}}>⚡ Carga rápida</div><div style={{fontSize:11,color:”#f48fb1”,fontWeight:700,marginTop:2}}>Cargá varios clientes de una sola vez</div></div>
<button onClick={onClose} style={{background:“rgba(255,255,255,0.12)”,border:“none”,color:”#fff”,borderRadius:10,width:34,height:34,cursor:“pointer”,fontSize:16}}>✕</button>
</div>
</div>
<div style={{padding:20}}>
<div style={{display:“flex”,gap:6,flexWrap:“wrap”,marginBottom:16}}>
{filas.map((f,i)=>(
<button key={i} onClick={()=>setFilaActiva(i)} style={{background:filaActiva===i?”#3d0026”:”#fdf2f8”,color:filaActiva===i?”#fff”:”#ad5c7a”,border:“none”,borderRadius:10,padding:“6px 12px”,fontWeight:800,fontSize:12,cursor:“pointer”,fontFamily:“inherit”}}>{f.nombre.trim()||“Cliente “+(i+1)}</button>
))}
<button onClick={addFila} style={{background:”#f0fdf4”,color:”#059669”,border:“1.5px dashed #86efac”,borderRadius:10,padding:“6px 12px”,fontWeight:800,fontSize:12,cursor:“pointer”,fontFamily:“inherit”}}>+ Agregar</button>
</div>
<div style={{background:”#fff9fc”,borderRadius:16,padding:16,marginBottom:16}}>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:10,marginBottom:10}}>
<div><label style={lbl}>Nombre</label><input style={{…inp,fontSize:13}} value={f.nombre} onChange={e=>setFila(filaActiva,“nombre”,e.target.value)} placeholder=“Familia García”/></div>
<div><label style={lbl}>WhatsApp</label><input style={{…inp,fontSize:13}} value={f.whatsapp} onChange={e=>setFila(filaActiva,“whatsapp”,e.target.value)} placeholder=“5491112345678”/></div>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 80px”,gap:10,marginBottom:10}}>
<div><label style={lbl}>Tipo de paquete</label><select style={{…inp,fontSize:13}} value={f.tipo} onChange={e=>setFila(filaActiva,“tipo”,e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
<div><label style={lbl}>Personas</label><input style={{…inp,fontSize:13,textAlign:“center”}} type=“number” min=“1” value={f.personas} onChange={e=>setFila(filaActiva,“personas”,e.target.value)}/></div>
</div>
<div style={{marginBottom:10}}><label style={lbl}>Nro de reserva</label><input style={{…inp,fontSize:13}} value={f.nroReserva} onChange={e=>setFila(filaActiva,“nroReserva”,e.target.value)} placeholder=“DSN-2025-001”/></div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:10,marginBottom:10}}>
<div><label style={lbl}>Fecha inicio</label><input style={{…inp,fontSize:13}} type=“date” value={f.fechaInicio} onChange={e=>setFila(filaActiva,“fechaInicio”,e.target.value)}/></div>
<div><label style={lbl}>Fecha fin</label><input style={{…inp,fontSize:13}} type=“date” value={f.fechaFin} onChange={e=>setFila(filaActiva,“fechaFin”,e.target.value)}/></div>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr 1fr”,gap:10,marginBottom:10}}>
<div><label style={lbl}>Monto (USD)</label><input style={{…inp,fontSize:13}} type=“number” min=“0” value={f.montoTotal} onChange={e=>setFila(filaActiva,“montoTotal”,e.target.value)} placeholder=“0”/></div>
<div><label style={lbl}>Pagado (USD)</label><input style={{…inp,fontSize:13}} type=“number” min=“0” value={f.pagado} onChange={e=>setFila(filaActiva,“pagado”,e.target.value)} placeholder=“0”/></div>
<div><label style={lbl}>Comisión (USD)</label><input style={{…inp,fontSize:13}} type=“number” min=“0” value={f.comision} onChange={e=>setFila(filaActiva,“comision”,e.target.value)} placeholder=“0”/></div>
</div>
<div><label style={lbl}>Notas</label><textarea style={{…inp,fontSize:13,height:48,resize:“vertical”}} value={f.notas} onChange={e=>setFila(filaActiva,“notas”,e.target.value)} placeholder=“Observaciones…”/></div>
{filas.length>1&&<div style={{textAlign:“right”,marginTop:8}}><button onClick={()=>removeFila(filaActiva)} style={{background:”#fee2e2”,border:“none”,color:”#dc2626”,borderRadius:8,padding:“6px 12px”,fontWeight:800,fontSize:12,cursor:“pointer”,fontFamily:“inherit”}}>Eliminar este cliente</button></div>}
</div>
{f.fechaInicio&&(
<div style={{background:”#fce4ec”,borderRadius:12,padding:12,marginBottom:16,border:“1.5px solid #bae6fd”}}>
<div style={{fontSize:12,fontWeight:800,color:”#c2185b”,marginBottom:6}}>🔔 Recordatorios que se van a generar</div>
{recordatoriosPaquete({tipo:f.tipo,fechaInicio:f.fechaInicio,fechaFin:f.fechaFin}).map((r,i)=>(
<div key={i} style={{fontSize:11,fontWeight:700,color:”#c2185b”,marginBottom:3}}>· {r.label} — {fmt(r.fecha)}</div>
))}
</div>
)}
<div style={{display:“flex”,gap:10,justifyContent:“flex-end”}}>
<button onClick={onClose} style={{background:”#fdf2f8”,border:“none”,color:”#ad5c7a”,borderRadius:12,padding:“11px 18px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”}}>Cancelar</button>
<button onClick={guardarTodo} disabled={validos===0} style={{background:validos>0?“linear-gradient(135deg,#059669,#0d9488)”:”#fce4ec”,border:“none”,color:validos>0?”#fff”:“rgba(255,255,255,0.6)”,borderRadius:12,padding:“11px 26px”,fontWeight:900,cursor:validos>0?“pointer”:“default”,fontFamily:“inherit”,fontSize:13}}>
⚡ Guardar {validos} cliente{validos!==1?“s”:””}
</button>
</div>
</div>
</div>
</div>
);
}


function ModalImportar({onClose,onSave}){
const [preview,setPreview]=useState(null);
const [error,setError]=useState(””);
function handleFile(e){
const file=e.target.files[0]; if(!file) return;
const reader=new FileReader();
reader.onload=ev=>{
try{
const clientes=procesarCSV(ev.target.result);
if(!clientes.length){setError(“No se encontraron clientes. Verificá que el archivo tenga datos.”);}
else{setPreview(clientes);setError(””);}
}catch(err){setError(“Error al leer el archivo: “+err.message);}
};
reader.readAsText(file,“UTF-8”);
}
function confirmar(){if(preview&&preview.length){onSave(preview);onClose();}}
return(
<div style={{position:“fixed”,inset:0,background:“rgba(15,23,42,0.72)”,zIndex:200,display:“flex”,alignItems:“center”,justifyContent:“center”,padding:16}} onClick={onClose}>
<div style={{background:”#fff”,borderRadius:22,width:“100%”,maxWidth:500,maxHeight:“88vh”,overflowY:“auto”,boxShadow:“0 30px 80px rgba(0,0,0,0.4)”}} onClick={e=>e.stopPropagation()}>
<div style={{background:“linear-gradient(135deg,#c2185b,#e91e8c)”,borderRadius:“22px 22px 0 0”,padding:“18px 22px”}}>
<div style={{display:“flex”,justifyContent:“space-between”,alignItems:“center”}}>
<div><div style={{fontSize:17,fontWeight:900,color:”#fff”}}>📥 Importar desde Excel / CSV</div><div style={{fontSize:11,color:”#f48fb1”,fontWeight:700,marginTop:2}}>Cargá todos tus clientes de una sola vez</div></div>
<button onClick={onClose} style={{background:“rgba(255,255,255,0.12)”,border:“none”,color:”#fff”,borderRadius:10,width:34,height:34,cursor:“pointer”,fontSize:16}}>✕</button>
</div>
</div>
<div style={{padding:20}}>
<div style={{background:”#fce4ec”,borderRadius:12,padding:14,marginBottom:16,border:“1.5px solid #bae6fd”}}>
<div style={{fontWeight:800,fontSize:13,color:”#c2185b”,marginBottom:8}}>Cómo usarlo:</div>
<div style={{fontSize:12,color:”#c2185b”,fontWeight:700,lineHeight:1.8}}>
<div>1. Tocá <strong>“Descargar plantilla”</strong> para bajar el modelo</div>
<div>2. Abrís la plantilla en Excel o Numbers</div>
<div>3. Completás todos tus clientes</div>
<div>4. Guardás como CSV y lo subís acá</div>
</div>
</div>
<button onClick={descargarPlantilla} style={{width:“100%”,background:“linear-gradient(135deg,#0369a1,#0ea5e9)”,border:“none”,color:”#fff”,borderRadius:12,padding:“12px”,fontWeight:900,fontSize:13,cursor:“pointer”,fontFamily:“inherit”,marginBottom:12}}>⬇ Descargar plantilla</button>
{!preview&&(
<label style={{display:“block”,width:“100%”,boxSizing:“border-box”,background:”#fff9fc”,border:“2px dashed #94a3b8”,borderRadius:12,padding:“24px”,textAlign:“center”,cursor:“pointer”,fontFamily:“inherit”}}>
<div style={{fontSize:32,marginBottom:8}}>📂</div>
<div style={{fontWeight:800,fontSize:14,color:”#475569”}}>Tocá para seleccionar el archivo CSV</div>
<div style={{fontSize:12,color:“rgba(255,255,255,0.6)”,marginTop:4}}>Archivos .csv o .txt</div>
<input type=“file” accept=”.csv,.txt” onChange={handleFile} style={{display:“none”}}/>
</label>
)}
{error&&<div style={{background:”#fee2e2”,borderRadius:10,padding:“10px 14px”,color:”#dc2626”,fontWeight:700,fontSize:13,marginTop:12}}>{error}</div>}
{preview&&(
<div style={{marginTop:12}}>
<div style={{background:”#d1fae5”,borderRadius:10,padding:“10px 14px”,color:”#059669”,fontWeight:800,fontSize:13,marginBottom:12}}>✓ Se encontraron {preview.length} clientes listos para importar</div>
<div style={{maxHeight:200,overflowY:“auto”,marginBottom:12}}>
{preview.map((c,i)=>(
<div key={i} style={{display:“flex”,alignItems:“center”,gap:10,background:”#fff9fc”,borderRadius:8,padding:“8px 12px”,marginBottom:6}}>
<span style={{fontWeight:800,fontSize:13,flex:1}}>{c.nombre}</span>
<span style={{fontSize:11,color:”#ad5c7a”,fontWeight:700}}>{TIPO_EMOJI[c.paquetes[0].tipo]} {c.paquetes[0].tipo}</span>
<span style={{fontSize:11,color:“rgba(255,255,255,0.6)”}}>{fmt(c.paquetes[0].fechaInicio)}</span>
</div>
))}
</div>
<div style={{display:“flex”,gap:10}}>
<button onClick={()=>{setPreview(null);setError(””);}} style={{flex:1,background:”#fdf2f8”,border:“none”,color:”#ad5c7a”,borderRadius:12,padding:“11px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”}}>Cambiar archivo</button>
<button onClick={confirmar} style={{flex:2,background:“linear-gradient(135deg,#059669,#0d9488)”,border:“none”,color:”#fff”,borderRadius:12,padding:“11px”,fontWeight:900,cursor:“pointer”,fontFamily:“inherit”,fontSize:13}}>✓ Importar {preview.length} clientes</button>
</div>
</div>
)}
{!preview&&<div style={{display:“flex”,gap:10,marginTop:12}}>
<button onClick={onClose} style={{flex:1,background:”#fdf2f8”,border:“none”,color:”#ad5c7a”,borderRadius:12,padding:“11px”,fontWeight:800,cursor:“pointer”,fontFamily:“inherit”}}>Cancelar</button>
</div>}
</div>
</div>
</div>
);
}


const DEMO=[];


const NUEVO_BASE={id:null,nombre:””,personas:2,etapa:“Pago en curso”,notas:””,whatsapp:””,paquetes:[]};


export default function App(){
const [sesion,setSesion]=useState(null);
const [loginUser,setLoginUser]=useState(””);
const [loginPass,setLoginPass]=useState(””);
const [loginError,setLoginError]=useState(””);
const [viajeros,setViajerosState]=useState([]);
const [modal,setModal]=useState(null);
const [modalRapido,setModalRapido]=useState(false);
const [modalImportar,setModalImportar]=useState(false);
const [vista,setVista]=useState(“hoy”);
const [busqueda,setBusqueda]=useState(””);
const [filtroEtapa,setFiltroEtapa]=useState(“Todas”);
const [syncStatus,setSyncStatus]=useState(“loading”);
const [lastSync,setLastSync]=useState(null);


async function cargarDatos(){
setSyncStatus(“loading”);
try{
const res=await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`,{headers:{“X-Master-Key”:JSONBIN_KEY}});
const json=await res.json();
const data=json.record;
if(Array.isArray(data)&&data.length>0){setViajerosState(data.filter(v=>v&&v.nombre));}
setSyncStatus(“ok”);setLastSync(new Date());
}catch(e){setSyncStatus(“error”);}
}
async function guardarDatos(data){
setSyncStatus(“loading”);
try{
await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`,{method:“PUT”,headers:{“Content-Type”:“application/json”,“X-Master-Key”:JSONBIN_KEY},body:JSON.stringify(data)});
setSyncStatus(“ok”);setLastSync(new Date());
}catch(e){setSyncStatus(“error”);}
}
useEffect(()=>{cargarDatos();const t=setInterval(cargarDatos,30000);return()=>clearInterval(t);},[]);


function setViajeros(fn){
setViajerosState(prev=>{const next=typeof fn===“function”?fn(prev):fn;guardarDatos(next);return next;});
}
function guardar(form){
setViajeros(vs=>{const existe=vs.find(v=>v.id===form.id);return existe?vs.map(v=>v.id===form.id?form:v):[…vs,form];});
setModal(null);
}
function guardarVarios(nuevos){setViajeros(vs=>[…vs,…nuevos]);}
function eliminar(id){setViajeros(vs=>vs.filter(v=>v.id!==id));setModal(null);}


const tareasHoy=useMemo(()=>{
const hoy=new Date();hoy.setHours(12,0,0,0);
const tareas=[];
viajeros.forEach(v=>{
if(v.etapa===“Viajó ✓”) return;
(v.paquetes||[]).forEach(p=>{
recordatoriosPaquete(p).forEach(r=>{
const diff=diasHasta(r.fecha);
const done=!!((p.recsDone||{})[recKey(r)]);
if(diff!==null&&diff>=0&&diff<=1){
tareas.push({emoji:“🔔”,urgencia:“alta”,titulo:r.label+” — “+v.nombre,detalle:p.tipo+” · “+r.info,viajero:v,recKey:recKey(r),paqueteId:p.id,done});
}
});
});
});
const seen=new Set();
return tareas.filter(t=>{if(seen.has(t.titulo))return false;seen.add(t.titulo);return true;}).sort((a,b)=>({alta:0,media:1}[a.urgencia]-{alta:0,media:1}[b.urgencia]));
},[viajeros]);


const proximos=useMemo(()=>{
return viajeros.flatMap(v=>(v.paquetes||[]).flatMap(p=>recordatoriosPaquete(p).filter(r=>r.fecha).map(r=>{
const diff=diasHasta(r.fecha);
const done=!!((p.recsDone||{})[recKey(r)]);
return{…r,viajeroNombre:v.nombre,paqueteTipo:p.tipo,viajero:v,diff,done};
}).filter(r=>!r.done&&r.diff!==null&&r.diff>=0&&r.diff<=75))).sort((a,b)=>a.diff-b.diff);
},[viajeros]);


const filtrados=viajeros.filter(v=>v.nombre.toLowerCase().includes(busqueda.toLowerCase())&&(filtroEtapa===“Todas”||v.etapa===filtroEtapa));
const totalPagado=viajeros.flatMap(v=>v.paquetes||[]).reduce((s,p)=>s+(p.pagado||0),0);
const totalFalta=viajeros.flatMap(v=>v.paquetes||[]).reduce((s,p)=>s+((p.montoTotal||0)-(p.pagado||0)),0);
const comisTotal=viajeros.flatMap(v=>v.paquetes||[]).reduce((s,p)=>s+(p.comision||0),0);
const syncColor=syncStatus===“ok”?”#fce4ec”:syncStatus===“error”?”#f87171”:”#fbbf24”;
const syncLabel=syncStatus===“ok”?“● Guardado”:syncStatus===“error”?“● Error al guardar”:“● Cargando”;


function handleLogin(){
const u=USUARIOS.find(u=>u.user===loginUser.toLowerCase().trim()&&u.pass===loginPass);
if(u){setSesion(u);setLoginError(””);}
else{setLoginError(“Usuario o contraseña incorrectos”);}
}
function handleLogout(){setSesion(null);setLoginUser(””);setLoginPass(””);}


if(!sesion) return(
<div style={{minHeight:“100vh”,background:“linear-gradient(135deg,#e91e8c,#9c27b0)”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontFamily:“Nunito,sans-serif”}}>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
<div style={{background:”#fff”,borderRadius:24,padding:“40px 32px”,width:“100%”,maxWidth:360,boxShadow:“0 20px 60px rgba(0,0,0,0.3)”}}>
<div style={{textAlign:“center”,marginBottom:28}}>
<div style={{fontSize:48,marginBottom:8}}>🏰</div>
<div style={{fontWeight:900,fontSize:24,color:”#3d0026”,fontFamily:“Playfair Display,serif”}}>Disnerd CRM</div>
<div style={{fontSize:13,color:”#ad5c7a”,marginTop:4}}>Magic Travel ✨</div>
</div>
<div style={{marginBottom:16}}>
<div style={{fontSize:12,fontWeight:700,color:”#ad5c7a”,marginBottom:6}}>USUARIO</div>
<input value={loginUser} onChange={e=>setLoginUser(e.target.value)} onKeyDown={e=>e.key===“Enter”&&handleLogin()} placeholder=“sofia / juan / fer” style={{width:“100%”,border:“2px solid #f8bbd0”,borderRadius:10,padding:“10px 14px”,fontSize:15,fontFamily:“inherit”,outline:“none”,boxSizing:“border-box”}}/>
</div>
<div style={{marginBottom:20}}>
<div style={{fontSize:12,fontWeight:700,color:”#ad5c7a”,marginBottom:6}}>CONTRASEÑA</div>
<input type=“password” value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key===“Enter”&&handleLogin()} placeholder=”••••••••” style={{width:“100%”,border:“2px solid #f8bbd0”,borderRadius:10,padding:“10px 14px”,fontSize:15,fontFamily:“inherit”,outline:“none”,boxSizing:“border-box”}}/>
</div>
{loginError&&<div style={{background:”#fce4ec”,color:”#c2185b”,borderRadius:8,padding:“8px 12px”,fontSize:13,fontWeight:700,marginBottom:16,textAlign:“center”}}>{loginError}</div>}
<button onClick={handleLogin} style={{width:“100%”,background:“linear-gradient(135deg,#e91e8c,#9c27b0)”,color:”#fff”,border:“none”,borderRadius:12,padding:“13px”,fontWeight:900,fontSize:16,cursor:“pointer”,fontFamily:“inherit”}}>Entrar ✨</button>
</div>
</div>
);


return(
<div style={{fontFamily:”‘Nunito’,sans-serif”,background:”#fdf2f8”,minHeight:“100vh”,color:”#3d0026”}}>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
<div style={{background:“linear-gradient(135deg,#c2185b 0%,#e91e8c 40%,#f48fb1 100%)”,padding:“0 12px”,boxShadow:“0 4px 24px rgba(0,0,0,0.3)”,position:“sticky”,top:0,zIndex:50}}>
<div style={{maxWidth:860,margin:“0 auto”}}>
<div style={{display:“flex”,alignItems:“center”,justifyContent:“space-between”,paddingTop:14,paddingBottom:8,gap:8}}>
<div style={{display:“flex”,alignItems:“center”,gap:10,flexShrink:0}}>
<span style={{fontSize:24}}>🏰</span>
<div>
<div style={{fontWeight:900,fontSize:17,color:”#fff”,fontFamily:”‘Playfair Display’,serif”,letterSpacing:0.5}}>Disnerd CRM ✨</div>
<div style={{fontSize:10,fontWeight:800,color:syncColor}}>{syncLabel} · Hola {sesion.nombre} · <span onClick={handleLogout} style={{cursor:“pointer”,textDecoration:“underline”}}>Salir</span></div>
</div>
</div>
<div style={{display:“flex”,gap:6,flexWrap:“wrap”,justifyContent:“flex-end”}}>
<button onClick={()=>setModalImportar(true)} style={{background:“rgba(194,24,91,0.7)”,border:“1px solid rgba(255,255,255,0.2)”,color:”#fff”,borderRadius:10,padding:“7px 10px”,fontWeight:800,fontSize:11,cursor:“pointer”,fontFamily:“inherit”}}>⬆ Importar</button>
<button onClick={()=>exportarCSV(viajeros)} style={{background:“rgba(255,255,255,0.1)”,border:“1px solid rgba(255,255,255,0.2)”,color:”#fff”,borderRadius:10,padding:“7px 10px”,fontWeight:800,fontSize:11,cursor:“pointer”,fontFamily:“inherit”}}>⬇ Excel</button>
<button onClick={()=>setModalRapido(true)} style={{background:“rgba(255,255,255,0.12)”,border:“1px solid rgba(255,255,255,0.25)”,color:”#fff”,borderRadius:10,padding:“7px 10px”,fontWeight:800,fontSize:11,cursor:“pointer”,fontFamily:“inherit”}}>⚡ Rápido</button>
<button onClick={()=>setModal({…NUEVO_BASE})} style={{background:“linear-gradient(135deg,#f06292,#e91e8c)”,border:“none”,color:”#fff”,borderRadius:18,padding:“8px 14px”,fontWeight:900,fontSize:12,cursor:“pointer”,fontFamily:“inherit”,boxShadow:“0 4px 14px rgba(239,68,68,0.4)”}}>+ Nuevo</button>
</div>
</div>
<div style={{display:“flex”,gap:1}}>
{[[“hoy”,“✅ Hoy”+(tareasHoy.length?” (”+tareasHoy.length+”)”:””)],[“enviaje”,“✈️ En viaje”],[“proximos”,“🔔 Próximos”+(proximos.length?” (”+proximos.length+”)”:””)],[“clientes”,“👥 Clientes”],[“resumen”,“📊 Resumen”]].map(([v,label])=>(
<button key={v} onClick={()=>setVista(v)} style={{background:vista===v?“rgba(255,255,255,0.13)”:“transparent”,border:“none”,color:vista===v?”#fff”:“rgba(255,255,255,0.6)”,padding:“8px 10px”,borderRadius:“8px 8px 0 0”,fontWeight:800,fontSize:11,cursor:“pointer”,fontFamily:“inherit”,borderBottom:vista===v?“3px solid #fff”:“3px solid transparent”,whiteSpace:“nowrap”}}>{label}</button>
))}
</div>
</div>
</div>


```
  <div style={{maxWidth:860,margin:"0 auto",padding:"16px 12px"}}>


    {vista==="hoy"&&(
      <div>
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:900,fontSize:17,color:"#3d0026",marginBottom:2}}>✅ Tareas para hoy</div>
          <div style={{fontSize:12,color:"#ad5c7a",fontWeight:600}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        {tareasHoy.length===0&&<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><div style={{fontWeight:800,fontSize:18,color:"#059669"}}>¡Todo al día!</div><div style={{fontSize:14,color:"rgba(255,255,255,0.6)",marginTop:4}}>No hay tareas urgentes para hoy</div></div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tareasHoy.map((t,i)=>{
            const bg=t.urgencia==="alta"?"#fff5f5":"#fffbeb";
            const border=t.urgencia==="alta"?"#fecaca":"#fde68a";
            const dot=t.urgencia==="alta"?"#dc2626":"#d97706";
            return(
              <div key={i} style={{background:t.done?"#f8f8f8":bg,borderRadius:16,padding:"16px 18px",border:"2px solid "+(t.done?"#e2e8f0":border),display:"flex",alignItems:"flex-start",gap:14,opacity:t.done?0.65:1,order:t.done?1:0}}>
                <div style={{fontSize:26,flexShrink:0}}>{t.done?"✅":t.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:14,color:t.done?"#94a3b8":"#3d0026",marginBottom:3,textDecoration:t.done?"line-through":"none"}}>{t.titulo}</div>
                  <div style={{fontSize:12,color:t.done?"#cbd5e1":"#ad5c7a",fontWeight:600,marginBottom:10}}>{t.detalle}</div>
                  {!t.done&&<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <button onClick={()=>setModal({...t.viajero,paquetes:[...(t.viajero.paquetes||[])]})} style={{background:"#3d0026",border:"none",color:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Ver cliente</button>
                    {t.viajero.whatsapp&&<a href={"https://wa.me/"+t.viajero.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer" style={{background:"#25d366",color:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:800,fontSize:12,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>💬 WhatsApp</a>}
                    {t.recKey&&<button onClick={()=>{
                      setViajeros(vs=>vs.map(v=>v.id!==t.viajero.id?v:{...v,paquetes:v.paquetes.map(p=>{
                        const recs=recordatoriosPaquete(p);
                        const match=recs.some(r=>recKey(r)===t.recKey);
                        if(!match) return p;
                        return{...p,recsDone:{...(p.recsDone||{}),[t.recKey]:true}};
                      })}));
                    }} style={{background:"#e91e8c",border:"none",color:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>✓ Hecho</button>}
                  </div>}
                  {t.done&&t.recKey&&<button onClick={()=>{
                    setViajeros(vs=>vs.map(v=>v.id!==t.viajero.id?v:{...v,paquetes:v.paquetes.map(p=>{
                      const rd={...(p.recsDone||{})};
                      delete rd[t.recKey];
                      return{...p,recsDone:rd};
                    })}));
                  }} style={{background:"none",border:"1px solid #cbd5e1",color:"#94a3b8",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>↩ Deshacer</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}


    {vista==="enviaje"&&(()=>{
      const hoy=new Date(); hoy.setHours(12,0,0,0);
      const enDestino=viajeros.flatMap(v=>(v.paquetes||[]).filter(p=>{
        if(!p.fechaInicio||!p.fechaFin) return false;
        const ini=new Date(p.fechaInicio+"T12:00:00"),fin=new Date(p.fechaFin+"T12:00:00");
        return hoy>=ini&&hoy<=fin;
      }).map(p=>{
        const ini=new Date(p.fechaInicio+"T12:00:00"),fin=new Date(p.fechaFin+"T12:00:00");
        const totalDias=Math.round((fin-ini)/86400000)+1;
        const diaActual=Math.round((hoy-ini)/86400000)+1;
        return{viajero:v,pkg:p,diaActual,totalDias,pct:Math.round((diaActual/totalDias)*100),etiqueta:etiquetaDestino(p.tipo)};
      }));
      return(
        <div>
          <div style={{fontWeight:900,fontSize:17,marginBottom:4}}>✈️ Clientes en viaje hoy</div>
          <div style={{fontSize:12,color:"#ad5c7a",fontWeight:600,marginBottom:16}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
          {enDestino.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>🏠</div>
              <div style={{fontWeight:800,fontSize:16,color:"#ad5c7a"}}>Ningún cliente en viaje hoy</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {enDestino.map((e,i)=>(
              <div key={i} onClick={()=>setModal({...e.viajero,paquetes:[...(e.viajero.paquetes||[])]})}
                style={{background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)",borderRadius:16,padding:"18px 20px",border:"1.5px solid #7dd3fc",cursor:"pointer",boxShadow:"0 2px 10px rgba(14,165,233,0.1)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,marginBottom:3}}>{e.etiqueta}</div>
                    <div style={{fontSize:13,color:"#c2185b",fontWeight:700}}>{e.viajero.nombre}</div>
                    {e.viajero.personas>0&&<div style={{fontSize:11,color:"#ad5c7a",fontWeight:600,marginTop:2}}>{e.viajero.personas} personas</div>}
                    <div style={{fontSize:11,color:"#ad5c7a",marginTop:2}}>{fmt(e.pkg.fechaInicio)} → {fmt(e.pkg.fechaFin)}</div>
                  </div>
                  <div style={{textAlign:"right",background:"#c2185b",borderRadius:14,padding:"10px 16px"}}>
                    <div style={{fontWeight:900,fontSize:24,color:"#fff",lineHeight:1}}>Día {e.diaActual}</div>
                    <div style={{fontSize:11,color:"#f8bbd0",fontWeight:700}}>de {e.totalDias}</div>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.7)",borderRadius:8,height:10,marginBottom:6}}>
                  <div style={{background:"linear-gradient(90deg,#f48fb1,#e91e8c)",borderRadius:8,height:10,width:e.pct+"%",transition:"width 0.5s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:"#c2185b",fontWeight:700}}>{e.pkg.tipo}</div>
                  <div style={{fontSize:12,color:"#c2185b",fontWeight:900}}>{e.pct}% de la estadía</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })()}


    {vista==="proximos"&&(
      <div>
        <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>🔔 Próximos 75 días</div>
        {proximos.length===0&&<div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.6)",fontWeight:700}}>Sin recordatorios próximos 🎉</div>}
        {proximos.map((r,i)=>{
          const urgente=r.diff<=3,medio=r.diff<=14;
          return(
            <div key={i} style={{background:"#fff",borderRadius:14,padding:"14px 18px",marginBottom:10,border:"2px solid "+(urgente?"#fecaca":medio?"#fde68a":"#f8bbd0"),display:"flex",alignItems:"center",gap:14}}>
              <div style={{background:urgente?"#fee2e2":medio?"#fef3c7":"#fce4ec",borderRadius:12,padding:"8px 12px",textAlign:"center",minWidth:50,flexShrink:0}}>
                <div style={{fontWeight:900,fontSize:20,color:urgente?"#dc2626":medio?"#d97706":"#e91e8c"}}>{r.diff}</div>
                <div style={{fontSize:10,fontWeight:800,color:"#ad5c7a"}}>días</div>
              </div>
              <div style={{flex:1,cursor:"pointer"}} onClick={()=>setModal({...r.viajero,paquetes:[...(r.viajero.paquetes||[])]})}>
                <div style={{fontWeight:800,fontSize:14}}>{r.label}</div>
                <div style={{fontSize:12,color:"#ad5c7a",fontWeight:700}}>{r.viajeroNombre} · {TIPO_EMOJI[r.paqueteTipo]} {r.paqueteTipo}</div>
                <div style={{fontSize:11,color:"#ad5c7a",marginTop:1}}>{r.info} · {fmt(r.fecha)}</div>
              </div>
              <div onClick={()=>{
                const key=recKey(r);
                setViajeros(vs=>vs.map(v=>v.id===r.viajero.id?{...v,paquetes:v.paquetes.map(p=>p.id===r.viajero.paquetes.find(px=>recordatoriosPaquete(px).some(rx=>recKey(rx)===key))?.id?{...p,recsDone:{...(p.recsDone||{}),[key]:true}}:p)}:v));
              }} style={{width:34,height:34,borderRadius:10,border:"2px solid #f48fb1",background:"#fff0f6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}} title="Marcar como hecho">
                <span style={{color:"#e91e8c",fontSize:16,fontWeight:900}}>✓</span>
              </div>
            </div>
          );
        })}
      </div>
    )}


    {vista==="clientes"&&(
      <div>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar cliente…" style={{flex:1,minWidth:160,...inp,borderRadius:12,padding:"10px 14px"}}/>
          <select value={filtroEtapa} onChange={e=>setFiltroEtapa(e.target.value)} style={{...inp,width:"auto",borderRadius:12,padding:"10px 14px"}}><option>Todas</option>{ETAPAS.map(e=><option key={e}>{e}</option>)}</select>
          <button onClick={cargarDatos} style={{...inp,width:"auto",borderRadius:12,padding:"10px 14px",cursor:"pointer",fontWeight:800}}>🔄</button>
        </div>
        {filtrados.length===0&&<div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.6)",fontWeight:700}}>Sin clientes. ¡Agregá el primero!</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtrados.map(v=>{
            const pkgs=v.paquetes||[];
            const totalM=pkgs.reduce((s,p)=>s+(p.montoTotal||0),0);
            const totalPag=pkgs.reduce((s,p)=>s+(p.pagado||0),0);
            const falta=totalM-totalPag;
            const pct=totalM>0?Math.min(100,(totalPag/totalM)*100):0;
            const proximoViaje=pkgs.map(p=>p.fechaInicio).filter(Boolean).sort()[0];
            const diff=diasHasta(proximoViaje);
            return(
              <div key={v.id} onClick={()=>setModal({...v,paquetes:[...v.paquetes]})} style={{background:"#fff",borderRadius:16,padding:"16px 20px",boxShadow:"0 2px 10px rgba(0,0,0,0.07)",cursor:"pointer",border:"1.5px solid #e2e8f0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:8}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:900,fontSize:15}}>👥 {v.nombre}</span>
                      <Badge etapa={v.etapa}/>
                      {diff!==null&&diff>=0&&diff<=30&&<span style={{fontSize:11,fontWeight:800,color:diff<=7?"#dc2626":"#d97706",background:diff<=7?"#fee2e2":"#fef3c7",borderRadius:10,padding:"2px 8px"}}>{diff===0?"¡Hoy!":diff===1?"Mañana":diff+"d"}</span>}
                    </div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:700}}>{v.personas} pers. · {pkgs.length} paquete{pkgs.length!==1?"s":""}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>{pkgs.map((p,i)=><span key={i} style={{fontSize:11,fontWeight:700,background:"#fdf2f8",borderRadius:8,padding:"2px 8px",color:"#475569"}}>{TIPO_EMOJI[p.tipo]} {p.tipo}</span>)}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {totalM>0&&<div style={{fontWeight:900,fontSize:17}}>${totalM.toLocaleString()}</div>}
                    {falta>0&&<div style={{fontSize:11,color:"#dc2626",fontWeight:800}}>Falta ${falta.toLocaleString()}</div>}
                    {falta<=0&&totalM>0&&<div style={{fontSize:11,color:"#059669",fontWeight:800}}>✓ Saldado</div>}
                  </div>
                </div>
                {totalM>0&&<div style={{background:"#fdf2f8",borderRadius:6,height:6}}><div style={{background:pct===100?"#059669":"linear-gradient(90deg,#f06292,#e91e8c)",borderRadius:6,height:6,width:pct+"%"}}/></div>}
              </div>
            );
          })}
        </div>
      </div>
    )}


    {vista==="resumen"&&(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
          {[{label:"Activos",val:viajeros.filter(v=>v.etapa!=="Viajó ✓").length,color:"#c2185b",bg:"#fce4ec",emoji:"👥"},{label:"Cobrado",val:"$"+totalPagado.toLocaleString(),color:"#059669",bg:"#d1fae5",emoji:"💰"},{label:"Por cobrar",val:"$"+totalFalta.toLocaleString(),color:"#dc2626",bg:"#fee2e2",emoji:"⏳"},{label:"Comisiones",val:"$"+comisTotal.toLocaleString(),color:"#ad1457",bg:"#fce4ec",emoji:"🏆"}].map((s,i)=>(
            <div key={i} style={{background:s.bg,borderRadius:16,padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontSize:22}}>{s.emoji}</div>
              <div style={{fontWeight:900,fontSize:18,color:s.color,marginTop:4}}>{s.val}</div>
              <div style={{fontSize:11,fontWeight:800,color:"#ad5c7a",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontWeight:900,fontSize:14,marginBottom:10}}>Por estado</div>
        {ETAPAS.map(e=>{const cnt=viajeros.filter(v=>v.etapa===e).length;const m=ETAPA_META[e];return <div key={e} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:8}}><span style={{fontSize:18}}>{m.emoji}</span><span style={{flex:1,fontWeight:700,fontSize:14}}>{e}</span><span style={{fontWeight:900,fontSize:18,color:m.color}}>{cnt}</span></div>;})}
        <div style={{fontWeight:900,fontSize:14,margin:"18px 0 10px"}}>Por tipo de paquete</div>
        {TIPOS.map(t=>{const cnt=viajeros.flatMap(v=>v.paquetes||[]).filter(p=>p.tipo===t).length;if(!cnt) return null;return <div key={t} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:8}}><span style={{fontSize:18}}>{TIPO_EMOJI[t]}</span><span style={{flex:1,fontWeight:700,fontSize:13}}>{t}</span><span style={{fontWeight:900,fontSize:18,color:"#880e4f"}}>{cnt}</span></div>;})}
        <div style={{marginTop:18,textAlign:"center"}}><button onClick={()=>exportarCSV(viajeros)} style={{background:"linear-gradient(135deg,#059669,#0d9488)",border:"none",color:"#fff",borderRadius:14,padding:"12px 28px",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>⬇ Exportar a Excel</button></div>
      </div>
    )}
  </div>


  {modal&&<ModalViajero viajero={modal} onClose={()=>setModal(null)} onSave={guardar} onDelete={eliminar}/>}
  {modalRapido&&<ModalCargaRapida onClose={()=>setModalRapido(false)} onSave={guardarVarios}/>}
  {modalImportar&&<ModalImportar onClose={()=>setModalImportar(false)} onSave={guardarVarios}/>}
</div>



);
}

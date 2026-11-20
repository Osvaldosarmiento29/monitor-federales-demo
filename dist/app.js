/* Demo autónoma. Sin fetch, credenciales, servicios externos ni datos reales. */
(() => {
  'use strict';
  const KEY = 'monitor-demo-v1';
  const names = {federales:'Federales', locales:'Locales', amparos:'Amparos'};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function iso(d = new Date()) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  const today = iso();
  const format = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});
  const offset = n => {const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate()+n);return iso(d);};
  function seed() {
    const s = clone(window.DEMO_SEED);
    s.events = [
      {id:'ev1',date:offset(1),time:'10:30',type:'Audiencia',title:'Audiencia de pruebas · ejemplo',caseId:'l1',done:false},
      {id:'ev2',date:offset(3),time:'18:00',type:'Término',title:'Presentar documentación · ejemplo',caseId:'f1',done:false},
      {id:'ev3',date:offset(1),time:'16:00',type:'Cita',title:'Reunión de seguimiento · ejemplo',caseId:'f2',done:false}
    ];
    return s;
  }
  let state = seed();
  try {const saved = JSON.parse(sessionStorage.getItem(KEY));if(saved?.schema === 1 && ['cases','publications','reviews','notices','events'].every(k => Array.isArray(saved[k]))) state = saved;} catch { /* almacenamiento opcional */ }
  let month = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let query = '', filter = 'todos', selected = new Set(), busy = null, printDraft = null, returnFocus = null;
  const main = $('#contenido');
  function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{/* la demo sigue funcionando en memoria */}updateCount();}
  function updateCount(){$('#contador-avisos').textContent = state.notices.filter(n => !n.read).length;}
  let toastTimer;
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
  function modal(title,body){returnFocus=document.activeElement;$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#modal').showModal();}
  function closeModal(){$('#modal').close();returnFocus?.focus();}
  const btn = (action,label,id='',primary=false) => `<button data-action="${action}" data-id="${esc(id)}"${primary?' class="primary"':''}>${label}</button>`;
  const badge = (text,kind='') => `<span class="badge ${kind}">${esc(text)}</span>`;
  const publications = id => state.publications.filter(p=>p.caseId===id).sort((a,b)=>b.date.localeCompare(a.date));
  function head(title,description,actions=''){return `<div class="heading"><div><p class="eyebrow">ESTUDIO HORIZONTE · DEMO</p><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;}
  function go(route){location.hash=route;}
  function activeNav(route){document.querySelectorAll('nav a, aside>a').forEach(a=>{if(a.hash===`#${route}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
  function home(){
    return `<section class="hero"><p class="eyebrow">TU DESPACHO, EN UN SOLO LUGAR</p><h1>Menos revisión manual.<br>Más claridad para tu equipo.</h1><p>Recorre una jornada de trabajo: encuentra publicaciones, prepara el consecutivo y organiza los próximos términos.</p><div class="actions"><a class="button primary" href="#federales">Explorar Federales</a>${btn('guide','Ver recorrido de la demo')}</div></section>
    <div class="grid stats"><div class="stat"><span>Expedientes de muestra</span><strong>${state.cases.length}</strong></div><div class="stat"><span>Publicaciones guardadas</span><strong>${state.publications.length}</strong></div><div class="stat"><span>Eventos pendientes</span><strong>${state.events.filter(e=>!e.done).length}</strong></div></div>
    <div class="grid">${Object.entries(names).map(([m,name],i)=>`<a class="panel module-card" href="#${m}"><span class="module-icon" aria-hidden="true">${['▥','▤','◇'][i]}</span><h2>${name}</h2><p>${['Revisión de expedientes, acuerdos y consecutivos.','Lectura de un boletín ficticio y seguimiento de publicaciones.','Consulta asistida simulada y selección de asuntos propios.'][i]}</p>${badge(`${state.cases.filter(c=>c.module===m).length} expedientes`)}<span class="link">Abrir módulo</span></a>`).join('')}</div>
    <div class="grid two"><section class="panel"><div class="panel-head"><h2>Próximos términos y citas</h2><a href="#agenda">Abrir calendario</a></div>${eventList(state.events.filter(e=>!e.done).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,3))}</section><section class="panel"><h2>Un recorrido completo, sin datos reales</h2><p class="muted">Esta muestra reproduce las tareas principales con resultados preparados. No acredita cobertura judicial ni tiempos de consulta del sistema real.</p><div class="actions"><a class="button" href="#correo">Vista del correo</a>${btn('fixture','Descargar lista de ejemplo')}</div></section></div>`;
  }
  function modulePage(m){
    const cases = state.cases.filter(c=>c.module===m), last=state.reviews.filter(r=>r.module===m).at(-1), pubs=state.publications.filter(p=>cases.some(c=>c.id===p.caseId));
    return head(names[m],m==='amparos'?'Sigue los asuntos de interés mediante una consulta asistida.':'Consulta publicaciones y organiza el seguimiento de tu cartera.',`${btn('import','Importar lista de ejemplo',m)}${btn('add-case','Agregar expediente',m)}`)+
    `<div class="grid stats"><div class="stat"><span>Expedientes activos</span><strong>${cases.filter(c=>c.active).length}</strong></div><div class="stat"><span>Publicaciones guardadas</span><strong>${pubs.length}</strong></div><div class="stat"><span>Sin enlace</span><strong>${cases.filter(c=>!c.linked&&c.active).length}</strong></div></div>
    <section class="panel"><div class="panel-head"><div><h2>${m==='amparos'?'Consulta asistida':m==='locales'?'Revisión del boletín':'Revisión de Federales'}</h2><p class="muted">${m==='amparos'?'El recorrido no contiene un CAPTCHA real ni se conecta al PJF.':`Última revisión simulada: ${last?format(last.date):'Todavía no ejecutada'}`}</p></div><div class="actions">${m==='amparos'?btn('assisted','Abrir consulta de muestra','',true):btn('review','Revisar ahora',m,true)}<a class="button" href="#reporte/${m}">Ver reporte</a></div></div>${m==='locales'?`<div class="notice">Boletín de muestra · ${format(today)} · 12 páginas ficticias. La simulación reutiliza el mismo boletín y evita duplicados.</div>`:''}<div id="progress" hidden></div></section>
    <section class="panel"><div class="panel-head"><h2>Expedientes</h2>${badge('Cartera ficticia','neutral')}</div><div class="toolbar"><input id="buscar" type="search" aria-label="Buscar expediente" placeholder="Buscar por número, órgano o partes" value="${esc(query)}"><select id="filtro" aria-label="Filtrar expedientes"><option value="todos">Todos</option><option value="novedades" ${filter==='novedades'?'selected':''}>Con publicaciones</option><option value="sin-enlace" ${filter==='sin-enlace'?'selected':''}>Sin enlace</option><option value="activos" ${filter==='activos'?'selected':''}>Activos</option></select></div><div id="tabla-casos">${caseTable(cases)}</div></section>`;
  }
  function caseTable(cases){
    const q=query.toLocaleLowerCase('es');
    const rows=cases.filter(c=>`${c.number} ${c.court} ${c.actor} ${c.defendant}`.toLocaleLowerCase('es').includes(q)).filter(c=>filter==='todos'||filter==='novedades'&&publications(c.id).length||filter==='sin-enlace'&&!c.linked||filter==='activos'&&c.active);
    if(!rows.length)return '<div class="empty"><strong>No hay coincidencias</strong>Prueba con otro número o cambia el filtro.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Expediente</th><th>Órgano y partes</th><th>Seguimiento</th><th>Publicaciones</th><th>Acción</th></tr></thead><tbody>${rows.map(c=>`<tr><td><a href="#expediente/${esc(c.id)}"><strong>${esc(c.number)}</strong></a><small>${esc(c.type)}</small></td><td>${esc(c.court)}<small>${esc(c.actor)} / ${esc(c.defendant)}</small></td><td>${badge(c.active?'Activo':'Inactivo',c.active?'green':'neutral')}${!c.linked?'<small>Enlace pendiente</small>':''}</td><td>${publications(c.id).length||'—'}</td><td><a class="button" href="#expediente/${esc(c.id)}">Ver</a></td></tr>`).join('')}</tbody></table></div>`;
  }
  function detail(id){
    const c=state.cases.find(c=>c.id===id);if(!c)return notFound();
    const pubs=publications(id);
    return head(`Expediente ${esc(c.number)}`,esc(c.court),`<a class="button" href="#${c.module}">Volver a ${names[c.module]}</a>`)+
    `<section class="panel"><dl class="key-value"><div><dt>Tipo de juicio</dt><dd>${esc(c.type)}</dd></div><div><dt>Monitoreo</dt><dd>${badge(c.active?'Activo':'Inactivo',c.active?'green':'neutral')}</dd></div><div><dt>Parte actora / promovente</dt><dd>${esc(c.actor)}</dd></div><div><dt>Parte demandada / autoridad</dt><dd>${esc(c.defendant)}</dd></div></dl><div class="actions">${btn('portal','Ver portal simulado',id)}${btn('edit-case','Editar ficha',id)}${btn('toggle-case',c.active?'Desactivar monitoreo':'Activar monitoreo',id)}${!c.linked?btn('fix-link','Vincular enlace de muestra',id):''}<a class="button primary" href="#consecutivo/${id}">Generar consecutivo</a>${btn('event','Agendar término',id)}</div>${!c.linked?'<div class="notice error">Este expediente de ejemplo no tiene enlace. La revisión lo muestra como omitido, nunca como “sin publicación”.</div>':''}</section>
    <section class="panel"><div class="panel-head"><h2>Publicaciones</h2>${badge(`${pubs.length} guardadas`,'neutral')}</div>${pubs.length?pubs.map(p=>`<article class="publication"><div class="actions">${badge(format(p.date))}<strong>${esc(p.title)}</strong></div><p>${esc(p.text)}</p><div class="actions">${btn('synthesis','Ver síntesis completa',p.id)}${btn('event','Crear recordatorio',id)}</div></article>`).join(''):`<div class="empty"><strong>Aún no hay publicaciones guardadas</strong>Ejecuta una revisión en ${names[c.module]} para recorrer el ejemplo.</div>`}</section>
    <section class="panel"><h2>Control de términos y suspensión</h2><p class="muted">Las fechas se capturan y validan por el abogado. La demo no calcula vencimientos legales.</p><div class="actions">${btn('legal','Actualizar seguimiento',id)}${badge(c.suspension||'Suspensión: sin registrar','neutral')}</div>${eventList(state.events.filter(e=>e.caseId===id))}</section>`;
  }
  function addPublication(caseId,date,title,text){
    const id=`${caseId}:${date}:${title}`;
    if(state.publications.some(p=>p.id===id))return false;
    state.publications.push({id,caseId,date,title,text});
    const c=state.cases.find(c=>c.id===caseId);
    state.notices.unshift({id:`n:${id}`,caseId,read:false,text:`Nueva publicación · ${c.number}`,date});return true;
  }
  async function review(m){
    if(busy){toast('Hay una revisión de muestra en curso.');return;}
    busy=m;const date=today;const candidates=state.cases.filter(c=>c.module===m&&c.active);let added=0;
    try {
      const control=document.querySelector(`[data-action="review"][data-id="${m}"]`);if(control){control.disabled=true;control.textContent='Revisando…';}
      for(let i=0;i<=candidates.length;i++){
        const area=$('#progress');if(area){area.hidden=false;area.className='review-progress';area.innerHTML=`<p role="status">Simulación en curso · ${i} de ${candidates.length} expedientes</p><progress max="${candidates.length||1}" value="${i}" aria-label="Avance de la revisión"></progress>`;}
        await new Promise(resolve=>setTimeout(resolve,220));
      }
      let withPublication=0,without=0,omitted=0;
      for(const c of candidates){
        if(!c.linked){omitted++;continue;}
        if(window.DEMO_COPY[c.id]){
          withPublication++;if(addPublication(c.id,date,'Acuerdo de muestra',window.DEMO_COPY[c.id]))added++;
          if(c.id==='f1'&&addPublication(c.id,offset(-2),'Acuerdo anterior de muestra','Se agrega una promoción anterior al expediente. Este segundo acuerdo permite demostrar una ficha con varias publicaciones.'))added++;
        }else without++;
      }
      state.reviews.push({module:m,date,total:candidates.length,withPublication,without,omitted,added,errors:0});save();
      toast(`Revisión simulada terminada: ${added} publicaciones nuevas guardadas.`);
    }finally{busy=null;render();}
  }
  function report(m){
    if(!names[m])return notFound();const r=state.reviews.filter(r=>r.module===m).at(-1);
    return head(`Reporte de ${names[m]}`,'Cobertura de la última revisión simulada.',`<a class="button" href="#${m}">Volver al módulo</a>`)+(!r?`<section class="panel empty"><strong>Todavía no hay reporte</strong><p>Inicia una revisión o confirma la lista asistida de muestra.</p><a class="button primary" href="#${m}">Abrir ${names[m]}</a></section>`:`<section class="panel"><h2>Fecha revisada: ${format(r.date)}</h2><div class="grid stats"><div class="stat"><span>Con publicación</span><strong>${r.withPublication}</strong></div><div class="stat"><span>Sin publicación</span><strong>${r.without}</strong></div><div class="stat"><span>Omitidos</span><strong>${r.omitted}</strong></div></div><p>${r.total} incluidos · ${r.withPublication+r.without} consultados · ${r.errors} errores · ${r.added} publicaciones nuevas en esta ejecución.</p><div class="notice">${r.omitted?'Cobertura incompleta: hay un expediente sin enlace. Puedes verlo y vincular el enlace de muestra.':'Todos los expedientes incluidos en esta simulación tienen resultado.'}</div>${r.omitted?state.cases.filter(c=>c.module===m&&c.active&&!c.linked).map(c=>`<p><a href="#expediente/${c.id}">${esc(c.number)}</a> · Sin enlace de muestra.</p>`).join(''):''}<div class="actions"><a class="button primary" href="#correo">Ver resumen por correo</a></div></section>`);
  }
  function assisted(){
    modal('Consulta asistida de muestra',`<p>En el sistema real, el abogado completa la validación humana del portal. Aquí se simula ese paso sin un CAPTCHA real.</p><div class="field"><label for="court-demo">Órgano de muestra</label><select id="court-demo"><option>Juzgado de Amparo de Muestra 1</option></select></div><label class="check"><input id="human-demo" type="checkbox"> Comprendo que esta consulta es ficticia.</label><div class="actions">${btn('assisted-list','Mostrar resultados de ejemplo','',true)}</div>`);
  }
  function assistedList(){
    if(!$('#human-demo').checked){toast('Confirma que estás en una consulta ficticia.');return;}
    const own=state.cases.filter(c=>c.module==='amparos'&&c.active&&c.linked);
    modal('Seleccionar asuntos de interés',`<div class="notice">La lista trae asuntos del órgano. Selecciona sólo los expedientes de tu cartera ficticia. El asunto ajeno no se incorpora.</div><form id="assisted-form">${own.map(c=>`<label class="check"><input name="case" value="${c.id}" type="checkbox" checked><span><strong>${esc(c.number)}</strong> · ${esc(c.actor)}<small> · En tu cartera</small></span></label>`).join('')}<p class="muted">699/2026 · Persona ficticia ajena · Fuera de tu cartera</p><p id="assisted-error" role="alert"></p><div class="actions"><button class="primary" type="submit">Confirmar y guardar seleccionados</button></div></form>`);
  }
  function consecutive(id){
    const c=state.cases.find(c=>c.id===id);if(!c)return notFound();const pubs=publications(id);
    return head('Preparar consecutivo',`Expediente ${esc(c.number)} · Una ficha con las publicaciones seleccionadas.`,`<a class="button" href="#expediente/${id}">Volver al expediente</a>`)+`<section class="panel">${!pubs.length?`<div class="empty"><strong>Primero necesitas una publicación</strong><p>Haz una revisión de muestra en el módulo y vuelve aquí.</p><a class="button" href="#${c.module}">Abrir ${names[c.module]}</a></div>`:`<form id="consecutive-form" data-id="${id}"><h2>Revisar ficha antes de generar</h2><div class="notice">Los datos conocidos se precargan. El nombre del licenciado debe completarse; las notas son opcionales. Esta ficha es ficticia.</div><div class="form-grid"><div><label for="lawyer">Licenciado responsable</label><input id="lawyer" name="lawyer" required maxlength="100" placeholder="Escribe un nombre ficticio"></div><div><label for="number-sheet">Expediente</label><input id="number-sheet" value="${esc(c.number)}" readonly></div><div><label for="actor-sheet">Parte actora / promovente</label><input id="actor-sheet" name="actor" value="${esc(c.actor)}" required maxlength="150"></div><div><label for="defendant-sheet">Parte demandada / autoridad</label><input id="defendant-sheet" name="defendant" value="${esc(c.defendant)}" required maxlength="150"></div></div><h3>Publicaciones que se unirán en una ficha</h3>${pubs.map(p=>`<label class="check"><input type="checkbox" name="publication" value="${esc(p.id)}" checked><span>${format(p.date)} · ${esc(p.title)}</span></label>`).join('')}<div class="field"><label for="sheet-notes">Notas adicionales (opcional)</label><textarea id="sheet-notes" name="notes" maxlength="1500" placeholder="Observaciones ficticias para el consecutivo"></textarea></div><p id="sheet-error" role="alert"></p><button class="primary" type="submit">Generar vista para imprimir / PDF</button></form>`}</section>`;
  }
  function printPage(){
    if(!printDraft)return head('Consecutivo','Selecciona un expediente para generar su ficha.')+`<a class="button" href="#federales">Abrir Federales</a>`;
    const {c,lawyer,actor,defendant,notes,pubs}=printDraft;
    return `<div class="heading no-print"><div><h1>Consecutivo listo</h1><p>Se unieron ${pubs.length} publicaciones en una sola ficha.</p></div><div class="actions">${btn('print','Imprimir / guardar PDF','',true)}<a class="button" href="#consecutivo/${c.id}">Editar ficha</a></div></div><article class="print-sheet"><p class="eyebrow">DOCUMENTO FICTICIO · DEMOSTRACIÓN</p><h1>Consecutivo de ${names[c.module]}</h1><p>Estudio Horizonte · Fecha de generación: ${format(today)}</p><section class="sheet-card"><h2>Expediente ${esc(c.number)}</h2><p>${esc(c.court)}</p><dl class="key-value"><div><dt>Licenciado</dt><dd>${esc(lawyer)}</dd></div><div><dt>Tipo de juicio</dt><dd>${esc(c.type)}</dd></div><div><dt>Parte actora / promovente</dt><dd>${esc(actor)}</dd></div><div><dt>Parte demandada / autoridad</dt><dd>${esc(defendant)}</dd></div></dl>${pubs.map(p=>`<section class="publication"><h3>${format(p.date)} · ${esc(p.title)}</h3><p>${esc(p.text)}</p></section>`).join('')}${notes?`<h3>Notas</h3><p>${esc(notes)}</p>`:''}</section><p class="muted">Este documento contiene únicamente datos ficticios y no tiene validez judicial.</p></article>`;
  }
  function calendar(){
    const year=month.getFullYear(),m=month.getMonth(),first=new Date(year,m,1),start=new Date(year,m,1-first.getDay());
    const cells=[];for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);const date=iso(d),events=state.events.filter(e=>e.date===date&&!e.done).sort((a,b)=>a.time.localeCompare(b.time));
      cells.push(`<button class="day ${d.getMonth()!==m?'outside':''} ${date===today?'today':''}" data-action="day" data-id="${date}" aria-label="${format(date)}, ${events.length} eventos. Ver día o agregar evento"><span class="day-number">${d.getDate()}</span>${events.slice(0,2).map(e=>`<span class="event-pill ${e.type==='Término'?'term':''}">${esc(e.time)} ${esc(e.type)}</span>`).join('')}${events.length>2?`<span class="event-pill">+${events.length-2} más</span>`:''}</button>`);
    }
    const pending=state.events.filter(e=>!e.done).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    return head('Calendario de términos','Fechas capturadas por el abogado. Los recordatorios no calculan vencimientos legales.',btn('event','Agregar evento','',true))+`<section class="panel calendar-panel"><div class="cal-head"><div class="month-nav">${btn('prev-month','‹')}<h2>${esc(month.toLocaleDateString('es-MX',{month:'long',year:'numeric'}))}</h2>${btn('next-month','›')}</div>${btn('today','Hoy')}</div><div class="calendar">${['dom','lun','mar','mié','jue','vie','sáb'].map(d=>`<div class="weekday">${d}</div>`).join('')}${cells.join('')}</div></section><section class="panel"><h2>Próximos eventos</h2>${eventList(pending)}</section><details class="panel"><summary>Cómo funciona el calendario</summary><p>Selecciona un día para consultar o agregar audiencias, citas y términos. Indica la fecha validada por el abogado y el expediente relacionado. Los avisos de esta demo se muestran aquí; no se envían correos ni recordatorios en segundo plano.</p></details>`;
  }
  function eventList(events){return events.length?events.map(e=>`<article class="event-row"><div class="event-date">${format(e.date)}<br><small>${esc(e.time)}</small></div><div class="grow"><strong>${esc(e.title)}</strong><p>${esc(e.type)}${e.caseId?` · Exp. ${esc(state.cases.find(c=>c.id===e.caseId)?.number||'')}`:''}</p></div>${e.done?badge('Completado','green'):btn('done-event','Completar',e.id)}</article>`).join(''):'<div class="empty">No hay eventos pendientes en esta selección.</div>';}
  function eventForm(caseId='',date=today){
    modal('Agregar evento ficticio',`<p class="muted">Captura una fecha de ejemplo. No introduzcas información de asuntos reales.</p><form id="event-form"><div class="field"><label for="event-title">Descripción</label><input id="event-title" name="title" required maxlength="120" placeholder="Ej. Audiencia de muestra"></div><div class="form-grid"><div><label for="event-type">Tipo</label><select id="event-type" name="type"><option>Audiencia</option><option>Término</option><option>Cita</option><option>Notificación</option></select></div><div><label for="event-date">Fecha validada</label><input id="event-date" name="date" type="date" value="${esc(date)}" required min="2020-01-01" max="2100-12-31"></div><div><label for="event-time">Hora</label><input id="event-time" name="time" type="time" value="10:00" required></div><div><label for="event-case">Expediente (opcional)</label><select id="event-case" name="caseId"><option value="">Sin expediente</option>${state.cases.map(c=>`<option value="${c.id}" ${c.id===caseId?'selected':''}>${esc(c.number)} · ${names[c.module]}</option>`).join('')}</select></div></div><label class="check"><input type="checkbox" required> Confirmo que la fecha es de ejemplo y no fue calculada por el sistema.</label><button class="primary" type="submit">Guardar evento</button></form>`);
  }
  function notices(){return head('Avisos','Publicaciones y eventos de esta demostración.',`${btn('read-notices','Marcar todos como leídos')}<a class="button" href="#correo">Vista del correo</a>`)+`<section class="panel"><h2>Publicaciones detectadas</h2>${state.notices.length?state.notices.map(n=>`<article class="event-row"><span class="badge ${n.read?'neutral':'green'}">${n.read?'Leído':'Nuevo'}</span><div class="grow"><strong>${esc(n.text)}</strong><p>${format(n.date)}</p></div><a class="button" href="#expediente/${esc(n.caseId)}">Ver expediente</a></article>`).join(''):'<div class="empty"><strong>Todavía no hay novedades</strong>Haz una revisión de muestra para recibir avisos.</div>'}</section><section class="panel"><h2>Eventos próximos</h2>${eventList(state.events.filter(e=>!e.done&&e.date>=today&&e.date<=offset(3)))}</section>`;}
  function mail(){
    const pubs=state.publications.filter(p=>p.date===today&&state.cases.some(c=>c.id===p.caseId&&c.active&&c.module!=='amparos'));
    return head('Vista del correo','Ejemplo visual. No solicita direcciones ni envía mensajes reales.',`<a class="button" href="#avisos">Volver a avisos</a>`)+`<article class="mail"><div class="mail-header"><p class="eyebrow">MONITOR DE EXPEDIENTES · DEMO</p><h2>Las novedades de tu despacho</h2><p>Fecha revisada: ${format(today)}</p></div><div class="mail-body"><p>Hola, equipo Horizonte:</p><p>${pubs.length?`Hay ${pubs.length} publicaciones de muestra en tus expedientes activos de Federales y Locales.`:'Aún no hay publicaciones de hoy. Ejecuta una revisión simulada en Federales o Locales para llenar este resumen.'}</p>${pubs.map(p=>{const c=state.cases.find(c=>c.id===p.caseId);return `<section class="mail-item">${badge(names[c.module])}<h3>Expediente ${esc(c.number)}</h3><p>${esc(p.text)}</p><a class="button" href="#expediente/${c.id}">Revisar expediente</a></section>`;}).join('')}<div class="notice">Amparos requiere consulta asistida y no se incluye en este resumen. Las incidencias se revisan dentro del sistema.</div><p class="muted">Esta es una vista previa ficticia. No se ha enviado ningún correo.</p></div></article>`;
  }
  function guide(){modal('Prueba una jornada de trabajo',`<ol class="steps"><li><strong>Revisa Federales.</strong> Pulsa “Revisar ahora”: se guardan acuerdos ficticios y se muestra un expediente sin enlace.</li><li><strong>Abre el 101/2026.</strong> Verás dos publicaciones. Genera el consecutivo y conserva ambas en una ficha.</li><li><strong>Consulta Locales.</strong> Ejecuta la lectura del boletín simulado y revisa su reporte.</li><li><strong>Explora Amparos.</strong> Abre la consulta de muestra y confirma sólo los asuntos de la cartera ficticia.</li><li><strong>Agenda un término.</strong> Selecciona un día en el calendario y captura una fecha de ejemplo.</li><li><strong>Revisa avisos y correo.</strong> Se muestran novedades sin enviar mensajes reales.</li></ol><div class="notice">No hay autenticación real, scraping ni cálculo de plazos en esta demo. Los cambios se conservan en esta sesión del navegador. Puedes restablecerlos desde este panel.</div><div class="actions"><a class="button primary" href="#federales" data-action="close">Empezar por Federales</a>${btn('reset','Restablecer demo')}</div>`);}
  function caseForm(module,id=''){
    const c=state.cases.find(c=>c.id===id);
    modal(c?'Editar ficha ficticia':'Agregar expediente ficticio',`<p class="muted">Utiliza únicamente nombres y datos inventados.</p><form id="case-form" data-module="${esc(module)}" data-id="${esc(id)}"><div class="form-grid"><div><label for="case-number">Número / año</label><input id="case-number" name="number" required pattern="[0-9]{1,6}/[0-9]{4}" maxlength="11" value="${esc(c?.number||'')}" placeholder="Ej. 707/2026"></div><div><label for="case-type">Tipo de juicio</label><select id="case-type" name="type">${['Civil','Civil oral','Familiar','Concurso mercantil','Apelación','Amparo directo','Amparo indirecto'].map(t=>`<option ${c?.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="wide"><label for="case-court">Órgano de muestra</label><input id="case-court" name="court" value="${esc(c?.court||'Órgano ficticio de muestra')}" required maxlength="150"></div><div><label for="case-actor">Parte actora / promovente</label><input id="case-actor" name="actor" value="${esc(c?.actor||'')}" required maxlength="150"></div><div><label for="case-defendant">Parte demandada / autoridad</label><input id="case-defendant" name="defendant" value="${esc(c?.defendant||'')}" required maxlength="150"></div></div><p id="case-error" role="alert"></p><button class="primary" type="submit">Guardar ficha de muestra</button></form>`);
  }
  function fixture(){const csv='modulo,numero,organo,tipo,actora,demandada\nfederales,707/2026,Juzgado Ficticio de Muestra 7,Civil,Empresa Ficticia Roble,Persona Ficticia Sol\nlocales,708/2026,Juzgado Ficticio de Muestra 8,Civil,Empresa Ficticia Trigo,Persona Ficticia Valle\n';const a=document.createElement('a');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='lista-ficticia-monitor.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function notFound(){return head('Vista no disponible','Vuelve al inicio para recorrer la demo.')+'<a class="button" href="#inicio">Ir al inicio</a>';}
  function render(){
    const [route='inicio',id='']=(location.hash.slice(1)||'inicio').split('/');
    activeNav(names[route]?route:route==='expediente'?state.cases.find(c=>c.id===id)?.module:route);
    if(names[route])main.innerHTML=modulePage(route);
    else main.innerHTML=({inicio:home,agenda:calendar,avisos:notices,correo:mail,expediente:()=>detail(id),reporte:()=>report(id),consecutivo:()=>consecutive(id),imprimir:printPage}[route]||notFound)();
    updateCount();
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]');if(!el)return;const {action,id}=el.dataset;
    if(action==='review')review(id);
    else if(action==='guide')guide();
    else if(action==='close')closeModal();
    else if(action==='fixture')fixture();
    else if(action==='assisted')assisted();
    else if(action==='assisted-list')assistedList();
    else if(action==='event')eventForm(id);
    else if(action==='day'){const events=state.events.filter(v=>v.date===id);modal(`Eventos del ${format(id)}`,`${eventList(events)}<div class="actions">${btn('event-date','Agregar evento este día',id,true)}</div>`);}
    else if(action==='event-date')eventForm('',id);
    else if(action==='prev-month'||action==='next-month'){month=new Date(month.getFullYear(),month.getMonth()+(action==='prev-month'?-1:1),1);render();}
    else if(action==='today'){month=new Date(new Date().getFullYear(),new Date().getMonth(),1);render();}
    else if(action==='done-event'){const ev=state.events.find(v=>v.id===id);if(ev){ev.done=true;save();if($('#modal').open)closeModal();render();toast('Evento de muestra completado.');}}
    else if(action==='read-notices'){state.notices.forEach(n=>n.read=true);save();render();}
    else if(action==='toggle-case'){const c=state.cases.find(c=>c.id===id);if(c){c.active=!c.active;save();render();}}
    else if(action==='fix-link'){const c=state.cases.find(c=>c.id===id);if(c){c.linked=true;save();render();toast('Enlace ficticio vinculado. Ejecuta otra revisión para incluir el asunto.');}}
    else if(action==='portal'){const c=state.cases.find(c=>c.id===id);modal('Portal judicial simulado',`<p class="eyebrow">FUENTE FICTICIA · SIN CONEXIÓN EXTERNA</p><h3>${esc(c.court)}</h3><p>Expediente ${esc(c.number)}</p><p>${esc(c.actor)} / ${esc(c.defendant)}</p><h3>Lista de acuerdos de muestra</h3><p>${esc(window.DEMO_COPY[id]||'No se muestran acuerdos en este ejemplo.')}</p>`);}
    else if(action==='synthesis'){const p=state.publications.find(p=>p.id===id);if(p)modal('Síntesis completa de muestra',`<p>${badge(format(p.date))}</p><p>${esc(p.text)}</p><p class="muted">Texto ficticio, sin validez judicial.</p>`);}
    else if(action==='add-case')caseForm(id);
    else if(action==='edit-case'){const c=state.cases.find(c=>c.id===id);caseForm(c.module,id);}
    else if(action==='import'){modal('Vista previa de importación',`<p>La versión real lee las listas del despacho. Esta demo incorpora una fila ficticia preparada; no subas archivos reales.</p><div class="notice"><strong>707/2026</strong> · Órgano ficticio de muestra · Empresa ficticia Roble / Persona ficticia Sol</div><p>Se comprobará el módulo, el órgano y el número para evitar duplicados.</p><div class="actions">${btn('confirm-import','Confirmar importación de ejemplo',id,true)}${btn('fixture','Descargar CSV de ejemplo')}</div>`);}
    else if(action==='confirm-import'){const cid=`import-${id}`;if(!state.cases.some(c=>c.id===cid)){state.cases.push({id:cid,module:id,number:'707/2026',court:'Órgano ficticio de muestra',type:'Civil',actor:'Empresa ficticia Roble',defendant:'Persona ficticia Sol',active:true,linked:true});save();toast('Se importó un expediente ficticio.');}else toast('El expediente de ejemplo ya existe. No se duplicó.');closeModal();render();}
    else if(action==='legal'){const c=state.cases.find(c=>c.id===id);modal('Seguimiento de suspensión',`<p class="muted">Registro manual de ejemplo. El sistema no infiere una resolución jurídica.</p><form id="legal-form" data-id="${id}"><div class="field"><label for="suspension">Estado confirmado por el abogado</label><select name="suspension" id="suspension">${['Sin registrar','Solicitada','Provisional concedida','Definitiva concedida','Negada','Sin efectos'].map(s=>`<option ${c.suspension===s?'selected':''}>${s}</option>`).join('')}</select></div><button class="primary" type="submit">Guardar seguimiento</button></form>`);}
    else if(action==='reset')confirmReset();
    else if(action==='confirm-reset'){if(busy){toast('Espera a que termine la revisión de muestra.');return;}state=seed();printDraft=null;query='';filter='todos';selected.clear();month=new Date(new Date().getFullYear(),new Date().getMonth(),1);save();closeModal();go('inicio');render();toast('Demo restablecida.');}
    else if(action==='print')window.print();
  });
  document.addEventListener('input',e=>{if(e.target.id==='buscar'){query=e.target.value;const m=location.hash.slice(1);$('#tabla-casos').innerHTML=caseTable(state.cases.filter(c=>c.module===m));}});
  document.addEventListener('change',e=>{if(e.target.id==='filtro'){filter=e.target.value;const m=location.hash.slice(1);$('#tabla-casos').innerHTML=caseTable(state.cases.filter(c=>c.module===m));}});
  document.addEventListener('submit',e=>{
    e.preventDefault();const form=e.target,data=new FormData(form);
    if(form.id==='consecutive-form'){
      const ids=data.getAll('publication');if(!ids.length){$('#sheet-error').textContent='Selecciona al menos una publicación.';return;}
      printDraft={c:clone(state.cases.find(c=>c.id===form.dataset.id)),lawyer:data.get('lawyer').trim(),actor:data.get('actor').trim(),defendant:data.get('defendant').trim(),notes:data.get('notes').trim(),pubs:clone(state.publications.filter(p=>ids.includes(p.id)))};go('imprimir');
    }else if(form.id==='event-form'){
      state.events.push({id:crypto.randomUUID(),date:data.get('date'),time:data.get('time'),type:data.get('type'),title:data.get('title').trim(),caseId:data.get('caseId'),done:false});save();closeModal();render();toast('Evento ficticio guardado.');
    }else if(form.id==='case-form'){
      const id=form.dataset.id,m=form.dataset.module,number=data.get('number').trim(),court=data.get('court').trim();
      if(state.cases.some(c=>c.id!==id&&c.module===m&&c.number===number&&c.court.toLowerCase()===court.toLowerCase())){$('#case-error').textContent='Ya existe ese expediente en el mismo órgano y módulo.';return;}
      const fields={number,court,type:data.get('type'),actor:data.get('actor').trim(),defendant:data.get('defendant').trim()};
      if(id)Object.assign(state.cases.find(c=>c.id===id),fields);else state.cases.push({id:crypto.randomUUID(),module:m,...fields,active:true,linked:true});save();closeModal();render();toast('Ficha ficticia guardada.');
    }else if(form.id==='assisted-form'){
      const ids=data.getAll('case');if(!ids.length){$('#assisted-error').textContent='Selecciona al menos un expediente de muestra.';return;}
      let added=0;for(const id of ids){if(addPublication(id,today,'Acuerdo asistido de muestra',window.DEMO_COPY[id]||'No se agrega información ajena. Acuerdo ficticio del asunto seleccionado.'))added++;}
      state.reviews.push({module:'amparos',date:today,total:ids.length,withPublication:ids.length,without:0,omitted:0,added,errors:0});save();closeModal();render();toast(`${added} acuerdos nuevos guardados de los asuntos seleccionados.`);
    }else if(form.id==='legal-form'){state.cases.find(c=>c.id===form.dataset.id).suspension=data.get('suspension');save();closeModal();render();toast('Seguimiento de muestra guardado.');}
  });
  function confirmReset(){modal('Restablecer demostración',`<p>Se borrarán únicamente los cambios ficticios guardados en esta sesión y volverás al escenario inicial.</p><div class="actions">${btn('confirm-reset','Restablecer demo','',true)}${btn('close','Conservar cambios')}</div>`);}
  $('#reiniciar').addEventListener('click',confirmReset);$('#guia').addEventListener('click',guide);$('#cerrar-modal').addEventListener('click',closeModal);
  $('#tema').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#tema').setAttribute('aria-label',dark?'Activar modo claro':'Activar modo oscuro');try{sessionStorage.setItem('monitor-demo-theme',dark?'dark':'light');}catch{}});
  try{document.documentElement.dataset.theme=sessionStorage.getItem('monitor-demo-theme')||'light';}catch{}
  window.addEventListener('hashchange',()=>{query='';filter='todos';if($('#modal').open)closeModal();render();main.focus({preventScroll:true});window.scrollTo(0,0);});
  render();
})();

/* Fixtures creados para esta demo. No proceden de la base del despacho. */
window.DEMO_SEED = {
  schema: 1,
  cases: [
    {id:'f1', module:'federales', number:'101/2026', court:'Juzgado Federal de Muestra 1', type:'Concurso mercantil', actor:'Comercializadora Aurora de Muestra', defendant:'Distribuidora Brisa de Muestra', active:true, linked:true},
    {id:'f2', module:'federales', number:'202/2026', court:'Tribunal Colegiado de Muestra 2', type:'Apelación', actor:'Inversiones Cedro de Muestra', defendant:'Servicios Delta de Muestra', active:true, linked:true},
    {id:'f3', module:'federales', number:'303/2026', court:'Juzgado Federal de Muestra 3', type:'Amparo indirecto', actor:'Persona ficticia Elena', defendant:'Autoridad ficticia 3', active:true, linked:true},
    {id:'f4', module:'federales', number:'404/2026', court:'Juzgado Federal de Muestra 4', type:'Juicio civil', actor:'Empresa Faro de Muestra', defendant:'Persona ficticia Gabriel', active:true, linked:false},
    {id:'l1', module:'locales', number:'501/2026', court:'Sala Civil de Muestra 1', type:'Civil', actor:'Empresa Horizonte de Muestra', defendant:'Persona ficticia Iris', active:true, linked:true},
    {id:'l2', module:'locales', number:'502/2026', court:'Juzgado Civil Oral de Muestra 2', type:'Civil oral', actor:'Servicios Junco de Muestra', defendant:'Empresa Ladera de Muestra', active:true, linked:true},
    {id:'l3', module:'locales', number:'503/2026', court:'Juzgado Familiar de Muestra 3', type:'Familiar', actor:'Persona ficticia Mar', defendant:'Persona ficticia Nube', active:true, linked:true},
    {id:'a1', module:'amparos', number:'601/2026', court:'Juzgado de Amparo de Muestra 1', type:'Amparo indirecto', actor:'Empresa Olivo de Muestra', defendant:'Autoridad ficticia 1', active:true, linked:true},
    {id:'a2', module:'amparos', number:'602/2026', court:'Juzgado de Amparo de Muestra 1', type:'Amparo indirecto', actor:'Persona ficticia Palma', defendant:'Autoridad ficticia 2', active:true, linked:true}
  ],
  publications: [], reviews: [], notices: [], events: []
};
window.DEMO_COPY = {
  f1:'Se tiene por recibido el escrito de la parte promovente. Agréguese a los autos y dese vista a las partes para los efectos conducentes. Acuerdo ficticio para demostración.',
  f2:'Se admite el recurso y se ordena remitir las constancias al órgano competente. Notifíquese. Acuerdo ficticio para demostración.',
  l1:'Se señala audiencia de desahogo de pruebas. Las partes deberán atender la fecha y condiciones indicadas en la resolución. Acuerdo ficticio para demostración.',
  l2:'Se tiene por presentada la promoción y se requiere documentación complementaria. Este texto ficticio no fija un vencimiento procesal.',
  a1:'Se agrega el informe recibido y se da vista a la parte quejosa. Continúa el trámite del expediente principal. Acuerdo ficticio para demostración.'
};

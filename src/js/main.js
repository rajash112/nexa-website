(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- mobile menu ---- */
var ham=$('#ham'),mm=$('#mmenu');
if(ham&&mm){
  var setMenu=function(o){mm.classList.toggle('open',o);ham.setAttribute('aria-expanded',String(o));ham.textContent=o?'✕':'☰'};
  ham.addEventListener('click',function(){setMenu(!mm.classList.contains('open'))});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&mm.classList.contains('open')){setMenu(false);ham.focus()}});
  $$('a',mm).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
}

/* ---- reveal ---- */
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}})},{threshold:.1});
  $$('.reveal').forEach(function(el){io.observe(el)});
}else{$$('.reveal').forEach(function(el){el.classList.add('vis')})}

/* ---- back to top ---- */
var tt=$('#totop');
if(tt){window.addEventListener('scroll',function(){tt.classList.toggle('show',window.scrollY>600)},{passive:true});
  tt.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})})}

/* ---- subtle particle background (disabled for reduced motion) ---- */
var cv=$('#bgc');
if(cv&&!reduce){
  var cx=cv.getContext('2d'),W,H,P=[];
  var rs=function(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight};rs();window.addEventListener('resize',rs);
  var cols=['#00d4ff','#7c2cf5','#00ff88'];
  for(var i=0;i<70;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,r:Math.random()*1.3+.4,c:cols[i%3]});
  (function loop(){cx.clearRect(0,0,W,H);P.forEach(function(p){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;cx.globalAlpha=.5;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill()});requestAnimationFrame(loop)})();
}

/* ---- courses page category chips ---- */
var chips=$$('.chip[data-cat]');
if(chips.length){
  chips.forEach(function(ch){ch.addEventListener('click',function(){
    chips.forEach(function(c){c.setAttribute('aria-pressed',String(c===ch))});
    var cat=ch.getAttribute('data-cat');
    $$('[data-cgroup]').forEach(function(g){g.hidden=!(cat==='all'||g.getAttribute('data-cgroup')===cat)});
  })});
  var cq=$('#course-q');
  if(cq){cq.addEventListener('input',function(){
    var q=cq.value.trim().toLowerCase(),n=0;
    $$('.course-card').forEach(function(c){var m=!q||c.getAttribute('data-text').indexOf(q)>-1;c.hidden=!m;if(m)n++});
    var ce=$('#course-count');if(ce)ce.textContent=n+' course'+(n===1?'':'s')+' shown';
  })}
}

/* ---- syllabus library ---- */
var lib=$('#lib');
if(lib){
  var status=$('#lib-status'),list=$('#lib-list'),count=$('#lib-count'),data=[];
  var F={q:$('#f-q'),type:$('#f-type'),inst:$('#f-inst'),degree:$('#f-degree'),branch:$('#f-branch'),session:$('#f-session'),sem:$('#f-sem'),sort:$('#f-sort')};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var fill=function(sel,key,all){
    var vals=Array.from(new Set(data.map(function(d){return d[key]}).filter(Boolean))).sort();
    sel.innerHTML='<option value="">'+all+'</option>'+vals.map(function(v){return '<option>'+esc(v)+'</option>'}).join('');
    var wrap=sel.closest('.fg');if(wrap&&!vals.length)wrap.hidden=true;
  };
  var render=function(){
    var q=F.q.value.trim().toLowerCase();
    var out=data.filter(function(d){
      if(F.type.value&&d.type!==F.type.value)return false;
      if(F.inst.value&&d.institution!==F.inst.value)return false;
      if(F.degree.value&&d.degree!==F.degree.value)return false;
      if(F.branch.value&&d.branch!==F.branch.value)return false;
      if(F.session.value&&d.session!==F.session.value)return false;
      if(F.sem&&F.sem.value&&d.semester!==F.sem.value)return false;
      if(q&&d.search.indexOf(q)<0)return false;return true});
    var s=F.sort.value;
    out.sort(function(a,b){return s==='inst'?(a.institution+a.title).localeCompare(b.institution+b.title):a.title.localeCompare(b.title)});
    count.textContent=out.length+' of '+data.length+' syllabus record'+(data.length===1?'':'s')+' shown';
    if(!out.length){list.innerHTML='<div class="empty" role="status"><p><strong>No syllabus matches these filters.</strong></p><p>Try clearing a filter, or <a href="/contact/?topic=syllabus-request">ask us to add a syllabus</a>.</p></div>';return}
    list.innerHTML=out.map(function(d){
      var off=d.type==='official';
      var vt={verified:['green','Verified'],source_located:['warn','Official link located – contents not yet extracted'],needs_check:['warn','Link needs checking'],pending:['gray','Verification pending'],nexa_draft:['purple','NEXA-authored · v'+esc(d.version)]}[d.verification]||['gray',d.verification];
      var pdf=d.pdfUrl?'<a class="btn btn-o btn-sm" href="'+esc(d.pdfUrl)+'" target="_blank" rel="noopener noreferrer">View PDF'+(d.external?' (official site)':'')+'</a>'+(d.external?'':'<a class="btn btn-o btn-sm" href="'+esc(d.pdfUrl)+'" download>Download PDF</a>'):'<span class="tag gray">No PDF located yet</span>';
      return '<article class="card sy-card"><div><span class="tag '+(off?'':'purple')+'">'+(off?'Official University Syllabus':'NEXA Professional Curriculum')+'</span><span class="tag '+vt[0]+'">'+esc(vt[1])+'</span></div>'+
      '<h3>'+esc(d.title)+'</h3><div class="sy-meta"><span><b>Institution:</b> '+esc(d.institution)+'</span><span><b>Programme:</b> '+esc(d.programme||'Not specified')+'</span><span><b>Branch:</b> '+esc(d.branch||'Not specified')+'</span><span><b>Session / regulation:</b> '+esc(d.session||'Not specified')+'</span><span><b>Semester:</b> '+esc(d.semester||'Not specified')+'</span><span><b>Subject code:</b> '+esc(d.code||'Not specified')+'</span><span><b>Credits:</b> '+esc(d.credits||'Not specified')+'</span></div>'+
      '<div class="foot"><a class="btn btn-p btn-sm" href="'+esc(d.url)+'">View Full Syllabus</a>'+pdf+'</div></article>';
    }).join('');
  };
  fetch('/data/syllabus-index.json').then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){
    data=j.records.map(function(d){d.search=[d.title,d.institution,d.programme,d.branch,d.session,d.code,d.semester].join(' ').toLowerCase();return d});
    fill(F.inst,'institution','All institutions');fill(F.degree,'degree','All programmes / degrees');fill(F.branch,'branch','All branches');fill(F.session,'session','All sessions / regulations');
    if(F.sem)fill(F.sem,'semester','All semesters');
    var p=new URLSearchParams(location.search);if(p.get('type')&&F.type)F.type.value=p.get('type');if(p.get('q'))F.q.value=p.get('q');if(p.get('inst')){Array.from(F.inst.options).forEach(function(o){if(o.value.toLowerCase().indexOf(p.get('inst').toLowerCase())>-1)F.inst.value=o.value})}
    Object.keys(F).forEach(function(k){if(F[k])F[k].addEventListener(k==='q'?'input':'change',render)});
    $('#f-reset').addEventListener('click',function(){Object.keys(F).forEach(function(k){if(F[k]&&k!=='sort')F[k].value=''});render()});
    status.hidden=true;lib.hidden=false;render();
  }).catch(function(){status.className='note';status.innerHTML='<strong>The syllabus index could not be loaded.</strong> Please refresh, or browse <a href="/courses/">all courses</a> and <a href="/institutions/">official sources by institution</a>.'});
}

/* ---- enquiry form ---- */
var form=$('#enquiry');
if(form){
  var st=$('#form-status'),sel=$('#topic'),qs=new URLSearchParams(location.search);
  var want=qs.get('course')||qs.get('topic');
  if(want&&sel){Array.from(sel.options).forEach(function(o){if(o.getAttribute('data-slug')===want||o.value===want)sel.value=o.value})}
  var show=function(c,m){st.className='status show '+c;st.innerHTML=m;st.setAttribute('role',c==='bad'?'alert':'status')};
  var rules={
    name:function(v){return v.trim().length>=2?'':'Please enter your full name.'},
    email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?'':'Please enter a valid email address.'},
    phone:function(v){var d=v.replace(/[\s\-()]/g,'');return !d||/^(\+?\d{1,3})?\d{10}$/.test(d)?'':'Enter a 10-digit number (country code optional) or leave blank.'},
    topic:function(v){return v?'':'Please choose a course or topic.'},
    message:function(v){return v.trim().length>=10?'':'Please write at least 10 characters.'},
    consent:function(v,el){return el.checked?'':'Please tick the consent box so we can reply to you.'}
  };
  var check=function(n){var el=form.elements[n],e=$('#err-'+n),m=rules[n](el.value||'',el);if(e)e.textContent=m;el.setAttribute('aria-invalid',m?'true':'false');return !m};
  Object.keys(rules).forEach(function(n){var el=form.elements[n];if(el)el.addEventListener(n==='consent'?'change':'blur',function(){check(n)})});
  var enc=function(fd){return Array.from(fd.entries()).map(function(p){return encodeURIComponent(p[0])+'='+encodeURIComponent(p[1])}).join('&')};
  var waMsg=function(){var f=form.elements;return 'Hello NEXA, I am '+(f.name.value||'[name]')+'. I would like to know about: '+(f.topic.value||'your courses')+'.'+(f.message.value?' '+f.message.value:'')};
  var wa=$('#wa-send');if(wa)wa.addEventListener('click',function(){var n=wa.getAttribute('data-wa');window.open('https://wa.me/'+n+'?text='+encodeURIComponent(waMsg()),'_blank','noopener')});
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var ok=Object.keys(rules).map(check).every(Boolean);
    if(!ok){var first=$('[aria-invalid=true]',form);if(first)first.focus();show('bad','Please fix the highlighted fields and try again.');return}
    if(form.elements['bot-field'].value){return}
    var btn=$('button[type=submit]',form);btn.disabled=true;show('load','Sending your message…');
    fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:enc(new FormData(form))})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);show('ok','<strong>Thank you – your enquiry was submitted.</strong> We will reply by e-mail or phone.');form.reset();btn.disabled=false})
      .catch(function(){show('bad','<strong>We could not submit the form right now.</strong> Your message was NOT sent. Please use WhatsApp or e-mail instead – the buttons below are pre-filled with your details.');btn.disabled=false});
  });
}
})();

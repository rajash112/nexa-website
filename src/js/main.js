(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- mobile menu ---- */
var ham=$('#ham'),mm=$('#mmenu');
if(ham&&mm){
  var setMenu=function(o){mm.classList.toggle('open',o);ham.setAttribute('aria-expanded',String(o));ham.setAttribute('aria-label',o?'Close menu':'Open menu')};
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

/* ---- generic search + group filter (resources, projects) ---- */
$$('[data-flt]').forEach(function(root){
  var st={g:'all',q:''},chips=$$('.chip[data-g]',root),q=$('.flt-q',root),noun=root.getAttribute('data-noun')||'item';
  var apply=function(){
    $$('[data-item]',root).forEach(function(c){c.hidden=!(!st.q||c.getAttribute('data-text').indexOf(st.q)>-1)});
    $$('[data-group]',root).forEach(function(g){g.hidden=!((st.g==='all'||g.getAttribute('data-group')===st.g)&&g.querySelector('[data-item]:not([hidden])'))});
    var n=$$('[data-group]:not([hidden]) [data-item]:not([hidden])',root).length;
    var ce=$('.flt-count',root);if(ce)ce.textContent=n+' '+noun+(n===1?'':'s')+' shown';
    var em=$('.flt-empty',root);if(em)em.hidden=n>0;
  };
  chips.forEach(function(ch){ch.addEventListener('click',function(){st.g=ch.getAttribute('data-g');chips.forEach(function(c){c.setAttribute('aria-pressed',String(c===ch))});apply()})});
  if(q)q.addEventListener('input',function(){st.q=q.value.trim().toLowerCase();apply()});
  var rs=$('.flt-reset',root);if(rs)rs.addEventListener('click',function(){st={g:'all',q:''};if(q)q.value='';chips.forEach(function(c){c.setAttribute('aria-pressed',String(c.getAttribute('data-g')==='all'))});apply()});
  apply();
});
/* ---- courses page: category + level chips + search (combined) ---- */
var chips=$$('.chip[data-cat]');
if(chips.length){
  var st={cat:'all',lvl:'all',q:''},lvls=$$('.chip[data-lvl]'),cq=$('#course-q');
  var apply=function(){
    $$('.course-card').forEach(function(c){var m=(!st.q||c.getAttribute('data-text').indexOf(st.q)>-1)&&(st.lvl==='all'||c.getAttribute('data-level')===st.lvl);c.hidden=!m});
    $$('[data-cgroup]').forEach(function(g){g.hidden=!((st.cat==='all'||g.getAttribute('data-cgroup')===st.cat)&&g.querySelector('.course-card:not([hidden])'))});
    var n=$$('[data-cgroup]:not([hidden]) .course-card:not([hidden])').length;
    var ce=$('#course-count');if(ce)ce.textContent=n+' course'+(n===1?'':'s')+' shown';
    var em=$('#course-empty');if(em)em.hidden=n>0;
  };
  chips.forEach(function(ch){ch.addEventListener('click',function(){st.cat=ch.getAttribute('data-cat');chips.forEach(function(c){c.setAttribute('aria-pressed',String(c===ch))});apply()})});
  lvls.forEach(function(ch){ch.addEventListener('click',function(){var on=ch.getAttribute('aria-pressed')==='true';st.lvl=on?'all':ch.getAttribute('data-lvl');lvls.forEach(function(c){c.setAttribute('aria-pressed',String(!on&&c===ch))});apply()})});
  if(cq)cq.addEventListener('input',function(){st.q=cq.value.trim().toLowerCase();apply()});
  var rs=$('#course-reset');if(rs)rs.addEventListener('click',function(){st={cat:'all',lvl:'all',q:''};if(cq)cq.value='';chips.forEach(function(c){c.setAttribute('aria-pressed',String(c.getAttribute('data-cat')==='all'))});lvls.forEach(function(c){c.setAttribute('aria-pressed','false')});apply()});
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
      return '<article class="card sy-card '+(off?'sy-off':'sy-nexa')+'">'+'<div><span class="tag '+(off?'':'purple')+'">'+(off?'Official University Syllabus':'NEXA Professional Curriculum')+'</span><span class="tag '+vt[0]+'">'+esc(vt[1])+'</span></div>'+
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

/* ---- gallery lightbox ---- */
var gal=$('#gallery'),lb=$('#lb');
if(gal&&lb){
  var gi=$$('.g-item',gal),cur=0,opener=null,lbi=$('#lb-img'),lbc=$('#lb-cap');
  var show=function(i){cur=(i+gi.length)%gi.length;var b=gi[cur];lbi.src=b.getAttribute('data-full');lbi.alt=b.getAttribute('data-alt');lbc.textContent=b.getAttribute('data-cap')+' – photo '+(cur+1)+' of '+gi.length};
  var openLb=function(i,btn){opener=btn;show(i);lb.hidden=false;document.body.style.overflow='hidden';$('.lb-x',lb).focus()};
  var closeLb=function(){lb.hidden=true;lbi.removeAttribute('src');document.body.style.overflow='';if(opener)opener.focus()};
  gi.forEach(function(b,i){b.addEventListener('click',function(){openLb(i,b)})});
  $('.lb-x',lb).addEventListener('click',closeLb);$('.lb-p',lb).addEventListener('click',function(){show(cur-1)});$('.lb-n',lb).addEventListener('click',function(){show(cur+1)});
  lb.addEventListener('click',function(e){if(e.target===lb)closeLb()});
  document.addEventListener('keydown',function(e){if(lb.hidden)return;
    if(e.key==='Escape')closeLb();else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);
    else if(e.key==='Tab'){var f=$$('button',lb),first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
  var tx=null;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1));tx=null});
}
/* ---- enquiry hub: tabs + shared validation/submit for every form.enq ---- */
var qs=new URLSearchParams(location.search);
var tabsRoot=$('[data-tabs]');
if(tabsRoot){
  var tabBtns=$$('[role=tab]',tabsRoot),panels=$$('[role=tabpanel]',tabsRoot);
  var showTab=function(k,focus){tabBtns.forEach(function(t){var on=t.getAttribute('data-tab')===k;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus()});panels.forEach(function(p){p.hidden=p.id!=='panel-'+k})};
  tabBtns.forEach(function(t,i){
    t.addEventListener('click',function(){showTab(t.getAttribute('data-tab'))});
    t.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:e.key==='Home'?0:e.key==='End'?tabBtns.length-1:null;if(n===null)return;e.preventDefault();showTab(tabBtns[(n+tabBtns.length)%tabBtns.length].getAttribute('data-tab'),true)});
  });
  var topicTab={'institution-partnership':'institution','internship-program':'internship','workshop-bootcamp':'workshop','website-development':'software'};
  var known=tabBtns.map(function(t){return t.getAttribute('data-tab')});
  var startTab=qs.get('enquiry')||topicTab[qs.get('topic')]||(location.hash||'').slice(1);
  showTab(known.indexOf(startTab)>-1?startTab:'course');
  var fc=$('.form-card');
  if(fc&&(qs.get('enquiry')||qs.get('topic')||qs.get('course')||location.hash)){setTimeout(function(){if(fc.getBoundingClientRect().top>window.innerHeight*0.6)fc.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})},60)}
}
var rules={
  name:function(v){return v.trim().length>=2?'':'Please enter your full name.'},
  email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?'':'Please enter a valid email address.'},
  phone:function(v,el){var d=v.replace(/[\s\-()]/g,'');if(!d)return el.required?'Please enter a phone number.':'';return /^(\+?\d{1,3})?\d{10}$/.test(d)?'':'Enter a 10-digit number (country code optional)'+(el.required?'.':' or leave blank.')},
  topic:function(v){return v?'':'Please choose a course or topic.'},
  message:function(v){return v.trim().length>=10?'':'Please write at least 10 characters.'},
  consent:function(v,el){return el.checked?'':'Please tick the consent box so we can reply to you.'},
  students:function(v){return !v||/^[1-9]\d*$/.test(v.trim())?'':'Enter a whole number or leave blank.'},
  participants:function(v){return !v||/^[1-9]\d*$/.test(v.trim())?'':'Enter a whole number or leave blank.'}
};
var fieldRule=function(el){return rules[el.name]||(el.required?function(v){return v.trim()?'':(el.tagName==='SELECT'?'Please choose an option.':'This field is required.')}:null)};
$$('form.enq').forEach(function(form){
  var st=$('.status',form),sel=$('select[name=topic]',form),names=['bot-field','form-name'];
  if(form.id==='enquiry'&&sel){var want=qs.get('course')||qs.get('topic');if(want)Array.from(sel.options).forEach(function(o){if(o.getAttribute('data-slug')===want||o.value===want)sel.value=o.value})}
  var show=function(c,m){st.className='status show '+c;st.innerHTML=m;st.setAttribute('role',c==='bad'?'alert':'status')};
  var fields=Array.from(form.elements).filter(function(el){return el.name&&names.indexOf(el.name)<0&&fieldRule(el)});
  var check=function(el){var r=fieldRule(el),m=r(el.value||'',el),eid=el.getAttribute('aria-describedby'),e=eid&&document.getElementById(eid);if(e)e.textContent=m;el.setAttribute('aria-invalid',m?'true':'false');return !m};
  fields.forEach(function(el){el.addEventListener(el.type==='checkbox'||el.tagName==='SELECT'?'change':'blur',function(){check(el)})});
  var enc=function(fd){return Array.from(fd.entries()).map(function(p){return encodeURIComponent(p[0])+'='+encodeURIComponent(p[1])}).join('&')};
  var waMsg=function(){var f=form.elements,parts=[];Array.from(f).forEach(function(el){if(!el.name||el.type==='hidden'||el.type==='checkbox'||el.type==='submit'||el.type==='button'||['bot-field','name','email','phone','message'].indexOf(el.name)>-1||!el.value)return;parts.push(el.name.replace(/_/g,' ')+': '+el.value)});
    return ('Hello NEXA, I am '+(f.name.value||'[name]')+'. ['+form.getAttribute('data-wa-label')+'] '+parts.join('; ')+(f.message.value?'. '+f.message.value:'')).slice(0,900)};
  var wa=$('.wa-send',form);if(wa)wa.addEventListener('click',function(){window.open('https://wa.me/'+wa.getAttribute('data-wa')+'?text='+encodeURIComponent(waMsg()),'_blank','noopener')});
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var ok=fields.map(check).every(Boolean);
    if(!ok){var first=$('[aria-invalid=true]',form);if(first)first.focus();show('bad','Please fix the highlighted fields and try again.');return}
    if(form.elements['bot-field'].value){return}
    var btn=$('button[type=submit]',form);btn.disabled=true;show('load','Sending your message…');
    fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:enc(new FormData(form))})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);show('ok','<strong>Thank you – your enquiry was submitted.</strong> We will reply by e-mail or phone.');form.reset();btn.disabled=false})
      .catch(function(){show('bad','<strong>We could not submit the form right now.</strong> Your message was NOT sent. Please use WhatsApp or e-mail instead – the buttons below are pre-filled with your details.');btn.disabled=false});
  });
});
})();

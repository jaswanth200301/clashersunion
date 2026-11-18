(function(){
var C=window.CU_CONFIG||{},page=document.body.dataset.page,box=document.getElementById('msg');
function $(id){return document.getElementById(id);}
function say(t,bad){box.textContent=t;box.className=bad?'err':'ok';}
document.querySelectorAll('form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();});});
if(!window.supabase||String(C.SUPABASE_URL).indexOf('PASTE')===0||String(C.SUPABASE_PUBLISHABLE_KEY).indexOf('PASTE')===0){say('Accounts are not set up yet. Add the project URL and publishable key in config.js.',true);return;}
var sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);
var CF=C.TURNSTILE_SITE_KEY&&String(C.TURNSTILE_SITE_KEY).indexOf('PASTE')!==0,wid=null;
if(CF&&$('cf')){var tw=setInterval(function(){if(window.turnstile){clearInterval(tw);wid=window.turnstile.render('#cf',{sitekey:C.TURNSTILE_SITE_KEY,theme:'dark'});}},200);}
function capt(){if(!CF)return{ok:true,opt:{}};var k=wid!==null?window.turnstile.getResponse(wid):'';if(!k){say('Please complete the check first.',true);return{ok:false};}return{ok:true,opt:{captchaToken:k}};}
function recap(){if(CF&&wid!==null)window.turnstile.reset(wid);}
var TAG=/^#[0289PYLQGRJCUV]{3,12}$/;
function tag(v){return v.trim().toUpperCase().replace(/^#?/,'#').replace(/O/g,'0');}
function busy(f,b){f.querySelector('button').disabled=b;}
if(page==='register'){var f=$('form');f.addEventListener('submit',async function(){
 var pt=tag($('player_tag').value),ct=$('clan_tag').value.trim()?tag($('clan_tag').value):'';
 if(!TAG.test(pt))return say('Enter a valid player tag, like #2PYLQ80.',true);
 if(ct&&!TAG.test(ct))return say('Enter a valid clan tag, like #2PYLQ80, or leave it empty.',true);
 if($('password').value.length<8)return say('Use a password with at least 8 characters.',true);
 var cp=capt();if(!cp.ok)return;
 busy(f,true);
 var r=await sb.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{captchaToken:cp.opt.captchaToken,emailRedirectTo:location.origin+'/login.html',data:{player_name:$('player_name').value.trim(),player_tag:pt,clan_name:$('clan_name').value.trim(),clan_tag:ct}}});
 busy(f,false);recap();
 if(r.error)return say('We could not create the account. Check your details. This player tag may already be registered.',true);
 f.reset();say('Almost done. Open the email we sent you, confirm your address, then log in.');
});}
if(page==='login'){var g=$('form');g.addEventListener('submit',async function(){
 var cp=capt();if(!cp.ok)return;
 busy(g,true);
 var r=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value,options:{captchaToken:cp.opt.captchaToken}});
 busy(g,false);recap();
 if(r.error)return say('Wrong email or password, or your email is not confirmed yet.',true);
 location.href='account.html';
});}
if(page==='account'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var r=await sb.from('profiles').select('player_name,player_tag,clan_name,clan_tag,tag_verified').eq('id',s.user.id).single();
 if(r.error){say('We could not load your profile. Try again later.',true);return;}
 var d=r.data;
 $('v_name').textContent=d.player_name;$('v_tag').textContent=d.player_tag;
 $('v_clan').textContent=d.clan_name||'None';$('v_ctag').textContent=d.clan_tag||'None';
 $('v_status').textContent=d.tag_verified?'Verified':'Not verified yet';$('v_email').textContent=s.user.email;$('v_pub').href='player.html?tag='+encodeURIComponent(d.player_tag.slice(1));
 $('verify').hidden=!!d.tag_verified;
 $('vform').addEventListener('submit',async function(){
  busy($('vform'),true);
  var r=await sb.functions.invoke('super-api',{body:{token:$('vtoken').value.trim()}});
  busy($('vform'),false);
  var o=r.data||{};
  if(!o.message){
   var er=r.error||{},st=er.context&&er.context.status,det='';
   if(er.context&&er.context.json){try{var j=await er.context.json();det=j.message||j.msg||j.error||JSON.stringify(j);}catch(x){}}
   return say('Could not reach the verification service ('+(er.name||'error')+(st?' '+st:'')+(det?': '+det:'')+').',true);
  }
  say(o.message,!o.ok);
  if(o.ok){$('v_status').textContent='Verified';$('verify').hidden=true;}
 });
 $('dform').addEventListener('submit',async function(){
  if($('dconfirm').value.trim()!=='DELETE')return say('Type DELETE in capital letters to confirm.',true);
  busy($('dform'),true);
  var r=await sb.functions.invoke('super-api',{body:{action:'delete',confirm:'DELETE'}});
  var o=r.data||{};
  if(!o.ok){busy($('dform'),false);return say(o.message||'We could not delete your account. Please email us.',true);}
  await sb.auth.signOut();location.href='index.html';
 });
 $('logout').addEventListener('click',async function(){await sb.auth.signOut();location.href='login.html';});
})();}
if(page==='home'){(async function(){
 var r=await sb.from('posts').select('title,body,published_at').eq('published',true).order('published_at',{ascending:false}).limit(10);
 var el=$('posts');el.textContent='';
 if(r.error){el.textContent='Posts could not be loaded right now.';return;}
 if(!r.data.length){el.textContent='No posts yet.';return;}
 r.data.forEach(function(p){var a=document.createElement('article'),h=document.createElement('h3'),d=document.createElement('p');
  h.textContent=p.title;d.className='date';d.textContent=new Date(p.published_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});a.append(h,d);
  p.body.split(/\n{2,}/).forEach(function(t){var q=document.createElement('p');q.textContent=t;a.append(q);});el.append(a);});
})();}
if(page==='admin'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var me=await sb.from('profiles').select('role').eq('id',s.user.id).single();
 if(me.error||me.data.role!=='admin'){say('This page is for admins only.',true);return;}
 $('panel').hidden=false;
 function clear(){$('pform').reset();$('pid').value='';$('ppat').value='';}
 async function load(){
  var r=await sb.from('posts').select('id,title,body,published,published_at,created_at').order('created_at',{ascending:false});
  var el=$('plist');el.textContent='';
  if(r.error){say('Could not load posts.',true);return;}
  if(!r.data.length){el.textContent='No posts yet.';return;}
  r.data.forEach(function(p){
   var a=document.createElement('article'),h=document.createElement('h3'),d=document.createElement('p'),b=document.createElement('div');
   h.textContent=p.title;d.className='date';d.textContent=p.published?'Published':'Draft';b.className='actions';
   function btn(t,fn){var x=document.createElement('button');x.type='button';x.className='alt';x.textContent=t;x.addEventListener('click',fn);b.append(x);}
   btn('Edit',function(){$('pid').value=p.id;$('ppat').value=p.published_at||'';$('ptitle').value=p.title;$('pbody').value=p.body;$('ppub').checked=p.published;window.scrollTo(0,0);});
   btn(p.published?'Unpublish':'Publish',async function(){
    var e=await sb.from('posts').update({published:!p.published,published_at:p.published_at||new Date().toISOString()}).eq('id',p.id);
    if(e.error)say('Could not change the post.',true);else{say('Saved.');load();}});
   btn('Delete',async function(){
    if(!confirm('Delete this post for good?'))return;
    var e=await sb.from('posts').delete().eq('id',p.id);
    if(e.error)say('Could not delete the post.',true);else{say('Deleted.');load();}});
   a.append(h,d,b);el.append(a);});
 }
 $('pnew').addEventListener('click',clear);
 $('pform').addEventListener('submit',async function(){
  var pub=$('ppub').checked,pat=$('ppat').value,id=$('pid').value;
  var row={title:$('ptitle').value.trim(),body:$('pbody').value.trim(),published:pub,published_at:pub?(pat||new Date().toISOString()):(pat||null)};
  busy($('pform'),true);
  var e=id?await sb.from('posts').update(row).eq('id',id):await sb.from('posts').insert(Object.assign({author_id:s.user.id},row));
  busy($('pform'),false);
  if(e.error)return say('Could not save the post.',true);
  say('Saved.');clear();load();
 });
 load();
})();}
var JOIN={open:'Anyone can join',inviteOnly:'Invite only',closed:'Closed'};
var WARF={always:'Always',moreThanOncePerWeek:'More than once a week',oncePerWeek:'Once a week',lessThanOncePerWeek:'Less than once a week',never:'Never',unknown:'Unknown'};
function ptag(t){return 'player.html?tag='+encodeURIComponent(String(t).replace('#',''));}
function ctag(t){return 'clan.html?tag='+encodeURIComponent(String(t).replace('#',''));}
if(page==='player'){
 var load=async function(t){
  $('card').hidden=true;say('Loading...');
  var r=await sb.functions.invoke('super-api',{body:{action:'profile',tag:t}});
  var o=r.data||{};
  if(!o.ok)return say(o.message||'We could not load this profile. Try again in a moment.',true);
  var d=o.player;box.textContent='';box.className='';
  $('pname').textContent=d.name;document.title=d.name+' | Clashers Union by Rowdy';
  $('pbadge').hidden=!o.member;
  var dl=$('pdl');dl.textContent='';
  function row(k,v){if(v===null||v===undefined||v==='')return;var a=document.createElement('dt'),b=document.createElement('dd');a.textContent=k;b.textContent=String(v);dl.append(a,b);}
  row('Player tag',d.tag);row('Town Hall',d.townHallLevel);row('XP level',d.expLevel);
  row('Trophies',d.trophies);row('Best trophies',d.bestTrophies);row('League',d.league);
  row('War stars',d.warStars);row('Attack wins',d.attackWins);row('Defense wins',d.defenseWins);
  row('Clan',d.clanName?d.clanName+' ('+d.clanTag+')':'No clan');row('Clan role',d.role);if(d.clanTag){var ta=document.createElement('dt'),tb=document.createElement('dd'),ln=document.createElement('a');ta.textContent='Clan page';ln.href=ctag(d.clanTag);ln.textContent='View '+d.clanName;tb.append(ln);dl.append(ta,tb);}
  row('Builder Hall',d.builderHallLevel);row('Donations given',d.donations);row('Donations received',d.donationsReceived);
  (d.heroes||[]).forEach(function(h){row(h.name,h.level+' / '+h.maxLevel);});
  $('pmeta').textContent='Last updated: '+new Date(o.fetchedAt).toLocaleString('en-IN')+(o.stale?'. The game server is not answering, so this is a saved copy.':'');
  $('card').hidden=false;
  $('pshare').onclick=function(){var u=location.origin+location.pathname+'?tag='+encodeURIComponent(d.tag.slice(1));
   if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){say('Link copied.');});else say(u);};
 };
 $('sform').addEventListener('submit',function(){
  var t=tag($('stag').value);
  if(!TAG.test(t))return say('Enter a valid player tag, like #2PYLQ80.',true);
  location.href='player.html?tag='+encodeURIComponent(t.slice(1));
 });
 var q=new URLSearchParams(location.search).get('tag');
 if(q){$('stag').value=tag(q);load(tag(q));}
}
if(page==='clans'){
 $('cform').addEventListener('submit',async function(){
  var n=$('cname').value.trim();
  if(n.length<3)return say('Type at least 3 letters of the clan name.',true);
  var lv=parseInt($('clevel').value,10)||0,mm=parseInt($('cmem').value,10)||0;
  busy($('cform'),true);say('Searching...');
  var r=await sb.functions.invoke('super-api',{body:{action:'clansearch',name:n,minClanLevel:lv,minMembers:mm}});
  busy($('cform'),false);
  var o=r.data||{};
  if(!o.ok)return say(o.message||'Search failed. Try again.',true);
  box.textContent='';box.className='';
  var ul=$('cres');ul.textContent='';
  if(!o.clans.length){say('No clans matched. Try a different name or fewer filters.');return;}
  o.clans.forEach(function(c){var li=document.createElement('li'),a=document.createElement('a'),m=document.createElement('span');
   a.href=ctag(c.tag);a.textContent=c.name+' ('+c.tag+')';
   m.textContent='Level '+c.clanLevel+' - '+c.members+'/50 - '+(JOIN[c.type]||'');m.className='date';
   li.append(a,m);ul.append(li);});
 });
}
if(page==='clan'){(async function(){
 var q=new URLSearchParams(location.search).get('tag');
 if(!q){say('Open a clan from the clan search page.',true);return;}
 say('Loading...');
 var r=await sb.functions.invoke('super-api',{body:{action:'clan',tag:tag(q)}});
 var o=r.data||{};
 if(!o.ok)return say(o.message||'We could not load this clan. Try again in a moment.',true);
 box.textContent='';box.className='';
 var d=o.clan;document.title=d.name+' | Clashers Union by Rowdy';
 $('ctitle').textContent=d.name;
 var dl=$('cdl');
 function row(k,v){if(v===null||v===undefined||v==='')return;var a=document.createElement('dt'),b=document.createElement('dd');a.textContent=k;b.textContent=String(v);dl.append(a,b);}
 row('Clan tag',d.tag);row('Level',d.clanLevel);row('Members',d.members+' / 50');row('Clan points',d.clanPoints);
 row('Who can join',JOIN[d.type]);row('Required trophies',d.requiredTrophies);row('War wins',d.warWins);row('War frequency',WARF[d.warFrequency]);row('Location',d.location);
 $('cdesc').textContent=d.description||'';
 var sm=o.siteMembers||[];
 $('cu').textContent=sm.length+' of this clan\'s members have a verified Clashers Union account.';
 var ul=$('mlist');
 d.memberList.forEach(function(m){var li=document.createElement('li'),a=document.createElement('a'),s=document.createElement('span');
  a.href=ptag(m.tag);a.textContent=m.name;
  s.textContent=(m.role?m.role+' - ':'')+m.trophies+' trophies';s.className='date';
  if(sm.indexOf(m.tag)>-1){var b=document.createElement('span');b.className='badge';b.textContent='Member';li.append(a,b,s);}else li.append(a,s);
  ul.append(li);});
 $('cmeta').textContent='Last updated: '+new Date(o.fetchedAt).toLocaleString('en-IN')+(o.stale?'. The game server is not answering, so this is a saved copy.':'');
 $('ccard').hidden=false;
 $('cshare').onclick=function(){var u=location.origin+location.pathname+'?tag='+encodeURIComponent(d.tag.slice(1));
  if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){say('Link copied.');});else say(u);};
})();}
if(page==='adminusers'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var me=await sb.from('profiles').select('role').eq('id',s.user.id).single();
 if(me.error||me.data.role!=='admin'){say('This page is for admins only.',true);return;}
 $('panel').hidden=false;
 async function load(){
  var q=$('uq').value.replace(/[^A-Za-z0-9#_ -]/g,'').trim();
  var req=sb.from('profiles').select('id,player_name,player_tag,role,tag_verified,banned,created_at').order('created_at',{ascending:false}).limit(50);
  if(q)req=req.or('player_name.ilike.%'+q+'%,player_tag.ilike.%'+q+'%');
  var r=await req;
  var el=$('ulist');el.textContent='';
  if(r.error){say('Could not load users.',true);return;}
  if(!r.data.length){el.textContent='No users found.';return;}
  r.data.forEach(function(p){
   var li=document.createElement('li'),info=document.createElement('span'),a=document.createElement('a');
   a.href=ptag(p.player_tag);a.textContent=p.player_name+' ('+p.player_tag+')';
   info.className='date';info.textContent=[p.role,p.tag_verified?'verified':'not verified',p.banned?'BANNED':''].filter(Boolean).join(' - ');
   li.append(a,info);
   if(p.role!=='admin'&&p.id!==s.user.id){
    var b=document.createElement('button');b.type='button';b.className='alt';b.textContent=p.banned?'Unban':'Ban';
    b.addEventListener('click',async function(){
     if(!confirm((p.banned?'Unban ':'Ban ')+p.player_name+'?'))return;
     var x=await sb.functions.invoke('super-api',{body:{action:'admin_ban',id:p.id,banned:!p.banned}});
     var o=x.data||{};say(o.message||'Something went wrong.',!o.ok);if(o.ok)load();
    });
    li.append(b);
   }
   el.append(li);
  });
 }
 $('usearch').addEventListener('submit',load);
 load();
})();}
if(page==='chat'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var me=await sb.from('profiles').select('tag_verified,banned,role').eq('id',s.user.id).single();
 if(me.error){say('We could not load your profile.',true);return;}
 if(me.data.banned){say('Your account has been banned.',true);return;}
 if(!me.data.tag_verified){say('Verify your player tag on your account page to use chat.',true);return;}
 var isAdmin=me.data.role==='admin',blocked={},list=$('mlist');
 var cq=new URLSearchParams(location.search).get('clan'),chan='global',canMod=isAdmin;
 var room=new URLSearchParams(location.search).get('room');
 if(room==='leaders'){
  await sb.functions.invoke('super-api',{body:{action:'check_leader'}});
  var lp=await sb.from('profiles').select('is_leader').eq('id',s.user.id).single();
  if(lp.error||!lp.data.is_leader){say('Only clan leaders and co-leaders can use this chat.',true);return;}
  chan='leaders';$('chtitle').textContent='Leaders chat';
 }
 if(cq){
  var ct=tag(cq);chan='clan:'+ct.slice(1);
  var mr=await sb.from('clan_chat_members').select('chat_role').eq('user_id',s.user.id).eq('clan_tag',ct).maybeSingle();
  if(!mr.data){say('You are not a member of this clan chat.',true);return;}
  canMod=isAdmin||mr.data.chat_role==='owner'||mr.data.chat_role==='moderator';
  var cn=await sb.from('clans').select('name').eq('tag',ct).maybeSingle();
  $('chtitle').textContent=(cn.data?cn.data.name:ct)+' chat';
  if(mr.data.chat_role!=='member'){$('mnglink').hidden=false;$('mnga').href='chat-manage.html?clan='+encodeURIComponent(ct.slice(1));}
  var mem=await sb.from('clan_chat_members').select('member_name,chat_role').eq('clan_tag',ct).order('joined_at',{ascending:true});
  var ml=$('memlist');ml.textContent='';
  (mem.data||[]).forEach(function(x){var li=document.createElement('li'),a=document.createElement('span'),b=document.createElement('span');a.textContent=x.member_name;b.className='date';b.textContent=x.chat_role;li.append(a,b);ml.append(li);});
  $('memwrap').hidden=false;
 }
 $('chat').hidden=false;
 function drawBlocked(){
  var bl=$('blist');bl.textContent='';var ids=Object.keys(blocked);
  if(!ids.length){bl.textContent='Nobody blocked.';return;}
  ids.forEach(function(id){var li=document.createElement('li'),sp=document.createElement('span'),b=document.createElement('button');
   sp.textContent=blocked[id];b.type='button';b.className='alt';b.textContent='Unblock';
   b.addEventListener('click',async function(){
    var e=await sb.from('blocks').delete().eq('blocked_id',id);
    if(e.error)return say('Could not unblock. Try again.',true);
    delete blocked[id];drawBlocked();redrawAll();say('Unblocked.');});
   li.append(sp,b);bl.append(li);});
 }
 var all={};
 function btn(box2,t,fn){var x=document.createElement('button');x.type='button';x.className='alt';x.textContent=t;x.addEventListener('click',fn);box2.append(x);}
 function draw(m){
  all[m.id]=m;
  var li=document.getElementById('m-'+m.id),isNew=!li;
  if(isNew){li=document.createElement('li');li.id='m-'+m.id;}
  li.textContent='';
  li.hidden=!!(m.author_id&&blocked[m.author_id]);
  var head=document.createElement('div'),who,t=document.createElement('span'),body=document.createElement('div');
  head.className='mhead';
  if(m.author_id&&m.author_tag){who=document.createElement('a');who.href=ptag(m.author_tag);who.textContent=m.author_name;}
  else{who=document.createElement('span');who.textContent='Former member';}
  t.className='date';t.textContent=new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  head.append(who,t);
  body.textContent=m.deleted?'Message removed':m.body;if(m.deleted)body.className='date';
  li.append(head,body);
  if(!m.deleted){
   var acts=document.createElement('div');acts.className='actions';
   if(m.author_id===s.user.id||canMod)btn(acts,'Delete',async function(){
    if(!confirm('Delete this message?'))return;
    var x=await sb.functions.invoke('super-api',{body:{action:'delete_message',id:m.id}});
    var o=x.data||{};if(!o.ok)say(o.message||'Could not delete.',true);});
   if(m.author_id&&m.author_id!==s.user.id){
    btn(acts,'Report',async function(){
     var why=prompt('Why are you reporting this message?');if(!why)return;
     var x=await sb.functions.invoke('super-api',{body:{action:'report_message',id:m.id,reason:why}});
     var o=x.data||{};say(o.message||'Could not send the report.',!o.ok);});
    btn(acts,'Block',async function(){
     if(!confirm('Block '+m.author_name+'? You will no longer see their messages.'))return;
     var e=await sb.from('blocks').insert({blocker_id:s.user.id,blocked_id:m.author_id,blocked_name:m.author_name});
     if(e.error)return say('Could not block. Try again.',true);
     blocked[m.author_id]=m.author_name;drawBlocked();redrawAll();say('Blocked.');});
   }
   if(acts.children.length)li.append(acts);
  }
  if(isNew)list.append(li);
 }
 function redrawAll(){Object.keys(all).forEach(function(id){draw(all[id]);});}
 function near(){return list.scrollHeight-list.scrollTop-list.clientHeight<80;}
 async function load(){
  var r=await sb.from('messages').select('id,author_id,author_name,author_tag,body,deleted,created_at').eq('channel',chan).order('created_at',{ascending:false}).limit(50);
  if(r.error){say('Could not load messages.',true);return;}
  var stick=near();
  r.data.reverse().forEach(draw);
  if(stick)list.scrollTop=list.scrollHeight;
 }
 var br=await sb.from('blocks').select('blocked_id,blocked_name');
 (br.data||[]).forEach(function(b){blocked[b.blocked_id]=b.blocked_name;});
 drawBlocked();
 await load();list.scrollTop=list.scrollHeight;
 sb.channel('chat-'+chan).on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:'channel=eq.'+chan},function(p){
  if(p.new&&p.new.id){var stick=near();draw(p.new);if(stick)list.scrollTop=list.scrollHeight;}
 }).subscribe();
 $('cform').addEventListener('submit',async function(){
  var text=$('cbody').value.trim();if(!text)return;
  busy($('cform'),true);
  var x=await sb.functions.invoke('super-api',{body:{action:'send_message',body:text,channel:chan}});
  busy($('cform'),false);
  var o=x.data||{};
  if(!o.ok)return say(o.message||'The message could not be sent. Try again.',true);
  box.textContent='';box.className='';$('cbody').value='';$('cbody').focus();load();
 });
})();}
if(page==='adminreports'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var me=await sb.from('profiles').select('role').eq('id',s.user.id).single();
 if(me.error||me.data.role!=='admin'){say('This page is for admins only.',true);return;}
 $('panel').hidden=false;
 async function load(){
  var r=await sb.from('reports').select('id,reporter_name,message_id,reported_user_id,reported_name,message_body,reason,created_at').eq('status','open').order('created_at',{ascending:true});
  var el=$('rlist');el.textContent='';
  if(r.error){say('Could not load reports.',true);return;}
  if(!r.data.length){el.textContent='No open reports.';return;}
  r.data.forEach(function(p){
   var li=document.createElement('li'),h=document.createElement('strong'),m=document.createElement('p'),w=document.createElement('p'),b=document.createElement('div');
   h.textContent=p.reported_name;m.textContent=p.message_body;
   w.className='date';w.textContent='Reason: '+p.reason+' (reported by '+p.reporter_name+')';b.className='actions';
   function act(t,fn){var x=document.createElement('button');x.type='button';x.className='alt';x.textContent=t;x.addEventListener('click',fn);b.append(x);}
   async function resolve(){var e=await sb.from('reports').update({status:'resolved'}).eq('id',p.id);if(e.error)say('Could not close the report.',true);else load();}
   if(p.message_id)act('Remove message',async function(){
    var x=await sb.functions.invoke('super-api',{body:{action:'delete_message',id:p.message_id}});
    var o=x.data||{};if(!o.ok)return say(o.message||'Could not remove it.',true);say('Message removed.');resolve();});
   if(p.reported_user_id)act('Ban user',async function(){
    if(!confirm('Ban '+p.reported_name+'?'))return;
    var x=await sb.functions.invoke('super-api',{body:{action:'admin_ban',id:p.reported_user_id,banned:true}});
    var o=x.data||{};say(o.message||'Something went wrong.',!o.ok);});
   act('Dismiss',resolve);
   var d=document.createElement('div');d.append(h,m,w,b);li.append(d);el.append(li);
  });
 }
 load();
})();}
if(page==='chats'){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='login.html';return;}
 var me=await sb.from('profiles').select('tag_verified,banned,player_tag').eq('id',s.user.id).single();
 if(me.error||me.data.banned){say('Chat is not available for this account.',true);return;}
 if(!me.data.tag_verified){say('Verify your player tag on your account page to use chat.',true);return;}
 $('panel').hidden=false;
 sb.functions.invoke('super-api',{body:{action:'check_leader'}}).then(function(x){if(x.data&&x.data.leader)$('leadli').hidden=false;});
 async function load(){
  var r=await sb.from('clan_chat_members').select('clan_tag,chat_role,clans(name)').eq('user_id',s.user.id).order('joined_at',{ascending:true});
  var el=$('clist');el.textContent='';
  if(r.error){say('Could not load your chats.',true);return;}
  if(!r.data.length){el.textContent='You are not in any clan chat yet.';return;}
  r.data.forEach(function(c){
   var li=document.createElement('li'),a=document.createElement('a'),sp=document.createElement('span'),b=document.createElement('button');
   a.href='chat.html?clan='+encodeURIComponent(c.clan_tag.slice(1));a.textContent=(c.clans?c.clans.name:c.clan_tag);
   sp.className='date';sp.textContent=c.chat_role;
   b.type='button';b.className='alt';b.textContent='Leave';
   b.addEventListener('click',async function(){
    if(!confirm('Leave this chat?'))return;
    var x=await sb.functions.invoke('super-api',{body:{action:'leave_clan',clan:c.clan_tag}});
    var o=x.data||{};say(o.message||'Something went wrong.',!o.ok);if(o.ok)load();});
   li.append(a,sp,b);el.append(li);});
 }
 async function redeem(code){
  var x=await sb.functions.invoke('super-api',{body:{action:'redeem_invite',code:code}});
  var o=x.data||{};say(o.message||'Something went wrong. Try again.',!o.ok);
  if(o.ok){load();loadInv();}
 }
 async function loadInv(){
  var r=await sb.from('invites').select('code,clan_tag,clans(name)').eq('target_tag',me.data.player_tag).eq('revoked',false).gt('expires_at',new Date().toISOString());
  var el=$('invlist');el.textContent='';
  if(r.error||!r.data.length){el.textContent='No invitations right now.';return;}
  r.data.forEach(function(i){var li=document.createElement('li'),sp=document.createElement('span'),b=document.createElement('button');
   sp.textContent=i.clans?i.clans.name:i.clan_tag;b.type='button';b.textContent='Accept';
   b.addEventListener('click',function(){redeem(i.code);});li.append(sp,b);el.append(li);});
 }
 $('redeem').addEventListener('click',function(){var cd=$('icode').value.trim();if(!cd)return say('Paste an invite code first.',true);redeem(cd);});
 var ip=new URLSearchParams(location.search).get('invite');
 if(ip){$('icode').value=ip;say('You opened an invite link. Press "Join with invite" to continue.');}
 loadInv();
 $('joinmine').addEventListener('click',async function(){
  $('joinmine').disabled=true;
  var x=await sb.functions.invoke('super-api',{body:{action:'join_my_clan'}});
  $('joinmine').disabled=false;
  var o=x.data||{};say(o.message||'Something went wrong. Try again.',!o.ok);if(o.ok)load();
 });
 load();
})();}
if(page==='clan'){(async function(){
 var q=new URLSearchParams(location.search).get('tag');if(!q)return;
 var s=(await sb.auth.getSession()).data.session;if(!s)return;
 var ct=tag(q);
 var me=await sb.from('profiles').select('tag_verified,banned').eq('id',s.user.id).single();
 if(me.error||!me.data.tag_verified||me.data.banned)return;
 var c=await sb.from('clans').select('tag').eq('tag',ct).maybeSingle();
 var mm=await sb.from('clan_chat_members').select('chat_role').eq('user_id',s.user.id).eq('clan_tag',ct).maybeSingle();
 var el=$('cact');
 if(mm.data){var a=document.createElement('a');a.href='chat.html?clan='+encodeURIComponent(ct.slice(1));a.textContent='Open this clan\'s chat';el.append(a);return;}
 if(!c.data){el.textContent='No chat exists for this clan yet. It is created when one of its members joins from the Chats page.';return;}
 var b=document.createElement('button');b.type='button';b.textContent='Request to join this clan\'s chat';
 b.addEventListener('click',async function(){
  b.disabled=true;
  var x=await sb.functions.invoke('super-api',{body:{action:'request_join',clan:ct}});
  var o=x.data||{};say(o.message||'Something went wrong. Try again.',!o.ok);b.disabled=false;
 });
 el.append(b);
})();}
if(page==='manage'){(async function(){
 var s=(await sb.auth.getSession()).data.session;if(!s){location.href='login.html';return;}
 var q=new URLSearchParams(location.search).get('clan');if(!q){say('Open this page from a chat.',true);return;}
 var ct=tag(q);
 var mr=await sb.from('clan_chat_members').select('chat_role').eq('user_id',s.user.id).eq('clan_tag',ct).maybeSingle();
 if(!mr.data||mr.data.chat_role==='member'){say('Only chat owners and moderators can open this page.',true);return;}
 var myRole=mr.data.chat_role;
 $('back').href='chat.html?clan='+encodeURIComponent(ct.slice(1));
 var cn=await sb.from('clans').select('name').eq('tag',ct).maybeSingle();
 $('mtitle').textContent='Manage '+(cn.data?cn.data.name:ct)+' chat';
 $('panel').hidden=false;
 async function call(b,done){var x=await sb.functions.invoke('super-api',{body:b});var o=x.data||{};say(o.message||'Something went wrong. Try again.',!o.ok);if(o.ok)done();}
 function mk(t,fn){var b=document.createElement('button');b.type='button';b.className='alt';b.textContent=t;b.addEventListener('click',fn);return b;}
 async function loadReq(){
  var r=await sb.from('join_requests').select('id,user_name').eq('clan_tag',ct).eq('status','pending').order('created_at',{ascending:true});
  var el=$('rq');el.textContent='';
  if(r.error||!r.data.length){el.textContent='No pending requests.';return;}
  r.data.forEach(function(p){var li=document.createElement('li'),sp=document.createElement('span'),d=document.createElement('div');
   sp.textContent=p.user_name;d.className='actions';
   d.append(mk('Approve',function(){call({action:'decide_request',id:p.id,approve:true},loadAll);}),mk('Reject',function(){call({action:'decide_request',id:p.id,approve:false},loadAll);}));
   li.append(sp,d);el.append(li);});
 }
 async function loadMem(){
  var r=await sb.from('clan_chat_members').select('user_id,member_name,chat_role').eq('clan_tag',ct).order('joined_at',{ascending:true});
  var el=$('mb');el.textContent='';
  (r.data||[]).forEach(function(m){var li=document.createElement('li'),sp=document.createElement('span'),d=document.createElement('div');
   sp.textContent=m.member_name+' ('+m.chat_role+')';d.className='actions';
   if(m.user_id!==s.user.id&&m.chat_role!=='owner'){
    if(myRole==='owner')d.append(mk(m.chat_role==='moderator'?'Remove moderator':'Make moderator',function(){call({action:'set_chat_role',clan:ct,user_id:m.user_id,role:m.chat_role==='moderator'?'member':'moderator'},loadMem);}));
    if(myRole==='owner'||m.chat_role==='member')d.append(mk('Remove',function(){if(confirm('Remove '+m.member_name+' from this chat?'))call({action:'remove_member',clan:ct,user_id:m.user_id},loadMem);}));
   }
   li.append(sp,d);el.append(li);});
 }
 async function loadInv(){
  var r=await sb.from('invites').select('id,code,target_tag,max_uses,uses,expires_at').eq('clan_tag',ct).eq('revoked',false).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false});
  var el=$('il');el.textContent='';
  if(r.error||!r.data.length){el.textContent='No active invites.';return;}
  r.data.forEach(function(i){var li=document.createElement('li'),sp=document.createElement('span'),d=document.createElement('div');
   sp.textContent=(i.target_tag?'For '+i.target_tag:'Link, used '+i.uses+' of '+i.max_uses)+' - expires '+new Date(i.expires_at).toLocaleString('en-IN');
   d.className='actions';
   if(!i.target_tag)d.append(mk('Copy link',function(){var u=location.origin+'/chats.html?invite='+i.code;if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){say('Link copied.');});else say(u);}));
   else d.append(mk('Copy code',function(){if(navigator.clipboard)navigator.clipboard.writeText(i.code).then(function(){say('Code copied.');});else say(i.code);}));
   d.append(mk('Revoke',function(){call({action:'revoke_invite',id:i.id},loadInv);}));
   li.append(sp,d);el.append(li);});
 }
 function loadAll(){loadReq();loadMem();loadInv();}
 $('iform').addEventListener('submit',async function(){
  var t=$('itag').value.trim(),b={action:'create_invite',clan:ct,hours:parseInt($('ihours').value,10),uses:parseInt($('iuses').value,10)||10};
  if(t){t=tag(t);if(!TAG.test(t))return say('Enter a valid player tag, like #2PYLQ80.',true);b.target_tag=t;}
  var x=await sb.functions.invoke('super-api',{body:b});var o=x.data||{};
  if(!o.ok)return say(o.message||'Something went wrong. Try again.',true);
  var link=location.origin+'/chats.html?invite='+o.code;
  if(o.forPlayer)say('Invite created for '+t+'. They will see it on their Chats page.');
  else if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){say('Invite created. Link copied.');},function(){say('Invite created: '+link);});
  else say('Invite created: '+link);
  $('itag').value='';loadInv();
 });
 loadAll();
})();}
if(page==='reset'){
 sb.auth.onAuthStateChange(function(ev){if(ev==='PASSWORD_RECOVERY'){$('ask').hidden=true;$('setp').hidden=false;}});
 $('ask').addEventListener('submit',async function(){
  var cp=capt();if(!cp.ok)return;
  busy($('ask'),true);
  await sb.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:location.origin+'/reset.html',captchaToken:cp.opt.captchaToken});
  busy($('ask'),false);recap();say('If that email has an account, we sent a reset link to it.');
 });
 $('setp').addEventListener('submit',async function(){
  if($('newpass').value.length<8)return say('Use a password with at least 8 characters.',true);
  busy($('setp'),true);
  var r=await sb.auth.updateUser({password:$('newpass').value});
  busy($('setp'),false);
  if(r.error)return say('We could not change your password. Ask for a new reset link.',true);
  say('Password changed. You can log in now.');
 });
}
})();

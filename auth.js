(function(){
var C=window.CU_CONFIG||{},page=document.body.dataset.page,box=document.getElementById('msg');
function $(id){return document.getElementById(id);}
function say(t,bad){box.textContent=t;box.className=bad?'err':'ok';}
document.querySelectorAll('form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();});});
if(!window.supabase||String(C.SUPABASE_URL).indexOf('PASTE')===0||String(C.SUPABASE_PUBLISHABLE_KEY).indexOf('PASTE')===0){say('Accounts are not set up yet. Add the project URL and publishable key in config.js.',true);return;}
var sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);
var TAG=/^#[0289PYLQGRJCUV]{3,12}$/;
function tag(v){return v.trim().toUpperCase().replace(/^#?/,'#').replace(/O/g,'0');}
function busy(f,b){f.querySelector('button').disabled=b;}
if(page==='register'){var f=$('form');f.addEventListener('submit',async function(){
 var pt=tag($('player_tag').value),ct=$('clan_tag').value.trim()?tag($('clan_tag').value):'';
 if(!TAG.test(pt))return say('Enter a valid player tag, like #2PYLQ80.',true);
 if(ct&&!TAG.test(ct))return say('Enter a valid clan tag, like #2PYLQ80, or leave it empty.',true);
 if($('password').value.length<8)return say('Use a password with at least 8 characters.',true);
 busy(f,true);
 var r=await sb.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:location.origin+'/login.html',data:{player_name:$('player_name').value.trim(),player_tag:pt,clan_name:$('clan_name').value.trim(),clan_tag:ct}}});
 busy(f,false);
 if(r.error)return say('We could not create the account. Check your details. This player tag may already be registered.',true);
 f.reset();say('Almost done. Open the email we sent you, confirm your address, then log in.');
});}
if(page==='login'){var g=$('form');g.addEventListener('submit',async function(){
 busy(g,true);
 var r=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
 busy(g,false);
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
 $('v_status').textContent=d.tag_verified?'Verified':'Not verified yet';$('v_email').textContent=s.user.email;
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
if(page==='reset'){
 sb.auth.onAuthStateChange(function(ev){if(ev==='PASSWORD_RECOVERY'){$('ask').hidden=true;$('setp').hidden=false;}});
 $('ask').addEventListener('submit',async function(){
  busy($('ask'),true);
  await sb.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:location.origin+'/reset.html'});
  busy($('ask'),false);say('If that email has an account, we sent a reset link to it.');
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

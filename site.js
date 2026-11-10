(function(){
var page=location.pathname.split('/').pop()||'index.html';
function link(h,t){return '<a href="'+h+'"'+(page===h?' aria-current="page"':'')+'>'+t+'</a>';}
var SIGNUP_OPEN=true; // change to true when you want to show "Create account" in the menu
var signed=false;
try{for(var i=0;i<localStorage.length;i++){if(/^sb-.*-auth-token$/.test(localStorage.key(i))){signed=true;}}}catch(e){}
var acct=signed?link('account.html','Account'):link('login.html','Log in')+(SIGNUP_OPEN?link('register.html','Create account'):'');
document.body.insertAdjacentHTML('afterbegin',
'<header><div class="wrap"><a class="brand" href="index.html">Clashers Union<small>by Rowdy</small></a><nav aria-label="Main">'+link('index.html','Home')+link('about.html','About')+link('contact.html','Contact')+acct+'</nav></div></header>');
document.body.insertAdjacentHTML('beforeend',
'<footer><div class="wrap"><p><strong>Clashers Union by Rowdy</strong> &copy; '+new Date().getFullYear()+'</p><p><a href="privacy.html">Privacy policy</a> &middot; <a href="terms.html">Terms of use</a> &middot; <a href="contact.html">Contact</a></p><p>Clashers Union is fan-made and is not affiliated with, endorsed, sponsored, or approved by Supercell.</p></div></footer>');
})();
(function(){var s=document.createElement('script');s.defer=true;s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token":"<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "0791690ce36143a5bf882f13d9ad93d2"}'></script><!-- End Cloudflare Web Analytics -->"}');document.head.appendChild(s);})();

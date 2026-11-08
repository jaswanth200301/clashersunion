(function(){
var page=location.pathname.split('/').pop()||'index.html';
function link(h,t){return '<a href="'+h+'"'+(page===h?' aria-current="page"':'')+'>'+t+'</a>';}
document.body.insertAdjacentHTML('afterbegin',
'<header><div class="wrap"><a class="brand" href="index.html">Clashers Union<small>by Rowdy</small></a><nav aria-label="Main">'+link('index.html','Home')+link('about.html','About')+'</nav></div></header>');
document.body.insertAdjacentHTML('beforeend',
'<footer><div class="wrap"><p><strong>Clashers Union by Rowdy</strong> &copy; '+new Date().getFullYear()+'</p><p>Clashers Union is fan-made and is not affiliated with, endorsed, sponsored, or approved by Supercell.</p></div></footer>');
})();

'use strict';
/* 足りなくて押せないボタン：見た目は押せないボタンと同じ灰色のまま、押したら、何が足りないかを知らせる（何も起きないボタンを作らない）。lackOn(ボタン,知らせ) 知らせが '' なら、ふつうのボタン */
function lackOn(b,why){b.disabled=false;b.classList.toggle('lack',!!why);if(why)b.dataset.lack=why;else delete b.dataset.lack;b.setAttribute('aria-disabled',why?'true':'false');return b}
const lackPt=c=>S.pt<c?'パワーが足りません（あと'+Math.ceil(c-S.pt)+'）':'',lackMat=(k,n)=>(S.mat[k]||0)<n?MATN[k]+'が足りません（あと'+Math.ceil(n-(S.mat[k]||0))+'）':'';
addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button.lack');if(!b)return;e.preventDefault();e.stopImmediatePropagation();sfx('warn');toast(b.dataset.lack,'warn')},true);
/* ドットのアイコン（32×32のマス目、線は2ドット）。pxi(名前) で svg.pxi を作る */
const PXI={"moonf":"M12 3h8v1h-8zM10 4h12v1h-12zM8 5h16v1h-16zM7 6h18v1h-18zM6 7h20v1h-20zM5 8h6v1h-6zM12 8h15v1h-15zM5 9h4v1h-4zM14 9h13v1h-13zM4 10h5v1h-5zM11 10h1v1h-1zM14 10h14v1h-14zM4 11h4v1h-4zM10 11h3v1h-3zM15 11h13v1h-13zM3 12h6v1h-6zM11 12h1v1h-1zM14 12h15v1h-15zM3 13h6v1h-6zM14 13h15v1h-15zM3 14h8v1h-8zM12 14h17v1h-17zM3 15h16v1h-16zM22 15h7v1h-7zM3 16h15v1h-15zM20 16h1v1h-1zM23 16h6v1h-6zM3 17h14v1h-14zM19 17h3v1h-3zM24 17h5v1h-5zM3 18h14v1h-14zM18 18h5v1h-5zM24 18h5v1h-5zM3 19h9v1h-9zM13 19h4v1h-4zM19 19h3v1h-3zM24 19h5v1h-5zM4 20h7v1h-7zM14 20h4v1h-4zM20 20h1v1h-1zM23 20h5v1h-5zM4 21h6v1h-6zM12 21h1v1h-1zM15 21h4v1h-4zM22 21h6v1h-6zM5 22h6v1h-6zM14 22h13v1h-13zM5 23h7v1h-7zM13 23h14v1h-14zM6 24h20v1h-20zM7 25h18v1h-18zM8 26h16v1h-16zM10 27h12v1h-12zM12 28h8v1h-8z","moonn":"M12 3h8v1h-8zM10 4h12v1h-12zM8 5h5v1h-5zM19 5h5v1h-5zM7 6h3v1h-3zM22 6h3v1h-3zM6 7h3v1h-3zM23 7h3v1h-3zM5 8h3v1h-3zM24 8h3v1h-3zM5 9h2v1h-2zM25 9h2v1h-2zM4 10h2v1h-2zM26 10h2v1h-2zM4 11h2v1h-2zM26 11h2v1h-2zM3 12h3v1h-3zM26 12h3v1h-3zM3 13h2v1h-2zM27 13h2v1h-2zM3 14h2v1h-2zM27 14h2v1h-2zM3 15h2v1h-2zM27 15h2v1h-2zM3 16h2v1h-2zM27 16h2v1h-2zM3 17h2v1h-2zM27 17h2v1h-2zM3 18h2v1h-2zM27 18h2v1h-2zM3 19h3v1h-3zM26 19h3v1h-3zM4 20h2v1h-2zM26 20h2v1h-2zM4 21h2v1h-2zM26 21h2v1h-2zM5 22h2v1h-2zM25 22h2v1h-2zM5 23h3v1h-3zM24 23h3v1h-3zM6 24h3v1h-3zM23 24h3v1h-3zM7 25h3v1h-3zM22 25h3v1h-3zM8 26h5v1h-5zM19 26h5v1h-5zM10 27h12v1h-12zM12 28h8v1h-8z","bulb":"M12 3h8v1h-8zM10 4h12v1h-12zM9 5h3v1h-3zM20 5h3v1h-3zM8 6h3v1h-3zM21 6h3v1h-3zM7 7h3v1h-3zM22 7h3v1h-3zM7 8h2v1h-2zM23 8h2v1h-2zM6 9h3v1h-3zM23 9h3v1h-3zM6 10h2v1h-2zM24 10h2v1h-2zM6 11h2v1h-2zM24 11h2v1h-2zM6 12h2v1h-2zM12 12h2v1h-2zM18 12h2v1h-2zM24 12h2v1h-2zM6 13h2v1h-2zM12 13h3v1h-3zM17 13h3v1h-3zM24 13h2v1h-2zM6 14h3v1h-3zM13 14h6v1h-6zM23 14h3v1h-3zM7 15h2v1h-2zM14 15h4v1h-4zM23 15h2v1h-2zM7 16h3v1h-3zM15 16h2v1h-2zM22 16h3v1h-3zM8 17h3v1h-3zM15 17h2v1h-2zM21 17h3v1h-3zM9 18h3v1h-3zM15 18h2v1h-2zM20 18h3v1h-3zM10 19h2v1h-2zM15 19h2v1h-2zM20 19h2v1h-2zM10 20h2v1h-2zM15 20h2v1h-2zM20 20h2v1h-2zM10 21h12v1h-12zM10 22h12v1h-12zM10 24h12v1h-12zM10 25h12v1h-12zM12 27h8v1h-8zM12 28h8v1h-8z","sun":"M15 2h2v1h-2zM15 3h2v1h-2zM15 4h2v1h-2zM5 5h2v1h-2zM15 5h2v1h-2zM25 5h2v1h-2zM5 6h3v1h-3zM15 6h2v1h-2zM24 6h3v1h-3zM6 7h3v1h-3zM23 7h3v1h-3zM7 8h3v1h-3zM22 8h3v1h-3zM8 9h2v1h-2zM22 9h2v1h-2zM14 10h4v1h-4zM12 11h8v1h-8zM11 12h10v1h-10zM11 13h10v1h-10zM10 14h12v1h-12zM2 15h5v1h-5zM10 15h12v1h-12zM25 15h5v1h-5zM2 16h5v1h-5zM10 16h12v1h-12zM25 16h5v1h-5zM10 17h12v1h-12zM11 18h10v1h-10zM11 19h10v1h-10zM12 20h8v1h-8zM14 21h4v1h-4zM8 22h2v1h-2zM22 22h2v1h-2zM7 23h3v1h-3zM22 23h3v1h-3zM6 24h3v1h-3zM23 24h3v1h-3zM5 25h3v1h-3zM15 25h2v1h-2zM24 25h3v1h-3zM5 26h2v1h-2zM15 26h2v1h-2zM25 26h2v1h-2zM15 27h2v1h-2zM15 28h2v1h-2zM15 29h2v1h-2z","rain":"M16 3h6v1h-6zM15 4h8v1h-8zM14 5h3v1h-3zM21 5h3v1h-3zM13 6h3v1h-3zM22 6h3v1h-3zM12 7h3v1h-3zM23 7h3v1h-3zM8 8h6v1h-6zM24 8h2v1h-2zM7 9h6v1h-6zM24 9h2v1h-2zM6 10h3v1h-3zM24 10h2v1h-2zM6 11h2v1h-2zM24 11h3v1h-3zM6 12h2v1h-2zM25 12h3v1h-3zM6 13h2v1h-2zM26 13h2v1h-2zM6 14h2v1h-2zM26 14h2v1h-2zM6 15h2v1h-2zM26 15h2v1h-2zM6 16h2v1h-2zM26 16h2v1h-2zM6 17h22v1h-22zM6 18h22v1h-22zM9 22h2v1h-2zM23 22h2v1h-2zM8 23h3v1h-3zM22 23h3v1h-3zM8 24h3v1h-3zM16 24h2v1h-2zM22 24h3v1h-3zM7 25h3v1h-3zM15 25h3v1h-3zM21 25h3v1h-3zM7 26h3v1h-3zM15 26h3v1h-3zM21 26h3v1h-3zM7 27h2v1h-2zM14 27h3v1h-3zM21 27h2v1h-2zM14 28h3v1h-3zM14 29h2v1h-2z","rainbow":"M12 10h8v1h-8zM10 11h12v1h-12zM8 12h5v1h-5zM19 12h5v1h-5zM7 13h3v1h-3zM22 13h3v1h-3zM6 14h3v1h-3zM13 14h6v1h-6zM23 14h3v1h-3zM5 15h3v1h-3zM11 15h10v1h-10zM24 15h3v1h-3zM4 16h3v1h-3zM9 16h4v1h-4zM19 16h4v1h-4zM25 16h3v1h-3zM4 17h2v1h-2zM8 17h3v1h-3zM21 17h3v1h-3zM26 17h2v1h-2zM3 18h2v1h-2zM8 18h2v1h-2zM14 18h4v1h-4zM22 18h2v1h-2zM27 18h2v1h-2zM3 19h2v1h-2zM7 19h2v1h-2zM12 19h8v1h-8zM23 19h2v1h-2zM27 19h2v1h-2zM2 20h3v1h-3zM7 20h2v1h-2zM11 20h3v1h-3zM18 20h3v1h-3zM23 20h2v1h-2zM27 20h3v1h-3zM2 21h2v1h-2zM6 21h2v1h-2zM11 21h2v1h-2zM19 21h2v1h-2zM24 21h2v1h-2zM28 21h2v1h-2zM2 22h2v1h-2zM6 22h2v1h-2zM10 22h2v1h-2zM20 22h2v1h-2zM24 22h2v1h-2zM28 22h2v1h-2zM2 23h2v1h-2zM6 23h2v1h-2zM10 23h2v1h-2zM20 23h2v1h-2zM24 23h2v1h-2zM28 23h2v1h-2z","leaf":"M18 7h7v1h-7zM15 8h10v1h-10zM14 9h5v1h-5zM21 9h4v1h-4zM12 10h4v1h-4zM20 10h5v1h-5zM11 11h4v1h-4zM19 11h3v1h-3zM23 11h2v1h-2zM10 12h3v1h-3zM18 12h3v1h-3zM23 12h2v1h-2zM10 13h2v1h-2zM17 13h3v1h-3zM22 13h3v1h-3zM9 14h3v1h-3zM16 14h3v1h-3zM22 14h2v1h-2zM8 15h3v1h-3zM15 15h3v1h-3zM22 15h2v1h-2zM8 16h2v1h-2zM14 16h3v1h-3zM21 16h3v1h-3zM8 17h2v1h-2zM13 17h3v1h-3zM20 17h3v1h-3zM7 18h3v1h-3zM12 18h3v1h-3zM20 18h2v1h-2zM7 19h2v1h-2zM11 19h3v1h-3zM19 19h3v1h-3zM7 20h2v1h-2zM10 20h3v1h-3zM17 20h4v1h-4zM7 21h5v1h-5zM16 21h4v1h-4zM7 22h4v1h-4zM13 22h5v1h-5zM7 23h10v1h-10zM6 24h8v1h-8zM5 25h3v1h-3zM4 26h3v1h-3zM3 27h3v1h-3zM3 28h2v1h-2z","book":"M5 5h22v1h-22zM5 6h22v1h-22zM5 7h2v1h-2zM15 7h2v1h-2zM25 7h2v1h-2zM5 8h2v1h-2zM15 8h2v1h-2zM25 8h2v1h-2zM5 9h2v1h-2zM15 9h2v1h-2zM25 9h2v1h-2zM5 10h2v1h-2zM9 10h4v1h-4zM15 10h2v1h-2zM19 10h4v1h-4zM25 10h2v1h-2zM5 11h2v1h-2zM9 11h4v1h-4zM15 11h2v1h-2zM19 11h4v1h-4zM25 11h2v1h-2zM5 12h2v1h-2zM15 12h2v1h-2zM25 12h2v1h-2zM5 13h2v1h-2zM15 13h2v1h-2zM25 13h2v1h-2zM5 14h2v1h-2zM15 14h2v1h-2zM25 14h2v1h-2zM5 15h2v1h-2zM9 15h4v1h-4zM15 15h2v1h-2zM19 15h4v1h-4zM25 15h2v1h-2zM5 16h2v1h-2zM9 16h4v1h-4zM15 16h2v1h-2zM19 16h4v1h-4zM25 16h2v1h-2zM5 17h2v1h-2zM15 17h2v1h-2zM25 17h2v1h-2zM5 18h2v1h-2zM15 18h2v1h-2zM25 18h2v1h-2zM5 19h2v1h-2zM15 19h2v1h-2zM25 19h2v1h-2zM5 20h2v1h-2zM9 20h4v1h-4zM15 20h2v1h-2zM19 20h4v1h-4zM25 20h2v1h-2zM5 21h2v1h-2zM9 21h4v1h-4zM15 21h2v1h-2zM19 21h4v1h-4zM25 21h2v1h-2zM5 22h2v1h-2zM15 22h2v1h-2zM25 22h2v1h-2zM5 23h2v1h-2zM15 23h2v1h-2zM25 23h2v1h-2zM5 24h2v1h-2zM15 24h2v1h-2zM25 24h2v1h-2zM5 25h22v1h-22zM5 26h22v1h-22z","target":"M12 2h8v1h-8zM10 3h12v1h-12zM8 4h5v1h-5zM19 4h5v1h-5zM7 5h3v1h-3zM22 5h3v1h-3zM6 6h3v1h-3zM23 6h3v1h-3zM5 7h3v1h-3zM13 7h6v1h-6zM24 7h3v1h-3zM4 8h3v1h-3zM11 8h10v1h-10zM25 8h3v1h-3zM4 9h2v1h-2zM10 9h3v1h-3zM19 9h3v1h-3zM26 9h2v1h-2zM3 10h2v1h-2zM9 10h3v1h-3zM20 10h3v1h-3zM27 10h2v1h-2zM3 11h2v1h-2zM8 11h3v1h-3zM21 11h3v1h-3zM27 11h2v1h-2zM2 12h3v1h-3zM8 12h2v1h-2zM22 12h2v1h-2zM27 12h3v1h-3zM2 13h2v1h-2zM7 13h2v1h-2zM14 13h4v1h-4zM23 13h2v1h-2zM28 13h2v1h-2zM2 14h2v1h-2zM7 14h2v1h-2zM13 14h6v1h-6zM23 14h2v1h-2zM28 14h2v1h-2zM2 15h2v1h-2zM7 15h2v1h-2zM13 15h6v1h-6zM23 15h2v1h-2zM28 15h2v1h-2zM2 16h2v1h-2zM7 16h2v1h-2zM13 16h6v1h-6zM23 16h2v1h-2zM28 16h2v1h-2zM2 17h2v1h-2zM7 17h2v1h-2zM13 17h6v1h-6zM23 17h2v1h-2zM28 17h2v1h-2zM2 18h2v1h-2zM7 18h2v1h-2zM14 18h4v1h-4zM23 18h2v1h-2zM28 18h2v1h-2zM2 19h3v1h-3zM8 19h2v1h-2zM22 19h2v1h-2zM27 19h3v1h-3zM3 20h2v1h-2zM8 20h3v1h-3zM21 20h3v1h-3zM27 20h2v1h-2zM3 21h2v1h-2zM9 21h3v1h-3zM20 21h3v1h-3zM27 21h2v1h-2zM4 22h2v1h-2zM10 22h3v1h-3zM19 22h3v1h-3zM26 22h2v1h-2zM4 23h3v1h-3zM11 23h10v1h-10zM25 23h3v1h-3zM5 24h3v1h-3zM13 24h6v1h-6zM24 24h3v1h-3zM6 25h3v1h-3zM23 25h3v1h-3zM7 26h3v1h-3zM22 26h3v1h-3zM8 27h5v1h-5zM19 27h5v1h-5zM10 28h12v1h-12zM12 29h8v1h-8z","memo":"M6 3h20v1h-20zM6 4h20v1h-20zM6 5h2v1h-2zM9 5h2v1h-2zM24 5h2v1h-2zM6 6h2v1h-2zM9 6h2v1h-2zM24 6h2v1h-2zM6 7h2v1h-2zM9 7h2v1h-2zM24 7h2v1h-2zM6 8h2v1h-2zM9 8h2v1h-2zM24 8h2v1h-2zM6 9h2v1h-2zM9 9h2v1h-2zM24 9h2v1h-2zM6 10h2v1h-2zM9 10h2v1h-2zM13 10h3v1h-3zM19 10h3v1h-3zM24 10h2v1h-2zM6 11h2v1h-2zM9 11h2v1h-2zM12 11h5v1h-5zM18 11h5v1h-5zM24 11h2v1h-2zM6 12h2v1h-2zM9 12h2v1h-2zM12 12h5v1h-5zM18 12h5v1h-5zM24 12h2v1h-2zM6 13h20v1h-20zM6 14h2v1h-2zM9 14h17v1h-17zM6 15h2v1h-2zM9 15h17v1h-17zM6 16h2v1h-2zM9 16h2v1h-2zM12 16h14v1h-14zM6 17h2v1h-2zM9 17h2v1h-2zM12 17h10v1h-10zM24 17h2v1h-2zM6 18h2v1h-2zM9 18h2v1h-2zM14 18h8v1h-8zM24 18h2v1h-2zM6 19h2v1h-2zM9 19h2v1h-2zM14 19h6v1h-6zM24 19h2v1h-2zM6 20h2v1h-2zM9 20h2v1h-2zM16 20h4v1h-4zM24 20h2v1h-2zM6 21h2v1h-2zM9 21h2v1h-2zM16 21h2v1h-2zM24 21h2v1h-2zM6 22h2v1h-2zM9 22h2v1h-2zM24 22h2v1h-2zM6 23h2v1h-2zM9 23h2v1h-2zM24 23h2v1h-2zM6 24h2v1h-2zM9 24h2v1h-2zM24 24h2v1h-2zM6 25h2v1h-2zM9 25h2v1h-2zM24 25h2v1h-2zM6 26h2v1h-2zM9 26h2v1h-2zM24 26h2v1h-2zM6 27h20v1h-20zM6 28h20v1h-20z","compass":"M12 2h8v1h-8zM10 3h12v1h-12zM8 4h5v1h-5zM19 4h5v1h-5zM7 5h3v1h-3zM22 5h3v1h-3zM6 6h3v1h-3zM23 6h3v1h-3zM5 7h3v1h-3zM24 7h3v1h-3zM4 8h3v1h-3zM15 8h2v1h-2zM25 8h3v1h-3zM4 9h2v1h-2zM15 9h2v1h-2zM26 9h2v1h-2zM3 10h2v1h-2zM15 10h2v1h-2zM27 10h2v1h-2zM3 11h2v1h-2zM14 11h4v1h-4zM27 11h2v1h-2zM2 12h3v1h-3zM14 12h4v1h-4zM27 12h3v1h-3zM2 13h2v1h-2zM14 13h4v1h-4zM28 13h2v1h-2zM2 14h2v1h-2zM13 14h6v1h-6zM28 14h2v1h-2zM2 15h2v1h-2zM13 15h6v1h-6zM28 15h2v1h-2zM2 16h2v1h-2zM13 16h1v1h-1zM18 16h1v1h-1zM28 16h2v1h-2zM2 17h2v1h-2zM13 17h1v1h-1zM18 17h1v1h-1zM28 17h2v1h-2zM2 18h2v1h-2zM28 18h2v1h-2zM2 19h3v1h-3zM14 19h1v1h-1zM17 19h1v1h-1zM27 19h3v1h-3zM3 20h2v1h-2zM14 20h1v1h-1zM17 20h1v1h-1zM27 20h2v1h-2zM3 21h2v1h-2zM27 21h2v1h-2zM4 22h2v1h-2zM15 22h2v1h-2zM26 22h2v1h-2zM4 23h3v1h-3zM15 23h2v1h-2zM25 23h3v1h-3zM5 24h3v1h-3zM24 24h3v1h-3zM6 25h3v1h-3zM23 25h3v1h-3zM7 26h3v1h-3zM22 26h3v1h-3zM8 27h5v1h-5zM19 27h5v1h-5zM10 28h12v1h-12zM12 29h8v1h-8z","zukan":"M10 3h6v1h-6zM8 4h10v1h-10zM6 5h4v1h-4zM16 5h4v1h-4zM5 6h3v1h-3zM18 6h3v1h-3zM5 7h2v1h-2zM19 7h2v1h-2zM4 8h2v1h-2zM20 8h2v1h-2zM4 9h2v1h-2zM9 9h3v1h-3zM20 9h2v1h-2zM3 10h2v1h-2zM9 10h3v1h-3zM21 10h2v1h-2zM3 11h2v1h-2zM21 11h2v1h-2zM3 12h2v1h-2zM21 12h2v1h-2zM3 13h2v1h-2zM21 13h2v1h-2zM3 14h2v1h-2zM21 14h2v1h-2zM3 15h2v1h-2zM21 15h2v1h-2zM4 16h2v1h-2zM20 16h2v1h-2zM4 17h2v1h-2zM20 17h2v1h-2zM5 18h2v1h-2zM18 18h3v1h-3zM5 19h3v1h-3zM18 19h4v1h-4zM6 20h4v1h-4zM16 20h7v1h-7zM8 21h10v1h-10zM19 21h5v1h-5zM10 22h6v1h-6zM20 22h5v1h-5zM21 23h5v1h-5zM22 24h5v1h-5zM23 25h5v1h-5zM24 26h5v1h-5zM25 27h4v1h-4zM26 28h3v1h-3z","gear":"M10 3h4v1h-4zM18 3h4v1h-4zM9 4h5v1h-5zM18 4h5v1h-5zM9 5h2v1h-2zM12 5h3v1h-3zM17 5h3v1h-3zM21 5h2v1h-2zM9 6h2v1h-2zM13 6h6v1h-6zM21 6h2v1h-2zM9 7h2v1h-2zM14 7h4v1h-4zM21 7h2v1h-2zM9 8h2v1h-2zM21 8h2v1h-2zM4 9h7v1h-7zM21 9h7v1h-7zM3 10h7v1h-7zM22 10h7v1h-7zM3 11h2v1h-2zM27 11h2v1h-2zM3 12h3v1h-3zM13 12h6v1h-6zM26 12h3v1h-3zM3 13h4v1h-4zM12 13h8v1h-8zM25 13h4v1h-4zM5 14h3v1h-3zM12 14h2v1h-2zM18 14h2v1h-2zM24 14h3v1h-3zM6 15h2v1h-2zM12 15h2v1h-2zM18 15h2v1h-2zM24 15h2v1h-2zM6 16h2v1h-2zM12 16h2v1h-2zM18 16h2v1h-2zM24 16h2v1h-2zM5 17h3v1h-3zM12 17h2v1h-2zM18 17h2v1h-2zM24 17h3v1h-3zM3 18h4v1h-4zM12 18h8v1h-8zM25 18h4v1h-4zM3 19h3v1h-3zM13 19h6v1h-6zM26 19h3v1h-3zM3 20h2v1h-2zM27 20h2v1h-2zM3 21h7v1h-7zM22 21h7v1h-7zM4 22h7v1h-7zM21 22h7v1h-7zM9 23h2v1h-2zM21 23h2v1h-2zM9 24h2v1h-2zM14 24h4v1h-4zM21 24h2v1h-2zM9 25h2v1h-2zM13 25h6v1h-6zM21 25h2v1h-2zM9 26h2v1h-2zM12 26h3v1h-3zM17 26h3v1h-3zM21 26h2v1h-2zM9 27h5v1h-5zM18 27h5v1h-5zM10 28h4v1h-4zM18 28h4v1h-4z","cup":"M9 3h2v1h-2zM15 3h2v1h-2zM9 4h2v1h-2zM15 4h2v1h-2zM9 5h2v1h-2zM15 5h2v1h-2zM9 6h3v1h-3zM15 6h3v1h-3zM10 7h2v1h-2zM16 7h2v1h-2zM10 8h2v1h-2zM16 8h2v1h-2zM10 9h2v1h-2zM16 9h2v1h-2zM5 13h18v1h-18zM5 14h18v1h-18zM5 15h2v1h-2zM21 15h6v1h-6zM5 16h2v1h-2zM21 16h6v1h-6zM5 17h2v1h-2zM21 17h2v1h-2zM25 17h2v1h-2zM5 18h2v1h-2zM21 18h2v1h-2zM25 18h2v1h-2zM5 19h2v1h-2zM21 19h6v1h-6zM5 20h2v1h-2zM21 20h6v1h-6zM5 21h2v1h-2zM21 21h2v1h-2zM5 22h2v1h-2zM21 22h2v1h-2zM5 23h2v1h-2zM21 23h2v1h-2zM5 24h2v1h-2zM21 24h2v1h-2zM7 25h14v1h-14zM7 26h14v1h-14zM3 28h22v1h-22zM3 29h22v1h-22z","power":"M15 4h2v1h-2zM15 5h2v1h-2zM15 6h2v1h-2zM14 7h4v1h-4zM14 8h4v1h-4zM13 9h6v1h-6zM13 10h6v1h-6zM12 11h8v1h-8zM11 12h10v1h-10zM9 13h14v1h-14zM7 14h18v1h-18zM4 15h24v1h-24zM4 16h24v1h-24zM7 17h18v1h-18zM9 18h14v1h-14zM11 19h10v1h-10zM12 20h8v1h-8zM13 21h6v1h-6zM13 22h6v1h-6zM14 23h4v1h-4zM14 24h4v1h-4zM15 25h2v1h-2zM15 26h2v1h-2zM15 27h2v1h-2z","next":"M8 10h16v1h-16zM9 11h14v1h-14zM10 12h12v1h-12zM11 13h10v1h-10zM12 14h8v1h-8zM13 15h6v1h-6zM14 16h4v1h-4zM15 17h2v1h-2z","box":"M9 4h2v1h-2zM21 4h2v1h-2zM8 5h16v1h-16zM7 6h18v1h-18zM7 7h3v1h-3zM22 7h3v1h-3zM6 8h3v1h-3zM23 8h3v1h-3zM5 9h3v1h-3zM24 9h3v1h-3zM5 10h3v1h-3zM24 10h3v1h-3zM4 11h3v1h-3zM25 11h3v1h-3zM4 12h24v1h-24zM4 13h24v1h-24zM4 14h2v1h-2zM26 14h2v1h-2zM4 15h2v1h-2zM26 15h2v1h-2zM4 16h2v1h-2zM26 16h2v1h-2zM4 17h2v1h-2zM26 17h2v1h-2zM4 18h2v1h-2zM10 18h12v1h-12zM26 18h2v1h-2zM4 19h2v1h-2zM10 19h12v1h-12zM26 19h2v1h-2zM4 20h2v1h-2zM26 20h2v1h-2zM4 21h2v1h-2zM26 21h2v1h-2zM4 22h2v1h-2zM26 22h2v1h-2zM4 23h2v1h-2zM26 23h2v1h-2zM4 24h2v1h-2zM26 24h2v1h-2zM4 25h2v1h-2zM26 25h2v1h-2zM4 26h24v1h-24zM4 27h24v1h-24z","paper":"M14 2h4v1h-4zM14 3h4v1h-4zM6 4h20v1h-20zM6 5h20v1h-20zM6 6h2v1h-2zM24 6h2v1h-2zM6 7h2v1h-2zM24 7h2v1h-2zM6 8h2v1h-2zM24 8h2v1h-2zM6 9h2v1h-2zM24 9h2v1h-2zM6 10h2v1h-2zM10 10h12v1h-12zM24 10h2v1h-2zM6 11h2v1h-2zM10 11h12v1h-12zM24 11h2v1h-2zM6 12h2v1h-2zM24 12h2v1h-2zM6 13h2v1h-2zM24 13h2v1h-2zM6 14h2v1h-2zM24 14h2v1h-2zM6 15h2v1h-2zM10 15h12v1h-12zM24 15h2v1h-2zM6 16h2v1h-2zM10 16h12v1h-12zM24 16h2v1h-2zM6 17h2v1h-2zM24 17h2v1h-2zM6 18h2v1h-2zM24 18h2v1h-2zM6 19h2v1h-2zM24 19h2v1h-2zM6 20h2v1h-2zM10 20h8v1h-8zM24 20h2v1h-2zM6 21h2v1h-2zM10 21h8v1h-8zM24 21h2v1h-2zM6 22h2v1h-2zM24 22h2v1h-2zM6 23h2v1h-2zM24 23h2v1h-2zM6 24h2v1h-2zM24 24h2v1h-2zM6 25h2v1h-2zM24 25h2v1h-2zM6 26h20v1h-20zM6 27h20v1h-20z","grass":"M4 9h2v1h-2zM10 9h2v1h-2zM16 9h2v1h-2zM22 9h2v1h-2zM4 10h2v1h-2zM8 10h4v1h-4zM14 10h4v1h-4zM20 10h4v1h-4zM26 10h2v1h-2zM4 11h2v1h-2zM8 11h4v1h-4zM14 11h4v1h-4zM20 11h4v1h-4zM26 11h2v1h-2zM4 12h2v1h-2zM7 12h5v1h-5zM13 12h5v1h-5zM19 12h5v1h-5zM25 12h3v1h-3zM4 13h5v1h-5zM10 13h5v1h-5zM16 13h5v1h-5zM22 13h5v1h-5zM5 14h4v1h-4zM11 14h4v1h-4zM17 14h4v1h-4zM23 14h4v1h-4zM5 15h4v1h-4zM11 15h4v1h-4zM17 15h4v1h-4zM23 15h4v1h-4zM5 16h3v1h-3zM11 16h3v1h-3zM17 16h3v1h-3zM23 16h3v1h-3zM5 17h3v1h-3zM11 17h3v1h-3zM17 17h3v1h-3zM23 17h3v1h-3zM4 18h24v1h-24zM4 19h24v1h-24zM4 20h24v1h-24zM4 21h24v1h-24zM4 22h24v1h-24zM4 23h24v1h-24zM4 24h24v1h-24zM4 25h24v1h-24zM4 26h24v1h-24zM4 27h24v1h-24z","house":"M15 3h2v1h-2zM14 4h4v1h-4zM12 5h8v1h-8zM11 6h4v1h-4zM17 6h4v1h-4zM10 7h4v1h-4zM18 7h4v1h-4zM9 8h4v1h-4zM19 8h4v1h-4zM8 9h3v1h-3zM21 9h3v1h-3zM6 10h4v1h-4zM22 10h4v1h-4zM5 11h4v1h-4zM23 11h4v1h-4zM4 12h4v1h-4zM24 12h4v1h-4zM3 13h4v1h-4zM25 13h4v1h-4zM2 14h3v1h-3zM7 14h2v1h-2zM23 14h2v1h-2zM27 14h3v1h-3zM2 15h2v1h-2zM7 15h2v1h-2zM23 15h2v1h-2zM28 15h2v1h-2zM7 16h2v1h-2zM23 16h2v1h-2zM7 17h2v1h-2zM23 17h2v1h-2zM7 18h2v1h-2zM23 18h2v1h-2zM7 19h2v1h-2zM14 19h4v1h-4zM23 19h2v1h-2zM7 20h2v1h-2zM14 20h4v1h-4zM23 20h2v1h-2zM7 21h2v1h-2zM14 21h4v1h-4zM23 21h2v1h-2zM7 22h2v1h-2zM14 22h4v1h-4zM23 22h2v1h-2zM7 23h2v1h-2zM14 23h4v1h-4zM23 23h2v1h-2zM7 24h2v1h-2zM14 24h4v1h-4zM23 24h2v1h-2zM7 25h2v1h-2zM14 25h4v1h-4zM23 25h2v1h-2zM7 26h18v1h-18zM7 27h18v1h-18z","spirit":"M14 2h4v1h-4zM14 3h4v1h-4zM14 4h4v1h-4zM14 5h4v1h-4zM13 6h6v1h-6zM12 7h8v1h-8zM11 8h10v1h-10zM10 9h12v1h-12zM9 10h14v1h-14zM9 11h14v1h-14zM9 12h14v1h-14zM9 13h3v1h-3zM14 13h4v1h-4zM20 13h3v1h-3zM9 14h3v1h-3zM14 14h4v1h-4zM20 14h3v1h-3zM9 15h3v1h-3zM14 15h4v1h-4zM20 15h3v1h-3zM9 16h14v1h-14zM9 17h14v1h-14zM9 18h14v1h-14zM9 19h14v1h-14zM9 20h14v1h-14zM9 21h14v1h-14zM9 22h14v1h-14zM9 23h4v1h-4zM14 23h4v1h-4zM19 23h4v1h-4zM9 24h4v1h-4zM14 24h4v1h-4zM19 24h4v1h-4zM9 25h4v1h-4zM14 25h4v1h-4zM19 25h4v1h-4z","check":"M24 8h3v1h-3zM23 9h4v1h-4zM22 10h5v1h-5zM21 11h5v1h-5zM20 12h5v1h-5zM19 13h5v1h-5zM4 14h3v1h-3zM18 14h5v1h-5zM4 15h4v1h-4zM17 15h6v1h-6zM4 16h5v1h-5zM16 16h6v1h-6zM5 17h5v1h-5zM16 17h5v1h-5zM6 18h5v1h-5zM15 18h5v1h-5zM7 19h5v1h-5zM14 19h5v1h-5zM8 20h10v1h-10zM9 21h8v1h-8zM10 22h6v1h-6zM11 23h4v1h-4zM12 24h3v1h-3z","log":"M3 10h26v1h-26zM2 11h28v1h-28zM1 12h3v1h-3zM8 12h3v1h-3zM28 12h3v1h-3zM0 13h3v1h-3zM10 13h2v1h-2zM29 13h3v1h-3zM0 14h2v1h-2zM4 14h4v1h-4zM10 14h3v1h-3zM14 14h8v1h-8zM30 14h2v1h-2zM0 15h2v1h-2zM3 15h6v1h-6zM11 15h2v1h-2zM14 15h8v1h-8zM30 15h2v1h-2zM0 16h2v1h-2zM3 16h2v1h-2zM7 16h2v1h-2zM11 16h2v1h-2zM30 16h2v1h-2zM0 17h2v1h-2zM3 17h2v1h-2zM7 17h2v1h-2zM11 17h2v1h-2zM30 17h2v1h-2zM0 18h2v1h-2zM3 18h6v1h-6zM11 18h2v1h-2zM30 18h2v1h-2zM0 19h2v1h-2zM4 19h4v1h-4zM10 19h3v1h-3zM16 19h8v1h-8zM30 19h2v1h-2zM0 20h3v1h-3zM10 20h2v1h-2zM16 20h8v1h-8zM29 20h3v1h-3zM1 21h3v1h-3zM8 21h3v1h-3zM28 21h3v1h-3zM2 22h28v1h-28zM3 23h26v1h-26z","rock":"M17 7h6v1h-6zM15 8h10v1h-10zM14 9h4v1h-4zM22 9h4v1h-4zM13 10h3v1h-3zM24 10h3v1h-3zM9 11h6v1h-6zM25 11h3v1h-3zM7 12h9v1h-9zM26 12h2v1h-2zM6 13h4v1h-4zM13 13h3v1h-3zM26 13h3v1h-3zM5 14h3v1h-3zM14 14h3v1h-3zM27 14h2v1h-2zM5 15h2v1h-2zM14 15h3v1h-3zM27 15h2v1h-2zM4 16h3v1h-3zM15 16h3v1h-3zM27 16h2v1h-2zM4 17h2v1h-2zM15 17h3v1h-3zM27 17h2v1h-2zM4 18h2v1h-2zM16 18h3v1h-3zM27 18h2v1h-2zM4 19h2v1h-2zM16 19h3v1h-3zM27 19h3v1h-3zM4 20h2v1h-2zM17 20h2v1h-2zM28 20h2v1h-2zM4 21h2v1h-2zM21 21h2v1h-2zM28 21h2v1h-2zM4 22h2v1h-2zM21 22h3v1h-3zM28 22h2v1h-2zM4 23h2v1h-2zM22 23h3v1h-3zM28 23h2v1h-2zM4 24h2v1h-2zM23 24h3v1h-3zM28 24h2v1h-2zM4 25h2v1h-2zM24 25h3v1h-3zM28 25h2v1h-2zM4 26h26v1h-26zM4 27h26v1h-26z","apple":"M17 3h2v1h-2zM17 4h2v1h-2zM16 5h9v1h-9zM16 6h2v1h-2zM19 6h6v1h-6zM16 7h2v1h-2zM19 7h6v1h-6zM15 8h3v1h-3zM15 9h2v1h-2zM15 10h2v1h-2zM8 11h16v1h-16zM7 12h18v1h-18zM6 13h3v1h-3zM23 13h3v1h-3zM5 14h3v1h-3zM24 14h3v1h-3zM4 15h3v1h-3zM25 15h3v1h-3zM4 16h2v1h-2zM26 16h2v1h-2zM4 17h2v1h-2zM26 17h2v1h-2zM4 18h2v1h-2zM26 18h2v1h-2zM4 19h2v1h-2zM26 19h2v1h-2zM4 20h2v1h-2zM26 20h2v1h-2zM4 21h2v1h-2zM26 21h2v1h-2zM4 22h3v1h-3zM25 22h3v1h-3zM5 23h3v1h-3zM24 23h3v1h-3zM6 24h3v1h-3zM23 24h3v1h-3zM7 25h18v1h-18zM8 26h16v1h-16z","ball":"M12 3h8v1h-8zM10 4h12v1h-12zM8 5h5v1h-5zM14 5h4v1h-4zM19 5h5v1h-5zM7 6h3v1h-3zM14 6h4v1h-4zM22 6h3v1h-3zM6 7h3v1h-3zM14 7h4v1h-4zM23 7h3v1h-3zM5 8h3v1h-3zM14 8h4v1h-4zM24 8h3v1h-3zM5 9h2v1h-2zM14 9h4v1h-4zM25 9h2v1h-2zM4 10h2v1h-2zM14 10h4v1h-4zM26 10h2v1h-2zM4 11h2v1h-2zM14 11h4v1h-4zM26 11h2v1h-2zM3 12h26v1h-26zM3 13h26v1h-26zM3 14h2v1h-2zM14 14h4v1h-4zM27 14h2v1h-2zM3 15h2v1h-2zM14 15h4v1h-4zM27 15h2v1h-2zM3 16h2v1h-2zM14 16h4v1h-4zM27 16h2v1h-2zM3 17h2v1h-2zM14 17h4v1h-4zM27 17h2v1h-2zM3 18h26v1h-26zM3 19h26v1h-26zM4 20h2v1h-2zM14 20h4v1h-4zM26 20h2v1h-2zM4 21h2v1h-2zM14 21h4v1h-4zM26 21h2v1h-2zM5 22h2v1h-2zM14 22h4v1h-4zM25 22h2v1h-2zM5 23h3v1h-3zM14 23h4v1h-4zM24 23h3v1h-3zM6 24h3v1h-3zM14 24h4v1h-4zM23 24h3v1h-3zM7 25h3v1h-3zM14 25h4v1h-4zM22 25h3v1h-3zM8 26h5v1h-5zM14 26h4v1h-4zM19 26h5v1h-5zM10 27h12v1h-12zM12 28h8v1h-8z","rice":"M15 5h2v1h-2zM13 6h6v1h-6zM13 7h2v1h-2zM17 7h2v1h-2zM12 8h2v1h-2zM18 8h2v1h-2zM12 9h2v1h-2zM18 9h2v1h-2zM11 10h2v1h-2zM19 10h2v1h-2zM11 11h2v1h-2zM19 11h2v1h-2zM10 12h2v1h-2zM20 12h2v1h-2zM10 13h2v1h-2zM20 13h2v1h-2zM9 14h2v1h-2zM21 14h2v1h-2zM8 15h2v1h-2zM22 15h2v1h-2zM8 16h2v1h-2zM22 16h2v1h-2zM7 17h2v1h-2zM23 17h2v1h-2zM7 18h2v1h-2zM23 18h2v1h-2zM6 19h2v1h-2zM11 19h10v1h-10zM24 19h2v1h-2zM6 20h2v1h-2zM11 20h10v1h-10zM24 20h2v1h-2zM5 21h2v1h-2zM11 21h10v1h-10zM25 21h2v1h-2zM5 22h2v1h-2zM11 22h10v1h-10zM25 22h2v1h-2zM4 23h2v1h-2zM11 23h10v1h-10zM26 23h2v1h-2zM4 24h2v1h-2zM11 24h10v1h-10zM26 24h2v1h-2zM5 25h2v1h-2zM11 25h10v1h-10zM25 25h2v1h-2zM5 26h22v1h-22zM7 27h18v1h-18z","sword":"M15 4h2v1h-2zM15 5h2v1h-2zM15 6h2v1h-2zM14 7h4v1h-4zM14 8h4v1h-4zM14 9h4v1h-4zM14 10h4v1h-4zM14 11h4v1h-4zM14 12h4v1h-4zM14 13h4v1h-4zM14 14h4v1h-4zM14 15h4v1h-4zM14 16h4v1h-4zM14 17h4v1h-4zM14 18h4v1h-4zM14 19h4v1h-4zM8 20h16v1h-16zM8 21h16v1h-16zM15 22h2v1h-2zM15 23h2v1h-2zM15 24h2v1h-2zM15 25h2v1h-2zM15 26h2v1h-2zM13 27h6v1h-6zM13 28h6v1h-6z","boot":"M7 3h11v1h-11zM7 4h11v1h-11zM7 5h2v1h-2zM16 5h2v1h-2zM7 6h2v1h-2zM16 6h2v1h-2zM7 7h2v1h-2zM16 7h2v1h-2zM7 8h2v1h-2zM16 8h2v1h-2zM7 9h2v1h-2zM16 9h2v1h-2zM7 10h2v1h-2zM16 10h2v1h-2zM7 11h2v1h-2zM16 11h2v1h-2zM7 12h2v1h-2zM16 12h2v1h-2zM7 13h2v1h-2zM16 13h2v1h-2zM7 14h2v1h-2zM16 14h2v1h-2zM7 15h2v1h-2zM16 15h2v1h-2zM7 16h2v1h-2zM16 16h2v1h-2zM7 17h2v1h-2zM17 17h6v1h-6zM7 18h2v1h-2zM18 18h6v1h-6zM7 19h2v1h-2zM23 19h2v1h-2zM7 20h2v1h-2zM24 20h2v1h-2zM7 21h2v1h-2zM25 21h2v1h-2zM7 22h2v1h-2zM25 22h2v1h-2zM7 23h20v1h-20zM7 24h20v1h-20zM7 25h20v1h-20zM7 26h20v1h-20z","heart":"M7 1h6v1h-6zM19 1h6v1h-6zM5 2h10v1h-10zM17 2h10v1h-10zM4 3h3v1h-3zM13 3h6v1h-6zM25 3h3v1h-3zM4 4h2v1h-2zM15 4h2v1h-2zM26 4h2v1h-2zM3 5h2v1h-2zM27 5h2v1h-2zM3 6h2v1h-2zM27 6h2v1h-2zM3 7h2v1h-2zM27 7h2v1h-2zM3 8h2v1h-2zM27 8h2v1h-2zM3 9h2v1h-2zM27 9h2v1h-2zM3 10h2v1h-2zM27 10h2v1h-2zM3 11h2v1h-2zM27 11h2v1h-2zM3 12h2v1h-2zM27 12h2v1h-2zM4 13h2v1h-2zM26 13h2v1h-2zM4 14h2v1h-2zM26 14h2v1h-2zM5 15h2v1h-2zM25 15h2v1h-2zM5 16h2v1h-2zM25 16h2v1h-2zM6 17h2v1h-2zM24 17h2v1h-2zM7 18h2v1h-2zM23 18h2v1h-2zM8 19h2v1h-2zM22 19h2v1h-2zM9 20h2v1h-2zM21 20h2v1h-2zM10 21h2v1h-2zM20 21h2v1h-2zM11 22h3v1h-3zM18 22h3v1h-3zM12 23h3v1h-3zM17 23h3v1h-3zM14 24h4v1h-4zM15 25h2v1h-2z","moon":"M10 4h3v1h-3zM8 5h5v1h-5zM7 6h5v1h-5zM6 7h2v1h-2zM10 7h2v1h-2zM5 8h2v1h-2zM10 8h2v1h-2zM4 9h2v1h-2zM10 9h2v1h-2zM4 10h2v1h-2zM10 10h2v1h-2zM3 11h2v1h-2zM10 11h2v1h-2zM3 12h2v1h-2zM10 12h2v1h-2zM3 13h2v1h-2zM10 13h2v1h-2zM3 14h2v1h-2zM11 14h2v1h-2zM3 15h2v1h-2zM11 15h2v1h-2zM3 16h2v1h-2zM12 16h2v1h-2zM3 17h2v1h-2zM13 17h2v1h-2zM3 18h2v1h-2zM14 18h2v1h-2zM3 19h2v1h-2zM15 19h3v1h-3zM26 19h1v1h-1zM3 20h2v1h-2zM16 20h11v1h-11zM4 21h2v1h-2zM18 21h8v1h-8zM4 22h2v1h-2zM24 22h2v1h-2zM5 23h2v1h-2zM23 23h2v1h-2zM6 24h2v1h-2zM22 24h2v1h-2zM7 25h3v1h-3zM20 25h3v1h-3zM8 26h14v1h-14zM10 27h10v1h-10z","hammer":"M4 4h24v1h-24zM4 5h24v1h-24zM4 6h2v1h-2zM26 6h2v1h-2zM4 7h2v1h-2zM26 7h2v1h-2zM4 8h2v1h-2zM26 8h2v1h-2zM4 9h2v1h-2zM26 9h2v1h-2zM4 10h2v1h-2zM26 10h2v1h-2zM4 11h24v1h-24zM4 12h24v1h-24zM13 13h6v1h-6zM13 14h2v1h-2zM17 14h2v1h-2zM13 15h2v1h-2zM17 15h2v1h-2zM13 16h2v1h-2zM17 16h2v1h-2zM13 17h2v1h-2zM17 17h2v1h-2zM13 18h2v1h-2zM17 18h2v1h-2zM13 19h2v1h-2zM17 19h2v1h-2zM13 20h2v1h-2zM17 20h2v1h-2zM13 21h2v1h-2zM17 21h2v1h-2zM13 22h2v1h-2zM17 22h2v1h-2zM13 23h2v1h-2zM17 23h2v1h-2zM13 24h2v1h-2zM17 24h2v1h-2zM13 25h2v1h-2zM17 25h2v1h-2zM13 26h2v1h-2zM17 26h2v1h-2zM13 27h2v1h-2zM17 27h2v1h-2zM13 28h6v1h-6zM13 29h6v1h-6z","lock":"M13 5h6v1h-6zM11 6h10v1h-10zM10 7h3v1h-3zM19 7h3v1h-3zM9 8h3v1h-3zM20 8h3v1h-3zM8 9h3v1h-3zM21 9h3v1h-3zM8 10h2v1h-2zM22 10h2v1h-2zM7 11h2v1h-2zM23 11h2v1h-2zM7 12h2v1h-2zM23 12h2v1h-2zM7 13h2v1h-2zM23 13h2v1h-2zM6 14h20v1h-20zM6 15h20v1h-20zM6 16h2v1h-2zM24 16h2v1h-2zM6 17h2v1h-2zM24 17h2v1h-2zM6 18h2v1h-2zM24 18h2v1h-2zM6 19h2v1h-2zM14 19h4v1h-4zM24 19h2v1h-2zM6 20h2v1h-2zM14 20h4v1h-4zM24 20h2v1h-2zM6 21h2v1h-2zM14 21h4v1h-4zM24 21h2v1h-2zM6 22h2v1h-2zM15 22h2v1h-2zM24 22h2v1h-2zM6 23h2v1h-2zM15 23h2v1h-2zM24 23h2v1h-2zM6 24h2v1h-2zM15 24h2v1h-2zM24 24h2v1h-2zM6 25h2v1h-2zM24 25h2v1h-2zM6 26h2v1h-2zM24 26h2v1h-2zM6 27h20v1h-20zM6 28h20v1h-20z","clock":"M12 2h8v1h-8zM10 3h12v1h-12zM8 4h4v1h-4zM20 4h4v1h-4zM7 5h3v1h-3zM22 5h3v1h-3zM6 6h2v1h-2zM24 6h2v1h-2zM5 7h2v1h-2zM15 7h2v1h-2zM25 7h2v1h-2zM4 8h2v1h-2zM15 8h2v1h-2zM26 8h2v1h-2zM4 9h2v1h-2zM15 9h2v1h-2zM26 9h2v1h-2zM3 10h2v1h-2zM15 10h2v1h-2zM27 10h2v1h-2zM3 11h2v1h-2zM15 11h2v1h-2zM27 11h2v1h-2zM2 12h2v1h-2zM15 12h2v1h-2zM28 12h2v1h-2zM2 13h2v1h-2zM15 13h2v1h-2zM28 13h2v1h-2zM2 14h2v1h-2zM15 14h2v1h-2zM28 14h2v1h-2zM2 15h2v1h-2zM15 15h8v1h-8zM28 15h2v1h-2zM2 16h2v1h-2zM15 16h8v1h-8zM28 16h2v1h-2zM2 17h2v1h-2zM28 17h2v1h-2zM2 18h2v1h-2zM28 18h2v1h-2zM2 19h2v1h-2zM28 19h2v1h-2zM3 20h2v1h-2zM27 20h2v1h-2zM3 21h2v1h-2zM27 21h2v1h-2zM4 22h2v1h-2zM26 22h2v1h-2zM4 23h2v1h-2zM26 23h2v1h-2zM5 24h2v1h-2zM25 24h2v1h-2zM6 25h2v1h-2zM24 25h2v1h-2zM7 26h3v1h-3zM22 26h3v1h-3zM8 27h4v1h-4zM20 27h4v1h-4zM10 28h12v1h-12zM12 29h8v1h-8z"};
/* なにもないときの、小さな絵とひとこと */
function nodata(k,t){return el('<div class="nodata">'+pxi(k)+'<span>'+t+'</span></div>')}
/* 入る数がわかるときだけ「持っている数/入る数」。箱がないときは数だけ */
function capTxt(n,c){return c>0?'（'+n+'/'+c+'）':n>0?'（'+n+'）':''}
/* できた印（✓）は、ドットのチェックにする */
const CKD='M6 0h1v1h-1zM5 1h1v1h-1zM6 1h1v1h-1zM0 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM0 3h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM1 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM2 5h1v1h-1z';/* 7×6ドットのチェック（1ドット＝2px。32のマス目をちぢめると、ドットがにじむ） */
function ckSet(b,t){if(t.startsWith('✓ ')){b.innerHTML='<svg class="pxi ck" viewBox="0 0 7 6" aria-hidden="true"><path d="'+CKD+'"/></svg>';b.appendChild(document.createTextNode(t.slice(2)))}else b.textContent=t}
function pxi(k,c){return '<svg class="pxi'+(c?' '+c:'')+'" viewBox="0 0 32 32" aria-hidden="true"><path d="'+(PXI[k]||'')+'"/></svg>'}

/* ---------- UI ---------- */
/* クエストのごほうびのパワー：どのクエストも、この1つの形（大きな知らせ＋神殿の上に数字）でわたす */
function rewardPower(n){if(!n)return;S.pt+=n;S.totalPt+=n;toast('ごほうび：パワー+'+n,'good');if(typeof STATUE!=='undefined'&&STATUE>=0)addFloat(STATUE%W+.5,(STATUE/W|0)-1,'+'+n,'#ecdcbc')}
/* 知らせ：同じ文はまとめて（数をつける）、出すのは2つまで、のこりは順番にまつ（TOASTQ）。大事な物（good・warn）は大きく長く、ほかは短く */
const TOASTQ=[],TOASTMAX=2,TOASTMS={good:3200,warn:3200,'':2000};
function toastShow(it){const box=$('#toasts'),t=document.createElement('div');t.className='toast'+(it.kind?' '+it.kind:'');t._msg=it.msg;t._n=it.n;t.textContent=it.n>1?it.msg+'（'+it.n+'）':it.msg;box.appendChild(t);toastTimer(t,it.kind)}
function toastTimer(t,kind){clearTimeout(t._tm);t._tm=setTimeout(()=>{t.classList.add('out');setTimeout(()=>{t.remove();toastNext()},180)},TOASTMS[kind||'']||2000)}
function toastNext(){const box=$('#toasts');while(TOASTQ.length&&box.querySelectorAll('.toast:not(.out):not(#playHint)').length<TOASTMAX)toastShow(TOASTQ.shift())}
function toast(msg,kind){kind=kind||'';const box=$('#toasts');
  for(const t of box.querySelectorAll('.toast:not(.out):not(#playHint)'))if(t._msg===msg){t._n++;t.textContent=msg+'（'+t._n+'）';t.classList.remove('bump');void t.offsetWidth;t.classList.add('bump');toastTimer(t,kind);return}
  const q=TOASTQ.find(it=>it.msg===msg);if(q){q.n++;return}
  if(kind==='good')sfx('good');else if(kind==='warn')sfx('warn');
  if(TOASTQ.length>=4)TOASTQ.splice(TOASTQ.findIndex(it=>!it.kind)>=0?TOASTQ.findIndex(it=>!it.kind):0,1);/* まちが長くなりすぎたら、小さい知らせからすてる */
  TOASTQ.push({msg,kind,n:1});toastNext()}
const FEATS={inv:'#dockInv',build:'[data-mode="build"]',remove:'[data-mode="remove"]',craft:'[data-sheet="craft"]',people:'[data-sheet="people"]'};
function applyFeats(){
  if(S.glassT==null&&glassUnlocked())S.glassT=600;/* はじめの10分は無料 */$('#speedBtn').hidden=!(glassUnlocked()||TESTSPD||TESTM);if(!(hasGlass()||TESTM))S.speed=1;if(!TESTM&&S.speed>2)S.speed=1;glassUI();
  for(const k in FEATS)document.querySelector(k==='inv'?FEATS[k]:'#dock '+FEATS[k]).hidden=!S.feat[k]||k==='craft';/* 依頼は依頼ボードから。おそなえ箱は下のバーにも出す */
  document.querySelector('#dock [data-mode="bulk"]').hidden=true;/* 道具は「おく」の中からえらぶ（下のバーには出さない） *//* おそなえ箱のボタン */
  const n=[...document.querySelectorAll('#dock button')].filter(b=>!b.hidden).length;
  $('#dock').style.gridTemplateColumns='repeat('+n+',1fr)';
}
let palOpen=false;/* 「おく」をおすと、アイテム欄が大きくひらく。えらぶと小さくなる */
function dockSync(){document.querySelectorAll('#dock [data-mode]').forEach(b=>b.classList.toggle('on',!LIGHTARM&&b.dataset.mode===(mode==='bulk'?'build':mode)))}/* 道具を使っているあいだは「おく」を光らせる。守りの光をえらんでいるあいだは、どれも光らせない */
function setMode(m){
  mode=m;palOpen=m==='build'||m==='bulk';pending=null;selRect=null;$('#confirm').hidden=true;
  if(S&&STATUE<0&&m==='build'&&usable('statue'))sel='statue';else if(sel==='statue'&&STATUE>=0)sel='farm';
  LIGHTARM=false;dockSync();/* みる・おく・こわすをえらんだら、守りの光はやめる */
  $('#palette').hidden=!(m==='build'||m==='bulk');renderPalette();
}
function chip(img,name,cost,cls,onClick,mat){
  const b=document.createElement('button');b.className='chip '+cls;
  b.innerHTML='<img alt=""><span class="nm"></span><span class="cs"></span>';
  b.querySelector('img').src=img;b.querySelector('.nm').textContent=name;const cs=b.querySelector('.cs');cs.textContent=cost;b.onclick=onClick;
  if(mat&&Object.keys(mat).length){const m=document.createElement('span');m.className='mt';m.innerHTML=Object.keys(mat).map(k=>{const h=S.mat[k]||0;return '<span class="mic'+(h>=mat[k]?'':' ng')+'"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+h+'/'+mat[k]+'</span>'}).join('');b.appendChild(m)}/* 建物に使う素材：持っている数/いる数（足りない素材は赤） */
  return b;
}
function lbl(box,t){const s=document.createElement('span');s.className='pallbl';s.textContent=t;box.appendChild(s)}

function updItemInfo(){const ii=$('#itemInfo');if(!(mode==='build'||mode==='bulk')||!S){ii.hidden=true;return}
  let nm='',ds='';if(mode==='bulk'&&selStamp==='move'){nm='ひっこしミトン';ds=MOVESRC?moveName(MOVESRC)+'を、うつしたい所をタップ':'うつしたい家具・建物をタップ'}else if(mode==='bulk'&&selStamp){if(selStamp.startsWith('swap:')){nm=BL[selStamp.slice(5)].name+'につけかえ';ds='つけかえたい物をタップ'}else{nm=STAMPS[selStamp].name;ds='置きたい場所の左上をタップ'}}
  else if(sel&&BL[sel]){const b=BL[sel];nm=iname(sel);const bm=sel==='tower'?TOWER_MAT():b.mat;ds=(b.kind==='build'?(b.pc?SP(b.pc)+(bm?' '+matHTML(bm):''):''):'所持：'+inv(sel));const hp=withAttr(sel,b.desc||'');if(hp)ds+=' <button class="qbtn" id="iiQ">?</button>';}else ds=esc(ds);
  ii.hidden=!nm;$('#iiName').textContent=nm;$('#iiDesc').innerHTML=ds;const q=$('#iiQ');if(q)q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,withAttr(sel,BL[sel].desc||''))}}
function renderPalette(){
  if(!S)return;updItemInfo();const box=$('#palItems');box.innerHTML='';
  const pickItem=id=>()=>{sfx('tap');sel=id;if(pending&&pending.kind==='one'){pending=null;$('#confirm').hidden=true}selStamp=null;renderPalette();const b=BL[id];
    if(mode==='bulk'){if(!S.bulk)return toast('下から道具をえらんでください');toast('ハケで、なぞった範囲をぬれます');palOpen=false;renderPalette();return}
    if(b.kind==='furn'&&!inv(id))toast(b.name+'が足りません','warn');
    else if(b.kind==='block'&&!inv(id))toast(b.name+'がありません');
    else if(b.kind==='plant'&&!inv(id))toast(iname(id)+'がありません');
    else if(b.kind==='seed'&&!inv(id))toast(iname(id)+'がありません');
    if(b.kind==='build'||inv(id)>0){palOpen=false;renderPalette()}};
  $('#palette').classList.toggle('open',palOpen);
  if(!palOpen&&mode==='bulk'){/* ハケ・スタンプ・つけかえも、えらんだら小さくして、マップを見えるように */
    if(selStamp==='move')box.appendChild(chip(toolIcon('mover'),'ひっこしミトン',MOVESRC?moveName(MOVESRC):'うつす','sel',()=>{}));
    else if(selStamp)box.appendChild(chip(selStamp.startsWith('swap:')?iconURL(selStamp.slice(5)):stampIcon(selStamp),selStamp.startsWith('swap:')?BL[selStamp.slice(5)].name:STAMPS[selStamp].name,selStamp.startsWith('swap:')?'×'+inv(selStamp.slice(5)):'スタンプ','sel',()=>{}));
    else if(sel&&BL[sel])box.appendChild(chip(iconURL(sel),iname(sel),'×'+inv(sel),'sel',()=>{}));
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(!palOpen&&mode==='build'){/* えらんだ物だけを小さく出す */
    if(sel&&BL[sel]){const id=sel,b=BL[id];box.appendChild(chip(iconURL(id),iname(id),b.kind==='build'?(id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(b.pc)):'×'+inv(id),'sel',()=>{}))}
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(mode==='bulk'){
    if(S.bulk){lbl(box,'ハケ');box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','下からえらぶ','wide',()=>toast('ぬりたいブロックや種をえらんで、指でなぞろう')))}/* もらった道具だけ出す */
    if(S.mover){lbl(box,'ひっこし');box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide'+(selStamp==='move'?' sel':''),()=>{selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}))}/* ひっこしミトン：家具・建物を、すぐべつの場所へ */
    if(S.stamps){lbl(box,'スタンプ');for(const sid in STAMPS)box.appendChild(chip(stampIcon(sid),STAMPS[sid].name,'スタンプ','wide'+(selStamp===sid?' sel':''),()=>{selStamp=sid;palOpen=false;renderPalette();toast('置きたい場所の左上をタップ')}))}
    if(S.swap){lbl(box,'つけかえ');for(const id of SWAPG.flat().filter(id=>S.unlocked[id])){const k='swap:'+id;box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),selStamp===k?'sel':'',()=>{selStamp=k;palOpen=false;renderPalette();toast('つけかえたい物をタップ')}))}}/* つけかえトンカチ：つながっている柵・塀・家の壁・道・床を、えらんだ種類にまとめてかえる */
    if(!S.bulk)return/* ハケがなければ、ぬるブロック・種は出さない */
  }
  if(mode==='build'&&(S.bulk||S.stamps||S.swap||S.mover)){lbl(box,'どうぐ');/* 道具は「おく」の中でえらぶ */
    if(S.mover)box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide',()=>{sfx('tap');setMode('bulk');selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}));
    if(S.bulk)box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','まとめてぬる','wide',()=>{sfx('tap');setMode('bulk');selStamp=null;toast('ぬりたいブロックや種をえらんで、指でなぞろう')}));
    if(S.stamps)box.appendChild(chip(toolIcon('stamp'),'かたどりスタンプ','スタンプ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}));
    if(S.swap)box.appendChild(chip(toolIcon('swap'),'つけかえトンカチ','つけかえ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}))}
  const blocks=STATUE<0?[]:BLOCKS.filter(id=>inv(id)>0&&!(mode==='bulk'&&WALLD.has(id)));
  if(mode==='bulk'&&STATUE>=0&&inv('spike')>0)blocks.push('spike');/* とげの罠も、なぞってまとめて置ける */
  if(blocks.length){lbl(box,'ブロック');for(const id of blocks){const n=inv(id);box.appendChild(chip(iconURL(id),BL[id].name,'×'+n,(n?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}}
  if(mode==='build'){
    for(const [name,ids]of furnitureGroups(Object.keys(BL).filter(id=>BL[id].kind==='furn'&&inv(id)>0))){lbl(box,name);for(const id of ids)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}
    {const inTab=new Set(CRAFT_TABS.flatMap(([,ids])=>ids)),g=Object.keys(BL).filter(id=>BL[id].kind==='furn'&&inv(id)>0&&!inTab.has(id)&&!GIFTF.includes(id));if(g.length){lbl(box,'そのほか');for(const id of g)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}}/* 依頼ボードで作らない家具（おそなえのガゼボ・東屋、もらった湯のわき岩など）も、持っていれば置ける */
    {const g=GIFTF.filter(id=>inv(id)>0);if(g.length){lbl(box,'かざり・おみやげ');for(const id of g)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}}/* カミサマのかざり・おまつりのちょうちん（依頼ボードでは作らない物） */
  }
  const plants=S.feat.plant?PLANTS.filter(id=>inv(id)>0):[];
  if(plants.length){lbl(box,'うえる');for(const id of plants)box.appendChild(chip(iconURL(id),iname(id),'×'+inv(id),(inv(id)?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}
  if(mode==='build'&&cnt('farm')){const sd=Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0);if(sd.length){lbl(box,'たね');for(const k of sd){const id='seed:'+k,n=cseed(k);box.appendChild(chip(iconURL(id),iname(id),'×'+n,(n?'':'zero')+(sel===id?' sel':''),pickItem(id)))}}}
  if(mode==='build'){
    const bLock=id=>STATUE>=0&&BREQ[id]&&lvOK(id)&&!elemCount(BREQ[id]),builds0=BUILDS.filter(id=>usable(id)||bLock(id)),builds=builds0.filter(recShown);/* 属性の子がいなくても、ならべて見せる */
    if(builds0.length){lbl(box,'建てる');recToggle(box,builds0);for(const id of builds)box.appendChild(chip(iconURL(id),BL[id].name,id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(BL[id].pc),(sel===id?'sel':'')+(bLock(id)?' zero':''),bLock(id)?()=>toast(ELEM[BREQ[id]].name+'のせいれいがいると建てられます'):pickItem(id),id==='tower'?TOWER_MAT():(id==='watch'&&watchQ())?null:BL[id].mat))}
    if(S.dig){lbl(box,'だんさ');for(const id of['dig','mound'])box.appendChild(chip(toolIcon(id),BL[id].name,SP(BL[id].pc),sel===id?'sel':'',pickItem(id)))}/* だんさスコップ：けずる・もるを、せいれいにたのむ（建てるのと同じ） */
  }
}
function gaugeHTML(r){
  const g=(l,v,c,k)=>`<span>${pxi(k)}${l}</span><div class="bar"><i style="width:${clamp(v,0,100)|0}%;background:${c}"></i></div>`;
  return `<div class="gauges">${g('おなか '+Math.round(r.hunger)+'/'+hMax(r),r.hunger/hMax(r)*100,r.hunger<250?'var(--danger)':'#ffb35c','rice')}${g('たのしさ',r.fun,'var(--pink)','heart')}${g(S.t-(r.eUp||-9)<3?'つかれ（回復中）':'つかれ',100-r.energy,S.t-(r.eUp||-9)<3?'#7ed99a':r.energy<25?'var(--danger)':'#c9a7ff','moon')}</div>`;
}
function spiritXpGaugeHTML(r){const xp=spiritXpProgress(r),max=xp.next==null,base=LVXP[xp.lv],need=max?0:xp.next-base,current=max?0:Math.max(0,Math.round((xp.total-base)*1000)/1000),pct=max?100:clamp(current/need*100,0,100);return `<div class="spiritXp" style="margin-top:8px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:11px"><span>${max?'けいけん MAX':'けいけん '+xpText(current)+' / '+xpText(need)}</span><span>${max?'Lv'+xp.lv:'次のLvまで '+Math.ceil(xp.remaining-1e-9)}</span></div><div class="bar" role="progressbar" aria-label="けいけん" aria-valuemin="0" aria-valuemax="${max?100:need}" aria-valuenow="${max?100:current}" style="margin-top:4px"><i style="width:${pct}%;background:#78b7cb"></i></div></div>`}
let sheet=null,sheetArg=null;
function attrPop(k){
  const src={};const add=(name,v)=>{const r=src[name]||(src[name]={n:0,v:0});r.n++;r.v+=v};
  for(let j=0;j<W*H;j++){const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||(FLOWERS.has(id)||id==='tree'||id==='fruit')&&isBud(j))continue;if((b.attr||{})[k]>0)add(b.name,b.attr[k])}
  const ov=el('<div style="position:absolute;inset:0;z-index:30;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:24px"></div>');
  const card=el('<div class="sec pxcard" style="background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:14px;width:100%;max-width:340px;max-height:70%;overflow:auto"></div>');
  const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1))+' / '+needFor(k);card.appendChild(h);
  for(const[name,r]of Object.entries(src))card.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));
  if(!Object.keys(src).length)card.appendChild(el('<p class="note">まだありません</p>'));
  card.appendChild(el('<p class="note">マップにあるものを集計。花と木は育ってから加算されます。</p>'));
  ov.appendChild(card);ov.onclick=()=>ov.remove();$('#app').appendChild(ov)}/* 属性の内訳ポップアップ */
function placeFromInv(id){/* もちものから「置く」：ウィンドウをとじて、「おく」でえらんだときと同じにする */closeSheet();setMode('build');sel=id;selStamp=null;palOpen=false;renderPalette();}
function itemPop(id){/* もちもの：おそなえ箱の物・たね・ふしぎな種をタップしたときのメニュー */const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><img alt="" style="width:44px;height:44px"><b class="t" style="font-size:16px"></b></div><p class="note n" style="margin:0 0 12px"></p><div class="rows"></div><div class="bt" style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn x">とじる</button></div></div></div>');
  const close=()=>o.remove(),bt=o.querySelector('.bt'),add=(t,f,dis)=>{const b=el('<button class="btn pri"></button>');b.textContent=t;b.disabled=!!dis;b.onclick=()=>{sfx('tap');close();f()};bt.appendChild(b)};
  o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  if(id==='mseed'){o.querySelector('img').src=seedIco();o.querySelector('.t').textContent='ふしぎな種 '+(S.mseed||0)+'こ';o.querySelector('.n').textContent='せいれいにあげると、能力のどれかが+1上がる。25%で+2。';
    for(const r of S.res){const row=rowEl(r.name,ELEM[r.elem].name+'のせいれい'),b=el('<button class="btn pri">あげる</button>');row.appendChild(b);b.onclick=()=>{giveSeed(r);if((S.mseed||0)<1)close();else o.querySelector('.t').textContent='ふしぎな種 '+(S.mseed||0)+'こ';if(sheet==='inv')renderSheet()};o.querySelector('.rows').appendChild(row)}}
  else if(id==='herb'){o.querySelector('img').src=herbIco();o.querySelector('.t').textContent='まよけのハーブ '+(S.herb||0)+'こ';o.querySelector('.n').textContent=HERBDESC;add('つかう',herbUse,!(S.herb>0))}
  else if(id==='horn'){o.querySelector('img').src=hornIco();o.querySelector('.t').textContent='よびごえの角笛 '+(S.horn||0)+'こ';o.querySelector('.n').textContent=HORNDESC;add('ふく',hornBlow,!(S.horn>0))}
  else if(id.startsWith('seed:')){const k=id.slice(5),c=CROPS[k];o.querySelector('img').src=seedIcon(k);o.querySelector('.t').textContent=c.name+'のたね '+cseed(k)+'こ';o.querySelector('.n').textContent=c.desc;add('畑にまく',()=>placeFromInv(id),cseed(k)<1)}
  else{const b=BL[id];o.querySelector('img').src=iconURL(id);o.querySelector('.t').textContent=iname(id)+' '+inv(id)+(b.kind==='ammo'?'本':'こ');o.querySelector('.n').textContent=b.desc||'';if(b.kind!=='ammo')add('これを置く',()=>placeFromInv(id),!inv(id))}
  document.body.appendChild(o)}
let CRAFTN=0;/* 依頼ボードに出ている物の数 */
function craftPop(tags){/* 依頼ボードのしぼりこみ：タグをいくつでもえらぶ。えらんだタグがぜんぶつく物を出す */if(document.getElementById('craftPop'))return;sfx('tap');
  const o=el('<div id="craftPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;color:var(--ink)"><b style="display:block;font-size:16px;margin-bottom:8px">しぼりこみ</b><div class="ctabs"></div><p class="note n" style="margin:4px 0 0"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn clr">けす</button><button class="btn pri x">とじる</button></div></div></div>');
  const box=o.querySelector('.ctabs'),cnt=()=>CRAFTN;
  o.upd=()=>{box.innerHTML='';for(const t of tags){const b=el('<button class="ctab'+(craftTags.includes(t)?' on':'')+'"></button>');b.textContent=t;b.dataset.tag=t;b.onclick=()=>{sfx('tap');craftTags=craftTags.includes(t)?craftTags.filter(g=>g!==t):[...craftTags,t];renderSheet()};box.appendChild(b)}o.querySelector('.n').textContent='あてはまる物：'+cnt();o.querySelector('.clr').disabled=!craftTags.length};
  const close=()=>{o.remove()};o.querySelector('.x').onclick=close;o.onclick=e=>{if(e.target===o)close()};o.querySelector('.clr').onclick=()=>{craftTags=[];renderSheet()};
  document.body.appendChild(o);o.upd()}
function cmpPop(j){/* コンポスター：入れる草の種類ごとに数をえらぶと、せいれいが素材箱から運んで入れる */const CAP=20,V={};const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div class="ks"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go"></button></div></div></div>');
  const room=()=>Math.max(0,CAP-cmpIn(j)-cmpWait(j)),sum=()=>GRASSK.reduce((a,k)=>a+(V[k]||0),0);
  const rows=GRASSK.filter(k=>(S.mat[k]||0)>0).map(k=>{const r=el('<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:6px"><span class="nm" style="flex:1"></span><button class="btn m">−</button><b class="v" style="min-width:2.4em;text-align:center"></b><button class="btn p">＋</button></div>');r.querySelector('.nm').textContent=MATN[k]+'（'+(S.mat[k]||0)+'）';r.querySelector('.m').onclick=()=>{sfx('tap');V[k]=Math.max(0,(V[k]||0)-1);upd()};r.querySelector('.p').onclick=()=>{sfx('tap');if(sum()<room()&&(V[k]||0)<(S.mat[k]||0))V[k]=(V[k]||0)+1;upd()};o.querySelector('.ks').appendChild(r);return[k,r]});
  const upd=()=>{const d=S.dyn[j]||{};o.querySelector('.t').textContent=BL.composter.name;o.querySelector('.n').textContent='草（'+(cmpIn(j)+cmpWait(j))+'/'+CAP+'）・肥料（'+(d.c||0)+'）';for(const[k,r]of rows){r.querySelector('.v').textContent=V[k]||0;r.querySelector('.m').disabled=!(V[k]>0);r.querySelector('.p').disabled=sum()>=room()||(V[k]||0)>=(S.mat[k]||0)}const g=o.querySelector('.go');g.textContent='草を入れる';g.disabled=!sum()};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{if(!sum())return;const Q=(S.cmpQ||(S.cmpQ={}))[j]||(S.cmpQ[j]={});for(const k of GRASSK){const t=Math.min(V[k]||0,S.mat[k]||0);if(t>0){S.mat[k]-=t;Q[k]=(Q[k]||0)+t}}sfx('quest');toast('草を入れるのをたのんだ','good');o.remove()};
  if(!rows.length)o.querySelector('.ks').appendChild(el('<p class="note">入れる草がありません</p>'));
  upd();document.body.appendChild(o)}
function otakiPop(k){/* もちもの：素材をタップしたときのメニュー（おたきあげ）。数をえらんでたのむと、せいれいが素材箱から神殿へもっていく */const tr=MATTRADE[k]||5;let v=0;const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:12px"><button class="btn m">−</button><b class="v" style="min-width:3em;text-align:center;font-size:16px"></b><button class="btn p">＋</button></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn x">とじる</button><button class="btn pri go"></button></div></div></div>');
  const upd=()=>{const n=S.mat[k]||0,mx=Math.floor(n/tr)*tr;v=Math.max(0,Math.min(v,mx));o.querySelector('.t').textContent=MATN[k]+' '+n+'こ';o.querySelector('.n').textContent='おたきあげ：'+tr+'こでパワー1';o.querySelector('.v').textContent=v;o.querySelector('.m').disabled=v<=0;o.querySelector('.p').disabled=v+tr>mx;const g=o.querySelector('.go');g.textContent='おたきあげ（パワー+'+v/tr+'）';g.disabled=!v};
  o.querySelector('.m').onclick=()=>{sfx('tap');v-=tr;upd()};o.querySelector('.p').onclick=()=>{sfx('tap');v+=tr;upd()};o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{if(!v||(S.mat[k]||0)<v)return;sfx('quest');S.mat[k]-=v;const Q=S.otakiQ||(S.otakiQ={});Q[k]=(Q[k]||0)+v;toast('おたきあげをたのんだ','good');o.remove();if(sheet==='inv')renderSheet()};
  v=(S.mat[k]||0)>=tr?tr:0;upd();document.body.appendChild(o)}
function openSheet(k,arg){if(NEWRES!=null&&!(k==='res'&&arg===NEWRES))unhold();if(k==='shop')shopSay=pick(S.pt<2?GOD_POOR:GOD_SHOP);sheet=k;sheetArg=arg;$('#sheetWrap').hidden=false;renderSheet()}
let resTab=0,tapPend=false,DLG_KEEP=false,NEWQ=[],NEWRES=null,HOLD=new Set();// 新しいせいれいが来たら、ステータスを見せてから進める
function unhold(){if(NEWRES!=null){HOLD.delete(NEWRES);const r=S&&S.res.find(x=>x.id===NEWRES);if(r)JUMP.set(r,performance.now())}NEWRES=null}
function closeSheet(){{const cp=document.getElementById('craftPop');if(cp)cp.remove()}const hello=sheet==='res'&&NEWRES!=null&&sheetArg===NEWRES&&S?S.res.find(x=>x.id===NEWRES):null;/* あたらしいなかまの画面は、「つぎへ」でも×でも、とじたらあいさつしてからクエストへ */if(S&&S.flags){if(sheet==='shop'&&S.flags.traded&&!S.flags.tradedSeen){S.flags.tradedSeen=1;const St=S.subSt||{};if(St.trade===2&&!isNight()&&godHere()&&!(S.subDone||{}).trade){St.trade=3;sfx('quest');toast('サブクエストたっせい：'+SUBQ.find(q=>q.k==='trade').t,'good');const o=S,ss=VILLAGE_SESSION;setTimeout(()=>{if(S===o&&ss===VILLAGE_SESSION&&S.subSt.trade===3)subTalk('trade')},350)}}/* 交換をおえたら、カミサマが、そのままお礼を言って旅立つ */if(sheet==='menu'&&S.flags.oracleSet)S.flags.oracleSeen=1}/* おつげをえらんだあと、メニューをとじたら（もどってからとじても） */sheet=null;unhold();$('#sheetWrap').hidden=true;if(LVQ){const q=LVQ;LVQ=null;setTimeout(()=>{if(sheet)LVQ=q;else lvShow(...q)},250)}if(S&&S.flags.tapPend&&!S.flags.tapped&&!(S.pendTalk&&S.pendTalk.tapped)){talkOnce('tapped',[[GOD,'#joy|うむ。フタバは、元気そうじゃのう。'],[GOD,'おなかをすかせとったり、しょんぼりしとったら、気にかけてやっておくれ。'],[POKO,'#joy|えへへ、見られちゃった。']],250);setTimeout(checkQuest,400)};if(hello)dialog([[hello.name,helloLine(hello)]],()=>checkQuest())}
function el(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild}
/* たね：たね袋の絵＋作物の小さな絵 */
const foodIc=k=>ICONS[k]||icURL(FOODS[k].e)||(CROPS[k]?cropIcon(k):null);/* 食べ物のアイコン：もらった絵（いもは potato の絵）→ なければ作物の絵 */
const CROPIC={};function cropIcon(k){if(CROPIC[k])return CROPIC[k];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,30);g.scale(1.7,1.7);drawCrop(g,k,0,0,100,true);const u=c.toDataURL();c.width=c.height=0;return CROPIC[k]=u}/* 作物の絵だけのアイコン（図鑑） */
let HERBICO=null;function herbIco(){/* まよけのハーブ：葉のついた枝を3本、ひもでたばねた形。32×32のマス目の四角だけで描く（2倍の細かさ）。ふちは形から作る */if(HERBICO)return HERBICO;const N=32,M=new Int8Array(N*N),K=new Int8Array(N*N);/* M:形 K:1茎 2葉 3ひも */
  const put=(x,y,k)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<N&&y<N){M[y*N+x]=1;K[y*N+x]=k}};
  const stems=[[16,28,9,7],[16,28,16,5],[16,28,23,7]];for(const[x0,y0,x1,y1]of stems)for(let i=0;i<=40;i++){const t=i/40;put(x0+(x1-x0)*t,y0+(y1-y0)*t,1);put(x0+(x1-x0)*t+1,y0+(y1-y0)*t,1)}
  for(const[x0,y0,x1,y1]of stems)for(const t of[.35,.55,.75,.92]){const cx=x0+(x1-x0)*t,cy=y0+(y1-y0)*t;for(const s of[-1,1])for(let dy=-2;dy<=1;dy++)for(let dx=0;dx<4;dx++){if(Math.abs(dy+.5)+dx*.5>2.6)continue;put(cx+s*(dx+1)+(s<0?0:1),cy+dy-dx*.5,2)}}
  for(let x=13;x<=19;x++)for(let y=21;y<=22;y++)put(x,y,3);
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),at=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&M[y*N+x];
  const COL={1:['#8d7a4a','#a99862'],2:['#5f9a52','#86bf6e'],3:['#9a6a3c','#c99a62']};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!at(x,y))continue;const k=K[y*N+x],edge=!at(x-1,y)||!at(x+1,y)||!at(x,y-1)||!at(x,y+1);g.fillStyle=COL[k][edge?0:1];g.fillRect(x*2,y*2,2,2)}
  return HERBICO=c.toDataURL()}
let HORNICO=null;function hornIco(){/* よびごえの角笛のアイコン：32×32のマス目の四角だけで描く（2倍の細かさ） */if(HORNICO)return HORNICO;const N=32,M=new Int8Array(N*N),B=new Int8Array(N*N);
  for(let i=0;i<=200;i++){const t=i/200,x=5+t*20+Math.sin(t*Math.PI)*-1,y=26-t*16-Math.sin(t*Math.PI)*6,r=1.2+t*t*4.3;for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<=r){const q=yy*N+xx;M[q]=1;if(Math.abs(t-.45)<.035||Math.abs(t-.75)<.03)B[q]=1}}
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),at=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&M[y*N+x];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!at(x,y))continue;const q=y*N+x,edge=!at(x-1,y)||!at(x+1,y)||!at(x,y-1)||!at(x,y+1),lo=!at(x+1,y+1)||!at(x,y+1);g.fillStyle=B[q]?(edge?'#9a6a3c':'#b98552'):edge?(lo?'#c2a477':'#d4bb8e'):lo?'#e2cba0':'#f3e6c6';g.fillRect(x*2,y*2,2,2)}
  g.fillStyle='#8a5a32';for(const[x,y]of[[4,26],[5,26],[4,27],[5,27]])g.fillRect(x*2,y*2,2,2);/* 口をあてる所 */
  g.fillStyle='#fff8e6';for(const[x,y]of[[12,17],[13,16],[19,12],[20,11]])g.fillRect(x*2,y*2,2,2);/* 光 */
  return HORNICO=c.toDataURL()}
function seedIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const a=ART.bag;if(a&&a.ok){const h=56,w=h*a.w/a.h;g.drawImage(a.img,(64-w)/2-4,4,w,h)}g.save();g.translate(30,26);g.scale(1.1,1.1);drawCrop(g,k,0,0,100,true);g.restore();return c.toDataURL()}/* たねは、たねのふくろ（もらった絵）と、育つ作物の絵のセット */
function cropIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);drawCrop(g,k,0,0,100,true);return c.toDataURL()}
/* 説明は❓をおしたときだけ出す */
function helpify(r,text){if(!r||!text)return r;const tx=r.querySelector('.tx');if(!tx)return r;const q=document.createElement('button');q.className='qbtn';q.textContent='?';q.setAttribute('aria-label','説明');const nm=tx.querySelector('b').textContent;q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,text)};tx.querySelector('b').appendChild(q);return r}
const GENRE_TAB={'家具':'家具','収納':'収納','遊び':'あそび道具','庭':'庭の家具','あかり':'あかり','ごはん':'料理家具','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い','クエスト':'クエスト'};
function genreOf(id){const b=BL[id];if(!b)return'';if(b.cat==='living')return'ダイニング家具';if(b.cat==='cook')return'料理家具';for(const[t,ids]of CRAFT_TABS)if(ids.includes(id))return GENRE_TAB[t]||t;return''}/* アイテムのジャンル（名前のとなりに出す） */
const nameG=id=>{const g=genreOf(id);return BL[id].name+(g?'　【'+g+'】':'')};
const CAT_TAG={living:'リビング',cook:'キッチン',toy:'遊び',light:'あかり',env:'ガーデン'},TAB_TAG={'家具':'家具','収納':'収納','遊び':'遊び','庭':'ガーデン','あかり':'あかり','ごはん':'キッチン','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い','クエスト':'クエスト'};
const CRAFT_TAGS=['ぜんぶ','リビング','寝室','キッチン','お風呂','収納','かざり','あかり','遊び','ガーデン','家づくり','道・囲い','ワナ','矢','そうび','クエスト'];/* 依頼ボードのタグのならび */
const TAGMAP={stool:'リビング,キッチン',chair:'リビング,キッチン',achair:'リビング',pouf:'リビング',stable:'リビング',ltable:'リビング',table:'リビング,キッチン',sofa1:'リビング',rug1:'リビング,寝室',rug2:'リビング,寝室',bed:'寝室',yorubed:'寝室',hoshirug:'リビング,寝室',takebench:'ガーデン',shishiodoshi:'ガーデン,かざり',takeakari:'あかり,ガーデン',toro:'あかり,ガーデン',andon:'あかり,リビング',
tub:'キッチン,お風呂',sink:'キッチン',oven:'キッチン',bathtub:'お風呂',hotstone:'お風呂,ガーデン',crate:'収納',stor:'収納',mbox:'収納',shelf1:'収納,リビング',shelf2:'収納,かざり',cabinet:'収納,リビング',wshelf:'収納,かざり',
monstera:'かざり,リビング',wreath:'かざり,リビング',curtain1:'かざり,リビング,寝室',curtain2:'かざり,リビング,寝室',paint1:'かざり,リビング',paint2:'かざり,リビング',paint3:'かざり,リビング',
candle:'あかり,リビング',lantern:'あかり,リビング',flamp:'あかり,リビング',lamp:'あかり,ガーデン',torch:'あかり,ガーデン',
signpost:'ガーデン',hedge:'ガーデン',joro:'ガーデン',composter:'ガーデン',birdbath:'ガーデン,かざり',arch:'ガーデン,かざり',parasol:'ガーデン,遊び',noren:'ガーデン,かざり',bench:'ガーデン,リビング',jar:'ガーデン,キッチン',kamizo:'ガーデン',rockart:'ガーデン,かざり',chochin:'かざり',furin:'かざり',ema:'かざり',komainu:'かざり,ガーデン',kadomatsu:'かざり,ガーデン',vane:'ガーデン,かざり',basin:'ガーデン',
slide:'遊び,ガーデン',sandbox:'遊び,ガーデン',seesaw:'遊び,ガーデン',swing:'遊び,ガーデン',campfire:'遊び,あかり',fountain:'遊び,ガーデン',
spike:'ワナ',puddle:'ワナ',sticky:'ワナ',firetrap:'ワナ',gust:'ワナ',watch:'防衛',tower:'防衛',lighthouse:'あかり,防衛',stele:'防衛',lurestatue:'防衛',well:'水まわり,ガーデン',windmill:'作業,ガーデン',lumber:'作業',quarry:'作業',statue:'神殿'};/* ジャンルのタグ（複数あるものは、すべて書く） */
function tagsOf(id){const b=BL[id];if(!b)return[];if(TAGMAP[id])return TAGMAP[id].split(',');if(b.kind==='ammo'||b.g&&b.g.s==='ar')return['矢'];const t=[];if(CAT_TAG[b.cat])t.push(CAT_TAG[b.cat]);for(const[n,ids]of CRAFT_TABS)if(ids.includes(id)){const g=TAB_TAG[n]||n;if(!t.includes(g)&&!(g==='家具'&&t.length))t.push(g)}if(b.play&&!t.includes('遊び'))t.push('遊び');if(!t.length&&b.kind==='furn')t.push('家具');return t}/* 説明に出す、ジャンルのタグ */
function tagsEl(id){const tg=tagsOf(id);if(!tg.length)return null;const d=document.createElement('div');d.className='tags';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;d.appendChild(sp)}return d}
function helpPop(t,text){const o=$('#helpPop');let tg=[];{const id=Object.keys(BL).find(k=>BL[k].name===t);if(id)tg=tagsOf(id)}{const bx=o.querySelector('.tags');if(bx){bx.innerHTML='';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;bx.appendChild(sp)}bx.hidden=!tg.length}}o.querySelector('b').textContent=t;o.querySelector('p').textContent=text;o.hidden=false}
function lostSum(L){/* ぬすまれた物を、物ごとの合計で「石材 ×3、木材 ×2」 */const m=new Map();for(const g of L){const k=String(g).replace(/\d+$/,'');m.set(k,(m.get(k)||0)+1)}return [...m].map(([k,n])=>k+' ×'+n).join('、')}
function lostSec(body,into){if(!(S.lost||[]).some(q=>!q.unb)||!(S.mebuki>0))return;if(into){for(const q of S.lost.filter(q=>!q.unb)){const row=rowEl(q.name,'めぶきのしずく '+S.mebuki+'こ・'+ELEM[q.elem].name+'の力 '+Math.floor(ATTR[q.elem]||0)+'/'+reviveNeed(q),spiritPort(q.elem,96,q.vr));const bt=el('<button class="btn pri">よみがえらせる</button>');bt.onclick=()=>{if(!(S.mebuki>0))return;if((ATTR[q.elem]||0)<reviveNeed(q))return toast(ELEM[q.elem].name+'の力が足りません（'+Math.floor(ATTR[q.elem]||0)+'/'+reviveNeed(q)+'）','warn');if(calledToday())return toast(S.mebukiDay===callDay()?'めぶきのしずくをつかえるのは、1日に1回です':'きょうは、なかまを呼んだので、つかえません','warn');S.mebuki--;S.mebukiDay=callDay();closeSheet();{const pv=S.summon;S.summon={rev:1,lost:q.name,mebuki:1};doSummon();S.summon=pv}sfx('level')};row.appendChild(bt);into.appendChild(row)}return}/* 「だれを呼ぶ？」では、呼ぶ子と同じ枠に、よみがえらせる子をならべる */const ls=el('<div class="sec"><h3>消えてしまったせいれい（めぶきのしずく '+S.mebuki+'こ）</h3><div class="rows"></div></div>');/* めぶきのしずくで、よみがえらせる（「せいれい」と「だれを呼ぶ？」の両方から） */
  for(const q of S.lost.filter(q=>!q.unb)){const row=rowEl(q.name,ELEM[q.elem].name+'の力 '+Math.floor(ATTR[q.elem]||0)+'/'+reviveNeed(q),spiritPort(q.elem,96,q.vr));const bt=el('<button class="btn pri">よみがえらせる</button>');bt.onclick=()=>{if(!(S.mebuki>0))return;if((ATTR[q.elem]||0)<reviveNeed(q))return toast(ELEM[q.elem].name+'の力が足りません（'+Math.floor(ATTR[q.elem]||0)+'/'+reviveNeed(q)+'）','warn');if(calledToday())return toast(S.mebukiDay===callDay()?'めぶきのしずくをつかえるのは、1日に1回です':'きょうは、なかまを呼んだので、つかえません','warn');S.mebuki--;S.mebukiDay=callDay();closeSheet();{const pv=S.summon;S.summon={rev:1,lost:q.name,mebuki:1};doSummon();S.summon=pv}sfx('level')};row.appendChild(bt);ls.querySelector('.rows').appendChild(row)}
  body.appendChild(ls)}
function rowEl(title,desc,img,html){const r=el(`<div class="row">${img?'<img alt="">':''}<div class="tx"><b></b><small></small></div></div>`);if(img)r.querySelector('img').src=img;ckSet(r.querySelector('b'),title);if(html)r.querySelector('small').innerHTML=html+esc(desc||'');else r.querySelector('small').textContent=desc||'';return r}
/* カミサマの値段：花は高め、畑・りんごの苗は買うごとに上がる（りんごの苗は10から、1本ごとに+2） */
function shopPrice(id,k){let t=0;for(let i=0;i<k;i++){if(id==='farm')t+=4+Math.floor(((S.farmBuy||0)+i)/3);/* 畑は3こ買うごとに1ポイント上がる */else if(id==='fruit')t+=10+2*((S.fruitBuy||0)+i);else if(FLOWERS.has(id))t+=BL[id].sp;/* 花の種の値段は、表の sp */else t+=BL[id].cost}return t}
/* メニューの中の画面：見出しの左に、小さな「もどる」 */
function sheetBack(){const bk=el('<button class="btn back" aria-label="メニューにもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};$('#sheetTitle').before(bk)}
function renderSheet(){
  if(!sheet)return;const body=$('#sheetBody');const cqf=document.activeElement&&document.activeElement.id==='craftQ'?document.activeElement.selectionStart:null,cst=body.scrollTop;/* 名前でさがす欄に入力中なら、作りなおしたあとも、そのまま */body.innerHTML='';for(const b of document.querySelectorAll('#sheetWrap header .back'))b.parentNode.removeChild(b);const T=$('#sheetTitle');
  if(sheet==='vshop'){
    if(!visitHere())return closeSheet();const p=VISITORS[S.st2.visit.who];T.textContent=p[0]+'のお店';
    body.appendChild(el('<p class="note">草原の花のたね・りんごの苗と、パワーを交換します。</p>'));
    const d=el('<div class="sec"><h3>花のたね・りんごの苗</h3><div class="rows"></div></div>'),rows=d.querySelector('.rows');body.appendChild(d);
    for(const id of PLANTS.filter(id=>id!=='tree')){const b=BL[id],r=rowEl(iname(id),'所持：'+inv(id),iconURL(id));helpify(r,withAttr(id,b.desc||''));const bx=el('<div style="display:flex;flex-direction:column;gap:4px;flex:none"></div>');r.appendChild(bx);rows.appendChild(r);
      for(const k of [1,5]){const c=shopPrice(id,k),bt=el('<button class="btn'+(k===1?' pri':'')+'"></button>');bt.textContent='×'+k+'　'+SP(c);lackOn(bt,lackPt(c));bt.onclick=()=>{if(S.pt<c)return;S.pt-=c;if(id==='fruit')S.fruitBuy=(S.fruitBuy||0)+k;S.unlocked[id]=true;giveItem(id,k);sfx('power');renderSheet();renderPalette()};bx.appendChild(bt)}}
    return}
  if(sheet==='shop'){
    T.textContent='カミサマと交換';
    {const sb=el('<div class="godSay"><b>カミサマ</b><span></span></div>');sb.querySelector('span').textContent='「'+shopSay+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">カミサマの持ち物と、パワーを交換します。</p>'));
    if(S.flags.traded&&(S.subSt||{}).trade===2){const eb=el('<button class="btn" id="shopEnd" style="width:100%;margin-bottom:8px">交換をおわる</button>');eb.onclick=()=>{sfx('next');closeSheet();checkQuest()};body.appendChild(eb)}// チュートリアル：買いおわったら帰る
    const sec=(t)=>{const d=el('<div class="sec"><h3></h3><div class="rows"></div></div>');d.querySelector('h3').textContent=t;body.appendChild(d);return d.querySelector('.rows')};
    const trade=()=>{shopSay=pick(GOD_BUY);S.flags.traded=true;sfx('furn');checkQuest();renderSheet();renderPalette()};
    const row=(rows,title,desc,img,done)=>{const r=rowEl(title,desc,img);if(done)r.classList.add('done');const bx=el('<div style="display:flex;flex-direction:column;gap:4px;flex:none"></div>');r.appendChild(bx);rows.appendChild(r);return bx};
    const btn=(bx,label,dis,fn,pri)=>{const b=el('<button class="btn'+(pri?' pri':'')+'"></button>');b.textContent=label;b.disabled=!!dis;if(fn)b.onclick=fn;bx.appendChild(b)};
    const r1=sec('ブロック・種・苗');
    for(const id of BLOCKS.filter(i=>S.unlocked[i]&&!BL[i].qty&&i!=='window').concat(S.feat.plant?PLANTS.filter(id=>lvOK(id)&&plantOK(id)&&(WD===0||S.free||id==='tree')):[])/* 花・りんごの苗は草原だけ（火山では、温泉宿のお客さんが売る）。木の苗は、火山では杉の苗 *//* 花・りんごの木・木の苗は草原だけ（火山では、温泉宿のお客さんが売る） */){const b=BL[id];
      const bx=row(r1,iname(id),'所持：'+inv(id),iconURL(id));helpify(bx.parentNode,withAttr(id,b.desc||''));
      for(const k of [1,5]){const c=shopPrice(id,k);btn(bx,'×'+k+'　'+SP(c),S.pt<c,()=>{S.pt-=c;if(id==='farm')S.farmBuy=(S.farmBuy||0)+k;if(id==='fruit')S.fruitBuy=(S.fruitBuy||0)+k;giveItem(id,k);trade()},k===1)}}
    if(cnt('farm')||inv('farm')){const rs=sec('作物のたね');for(const k in CROPS){if(!cropOn(k))continue;const c=CROPS[k];const bx=row(rs,c.name+'のたね','所持：'+cseed(k)+'・'+c.desc,seedIcon(k));for(const n of [1,5]){const cst=2*n;btn(bx,'×'+n+'　'+SP(cst),S.pt<cst,()=>{S.pt-=cst;giveItem('seed:'+k,n);trade()},n===1)}}}
    {const TL=WD===0?[['mover','ひっこしミトン','家具・建物をタップして、うつしたい所をタップすると、すぐそこへうつる','mover']]:WD===1?[['bulk','ひろびろハケ','指でなぞった範囲を、ブロックでまとめてぬれる。種もまとめて植えてもらえる','hake'],['swap','つけかえトンカチ','つながっている柵・塀・家の壁・道・床を、まとめてべつの種類にかえる。はずした物は、おそなえ箱にもどる','swap']]:[];/* 道具は土地ごと（草原：ひっこしミトン・だんさスコップ、火山：ひろびろハケ・つけかえトンカチ）。もらった道具は、ほかの土地でも使える */
      if(TL.length){const r3=sec('道具');for(const T of TL){const bx=row(r3,T[1],T[2],toolIcon(T[3]),S[T[0]]);if(S[T[0]])btn(bx,'もらった',true);else btn(bx,SP(3000),S.pt<3000,()=>{S.pt-=3000;S[T[0]]=true;applyFeats();toast(T[1]+'をもらった！「どうぐ」から使える','good');trade()},1)}
        if(WD===0){const b2=row(r3,'だんさスコップ','段差をけずる・もる工事を、せいれいにたのめる。1マスでパワー50',toolIcon('scoop'),S.dig);if(S.dig)btn(b2,'もらった',true);else btn(b2,SP(1000),S.pt<1000,()=>{S.pt-=1000;S.dig=true;applyFeats();toast('だんさスコップをもらった！','good');trade()},1)}}}/* だんさスコップは草原のカミサマから（ほかの土地でも使える） */
    if(S.enemyOn||S.nights>0){const r7=sec('まもりの品'),bx=row(r7,'まよけのハーブ',HERBDESC+'（所持：'+(S.herb||0)+'）',herbIco());btn(bx,SP(200),S.pt<200,()=>{S.pt-=200;S.herb=(S.herb||0)+1;(S.seenIt||(S.seenIt={}))['x:herb']=1;toast('まよけのハーブをもらった','good');trade()},1)}
    if(WD===0&&(S.bossKills||0)>=1){const r5=sec('とくべつな交換'),bx=row(r5,'めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null);btn(bx,SP(400),S.pt<400,()=>{S.pt-=400;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good');trade()},1)}/* 草原には、おまつりがない。しずくはカミサマから */
    if(WD===1&&(qAt('fest')||S.cleared)){const r5=sec('とくべつな交換');/* 火山のふもと：「おまつりをひらこう」のあとから、いつでもおまつり。めぶきのしずく・ごちそうは、おまつりの日に、せいれいの屋台で */
      {const done=S.festDay!=null&&S.festDay>=dayNo(),bx=row(r5,'おまつり','つぎの日が、おまつりになる',null,done);btn(bx,done?(S.festDay>dayNo()?'あしたはおまつり':'きょうはおまつり'):SP(200),done||S.pt<200,()=>{S.pt-=200;S.festDay=dayNo()+1;sfx('good');toast('あしたは、おまつり！','good');trade()},1)}/* たのんだつぎの日の朝7時に、おまつりがはじまる */
      }
    if(WD===1&&(S.lv>=5||(S.bossKills||0)>=1||S.flags.hinoDown)){const r6=sec('カミサマのかざり');const DECO=[['furin',120],['ema',150],['kadomatsu',180],['komainu',200]]/* 和風のかざりは火山だけ */,d=dayNo();
      for(const[id,c]of[DECO[d%DECO.length],DECO[(d+1)%DECO.length]]){const bx=row(r6,BL[id].name,BL[id].desc+'（持っている数：'+(inv(id)||0)+'）',iconURL(id));btn(bx,SP(c),S.pt<c,()=>{S.pt-=c;giveItem(id,1);toast(BL[id].name+'をもらった','good');trade()},1)}
      }/* 終盤のパワーの使い道 */
  }else if(sheet==='inv'){
    T.textContent='もちもの';
    {/* 素材と食べ物も、ここで見られる */const MOBJ={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc',kinoko:'kinoko'},mic=k=>ICONS[k]||(MOBJ[k]&&BL[MOBJ[k]]?iconURL(MOBJ[k]):null);
      const sec=(title,items,empty)=>{const g=el('<div class="grid"></div>'),hd=el('<b style="grid-column:1/-1;margin-top:4px"></b>');hd.textContent=title;g.appendChild(hd);if(!items.length){const p=nodata('box',empty);p.style.gridColumn='1/-1';g.appendChild(p)}for(const[img,emo,nm,ct,tap]of items){const b=el(tap?'<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>':'<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(tap)b.onclick=()=>{sfx('tap');tap()};if(img)b.querySelector('img').src=img;else b.querySelector('img').replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',innerHTML:pxi('box')}));b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(g)};
      sec('素材'+capTxt(matTot(),matCap()),Object.keys(MATN).filter(k=>(S.mat[k]||0)>0).map(k=>[mic(k),'',MATN[k],S.mat[k],()=>otakiPop(k)]),'素材は、まだないよ');/* 素材をタップすると、おたきあげのメニュー */
      {const q=S.otakiQ||{},L=[];const add=o=>{for(const k in o)if(o[k])L.push(MATN[k]+o[k])};add(q);S.res.forEach(r=>r.otaki&&add(r.otaki));if(L.length){const p=el('<p class="note"></p>');p.textContent='おたきあげまち：'+L.join('・');body.appendChild(p)}}
      sec('食べ物'+capTxt(S.food,foodCap()),Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0).map(k=>[foodIc(k),FOODS[k].e,FOODS[k].name,S.fs[k]]),'食べ物は、まだないよ')}
    gearInv(body);/* そうび */
    const grid=el('<div class="grid"></div>');grid.appendChild(Object.assign(el('<b style="grid-column:1/-1;margin-top:10px"></b>'),{textContent:'おそなえ箱'}));
    const groups=[['ブロック',BLOCKS.filter(id=>inv(id)>0)],['うえる',PLANTS.filter(id=>inv(id)>0)],...furnitureGroups(FURN.filter(id=>inv(id)>0)),['まもり',AMMO.filter(id=>inv(id)>0)]];
    const ids=groups.flatMap(([,items])=>items);
    for(const [name,ids]of groups){if(!ids.length)continue;const heading=el('<b style="grid-column:1/-1;margin-top:8px"></b>');heading.textContent=name;grid.appendChild(heading);for(const id of ids){
      const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');
      b.querySelector('img').src=iconURL(id);b.querySelector('.nm').textContent=iname(id);b.querySelector('.ct').textContent=inv(id);
      if(!inv(id))b.classList.add('zero');
      b.onclick=()=>{sfx('tap');itemPop(id)};grid.appendChild(b)}}
    for(const k of Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0)){const sid='seed:'+k,b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');/* たねも、ほかのアイテムと同じくアイコンで */
      b.querySelector('img').src=seedIcon(k);b.querySelector('.nm').textContent=CROPS[k].name+'のたね';b.querySelector('.ct').textContent=cseed(k);if(!cseed(k))b.classList.add('zero');b.onclick=()=>{sfx('tap');itemPop(sid)};grid.appendChild(b)}
    if((S.mseed||0)>0){const b=el('<button class="slot"><span class="ct"></span><img src="'+seedIco()+'" style="width:40px;height:40px;display:block;margin:0 auto"><span class="nm">ふしぎな種</span></button>');b.querySelector('.ct').textContent=S.mseed;b.onclick=()=>{sfx('tap');itemPop('mseed')};grid.appendChild(b)}
    if((S.horn||0)>0){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm">よびごえの角笛</span></button>');b.querySelector('img').src=hornIco();b.querySelector('.ct').textContent=S.horn;b.onclick=()=>{sfx('tap');itemPop('horn')};grid.appendChild(b)}
    if((S.herb||0)>0){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm">まよけのハーブ</span></button>');b.querySelector('img').src=herbIco();b.querySelector('.ct').textContent=S.herb;b.onclick=()=>{sfx('tap');itemPop('herb')};grid.appendChild(b)}
    body.appendChild(grid);
    if(typeof sheetArg==='string'&&(sheetArg==='mseed'?(S.mseed||0)>0:sheetArg.startsWith('seed:')?!!CROPS[sheetArg.slice(5)]:ids.includes(sheetArg))){const a=sheetArg;sheetArg=null;itemPop(a)}/* ほかの画面から、物をえらんで開いたときは、そのメニューも出す */
  }else if(sheet==='craft'){
    T.textContent='依頼ボード';
    body.appendChild(el('<p class="note">'+(orderLock()?'いまは「'+BL[orderLock()].name+'」だけたのめます。':'できたものはおそなえ箱に入ります。')+'</p>'));
    const bd=el('<div class="board"></div>');
    for(let n=0;n<boardMax();n++){const o=S.orders[n];
      if(!o){bd.appendChild(el('<div class="paper empty"><span>あき</span></div>'));continue}
      const w=S.res.find(r=>r.id===o.worker);const p=el(`<div class="paper" style="--r:${[-2,1.5,-1,1,-1.5][n]}deg"><img alt=""><b></b><small></small><div class="bar"><i></i></div></div>`);
      p.querySelector('img').src=iconURL(o.type);p.querySelector('b').textContent=BL[o.type].name+'をつくって';p.querySelector('small').textContent=w?w.name+'が作っています':jobBlocked('board')?'依頼ボードへ行けません':makerOf(o.type)?ELEM[BL[o.type].maker].name+'のせいれいを待っています':'作り手を待っています';
      {const cx=el('<button class="cx" aria-label="やめる">×</button>');cx.onclick=e=>{e.stopPropagation();cancelOrder(o.id)};p.appendChild(cx)}/* 依頼をやめる */
      const bi=p.querySelector('.bar i');bi.style.width=Math.min(100,o.prog/o.need*100)+'%';bi.style.background='#e0a43a';bd.appendChild(p)}
    body.appendChild(bd);
    const s2=el('<div class="sec"><h3>依頼を書く</h3><div class="cfind"><input id="craftQ" type="search" placeholder="名前でさがす" autocomplete="off"><button class="ctab cnow">いま作れる</button><button class="ctab cflt"></button></div><div class="ctabs"></div><div class="rows"></div></div>');
    const CIDS=CRAFT_TABS.flatMap(([,ids])=>ids),cShow=id=>recipeKnown(id)&&(lvOK(id)||S.recipes[id])&&recShown(id);
    const gearOn=WD===1||GEAR_IDS.some(id=>S.recipes&&S.recipes[id]);/* そうびは火山から */
    const tagOn=t=>t==='ぜんぶ'||(t!=='そうび'||gearOn)&&CIDS.some(id=>cShow(id)&&tagsOf(id).includes(t));
    craftTags=craftTags.filter(tagOn);
    {const q=s2.querySelector('#craftQ'),fb=s2.querySelector('.cfind .cflt'),nb=s2.querySelector('.cfind .cnow');if(craftCan)nb.classList.add('on');nb.onclick=()=>{craftCan=!craftCan;renderSheet()};q.value=craftQ;
      q.oninput=e=>{if(e.isComposing)return;craftQ=q.value;renderSheet()};q.addEventListener('compositionend',()=>{craftQ=q.value;renderSheet()});/* 日本語の変換中は作りなおさない */
      fb.textContent=craftTags.length?'しぼりこみ（'+craftTags.length+'）':'しぼりこみ';if(craftTags.length)fb.classList.add('on');fb.onclick=()=>craftPop(CRAFT_TAGS.filter(t=>t!=='ぜんぶ'&&tagOn(t)))}
    s2.querySelector('.ctabs').remove();
    const kana=x=>x.replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)),cq=kana(craftQ.trim());/* カタカナもひらがなでさがせる */
    recToggle(s2,CIDS.filter(id=>recipeKnown(id)&&(lvOK(id)||S.recipes[id])));s2.querySelector('.rows').before(s2.querySelector('.recsw')||document.createTextNode(''));
    CRAFTN=0;let gPrev=null;for(const id of CIDS){const b=BL[id];if(!craftInTag(id)||cq&&!kana(b.name).includes(cq)||craftCan&&!canMakeNow(id))continue;
      if(!recipeKnown(id)||!lvOK(id)&&!S.recipes[id]||!recShown(id))continue;CRAFTN++;{const h=gearBoardHead(id,gPrev);gPrev=id;if(h)s2.querySelector('.rows').appendChild(h)}/* そうび：わくごとの見出し *//* 思いついていない・レベル不足は出さない */
      /* レシピをまだ知らない */
      const r=helpify(rowEl(b.name+(b.qty?'×'+b.qty:'')+'　所持：'+inv(id),'',iconURL(id),b.mat?matNeedHTML(b.mat)+(b.sand?'<span class="mneed" style="margin-right:6px;'+((S.sand||0)>=b.sand?'':'color:#c0392b;font-weight:700')+'">やすらぎの砂（'+(S.sand||0)+'/'+b.sand+'）</span>':'')+Object.keys(b.food||{}).map(k=>'<span class="mneed" style="margin-right:6px;'+((S.fs[k]||0)>=b.food[k]?'':'color:#c0392b;font-weight:700')+'">'+FOODS[k].name+'（'+(S.fs[k]||0)+'/'+b.food[k]+'）</span>').join('')+' ':''),withAttr(id,b.desc));
      if(makerOf(id)){const has=elemCount(b.maker)>0,mk=el('<span class="pxpill" style="display:inline-flex;align-items:center;vertical-align:middle;margin-right:4px;border-radius:9px;padding:0 5px 0 1px;font-size:10px;line-height:16px;color:#fff"><img alt="" style="width:16px;height:16px;margin:0"><b style="font-weight:700"></b></span>');mk.classList.add(has?'pm-'+b.maker:'pm-none');/* 色は、わくの絵（index.html の .pxpill.pm-〇〇） */mk.querySelector('img').src=spiritPort(b.maker,48);if(!has)mk.querySelector('img').style.filter='grayscale(1) opacity(.7)';mk.querySelector('b').textContent=ELEM[b.maker].name+(has?'':'・いない');r.querySelector('small').prepend(mk)}/* 作るせいれいの属性：アイコンで短く */
      const bt=el('<button class="btn pri"></button>');
      if(!lvOK(id)){bt.textContent='村Lv'+b.lv;bt.disabled=true;r.classList.add('done')}else{bt.textContent='はる　'+SP(b.pc);bt.onclick=()=>orderFurn(id);if(orderLock()&&orderLock()!==id)bt.disabled=true;else lackOn(bt,lackPt(b.pc)||(S.orders.length>=boardMax()?'依頼ボードがいっぱいです':'')||(!matOK(b.mat)?'素材が足りません':''))}
      r.appendChild(bt);s2.querySelector('.rows').appendChild(r)}
    if(craftTags.includes('そうび'))gearBoardUp(s2.querySelector('.rows'));/* そうびの強化 */
    if(!s2.querySelector('.rows').children.length)s2.querySelector('.rows').appendChild(nodata('paper',cq||craftCan||craftTags.length?'みつからないよ':'まだ作れるものがないよ'));
    body.appendChild(s2);
    {const cp=document.getElementById('craftPop');if(cp)cp.upd()}/* しぼりこみのポップアップの数も新しく */
    if(cqf!==null){const q=s2.querySelector('#craftQ');q.focus();try{q.setSelectionRange(cqf,cqf)}catch(e){}body.scrollTop=cst}
    if(S.feat.inv){const ib=el('<button class="btn">もちものを見る</button>');ib.onclick=()=>openSheet('inv');body.appendChild(ib)}
  }else if(sheet==='vill'){
    T.textContent='村のようす';
    /* 項目ごとにまとめる：レベル／目標の進みぐあい／たくわえ／きょう */
    const L=S.lv,a=LV_XP[L-1],b=L>=maxLv()?a:LV_XP[L]??a,ic=q=>{const n=document.querySelector('.hud '+q);return n?n.cloneNode(true).outerHTML:''},bar=(v,c)=>'<div class="vlBar"><i style="width:'+clamp(v,0,1)*100+'%;background:'+c+'"></i></div>';
    const V=el('<div class="vl"></div>');
    V.appendChild(el('<div class="vlHero"><div class="vlLv">'+ic('.lvb svg')+'<small>村レベル</small><b>'+L+'</b></div><div class="vlHw">'+(b>a?bar((S.totalPt-a)/(b-a),'#7ee08a')+'<small>つぎのレベルまで　あと '+Math.max(0,Math.ceil(b-S.totalPt))+'</small>'+nextLvHtml(L+1):bar(1,'#7ee08a')+'<small>さいこうレベル</small>')+'</div></div>'));
    {const sk=suteki();V.appendChild(el('<div class="vlSec"><h4>すてき度</h4><div class="vlRow"><span>'+'★'.repeat(sk.st)+'☆'.repeat(5-sk.st)+'</span><b>'+sk.pt+'</b></div></div>'))}
    const sh=Math.min(3,S.shards||0);
    V.appendChild(el('<div class="vlSec"><h4>目標</h4><div class="vlRow"><span>'+SHN()+'</span><b class="vlSh">'+[0,1,2].map(k=>'<i class="'+(k<sh?'on':'')+'"></i>').join('')+'</b></div></div>'));
    const tile=(icon,lb,v,sub,br)=>'<div class="vlT"><div class="hd">'+icon+'<span>'+lb+'</span></div><div class="v">'+v+'</div>'+(br||'')+(sub?'<small>'+sub+'</small>':'')+'</div>';
    const fc=foodCap(),mc=matCap();
    V.appendChild(el('<div class="vlGrid">'+tile(ic('.stk[title="食料"] svg'),'食料',S.food+'<small> / '+fc+'</small>','',bar(fc?S.food/fc:0,'#f3d27a'))+tile('','素材',(()=>{const im=[...document.querySelectorAll('.hud .stk[title="素材"] .ic')].map(n=>{const c=n.cloneNode(true);c.classList.add('vlMi');return c.outerHTML});return (im[0]||'')+(S.mat.wood||0)+'<span style="display:inline-block;width:10px"></span>'+(im[1]||'')+(S.mat.stone||0)+(bambooOn()?'<span style="display:inline-block;width:10px"></span>'+(im[2]||'')+(S.mat.bamboo||0):'')})(),'素材箱 '+matTot()+' / '+mc,bar(mc?matTot()/mc:0,'#c9a27a'))+tile(ic('.stat[title="パワー"] svg'),'パワー',S.pt,'ためた合計 '+Math.floor(S.totalPt))+tile(ic('.stat[title="せいれい"] svg'),'せいれい',S.res.length+'<small> 人</small>','')+'</div>'));
    V.appendChild(el('<div class="vlDay"><span>きょう</span><b>'+(S.today?DAYEV[S.today][0]+' '+DAYEV[S.today][1]:(S.rain?pxi('rain','wx wx-rain')+'雨':rainbowToday()?pxi('rainbow','wx wx-bow')+'虹':pxi('sun','wx wx-sun')+'ふつうの日'))+'</b></div>'));
    body.appendChild(V);
  }else if(sheet==='attrdetail'){
    T.textContent='属性の内訳';
    const sources={};for(const k of ELEM_KEYS)sources[k]={};
    const add=(k,name,v)=>{const a=sources[k];if(!a)return;const r=a[name]||(a[name]={n:0,v:0});r.n++;r.v+=v};
    for(let j=0;j<W*H;j++){const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||FLOWERS.has(id)&&isBud(j))continue;for(const k in b.attr||{})if(b.attr[k]>0)add(k,b.name,b.attr[k])}
    body.appendChild(el('<p class="note">マップにあるものを集計。花は咲いてから加算されます。</p>'));
    for(const k of ELEM_KEYS){const sec=el('<div class="sec"></div>');const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1));sec.appendChild(h);for(const [name,r]of Object.entries(sources[k]))sec.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));if(!Object.keys(sources[k]).length)sec.appendChild(el('<p class="note">まだありません</p>'));body.appendChild(sec)}
  }else if(sheet==='stock'){/* そうこ：いま、なにがいくつあるか */
    T.textContent='そうこ';
    const box=(title,n,cap,items,empty)=>{const sec=el('<div class="sec stockSec"><div class="stockHead"><h3></h3><span class="stockN"></span></div><div class="gauge stockBar"><i></i></div><div class="grid"></div></div>');sec.querySelector('h3').textContent=title;sec.querySelector('.stockN').textContent=cap>0?n+' / '+cap:'箱がありません';sec.querySelector('.stockBar i').style.width=(cap>0?Math.min(100,n/cap*100):0)+'%';const g=sec.querySelector('.grid');
      if(!items.length){const p=nodata('box',empty);p.style.gridColumn='1/-1';g.appendChild(p)}
      for(const[img,emo,nm,ct]of items){const b=el('<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(img)b.querySelector('img').src=img;else{const im=b.querySelector('img');im.replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',textContent:emo}))}b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(sec)};
    const fk=Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0),raw=fk.filter(k=>!FOODS[k].dish),dish=fk.filter(k=>FOODS[k].dish),fi=k=>[foodIc(k),FOODS[k].e,FOODS[k].name,S.fs[k]];
    box('食料箱',S.food,foodCap(),[...raw.map(fi),...dish.map(fi)],'食べ物は、ありません');
    const mk=Object.keys(S.mat).filter(k=>(S.mat[k]||0)>0&&MATN[k]);box('素材箱',matTot(),matCap(),mk.map(k=>[ICONS[k]||null,'',MATN[k],S.mat[k]]),'素材は、ありません');
    if(S.sand){const p=el('<p class="note"></p>');p.textContent='やすらぎの砂：'+S.sand;body.appendChild(p)}
    const hold=S.res.filter(r=>heldN(r)>0);if(hold.length){const p=el('<p class="note"></p>');p.textContent='せいれいが運んでいるとちゅう：'+hold.map(r=>r.name+'（'+[...Object.entries(r.carry&&typeof r.carry==='object'?r.carry:{}).map(([k,n])=>FOODS[k].name+n),...Object.entries(r.cmat||{}).map(([k,n])=>MATN[k]+n),...Object.entries(r.citem||{}).map(([k,n])=>itemName(k)+n)].join('・')+'）').join('、');body.appendChild(p)}
  }else if(sheet==='people'){
    T.textContent='せいれい '+S.res.length+'人';
    const a=el('<div class="sec"><h3>この土地の属性</h3><div class="attr"></div></div>');const g=a.querySelector('.attr');
    for(const k of ELEM_KEYS){const v=ATTR[k],n=needFor(k),p=Math.min(100,v/n*100);
      g.insertAdjacentHTML('beforeend',`<span class="el" style="background:${ELEM[k].col}">${ELEM[k].name}</span><div class="bar"><i style="width:${p|0}%;background:${ELEM[k].col}"></i></div><small>${Math.floor(v)}/${n}</small>`);
      for(const c of[...g.children].slice(-3)){c.style.cursor='pointer';c.onclick=()=>{sfx('tap');attrPop(k)}}}/* 属性をタップすると、内訳のポップアップ */
    body.appendChild(a);
    const rows=el('<div class="rows"></div>');
    for(const r of S.res){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>{closeSheet();setMode('look');centerOn(r.x*TS,r.y*TS)};rows.appendChild(row)}
    body.appendChild(rows);
    lostSec(body);
  }else if(sheet==='grave'){
    const j=sheetArg,d=S.dyn[j]||{},nm=d.name||'せいれい';T.textContent=nm+'のお墓';
    body.appendChild(el('<p class="story">'+nm+'は、なかまが神殿へはこんで、おみおくりしてくれます。<br>よみがえらせられるのは、おみおくりのあとです。</p>'));
  }else if(sheet==='house'){
    const h=HOUSES[sheetArg],L=h?houseRes(h):[];if(!h)return closeSheet();
    {const cap=houseCap(h),C=houseComfort(h);T.textContent='おうち';
     const cs=el('<div class="sec"><h3>住み心地</h3><p class="comfy"><span class="stars"></span><b></b></p><div class="recs"></div><p class="note" style="margin-top:8px"></p></div>');
     cs.querySelector('.stars').textContent=comfyStars(C.v);cs.querySelector('b').textContent=C.v+' / '+COMFMAX;
     const RN=[...new Set(SPOTI.filter(t=>t.sp.room&&h.inside.has(t.j)&&t.sp.need.every((nd,i)=>t.found[i].filter(q=>h.inside.has(q)).length>=nd[1])).map(t=>t.sp.n))];/* この家にそろった部屋 */
     for(const[a,b]of[['部屋',RN.length?RN.join('・'):'なし'],['ベッド',C.bed+' / '+cap+'こ'],['家具・かざり',C.kinds+'しゅるい'],['床',C.floorPct+'%'],['いまの人数',L.length+'人']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;cs.querySelector('.recs').appendChild(d)}
     cs.querySelector('.note').textContent=C.over?'ベッドが多すぎて、きゅうくつ！ 住み心地が大きく下がる':'つかれのとれる速さ・起きたときのパワー：'+(.6+C.v/100*.9).toFixed(1)+'倍'+(C.v>=180?'・ぐっすり眠れて、朝にたのしさ+10':C.v<90?'・たのしさ-5':'')+(C.webs?'・クモの巣（'+C.webs+'）':'');/* 効果は数字で */
     body.appendChild(cs)}
    {const bs=[...h.inside].filter(j=>BEDSET.has(S.obj[j]));if(bs.length){const sec=el('<div class="sec"><h3>ベッド</h3><div class="rows"></div></div>');bs.forEach((j,k)=>{const o=bedOwner(j),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');row.querySelector('.dot').style.cssText=o?'background:#f6f1e6 url('+spiritPort(o.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[o.elem].col:'background:#efe6d2';row.querySelector('b').textContent='ベッド'+(k+1);row.querySelector('small').textContent=o?o.name+'のベッド':'だれでも使える';row.onclick=()=>openSheet('bed',j);sec.querySelector('.rows').appendChild(row)});body.appendChild(sec)}}
    if((S.lv||1)>=13){const sec=el('<div class="sec"><h3>屋根の色</h3><div class="roofc" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>'),k=hKey(h),cur=(S.roofCol||{})[k]||'';
      for(const[id,nm]of[['','もとの色'],...Object.entries(ROOFCOL).map(([a,b])=>[a,b.n])]){const b=el('<button class="btn'+(cur===id?' pri':'')+'"></button>');b.textContent=nm;b.onclick=()=>{sfx('tap');S.roofCol||(S.roofCol={});if(id)S.roofCol[k]=id;else delete S.roofCol[k];h._rc=null;dirty=true;renderSheet()};sec.querySelector('.roofc').appendChild(b)}
      body.appendChild(sec)}/* 屋根の色（村レベル13から） */
    if(!L.length)body.appendChild(el('<p class="story">いまは、だれもいない</p>'));
    const rows=el('<div class="rows"></div>');
    for(const r of L){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中')+'・好きな家具：'+BL[likeF(r)].name+(hasLikeF(h,r)?' ♥あり'+(COMFY[likeF(r)]?'（その家具のポイント2倍）':''):'');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>openSheet('res',r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='clear'){T.textContent=storyTreeName();
    const rows=el('<div class="rows"></div>');for(const[t,ok]of(WD||cnt('tower')>=1?clearConds():towerConds())){const r=el('<div class="row"><div class="tx"><b></b></div></div>');ckSet(r.querySelector('b'),(ok?'✓ ':'・')+t);if(ok)r.classList.add('done');rows.appendChild(r)}body.appendChild(rows);
  }else if(sheet==='bed'){const j=sheetArg;if(!BEDSET.has(S.obj[j]))return closeSheet();/* よぞらのベッドも */
    const o=bedOwner(j);T.textContent='ベッド';

    const rows=el('<div class="rows"></div>'),set=id=>{const B=S.bedOwn||(S.bedOwn={});for(const k in B)if(B[k]===id)delete B[k];if(id==null)delete B[j];else B[j]=id;sfx('next');renderSheet()};
    {const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot" style="background:#efe6d2"></span><div class="tx"><b></b><small></small></div></button>');ckSet(row.querySelector('b'),(o?'':'✓ ')+'だれでも');row.querySelector('small').textContent='あいていれば、だれでも眠れる';row.onclick=()=>set(null);rows.appendChild(row)}
    for(const r of S.res){const mb=myBed(r),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      ckSet(row.querySelector('b'),(o===r?'✓ ':'')+r.name+'  Lv'+rLv(r));row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(mb===j?'このベッド':mb>=0?'ほかのベッドがある':'ベッドなし');
      row.onclick=()=>set(r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='res'){
    const r=S.res.find(q=>q.id===sheetArg);if(!r)return closeSheet();
    const isNew=sheetArg===NEWRES;T.textContent=isNew&&r.back?r.name+'がもどってきた！  Lv'+rLv(r):(isNew?'あたらしいなかま！ ':'')+r.name+'  Lv'+rLv(r);
    const box=el(`<div class="row"><span class="dot"></span><div class="tx"><b></b><small></small></div></div>`);
    box.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96,r.vr)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
    box.querySelector('b').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
    box.querySelector('small').textContent=r.hunger<200?'おなか：危険！':r.hunger<500?'おなか：少なめ':'';
    box.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r)+spiritXpGaugeHTML(r));body.appendChild(box);
    if(!isNew){const sy=el('<p class="story" style="margin:6px 0 2px"></p>');sy.textContent='「'+sayLine(r)+'」';body.appendChild(sy)}
    {const lv=rLv(r);
     const gOn=WD===1||!!(r.gear&&GSLOTK.some(k=>r.gear[k]))||gearList().length>0;if(!gOn&&resTab===3)resTab=0;/* そうびは火山から */const tb=el('<div class="ctabs"></div>');['ステータス','プロフィール','強化',...(gOn?['そうび']:[])].forEach((nm,i)=>{const t=el('<button class="ctab'+(i===resTab?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{resTab=i;sfx('next');renderSheet()};tb.appendChild(t)});body.appendChild(tb);/* ステータスと、得意・好きなものは別のタブ */
     if(resTab===3)gearSheet(body,r);
     else if(resTab===2){const sec=el('<div class="sec"></div>'),cost=15+10*(r.boost||0),B=r.bst||(r.bst={}),ST=[['atk','攻撃力'],['pow','はたらく速さ'],['spd','移動速度'],['sta','スタミナ'],['cap','持てる数']].filter(([k])=>k!=='atk'||r.elem==='fire');/* 攻撃力は火の子だけ */
       for(const[k,nm]of ST){const n=B[k]||0;const row=el('<div class="row" style="align-items:center"><div class="tx"><b></b><small></small></div></div>');row.querySelector('b').textContent=nm+'  +'+n;sec.appendChild(row)}
       const bw=el('<div class="row" style="justify-content:center"><button class="btn pri"></button></div>'),b=bw.querySelector('button');
       b.textContent='パワーをそそぐ（'+SP(cost)+'）';lackOn(b,lackPt(cost));/* 強化に上限はない */
       b.onclick=()=>{if(S.pt<cost)return toast('パワーが足りません（'+SP(cost)+'）');const L=ST;S.pt-=cost;const[k,nm]=L[(Math.random()*L.length)|0],n=B[k]||0,U=UPINC[k],inc=Math.random()<.75?U[0]:U[1];B[k]=n+inc;/* どこが上がるかはランダム。ふえる数は UPINC */
         if(k==='pow'||k==='spd'||k==='sta'){vrInt(r.vr);r.vr[k]=(r.vr[k]||0)+inc}
         r.boost=(r.boost||0)+1;RSC.delete(r);addFloat(r.x,r.y-1.6,nm+'+'+inc,'#9fe8ff');upFx(r,nm,'+'+inc,inc===U[1]);renderSheet()};
       bw.style.gap='8px';bw.style.flexWrap='wrap';sec.appendChild(bw);
       {const sb=el('<button class="btn"></button>'),sn=S.mseed||0;sb.textContent='ふしぎな種をあげる（'+sn+'こ）';lackOn(sb,sn<1?'ふしぎな種がありません':'');sb.onclick=()=>giveSeed(r);bw.appendChild(sb)}/* ふしぎな種も、パワーのとなりからあげられる */
       body.appendChild(sec)}/* パワーで、せいれいを強化 */
     else if(resTab===1){const pf=el('<div class="sec"><div class="stats"></div></div>'),pg=pf.querySelector('.stats');
       for(const[k,v]of[['好きな遊び',LIKES[r.like]],['にがてな遊び',(NIGATE[r.elem]||[]).map(k=>BL[k].name).join('・')||'とくにない'],['好きな家具',BL[likeF(r)].name],['好きな料理',FOODS[favDish(r)].name],['なかよし',(b=>b?b.q.name+'（'+b.v+'）':'まだいない')(bondBest(r))],['村に来た日',r.came?r.came+'日目':'はじめから'],['作ったもの',(r.made||0)+'こ'],['追いはらった「コワイノ」',(r.beat||0)+'体'],['ベッド',myBed(r)>=0?'じぶんのベッドがある':'きまっていない']]){const d=el('<div class="stat" style="display:block"><span style="display:block"></span><b style="display:block;text-align:left;margin-top:2px"></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;pg.appendChild(d)}
       body.appendChild(pf)}
     else{
     const st=el('<div class="sec"><div class="stats sgrid"></div></div>'),g=st.querySelector('.stats');
     for(const tk of[(r.vr||{}).tr,isKey(r.name)?'kizuna':null]){const T2=TRAITS[tk];if(T2){const d=el('<div class="stat" style="display:block"><span style="display:block">特性</span><b style="display:block;text-align:left;margin-top:2px"></b><small style="display:block;color:var(--sub,#888);margin-top:2px"></small></div>');d.querySelector('b').textContent=T2[0];d.querySelector('small').textContent=T2[1];g.appendChild(d)}}/* キーキャラは「きずな」も持つ */
     const Z=rStat(r,lv);for(const[k,v,ic]of[['攻撃力',Z.atk?String(Math.floor(Z.atk+1e-9)):'なし','sword'],['はたらく速さ',String(Math.floor(Z.work)),'hammer'],['移動速度',String(Math.floor(Z.move)),'boot'],['スタミナ',String(Math.floor(Z.sta)),'heart'],['持てる数',heldN(r)+' / '+Z.cap,'box']])g.appendChild(el('<div class="stat sti">'+pxi(ic)+'<span>'+k+'</span><b>'+v+'</b></div>'));/* アイコンつきの2列 */
     body.appendChild(st)}}
    if(isNew){const nb=el('<button class="btn pri">つぎへ</button>');nb.onclick=()=>{sfx('next');closeSheet()};/* 来た子が、ひとことあいさつ（closeSheet の中で。×でとじても同じ） */body.appendChild(nb);return}
    const b=el('<button class="btn pri">おやつをあげる（食料1）</button>');lackOn(b,S.food<1?'食料が足りません':'');b.onclick=()=>{const it=takeFood(1,'raw')[0];endAct(r);r.meal={u:.3*fullN(r),pt:1,e:FOODS[it]?FOODS[it].e:'🍙',items:[it]};startAct(r,null,'eat',-1,{snack:1});addFloat(r.x,r.y-1.6,'わーい！','#ffd38a');sfx('eat');closeSheet()}/* おやつ：よろこんで、その場で食べる */;body.appendChild(b);
  }else if(sheet==='night'){const N=S.ns;if(!N)return closeSheet();T.textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'体'],['追いはらった',N.kill+'体'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?lostSum(N.lost):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[]))g.appendChild(el('<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(g);
    if(N.boss===1&&!N.trial)body.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
  }else if(sheet==='summon'){T.textContent='だれを呼ぶ？';
    body.appendChild(el('<p class="note">力が目もりに届いている属性から、ひとり呼べます。のこりは、つぎの朝にまた呼べます。</p>'));
    const rows=el('<div class="rows"></div>');
    for(const c of sumCands()){const row=rowEl(ELEM[c.el].name+'のせいれい',c.cap?'もう村にいっぱいいる':'属性の力 '+Math.floor(c.v)+' / '+c.n+(c.ok?'':'（まだ足りない）'),spiritPort(c.el,96));if(!c.ok)row.style.opacity=.55;
      const bt=el('<button class="btn pri">呼ぶ</button>');bt.disabled=!c.ok||!S.summon;bt.onclick=()=>{if(!S.summon)return;if(calledToday())return toast(S.mebukiDay===callDay()?'きょうは、めぶきのしずくをつかったので、呼べません':'なかまを呼べるのは、1日に1回です','warn');S.summon={elem:c.el,pick:1};closeSheet();doSummon()};row.appendChild(bt);rows.appendChild(row)}
    lostSec(body,rows);/* しずくを持っていたら、呼ぶ子と同じ枠に、よみがえらせる子もならべる */
    body.appendChild(rows);
  }else if(sheet==='enemy'){const e=S.enemies.find(q=>q.id===sheetArg);if(!e||e.dead){closeSheet();return}const D=EN[e.type];
    T.textContent=D.name;
    const FEAT={yama:'火山のふもとの最後の夜に来る。温泉を冷やす',boss2:'ヌシ様をむかえる準備ができたあと、オオカゲのかわりに来る。とても強い',basic:'せいれいをおそう',fast:'足が速い',thief:'食料や素材をぬすむ',brute:'体力が多い',boss:WD?'5日目の夜、そのあと3日ごとに来る。追いはらうと「ヌシ様の火だね」があらわれ、そのあとは5日ごとに来る。当たると目をまわす':'3日目の夜、そのあと3日ごとに来る。一度追いはらうと、そのあとは5日ごと。とても強い。当たると目をまわす'};
    const st=el('<div class="sec"><h3>ステータス</h3><div class="stats"></div></div>'),g=st.querySelector('.stats');
    for(const[k,v]of[['体力',Math.max(0,Math.ceil(e.hp))+' / '+e.max],['移動速度','×'+D.sp],['壁への攻撃',D.atk+'秒ごとに1'],['せいれいへの攻撃','おなか −'+D.hitN],['特徴',FEAT[e.type]||'']])g.appendChild(el('<div class="stat"><span style="white-space:nowrap">'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(st);
  }else if(sheet==='farm'){const j=sheetArg,d=S.dyn[j];if(!d||S.obj[j]!=='farm'){closeSheet();return}
    const cr=CROPS[cropK(d)];T.textContent=cr?'畑：'+cr.name:'畑';
    body.appendChild(el('<p class="story">'+(!cr?'まだ、なにも植えていない':d.sown===false?(d.paid||cseed(cropK(d))>0?'種まきを待っている':'たねがなくて植えられない'):d.g>=100?'収穫できる':'収穫まであと'+Math.ceil((100-d.g)/(100/cr.days)-.01)+'日・きょうの水やり'+(d.wet>0?'ずみ':'まだ'))+'</p>'));
    if(cr){const n=cr.yield+(NEARMILL.has(j)?1:0)+(S.today==='hosaku'?1:0)+((S.dyn[j]||{}).fb||0);const yr=el('<div class="sec"><div class="stats"><div class="stat"><span>収穫できる数</span><b></b></div></div></div>');yr.querySelector('b').textContent=n+'こ';body.appendChild(yr)}/* いま収穫すると、いくつとれるか */
    if(!cr){const b2=el('<button class="btn pri">おそなえ箱からたねをえらぶ</button>');b2.onclick=()=>{sfx('tap');openSheet('inv',Object.keys(CROPS).filter(cropOn).map(k=>'seed:'+k).find(id=>inv(id)>0)||'seed:imo')};body.appendChild(b2)}
  }else if(sheet==='food'){T.textContent='食料箱';
    body.appendChild(el('<p class="story">'+S.food+'/'+foodCap()+'</p>'));
    const g=el('<div class="rows"></div>');for(const k in FOODS){const n=S.fs[k]||0;if(!n)continue;const f=FOODS[k];const rc=RECIPES.find(R=>R.out===k),r=helpify(rowEl((icURL(f.e)?'':f.e+' ')+f.name+'　×'+n,(f.dish?'料理・':'')+'おなか'+f.v+(f.pw?'・パワー+'+f.pw:'')+(f.fx?'・'+f.fx:''),icURL(f.e)),rc?DISHD(rc):RAWD(k));g.appendChild(r)}body.appendChild(g);
  }else if(sheet==='oven'){
    const j=sheetArg;if(!COOKST.has(S.obj[j]))return closeSheet();if(!S.ovenSet)S.ovenSet={};const cur=S.ovenSet[j];T.textContent=BL[S.obj[j]].name;
    body.appendChild(el('<p class="story">作る料理をえらぶと、せいれいが食料箱の材料で作ってくれる。</p>'));
    {const m=ovenMul(j),pc=Math.round((1-m)*100);body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('料理の速さ（いま）',pc>0?'料理の時間 -'+pc+'%（まわり3マスの料理家具）':'ふつう'))}/* かまど：いまの料理の速さ */
    const rows=el('<div class="rows"></div>');
    for(const R of RECIPES){if(dishSt(R)!==S.obj[j])continue;/* その家具で作る料理だけ */const F=FOODS[R.out],need=needTxt(R),has=Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]);
      const r=helpify(rowEl((icURL(F.e)?'':F.e+' ')+F.name+(cur===R.out?'（作っている）':''),'材料：'+need+' / 作る：'+ELEM[R.el].name+' / 時間：'+R.time+'分'+(F.fx?' / 効果：'+F.fx:'')+(has?'':'・材料が足りない'),icURL(F.e)),DISHD(R));
      const b=el('<button class="btn"></button>');b.textContent=cur===R.out?'やめる':'これを作る';if(cur===R.out)b.classList.add('pri');
      b.onclick=()=>{if(cur===R.out)delete S.ovenSet[j];else S.ovenSet[j]=R.out;sfx('tap');renderSheet()};r.appendChild(b);if(!has&&cur!==R.out){r.style.filter='grayscale(1)';r.style.opacity='.55'}/* 材料が足りない料理はグレー */rows.appendChild(r)}
    body.appendChild(rows);
  }else if(sheet==='manual'){
    T.textContent='ひでんのしょ';
    sheetBack();
    body.appendChild(el(`<div class="sec"><h3>あそびかた</h3><p class="story">あなたはこの土地の新しい<b>守り神</b>。せいれいをふやして土地をよみがえらせ、<b>${WD===0?'御神木':'守護の台座'}</b>を${WD===0?'育てて':'建てて'}<b>ヌシ様</b>をむかえましょう。<br>1本指でドラッグ：移動／2本指：ズーム。</p></div>`));/* あそびかたは最低限だけ。くわしいことは、ほかのタブに */
    {const CAT=[['あそびかた',[]],['せいれい',['せいれいのようす','ステータス','属性と得意なこと']],['くらし・家具',['家具の種類','くらし']],['守り神',['守り神のちから']],['夜と戦い',['夜と「コワイノ」','夜の種類']]];
      if(!CAT.some(c=>c[0]===MANC))MANC='あそびかた';
      const bar=el('<div class="mtabs" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0"></div>');for(const c of CAT){const b=el('<button class="btn"></button>');b.textContent=c[0];if(c[0]===MANC)b.classList.add('pri');b.onclick=()=>{sfx('tap');MANC=c[0];openSheet('manual')};bar.appendChild(b)}
      body.insertBefore(bar,body.children[1]);
      const how=body.querySelector('.story').parentNode;how.hidden=MANC!=='あそびかた';
      const cur=CAT.find(c=>c[0]===MANC);
      for(const[t,items]of MANUAL){if(!cur[1].includes(t))continue;const sec=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sec.querySelector('h3').textContent=t;for(const[a,b]of items){const ok=manMet(a);sec.querySelector('.rows').appendChild(rowEl(ok?a:'？？？',ok?b:'？？？'))}/* まだ出会っていないことは「？？？」 */body.appendChild(sec)}
      if(cur[0]==='くらし・家具'){const sec=el('<div class="sec"><h3>スポット</h3><div class="rows"></div></div>');const on=new Set();for(const t of SPOTJ.values())for(const k of t)on.add(k);const seen=S.spotSeen||{},done=new Set();for(const sp of SPOTS){if(done.has(sp.k)&&!seen[sp.k])continue;done.add(sp.k);sec.querySelector('.rows').appendChild(seen[sp.k]||S.free?rowEl(sp.n+(on.has(sp.k)?'（村にある）':''),sp.how+'を、まわり3マスに置く。'+sp.eff):rowEl('？？？','？？？'))}/* 作ったことのないスポットは、名前も組み合わせも「？？？」 */body.appendChild(sec)}}/* スポットの一覧 */
    {const b=el('<button class="btn">もどる</button>');b.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(b)}
  }else if(sheet==='furn'){const j=sheetArg,o=S.obj[j]||(S.rug||{})[j];if(!o||!BL[o])return closeSheet();T.textContent=BL[o].name;{const te=tagsEl(o);if(te)body.appendChild(te)}
    body.appendChild(rowEl(BL[o].name,withAttr(o,BL[o].desc||''),iconURL(o)));
    if(BL[o].hp&&S.obj[j]===o)body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('じょうぶさ',Math.floor(S.hp[j]??BL[o].hp)+' / '+BL[o].hp));/* 建物などのじょうぶさ */
    {const rc=RFC.get(j);if(rc!=null&&S.roof&&S.roof[rc]){const b=el('<button class="btn"></button>');b.textContent=BL[S.roof[rc]].name+'を見る';b.onclick=()=>{sfx('tap');openSheet('roof',rc)};body.appendChild(b)}}/* 屋根の下の物：屋根の説明へ */
    {const R=rangeOf(o,j);if(R&&!BL[o].env&&!BENCHES.has(o))body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('効果のはんい','まわり'+(R.cells||R.r)+'マス'))}

    {const t=SPOTJ.get(j);if(t){for(const I of SPOTI)if(t.has(I.sp.k)&&spotCells(I).includes(j))spotFx(I)}/* 家具をタップしたときも、そのスポットを点線でかこむ */if(t)for(const sp of SPOTS){if(!t.has(sp.k))continue;body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('スポット：'+sp.n,sp.eff))}}/* スポット */
    if(o==='table'){const h=roomOf(j);let n=0;if(h)for(const q of h.inside){const oo=S.obj[q];if(oo&&BL[oo]&&BL[oo].cat==='living')n+=BL[oo].dw||1}if(h)for(const oo of rugsIn(h.inside))n+=BL[oo].dw||1;const bon=h?DINEPT[Math.min(6,n)]:0;
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('ここで食べたときのパワー（いま）',h?'+'+bon+'（家の中の食卓 +1・ダイニング家具で +'+(DINEPT[Math.min(6,n)]-1)+(n/2<3?'。ダイニング家具をふやすと、まだふえる':'。いちばん多い')+'）':'家の外なので、ふえない'))}/* 食卓：いまのパワーのボーナス */
    if(BENCHES.has(o)){const ev=ENVG?Math.max(ENVG[j]||0,ENVG[j+1]||0):0;/* ベンチ：まわりのかざりで上がった回復 */
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('すわって休むと（1時間あたり）','つかれ −'+(Math.round((20+ev*.36)*10)/10)+' / たのしさ +'+(Math.round((4.8+ev*.36)*10)/10)+(ev>0?'':'')))}

  }else if(sheet==='roof'){const j=sheetArg,o=(S.roof||{})[j];if(!o||!BL[o])return closeSheet();T.textContent=BL[o].name;{const te=tagsEl(o);if(te)body.appendChild(te)}
    body.appendChild(rowEl(BL[o].name,withAttr(o,BL[o].desc||''),iconURL(o)));/* ガゼボ・東屋（屋根の層）の説明 */
  }else if(sheet==='score'){const sc=S.score||calcScore();T.textContent='クリアスコア';
    body.appendChild(el('<div style="text-align:center;margin:6px 0 10px"><div style="font-size:44px;font-weight:900;color:#e0a43a;line-height:1">'+sc.rank+'</div><div style="font-size:24px;font-weight:800;margin-top:4px">'+sc.tot+' てん</div></div>'));
    const g=el('<div class="rows"></div>');for(const[a,b,c]of sc.parts)g.appendChild(rowEl(a+'：'+b,(c>=0?'+':'')+c+' てん'));body.appendChild(g);
    const b=el('<button class="btn pri" style="width:100%;margin-top:10px">とじる</button>');b.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(b);
  }else if(sheet==='heatv'){const j=sheetArg,t=st2();T.textContent=j===D1?'手前の熱の装置':'奥の熱の装置';
    const P=tx=>{body.appendChild(el('<p class="story"></p>')).textContent=tx};
    const dir=j===D1?t.d1:t.d2;
    if(j===D2&&!t.d2fix){const clr=BVOL.every(q=>S.obj[q]!=='boulder'),ok=clr&&(S.mat.stone||0)>=8&&(S.mat.wood||0)>=5&&shLeft()>=1;
      P('こわれて止まっている。直すには、石材8・木材5と、ヌシ様の火だね1つがいる。'+(clr?'':'まわりの大岩をどかさないと、近づけない。')+(shLeft()?'':'ヌシ様の火だねを、まだ持っていない。'));
      const b=el('<button class="btn pri">直す</button>');b.disabled=!ok;b.onclick=()=>{S.mat.stone-=8;S.mat.wood-=5;S.usedSh=(S.usedSh||0)+1;t.d2fix=1;sfx('shard');burst(j,'block');toast('火だねが熱を通した！ 奥の装置が動きだした','good');dirty=true;closeSheet();checkQuest()};body.appendChild(b)}
    else if(t.hvb[j]){P('ヒノオオカゲにこわされて、止まっている。石材3で直せる。');const b=el('<button class="btn pri">直す（石材3）</button>');lackOn(b,lackMat('stone',3));b.onclick=()=>{S.mat.stone-=3;delete t.hvb[j];dirty=true;sfx('level');burst(j,'block');toast('装置を直した','good');dirty=true;closeSheet()};body.appendChild(b)}
    else{P(j===D1?'火山の熱を、左（西の温泉）と右（奥の装置）のどちらに流すか切りかえる。':'熱を、左（奥の温泉）と右（けむり穴）のどちらに流すか切りかえる。');
      P('いまは「'+(dir===0?'左':'右')+'」に流している。');
      const b=el('<button class="btn pri">向きをかえる</button>');b.onclick=()=>{if(j===D1)t.d1=1-t.d1;else t.d2=1-t.d2;sfx('tap');renderSheet();checkQuest()};body.appendChild(b)}
    const c2=el('<button class="btn">とじる</button>');c2.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c2);
  }else if(sheet==='stall'){const st=festStalls().find(t=>t.x===sheetArg);if(!st)return closeSheet();const M=STALLM[st.el],kp=S.res.find(r=>r.id===st.id);T.textContent=M.nm+'の屋台';
    {const sb=el('<div class="godSay"><b></b><span></span></div>');sb.querySelector('b').textContent=kp?kp.name:'';sb.querySelector('span').textContent='「'+(kp?chatTone(pick(STALLSAY),kp):pick(STALLSAY))+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">店番のせいれいと、パワーで交換します。</p>'));const rows=el('<div class="rows"></div>');body.appendChild(rows);
    const add=(title,desc,img,label,dis,fn)=>{const r=rowEl(title,desc,img),b=el('<button class="btn pri"></button>');b.textContent=label;b.disabled=!!dis;b.onclick=()=>{fn();sfx('furn');renderSheet();renderPalette()};r.appendChild(b);rows.appendChild(r)};
    for(const it of M.L){const c=it[it.length-1];
      if(it[0]==='f'){const f=FOODS[it[1]],room=foodCap()-S.food;add(f.e+' '+f.name+'×5',f.fx||'',null,room<5?'食料箱がいっぱい':SP(c),room<5||S.pt<c,()=>{S.pt-=c;addFood(it[1],5);toast(f.name+'を5つもらった','good')})}
      else if(it[0]==='m'){const nm=MATN[it[1]],room=matCap()-matTot();add(nm+'×10','素材箱に入る（いま'+(S.mat[it[1]]||0)+'）',null,room<10?'素材箱がいっぱい':SP(c),room<10||S.pt<c,()=>{S.pt-=c;S.mat[it[1]]=(S.mat[it[1]]||0)+10;S.gotMat&&(S.gotMat[it[1]]=(S.gotMat[it[1]]||0)+10);toast(nm+'を10こもらった','good')})}
      else if(it[0]==='mebuki'){if(!((S.bossKills||0)>=1||S.flags.hinoDown))continue;add('めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null,SP(c),S.pt<c,()=>{S.pt-=c;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good')})}
      else if(it[0]==='chochin')add(BL.chochin.name,BL.chochin.desc+'（持っている数：'+(inv('chochin')||0)+'）',iconURL('chochin'),SP(c),S.pt<c,()=>{S.pt-=c;giveItem('chochin',1);toast(BL.chochin.name+'をもらった','good')})}
  }else if(sheet==='travel'){T.textContent=storyTreeName();
    const nx=WORLDS[WD+1];body.appendChild(el('<p class="story"></p>')).textContent=(WD===0?'御神木から、ほかの土地へ行ける。':'台座から、ほかの土地へ行ける。')+(nx?'つぎは「'+nx.name+'」。':'');
    const b=el('<button class="btn pri">マップをひらく</button>');b.onclick=()=>{sfx('tap');save();closeSheet();showMaps()};body.appendChild(b);
    const c=el('<button class="btn">やめる</button>');c.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c);
  }else if(sheet==='watch'){
    const j=sheetArg,o=S.obj[j];if(o!=='watch'&&o!=='yogan')return closeSheet();
    const yg=o==='yogan',TB=yg?YOGAN:WATCH,L=S.hp['L'+j]||1,st=TB[L];T.textContent=BL[o].name;
    /* 強化は、いちばん上 */
    const U=(yg?YUP:WUP)[L];if(U){const n=TB[L+1];const upTop=body.appendChild(el(`<p class="note">強化するとLv${L+1}：威力 ${n.dmg}${yg?'（まわり '+n.sdmg+'）':''}・射程 ${n.range}マス・${n.cd}分ごと<br>${SP(U.pc)}</p>`));{const m=document.createElement('div');m.className='mt upmt';m.innerHTML=Object.keys(U.mat).map(k=>{const h=S.mat[k]||0;return '<span class="mic'+(h>=U.mat[k]?'':' ng')+'"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+h+'/'+U.mat[k]+'</span>'}).join('')+(U.sand?'<span class="mic'+((S.sand||0)>=U.sand?'':' ng')+'">やすらぎの砂（'+(S.sand||0)+'/'+U.sand+'）</span>':'');body.appendChild(m)}/* 強化に使う素材：持っている数/いる数（足りない素材は赤） */
      const b=el('<button class="btn pri">強化する</button>');b.onclick=()=>{if(S.pt<U.pc)return toast('パワーが足りません（'+SP(U.pc)+'）');if(!matOK(U.mat))return toast('素材が足りません（'+matTxt(U.mat)+'）');if(U.sand&&(S.sand||0)<U.sand)return toast('やすらぎの砂が足りません（'+U.sand+'）');S.pt-=U.pc;for(const k in U.mat)S.mat[k]-=U.mat[k];if(U.sand)S.sand-=U.sand;S.hp['L'+j]=L+1;dirty=true;try{rebuildStatic()}catch(e){}sfx('kankan');burst(j,'block','offer');toast(BL[o].name+'をLv'+(L+1)+'に強化した','good');renderSheet()};body.insertBefore(b,upTop)}/* ボタンをいちばん上に */
    else body.appendChild(el('<p class="note">これ以上は強化できない</p>'));
    body.appendChild(el(`<p class="story">Lv${L}：威力 ${st.dmg}${yg?'（まわり '+st.sdmg+'）':''}・射程 ${st.range}マス・${st.cd}分ごとに${yg?'火の玉':'木の矢'}を放つ</p>`));if(!yg)body.appendChild(el(`<p class="story">木の矢：${inv('arrow')}本</p>`));
    if(!yg){/* 見張り台に立つ子：ベッドと同じように、きめられる。立つ子の属性で、うち方がかわる */const own=S.wpOwn||{},oid=own[j],ow=oid!=null?S.res.find(q=>q.id===oid&&q.elem!=='fire')||null:null;
      const ef=el('<div class="sec"><h3>立つせいれいの属性</h3><p class="note" style="white-space:pre-line"></p></div>');ef.querySelector('p').textContent=ow?ELEM[ow.elem].name+'のせいれい：'+WPTXT[ow.elem]:['wood','earth','water','wind'].map(k=>ELEM[k].name+'：'+WPTXT[k]).join('\n');body.appendChild(ef);
      const sec=el('<div class="sec"><h3>見張り台に立つせいれい</h3><div class="rows"></div></div>'),rows=sec.querySelector('.rows'),set=id=>{const B=S.wpOwn||(S.wpOwn={});for(const k in B)if(B[k]===id)delete B[k];if(id==null)delete B[j];else B[j]=id;sfx('next');renderSheet()};
      {const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot" style="background:#efe6d2"></span><div class="tx"><b></b><small></small></div></button>');ckSet(row.querySelector('b'),(ow?'':'✓ ')+'だれでも');row.querySelector('small').textContent='あいていれば、だれでも立つ';row.onclick=()=>set(null);rows.appendChild(row)}
      for(const r of S.res){if(r.elem==='fire')continue;let mine=-1;for(const k in own)if(own[k]===r.id&&S.obj[k]==='watch')mine=+k;const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');
        row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
        ckSet(row.querySelector('b'),(ow===r?'✓ ':'')+r.name+'  Lv'+rLv(r));row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(mine===j?'この見張り台':mine>=0?'ほかの見張り台':'きまっていない');row.onclick=()=>set(r.id);rows.appendChild(row)}
      body.appendChild(sec)}
  }else if(sheet==='menu'){
    T.textContent=WORLDS[WD].name;
    const MI=[['oracle','leaf','おつげ'],['manual','book','ひでんのしょ'],['goal','target','目標'],['record','memo','思い出帳'],['maps','compass','マップ選択'],['zukan','zukan','図鑑'],['settings','gear','設定'],['support','cup','応援する']];
    const sub=MI.find(m=>m[0]===sheetArg);
    if(!sub){/* メニューはアイコンを並べるだけ。タップで中身を開く */
      body.appendChild(el(`<div class="mtags"><span class="mtag">${pxi('grass')}みどりのマス <b>${GRASSN}</b></span><span class="mtag">${pxi('house')}村レベル <b>${S.lv}</b></span><span class="mtag">${pxi('spirit')}せいれい <b>${S.res.length}</b>人</span></div>`));
      const g=el('<div class="mgrid"></div>');
      for(const[k,ic,nm]of MI){const b=el('<button class="mtile"><span class="mi"></span><span class="mn"></span></button>');b.querySelector('.mi').innerHTML=pxi(ic);b.querySelector('.mn').textContent=nm;b.dataset.menu=k;
        b.onclick=()=>{sfx('tap');if(k==='manual')return openSheet('manual');if(k==='maps'){save();closeSheet();return showMaps()}openSheet('menu',k)};g.appendChild(b)}
      body.appendChild(g);return}
    T.textContent=sub[2];
    sheetBack();
    if(sheetArg==='oracle'){
      {const sec=el('<div class="sec"><h3>おつげ</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
       for(const k of [null,...Object.keys(ORACLE).filter(oracleOK)]){const O=k?ORACLE[k]:{name:'じゆうにすごす'},OI={play:'ball',wood:'log',stone:'rock',food:'apple'},on=(S.oracle||null)===k;const b=el('<button class="btn"></button>');b.dataset.oracle=k||'';b.innerHTML=pxi(OI[k]||'leaf','oi');b.appendChild(document.createTextNode(O.name+(on?'（いま）':'')));if(on)b.classList.add('pri');
         b.onclick=()=>{S.oracle=k;if(k){S.flags.oracleSet=true;checkQuest()}sfx('quest');toast(k?'おつげ：'+O.name:'おつげをやめた','good');for(const r of S.res)if(!r.hidden&&r.act&&r.act.stage==='do'&&IDLE_ACTS.includes(r.act.type))endAct(r);renderSheet()};rw.appendChild(b)}
       body.appendChild(sec)}
    }else if(sheetArg==='goal'&&S.cleared){
      body.appendChild(el('<p class="note">この土地は守られた。ここからは、クエストや目標で村をそだてよう。たっせいすると、パワーがもらえます。</p>'));
      if(WD===0&&!S.free){const ng=nextStageGoal(),sec=el('<div class="sec"><h3>つぎの土地</h3><div class="rows"></div></div>');sec.querySelector('.rows').appendChild(ng?rowEl('・'+ng.t,ng.pr+'。'+ng.how):rowEl('火山のふもとの村','御神木をタップすると、火山のふもとの村へ行ける'));body.appendChild(sec)}/* つぎのステージへの行き方 */
      if(WD!==FREE){const a=AFTERQ[S.aq||0],qs=el('<div class="sec"><h3>クエスト</h3><div class="rows"></div></div>');
        if(!a)qs.querySelector('.rows').appendChild(rowEl('✓ ぜんぶたっせい','カミサマからのおねがいは、ぜんぶかなえた'));
        else if(S.aqOn===(S.aq||0))qs.querySelector('.rows').appendChild(rowEl('・'+aqTitle(a),aqProg(a)+'　ごほうび パワー+'+a.rw+'。'+a.how));
        else qs.querySelector('.rows').appendChild(rowEl('・つぎのクエスト','昼になると、カミサマからおねがいがある'));
        body.appendChild(qs);
        const d=S.daily,ds=el('<div class="sec"><h3>きょうの目標</h3><div class="rows"></div></div>');
        if(d)for(const k of d.k){const g=DAILYG.find(x=>x.k===k),ok=!!d.done[k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+Math.min(g.n,dailyNow(g,d))+' / '+g.n+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');ds.querySelector('.rows').appendChild(r)}
        else ds.querySelector('.rows').appendChild(rowEl('・あしたの朝から','毎朝、2つの目標が出る'));
        body.appendChild(ds)}
      const f=el('<div class="sec"><h3>やりこみ</h3><div class="rows"></div></div>');for(const g of [...freeHere().filter(g=>!(S.freeDone||{})[g.k]),...freeHere().filter(g=>(S.freeDone||{})[g.k])]){const ok=!!(S.freeDone||{})[g.k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+g.now()+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');f.querySelector('.rows').appendChild(r)}body.appendChild(f);
      const tr=el('<div class="sec"><h3>「コワイノ」の試練</h3><p class="note">ふだんより多く、強い「コワイノ」と、オオカゲがいっしょにやってくる夜。ぜんぶ追いはらうと、パワー+60と「めぶきのしずく」。</p></div>');
      const b=el('<button class="btn pri" style="width:100%"></button>');b.textContent=S.trial?'今夜、試練の夜がくる':'今夜、試練をうける';b.disabled=!!S.trial||isNight();b.onclick=()=>{S.trial=true;sfx('night');toast('今夜は「コワイノの試練」','warn');renderSheet()};tr.appendChild(b);
      tr.appendChild(el('<p class="note">のりこえた試練：'+(S.trials||0)+'回</p>'));body.appendChild(tr);subSec(body);/* クリア後は、新しい目標を上に。サブクエストは下に */
    }else if(sheetArg==='goal'){if(mainStoryFocusTarget()){const b=el('<button class="btn pri" style="width:100%">お話・調査の場所へ</button>');b.onclick=focusMainStoryPlace;body.appendChild(b);}subSec(body,true);
    }else if(sheetArg==='zukan'){zukanBody(body)
    }else if(sheetArg==='record'){appendStoryReplays(body);
      const st=el('<div class="sec"><h3>これまで</h3><div class="recs"></div></div>'),rw=st.querySelector('.recs');
      for(const[a,b]of[['すごした日',dayNo()+'日'],...(S.score?[['クリアスコア',S.score.rank+'（'+S.score.tot+'てん）']]:[]),['のりこえた夜',(S.nights||0)+'回'],['いまのせいれい',S.res.length+'人'],['よんだせいれい',(S.summons||0)+'人'],['消えてしまったせいれい',(S.deaths||0)+'人'],
        ['追いはらった「コワイノ」',(S.kills||0)+'体'],['オオカゲ',(S.bossKills||0)+'回'],[SHN(),(S.shards||0)+'つ'],['めぶきのしずく',(S.mebuki||0)+'こ'],['ためたせいれいパワー',Math.floor(S.totalPt||0)+''],['みどりのマス',GRASSN+'マス'],['村レベル','Lv'+S.lv],['たっせいした目標',S.quest+'こ']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;rw.appendChild(d)}
      body.appendChild(st);
      if((S.gone||[]).length){/* いなくなったなかま：名前・いっしょにいた日・なかよしとの思い出 */const sec=el('<div class="sec"><h3>いなくなったなかま</h3><div class="rows"></div></div>'),rw2=sec.querySelector('.rows');
        for(const e of S.gone.slice().reverse()){const r=el('<div class="row"><div class="tx"><b></b><small style="white-space:normal"></small></div></div>');r.querySelector('b').textContent=e.name+'（'+ELEM[e.elem].name+'のせいれい）';
          r.querySelector('small').textContent=e.came+'日めから'+e.day+'日めまで、'+Math.max(1,e.day-e.came+1)+'日いっしょにいた'+(e.back?'。'+e.back+'日めに、もどってきた':'')+(e.mem?'\n'+e.mate+'との思い出：「'+e.mem+'」':'');r.querySelector('small').style.whiteSpace='pre-line';rw2.appendChild(r)}
        body.appendChild(sec)}
      /* 思い出帳ときろくをひとつに：日ごとのできごと */
      const E=[];(S.memo||[]).forEach(([d,e,t],i)=>E.push([d,i,e+' '+t]));(S.log||[]).forEach(([d,t],i)=>E.push([d,1e4+i,t]));E.sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
      if(!E.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,,t]of E){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(t,''))}
    }else if(sheetArg==='talks'){
      const H=(S.dlog||[]).slice().reverse();if(!H.length)body.appendChild(el('<p class="note">まだありません</p>'));
      const rows=el('<div class="rows"></div>');for(const[w,t]of H){const r=el('<div class="row"><div class="tx"><b></b><small style="white-space:normal"></small></div></div>');r.querySelector('b').textContent=w||'';r.querySelector('small').textContent=t;rows.appendChild(r)}body.appendChild(rows);
    }else if(sheetArg==='memo'){
      const M=(S.memo||[]).slice().reverse();if(!M.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,e,t]of M){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(e+' '+t,''))}
    }else if(sheetArg==='support'){/* 広告とコーヒー（まだ準備中） */
      {const sec=el('<div class="sec"><div style="display:flex;flex-direction:column;gap:8px"></div></div>');for(const t of['📺 広告をみる','☕ 作者にコーヒーをおごる']){const b=el('<button class="btn"></button>');b.textContent=t;b.onclick=()=>toast('準備中です');sec.firstChild.appendChild(b)}body.appendChild(sec)}
    }else if(sheetArg==='settings'){
      {const t=el('<div class="sec"><h3>テスト用</h3></div>'),b=el('<button class="btn"></button>');b.textContent='5倍速：'+(TESTM?'オン':'オフ');b.onclick=()=>{TESTM=!TESTM;try{KV.setItem('hk-test',TESTM?'1':'')}catch(_){}if(!TESTM&&S.speed>3)S.speed=1;renderSheet();applyFeats()};t.appendChild(b);body.appendChild(t)}/* テストのときだけ5倍速 */
      const so=el('<div class="sec"><h3>おと</h3><div style="display:flex;gap:8px;flex-wrap:wrap"></div></div>');
      for(const[k,l]of[['bgm','音楽'],['sfx','効果音']]){const b=el('<button class="btn"></button>');b.textContent=l+'：'+(SND[k]?'オン':'オフ');b.onclick=()=>{audioInit();setSnd(k,!SND[k]);renderSheet()};so.lastElementChild.appendChild(b)}
      body.appendChild(so);
      {const vs=el('<div class="sec"><h3>音量</h3></div>');for(const[k,l]of[['bv','音楽'],['sv','効果音'],['vv','せいれいの声']]){const row=el('<label style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="width:7em;flex:none"></span><input type="range" min="0" max="100" step="5" style="flex:1"><b style="width:3em;text-align:right"></b></label>');row.querySelector('span').textContent=l;const ip=row.querySelector('input'),bv=row.querySelector('b');ip.value=Math.round((SND[k]??1)*100);bv.textContent=ip.value;ip.addEventListener('input',()=>{bv.textContent=ip.value;audioInit();setSnd(k,ip.value/100)});vs.appendChild(row)}body.appendChild(vs)}
      body.appendChild(el('<p class="note">音楽：このゲームのオリジナル<br>効果音・鳥の声・雨の音：効果音ラボ<br>出典を確認中：村の鐘・夜の環境音・ヌシのかけらをはめる音・家具を置く音・素材が落ちる音</p>'));
      {const ts=el('<div class="sec"><h3>テスト用</h3></div>');const b=el('<button class="btn"></button>');b.textContent='倍速（砂時計なし）：'+(TESTSPD?'オン':'オフ');b.onclick=()=>{TESTSPD=!TESTSPD;try{KV.setItem('hakoniwa-test',TESTSPD?'1':'0')}catch(e){}applyFeats();renderSheet()};ts.appendChild(b);body.appendChild(ts)}
      const rs=el('<div class="sec"><h3>データ</h3></div>');const rb=el('<button class="btn">最初からやりなおす</button>');
      rb.onclick=()=>{if(rb.dataset.ok){closeSheet();newGame(WD)}/* いまのステージだけをやりなおす */else{rb.dataset.ok=1;rb.textContent='本当にやりなおす（もう一度タップ）';rb.style.borderColor='var(--danger)'}};rs.appendChild(rb);body.appendChild(rs);
      {const section=el('<div class="sec"><h3>セーブ</h3><p class="note"></p></div>');
        const status=section.querySelector('p');
        const update=()=>{const st=KV.status();status.textContent=st.available?''+(st.lastSaved?' 最終保存：'+new Date(st.lastSaved).toLocaleTimeString('ja-JP'):''):'このブラウザに保存できません。下の「書き出す」でセーブファイルを保存してください。';};
        const button=el('<button class="btn pri">今すぐセーブ</button>');button.onclick=()=>{const ok=save();update();toast(ok?'セーブしました':'このブラウザには保存できません',ok?'good':undefined)};
        update();section.appendChild(button);body.appendChild(section)}
      /* セーブの書き出し・読みこみ（ブラウザのデータが消えたときのそなえ） */
      {const sv=el('<div class="sec"><h3>セーブの書き出し</h3><p class="note">ファイルにして保存できます。別の端末でも「読みこむ」で続きから遊べます。読みこむと、ファイルに含まれる土地のセーブを上書きします。ブラウザのデータを消す前に書き出してください。</p></div>');
        const ex=el('<button class="btn">書き出す</button>'),im=el('<button class="btn">読みこむ</button>'),fi=el('<input type="file" accept=".json,application/json" hidden>');
        ex.onclick=async()=>{save();const d={app:'hakoniwa',v:1,at:Date.now(),saves:{}};try{for(const k of SAVE_KEYS.filter(Boolean)){const t=KV.getItem(k);if(t)d.saves[k]=t}}catch(e){}
          for(let w=0;w<LIVE.length;w++)if(LIVE[w]&&!d.saves[SAVE_KEYS[w]]&&LIVE[w].introSeen)d.saves[SAVE_KEYS[w]]=JSON.stringify(LIVE[w]);
          const txt=JSON.stringify(d),dt=new Date(),nm='hakoniwa-save-'+dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0')+'.json';
          let dl=null;try{dl=window.claude&&await window.claude.use('downloads')}catch(e){}
          if(dl){try{await dl.save({filename:nm,data:new Blob([txt],{type:'application/json'})});toast('セーブを書き出した','good')}catch(e){if(e&&e.code!=='declined')toast('書き出せませんでした')}return}
          try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('セーブを書き出した','good')}catch(e){toast('書き出せませんでした')}};
        im.onclick=()=>fi.click();
        fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;if(f.size>20*1024*1024){toast('ファイルが大きすぎます');fi.value='';return}const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||d.app!=='hakoniwa'||d.v!==1||!d.saves||typeof d.saves!=='object'||Array.isArray(d.saves))throw 0;
            const entries=Object.entries(d.saves).filter(([k])=>SAVE_KEYS.includes(k));if(!entries.length)throw 0;
            for(const [k,value] of entries){if(typeof value!=='string')throw 0;const g=JSON.parse(value);if(!g||g.v!==8||(g.world||0)!==SAVE_KEYS.indexOf(k)||!g.introSeen||!Array.isArray(g.res)||!Array.isArray(g.orders)||!Array.isArray(g.ground)||(g.ground.length!==W*H&&g.ground.length!==OW*OW)||!Array.isArray(g.obj)||(g.obj.length!==W*H&&g.obj.length!==OW*OW)||!g.flags)throw 0}
            const before=entries.map(([k])=>[k,KV.getItem(k)]);NOSAVE=true;
            if(!entries.every(([k,value])=>KV.setItem(k,value))){for(const [k,value]of before){if(value===null)KV.removeItem(k);else KV.setItem(k,value)}NOSAVE=false;toast('ブラウザに保存できないため読みこめません');return}
            toast('読みこみました。はじめからひらきなおします','good');setTimeout(()=>location.reload(),900)}catch(e){toast('このファイルは読みこめません')}};rd.readAsText(f)};
        ex.style.marginBottom='8px';sv.appendChild(ex);sv.appendChild(im);sv.appendChild(fi);body.appendChild(sv)}
    }
  }
}

/* 図鑑：マップごとに、見つけた・おぼえた物だけ（スポット・家具・建物・レシピ・コワイノ・アイテム） */
let ZKW=null,ZKT=0;const ZKTABS=['スポット','家具','建物','レシピ','コワイノ','アイテム'];
function zukanBody(body){
  const ws=[0,1,2,3,4,5].filter(w=>(w===WD&&!S.free)||savedStage(w));if(!ws.length){body.appendChild(el('<p class="note">まだありません</p>'));return}
  if(ZKW==null||!ws.includes(ZKW))ZKW=ws.includes(WD)?WD:ws[0];
  if(ws.length>1){const tb=el('<div class="ctabs"></div>');for(const w of ws){const t=el('<button class="ctab'+(w===ZKW?' on':'')+'"></button>');t.textContent=WORLDS[w].name;t.onclick=()=>{ZKW=w;sfx('next');renderSheet()};tb.appendChild(t)}body.appendChild(tb)}
  {const tb=el('<div class="ctabs"></div>');ZKTABS.forEach((nm,i)=>{const t=el('<button class="ctab'+(i===ZKT?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{ZKT=i;sfx('next');renderSheet()};tb.appendChild(t)});body.appendChild(tb)}
  const d=ZKW===WD?S:savedStage(ZKW);if(!d)return;
  const G=grecOf(),here=id=>G.get(id)===ZKW,placed=new Set((d.obj||[]).filter(o=>o&&BL[o])),has=id=>placed.has(id)||((d.inv||{})[id]||0)>0;
  const rows=el('<div class="rows"></div>'),list=[];
  const add=(nm,desc,img)=>list.push([nm,desc,img]);
  if(ZKT===0){for(const sp of SPOTS)if((d.spotSeen||{})[sp.k])add(sp.n,'条件：'+spotCond(sp)+'　'+sp.eff,null)}
  else if(ZKT===1||ZKT===2||ZKT===3){const kd=ZKT===1?'furn':ZKT===2?'build':null;
    for(const id in BL){const b=BL[id];if(!b||!b.name||b.hidden)continue;if(kd?b.kind!==kd:(b.kind==='furn'||b.kind==='build'||b.kind==='nat'))continue;if(!(here(id)||(ZKT!==3&&has(id))))continue;add(b.name,b.desc||'',iconURL(id))}}
  else if(ZKT===4){const seen=d.seenEn||{},K=d.enKills||{};for(const k of Object.keys(EN).filter(k=>ZUKAN[k]&&seen[k])){const D=EN[k],row=el('<div class="zk"><canvas width="144" height="144"></canvas><div class="zt"><b></b><p></p><small></small></div></div>');
      const c=row.querySelector('canvas').getContext('2d');c.scale(2,2);try{drawShade(c,k,36,64,(k==='boss'||k==='hino'||k==='yama'||k==='boss2'?.46:.56),1,{t:0,dot:1})}catch(_){}
      row.querySelector('b').textContent=D.name;row.querySelector('p').textContent=ZUKAN[k];row.querySelector('small').textContent='体力 '+D.hp+'・はやさ '+D.sp+'・追いはらった '+(K[k]||0)+'回・たおしたときのけいけん +'+xpText(spiritXpGain(D.xp,1))+'（Lv1・2）';if(d.cleared&&ZURA[k]){const u=el('<p class="note"></p>');u.textContent='もとのすがた：'+ZURA[k];row.querySelector('.zt').appendChild(u)}rows.appendChild(row);list.push(null)}}
  else{const it=Object.assign({},d.seenIt||{});for(const k in d.mat||{})if(d.mat[k]>0)it['m:'+k]=1;for(const k in d.fs||{})if(d.fs[k]>0)it['f:'+k]=1;
    for(const k in MATN)if(it['m:'+k])add(MATN[k],'素材',ICONS[k]||null);for(const k in FOODS)if(it['f:'+k])add(FOODS[k].name,FOODS[k].fx||'食べ物',foodIc(k));if(it['x:horn'])add('よびごえの角笛',HORNDESC,hornIco());if(it['x:herb'])add('まよけのハーブ',HERBDESC,herbIco())}
  body.appendChild(el('<p class="story">'+list.length+'こ</p>'));
  for(const q of list){if(!q)continue;rows.appendChild(rowEl(q[0],q[1],q[2]))}
  if(!list.length)body.appendChild(nodata('zukan','まだ見つけていないよ'));body.appendChild(rows)}

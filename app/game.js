(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(n<0?'−':'')+'$'+Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const lcFirst=s=>s.charAt(0).toLowerCase()+s.slice(1);
const ucFirst=s=>s.charAt(0).toUpperCase()+s.slice(1);
const numbered=arr=>arr.map((s,i)=>(i+1)+'. '+s).join('\n');
const fmtT=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const IC={
ban:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="M3.8 3.8 L12.2 12.2" stroke="currentColor" stroke-width="1.6"/></svg>',
ext:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
lock:'<svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6"/></svg>',
flag:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 14V2.5M3 3h8.5l-1.8 3 1.8 3H3" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>',
unlock:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 7V5a3 3 0 0 1 5.6-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
cross:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 0.8v3.4M8 11.8v3.4M0.8 8h3.4M11.8 8h3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
intel:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5 6h6M5 9h6M5 12h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
pause:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/></svg>',
play:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
shield:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5 13.5 3.5V8c0 3.2-2.4 5.6-5.5 6.5C4.9 13.6 2.5 11.2 2.5 8V3.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5.5 8 7.3 9.8 10.6 6.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const ART={
cartly:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.4" fill="currentColor"/><circle cx="16.5" cy="19.5" r="1.4" fill="currentColor"/></svg>',
staynest:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="11" r="2" stroke="currentColor" stroke-width="1.9"/></svg>',
gatetix:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 0 0 4v2h18v-2a2 2 0 0 0 0-4 2 2 0 0 0 0-4V6H3z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M14 6v12" stroke="currentColor" stroke-width="1.9" stroke-dasharray="2 2.2"/></svg>',
pipedesk:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="5" height="16" rx="1.5" stroke="currentColor" stroke-width="1.9"/><rect x="10" y="4" width="5" height="11" rx="1.5" stroke="currentColor" stroke-width="1.9"/><rect x="17" y="4" width="4" height="7" rx="1.5" stroke="currentColor" stroke-width="1.9"/></svg>'
};
const artSize=(id,px)=>ART[id].replace('width="30" height="30"','width="'+px+'" height="'+px+'"');

/* tiers, time, ranks */
const RANKS=[{t:'Trainee',xp:0},{t:'Analyst',xp:400},{t:'Auditor',xp:1200},{t:'Lead Trainer',xp:2800},{t:'AI Trainer Prime',xp:6000}];
const DIFFS={
rookie:{t:'Rookie',lvl:1,unlock:0,opts:3,pref:[1,2,3,4],hints:'full',mult:1,guard:{pen:0,warnAt:3,jamAt:0,jamSec:0,max:0},l:['Choices differ clearly','Full hunt hints','Guessing allowed, with tips'],say:'Rookie review: the choices differ clearly, and I left hunt hints in your Brief tab. You can guess, but learn to reproduce first.'},
analyst:{t:'Analyst',lvl:2,unlock:1,opts:4,pref:[2,3,1,4],hints:'phase',mult:1.25,guard:{pen:5,warnAt:2,jamAt:3,jamSec:15,max:0},l:['Each wrong choice breaks one rule','Phase hints only','−5 per miss · 3 blind misses jam'],say:'Analyst review: every wrong choice breaks one rule. Flag three times in a row without using the app and your scanner jams.'},
auditor:{t:'Auditor',lvl:3,unlock:2,opts:4,pref:[3,4,2,1],hints:'none',mult:1.5,guard:{pen:10,warnAt:1,jamAt:2,jamSec:30,max:8},l:['Near-identical choices','No hints','−10 per miss · 8-miss budget'],say:'Auditor review: no hints, near-identical options, and only 8 misses allowed. Two blind flags in a row jam your scanner.'},
expert:{t:'Expert',lvl:4,unlock:3,opts:5,pref:[4,3,2,1],hints:'none',mult:2,guard:{pen:15,warnAt:1,jamAt:2,jamSec:45,max:5},l:['5 near-identical choices','No hints','−15 per miss · 5-miss budget'],say:'Expert review: five near-identical options and a 5-miss budget. Every flag must be proven on screen first.'}
};
const TIMES=[10,15,30];
const guardText=g=>g.jamAt?'Each miss −'+g.pen+'. '+g.jamAt+' misses in a row without using the app jam the scanner for '+g.jamSec+'s, longer each time.'+(g.max?' Miss budget: '+g.max+', then the scanner locks.':''):'Guessing is allowed. After 3 misses in a row you get a tip to reproduce first.';
const COUNT={10:{rookie:2,analyst:3,auditor:3,expert:4},15:{rookie:3,analyst:4,auditor:5,expert:5},30:{rookie:5,analyst:6,auditor:7,expert:8}};
const PR={P0:{q:'Core workflow interrupted: the main task is completely blocked.'},P1:{q:'Core support or severe UX: the task continues with severe limits.'},P2:{q:'Outside P0 & P1: non-core enhancement or minor cosmetic issue.'}};
const TYPES={bug:{t:'Bug',d:'Implemented, but broken'},fr:{t:'Feature request',d:'Missing, compared with the real app'},neither:{t:'Neither',d:'Works as intended'},skip:{t:"Don't report",d:'Excluded by a FILTER gate'}};
const GATES={1:'Gate 1 · External website',2:'Gate 2 · Says unavailable',3:'Gate 3 · Missing prerequisite',4:'Gate 4 · Known limitation'};
const PHASES=['Find & start','Enter info','Main action','Review result','Save & resume','Edit or repeat','Failed attempts','Complete','Cross-view state','Full journey'];
const FIELDS={
type:{l:'Type',g:'WALL 02 · DECIDE',q:'What is it?'},
gate:{l:'Gate',g:'WALL 04 · FILTER',q:'Which FILTER gate excludes it?'},
prio:{l:'Priority',g:'WALL 03 · RANK',q:'How much does it hurt the core workflow?'},
summary:{l:'Summary',g:'WALL 05 · WRITE · Field 1',q:'Pick the compliant Summary.'},
path:{l:'Path',g:'WALL 05 · WRITE · Field 2',q:'Pick the Page or workflow path.'},
steps:{l:'Steps',g:'WALL 05 · WRITE · Field 3',q:'Pick the Reproduction steps.'},
expected:{l:'Expected',g:'WALL 05 · WRITE · Field 4',q:'Pick the Expected behavior.'},
actual:{l:'Actual',g:'WALL 06 · PROVE · Field 5',q:'Pick the Actual behavior (all 4 points).'}
};
const TEXTK=['summary','path','steps','expected','actual'];
const GUIDE_OF={type:'WALL 02 · DECIDE',prio:'WALL 03 · RANK',gate:'WALL 04 · FILTER',summary:'WALL 05 · WRITE',path:'WALL 05 · WRITE',steps:'WALL 05 · WRITE',expected:'WALL 05 · WRITE',actual:'WALL 06 · PROVE'};
const BRIEF={
cartly:'Cartly ships its new checkout tonight, and shoppers are already filling carts. Find what breaks before they do.',
staynest:'StayNest\'s booking flow goes live this weekend. A ghost booking means a traveler with no room.',
gatetix:'GateTix opens ticket sales at noon. Every wrong price becomes a refund request.',
pipedesk:'PipeDesk\'s sales team moves in on Monday. Lost CRM data means lost deals.'
};

/* replica helpers */
let run=null;
const B=id=>!!run&&(id.charAt(0)==='t'||run.active.has(id));
const H=(id,cond)=>((cond===undefined||cond)&&B(id))?' data-hot="'+id+'"':'';
const sel=(v,cur)=>v===cur?' selected':'';
const chk=c=>c?' checked':'';
const dis=c=>' aria-disabled="'+(c?'true':'false')+'"';
const tmsg=[];
function rpToast(m){tmsg.push(m);setTimeout(()=>{tmsg.shift();rr()},1800)}

/* ---------- Cartly ---------- */
const CT_P=[{id:'p1',name:'Linen Overshirt',price:48},{id:'p2',name:'Canvas Tote',price:22},{id:'p3',name:'Merino Beanie',price:26},{id:'p4',name:'Trail Runner',price:89},{id:'p5',name:'Ceramic Mug',price:14},{id:'p6',name:'Wool Socks, 3-pack',price:18}];
const ctProd=id=>CT_P.find(p=>p.id===id);
const ctSub=st=>st.cart.reduce((a,c)=>{const p=ctProd(c.id).price;return a+(B('e1')?p:p*c.qty)},0);
const ctCount=st=>st.cart.reduce((a,c)=>a+c.qty,0);
const ctDisc=st=>st.promo?Math.round(ctSub(st)*(B('e10')?20:10))/100:0;
const Cartly={
id:'cartly',name:'Cartly',cat:'E-commerce',brand:'#1E6B52',flow:'Shop → Cart → Checkout → Orders',
features:['Search products by name','Browse products in a grid','Sort products by price (low → high, high → low)','Add to cart from the product card','Change quantity or remove items in the cart','Promo codes in the cart','Checkout with shipping form and Standard or Express shipping','Pay by card or cash on delivery','Order confirmation with an order number and total paid','Order history with Reorder','Courier tracking through a partner site'],
notes:['Product photos are placeholders in this build.','Express shipping adds $9.00.','Promo code SAVE10 takes 10% off the subtotal.','Courier tracking is handled by an external partner site.'],
traps:[{id:'t1',gate:2,label:'Gift cards link',why:'It shows a not-allowed cursor and "Coming soon".'},{id:'t2',gate:1,label:'Courier partner error page',why:'The error happens on an external partner site, outside Cartly.'},{id:'t3',gate:3,label:'Disabled "Place order" button',why:'It stays disabled until the terms box is ticked, a prerequisite.'},{id:'t4',gate:4,label:'Placeholder product photos',why:'Release notes list placeholder photos as a known limitation.'}],
defects:[
{id:'e1',kind:'bug',prio:'P1',hunt:[32,24],page:'Cart Page',crumbs:['Cart Page','Order Summary','Subtotal'],control:'Order summary subtotal',fail:'ignores item quantity and totals one unit per product',exp:'multiply each unit price by its quantity',outcome:'see the correct amount before checkout',steps:['Open Cartly and go to the Shop page.','Click "Add to cart" on Linen Overshirt twice.','Open the Cart.','Compare the line quantity with the subtotal.'],defect:'The subtotal counts each product once, so 2 × $48.00 shows as $48.00.',baseline:'The line correctly shows a quantity of 2, and a cart with one of each item totals correctly.',impact:'The user sees a wrong amount and cannot trust the price they are about to pay.',hint:'Add the same product twice, then read the cart total.'},
{id:'e2',kind:'bug',prio:'P1',hunt:[28],page:'Checkout Page',crumbs:['Checkout Page','Place Order Button','Order History'],control:'"Place order" button',fail:'creates a duplicate order when clicked twice during processing',exp:'lock after the first click and create one order',outcome:'place an order exactly once',steps:['Open Cartly and go to the Shop page.','Add any product to the cart and open Checkout.','Fill in every field and tick the terms box.','Click "Place order" twice quickly.','Open Orders.'],defect:'Two identical orders are created from one checkout.',baseline:'A single click creates exactly one order.',impact:'The user can be charged twice for the same purchase.',hint:'Click Place order twice, fast, then check Orders.'},
{id:'e3',kind:'bug',prio:'P2',hunt:[20],page:'Header',crumbs:['Header','Cart Badge'],control:'Cart badge',fail:'shows "itms" instead of "items"',exp:'read "items"',outcome:'read the cart count clearly',steps:['Open Cartly and go to the Shop page.','Add any product to the cart.','Read the cart badge in the header.'],defect:'The cart badge reads "itms" instead of "items".',baseline:'The count itself is correct and the badge opens the cart.',impact:'The user sees a typo, but the cart still works.',hint:'Read every label in the header.'},
{id:'e4',kind:'bug',prio:'P1',hunt:[63,15],page:'Checkout Page',crumbs:['Checkout Page','Shipping Form','Validation'],control:'Shipping form',fail:'clears every field after a validation error',exp:'keep valid entries and highlight only the missing field',outcome:'fix one field and continue',steps:['Open Cartly and go to the Shop page.','Add any product and open Checkout.','Fill in name, email and address, leave ZIP empty, tick the terms box.','Click "Place order".'],defect:'After the missing-ZIP error, the name, email and address fields are emptied.',baseline:'The error message correctly names the missing ZIP field.',impact:'The user must retype the whole form to fix one field.',hint:'Submit checkout with one field left empty.'},
{id:'e5',kind:'bug',prio:'P0',hunt:[37,35],page:'Orders Page',crumbs:['Orders Page','Order History'],control:'Order history',fail:'loses placed orders after navigating away',exp:'keep every placed order',outcome:'find and track their purchases',steps:['Open Cartly and go to the Shop page.','Add a product and complete checkout.','Click Shop, then click Orders.'],defect:'Orders that were just placed disappear and the page says "No orders yet".',baseline:'The confirmation screen shows the order number right after checkout.',impact:'The user has no record of their purchase.',hint:'Place an order, go to Shop, then come back to Orders.'},
{id:'e6',kind:'fr',prio:'P1',hunt:[19,51],page:'Cart Page',crumbs:['Cart Page','Cart Line Item'],control:'Cart line item',should:'let the user change quantity or remove the item',exp:'offer quantity controls and a Remove action',outcome:'adjust the cart without starting over',defect:'Cart lines show a fixed quantity with no way to change it or remove the item.',baseline:'The real app shows − / + quantity controls and a Remove link on every cart line.',impact:'The user must abandon the cart to correct a mistake.',hint:'Compare the cart with the real-app reference.'},
{id:'e7',kind:'fr',prio:'P2',hunt:[87],page:'Shop Page',crumbs:['Shop Page','Product Toolbar'],control:'Product toolbar',should:'offer sorting by price',exp:'offer a "Sort by price" option',outcome:'find products in their budget faster',defect:'The product toolbar has no sort option.',baseline:'The real app lets the user sort products by price, low to high or high to low.',impact:'The user can still browse every product, only more slowly.',hint:'Compare the shop toolbar with the real-app reference.'},
{id:'e8',kind:'bug',prio:'P1',hunt:[74,34],page:'Confirmation Page',crumbs:['Checkout Page','Order Confirmation','Total Paid'],control:'Total paid',fail:'leaves out the Express shipping fee',exp:'include the Express shipping fee charged at checkout',outcome:'confirm what they actually paid',steps:['Open Cartly and go to the Shop page.','Add any product to the cart and open Checkout.','Fill in every field, choose Express shipping and tick the terms box.','Click "Place order" and read the Total paid on the confirmation.'],defect:'The confirmation shows the item subtotal as Total paid; the $9.00 Express fee from checkout is missing.',baseline:'With Standard shipping, the confirmation total matches the checkout total.',impact:'The user cannot confirm what they were charged and may dispute the payment.',hint:'Pay for Express shipping, then compare totals.'},
{id:'e9',kind:'fr',prio:'P2',hunt:[2],page:'Shop Page',crumbs:['Shop Page','Page Header'],control:'Shop header',should:'offer a product search bar',exp:'offer a search bar that filters products by name',outcome:'find a product without scrolling the whole catalog',defect:'The shop has no search bar; the only way to find a product is to scroll.',baseline:'The real app shows a search bar above the product grid.',impact:'The user can still find products, only more slowly.',hint:'Compare the shop header with the real-app reference.'},
{id:'e10',kind:'bug',prio:'P1',hunt:[33,16],page:'Cart Page',crumbs:['Cart Page','Promo Code','Discount'],control:'Promo discount',fail:'applies SAVE10 twice and takes 20% off',exp:'take exactly 10% off the subtotal',outcome:'see the discount the store actually offers',steps:['Open Cartly and go to the Shop page.','Click "Add to cart" on Linen Overshirt.','Open the Cart, enter SAVE10 and click Apply.','Compare the discount with the subtotal.'],defect:'On a $48.00 subtotal the discount shows −$9.60 instead of −$4.80.',baseline:'An invalid code is correctly rejected with a message.',impact:'The user is shown a lower total than the store will charge.',hint:'Apply SAVE10 and check the math.'},
{id:'e11',kind:'bug',prio:'P2',hunt:[3],page:'Shop Page',crumbs:['Shop Page','Product Card','Price'],control:'Canvas Tote price',fail:'shows "$22.0" instead of "$22.00"',exp:'show every price with two decimals',outcome:'read prices consistently',steps:['Open Cartly and go to the Shop page.','Read the price on the Canvas Tote card.'],defect:'The Canvas Tote card shows "$22.0".',baseline:'Every other product shows its price with two decimals.',impact:'The user sees a formatting slip, but the price is still clear.',hint:'Read every price on the shop grid.'},
{id:'e12',kind:'bug',prio:'P1',hunt:[52,19],page:'Cart Page',crumbs:['Cart Page','Cart Line Item','Remove Link'],control:'Remove link',fail:'removes the first item in the cart instead of the one clicked',exp:'remove only the item that was clicked',outcome:'fix their cart without losing other items',steps:['Open Cartly and go to the Shop page.','Add Linen Overshirt, then Canvas Tote to the cart.','Open the Cart and click Remove on Canvas Tote.','Read which item is left in the cart.'],defect:'Linen Overshirt is removed and Canvas Tote stays in the cart.',baseline:'With a single item in the cart, Remove empties it correctly.',impact:'The user may pay for a product they meant to remove.',hint:'Remove the second item of two.'},
{id:'e13',kind:'bug',prio:'P0',hunt:[21,93],page:'Cart Page',crumbs:['Cart Page','Checkout Button'],control:'"Checkout" button',fail:'does nothing when the cart holds two or more products',exp:'open the checkout page for any cart',outcome:'buy more than one product at a time',steps:['Open Cartly and go to the Shop page.','Add Linen Overshirt and Canvas Tote to the cart.','Open the Cart and click Checkout.'],defect:'The page stays on the Cart; checkout never opens.',baseline:'With one product in the cart, Checkout opens the checkout page.',impact:'The user cannot complete a typical multi-item purchase.',hint:'Check out with two different products.'},
{id:'e14',kind:'fr',prio:'P2',hunt:[99,96],page:'Orders Page',crumbs:['Orders Page','Order History','Order Row'],control:'Order history',should:'let the user reorder a past order',exp:'offer a "Reorder" button on each order',outcome:'buy the same items again in one tap',defect:'Past orders have no Reorder option.',baseline:'The real app shows Reorder on every past order.',impact:'The user can still add the items again by hand.',hint:'Place an order, then compare Orders with the reference.'},
{id:'e15',kind:'bug',prio:'P1',hunt:[17,32],page:'Checkout Page',crumbs:['Checkout Page','Order Summary','Shipping'],control:'Checkout summary',fail:'keeps showing Free shipping after Express is selected',exp:'add the $9.00 Express fee to the summary',outcome:'see the full price before paying',steps:['Open Cartly and go to the Shop page.','Add any product and open Checkout.','Select Express shipping.','Read the Shipping line and total in the summary.'],defect:'With Express selected, the summary still says Shipping: Free and the total leaves out $9.00.',baseline:'The Express option itself is labelled $9.00 and can be selected.',impact:'The user is shown a lower total than they will be charged.',hint:'Switch shipping and watch the summary.'},
{id:'e16',kind:'fr',prio:'P1',hunt:[11],page:'Checkout Page',crumbs:['Checkout Page','Payment Section'],control:'Payment section',should:'offer Cash on delivery as a payment method',exp:'offer Card and Cash on delivery options',outcome:'pay the way they prefer',defect:'Checkout only allows the saved card; there is no Cash on delivery option.',baseline:'The real app offers Card and Cash on delivery at checkout.',impact:'Users without a card cannot complete a purchase.',hint:'Compare the payment section with the reference.'},
{id:'e17',kind:'bug',prio:'P2',hunt:[81,20],page:'Header',crumbs:['Header','Cart Badge','Item Count'],control:'Cart badge count',fail:'does not go down after an item is removed',exp:'update the count whenever the cart changes',outcome:'trust the cart count at a glance',steps:['Open Cartly and go to the Shop page.','Add Linen Overshirt and Canvas Tote to the cart.','Open the Cart and remove one product.','Read the cart badge in the header.'],defect:'After removing a product, the badge still says 2 while the cart holds 1.',baseline:'The badge goes up correctly each time a product is added.',impact:'The user may think items are still in the cart, but checkout shows the right items.',hint:'Remove an item and watch the header.'}
],
conflicts:[['e6','e12'],['e6','e17']],
tasks:[
{code:'CART-101',t:'First purchase smoke test',brief:'A first-time shopper buys one item end to end. Make sure the basics hold.',pool:['e13','e3','e9','e1','e15','e7']},
{code:'CART-102',t:'Bulk basket',brief:'A café owner fills a big basket and edits it before paying.',pool:['e1','e12','e17','e10','e14','e11']},
{code:'CART-103',t:'Express checkout',brief:'Rush orders with Express shipping are spiking this week.',pool:['e8','e15','e4','e2','e16','e3']},
{code:'CART-104',t:'Repeat customer',brief:'A loyal customer checks past orders and buys again.',pool:['e5','e14','e2','e11','e9','e10']},
{code:'CART-105',t:'Mobile shopper',brief:'Shoppers on small screens browse, sort and adjust quantities.',pool:['e6','e3','e7','e13','e4','e16']},
{code:'CART-106',t:'Promo weekend',brief:'SAVE10 goes live Friday. Prices and discounts must add up.',pool:['e10','e1','e7','e11','e8','e14']},
{code:'CART-107',t:'Address & payment errors',brief:'Support tickets mention lost form data and surprise charges.',pool:['e4','e16','e15','e5','e17','e9']},
{code:'CART-108',t:'Full regression',brief:'Release candidate sign-off: sweep the whole store.',pool:['e12','e2','e5','e8','e16','e11']}
],
init:()=>({view:'shop',cart:[],badge:0,promo:false,promoIn:'',rmWrong:null,sort:'featured',find:'',findIn:'',form:{name:'',email:'',address:'',zip:'',ship:'standard',pay:'card',terms:false},err:'',wiped:false,processing:false,orders:[],placed:0,batch:0,seq:0,last:null,prev:'shop'}),
url(st){return st.view==='external'?'shipfast-partner.net/track/'+(st.last?st.last.id:''):'cartly.shop'+({shop:'/',cart:'/cart',checkout:'/checkout',done:'/order/confirmed',orders:'/account/orders'}[st.view]||'/')},
render(st){
if(st.view==='external') return '<div class="rp-ext-site"><header>ShipFast Partner Tracking</header><div class="rp-502"'+H('t2')+'><b>502</b><span>Bad Gateway</span><span class="rp-muted">The tracking service is not responding. Try again later.</span></div><div style="text-align:center"><button class="rp-btn ghost" data-act="back">← Back to Cartly</button></div></div>';
const count=st.cart.reduce((a,c)=>a+c.qty,0);
let m='';
const nav='<nav class="rp-nav"><span class="rp-logo">Cartly</span><button class="rp-link'+(st.view==='shop'?' on':'')+'" data-act="go" data-arg="shop">Shop</button><button class="rp-link rp-off" title="Coming soon" data-act="soon"'+H('t1')+'>'+IC.ban+' Gift cards</button><button class="rp-link'+(st.view==='orders'?' on':'')+'" data-act="go" data-arg="orders">Orders</button><button class="rp-pill" data-act="go" data-arg="cart"'+H('e3')+'>Cart · <span'+H('e17',st.badge!==count)+'>'+st.badge+'</span> '+(B('e3')?'itms':'items')+'</button></nav>';
if(st.view==='shop'){
let list=[...CT_P];
if(!B('e9')&&st.find)list=list.filter(p=>p.name.toLowerCase().includes(st.find.toLowerCase()));
if(!B('e7')){if(st.sort==='low')list.sort((a,b)=>a.price-b.price);if(st.sort==='high')list.sort((a,b)=>b.price-a.price)}
m='<div class="rp-tool"'+H('e9')+'><h2 class="rp-h">New arrivals</h2>'+(B('e9')?'':'<form class="rp-step" data-act="find" novalidate><input class="rp-in sm" id="ct-find" placeholder="Search products" aria-label="Search products" data-bind="findIn" value="'+esc(st.findIn)+'" autocomplete="off"><button type="submit" class="rp-btn sm">Search</button></form>')+'</div>'+
'<div class="rp-tool"'+H('e7')+'><span class="rp-muted">'+list.length+' products'+(st.find&&!B('e9')?' matching "'+esc(st.find)+'"':'')+'</span>'+(B('e7')?'':'<label class="rp-inl" for="ct-sort">Sort by <select class="rp-in sm" id="ct-sort" data-bind="sort" data-act="noop"><option value="featured"'+sel('featured',st.sort)+'>Featured</option><option value="low"'+sel('low',st.sort)+'>Price: low to high</option><option value="high"'+sel('high',st.sort)+'>Price: high to low</option></select></label>')+'</div><div class="rp-grid">'+list.map(p=>'<div class="rp-card"><div class="rp-ph"'+H('t4')+'>Photo</div><div class="rp-pn">'+p.name+'</div><div class="rp-pr"'+H('e11',p.id==='p2')+'>'+(B('e11')&&p.id==='p2'?'$22.0':money(p.price))+'</div><button class="rp-btn sm" data-act="add" data-arg="'+p.id+'">Add to cart</button></div>').join('')+'</div>';
}
if(st.view==='cart'){
if(!st.cart.length) m='<h2 class="rp-h">Your cart</h2><div class="rp-empty"><b>Your cart is empty</b><button class="rp-btn" data-act="go" data-arg="shop">Browse products</button></div>';
else{
const s=ctSub(st), e1=B('e1')&&st.cart.some(c=>c.qty>1);
m='<h2 class="rp-h">Your cart</h2><div class="rp-card">'+st.cart.map(c=>{const p=ctProd(c.id);return '<div class="rp-row"'+H('e6')+H('e12',c.id===st.rmWrong)+'><div><div class="rp-pn">'+p.name+'</div><div class="rp-muted rp-small">'+money(p.price)+' each</div></div>'+(B('e6')?'<span class="rp-muted">Qty '+c.qty+'</span>':'<div class="rp-qty"><button class="rp-sq" data-act="dec" data-arg="'+c.id+'" aria-label="Decrease quantity">−</button><span>'+c.qty+'</span><button class="rp-sq" data-act="inc" data-arg="'+c.id+'" aria-label="Increase quantity">+</button><button class="rp-link sm" data-act="rm" data-arg="'+c.id+'">Remove</button></div>')+'</div>'}).join('')+'<div class="rp-row rp-total"'+H('e1',e1)+'><span>Subtotal</span><b>'+money(s)+'</b></div>'+(st.promo?'<div class="rp-row"'+H('e10')+'><span>Discount · SAVE10</span><span>−'+money(ctDisc(st))+'</span></div>':'<form class="rp-step" data-act="promo" novalidate><input class="rp-in sm" id="ct-promo" placeholder="Promo code" aria-label="Promo code" data-bind="promoIn" value="'+esc(st.promoIn)+'" autocomplete="off"><button type="submit" class="rp-btn sm ghost">Apply</button></form>')+'</div><div class="rp-actions"><button class="rp-btn ghost" data-act="go" data-arg="shop">Keep shopping</button><button class="rp-btn" data-act="go" data-arg="checkout"'+H('e13',st.cart.length>=2)+'>Checkout</button></div>';
}
}
if(st.view==='checkout'){
const f=st.form,s=ctSub(st),disc=ctDisc(st),ship=f.ship==='express'?9:0,shipShown=B('e15')?0:ship,ready=!!f.terms,lock=!ready||(st.processing&&!B('e2'));
m='<h2 class="rp-h">Checkout</h2><div class="rp-split"><form class="rp-card rp-form" data-act="place" novalidate'+H('e4',st.wiped)+'>'+(st.err?'<div class="rp-err" role="alert">'+esc(st.err)+'</div>':'')+
'<label for="ct-name">Full name<input class="rp-in" id="ct-name" data-bind="form.name" value="'+esc(f.name)+'" autocomplete="off"></label>'+
'<label for="ct-email">Email<input class="rp-in" id="ct-email" type="email" data-bind="form.email" value="'+esc(f.email)+'" autocomplete="off"></label>'+
'<label for="ct-addr">Address<input class="rp-in" id="ct-addr" data-bind="form.address" value="'+esc(f.address)+'" autocomplete="off"></label>'+
'<label for="ct-zip">ZIP code<input class="rp-in" id="ct-zip" data-bind="form.zip" value="'+esc(f.zip)+'" autocomplete="off"></label>'+
'<fieldset class="rp-fs"><legend>Shipping</legend><label class="rp-rad" for="ct-s1"><input type="radio" name="ct-ship" id="ct-s1" value="standard" data-bind="form.ship" data-act="noop"'+chk(f.ship==='standard')+'> Standard · Free</label><label class="rp-rad" for="ct-s2"><input type="radio" name="ct-ship" id="ct-s2" value="express" data-bind="form.ship" data-act="noop"'+chk(f.ship==='express')+'> Express · $9.00</label></fieldset>'+
(B('e16')?'<div class="rp-fs"'+H('e16')+'><span class="rp-lbl">Payment</span><span class="rp-muted rp-small">Saved card ending 4242</span></div>':'<fieldset class="rp-fs"><legend>Payment</legend><label class="rp-rad" for="ct-p1"><input type="radio" name="ct-pay" id="ct-p1" value="card" data-bind="form.pay" data-act="noop"'+chk(f.pay!=='cod')+'> Card ending 4242</label><label class="rp-rad" for="ct-p2"><input type="radio" name="ct-pay" id="ct-p2" value="cod" data-bind="form.pay" data-act="noop"'+chk(f.pay==='cod')+'> Cash on delivery</label></fieldset>')+
'<label class="rp-chk" for="ct-terms"><input type="checkbox" id="ct-terms" data-bind="form.terms" data-act="noop"'+chk(f.terms)+'> I agree to the terms of sale</label>'+
'<span class="rp-wrapbtn"'+H('t3',!ready)+'><button type="submit" class="rp-btn wide" id="ct-place"'+dis(lock)+'>'+(st.processing?'Processing…':'Place order')+'</button></span></form>'+
'<div class="rp-card"><b>Summary</b><div class="rp-row"><span>Subtotal</span><span>'+money(s)+'</span></div>'+(disc?'<div class="rp-row"><span>Discount</span><span>−'+money(disc)+'</span></div>':'')+'<div class="rp-row"'+H('e15',f.ship==='express')+'><span>Shipping</span><span>'+(shipShown?money(shipShown):'Free')+'</span></div><div class="rp-row rp-total"><span>Total</span><b>'+money(s-disc+shipShown)+'</b></div></div></div>';
}
if(st.view==='done'){
const o=st.last;
m='<div class="rp-ok"><b>Order #'+o.id+' is confirmed.</b> A receipt is on its way to your email.</div><div class="rp-card"><div class="rp-row"><span>Items</span><span>'+o.items+'</span></div><div class="rp-row"><span>Shipping</span><span>'+(o.exp?'Express':'Standard')+'</span></div><div class="rp-row rp-total"'+H('e8',o.paid!==o.total)+'><span>Total paid</span><b>'+money(o.paid)+'</b></div><div class="rp-row"><span>Tracking</span><button class="rp-ext" data-act="ext">Track with ShipFast '+IC.ext+'</button></div></div><div class="rp-actions"><button class="rp-btn ghost" data-act="go" data-arg="shop">Continue shopping</button><button class="rp-btn" data-act="go" data-arg="orders">View orders</button></div>';
}
if(st.view==='orders'){
if(!st.orders.length) m='<h2 class="rp-h">Order history</h2><div class="rp-empty"'+H('e5',st.placed>0)+'><b>No orders yet</b><span class="rp-muted">Orders you place appear here.</span></div>';
else{const cnt={};st.orders.forEach(o=>cnt[o.batch]=(cnt[o.batch]||0)+1);
m='<h2 class="rp-h">Order history</h2><div class="rp-card"'+H('e14')+'>'+st.orders.map(o=>'<div class="rp-row"'+H('e2',cnt[o.batch]>1)+'><span><b>Order #'+o.id+'</b></span><span class="rp-muted">'+o.items+' item'+(o.items>1?'s':'')+'</span><span class="rp-badge g">Paid</span><b>'+money(o.paid)+'</b>'+(B('e14')?'':'<button class="rp-btn sm ghost" data-act="reorder" data-arg="'+o.id+'">Reorder</button>')+'</div>').join('')+'</div>';}
}
return nav+'<div class="rp-main">'+m+'</div>';
},
acts:{
go(st,a){if(a==='shop'&&B('e5'))st.orders=[];if(a==='checkout'&&!st.cart.length){rpToast('Your cart is empty.');return}if(a==='checkout'&&st.view==='cart'&&B('e13')&&st.cart.length>=2)return;st.err='';st.wiped=false;st.view=a},
soon(){rpToast('Gift cards are coming soon.')},
find(st){st.find=st.findIn.trim()},
add(st,id){const c=st.cart.find(x=>x.id===id);if(c)c.qty++;else st.cart.push({id,qty:1});st.badge=ctCount(st);rpToast('Added to cart')},
inc(st,id){const c=st.cart.find(x=>x.id===id);if(c)c.qty++;st.badge=ctCount(st)},
dec(st,id){const c=st.cart.find(x=>x.id===id);if(c){c.qty--;if(c.qty<1)st.cart=st.cart.filter(x=>x!==c)}if(!B('e17'))st.badge=ctCount(st)},
rm(st,id){if(B('e12')&&st.cart.length>1&&st.cart[0].id!==id){st.rmWrong=id;st.cart.shift()}else{st.cart=st.cart.filter(x=>x.id!==id);if(st.rmWrong===id)st.rmWrong=null}if(!B('e17'))st.badge=ctCount(st)},
promo(st){if(st.promoIn.trim().toUpperCase()==='SAVE10'){st.promo=true;rpToast('SAVE10 applied.')}else rpToast('That code is not valid.')},
reorder(st,id){const o=st.orders.find(x=>String(x.id)===String(id));(o&&o.lines||[]).forEach(l=>{const c=st.cart.find(x=>x.id===l.id);if(c)c.qty+=l.qty;else st.cart.push({id:l.id,qty:l.qty})});st.badge=ctCount(st);rpToast('Items added to your cart.')},
noop(){},
ext(st){st.prev=st.view;st.view='external'},
back(st){st.view=st.prev||'shop'},
place(st){
const f=st.form;
if(!f.terms){rpToast('Tick the terms box to place your order.');return}
if(st.processing&&!B('e2'))return false;
const miss=[['name','Full name'],['email','Email'],['address','Address'],['zip','ZIP code']].filter(([k])=>!String(f[k]).trim());
if(miss.length){st.err='Please fill in: '+miss.map(x=>x[1]).join(', ')+'.';if(B('e4')){f.name=f.email=f.address=f.zip='';st.wiped=true}return}
st.err='';st.wiped=false;
if(!st.processing){st.batch++;st.processing=true;const r=run;setTimeout(()=>{if(run!==r||run.over)return;st.processing=false;st.cart=[];st.badge=0;st.view='done';rr()},1200)}
const fee=f.ship==='express'?9:0,sub=ctSub(st)-ctDisc(st),tot=sub+fee;
const o={id:1042+st.seq++,batch:st.batch,items:st.cart.reduce((a,c)=>a+c.qty,0),total:tot,paid:B('e8')?sub:tot,exp:fee>0,lines:st.cart.map(c=>({id:c.id,qty:c.qty}))};
st.orders.push(o);st.placed++;if(!st.last||st.last.batch!==o.batch)st.last=o;
}
}
};

/* ---------- StayNest ---------- */
const SN_H=[{id:'h1',name:'Harbor View Suites',area:'Waterfront',rate:120},{id:'h2',name:'Mango Grove Inn',area:'Old Town',rate:85},{id:'h3',name:'Coral Bay Resort',area:'Beachfront',rate:160}];
const snNights=(ci,co)=>Math.round((Date.parse(co)-Date.parse(ci))/864e5);
const snRate=(h,rt)=>h.rate+(rt==='deluxe'&&!B('h8')?40:0);
const StayNest={
id:'staynest',name:'StayNest',cat:'Hospitality',brand:'#1B6CA8',flow:'Search → Room → Book → My trips',
features:['Search by city, dates and guests','Filter results by price','View room types, amenities and book','Special requests on the booking form','Booking confirmation with stay summary','Download a receipt after booking','My trips list','Change dates on a confirmed booking','Cancel a booking','Read guest reviews on a partner site'],
notes:['Taxes are estimated until payment; totals show "Taxes est.".','Partner reviews open on an external site.'],
traps:[{id:'t1',gate:2,label:'"Pay with points" link',why:'It shows a not-allowed cursor and "Not implemented".'},{id:'t2',gate:1,label:'TravelWorld reviews error',why:'The error happens on an external partner site, outside StayNest.'},{id:'t3',gate:3,label:'Disabled "Book now" button',why:'It stays disabled until a room type is chosen, a prerequisite.'},{id:'t4',gate:4,label:'"Taxes est." label',why:'Release notes say taxes are estimated until payment.'}],
defects:[
{id:'h1',kind:'bug',prio:'P1',hunt:[62,14],page:'Search Page',crumbs:['Search Page','Date Pickers','Results Summary'],control:'Date range validation',fail:'accepts a check-out date before check-in and shows negative nights',exp:'reject a check-out date earlier than check-in',outcome:'book a valid stay',steps:['Open StayNest and go to the Search page.','Set check-in to 13 Dec and check-out to 10 Dec.','Click "Search stays".','Read the nights and totals on the results page.'],defect:'The search runs and the results show "−3 nights" with negative totals.',baseline:'With check-out after check-in, nights and totals calculate correctly.',impact:'The user can start a booking with impossible dates and a nonsense price.',hint:'Search with check-out before check-in.'},
{id:'h2',kind:'bug',prio:'P1',hunt:[25,24],page:'Results Page',crumbs:['Search Page','Guests Selector','Results Summary'],control:'Guests selector',fail:'is ignored and results always show 1 guest',exp:'carry the selected guest count into the results',outcome:'see rooms and prices for their real party size',steps:['Open StayNest and go to the Search page.','Set Guests to 3.','Click "Search stays".','Read the summary line above the results.'],defect:'The results summary shows "1 guest" after 3 guests were selected.',baseline:'The city and dates from the same search carry over correctly.',impact:'The user may book a room that does not fit their group.',hint:'Change Guests, search, then read the summary line.'},
{id:'h3',kind:'bug',prio:'P1',hunt:[81,85],page:'Trip Details Page',crumbs:['My Trips','Trip Details','Booking Status'],control:'Trip status',fail:'still shows "Confirmed" after the booking is cancelled',exp:'show "Cancelled" everywhere once cancelled',outcome:'trust the status of their trip',steps:['Open StayNest and complete a booking.','Open My trips and select the booking.','Click "Cancel booking".','Compare the status on the trip details with the My trips list.'],defect:'The trip details header still says "Confirmed" while My trips says "Cancelled".',baseline:'The My trips list updates to "Cancelled" straight away.',impact:'The user cannot tell whether the cancellation went through.',hint:'Cancel a trip, then compare the list and the details.'},
{id:'h4',kind:'bug',prio:'P2',hunt:[30],page:'Confirmation Page',crumbs:['Booking Flow','Confirmation Page','Stay Summary'],control:'Stay summary',fail:'misspells "nights" as "nigths"',exp:'spell "nights" correctly',outcome:'read the confirmation clearly',steps:['Open StayNest and complete a booking.','Read the stay summary on the confirmation page.'],defect:'The confirmation reads "3 nigths" instead of "3 nights".',baseline:'The number of nights and the total are correct.',impact:'The user sees a typo, but the booking details are right.',hint:'Read the confirmation slowly.'},
{id:'h5',kind:'bug',prio:'P0',hunt:[40,21],page:'Booking Page',crumbs:['Booking Flow','Confirm Booking Button','My Trips'],control:'"Confirm booking" button',fail:'shows success but never creates the trip',exp:'create the trip and list it in My trips',outcome:'have a real reservation',steps:['Open StayNest and go to the Search page.','Search, open any hotel and choose a room type.','Click "Book now" and fill in name and email.','Click "Confirm booking", then open My trips.'],defect:'The confirmation appears, but My trips stays empty.',baseline:'The confirmation screen shows the hotel, nights and total.',impact:'The user believes they have a room when no booking exists.',hint:'Book, then look for the trip in My trips.'},
{id:'h6',kind:'fr',prio:'P1',hunt:[51],page:'Trip Details Page',crumbs:['My Trips','Trip Details','Actions'],control:'Trip details actions',should:'let the user change the dates of a confirmed booking',exp:'offer a "Change dates" action',outcome:'adjust a trip without cancelling and rebooking',defect:'The trip details only offer "Cancel booking"; there is no way to change dates.',baseline:'The real app offers "Change dates" on every confirmed booking.',impact:'The user must cancel and rebook to adjust a stay, and may lose the rate.',hint:'Open a trip and compare its actions with the reference.'},
{id:'h7',kind:'fr',prio:'P2',hunt:[87],page:'Results Page',crumbs:['Results Page','Results Toolbar'],control:'Results toolbar',should:'offer a price filter',exp:'offer an "Under $100" price filter',outcome:'narrow results to their budget',defect:'The results toolbar has no price filter.',baseline:'The real app lets the user filter stays by price.',impact:'The user can still compare every stay by scrolling.',hint:'Compare the results toolbar with the reference.'},
{id:'h8',kind:'bug',prio:'P1',hunt:[33,26],page:'Booking Page',crumbs:['Room Page','Room Type','Booking Summary'],control:'Booking summary rate',fail:'charges the Standard rate after Deluxe King is chosen',exp:'carry the Deluxe King rate into the booking summary',outcome:'pay the price shown for the room they picked',steps:['Open StayNest and go to the Search page.','Search, open any hotel and choose Deluxe King.','Click "Book now".','Compare the nightly rate in the summary with the room page.'],defect:'The summary lists Deluxe King at the Standard Queen rate, $40.00 less per night than the room page shows.',baseline:'Choosing Standard Queen carries the correct rate into the summary.',impact:'The user cannot trust the price and may be charged a different amount at the hotel.',hint:'Pick the pricier room, then read the summary rate.'},
{id:'h9',kind:'fr',prio:'P2',hunt:[78],page:'Confirmation Page',crumbs:['Booking Flow','Confirmation Page','Next Steps'],control:'Confirmation actions',should:'offer a downloadable receipt',exp:'offer a "Download receipt" button',outcome:'keep proof of the booking',defect:'The confirmation has no way to download a receipt.',baseline:'The real app offers "Download receipt" on every confirmed booking.',impact:'The user can still read the booking details on screen.',hint:'Compare the confirmation with the reference.'},
{id:'h10',kind:'bug',prio:'P2',hunt:[34,87],page:'Results Page',crumbs:['Results Page','Results Toolbar','Under $100 Filter'],control:'"Under $100" filter',fail:'still lists stays that cost more than $100',exp:'show only stays under $100 a night',outcome:'see only stays within their budget',steps:['Open StayNest and go to the Search page.','Click "Search stays".','Click "Under $100".','Read the nightly prices in the results.'],defect:'With Under $100 on, Harbor View Suites ($120.00) and Coral Bay Resort ($160.00) still appear.',baseline:'The All filter correctly lists every stay.',impact:'The user can still find a cheap stay by reading each price.',hint:'Turn on the price filter and read every price.'},
{id:'h11',kind:'bug',prio:'P2',hunt:[31],page:'Results Page',crumbs:['Results Page','Hotel Card','Area Label'],control:'Coral Bay Resort area label',fail:'reads "Beachfornt" instead of "Beachfront"',exp:'spell the area name correctly',outcome:'read the location clearly',steps:['Open StayNest and go to the Search page.','Click "Search stays".','Read the area label on the Coral Bay Resort card.'],defect:'The card reads "Beachfornt".',baseline:'The other hotel cards spell their areas correctly.',impact:'The user sees a typo, but the location is still understandable.',hint:'Read every label on the results.'},
{id:'h12',kind:'bug',prio:'P1',hunt:[32,38],page:'Booking Page',crumbs:['Booking Flow','Booking Summary','Total'],control:'Booking total',fail:'charges one night instead of the whole stay',exp:'multiply the nightly rate by the number of nights',outcome:'know the real cost of the stay',steps:['Open StayNest and search the default 3-night stay.','Open Harbor View Suites and choose Standard Queen.','Click "Book now".','Compare the total with the rate and nights.'],defect:'For 3 nights at $120.00 the total shows $120.00 instead of $360.00.',baseline:'The Nights row correctly shows 3.',impact:'The user is shown a total far below what the hotel will charge.',hint:'Multiply rate by nights yourself.'},
{id:'h13',kind:'bug',prio:'P1',hunt:[4,22],page:'Room Page',crumbs:['Results Page','View Rooms Button','Room Page'],control:'Mango Grove Inn room page',fail:'opens blank',exp:'load the room types for every hotel',outcome:'book Mango Grove Inn',steps:['Open StayNest and go to the Search page.','Click "Search stays".','Click "View rooms" on Mango Grove Inn.'],defect:'The room page for Mango Grove Inn is completely blank.',baseline:'Room pages for the other two hotels load normally.',impact:'The user cannot book the cheapest hotel, though other hotels still work.',hint:'Open every hotel\'s rooms.'},
{id:'h14',kind:'bug',prio:'P1',hunt:[58,85],page:'Trip Details Page',crumbs:['My Trips','Trip Details','Cancel Booking Button'],control:'"Cancel booking" button',fail:'cancels a different trip when the user has more than one',exp:'cancel only the trip that is open',outcome:'cancel the right booking',steps:['Open StayNest and complete two bookings.','Open My trips and open the second booking.','Click "Cancel booking".','Return to My trips and read both statuses.'],defect:'The first booking shows Cancelled while the one actually cancelled stays Confirmed.',baseline:'With a single booking, Cancel booking cancels it correctly.',impact:'The user loses a trip they wanted to keep.',hint:'Book twice, then cancel the second trip.'},
{id:'h15',kind:'fr',prio:'P2',hunt:[9],page:'Room Page',crumbs:['Room Page','Room Details'],control:'Room details',should:'list the hotel amenities',exp:'list amenities such as Wi-Fi, breakfast and pool',outcome:'compare what each stay includes',defect:'The room page shows no amenities.',baseline:'The real app lists amenities on every room page.',impact:'The user can still book and check amenities elsewhere.',hint:'Compare a room page with the reference.'},
{id:'h16',kind:'fr',prio:'P2',hunt:[12],page:'Booking Page',crumbs:['Booking Flow','Booking Form'],control:'Booking form',should:'offer a Special requests field',exp:'offer an optional Special requests field',outcome:'ask for things like a late check-in',defect:'The booking form has no place for special requests.',baseline:'The real app offers an optional Special requests field.',impact:'The user can still book and contact the hotel separately.',hint:'Compare the booking form with the reference.'},
{id:'h17',kind:'bug',prio:'P1',hunt:[53,59],page:'Trip Details Page',crumbs:['My Trips','Trip Details','Trip Total'],control:'Trip total',fail:'keeps the old amount after the dates change',exp:'recalculate the total for the new dates',outcome:'know what the changed stay costs',steps:['Open StayNest and complete a 3-night booking.','Open the trip in My trips and click "Change dates".','Move check-out one day later and click "Save new dates".','Compare the nights with the total.'],defect:'The trip now shows 4 nights, but the total still shows the 3-night amount.',baseline:'The nights count updates to 4 correctly.',impact:'The user is not told the new price before arriving.',hint:'Change a trip\'s dates and check the total.'}
],
conflicts:[['h5','h3'],['h5','h6'],['h7','h10'],['h5','h14'],['h6','h17'],['h5','h17']],
tasks:[
{code:'STAY-201',t:'Weekend getaway search',brief:'Couples are searching beach stays for this weekend.',pool:['h1','h2','h7','h11','h4','h15']},
{code:'STAY-202',t:'Booking confirmation',brief:'Guests report confirmations that do not match their stay.',pool:['h5','h4','h8','h12','h9','h16']},
{code:'STAY-203',t:'Trip management',brief:'Frequent travellers juggle several trips at once.',pool:['h3','h6','h14','h9','h12','h2']},
{code:'STAY-204',t:'Budget traveller',brief:'Backpackers filter by price and watch every peso.',pool:['h10','h8','h12','h11','h16','h1']},
{code:'STAY-205',t:'Date changes',brief:'Plans changed: guests extend and cancel their stays.',pool:['h17','h3','h14','h15','h4','h2']},
{code:'STAY-206',t:'Room selection',brief:'Guests compare hotels and room types before booking.',pool:['h13','h8','h15','h16','h11','h7']},
{code:'STAY-207',t:'Group trip',brief:'A barkada of four books rooms together.',pool:['h2','h13','h5','h9','h10','h12']},
{code:'STAY-208',t:'Full regression',brief:'Release candidate sign-off: sweep every booking path.',pool:['h1','h13','h14','h6','h16','h10']}
],
init:()=>({view:'search',s:{city:'Cebu',ci:'2026-12-10',co:'2026-12-13',g:'2'},q:null,err:'',filter:'all',hotel:null,rtype:'',form:{name:'',email:'',req:''},berr:'',trips:[],booked:0,trip:null,edit:false,newCo:'',prev:'search',last:null}),
url(st){return st.view==='external'?'travelworld-reviews.net/hotels/'+(st.hotel||''):'staynest.travel'+({search:'/',results:'/search',room:'/hotel',book:'/book',done:'/book/confirmed',trips:'/trips',trip:'/trips/'+(st.trip||'')}[st.view]||'/')},
render(st){
if(st.view==='external') return '<div class="rp-ext-site"><header>TravelWorld Reviews</header><div class="rp-502"'+H('t2')+'><b>500</b><span>Internal Server Error</span><span class="rp-muted">We could not load reviews right now.</span></div><div style="text-align:center"><button class="rp-btn ghost" data-act="back">← Back to StayNest</button></div></div>';
const nav='<nav class="rp-nav"><span class="rp-logo">StayNest</span><button class="rp-link'+(['search','results','room','book','done'].includes(st.view)?' on':'')+'" data-act="go" data-arg="search">Stays</button><button class="rp-link'+(st.view.startsWith('trip')?' on':'')+'" data-act="go" data-arg="trips">My trips</button><button class="rp-link rp-off" title="Not implemented" data-act="soon"'+H('t1')+'>'+IC.ban+' Pay with points</button></nav>';
let m='';const q=st.q;
if(st.view==='search'){
const s=st.s;
m='<h2 class="rp-h">Find your next stay</h2><form class="rp-card rp-form" data-act="search" novalidate>'+(st.err?'<div class="rp-err" role="alert">'+esc(st.err)+'</div>':'')+
'<label for="sn-city">Destination<select class="rp-in" id="sn-city" data-bind="s.city">'+['Cebu','Boracay','Palawan'].map(c=>'<option'+sel(c,s.city)+'>'+c+'</option>').join('')+'</select></label>'+
'<div class="rp-split" style="grid-template-columns:repeat(3,minmax(0,1fr))"><label for="sn-ci">Check-in<input class="rp-in" type="date" id="sn-ci" data-bind="s.ci" value="'+s.ci+'"></label><label for="sn-co">Check-out<input class="rp-in" type="date" id="sn-co" data-bind="s.co" value="'+s.co+'"></label><label for="sn-g">Guests<select class="rp-in" id="sn-g" data-bind="s.g">'+['1','2','3','4'].map(g=>'<option'+sel(g,s.g)+'>'+g+'</option>').join('')+'</select></label></div>'+
'<button type="submit" class="rp-btn">Search stays</button></form>';
}
if(st.view==='results'){
const gShown=B('h2')?1:+q.g, neg=q.nights<=0;
let list=[...SN_H]; if(!B('h7')&&!B('h10')&&st.filter==='under')list=list.filter(h=>h.rate<100);
m='<h2 class="rp-h">Stays in '+q.city+'</h2><div class="rp-tool"'+H('h7')+'><span class="rp-muted"><span'+H('h1',neg)+'>'+(q.nights<0?'−'+Math.abs(q.nights):q.nights)+' nights</span> · <span'+H('h2',B('h2')&&+q.g!==1)+'>'+gShown+' guest'+(gShown>1?'s':'')+'</span></span>'+(B('h7')?'':'<span class="rp-step"><button class="rp-btn sm'+(st.filter==='all'?'':' ghost')+'" data-act="filter" data-arg="all">All</button><button class="rp-btn sm'+(st.filter==='under'?'':' ghost')+'" data-act="filter" data-arg="under">Under $100</button></span>')+'</div>'+
'<div class="rp-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">'+list.map(h=>'<div class="rp-card"'+H('h10',st.filter==='under'&&h.rate>=100)+'><div class="rp-ph">'+h.area+'</div><div class="rp-pn">'+h.name+'</div><div class="rp-muted rp-small"'+H('h11',h.id==='h3')+'>'+(B('h11')&&h.id==='h3'?'Beachfornt':h.area)+' · '+money(h.rate)+' / night</div><div class="rp-row"><span'+H('h1',neg)+'>'+money(h.rate*q.nights)+' total</span><span class="rp-badge"'+H('t4')+'>Taxes est.</span></div><button class="rp-ext" data-act="ext" data-arg="'+h.id+'">Reviews on TravelWorld '+IC.ext+'</button><button class="rp-btn sm" data-act="room" data-arg="'+h.id+'">View rooms</button></div>').join('')+'</div>';
}
if(st.view==='room'){
if(B('h13')&&st.hotel==='h2')return nav+'<div class="rp-main"><div class="rp-blank"'+H('h13')+'></div></div>';
const h=SN_H.find(x=>x.id===st.hotel),ready=!!st.rtype;
m='<button class="rp-link sm" data-act="go" data-arg="results">← Back to results</button><h2 class="rp-h">'+h.name+'</h2><div class="rp-ph" style="aspect-ratio:21/6">'+h.area+'</div><div class="rp-card"'+H('h15')+'><b>Choose a room type</b>'+(B('h15')?'':'<span class="rp-muted rp-small">Free Wi-Fi · Breakfast included · Pool · Airport shuttle</span>')+'<label class="rp-rad" for="sn-r1"><input type="radio" name="sn-r" id="sn-r1" value="standard" data-bind="rtype" data-act="noop"'+chk(st.rtype==='standard')+'> Standard Queen · '+money(h.rate)+' / night</label><label class="rp-rad" for="sn-r2"><input type="radio" name="sn-r" id="sn-r2" value="deluxe" data-bind="rtype" data-act="noop"'+chk(st.rtype==='deluxe')+'> Deluxe King · '+money(h.rate+40)+' / night</label></div><span class="rp-wrapbtn"'+H('t3',!ready)+'><button class="rp-btn wide" data-act="book"'+dis(!ready)+'>Book now</button></span>';
}
if(st.view==='book'){
const h=SN_H.find(x=>x.id===st.hotel),rate=snRate(h,st.rtype),tot=B('h12')?rate:rate*q.nights;
m='<h2 class="rp-h">Confirm your booking</h2><div class="rp-split"><form class="rp-card rp-form" data-act="confirm" novalidate'+H('h16')+'>'+(st.berr?'<div class="rp-err" role="alert">'+esc(st.berr)+'</div>':'')+'<label for="sn-n">Guest name<input class="rp-in" id="sn-n" data-bind="form.name" value="'+esc(st.form.name)+'" autocomplete="off"></label><label for="sn-e">Email<input class="rp-in" id="sn-e" type="email" data-bind="form.email" value="'+esc(st.form.email)+'" autocomplete="off"></label>'+(B('h16')?'':'<label for="sn-sr">Special requests (optional)<input class="rp-in" id="sn-sr" data-bind="form.req" value="'+esc(st.form.req)+'" autocomplete="off"></label>')+'<button type="submit" class="rp-btn">Confirm booking</button></form><div class="rp-card"><b>'+h.name+'</b><div class="rp-row"'+H('h8',st.rtype==='deluxe')+'><span>'+(st.rtype==='deluxe'?'Deluxe King':'Standard Queen')+'</span><span>'+money(rate)+' / night</span></div><div class="rp-row"><span>Nights</span><span'+H('h1',q.nights<=0)+'>'+q.nights+'</span></div><div class="rp-row rp-total"'+H('h12',q.nights>1)+'><span>Total</span><b>'+money(tot)+'</b></div></div></div>';
}
if(st.view==='done'){
const L=st.last;
m='<div class="rp-ok"><b>Booking confirmed.</b> We sent the details to '+esc(L.email)+'.</div><div class="rp-card"><div class="rp-pn">'+L.hotel+'</div><div'+H('h4')+'>'+L.nights+' '+(B('h4')?'nigths':'nights')+' · '+L.room+'</div><div class="rp-row rp-total"><span>Total</span><b>'+money(L.total)+'</b></div></div><div class="rp-actions"'+H('h9')+'>'+(B('h9')?'':'<button class="rp-btn ghost" data-act="receipt">Download receipt</button>')+'<button class="rp-btn" data-act="go" data-arg="trips">View my trips</button></div>';
}
if(st.view==='trips'){
m='<h2 class="rp-h">My trips</h2>'+(st.trips.length?'<div class="rp-card">'+st.trips.map(t=>'<div class="rp-row"><span><b>'+t.hotel+'</b><br><span class="rp-muted rp-small">'+t.id+' · '+t.nights+' nights</span></span><span class="rp-badge '+(t.status==='Cancelled'?'r':'g')+'"'+H('h14',t.id===st.wrongCancel)+'>'+t.status+'</span><button class="rp-btn sm ghost" data-act="trip" data-arg="'+t.id+'">Open</button></div>').join('')+'</div>':'<div class="rp-empty"'+H('h5',st.booked>0)+'><b>No trips yet</b><span class="rp-muted">Bookings you make appear here.</span></div>');
}
if(st.view==='trip'){
const t=st.trips.find(x=>x.id===st.trip),shown=(B('h3')&&t.status==='Cancelled')?'Confirmed':t.status;
m='<button class="rp-link sm" data-act="go" data-arg="trips">← My trips</button><div class="rp-card"><div class="rp-row"><h2 class="rp-h">'+t.hotel+'</h2><span class="rp-badge '+(shown==='Cancelled'?'r':'g')+'"'+H('h3',shown!==t.status)+'>'+shown+'</span></div><div class="rp-row"><span>Booking</span><span class="mono">'+t.id+'</span></div><div class="rp-row"><span>Dates</span><span>'+t.ci+' → '+t.co+' · '+t.nights+' nights</span></div><div class="rp-row rp-total"'+H('h17',!!t.stale)+'><span>Total</span><b>'+money(t.total)+'</b></div></div>'+
(t.status==='Cancelled'?'<p class="rp-muted">This booking is cancelled.</p>':'<div class="rp-actions"'+H('h6')+' style="justify-content:flex-start">'+(B('h6')?'':'<button class="rp-btn ghost" data-act="edit">Change dates</button>')+'<button class="rp-btn ghost" data-act="cancel">Cancel booking</button></div>')+
(st.edit&&!B('h6')&&t.status!=='Cancelled'?'<form class="rp-card rp-form" data-act="savedates" novalidate><label for="sn-nco">New check-out<input class="rp-in" type="date" id="sn-nco" data-bind="newCo" value="'+st.newCo+'"></label><button type="submit" class="rp-btn">Save new dates</button></form>':'');
}
return nav+'<div class="rp-main">'+m+'</div>';
},
acts:{
go(st,a){if(a==='results'&&!st.q)a='search';st.edit=false;st.view=a},
soon(){rpToast('Paying with points is not implemented.')},
noop(){},
receipt(){rpToast('Receipt downloaded.')},
search(st){const s=st.s,n=snNights(s.ci,s.co);if(!(n>0)&&!B('h1')){st.err='Check-out must be after check-in.';return}st.err='';st.q={city:s.city,ci:s.ci,co:s.co,g:s.g,nights:n};st.view='results'},
filter(st,a){st.filter=a},
ext(st,id){st.prev=st.view;if(id)st.hotel=id;st.view='external'},
back(st){st.view=st.prev||'search'},
room(st,id){st.hotel=id;st.rtype='';st.view='room'},
book(st){if(!st.rtype){rpToast('Choose a room type first.');return}st.berr='';st.view='book'},
confirm(st){
const f=st.form;if(!f.name.trim()||!f.email.trim()){st.berr='Enter the guest name and email.';return}
const h=SN_H.find(x=>x.id===st.hotel),rate=snRate(h,st.rtype),q=st.q;
const t={id:'SN-'+(2401+st.booked),hotel:h.name,room:st.rtype==='deluxe'?'Deluxe King':'Standard Queen',rate,nights:q.nights,ci:q.ci,co:q.co,total:B('h12')?rate:rate*q.nights,status:'Confirmed',email:f.email};
st.booked++;if(!B('h5'))st.trips.push(t);st.last=t;st.view='done';
},
trip(st,id){st.trip=id;st.edit=false;const t=st.trips.find(x=>x.id===id);st.newCo=t?t.co:'';st.view='trip'},
cancel(st){let t=st.trips.find(x=>x.id===st.trip);if(B('h14')&&st.trips.length>1&&st.trips[0]!==t){t=st.trips[0];st.wrongCancel=t.id}t.status='Cancelled';st.edit=false;rpToast('Booking cancelled.')},
edit(st){st.edit=!st.edit},
savedates(st){const t=st.trips.find(x=>x.id===st.trip),n=snNights(t.ci,st.newCo);if(!(n>0)){rpToast('Pick a check-out after '+t.ci+'.');return}t.co=st.newCo;t.nights=n;if(B('h17'))t.stale=true;else t.total=t.rate*n;st.edit=false;rpToast('Dates updated.')}
}
};

/* ---------- GateTix ---------- */
const GT_E=[{id:'ev1',name:'Manila Jazz Nights',date:'Sat 12 Dec · 8:00 PM',venue:'Riverside Hall',cat:'Music'},{id:'ev2',name:'Neon Run 10K',date:'Sun 13 Dec · 5:30 AM',venue:'Bay Park',cat:'Sports'},{id:'ev3',name:'Indie Film Fest',date:'Fri 18 Dec · 6:00 PM',venue:'Old Cinema',cat:'Film'}];
const GT_T={general:35,vip:90};
const gtCalc=st=>{const unit=st.tier?((B('g3')&&st.firstTier)?GT_T[st.firstTier]:GT_T[st.tier]):0,sub=unit*st.qty,fee=st.tier?3.5*st.qty:0;return{unit,sub,fee,total:B('g1')?sub:sub+fee}};
const GateTix={
id:'gatetix',name:'GateTix',cat:'Ticketing',brand:'#A3236E',flow:'Events → Tickets → Checkout → Wallet',
features:['Browse upcoming events','Filter events by category','Share an event','Choose General or VIP tier and quantity (1 to 6 per order)','Price summary with a service fee','Pay with wallet balance or card','Add to calendar after purchase','My tickets wallet','Transfer a ticket by email','Venue directions on a partner map site'],
notes:['Seat map is preview-only in this build.','Service fee is $3.50 per ticket.'],
traps:[{id:'t1',gate:2,label:'"Resale" link',why:'It shows a not-allowed cursor and "Coming soon".'},{id:'t2',gate:1,label:'CityMaps directions error',why:'The error happens on an external partner site, outside GateTix.'},{id:'t3',gate:3,label:'Disabled "Continue to checkout"',why:'It stays disabled until a ticket tier is chosen, a prerequisite.'},{id:'t4',gate:4,label:'Non-interactive seat map',why:'Release notes say the seat map is preview-only.'}],
defects:[
{id:'g1',kind:'bug',prio:'P1',hunt:[32],page:'Event Page',crumbs:['Event Page','Ticket Selector','Price Summary'],control:'Price summary total',fail:'leaves the service fee out of the total',exp:'add the service fee into the total',outcome:'know the full amount before paying',steps:['Open GateTix and go to the Events page.','Open Manila Jazz Nights and choose General.','Set quantity to 2.','Compare subtotal plus fee with the total.'],defect:'The total equals the subtotal; the listed service fee is not added.',baseline:'The subtotal and service fee lines each calculate correctly.',impact:'The user is shown a lower price than they will be charged.',hint:'Add up subtotal and fee yourself.'},
{id:'g2',kind:'bug',prio:'P2',hunt:[14],page:'Event Page',crumbs:['Event Page','Ticket Selector','Quantity Stepper'],control:'Quantity stepper',fail:'allows more than the stated maximum of 6 tickets',exp:'stop at the stated maximum of 6',outcome:'stay within the per-order limit',steps:['Open GateTix and go to the Events page.','Open any event and choose a tier.','Click + until the quantity passes 6.'],defect:'The stepper goes past 6 to 9 even though the label says "Max 6 per order".',baseline:'The stepper correctly stops at 1 on the low end.',impact:'The user can pick more tickets than the rule allows, but can still complete a valid order.',hint:'Push the quantity to its limits.'},
{id:'g3',kind:'bug',prio:'P1',hunt:[16,26],page:'Event Page',crumbs:['Event Page','Tier Selector','Price Summary'],control:'Tier selector',fail:'keeps the VIP price after switching to General',exp:'update the price when the tier changes',outcome:'pay the price of the tier they chose',steps:['Open GateTix and go to the Events page.','Open any event and choose VIP.','Switch the tier to General.','Read the ticket price in the summary.'],defect:'After switching to General, the summary still charges the VIP price of $90.00.',baseline:'Choosing General first shows the correct $35.00 price.',impact:'The user is overcharged after changing their mind.',hint:'Pick one tier, then switch to the other.'},
{id:'g4',kind:'bug',prio:'P0',hunt:[1,21],page:'Checkout Page',crumbs:['Event Page','Continue Button','Checkout Page'],control:'Checkout page',fail:'opens blank for General tickets',exp:'load the payment step for every tier',outcome:'buy General tickets',steps:['Open GateTix and go to the Events page.','Open any event and choose General.','Click "Continue to checkout".'],defect:'The checkout page is completely blank for General tickets.',baseline:'With the VIP tier selected, checkout loads normally.',impact:'The user cannot buy the main ticket type at all.',hint:'Go to checkout with each tier.'},
{id:'g5',kind:'bug',prio:'P1',hunt:[89,96],page:'Ticket Details Page',crumbs:['My Tickets','Ticket Details'],control:'Ticket details',fail:'shows a different event than the ticket purchased',exp:'show the event that was purchased',outcome:'enter the right event',steps:['Open GateTix and buy a ticket for Manila Jazz Nights.','Open My tickets.','Open the ticket.'],defect:'The ticket opens with "Neon Run 10K" details instead of Manila Jazz Nights.',baseline:'The My tickets list shows the correct event name.',impact:'The user may be turned away at the door with the wrong ticket.',hint:'Compare a ticket in the list with its details.'},
{id:'g6',kind:'fr',prio:'P1',hunt:[51],page:'Ticket Details Page',crumbs:['My Tickets','Ticket Details','Actions'],control:'Ticket actions',should:'let the user transfer a ticket to someone else',exp:'offer a "Transfer ticket" action',outcome:'send a ticket to a friend',defect:'Ticket details have no transfer option.',baseline:'The real app lets the user transfer a ticket by email.',impact:'The user cannot pass a ticket on if plans change.',hint:'Compare ticket actions with the reference.'},
{id:'g7',kind:'fr',prio:'P2',hunt:[78],page:'Confirmation Page',crumbs:['Checkout Flow','Confirmation Page','Next Steps'],control:'Confirmation next steps',should:'offer "Add to calendar"',exp:'offer an "Add to calendar" button',outcome:'save the event date in one tap',defect:'The confirmation has no Add to calendar option.',baseline:'The real app offers Add to calendar after every purchase.',impact:'The user can still note the date manually.',hint:'Compare the confirmation with the reference.'},
{id:'g8',kind:'bug',prio:'P1',hunt:[57,85],page:'Ticket Details Page',crumbs:['My Tickets','Ticket Details','Transfer Ticket'],control:'Transfer ticket',fail:'reports success but leaves the ticket as Valid in the sender\'s wallet',exp:'mark the ticket as sent once the transfer completes',outcome:'know the ticket has left their wallet',steps:['Open GateTix and buy a ticket for any event.','Open My tickets and open the ticket.','Click "Transfer ticket", enter a valid email and click "Send ticket".','Read the ticket status.'],defect:'The "Ticket sent." message appears, but the ticket still shows Valid and stays in the wallet.',baseline:'An invalid email is correctly rejected with a message.',impact:'The user cannot tell whether the friend received the ticket, and two people may hold the same ticket.',hint:'Transfer a ticket, then check its status.'},
{id:'g9',kind:'fr',prio:'P2',hunt:[6],page:'Events Page',crumbs:['Events Page','Events Toolbar'],control:'Events toolbar',should:'offer category filters',exp:'offer Music, Sports and Film filters',outcome:'find events they care about faster',defect:'The events page has no way to filter by category.',baseline:'The real app lets the user filter events by category.',impact:'The user can still browse every event by scrolling.',hint:'Compare the events page with the reference.'},
{id:'g10',kind:'bug',prio:'P1',hunt:[15,61],page:'Event Page',crumbs:['Event Page','Ticket Selector','Quantity Minimum'],control:'Quantity minimum',fail:'lets the quantity drop to 0 and still allows checkout',exp:'stop at a minimum of 1 ticket',outcome:'avoid an empty order',steps:['Open GateTix and go to the Events page.','Open any event and choose a tier.','Click − until the quantity reads 0.','Read the total and the checkout button.'],defect:'The quantity reaches 0, the total shows $0.00 and "Continue to checkout" stays enabled.',baseline:'The stepper correctly counts up from 1.',impact:'The user can create an empty order and receive no ticket.',hint:'Push the quantity below 1.'},
{id:'g11',kind:'bug',prio:'P1',hunt:[8,83],page:'Event Page',crumbs:['Events Page','Event Page','Event Time'],control:'Event time',fail:'differs from the time on the events list',exp:'show the same start time everywhere',outcome:'arrive at the right time',steps:['Open GateTix and go to the Events page.','Note the time on Manila Jazz Nights (8:00 PM).','Open Manila Jazz Nights.','Read the time under the event name.'],defect:'The event page says 9:00 PM while the events list says 8:00 PM.',baseline:'The date and venue match on both pages.',impact:'The user may arrive an hour late.',hint:'Compare times between the list and the event.'},
{id:'g12',kind:'bug',prio:'P1',hunt:[89,94],page:'Ticket Details Page',crumbs:['My Tickets','Ticket Details','Admits'],control:'Ticket admits count',fail:'shows 1 even when more tickets were bought',exp:'show the number of tickets purchased',outcome:'bring their whole group in',steps:['Open GateTix and buy 3 tickets for any event.','Open My tickets.','Open the ticket and read Admits.'],defect:'A ticket bought for 3 people shows "Admits 1".',baseline:'The My tickets list correctly shows 3 tickets.',impact:'Two of the user\'s guests may be refused entry.',hint:'Buy several tickets, then open one.'},
{id:'g13',kind:'bug',prio:'P1',hunt:[28,61],page:'Checkout Page',crumbs:['Checkout Page','Pay Button','Payment Error'],control:'"Pay" button',fail:'always fails for VIP tickets',exp:'complete payment for every tier',outcome:'buy VIP tickets',steps:['Open GateTix and go to the Events page.','Open any event, choose VIP and click "Continue to checkout".','Fill in name and email.','Click Pay.'],defect:'Every attempt shows "Payment failed" and no ticket is issued.',baseline:'Paying for General tickets succeeds.',impact:'The user cannot buy VIP tickets at all, though General still works.',hint:'Try to pay for each tier.'},
{id:'g14',kind:'fr',prio:'P2',hunt:[7],page:'Event Page',crumbs:['Event Page','Event Header'],control:'Event header',should:'offer a Share button',exp:'offer a "Share" button',outcome:'invite friends to the event',defect:'The event page has no way to share the event.',baseline:'The real app shows Share on every event page.',impact:'The user can still copy the link by hand.',hint:'Compare the event page with the reference.'},
{id:'g15',kind:'fr',prio:'P1',hunt:[24],page:'Checkout Page',crumbs:['Checkout Page','Payment Options'],control:'Payment options',should:'offer card payment',exp:'offer Card alongside the GateTix wallet',outcome:'pay without topping up the wallet',defect:'Checkout only allows the GateTix wallet balance.',baseline:'The real app accepts cards as well as the wallet.',impact:'Users with no wallet balance cannot buy tickets.',hint:'Compare the payment options with the reference.'},
{id:'g16',kind:'bug',prio:'P2',hunt:[31],page:'Event Page',crumbs:['Event Page','Price Summary','Service Fee Label'],control:'Service fee label',fail:'reads "Serivce fee"',exp:'read "Service fee"',outcome:'read the price breakdown clearly',steps:['Open GateTix and go to the Events page.','Open any event and choose a tier.','Read the labels in the price summary.'],defect:'The summary label reads "Serivce fee".',baseline:'The fee amount itself is correct.',impact:'The user sees a typo, but the price is right.',hint:'Read every label in the summary.'},
{id:'g17',kind:'bug',prio:'P2',hunt:[6,87],page:'Events Page',crumbs:['Events Page','Events Toolbar','Sports Filter'],control:'"Sports" filter',fail:'shows Indie Film Fest instead of sports events',exp:'show only sports events',outcome:'find sports events quickly',steps:['Open GateTix and go to the Events page.','Click Sports.','Read the event shown.'],defect:'Sports shows Indie Film Fest, while Neon Run 10K is hidden.',baseline:'The Music filter correctly shows Manila Jazz Nights.',impact:'The user can still find the run under All.',hint:'Try every category filter.'}
],
conflicts:[['g6','g8'],['g4','g13'],['g9','g17'],['g2','g10']],
tasks:[
{code:'TIX-301',t:'Concert night sale',brief:'Jazz night tickets drop at noon. Prices must be exact.',pool:['g1','g3','g16','g9','g14','g11']},
{code:'TIX-302',t:'Group booking',brief:'An office books tickets for a team outing.',pool:['g2','g12','g7','g1','g15','g11']},
{code:'TIX-303',t:'General admission rush',brief:'General admission is the best seller. Nothing can block it.',pool:['g4','g3','g10','g16','g14','g5']},
{code:'TIX-304',t:'VIP checkout',brief:'VIP buyers are complaining about checkout and payment.',pool:['g13','g15','g1','g11','g7','g12']},
{code:'TIX-305',t:'Ticket wallet',brief:'Fans open their wallet at the gate. Tickets must be right.',pool:['g5','g8','g12','g7','g17','g2']},
{code:'TIX-306',t:'Transfer & share',brief:'Friends pass tickets around before the event.',pool:['g6','g14','g5','g16','g10','g9']},
{code:'TIX-307',t:'Browse & filter',brief:'New visitors browse by category and compare events.',pool:['g17','g11','g3','g15','g2','g14']},
{code:'TIX-308',t:'Full regression',brief:'Release candidate sign-off: sweep every ticket path.',pool:['g4','g8','g10','g12','g9','g16']}
],
init:()=>({view:'events',cat:'all',ev:null,tier:'',firstTier:'',qty:1,form:{name:'',email:'',pay:'wallet'},err:'',tickets:[],tk:null,tr:false,trTo:'',prev:'events',last:null}),
url(st){return st.view==='external'?'citymaps-go.net/directions':'gatetix.events'+({events:'/',event:'/e/'+(st.ev||''),checkout:'/checkout',done:'/order/done',wallet:'/wallet',ticket:'/wallet/'+(st.tk||'')}[st.view]||'/')},
render(st){
if(st.view==='external') return '<div class="rp-ext-site"><header>CityMaps Go</header><div class="rp-502"'+H('t2')+'><b>503</b><span>Service Unavailable</span><span class="rp-muted">Directions are temporarily unavailable.</span></div><div style="text-align:center"><button class="rp-btn ghost" data-act="back">← Back to GateTix</button></div></div>';
const nav='<nav class="rp-nav"><span class="rp-logo">GateTix</span><button class="rp-link'+(['events','event','checkout','done'].includes(st.view)?' on':'')+'" data-act="go" data-arg="events">Events</button><button class="rp-link'+(['wallet','ticket'].includes(st.view)?' on':'')+'" data-act="go" data-arg="wallet">My tickets</button><button class="rp-link rp-off" title="Coming soon" data-act="soon"'+H('t1')+'>'+IC.ban+' Resale</button></nav>';
let m='';
if(st.view==='events'){const cf=B('g17')&&st.cat==='Sports'?'Film':st.cat,list=GT_E.filter(e=>B('g9')||cf==='all'||e.cat===cf);m='<div class="rp-tool"'+H('g9')+'><h2 class="rp-h">This month</h2>'+(B('g9')?'':'<span class="rp-step">'+['all','Music','Sports','Film'].map(c=>'<button class="rp-btn sm'+(st.cat===c?'':' ghost')+'" data-act="cat" data-arg="'+c+'">'+(c==='all'?'All':c)+'</button>').join('')+'</span>')+'</div><div class="rp-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">'+list.map(e=>'<div class="rp-card"'+H('g17',st.cat==='Sports')+'><div class="rp-ph">'+e.venue+'</div><div class="rp-pn">'+e.name+'</div><div class="rp-muted rp-small">'+e.date+'</div><button class="rp-btn sm" data-act="open" data-arg="'+e.id+'">Get tickets</button></div>').join('')+'</div>'}
if(st.view==='event'){
const e=GT_E.find(x=>x.id===st.ev),c=gtCalc(st),max=B('g2')?9:6,ready=!!st.tier,ed=B('g11')?e.date.replace(/(\d+):00 PM/,(m0,hh)=>(+hh%12+1)+':00 PM'):e.date;
const g3sym=st.tier&&c.unit!==GT_T[st.tier];
m='<button class="rp-link sm" data-act="go" data-arg="events">← All events</button><div class="rp-tool"'+H('g14')+'><h2 class="rp-h">'+e.name+'</h2>'+(B('g14')?'':'<button class="rp-btn sm ghost" data-act="share">Share</button>')+'</div><div class="rp-muted"'+H('g11',ed!==e.date)+'>'+ed+' · '+e.venue+' · <button class="rp-ext" data-act="ext">Directions on CityMaps '+IC.ext+'</button></div>'+
'<div class="rp-split"><div class="rp-card"><b>Choose tickets</b><label class="rp-rad" for="gt-t1"><input type="radio" name="gt-t" id="gt-t1" value="general" data-bind="tier" data-act="tier"'+chk(st.tier==='general')+'> General admission · $35.00</label><label class="rp-rad" for="gt-t2"><input type="radio" name="gt-t" id="gt-t2" value="vip" data-bind="tier" data-act="tier"'+chk(st.tier==='vip')+'> VIP · $90.00</label>'+
'<div class="rp-row"><span>Quantity <span class="rp-muted rp-small">Max 6 per order</span></span><span class="rp-qty"'+H('g2',st.qty>6)+H('g10',st.qty===0)+'><button class="rp-sq" data-act="qdec" aria-label="Fewer tickets">−</button><b>'+st.qty+'</b><button class="rp-sq" data-act="qinc" aria-label="More tickets"'+(st.qty>=max?' aria-disabled="true"':'')+'>+</button></span></div>'+
'<div class="rp-lbl">Seat map<div class="rp-seat"'+H('t4')+'>'+'<i></i>'.repeat(30)+'</div></div></div>'+
'<div class="rp-card"><b>Summary</b><div class="rp-row"'+H('g3',g3sym)+'><span>Ticket price</span><span>'+(st.tier?money(c.unit):'—')+'</span></div><div class="rp-row"><span>Subtotal</span><span>'+money(c.sub)+'</span></div><div class="rp-row"><span'+H('g16')+'>'+(B('g16')?'Serivce fee':'Service fee')+'</span><span>'+money(c.fee)+'</span></div><div class="rp-row rp-total"'+H('g1',!!st.tier)+'><span>Total</span><b>'+money(c.total)+'</b></div><span class="rp-wrapbtn"'+H('t3',!ready)+'><button class="rp-btn wide" data-act="checkout"'+dis(!ready)+'>Continue to checkout</button></span></div></div>';
}
if(st.view==='checkout'){
if(B('g4')&&st.tier==='general') return nav+'<div class="rp-main"><div class="rp-blank"'+H('g4')+'></div></div>';
const c=gtCalc(st),e=GT_E.find(x=>x.id===st.ev);
m='<h2 class="rp-h">Checkout</h2><div class="rp-split"><form class="rp-card rp-form" data-act="pay" novalidate>'+(st.err?'<div class="rp-err" role="alert"'+H('g13',!!st.payFail)+'>'+esc(st.err)+'</div>':'')+'<label for="gt-n">Name on tickets<input class="rp-in" id="gt-n" data-bind="form.name" value="'+esc(st.form.name)+'" autocomplete="off"></label><label for="gt-e">Email<input class="rp-in" id="gt-e" type="email" data-bind="form.email" value="'+esc(st.form.email)+'" autocomplete="off"></label><fieldset class="rp-fs"'+H('g15')+'><legend>Pay with</legend><label class="rp-rad" for="gt-p1"><input type="radio" name="gt-p" id="gt-p1" value="wallet" data-bind="form.pay"'+chk(st.form.pay==='wallet')+'> GateTix wallet balance</label>'+(B('g15')?'':'<label class="rp-rad" for="gt-p2"><input type="radio" name="gt-p" id="gt-p2" value="card" data-bind="form.pay"'+chk(st.form.pay==='card')+'> Card ending 4242</label>')+'</fieldset><button type="submit" class="rp-btn">Pay '+money(c.total)+'</button></form><div class="rp-card"><b>'+e.name+'</b><div class="rp-row"><span>'+st.qty+' × '+(st.tier==='vip'?'VIP':'General')+'</span><span>'+money(c.sub)+'</span></div><div class="rp-row"><span>Service fee</span><span>'+money(c.fee)+'</span></div><div class="rp-row rp-total"><span>Total</span><b>'+money(c.total)+'</b></div></div></div>';
}
if(st.view==='done'){m='<div class="rp-ok"><b>You\'re going!</b> '+st.last.qty+' ticket'+(st.last.qty>1?'s':'')+' for '+st.last.evName+' are in your wallet.</div><div class="rp-actions"'+H('g7')+' style="justify-content:flex-start">'+(B('g7')?'':'<button class="rp-btn ghost" data-act="cal">Add to calendar</button>')+'<button class="rp-btn" data-act="go" data-arg="wallet">View my tickets</button></div>'}
if(st.view==='wallet'){m='<h2 class="rp-h">My tickets</h2>'+(st.tickets.length?'<div class="rp-card">'+st.tickets.map(t=>'<div class="rp-row"><span><b>'+t.evName+'</b><br><span class="rp-muted rp-small">'+t.id+' · '+t.qty+' × '+(t.tier==='vip'?'VIP':'General')+'</span></span><span class="rp-badge g">'+esc(t.status)+'</span><button class="rp-btn sm ghost" data-act="tk" data-arg="'+t.id+'">Open</button></div>').join('')+'</div>':'<div class="rp-empty"><b>No tickets yet</b><span class="rp-muted">Tickets you buy appear here.</span></div>')}
if(st.view==='ticket'){
const t=st.tickets.find(x=>x.id===st.tk),i=GT_E.findIndex(x=>x.id===t.evId),ev=B('g5')?GT_E[(i+1)%GT_E.length]:GT_E[i];
m='<button class="rp-link sm" data-act="go" data-arg="wallet">← My tickets</button><div class="rp-card"><span class="rp-badge g"'+H('g8',!!t.ghost)+'>'+esc(t.status)+'</span><h2 class="rp-h"'+H('g5')+'>'+ev.name+'</h2><div class="rp-muted"'+H('g5')+'>'+ev.date+' · '+ev.venue+'</div><div class="rp-row"><span>Ticket</span><span class="mono">'+t.id+'</span></div><div class="rp-row"'+H('g12',t.qty>1)+'><span>Admits</span><span>'+(B('g12')?1:t.qty)+' · '+(t.tier==='vip'?'VIP':'General')+'</span></div></div>'+
'<div class="rp-actions"'+H('g6')+' style="justify-content:flex-start">'+(B('g6')?'<span class="rp-muted rp-small">Show this ticket at the gate.</span>':'<button class="rp-btn ghost" data-act="tr">Transfer ticket</button>')+'</div>'+
(st.tr&&!B('g6')?'<form class="rp-card rp-form" data-act="send" novalidate><label for="gt-tr">Recipient email<input class="rp-in" id="gt-tr" type="email" data-bind="trTo" value="'+esc(st.trTo)+'" autocomplete="off"></label><button type="submit" class="rp-btn">Send ticket</button></form>':'');
}
return nav+'<div class="rp-main">'+m+'</div>';
},
acts:{
go(st,a){st.view=a;st.tr=false},
soon(){rpToast('Resale is coming soon.')},
cat(st,a){st.cat=a},
open(st,id){st.ev=id;st.tier='';st.firstTier='';st.qty=1;st.payFail=false;st.err='';st.view='event'},
share(){rpToast('Event link copied to share.')},
tier(st){if(!st.firstTier)st.firstTier=st.tier},
qinc(st){const max=B('g2')?9:6;if(st.qty<max)st.qty++},
qdec(st){if(st.qty>(B('g10')?0:1))st.qty--},
ext(st){st.prev=st.view;st.view='external'},
back(st){st.view=st.prev||'events'},
checkout(st){if(!st.tier){rpToast('Choose a ticket tier first.');return}st.err='';st.view='checkout'},
pay(st){const f=st.form;if(!f.name.trim()||!f.email.trim()){st.err='Enter the name on tickets and an email.';return}if(B('g13')&&st.tier==='vip'){st.err='Payment failed. Please try again.';st.payFail=true;return}st.payFail=false;const e=GT_E.find(x=>x.id===st.ev),c=gtCalc(st);const t={id:'GT-'+(7801+st.tickets.length),evId:e.id,evName:e.name,tier:st.tier,qty:st.qty,total:c.total,status:'Valid'};st.tickets.push(t);st.last=t;st.view='done'},
cal(){rpToast('Added to your calendar.')},
tk(st,id){st.tk=id;st.tr=false;st.view='ticket'},
tr(st){st.tr=!st.tr},
send(st){if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.trTo)){rpToast('Enter a valid email.');return}const t=st.tickets.find(x=>x.id===st.tk);if(B('g8'))t.ghost=true;else t.status='Sent to '+st.trTo;st.tr=false;rpToast('Ticket sent.')}
}
};

/* ---------- PipeDesk ---------- */
const pdValid=e=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const pdInit=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const PD_ST=['Lead','Proposal','Negotiation','Won'];
const PD_OWN0={d1:'Me',d2:'Ana',d3:'Me',d4:'Raj'};
const PipeDesk={
id:'pipedesk',name:'PipeDesk',cat:'CRM',brand:'#4338CA',flow:'Contacts → Pipeline → Dashboard',
features:['Contacts list with search and A–Z sort','Add and edit contacts','Create a deal from a contact','Log calls and notes on a contact','Export contacts as CSV','Deal pipeline with 4 stages, moved one stage at a time','Assign an owner to each deal','Dashboard with open and won deals','Open a contact\'s profile on the ProNet social site'],
notes:['Avatars show initials only in this build.','Deals need an amount before they can move stages.'],
traps:[{id:'t1',gate:2,label:'"AI Insights" link',why:'It shows a not-allowed cursor and "Coming soon".'},{id:'t2',gate:1,label:'ProNet profile error',why:'The error happens on an external social site, outside PipeDesk.'},{id:'t3',gate:3,label:'Disabled "Move" on the Ito deal',why:'It needs a deal amount first, a prerequisite.'},{id:'t4',gate:4,label:'Initials-only avatars',why:'Release notes say avatars show initials only.'}],
defects:[
{id:'c1',kind:'bug',prio:'P1',hunt:[81,84],page:'Dashboard Page',crumbs:['Pipeline Page','Deal Stage','Dashboard Won Tile'],control:'Won deals tile',fail:'does not update after a deal moves to Won',exp:'count every deal in the Won stage',outcome:'report accurate results',steps:['Open PipeDesk and go to the Pipeline page.','Move "Lumina – Retainer" forward until it reaches Won.','Open the Dashboard.','Compare the Won deals tile with the Won column.'],defect:'The Won column shows 2 deals but the dashboard tile still shows 1.',baseline:'The pipeline column itself updates straight away.',impact:'The user reports wrong sales results to their team.',hint:'Move a deal to Won, then check the Dashboard.'},
{id:'c2',kind:'bug',prio:'P2',hunt:[13,12],page:'New Contact Form',crumbs:['Contacts Page','New Contact Form','Email Field'],control:'Email field',fail:'accepts an incomplete address like "ana@"',exp:'reject an email without a domain',outcome:'save reachable contacts',steps:['Open PipeDesk and go to the Contacts page.','Click "New contact".','Enter a name and the email "ana@".','Click "Save contact".'],defect:'The contact saves with the invalid email "ana@".',baseline:'Leaving the name empty is correctly blocked with a message.',impact:'The user can store an address that cannot receive email, but can fix it later.',hint:'Save a contact with a broken email.'},
{id:'c3',kind:'bug',prio:'P1',hunt:[52],page:'Contact Details Page',crumbs:['Contacts Page','Contact Details','Edit Form'],control:'Contact edit form',fail:'clears the Company field when only the phone is changed',exp:'change only the edited field',outcome:'update one detail safely',steps:['Open PipeDesk and go to the Contacts page.','Open Juan Dela Cruz and click Edit.','Change only the phone number.','Click Save and read the Company field.'],defect:'After saving a phone change, the Company field is blank.',baseline:'The new phone number saves correctly.',impact:'The user silently loses customer data on every edit.',hint:'Edit one field, then check the others.'},
{id:'c4',kind:'bug',prio:'P0',hunt:[21,37],page:'New Contact Form',crumbs:['Contacts Page','New Contact Form','Save Contact Button'],control:'"Save contact" button',fail:'closes the form without adding the contact',exp:'add the new contact to the list',outcome:'build their customer list',steps:['Open PipeDesk and go to the Contacts page.','Click "New contact" and fill in every field.','Click "Save contact".','Look for the contact in the list.'],defect:'The form closes, but the list still shows 3 contacts and the new one is missing.',baseline:'Cancel on the same form closes it without changes, as expected.',impact:'The user cannot add any new contact to the CRM.',hint:'Add a contact, then look for it.'},
{id:'c5',kind:'bug',prio:'P1',hunt:[86],page:'Contacts Page',crumbs:['Contacts Page','Search Bar'],control:'Contact search',fail:'is case-sensitive and misses "juan" for "Juan"',exp:'match names regardless of letter case',outcome:'find any contact quickly',steps:['Open PipeDesk and go to the Contacts page.','Type "juan" in the search bar and click Search.','Read the results.'],defect:'Searching "juan" returns no contacts, while "Juan" finds Juan Dela Cruz.',baseline:'A search typed with matching capitals finds the contact.',impact:'The user wrongly concludes a contact does not exist and may create duplicates.',hint:'Search in lowercase.'},
{id:'c6',kind:'fr',prio:'P1',hunt:[89],page:'Pipeline Page',crumbs:['Pipeline Page','Deal Card'],control:'Deal card',should:'let the user assign a deal owner',exp:'offer an Owner selector',outcome:'make clear who is responsible for each deal',defect:'Deal cards have no owner field.',baseline:'The real app shows and lets the user change the owner of every deal.',impact:'The team cannot tell who is working a deal.',hint:'Compare a deal card with the reference.'},
{id:'c7',kind:'fr',prio:'P2',hunt:[96],page:'Contacts Page',crumbs:['Contacts Page','Contacts Toolbar'],control:'Contacts toolbar',should:'offer an Export CSV option',exp:'offer an "Export CSV" button',outcome:'use contacts in other tools',defect:'The contacts toolbar has no export option.',baseline:'The real app exports the contact list as CSV.',impact:'The user can still view and use contacts inside the app.',hint:'Compare the contacts toolbar with the reference.'},
{id:'c8',kind:'bug',prio:'P1',hunt:[29,84],page:'Pipeline Page',crumbs:['Pipeline Page','Deal Card','Move Button'],control:'"Move to Negotiation" button',fail:'skips Negotiation and moves the deal straight to Won',exp:'move the deal to the next stage, Negotiation',outcome:'track each deal through every stage',steps:['Open PipeDesk and go to the Pipeline page.','Find a deal in the Proposal column.','Click "Move to Negotiation →".','Read which column the deal lands in.'],defect:'The deal jumps from Proposal straight to the Won column.',baseline:'Moving a deal from Lead to Proposal works correctly.',impact:'The user reports deals as won before they close, which distorts the forecast.',hint:'Move a deal out of Proposal and watch where it lands.'},
{id:'c9',kind:'fr',prio:'P2',hunt:[53],page:'Contact Details Page',crumbs:['Contacts Page','Contact Details','Activity'],control:'Contact activity',should:'let the user log a call or note',exp:'offer a "Log a call or note" box with a Save button',outcome:'keep a history of every conversation',defect:'Contact details have no way to log a call or note.',baseline:'The real app shows an activity box on every contact.',impact:'The user can still keep notes outside the CRM.',hint:'Compare a contact with the reference.'},
{id:'c10',kind:'bug',prio:'P1',hunt:[84,81],page:'Dashboard Page',crumbs:['Dashboard Page','Open Deals Tile'],control:'Open deals tile',fail:'counts won deals as open',exp:'count only deals that are not Won',outcome:'see how much work is still open',steps:['Open PipeDesk and go to the Pipeline page.','Count the deals outside the Won column.','Open the Dashboard and read Open deals.'],defect:'The tile shows 4 open deals while only 3 deals sit outside Won.',baseline:'The Contacts tile shows the correct count of 3.',impact:'The user overstates the open pipeline to their team.',hint:'Count the pipeline yourself.'},
{id:'c11',kind:'bug',prio:'P2',hunt:[31,96],page:'Contacts Page',crumbs:['Contacts Page','Contact Row','Company Name'],control:'Contact list company name',fail:'misspells Lumina Studio as "Lumina Studoi"',exp:'show the company name exactly as saved',outcome:'recognise the account at a glance',steps:['Open PipeDesk and go to the Contacts page.','Read the company under Maria Santos.'],defect:'The list shows "Lumina Studoi".',baseline:'Opening Maria Santos shows "Lumina Studio" correctly.',impact:'The user sees a typo, but the saved data is right.',hint:'Read every company name.'},
{id:'c12',kind:'bug',prio:'P1',hunt:[69,86],page:'Contacts Page',crumbs:['Contacts Page','Search Bar','Clear Button'],control:'"Clear" search button',fail:'empties the box but keeps the filtered results',exp:'clear the search and list every contact',outcome:'get back to the full list',steps:['Open PipeDesk and go to the Contacts page.','Search for "Juan".','Click Clear.','Read the contact list.'],defect:'The search box is empty, but the list still shows only Juan Dela Cruz "matching Juan".',baseline:'Searching "Juan" correctly finds Juan Dela Cruz.',impact:'The user may think the other contacts were deleted.',hint:'Search, then clear it.'},
{id:'c13',kind:'bug',prio:'P0',hunt:[23,29],page:'Pipeline Page',crumbs:['Pipeline Page','Deal Card','Move Button'],control:'"Move" button',fail:'does nothing, so no deal can change stage',exp:'move the deal to the next stage',outcome:'progress deals through the pipeline',steps:['Open PipeDesk and go to the Pipeline page.','Click "Move to Proposal →" on Harbor Foods – POS rollout.','Read which column the deal is in.'],defect:'The deal stays in Lead, and the same happens for every deal.',baseline:'The pipeline columns and deal amounts display correctly.',impact:'The user cannot manage any deal, which is the core job of the pipeline.',hint:'Move any deal.'},
{id:'c14',kind:'fr',prio:'P2',hunt:[95],page:'Contacts Page',crumbs:['Contacts Page','Contact List'],control:'Contact list',should:'offer sorting by name',exp:'offer a "Name A–Z" sort option',outcome:'scan contacts alphabetically',defect:'The contact list cannot be sorted.',baseline:'The real app sorts contacts A–Z or by date added.',impact:'The user can still search for a name.',hint:'Compare the contact list with the reference.'},
{id:'c15',kind:'fr',prio:'P1',hunt:[100],page:'Contact Details Page',crumbs:['Contacts Page','Contact Details','Header'],control:'Contact header',should:'let the user create a deal from the contact',exp:'offer a "Create deal" button',outcome:'start a sale straight from the customer record',defect:'Contact details have no way to create a deal.',baseline:'The real app offers Create deal on every contact.',impact:'The user has no way to log a new sale for this customer.',hint:'Compare a contact with the reference.'},
{id:'c16',kind:'bug',prio:'P1',hunt:[45,47],page:'Pipeline Page',crumbs:['Pipeline Page','Deal Card','Owner Selector'],control:'Deal owner',fail:'reverts to the old owner after leaving the page',exp:'keep the new owner once it is changed',outcome:'hand a deal over reliably',steps:['Open PipeDesk and go to the Pipeline page.','Change the owner of Harbor Foods – POS rollout to Raj.','Open the Dashboard, then return to Pipeline.','Read the owner on that deal.'],defect:'The owner is back to "Me".',baseline:'The owner shows Raj straight after the change.',impact:'Handoffs are lost and two people may chase the same deal.',hint:'Change an owner and come back later.'},
{id:'c17',kind:'bug',prio:'P2',hunt:[11],page:'New Contact Form',crumbs:['Contacts Page','New Contact Form','Phone Label'],control:'Phone field label',fail:'reads "Phnoe"',exp:'read "Phone"',outcome:'fill in the form without confusion',steps:['Open PipeDesk and go to the Contacts page.','Click "New contact".','Read the field labels.'],defect:'The third field is labelled "Phnoe".',baseline:'The other field labels are spelled correctly.',impact:'The user sees a typo, but the field works.',hint:'Read every label on the form.'}
],
conflicts:[['c4','c2'],['c6','c16'],['c13','c1'],['c13','c8']],
tasks:[
{code:'CRM-401',t:'New lead intake',brief:'Sales is adding a batch of new leads from an expo.',pool:['c4','c11','c17','c7','c5','c15']},
{code:'CRM-402',t:'Pipeline review',brief:'Monday pipeline review: every number must be right.',pool:['c1','c8','c6','c10','c14','c11']},
{code:'CRM-403',t:'Contact cleanup',brief:'Ops is cleaning up contact records this week.',pool:['c3','c2','c12','c9','c17','c14']},
{code:'CRM-404',t:'Search & find',brief:'Reps need to find any customer in seconds.',pool:['c5','c12','c11','c7','c3','c15']},
{code:'CRM-405',t:'Deal stages',brief:'Managers move deals through every stage.',pool:['c13','c10','c16','c9','c2','c17']},
{code:'CRM-406',t:'Sales dashboard',brief:'The VP of Sales reads the dashboard before the board meeting.',pool:['c1','c10','c16','c15','c4','c14']},
{code:'CRM-407',t:'Account handoff',brief:'A rep is leaving, and accounts move to new owners.',pool:['c16','c3','c8','c9','c12','c7']},
{code:'CRM-408',t:'Full regression',brief:'Release candidate sign-off: sweep every CRM path.',pool:['c13','c4','c5','c6','c11','c3']}
],
init:()=>({view:'contacts',q:'',qIn:'',sort:'added',stale:false,revert:{},contacts:[{id:'k1',name:'Juan Dela Cruz',email:'juan@harborfoods.ph',phone:'+63 917 555 0101',company:'Harbor Foods'},{id:'k2',name:'Maria Santos',email:'maria@luminastudio.co',phone:'+63 918 555 0144',company:'Lumina Studio'},{id:'k3',name:'Ken Ito',email:'ken@itotrading.jp',phone:'+81 90 5555 0199',company:'Ito Trading'}],deals:[{id:'d1',name:'Harbor Foods – POS rollout',amount:12000,stage:'Lead'},{id:'d2',name:'Lumina – Retainer',amount:4800,stage:'Proposal'},{id:'d3',name:'Ito – Pilot',amount:null,stage:'Proposal'},{id:'d4',name:'Bayside – Renewal',amount:7200,stage:'Won'}],owner:{d1:'Me',d2:'Ana',d3:'Me',d4:'Raj'},wonBase:1,sel:null,edit:false,ef:{},nf:{name:'',email:'',phone:'',company:''},err:'',tried:0,wiped:null,notes:{},noteIn:'',prev:'contacts'}),
url(st){return st.view==='external'?'pronet.social/in/'+(st.sel||''):'app.pipedesk.io'+({contacts:'/contacts',contact:'/contacts/'+(st.sel||''),new:'/contacts/new',pipeline:'/pipeline',dashboard:'/dashboard'}[st.view]||'/')},
render(st){
if(st.view==='external') return '<div class="rp-ext-site"><header>ProNet</header><div class="rp-502"'+H('t2')+'><b>429</b><span>Too Many Requests</span><span class="rp-muted">Profile views are rate limited. Try again later.</span></div><div style="text-align:center"><button class="rp-btn ghost" data-act="back">← Back to PipeDesk</button></div></div>';
const nav='<nav class="rp-nav"><span class="rp-logo">PipeDesk</span><button class="rp-link'+(['contacts','contact','new'].includes(st.view)?' on':'')+'" data-act="go" data-arg="contacts">Contacts</button><button class="rp-link'+(st.view==='pipeline'?' on':'')+'" data-act="go" data-arg="pipeline">Pipeline</button><button class="rp-link'+(st.view==='dashboard'?' on':'')+'" data-act="go" data-arg="dashboard">Dashboard</button><button class="rp-link rp-off" title="Coming soon" data-act="soon"'+H('t1')+'>'+IC.ban+' AI Insights</button></nav>';
let m='';
if(st.view==='contacts'){
const q=st.q,ci=st.contacts.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
let res=q?(B('c5')?st.contacts.filter(c=>c.name.includes(q)):ci):st.contacts;
if(!B('c14')&&st.sort==='az')res=[...res].sort((a,b)=>a.name.localeCompare(b.name));
const c5=B('c5')&&q&&!res.length&&ci.length>0;
m='<div class="rp-tool"'+H('c7')+'><h2 class="rp-h">Contacts</h2><span class="rp-step">'+(B('c7')?'':'<button class="rp-btn sm ghost" data-act="export">Export CSV</button>')+'<button class="rp-btn sm" data-act="go" data-arg="new">New contact</button></span></div>'+
'<form class="rp-step" data-act="search" novalidate><input class="rp-in" id="pd-q" placeholder="Search by name" data-bind="qIn" value="'+esc(st.qIn)+'" autocomplete="off" aria-label="Search contacts" style="flex:1;min-width:0"><button type="submit" class="rp-btn sm">Search</button>'+(q?'<button type="button" class="rp-btn sm ghost" data-act="clear">Clear</button>':'')+'</form>'+
'<div class="rp-card"'+H('c4',st.tried>0)+'><div class="rp-tool"'+H('c14')+'><span class="rp-muted rp-small"'+H('c12',!!st.stale&&!!q)+'>'+res.length+' contact'+(res.length===1?'':'s')+(q?' matching "'+esc(q)+'"':'')+'</span>'+(B('c14')?'':'<label class="rp-inl" for="pd-sort">Sort <select class="rp-in sm" id="pd-sort" data-bind="sort" data-act="noop"><option value="added"'+sel('added',st.sort)+'>Date added</option><option value="az"'+sel('az',st.sort)+'>Name A–Z</option></select></label>')+'</div>'+(res.length?res.map(c=>'<div class="rp-row"><button class="rp-person" data-act="open" data-arg="'+c.id+'"><span class="rp-av"'+H('t4')+'>'+pdInit(c.name)+'</span><span><b>'+esc(c.name)+'</b><br><span class="rp-muted rp-small"'+H('c11',c.id==='k2')+'>'+esc(B('c11')&&c.id==='k2'?'Lumina Studoi':(c.company||'—'))+'</span></span></button><span class="rp-small"'+H('c2',!pdValid(c.email))+'>'+esc(c.email)+'</span></div>').join(''):'<div class="rp-empty"'+H('c5',c5)+'><b>No contacts match</b><span class="rp-muted">Try a different name.</span></div>')+'</div>';
}
if(st.view==='new'){
const f=st.nf;
m='<h2 class="rp-h">New contact</h2><form class="rp-card rp-form" data-act="save" novalidate>'+(st.err?'<div class="rp-err" role="alert">'+esc(st.err)+'</div>':'')+'<label for="pd-n">Name<input class="rp-in" id="pd-n" data-bind="nf.name" value="'+esc(f.name)+'" autocomplete="off"></label><label for="pd-e">Email<input class="rp-in" id="pd-e" data-bind="nf.email" value="'+esc(f.email)+'" autocomplete="off"></label><label for="pd-p"'+H('c17')+'>'+(B('c17')?'Phnoe':'Phone')+'<input class="rp-in" id="pd-p" data-bind="nf.phone" value="'+esc(f.phone)+'" autocomplete="off"></label><label for="pd-c">Company<input class="rp-in" id="pd-c" data-bind="nf.company" value="'+esc(f.company)+'" autocomplete="off"></label><div class="rp-actions"><button type="button" class="rp-btn ghost" data-act="go" data-arg="contacts">Cancel</button><button type="submit" class="rp-btn">Save contact</button></div></form>';
}
if(st.view==='contact'){
const c=st.contacts.find(x=>x.id===st.sel),ef=st.ef,w=st.wiped===c.id&&!c.company,notes=st.notes[c.id]||[];
m='<button class="rp-link sm" data-act="go" data-arg="contacts">← Contacts</button><div class="rp-card"><div class="rp-tool"'+H('c15')+'><div class="rp-person"><span class="rp-av"'+H('t4')+'>'+pdInit(c.name)+'</span><h2 class="rp-h">'+esc(c.name)+'</h2></div>'+(B('c15')?'':'<button class="rp-btn sm" data-act="mkdeal">Create deal</button>')+'</div>'+
(st.edit?'<form class="rp-form" data-act="saveedit" novalidate><label for="pd-ee">Email<input class="rp-in" id="pd-ee" data-bind="ef.email" value="'+esc(ef.email)+'"></label><label for="pd-ep">Phone<input class="rp-in" id="pd-ep" data-bind="ef.phone" value="'+esc(ef.phone)+'"></label><label for="pd-ec">Company<input class="rp-in" id="pd-ec" data-bind="ef.company" value="'+esc(ef.company)+'"></label><div class="rp-actions"><button type="button" class="rp-btn ghost" data-act="edit">Cancel</button><button type="submit" class="rp-btn">Save</button></div></form>':
'<div class="rp-row"><span class="rp-muted">Email</span><span'+H('c2',!pdValid(c.email))+'>'+esc(c.email)+'</span></div><div class="rp-row"><span class="rp-muted">Phone</span><span>'+esc(c.phone)+'</span></div><div class="rp-row"'+H('c3',w)+'><span class="rp-muted">Company</span><span>'+(c.company?esc(c.company):'<span class="rp-muted">—</span>')+'</span></div><div class="rp-actions" style="justify-content:space-between"'+H('c9')+'><button class="rp-ext" data-act="ext">View on ProNet '+IC.ext+'</button><button class="rp-btn ghost" data-act="edit">Edit</button></div>')+'</div>'+
(!st.edit&&!B('c9')?'<form class="rp-card rp-form" data-act="note" novalidate><b>Activity</b>'+(notes.length?notes.map(n=>'<div class="rp-row"><span>'+esc(n)+'</span></div>').join(''):'<span class="rp-muted rp-small">No activity yet.</span>')+'<label for="pd-note">Log a call or note<input class="rp-in" id="pd-note" data-bind="noteIn" value="'+esc(st.noteIn)+'" autocomplete="off"></label><button type="submit" class="rp-btn sm">Save note</button></form>':'');
}
if(st.view==='pipeline'){
m='<h2 class="rp-h">Deals pipeline</h2><div class="rp-cols">'+PD_ST.map(s=>'<div class="rp-col"><h4>'+s+' · '+st.deals.filter(d=>d.stage===s).length+'</h4>'+st.deals.filter(d=>d.stage===s).map(d=>{
const noAmt=d.amount==null,last=s==='Won';
return '<div class="rp-card"'+H('c6')+'><b class="rp-small"'+H('c13',!!d.tried)+'>'+d.name+'</b><span class="rp-pr">'+(noAmt?'<span class="rp-muted">No amount</span>':money(d.amount))+'</span>'+(B('c6')?'':'<label class="rp-inl" for="pd-o-'+d.id+'"'+H('c16',!!st.revert[d.id]&&st.owner[d.id]===PD_OWN0[d.id])+'>Owner <select class="rp-in sm" id="pd-o-'+d.id+'" data-bind="owner.'+d.id+'">'+['Me','Ana','Raj'].map(o=>'<option'+sel(o,st.owner[d.id])+'>'+o+'</option>').join('')+'</select></label>')+(last?'<span class="rp-badge g"'+H('c8',!!d.skipped)+'>Closed won</span>':'<span class="rp-wrapbtn"'+H('t3',noAmt)+'><button class="rp-btn sm ghost" data-act="move" data-arg="'+d.id+'"'+dis(noAmt)+(noAmt?' title="Add a deal amount first"':'')+'>Move to '+PD_ST[PD_ST.indexOf(s)+1]+' →</button></span>')+'</div>'}).join('')+'</div>').join('')+'</div>';
}
if(st.view==='dashboard'){
const won=st.deals.filter(d=>d.stage==='Won'),shown=B('c1')?st.wonBase:won.length;
m='<h2 class="rp-h">Dashboard</h2><div class="rp-tiles"><div class="rp-tile"'+H('c10')+'><span class="rp-muted">Open deals</span><b>'+(B('c10')?st.deals.length:st.deals.filter(d=>d.stage!=='Won').length)+'</b></div><div class="rp-tile"'+H('c1',shown!==won.length)+'><span class="rp-muted">Won deals</span><b>'+shown+'</b></div><div class="rp-tile"><span class="rp-muted">Contacts</span><b>'+st.contacts.length+'</b></div></div>';
}
return nav+'<div class="rp-main">'+m+'</div>';
},
acts:{
go(st,a){if(B('c16')&&st.view==='pipeline'&&a!=='pipeline')Object.keys(PD_OWN0).forEach(k=>{if(st.owner[k]!==PD_OWN0[k]){st.owner[k]=PD_OWN0[k];st.revert[k]=true}});st.err='';st.edit=false;if(a==='new')st.nf={name:'',email:'',phone:'',company:''};st.view=a},
soon(){rpToast('AI Insights is coming soon.')},
noop(){},
mkdeal(st){const c=st.contacts.find(x=>x.id===st.sel),id='d'+(st.deals.length+1)+'n';st.deals.push({id,name:(c.company||c.name)+' – New deal',amount:2500,stage:'Lead'});st.owner[id]='Me';rpToast('Deal created in Lead.')},
export(st){rpToast('Exported '+st.contacts.length+' contacts as CSV.')},
search(st){st.q=st.qIn.trim();st.stale=false},
clear(st){st.qIn='';if(B('c12'))st.stale=true;else st.q=''},
open(st,id){st.sel=id;st.edit=false;st.noteIn='';st.view='contact'},
save(st){const f=st.nf;if(!f.name.trim()){st.err='Enter a name.';return}if(!B('c2')&&!pdValid(f.email)){st.err='Enter a valid email address.';return}st.err='';if(B('c4')){st.tried++;st.view='contacts';return}st.contacts.push({id:'k'+(st.contacts.length+1)+Date.now()%1000,name:f.name.trim(),email:f.email.trim(),phone:f.phone.trim(),company:f.company.trim()});st.view='contacts';rpToast('Contact saved.')},
edit(st){const c=st.contacts.find(x=>x.id===st.sel);st.edit=!st.edit;st.ef={email:c.email,phone:c.phone,company:c.company}},
saveedit(st){const c=st.contacts.find(x=>x.id===st.sel),e=st.ef;if(!pdValid(e.email)&&!B('c2')){rpToast('Enter a valid email address.');return}const before=c.company;c.email=e.email;c.phone=e.phone;c.company=e.company;if(B('c3')&&before){c.company='';st.wiped=c.id}st.edit=false;rpToast('Contact updated.')},
note(st){const v=st.noteIn.trim();if(!v){rpToast('Write a note first.');return}(st.notes[st.sel]=st.notes[st.sel]||[]).push(v);st.noteIn='';rpToast('Note saved.')},
ext(st){st.prev=st.view;st.view='external'},
back(st){st.view=st.prev||'contacts'},
move(st,id){const d=st.deals.find(x=>x.id===id);if(d.amount==null){rpToast('Add a deal amount first.');return}if(B('c13')){d.tried=true;return}if(B('c8')&&d.stage==='Proposal'){d.stage='Won';d.skipped=true;return}const i=PD_ST.indexOf(d.stage);if(i<PD_ST.length-1)d.stage=PD_ST[i+1]}
}
};
const APPS={cartly:Cartly,staynest:StayNest,gatetix:GateTix,pipedesk:PipeDesk};
const APP=()=>APPS[run.appId];
const TOTAL_TASKS=Object.values(APPS).reduce((a,x)=>a+x.tasks.length,0);
const taskKey=(a,t)=>a.id+':'+t.code;
function keyTask(k){k=String(k||'');const i=k.indexOf(':'),a=APPS[k.slice(0,i)],t=a&&a.tasks.find(x=>x.code===k.slice(i+1));return t?{a,t}:null}
function poolFor(a,t,diff){return a.defects.filter(d=>t.pool.includes(d.id)&&(diff!=='rookie'||d.prio!=='P0'))}
function nFor(a,t,diff,time){return Math.min(COUNT[time][diff],poolFor(a,t,diff).length)}
function taskStat(k){const rs=STORE.runs.filter(r=>r.task===k);if(!rs.length)return null;const b=rs.reduce((x,y)=>y.pct>x.pct?y:x);return{best:b.grade,pct:b.pct,found:b.found,target:b.target,att:rs.length}}
function assess(){const rs=STORE.runs.filter(r=>r.task&&r.target);if(!rs.length)return null;const avg=f=>rs.reduce((a,r)=>a+f(r),0)/rs.length;const fr=avg(r=>r.found/r.target)*100,acc=avg(r=>r.pct),fa=avg(r=>r.facc==null?100:r.facc),score=Math.round(fr*.5+acc*.35+fa*.15);return{n:rs.length,tasks:new Set(rs.map(r=>r.task)).size,avgFound:avg(r=>r.found),avgTarget:avg(r=>r.target),fr:Math.round(fr),acc:Math.round(acc),fa:Math.round(fa),score,level:score>=90?'Validator-ready':score>=75?'Strong':score>=60?'Developing':'Needs practice',rs}}

/* ---------- storage, rank, art ---------- */
const SKEY='atd.v1';
function load(){const d={xp:0,runs:[],quests:[],name:'',sfx:true,music:false,time:15,tier:'rookie',app:'cartly',queue:[],task:''};try{return Object.assign(d,JSON.parse(localStorage.getItem(SKEY))||{})}catch(e){return d}}
function save(){try{localStorage.setItem(SKEY,JSON.stringify(STORE))}catch(e){}}
let STORE=load();
const rankIdx=xp=>RANKS.filter(k=>xp>=k.xp).length-1;
function rankOf(xp){const i=rankIdx(xp),r=RANKS[i],nx=RANKS[i+1]||null;return{i,r,nx,pct:nx?Math.round(100*(xp-r.xp)/(nx.xp-r.xp)):100}}
const tName=()=>STORE.name||'Trainer';
function avatar(stage,size){
size=size||120;const P=[{suit:'#4A5468',trim:'#7B9BFF'},{suit:'#2450D8',trim:'#9DB4FF'},{suit:'#1F3A8A',trim:'#F2B544'},{suit:'#3B1F7A',trim:'#F2B544'},{suit:'#15181F',trim:'#F2B544'}][stage];
let s='<svg width="'+size+'" height="'+Math.round(size*7/6)+'" viewBox="0 0 120 140" fill="none" aria-hidden="true">';
if(stage>=4)s+='<defs><radialGradient id="aura"><stop offset="0" stop-color="#F2B544" stop-opacity=".5"/><stop offset="1" stop-color="#F2B544" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="72" r="60" fill="url(#aura)"/>';
if(stage>=3)s+='<path d="M32 84 L16 136 H104 L88 84 Z" fill="'+(stage>=4?'#9A6B12':'#5B2DB8')+'"/>';
s+='<path d="M28 136 C28 98 40 80 60 80 C80 80 92 98 92 136 Z" fill="'+P.suit+'"/>';
s+='<path d="M50 82 L60 98 L70 82" stroke="'+P.trim+'" stroke-width="3" stroke-linejoin="round"/>';
if(stage>=2)s+='<path d="M27 102 C28 89 37 81 47 81 L45 97 Z" fill="#F2B544"/><path d="M93 102 C92 89 83 81 73 81 L75 97 Z" fill="#F2B544"/>';
if(stage>=3)s+='<path d="M60 104 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#F2B544"/>';
else if(stage>=1)s+='<rect x="68" y="106" width="12" height="8" rx="2" fill="'+P.trim+'"/>';
s+='<rect x="54" y="66" width="12" height="16" rx="4" fill="#B97A50"/><circle cx="60" cy="50" r="20" fill="#D49A6A"/>';
s+='<path d="M40 49 C39 31 51 26 60 26 C72 26 82 33 80 48 C75 40 66 37 58 38 C50 39 44 43 40 49 Z" fill="#1E1A17"/>';
if(stage===2||stage>=4)s+='<rect x="44" y="44" width="32" height="9" rx="4.5" fill="'+(stage>=4?'#F2B544':'#7B9BFF')+'"/><rect x="47" y="46" width="10" height="2.5" rx="1.2" fill="#fff" opacity=".7"/>';
else if(stage===1||stage===3)s+='<circle cx="52" cy="50" r="5" stroke="#14171C" stroke-width="2"/><circle cx="68" cy="50" r="5" stroke="#14171C" stroke-width="2"/><path d="M57 50 H63" stroke="#14171C" stroke-width="2"/>';
else s+='<circle cx="53" cy="50" r="2.2" fill="#14171C"/><circle cx="67" cy="50" r="2.2" fill="#14171C"/>';
s+='<path d="M54 59 Q60 63.5 66 59" stroke="#7A4A2C" stroke-width="2" stroke-linecap="round"/>';
s+='<path d="M37 50 C37 30 83 30 83 50" stroke="'+P.trim+'" stroke-width="3.5"/><rect x="33" y="45" width="7" height="13" rx="3" fill="'+P.trim+'"/><rect x="80" y="45" width="7" height="13" rx="3" fill="'+P.trim+'"/><path d="M37 58 Q39 66 49 64" stroke="'+P.trim+'" stroke-width="2"/>';
if(stage>=4)s+='<ellipse cx="60" cy="18" rx="18" ry="4.5" stroke="#F2B544" stroke-width="3"/>';
return s+'</svg>';
}
function npcArt(size){return '<svg class="npc" width="'+size+'" height="'+size+'" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="#1B2A4A"/><path d="M12 80 C12 60 25 52 40 52 C55 52 68 60 68 80Z" fill="#2E8A62"/><path d="M33 52 L40 62 L47 52" stroke="#E8ECF1" stroke-width="2" fill="none"/><rect x="36" y="44" width="8" height="10" rx="3" fill="#9C6440"/><circle cx="40" cy="33" r="14" fill="#B97A50"/><path d="M25 34 C24 18 56 17 55 34 C51 25 30 25 25 34Z" fill="#2B1B10"/><circle cx="40" cy="15" r="6.5" fill="#2B1B10"/><circle cx="35" cy="34" r="1.8" fill="#14171C"/><circle cx="45" cy="34" r="1.8" fill="#14171C"/><path d="M36 40 Q40 43 44 40" stroke="#5C3520" stroke-width="1.6" stroke-linecap="round" fill="none"/><rect x="50" y="58" width="15" height="19" rx="2" fill="#E8ECF1"/><path d="M53 63h9M53 67h9M53 71h6" stroke="#2E8A62" stroke-width="1.5"/></svg>'}
function renderRank(){const xp=STORE.xp,{i,r,nx,pct}=rankOf(xp);$('#rankBox').innerHTML=avatar(i,30)+'<div class="rank-t"><b>'+esc(tName())+' · '+r.t+'</b><div class="xpbar"><i style="width:'+pct+'%"></i></div><span class="rank-x">'+xp+' XP'+(nx?' · '+(nx.xp-xp)+' to '+nx.t:' · max rank')+'</span></div>'}
function toast(msg,kind){const box=$('#toasts');[...box.children].forEach(c=>{if(c.textContent===msg)c.remove()});while(box.children.length>1)box.firstChild.remove();const t=document.createElement('div');t.className='toast'+(kind?' '+kind:'');t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),2600)}
function show(id){['title','lobby','mission','results'].forEach(s=>$('#'+s).hidden=s!==id);$('#'+id).scrollTop=0}

/* ---------- audio ---------- */
const AU={ctx:null,out:null,mg:null,timer:null,next:0,step:0};
function ac(){try{if(!AU.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AU.ctx=new C();AU.out=AU.ctx.createGain();AU.out.gain.value=.6;AU.out.connect(AU.ctx.destination)}if(AU.ctx.state==='suspended')AU.ctx.resume();return AU.ctx}catch(e){return null}}
function tone(f,d,type,vol,when,dest){const c=ac();if(!c)return;const t=c.currentTime+(when||0),o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.06,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||AU.out);o.start(t);o.stop(t+d+.05)}
const SFX={
click:()=>tone(660,.05,'square',.03),
pick:()=>tone(540,.06,'triangle',.06),
flagOn:()=>{tone(440,.08,'square',.05);tone(880,.12,'square',.05,.07)},
flagOff:()=>tone(330,.08,'square',.04),
unlock:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.14,'triangle',.08,i*.06)),
bad:()=>{tone(150,.28,'sawtooth',.06);tone(110,.3,'sawtooth',.05,.08)},
submit:()=>[784,1047,1319].forEach((f,i)=>tone(f,.16,'triangle',.08,i*.07)),
warn:()=>{tone(880,.12,'square',.05);tone(880,.12,'square',.05,.18)},
tick:()=>tone(1200,.04,'square',.03),
win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.08,i*.1)),
lose:()=>[392,330,262].forEach((f,i)=>tone(f,.26,'triangle',.07,i*.14)),
rank:()=>[392,523,659,784,1047,1568].forEach((f,i)=>tone(f,.32,'square',.05,i*.11)),
quest:()=>[659,880,1175].forEach((f,i)=>tone(f,.18,'triangle',.07,i*.09)),
type:()=>tone(980,.02,'square',.012)
};
function sfx(n){if(STORE.sfx&&SFX[n])try{SFX[n]()}catch(e){}}
const BASS=[110,87.31,130.81,98],CH=[[220,261.63,329.63,392],[174.61,220,261.63,349.23],[261.63,329.63,392,523.25],[196,246.94,293.66,392]];
function musicOn(){const c=ac();if(!c)return;if(!AU.mg){AU.mg=c.createGain();AU.mg.gain.value=.5;AU.mg.connect(AU.out)}clearInterval(AU.timer);AU.next=c.currentTime+.08;AU.step=0;
AU.timer=setInterval(()=>{while(AU.next<c.currentTime+.25){const s=AU.step,bar=Math.floor(s/16)%4,i=s%16,w=AU.next-c.currentTime;
if(i%8===0)tone(BASS[bar],.9,'triangle',.07,w,AU.mg);
if(i%2===0)tone(CH[bar][(i/2)%4]*(i>=8?2:1),.16,'square',.018,w,AU.mg);
if(i===6||i===14)tone(CH[bar][3]*2,.3,'sine',.02,w,AU.mg);
AU.next+=.15;AU.step++}},60)}
function musicOff(){clearInterval(AU.timer);AU.timer=null}
function syncAudioBtns(){$('#musBtn').setAttribute('aria-pressed',String(!!STORE.music));$('#sfxBtn').setAttribute('aria-pressed',String(!!STORE.sfx))}

/* ---------- title ---------- */
const ILL={
hunt:'<svg viewBox="0 0 200 130" role="img" aria-label="A replica app with a wrong subtotal circled by a magnifier"><rect x="14" y="12" width="152" height="106" rx="8" fill="#fff"/><rect x="14" y="12" width="152" height="14" rx="8" fill="#E9ECF0"/><circle cx="23" cy="19" r="2.5" fill="#C4C9D1"/><circle cx="31" cy="19" r="2.5" fill="#C4C9D1"/><rect x="24" y="36" width="54" height="7" rx="2" fill="#1E6B52"/><rect x="24" y="52" width="130" height="10" rx="2" fill="#EEF0F3"/><rect x="24" y="68" width="130" height="10" rx="2" fill="#EEF0F3"/><rect x="24" y="86" width="130" height="14" rx="3" fill="#FEF3F2"/><text x="30" y="96" font-family="monospace" font-size="8" fill="#B42318">2 × $48 = $48 ?</text><circle cx="150" cy="93" r="22" stroke="#F2B544" stroke-width="4" fill="rgba(242,181,68,.14)"/><path d="M166 109 L184 125" stroke="#F2B544" stroke-width="6" stroke-linecap="round"/></svg>',
flag:'<svg viewBox="0 0 200 130" role="img" aria-label="Scan mode with a crosshair over a button"><rect x="14" y="12" width="172" height="106" rx="8" fill="#fff" stroke="#F2B544" stroke-width="3"/><rect x="58" y="18" width="84" height="13" rx="6.5" fill="#F2B544"/><text x="100" y="27.5" text-anchor="middle" font-family="monospace" font-size="7" font-weight="700" fill="#1A1405">SCAN MODE</text><rect x="28" y="44" width="144" height="10" rx="2" fill="#EEF0F3"/><rect x="28" y="60" width="100" height="10" rx="2" fill="#EEF0F3"/><rect x="58" y="82" width="84" height="22" rx="5" fill="#A3236E" stroke="#F2B544" stroke-width="2" stroke-dasharray="4 3"/><text x="100" y="96" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="700" fill="#fff">Place order</text><g transform="translate(136 98)"><circle r="11" stroke="#14171C" stroke-width="2.5" fill="none"/><path d="M0 -17v8M0 9v8M-17 0h8M9 0h8" stroke="#14171C" stroke-width="2.5" stroke-linecap="round"/></g></svg>',
build:'<svg viewBox="0 0 200 130" role="img" aria-label="Rubric card with fields unlocking one by one and a choice selected"><rect x="18" y="8" width="164" height="114" rx="10" fill="#141922" stroke="#283040"/><text x="30" y="24" font-family="monospace" font-size="7" font-weight="700" fill="#F2B544">FINDING UNLOCKED</text><rect x="30" y="31" width="22" height="4" rx="2" fill="#7B9BFF"/><rect x="56" y="31" width="22" height="4" rx="2" fill="#7B9BFF"/><rect x="82" y="31" width="22" height="4" rx="2" fill="#F2B544"/><rect x="108" y="31" width="22" height="4" rx="2" fill="#283040"/><rect x="134" y="31" width="36" height="4" rx="2" fill="#283040"/><rect x="30" y="44" width="140" height="20" rx="5" fill="#1B212C" stroke="#283040"/><rect x="30" y="68" width="140" height="20" rx="5" fill="#2A2414" stroke="#F2B544" stroke-width="1.5"/><rect x="30" y="92" width="140" height="20" rx="5" fill="#1B212C" stroke="#283040"/><g font-family="monospace" font-size="7" font-weight="700" fill="#E8ECF1"><text x="37" y="57">1</text><text x="37" y="81">2</text><text x="37" y="105">3</text></g><rect x="48" y="52" width="100" height="4" rx="2" fill="#4A5468"/><rect x="48" y="76" width="108" height="4" rx="2" fill="#F2B544"/><rect x="48" y="100" width="92" height="4" rx="2" fill="#4A5468"/></svg>',
debrief:'<svg viewBox="0 0 200 130" role="img" aria-label="Grade A with XP gained and a coach message"><rect x="18" y="16" width="58" height="58" rx="14" fill="#1B212C" stroke="#7B9BFF" stroke-width="3"/><text x="47" y="58" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#7B9BFF">A</text><text x="88" y="36" font-family="monospace" font-size="14" font-weight="700" fill="#F2B544">+240 XP</text><rect x="88" y="45" width="94" height="6" rx="3" fill="#1B212C"/><rect x="88" y="45" width="64" height="6" rx="3" fill="#7B9BFF"/><text x="88" y="66" font-family="monospace" font-size="7" fill="#9AA4B2">RANK UP · ANALYST</text><rect x="18" y="86" width="164" height="32" rx="10" fill="#111933" stroke="#2B3A63"/><circle cx="33" cy="102" r="8" fill="#2E8A62"/><rect x="48" y="96" width="114" height="4" rx="2" fill="#9AA4B2"/><rect x="48" y="104" width="80" height="4" rx="2" fill="#9AA4B2"/></svg>'
};
function renderTitle(){
const xp=STORE.xp,{i,r,nx,pct}=rankOf(xp),returning=STORE.runs.length>0||!!STORE.name;
$('#title').innerHTML='<div class="ttl"><div class="ttl-l"><span class="lab" style="color:var(--flag)">AI Data Lab · Trainer RPG</span><h1>AI Trainer<br><span>Defense</span></h1>'+
'<p class="tag">Hunt bugs in real-world app replicas. Rank them. File findings the validator can\'t reject.</p>'+
'<p class="what">You play an AI trainer reviewing clones of e-commerce, hotel, ticketing and CRM apps. Each app has 8 claimable tasks, and each task hides its own mix of bugs, missing features and FILTER traps. Reproduce an issue, flag it, then build each CheckSet rubric field from the choices you\'re given.</p>'+
'<label class="namebox"><span class="lab">Trainer name</span><input id="nameIn" maxlength="24" placeholder="Your trainer name" value="'+esc(STORE.name)+'" autocomplete="off"></label>'+
'<div class="ttl-cta"><button class="btn pri big" id="playBtn">'+IC.play+(returning?' Continue':' Start')+'</button><button class="btn big" id="howBtn">How it works</button></div></div>'+
'<div class="hero-card"><span class="lab">Your trainer</span><div class="av">'+avatar(i,150)+'</div><h2>'+esc(tName())+'</h2><span class="chip">'+r.t+' · '+xp+' XP</span><div class="xpbar" style="width:100%;max-width:280px;height:8px"><i style="width:'+pct+'%"></i></div>'+
'<div class="ladder">'+RANKS.map((k,j)=>'<div class="'+(j===i?'cur':j>i?'lock':'')+'">'+avatar(j,40)+'<span>'+k.t+'</span></div>').join('')+'</div>'+
'<p class="questline"><b style="color:var(--fg)">Main quest:</b> rise from Trainee to AI Trainer Prime. Clean reports earn XP. Each rank transforms your trainer and unlocks a harder review tier'+(nx?'. Next: '+nx.t+' at '+nx.xp+' XP':'')+'.</p></div></div>';
}
function openHow(){
$('#how').innerHTML='<div class="sheet" style="width:min(980px,100%)"><div class="sh-top"><div class="sheet-h"><div><span class="lab">How it works</span><h2 id="howTitle" style="margin-top:6px">One mission, four moves</h2></div><button class="btn sm" id="howClose">Close</button></div></div><div class="sh-body">'+
'<div class="hw">'+[['hunt','1 · HUNT','Use the replica like a real user. Sweep the workflow phase by phase until something misbehaves.'],['flag','2 · FLAG','Press F. Scan mode lights up. Click the exact spot where the issue shows on screen.'],['build','3 · BUILD','The finding unlocks. Pick Type, Priority, then each rubric field from look-alike choices.'],['debrief','4 · DEBRIEF','Get a grade, XP and rule-by-rule feedback, then a personal debrief from the Gemini coach.']].map(([k,t,d])=>'<div>'+ILL[k]+'<b>'+t+'</b><span>'+d+'</span></div>').join('')+'</div>'+
'<div class="hwq"><div><span class="lab">Your quest</span><span>Rise from <b>Trainee</b> to <b>AI Trainer Prime</b>. Every rank changes how your trainer looks and unlocks a harder tier: Analyst, then Auditor, then Expert.</span></div><div><span class="lab">What gets harder</span><span>Never the clock. You pick 10, 15 or 30 minutes. Higher tiers give you more findings and rubric choices that are nearly identical, so you have to read every word.</span></div><div><span class="lab">Traps</span><span>Some broken-looking things are not reportable: external sites, "coming soon" links, missing prerequisites, known limitations. Flag them and choose <b>Don\'t report</b> for bonus XP.</span></div><div><span class="lab">No guessing</span><span>Flagging spots you have not reproduced counts as a miss. Rookies can guess freely. From Analyst up, misses cost XP, blind flags in a row jam the scanner, and Auditor and Expert have a miss budget.</span></div><div><span class="lab">Keys</span><span><span class="keys"><kbd>F</kbd> flag · <kbd>Esc</kbd> cancel · <kbd>1</kbd>–<kbd>5</kbd> pick · <kbd>Enter</kbd> submit</span></span></div></div>'+
'</div></div>';
$('#how').hidden=false;
}

/* ---------- hub ---------- */
let pickApp=STORE.app in APPS?STORE.app:'cartly',pickDiff=DIFFS[STORE.tier]?STORE.tier:'rookie',pickTime=TIMES.includes(STORE.time)?STORE.time:15;
if(DIFFS[pickDiff].unlock>rankIdx(STORE.xp))pickDiff='rookie';
let pickTask=(()=>{const kt=keyTask(STORE.task);return kt&&kt.a.id===pickApp?kt.t.code:APPS[pickApp].tasks[0].code})();
const curTask=()=>APPS[pickApp].tasks.find(x=>x.code===pickTask)||APPS[pickApp].tasks[0];
function startNext(){const kt=keyTask(STORE.queue[0]);if(!kt)return;pickApp=kt.a.id;pickTask=kt.t.code;run=null;openBrief()}
const GORD={S:5,A:4,B:3,C:2,D:1};
const QUESTS=[
{id:'q1',t:'First contract',d:'Finish any mission.',xp:50,goal:1,prog:S=>S.runs.length},
{id:'q2',t:'Tour of duty',d:'Play all 4 arenas.',xp:150,goal:4,prog:S=>new Set(S.runs.map(r=>r.appId||r.app)).size},
{id:'q3',t:'Trap sense',d:'Handle 3 FILTER traps correctly.',xp:100,goal:3,prog:S=>S.runs.reduce((a,r)=>a+(r.trapsOk||0),0)},
{id:'q4',t:'Clean report',d:'Earn an A or S grade.',xp:150,goal:1,prog:S=>S.runs.filter(r=>r.grade==='A'||r.grade==='S').length},
{id:'q5',t:'Long shift',d:'Finish a 30-minute mission.',xp:100,goal:1,prog:S=>S.runs.filter(r=>r.mins===30).length},
{id:'q6',t:"Auditor's eye",d:'Score B or better on Auditor or Expert.',xp:250,goal:1,prog:S=>S.runs.filter(r=>(r.tier==='auditor'||r.tier==='expert')&&'SAB'.includes(r.grade)).length},
{id:'q7',t:'Task grinder',d:'Complete 10 different tasks.',xp:200,goal:10,prog:S=>new Set(S.runs.filter(r=>r.task).map(r=>r.task)).size},
{id:'q8',t:'Board clear',d:'Complete all 8 tasks in one app.',xp:300,goal:8,prog:S=>Math.max(0,...Object.keys(APPS).map(id=>new Set(S.runs.filter(r=>r.task&&r.task.indexOf(id+':')===0).map(r=>r.task)).size))}
];
function lvlIcon(n){let s='<svg width="'+(n*14)+'" height="14" viewBox="0 0 '+(n*14)+' 14" fill="none" aria-hidden="true">';for(let i=0;i<n;i++)s+='<path d="M'+(i*14+2)+' 11 L'+(i*14+7)+' 4 L'+(i*14+12)+' 11" stroke="#F2B544" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';return s+'</svg>'}
function renderLobby(){
const xp=STORE.xp,{i,r,nx,pct}=rankOf(xp),runs=STORE.runs;
const best=runs.reduce((b,x)=>GORD[x.grade]>(GORD[b]||0)?x.grade:b,'—');
const avg=runs.length?Math.round(runs.reduce((a,x)=>a+x.pct,0)/runs.length)+'%':'—';
STORE.queue=STORE.queue.filter(k=>keyTask(k));
const a=APPS[pickApp],d=DIFFS[pickDiff],tk=curTask(),n=nFor(a,tk,pickDiff,pickTime),A=assess(),Q=STORE.queue;
$('#lobby').innerHTML='<div class="lb">'+
'<aside class="pcard"><div class="pc-top">'+avatar(i,72)+'<div><span>'+r.t+'</span><b>'+esc(tName())+'</b></div></div>'+
'<div class="pc-xp"><div class="xpbar"><i style="width:'+pct+'%"></i></div><span class="rank-x">'+xp+' XP'+(nx?' · '+(nx.xp-xp)+' XP to '+nx.t:' · max rank')+'</span></div>'+
'<div class="stats"><div class="stat"><b>'+(A?A.tasks:0)+'/'+TOTAL_TASKS+'</b><span>tasks completed</span></div><div class="stat"><b>'+(A?A.avgFound.toFixed(1)+'/'+A.avgTarget.toFixed(1):'—')+'</b><span>avg findings per task</span></div><div class="stat"><b>'+(A?A.fr+'%':'—')+'</b><span>find rate</span></div><div class="stat"><b>'+(A?A.acc+'%':avg)+'</b><span>rubric accuracy</span></div></div>'+
'<div class="assess"><span class="lab">Assessment</span>'+(A?'<b>'+A.level+' · '+A.score+'</b><div class="xpbar" style="width:100%;max-width:none;height:8px"><i style="width:'+A.score+'%"></i></div><span class="rank-x">'+A.n+' graded task run'+(A.n===1?'':'s')+' · best grade '+best+'</span><button class="btn sm" id="assessBtn">Full assessment</button>':'<span class="note">Finish a task to get your first assessment.</span>')+'</div>'+
'<span class="lab">Quest board</span><div class="quests">'+QUESTS.map(q=>{const done=STORE.quests.includes(q.id),p=Math.min(q.goal,q.prog(STORE));return '<div class="q'+(done?' done':'')+'"><span class="ck"></span><span><b>'+q.t+'</b><span class="d">'+q.d+(q.goal>1?' '+p+'/'+q.goal:'')+'</span></span><span class="x">'+(done?'DONE':'+'+q.xp+' XP')+'</span>'+(q.goal>1&&!done?'<span class="qbar"><i style="width:'+Math.round(100*p/q.goal)+'%"></i></span>':'')+'</div>'}).join('')+'</div>'+
'<button class="btn sm" id="howBtn2">How it works</button></aside>'+
'<section class="lb-main"><div class="lb-h"><div><span class="lab">Mission select</span><h1 style="margin-top:6px">Choose your contract</h1></div><span class="note">Replica apps, real-world workflows</span></div>'+
'<div class="arenas">'+Object.values(APPS).map(x=>'<button class="tile" data-pick-app="'+x.id+'" aria-pressed="'+(pickApp===x.id)+'"><span class="t-ic" style="background:'+x.brand+'">'+ART[x.id]+'</span><span class="t-bd"><span class="cat">'+x.cat+'</span><h3>'+x.name+'</h3><span class="flow">'+x.flow+'</span><span class="dstats"><span class="chip">'+x.defects.filter(z=>z.kind==='bug').length+' bugs</span><span class="chip">'+x.defects.filter(z=>z.kind==='fr').length+' FRs</span><span class="chip">'+x.tasks.length+' tasks</span></span></span></button>').join('')+'</div>'+
'<div class="lb-h"><h2>Task board · '+a.name+'</h2><span class="note">Claim up to 10 tasks. Each one hides its own mix of issues.</span></div><div class="tasks">'+a.tasks.map(t=>{const k=taskKey(a,t),ts=taskStat(k),qi=Q.indexOf(k);return '<div class="task'+(t.code===tk.code?' on':'')+'"><button class="task-main" data-pick-task="'+t.code+'" aria-pressed="'+(t.code===tk.code)+'"><span class="tk-code">'+t.code+'</span><b>'+t.t+'</b><span class="tk-brief">'+t.brief+'</span><span class="dstats"><span class="chip">'+t.pool.length+' issues</span>'+(ts?'<span class="chip g'+ts.best+'">Best '+ts.best+' · '+ts.found+'/'+ts.target+' found</span>':'<span class="chip">New</span>')+'</span></button><button class="btn sm task-claim" data-claim="'+k+'" aria-pressed="'+(qi>=0)+'">'+(qi>=0?'Claimed #'+(qi+1):'Claim')+'</button></div>'}).join('')+'</div>'+
'<div class="lb-h"><h2>Shift length</h2><span class="note">The clock never shrinks. Longer shifts hide more findings.</span></div><div class="seg">'+TIMES.map(t=>'<button data-pick-time="'+t+'" aria-pressed="'+(pickTime===t)+'">'+t+' min<small>'+nFor(a,tk,pickDiff,t)+' findings</small></button>').join('')+'</div>'+
'<div class="lb-h"><h2>Review tier</h2><span class="note">Unlocks with your rank. Harder tiers make the choices look alike.</span></div><div class="levels">'+Object.entries(DIFFS).map(([k,v])=>{const lk=v.unlock>i;return '<button class="lv'+(lk?' locked':'')+'" data-pick-diff="'+k+'" aria-pressed="'+(pickDiff===k)+'"'+(lk?' aria-disabled="true"':'')+'><h3>'+v.t+'<span>'+lvlIcon(v.lvl)+'</span></h3>'+(lk?'<span class="lk">'+IC.lock+' Unlocks at '+RANKS[v.unlock].t+'</span>':'')+'<ul>'+v.l.map(z=>'<li>'+z+'</li>').join('')+'<li>XP ×'+v.mult+'</li></ul></button>'}).join('')+'</div>'+
'<div class="deploy"><div><span class="lab">'+(Q.length?'Queue · '+Q.length+' claimed':'Ready')+'</span><div style="margin-top:6px"><b>'+tk.code+' · '+tk.t+'</b><p>'+a.name+' · '+d.t+' · '+pickTime+' min · '+n+' hidden findings plus FILTER traps · XP ×'+d.mult+'</p></div></div><span class="dstats">'+(Q.length?'<button class="btn big" id="startBtn">Play '+tk.code+'</button><button class="btn pri big" id="nextBtn">'+IC.flag+' Next claimed · '+keyTask(Q[0]).t.code+'</button>':'<button class="btn pri big" id="startBtn">'+IC.flag+' Get briefing</button>')+'</span></div>'+
'</section></div>';
}

/* ---------- briefing ---------- */
let DLG=null;
function openBrief(){
const app=APPS[pickApp],d=DIFFS[pickDiff],tk=curTask(),n=nFor(app,tk,pickDiff,pickTime);
DLG={i:0,lines:[tk.brief,'Your quest, '+tName()+': find '+n+' finding'+(n>1?'s':'')+' in '+pickTime+' minutes. Bugs and feature requests both count. Broken-looking things outside the app\'s control are FILTER traps, so flag those as Don\'t report.',d.say]};
$('#brief').innerHTML='<div class="mcard"><span class="lab" style="color:var(--flag)">'+tk.code+' · '+d.t+' review</span><span class="t-ic" style="background:'+app.brand+'">'+artSize(app.id,42)+'</span><h2>'+tk.t+'</h2><span class="note">'+app.name+' · '+app.cat+' · '+app.flow+'</span><span class="goal"><span class="chip">'+n+' findings</span><span class="chip">'+pickTime+':00</span><span class="chip">4 traps hidden</span><span class="chip">XP ×'+d.mult+'</span></span></div>'+
'<div class="dlg">'+npcArt(64)+'<div><span class="who">Vera · Lead Validator</span><p id="dlgTxt"></p></div><div class="dlg-r"><span class="lab" id="dlgStep"></span><span class="dstats"><button class="btn sm" id="dlgBack">Back to hub</button><button class="btn pri" id="dlgNext"></button></span></div></div>';
$('#brief').hidden=false;sayLine();
}
function sayLine(){
const t=DLG.lines[DLG.i],el=$('#dlgTxt');let k=0;DLG.typing=true;clearInterval(DLG.tm);el.textContent='';
$('#dlgStep').textContent=(DLG.i+1)+' / '+DLG.lines.length;$('#dlgNext').textContent=DLG.i===DLG.lines.length-1?'Accept quest':'Next ▸';
DLG.tm=setInterval(()=>{k+=2;el.textContent=t.slice(0,k);if(k%6===0)sfx('type');if(k>=t.length){clearInterval(DLG.tm);DLG.typing=false}},20);
}
function dlgNext(){if(!DLG)return;if(DLG.typing){clearInterval(DLG.tm);DLG.typing=false;$('#dlgTxt').textContent=DLG.lines[DLG.i];return}if(DLG.i<DLG.lines.length-1){DLG.i++;sayLine()}else{closeBrief();startMission()}}
function closeBrief(){if(DLG)clearInterval(DLG.tm);DLG=null;$('#brief').hidden=true}

/* ---------- mission ---------- */
function pickDefects(app,diff,n,tk){
const cf=app.conflicts||[];const ok=(set,id)=>!cf.some(([a,b])=>(a===id&&set.includes(b))||(b===id&&set.includes(a)));
const base=poolFor(app,tk,diff);
for(let t=0;t<300;t++){const frs=shuffle(base.filter(d=>d.kind==='fr')),rest=shuffle(base.filter(d=>d!==frs[0]));const pool=[frs[0],...rest].map(d=>d.id),out=[];for(const id of pool){if(out.length<n&&ok(out,id))out.push(id)}if(out.length===n)return out}
return base.slice(0,n).map(d=>d.id);
}
let tick=null,RO=null;
function startMission(){
const app=APPS[pickApp],d=DIFFS[pickDiff],mins=pickTime,tk=curTask(),n=nFor(app,tk,pickDiff,mins),ids=pickDefects(app,pickDiff,n,tk),now=Date.now()+1100,key=taskKey(app,tk);
STORE.queue=STORE.queue.filter(k=>k!==key);STORE.task=key;save();
run={paused:false,pauseAt:0,pausedMs:0,pauses:0,appId:app.id,task:key,code:tk.code,title:tk.t,brief:tk.brief,diff:pickDiff,mins,n,active:new Set(ids),list:ids,st:app.init(),start:now,end:now+mins*60000,flag:false,logged:{},order:[],ff:0,over:false,tab:'brief',w60:false,streak:0,moved:true,jamUntil:0,jams:0,blind:0,hits:0,revoked:false};
tmsg.length=0;
renderMission();show('mission');fit();
const it=$('#intro');it.innerHTML='<div class="intro-c"><span class="lab">Mission '+String(STORE.runs.length+1).padStart(2,'0')+' · '+d.t+'</span><h2>'+tk.t+'</h2><p>'+app.name+' · '+tk.code+' · '+n+' findings · '+mins+':00</p><span class="go">GO</span></div>';it.hidden=false;sfx('flagOn');
setTimeout(()=>{it.hidden=true},1100);
clearInterval(tick);tick=setInterval(updClock,1000);updClock();
}
function nowT(){return run&&run.paused?run.pauseAt:Date.now()}
function remain(){return Math.max(0,Math.min(run.mins*60,(run.end-nowT())/1000))}
function updClock(){
if(!run||run.over)return;const r=remain(),total=run.mins*60,el=$('#clock'),tm=$('#timer'),ring=$('#ring');
if(el)el.textContent=fmtT(r);if(tm)tm.className='hud-box timer'+(r<60?' crit':r<120?' warn':'');if(ring)ring.style.strokeDashoffset=String(113.1*(1-r/total));
if(run.paused){if(el)el.textContent=fmtT(r);const pb=$('#pauseClock');if(pb)pb.textContent=fmtT((Date.now()-run.pauseAt)/1000);return}
if(r<=60&&!run.w60&&r>0){run.w60=true;sfx('warn');toast('1 minute left','flag')}
if(r<=10&&r>0)sfx('tick');
if(run.jamUntil&&Date.now()>=run.jamUntil){run.jamUntil=0;toast('Scanner back online. Reproduce, then flag.')}
renderGuard();
if(r<=0){toast('Time is up. Debrief ready.','flag');endMission()}
}
function renderPips(){const p=$('#pips');if(!p)return;const n=run.n,k=Object.keys(run.logged).length;p.innerHTML=Array.from({length:n},(_,i)=>'<i class="'+(i<k?'on':'')+'"></i>').join('')+(k>n?'<b>+'+(k-n)+'</b>':'');p.setAttribute('aria-label',k+' of '+n+' findings logged')}
function renderMission(){
const app=APP(),d=DIFFS[run.diff];
$('#mission').innerHTML=
'<div class="hud"><div class="hud-id"><span class="hud-ic" style="background:'+app.brand+'">'+artSize(app.id,22)+'</span><div><b>'+app.name+' · '+run.code+'</b><span>'+esc(run.title)+' · '+d.t+' · '+run.mins+' min</span></div></div>'+
'<div class="hud-box"><span class="lab">Findings</span><div class="pips" id="pips" role="img"></div></div>'+
'<div class="hud-box timer" id="timer"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="tr-bg" cx="22" cy="22" r="18"/><circle class="tr-fg" id="ring" cx="22" cy="22" r="18" stroke-dasharray="113.1" stroke-dashoffset="0"/></svg><b id="clock" aria-label="Time left">'+fmtT(remain())+'</b></div>'+
'<div class="hud-box guard" id="guard" title="Anti-guess guard">'+IC.shield+'<b></b></div>'+
'<button class="btn" id="pauseBtn" aria-pressed="false" aria-label="Pause task">'+IC.pause+'<span class="wide"> Pause</span></button>'+
'<button class="btn flag" id="flagBtn" aria-pressed="false">'+IC.cross+' FLAG <span class="keys"><kbd>F</kbd></span></button>'+
'<button class="btn intelBtn" id="intelBtn" aria-label="Intel">'+IC.intel+'<span class="wide"> Intel</span></button>'+
'<button class="btn" id="endBtn">End<span class="wide"> &amp; debrief</span></button></div>'+
'<div class="arena"><div class="stagebox" id="stagebox"><div class="device" id="device"><div class="rp" id="rp" style="--b:'+app.brand+'"></div></div></div>'+
'<aside class="rail" id="rail"><div class="rail-x"><span class="lab">Intel</span><button class="btn sm" id="railClose">Close</button></div><div class="tabs" role="tablist">'+[['brief','Brief'],['ref','Real app'],['kit','Rules'],['log','Log']].map(([k,l])=>'<button role="tab" data-tab="'+k+'" aria-selected="'+(run.tab===k)+'">'+l+'</button>').join('')+'</div><div class="pane" id="pane"></div></aside></div>';
rr();renderPane();renderPips();renderGuard();
if(window.ResizeObserver){if(RO)RO.disconnect();RO=new ResizeObserver(fit);RO.observe($('#stagebox'))}
}
function fit(){
const box=$('#stagebox'),dv=$('#device');if(!box||!dv)return;
const bw=box.clientWidth,bh=box.clientHeight;if(!bw||!bh)return;
const W=bw<700?420:1080;let s=bw/W;if(W>500)s=Math.min(s,bh/640);s=Math.min(s,1.2);
dv.style.width=W+'px';dv.style.height=(bh/s)+'px';dv.style.transform='scale('+s+')';dv.style.left=Math.max(0,(bw-W*s)/2)+'px';
}
window.addEventListener('resize',fit);
function renderPane(){
const app=APP(),d=DIFFS[run.diff],p=$('#pane');if(!p)return;
if(run.tab==='brief'){
let h='<div class="npcsay" style="padding:10px">'+npcArt(36)+'<div><span class="who">Vera</span><p style="font-size:13px;margin:2px 0 0">'+esc(d.say)+'</p></div></div><span class="lab">Task '+run.code+' · '+esc(run.title)+'</span><p style="margin:0">'+esc(run.brief)+'</p><span class="lab">Objective</span><p style="margin:0">Find <b>'+run.n+' findings</b> in '+run.mins+' minutes. FILTER traps: flag them and choose <i>Don\'t report</i> for bonus XP.</p><span class="lab">Anti-guess guard</span><p style="margin:0">'+guardText(d.guard)+'</p><span class="lab">Controls</span><ul><li>Reproduce the issue so it shows on screen.</li><li>Press <b>F</b> or <b>FLAG</b>, then click the element showing it. <b>Esc</b> cancels.</li><li>In the rubric, press <b>1–5</b> to pick and <b>Enter</b> to submit.</li></ul>';
if(d.hints==='full')h+='<span class="lab">Hunt hints</span><ul>'+run.list.map(id=>{const x=app.defects.find(y=>y.id===id);return '<li><span class="k">HUNT #'+x.hunt[0]+'</span> '+x.hint+'</li>'}).join('')+'</ul>';
else if(d.hints==='phase')h+='<span class="lab">Phases to sweep</span><ul>'+[...new Set(run.list.map(id=>Math.ceil(app.defects.find(y=>y.id===id).hunt[0]/10)))].sort((a,b)=>a-b).map(ph=>'<li><span class="k">Phase '+String(ph).padStart(2,'0')+'</span> '+PHASES[ph-1]+'</li>').join('')+'</ul>';
else h+='<p class="note">No hints at this tier. Run the P0 smoke test first, then sweep phase by phase.</p>';
p.innerHTML=h;
}
if(run.tab==='ref')p.innerHTML='<span class="lab">What the real app does</span><p class="note">Listed here but missing in the clone = feature request.</p><ul>'+app.features.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul><span class="lab">Release notes · known limitations</span><ul>'+app.notes.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>';
if(run.tab==='kit')p.innerHTML='<div class="kit"><div><b>DECIDE</b><span>Reacts but fails = Bug. Absent vs the real app = FR. Works = Neither.</span></div><div><b>RANK</b><span>P0 core task blocked · P1 continues with severe limits · P2 non-core or cosmetic.</span></div><div><b>FILTER</b><span>1 External site · 2 Says unavailable · 3 Missing prerequisite · 4 Known limitation. Unavailable + P2 = never report.</span></div><div><b>WRITE</b><span>Summary "Section: control failure" or "Section: control should…". Path uses " -> ". Steps start by opening the app. FR steps = N/A.</span></div><div><b>PROVE</b><span>Actual = defect + baseline + plain why + impact. Always "the user", never "I tested".</span></div><div><b>GUARD · '+d.t.toUpperCase()+'</b><span>'+guardText(d.guard)+'</span></div></div>';
if(run.tab==='log'){const ids=run.order;p.innerHTML='<span class="lab">Logged this mission</span>'+(ids.length?ids.map(id=>{const x=findDef(id);return '<div class="logrow"><span>'+esc(x.control||x.label)+'</span><span class="mono">'+fmtT(run.logged[id].at)+'</span></div>'}).join(''):'<p class="note">Nothing logged yet.</p>')}
}
function findDef(id){const a=APP();return a.defects.find(x=>x.id===id)||a.traps.find(x=>x.id===id)}
function rr(){
if(!run)return;const rp=$('#rp');if(!rp)return;const app=APP();
const keep=rp.querySelector('.rp-main'),top=keep?keep.scrollTop:0,view=rp.dataset.view;
rp.innerHTML='<div class="rp-bar"><span class="rp-dots"><i></i><i></i><i></i></span><span class="rp-url">'+IC.lock+' '+esc(app.url(run.st))+'</span></div><div class="rp-body">'+app.render(run.st)+'</div>'+(tmsg.length?'<div class="rp-toast" role="status">'+esc(tmsg[tmsg.length-1])+'</div>':'');
rp.classList.toggle('flagging',run.flag);
const nm=rp.querySelector('.rp-main');if(nm&&view===run.st.view)nm.scrollTop=top;rp.dataset.view=run.st.view;
}
function setPath(o,path,v){const k=path.split('.');let t=o;for(let i=0;i<k.length-1;i++){if(t[k[i]]==null)t[k[i]]={};t=t[k[i]]}t[k[k.length-1]]=v}
function doAct(name,arg,el){const app=APP(),fn=app.acts[name];if(!fn)return;run.moved=true;const r=fn(run.st,arg,el);if(r!==false)rr()}
function setFlag(on,quiet){
if(on){const gb=guardBlock();if(gb){sfx('bad');toast(gb,'bad');return}}
run.flag=on;if(!quiet)sfx(on?'flagOn':'flagOff');const b=$('#flagBtn');if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.innerHTML=IC.cross+(on?' SCANNING <span class="keys"><kbd>Esc</kbd></span>':' FLAG <span class="keys"><kbd>F</kbd></span>')}
const dv=$('#device');if(dv){dv.classList.toggle('flagging',on);const sb=dv.querySelector('.scanbar');if(on&&!sb)dv.insertAdjacentHTML('afterbegin','<div class="scanbar">'+IC.cross+' SCAN MODE · CLICK WHERE THE ISSUE SHOWS</div>');if(!on&&sb)sb.remove()}
const rp=$('#rp');if(rp)rp.classList.toggle('flagging',on);clearTarget();
}
function togglePause(quiet){
if(!run||run.over)return;const dv=$('#device'),rp=$('#rp'),b=$('#pauseBtn');
if(!run.paused){
 if(run.flag)setFlag(false,true);
 run.paused=true;run.pauseAt=Date.now();run.pauses++;
 if(rp)rp.inert=true;
 if(dv){dv.classList.add('paused');dv.insertAdjacentHTML('beforeend','<div class="pausebox" id="pausebox"><div class="pcard2"><span class="lab" style="color:var(--flag)">Task paused</span><h2>Take a break</h2><p class="note">The clock is stopped at <b>'+fmtT(remain())+'</b>. The app is locked until you resume. You can still read Brief, Real app, Rules and Log.</p><span class="rank-x">On break <b id="pauseClock">00:00</b></span><span class="dstats" style="justify-content:center"><button class="btn" id="pauseRef">Review real app</button><button class="btn pri" id="resumeBtn">'+IC.play+' Resume <span class="keys"><kbd>P</kbd></span></button></span></div></div>')}
 if(b){b.classList.add('on');b.setAttribute('aria-pressed','true');b.setAttribute('aria-label','Resume task');b.innerHTML=IC.play+'<span class="wide"> Resume</span>'}
 if(!quiet){sfx('flagOff');toast('Paused. Timer stopped.')}
}else{
 const dt=Date.now()-run.pauseAt;run.end+=dt;run.pausedMs+=dt;if(run.jamUntil)run.jamUntil+=dt;run.paused=false;
 if(rp)rp.inert=false;
 if(dv){dv.classList.remove('paused');const pb=$('#pausebox');if(pb)pb.remove()}
 if(b){b.classList.remove('on');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Pause task');b.innerHTML=IC.pause+'<span class="wide"> Pause</span>'}
 if(!quiet){sfx('flagOn');toast('Resumed. Clock running.')}
}
updClock();renderGuard();
}
function guardBlock(){if(!run)return'';if(run.paused)return'Task is paused. Resume to flag.';const now=Date.now();if(run.revoked)return'Miss budget used up. The scanner is locked for this mission.';if(run.jamUntil>now)return'Scanner jammed for '+Math.ceil((run.jamUntil-now)/1000)+'s more. Use the app to reproduce the issue meanwhile.';return''}
function missFlag(){
const g=DIFFS[run.diff].guard;run.ff++;sfx('bad');
run.streak=run.moved?1:run.streak+1;run.moved=false;if(run.streak>1)run.blind++;
const pen=g.pen?' (−'+g.pen+')':'';
if(g.max&&run.ff>=g.max){run.revoked=true;renderGuard();toast('Miss '+run.ff+' of '+g.max+pen+'. Budget used up: the scanner is locked for this mission.','bad');return}
if(g.jamAt&&run.streak>=g.jamAt){run.jams++;const sec=g.jamSec*run.jams;run.jamUntil=Date.now()+sec*1000;run.streak=0;renderGuard();toast('Blind guessing detected'+pen+'. Scanner jammed for '+sec+'s. Reproduce the issue in the app first.','bad');return}
if(!g.jamAt){toast(run.streak>=g.warnAt?'Looks like guessing. Use the app until the issue shows, then flag it.':'No issue there. Reproduce it first, then flag.','bad')}
else if(run.streak>=g.warnAt){const left=g.jamAt-run.streak;toast('Miss'+pen+'. '+(left===1?'Flag again without using the app and the scanner jams.':left+' more blind flags jam the scanner.'),'bad')}
else toast('No issue there'+pen+'.','bad');
renderGuard();
}
function renderGuard(){
const el=$('#guard');if(!el||!run)return;const g=DIFFS[run.diff].guard,now=Date.now();let txt,sh,cls='';
if(run.revoked){txt='LOCKED';sh='LOCK';cls='bad'}
else if(run.jamUntil>now){const r=Math.ceil((run.jamUntil-now)/1000);txt='JAMMED '+r+'s';sh='JAM '+r;cls='bad'}
else if(g.max){const left=g.max-run.ff;txt=left+' miss'+(left===1?'':'es')+' left';sh=left+' left';cls=left<=2?'warn':''}
else{txt=run.ff+' miss'+(run.ff===1?'':'es');sh=run.ff+'✗';cls=g.jamAt&&run.streak>0?'warn':''}
el.setAttribute('data-s',sh);
el.className='hud-box guard'+(cls?' '+cls:'');el.querySelector('b').textContent=txt;el.setAttribute('aria-label','Anti-guess guard: '+txt);
const fb=$('#flagBtn');if(fb)fb.disabled=run.paused||run.revoked||run.jamUntil>now;
}
let lastT=null;function clearTarget(){if(lastT){lastT.classList.remove('flag-target');lastT=null}}
function doFlag(target){
const rp=$('#rp'),h=target.closest('[data-hot]');setFlag(false,true);
if(!h||!rp.contains(h)){missFlag();return}
const id=h.getAttribute('data-hot');run.streak=0;run.hits++;renderGuard();
if(run.logged[id]){toast('Already logged.');return}
sfx('unlock');openBuilder(id);
}

/* ---------- global events ---------- */
document.addEventListener('click',e=>{
const t=e.target;
const bt=t.closest('button');if(bt&&!t.closest('#rp')&&!bt.closest('#flagBtn')&&!bt.closest('.opt')&&!bt.closest('#musBtn')&&!bt.closest('#sfxBtn'))sfx('click');
if(STORE.music&&!AU.timer)musicOn();
if(t.closest('#musBtn')){STORE.music=!STORE.music;save();syncAudioBtns();if(STORE.music)musicOn();else musicOff();return}
if(t.closest('#sfxBtn')){STORE.sfx=!STORE.sfx;save();syncAudioBtns();sfx('pick');return}
if(t.closest('#homeBtn')){if(run&&!run.over)return toast('Finish or end the mission first.');closeBrief();run=null;renderTitle();show('title');return}
if(t.closest('#playBtn')){const v=($('#nameIn').value||'').trim().slice(0,24);if(v)STORE.name=v;save();renderRank();renderLobby();show('lobby');return}
if(t.closest('#howBtn')||t.closest('#howBtn2')){openHow();return}
if(t.closest('#howClose')||t===$('#how')){$('#how').hidden=true;return}
if(t.closest('#ruClose')||t===$('#rankup')){$('#rankup').hidden=true;return}
const pa=t.closest('[data-pick-app]');if(pa){pickApp=pa.dataset.pickApp;pickTask=APPS[pickApp].tasks[0].code;STORE.app=pickApp;save();renderLobby();return}
const pd=t.closest('[data-pick-diff]');if(pd){const k=pd.dataset.pickDiff,v=DIFFS[k];if(v.unlock>rankIdx(STORE.xp)){sfx('bad');toast('Reach '+RANKS[v.unlock].t+' rank to unlock '+v.t+' reviews.','bad');return}pickDiff=k;STORE.tier=k;save();renderLobby();return}
const pt=t.closest('[data-pick-time]');if(pt){pickTime=+pt.dataset.pickTime;STORE.time=pickTime;save();renderLobby();return}
const pk=t.closest('[data-pick-task]');if(pk){pickTask=pk.dataset.pickTask;STORE.task=pickApp+':'+pickTask;save();renderLobby();return}
const cl=t.closest('[data-claim]');if(cl){const k=cl.dataset.claim,i=STORE.queue.indexOf(k);if(i>=0)STORE.queue.splice(i,1);else{if(STORE.queue.length>=10){sfx('bad');toast('You can claim up to 10 tasks at a time.','bad');return}STORE.queue.push(k)}save();renderLobby();return}
if(t.closest('#nextBtn')){startNext();return}
if(t.closest('#assessBtn')){openAssess();return}
if(t.closest('#assessClose')||t===$('#assessM')){$('#assessM').hidden=true;return}
if(t.closest('#startBtn')){openBrief();return}
if(t.closest('#dlgNext')){dlgNext();return}
if(t.closest('#dlgBack')){closeBrief();return}
if(t.closest('#intro')){$('#intro').hidden=true;return}
if(!run)return;
if(t.closest('#pauseBtn')||t.closest('#resumeBtn')){togglePause();return}
if(t.closest('#pauseRef')){run.tab='ref';document.querySelectorAll('#rail [data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab==='ref'));renderPane();$('#rail').classList.add('open');return}
if(t.closest('#flagBtn')){setFlag(!run.flag);return}
if(t.closest('#endBtn')){endMission();return}
if(t.closest('#intelBtn')){$('#rail').classList.add('open');return}
if(t.closest('#railClose')){$('#rail').classList.remove('open');return}
const tb=t.closest('[data-tab]');if(tb&&tb.closest('#rail')){run.tab=tb.dataset.tab;document.querySelectorAll('#rail [data-tab]').forEach(b=>b.setAttribute('aria-selected',b===tb));renderPane();return}
});
document.addEventListener('click',e=>{
if(!run||run.over)return;const rp=$('#rp');if(!rp||!rp.contains(e.target))return;
if(run.flag){e.preventDefault();e.stopPropagation();doFlag(e.target);return}
const a=e.target.closest('[data-act]');if(!a||!rp.contains(a))return;
if(a.tagName==='FORM'||a.tagName==='INPUT'||a.tagName==='SELECT')return;
e.preventDefault();doAct(a.dataset.act,a.dataset.arg,a);
},true);
document.addEventListener('submit',e=>{const rp=$('#rp');if(!rp||!rp.contains(e.target))return;e.preventDefault();if(run.flag)return;const f=e.target;if(f.dataset.act)doAct(f.dataset.act,f.dataset.arg,f)});
document.addEventListener('input',e=>{const rp=$('#rp');if(!rp||!rp.contains(e.target))return;run.moved=true;const b=e.target.dataset.bind;if(b&&e.target.type!=='checkbox'&&e.target.type!=='radio')setPath(run.st,b,e.target.value)});
document.addEventListener('change',e=>{const rp=$('#rp');if(!rp||!rp.contains(e.target))return;run.moved=true;const el=e.target,b=el.dataset.bind;if(b){if(el.type==='checkbox')setPath(run.st,b,el.checked);else if(el.type==='radio'){if(el.checked)setPath(run.st,b,el.value)}else setPath(run.st,b,el.value)}if(el.dataset.act)doAct(el.dataset.act,el.dataset.arg,el)});
document.addEventListener('mouseover',e=>{if(!run||!run.flag)return;const rp=$('#rp');if(!rp||!rp.contains(e.target)||e.target===rp)return;clearTarget();lastT=e.target;lastT.classList.add('flag-target')});
document.addEventListener('keydown',e=>{
if(!$('#brief').hidden){if(e.key==='Enter'||e.key===' '){e.preventDefault();dlgNext()}else if(e.key==='Escape')closeBrief();return}
if(!$('#how').hidden){if(e.key==='Escape')$('#how').hidden=true;return}
if(!$('#assessM').hidden){if(e.key==='Escape')$('#assessM').hidden=true;return}
if(!$('#rankup').hidden){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();$('#rankup').hidden=true}return}
if(e.key==='Enter'&&document.activeElement&&document.activeElement.id==='nameIn'){$('#playBtn').click();return}
if(!run||run.over||$('#mission').hidden)return;
const tag=(document.activeElement&&document.activeElement.tagName)||'';
if((e.key==='p'||e.key==='P')&&$('#builder').hidden&&!['INPUT','SELECT','TEXTAREA'].includes(tag)&&!e.metaKey&&!e.ctrlKey){e.preventDefault();togglePause();return}
if(run.paused){if(e.key==='Escape')togglePause();return}
if(!$('#builder').hidden){
 if(e.key==='Escape'){closeBuilder();toast('Finding discarded. You can flag it again.');return}
 const map={'1':0,'2':1,'3':2,'4':3,'5':4};const k=e.key;
 if(k in map&&!e.metaKey&&!e.ctrlKey){const o=document.querySelectorAll('#bSheet .opt')[map[k]];if(o){e.preventDefault();o.click()}return}
 if(e.key==='Enter'){const s=$('#bSubmit');if(s&&!s.disabled){e.preventDefault();s.click()}return}
 if(e.key==='Backspace'){const bk=$('#bBack');if(bk&&!bk.disabled){e.preventDefault();bk.click()}return}
 return;
}
if(e.key==='Escape'&&run.flag){setFlag(false);return}
if((e.key==='f'||e.key==='F')&&!['INPUT','SELECT','TEXTAREA'].includes(tag)&&!e.metaKey&&!e.ctrlKey){e.preventDefault();setFlag(!run.flag)}
});

/* ---------- rubric builder ---------- */
function pickD(D,diff){const v=DIFFS[diff],n=v.opts-1;return shuffle(D).sort((a,b)=>v.pref.indexOf(a.lv)-v.pref.indexOf(b.lv)).slice(0,n)}
function ctrl(d){return /^["“]/.test(d.control)?d.control:lcFirst(d.control)}
function distractors(d,key){
const A=APP().name,isBug=d.kind==='bug';
const rest=isBug?d.control+' '+d.fail:d.control+' should '+d.should;
const sum=d.page+': '+rest;
const steps=isBug?numbered(d.steps):'N/A';
const expd='The '+ctrl(d)+' on the '+d.page+' should '+d.exp+', allowing the user to '+d.outcome+'.';
const act=d.defect+' '+d.baseline+' '+d.impact;
const cr=d.crumbs,sw=isBug?[...d.steps]:[];if(sw.length>=3){const x=sw[1];sw[1]=sw[2];sw[2]=x}
const M={
summary:{ok:sum,D:[
{lv:1,t:d.page+': '+d.control+' has a problem',r:'Name the specific failure or missing capability, never "has a problem".'},
{lv:1,t:(isBug?'Bug: ':'Feature Request: ')+sum,r:'Never prefix the summary with "Bug" or "Feature Request".'},
{lv:2,t:d.prio+' - '+sum,r:'Never prefix the summary with a priority like "'+d.prio+'".'},
isBug?{lv:3,t:d.page+': '+d.control+' should '+d.exp,r:'"Should" is the FR formula. A bug summary states the failure.'}:{lv:3,t:d.page+': '+d.control+' does not '+d.should,r:'FR summaries must always include the word "should".'},
{lv:3,t:ucFirst(rest),r:'Start with the page or section name followed by a colon.'},
{lv:4,t:d.page+' - '+rest,r:'Separate the section from the rest with a colon, not a dash.'},
isBug?{lv:4,t:d.page+': '+d.control+' sometimes '+d.fail,r:'State the observed failure plainly. No hedging words such as "sometimes".'}:{lv:4,t:d.page+': '+d.control+' could '+d.should,r:'FR summaries use "should", not "could".'}]},
path:{ok:cr.join(' -> '),D:[
{lv:1,t:cr[cr.length-1],r:'Give the full breadcrumb path, not one element.'},
{lv:2,t:[...cr].reverse().join(' -> '),r:'Breadcrumbs run from the top level down to the control.'},
{lv:3,t:cr.join(' / '),r:'Separate levels with " -> ".'},
{lv:3,t:cr.join(' > '),r:'Separate levels with " -> ".'},
{lv:4,t:cr.join('->'),r:'Put a space on both sides of every "->".'},
cr.length>2?{lv:4,t:[cr[0],cr[cr.length-1]].join(' -> '),r:'Include every level of the path. A middle level is missing.'}:{lv:4,t:cr.map(c=>c.toLowerCase()).join(' -> '),r:'Write each level exactly as the app labels it.'}]},
steps:{ok:steps,D:isBug?[
{lv:1,t:'N/A',r:'Only feature requests use N/A. Bugs need numbered steps.'},
{lv:1,t:'I opened '+A+', tried the '+lcFirst(d.control.replace(/"/g,''))+' and it did not work.',r:'Steps are numbered, sequential and plain English, not a story.'},
{lv:2,t:numbered(d.steps.slice(0,-1)),r:'End with observing the defect.'},
{lv:3,t:numbered(d.steps.slice(1)),r:'Step 1 must always open the app.'},
{lv:3,t:d.steps.map((s,i)=>(i<2?i+1:i+2)+'. '+s).join('\n'),r:'Numbering must be sequential with no gaps.'},
{lv:4,t:numbered(sw),r:'Steps must follow the exact order the user performs them. Two steps are swapped.'},
{lv:4,t:numbered(['Go to the '+cr[0]+'.',...d.steps.slice(1)]),r:'Step 1 must open the app by name: "Open '+A+'…".'}]:[
{lv:1,t:numbered(['Open '+A+'.','Look for the feature.','It is not there.']),r:'Feature requests always enter N/A for steps.'},
{lv:2,t:'None',r:'Enter exactly N/A.'},
{lv:3,t:'N/A – see video',r:'Enter exactly N/A, nothing else.'},
{lv:3,t:numbered(['Open '+A+' and go to the '+cr[0]+'.','Look at the '+lcFirst(d.control)+'.']),r:'Feature requests always enter N/A for steps.'},
{lv:4,t:'n/a',r:'Enter exactly N/A, in capitals.'},
{lv:4,t:'N/A.',r:'Enter exactly N/A, with no extra punctuation.'}]},
expected:{ok:expd,D:[
{lv:1,t:'It should work properly without any errors.',r:'Name the control, its location, the action and what it lets the user do.'},
{lv:2,t:'As a user, I want the '+ctrl(d)+' to '+d.exp+' so that I can '+d.outcome+'.',r:'Never write "As a user, I want…". Refer to "the user".'},
{lv:2,t:'I expected the '+ctrl(d)+' to '+d.exp+'.',r:'Write about "the user", never "I".'},
{lv:3,t:'The '+ctrl(d)+' on the '+d.page+' should '+d.exp+'.',r:'Expected must end with what it allows the user to do.'},
{lv:3,t:'The '+ctrl(d)+' on the '+d.page+' should '+d.exp+', allowing customers to '+d.outcome+'.',r:'Always refer to the persona as "the user".'},
{lv:4,t:'The '+ctrl(d)+' on the '+d.page+' should '+d.exp+', allowing them to '+d.outcome+'.',r:'Name the persona: "allowing the user to", not "them".'},
{lv:4,t:'The '+ctrl(d)+' on the '+d.page+' could '+d.exp+', allowing the user to '+d.outcome+'.',r:'Expected behavior uses "should", not "could".'}]},
actual:{ok:act,D:[
{lv:1,t:'It is broken and does not work.',r:'Actual needs all 4 points: defect, baseline, plain why, impact.'},
{lv:2,t:'I tested this and found that '+lcFirst(d.defect)+' '+d.impact,r:'No test narration such as "I tested". State facts.'},
{lv:3,t:d.defect+' '+d.impact,r:'Missing the baseline: how the working behavior looks.'},
{lv:3,t:d.defect+' '+d.baseline,r:'Missing the impact on the user\'s workflow.'},
{lv:4,t:d.defect+' Other parts of the page work fine. '+d.impact,r:'The baseline must name the specific working behavior, not "other parts work fine".'},
{lv:4,t:d.defect+' '+d.baseline+' This is inconvenient for the user.',r:'The impact must say what the user cannot do, not just "inconvenient".'}]}
};
const x=M[key],seen=new Set([x.ok]),D=x.D.filter(o=>!seen.has(o.t)&&seen.add(o.t));
return shuffle([{t:x.ok,ok:true,r:''},...pickD(D,run.diff).map(o=>({t:o.t,ok:false,r:o.r}))]);
}
let BLD=null;
function openBuilder(id){BLD={id,d:findDef(id),trap:id.charAt(0)==='t',ans:{},opts:{},order:['type'],i:0};renderBuilder();$('#builder').hidden=false}
function closeBuilder(){$('#builder').hidden=true;BLD=null}
function recompute(){const a=BLD.ans,o=['type'];if(a.type==='skip')o.push('gate');else if(!BLD.trap&&(a.type==='bug'||a.type==='fr'))o.push('prio',...TEXTK);BLD.order=o;Object.keys(a).forEach(k=>{if(!o.includes(k))delete a[k]})}
function optsFor(key){
if(key==='type')return Object.entries(TYPES).map(([v,x])=>({v,t:x.t,s:x.d}));
if(key==='gate')return Object.entries(GATES).map(([v,t])=>({v:+v,t}));
if(key==='prio')return['P0','P1','P2'].map(v=>({v,t:v,s:PR[v].q}));
if(!BLD.opts[key])BLD.opts[key]=distractors(BLD.d,key);
return BLD.opts[key].map((o,i)=>({v:i,t:o.t}));
}
function firstOpen(){const i=BLD.order.findIndex(k=>BLD.ans[k]===undefined);return i<0?BLD.order.length:i}
function answerText(k){const v=BLD.ans[k];if(v===undefined)return'—';if(k==='type')return TYPES[v].t;if(k==='gate')return GATES[v];if(k==='prio')return v;return BLD.opts[k][v].t}
function elapsed(){return run?Math.max(0,(nowT()-run.start-run.pausedMs)/1000):0}
function renderBuilder(){
const b=BLD,key=b.order[b.i],f=FIELDS[key],done=b.order.every(k=>b.ans[k]!==undefined);
const allKeys=b.ans.type===undefined?['type','prio',...TEXTK]:b.order;
const steps=allKeys.map(k=>{const isIn=b.order.includes(k),cur=isIn&&b.order.indexOf(k)===b.i&&!b.review,dn=b.ans[k]!==undefined,lock=!isIn||(!dn&&b.order.indexOf(k)>firstOpen());return '<button class="'+(cur?'cur':dn?'done':'')+(lock?' lock':'')+'" data-fjump="'+k+'"'+(lock?' aria-disabled="true"':'')+'><i></i><span>'+(lock?IC.lock+' ':'')+FIELDS[k].l+'</span></button>'}).join('');
let body;
if(b.review){body='<div class="fcard"><span class="g">READY TO SUBMIT</span><div class="q">Review your finding</div><div class="rev">'+b.order.map(k=>'<div><span class="fl">'+FIELDS[k].l+'</span><span style="white-space:pre-line">'+esc(answerText(k))+'</span></div>').join('')+'</div></div>'}
else{const opts=optsFor(key);body='<div class="fcard"><span class="g">'+f.g+'</span><div class="q">'+f.q+'</div><div class="opts">'+opts.map((o,i)=>'<button class="opt" data-opt="'+i+'" aria-pressed="'+(b.ans[key]!==undefined&&String(b.ans[key])===String(o.v))+'"><span class="ol">'+(i+1)+'</span><span class="ot"><span>'+esc(o.t)+'</span>'+(o.s?'<small>'+esc(o.s)+'</small>':'')+'</span></button>').join('')+'</div></div>'}
$('#bSheet').innerHTML='<div class="sh-top"><div class="sheet-h"><div><span class="unl">'+IC.unlock+' Finding unlocked · '+fmtT(elapsed())+' · '+DIFFS[run.diff].t+'</span><h2 id="bTitle" style="margin-top:6px">'+esc(b.d.control||b.d.label)+'</h2></div><button class="btn sm" id="bClose">Discard</button></div><div class="steps">'+steps+'</div></div><div class="sh-body">'+body+'</div>'+
'<div class="sh-foot"><button class="btn sm" id="bBack"'+(b.i===0&&!b.review?' disabled':'')+'>← Back</button><span class="keys"><kbd>1</kbd>–<kbd>5</kbd> pick · <kbd>Enter</kbd> submit · <kbd>Esc</kbd> discard</span><button class="btn pri" id="bSubmit"'+(done?'':' disabled')+'>Submit finding</button></div>';
}
$('#builder').addEventListener('click',e=>{
const b=BLD;if(!b)return;const t=e.target;
if(t===$('#builder')||t.closest('#bClose')){closeBuilder();toast('Finding discarded. You can flag it again.');return}
const o=t.closest('[data-opt]');
if(o){sfx('pick');const key=b.order[b.i],opts=optsFor(key),v=opts[+o.dataset.opt].v;b.ans[key]=v;if(key==='type'||key==='gate')recompute();const nx=firstOpen();b.i=Math.min(nx,b.order.length-1);b.review=nx>=b.order.length;renderBuilder();return}
const j=t.closest('[data-fjump]');
if(j&&j.getAttribute('aria-disabled')!=='true'){const idx=b.order.indexOf(j.dataset.fjump);if(idx>=0){b.i=idx;b.review=false;renderBuilder()}return}
if(t.closest('#bBack')){if(b.review){b.review=false;b.i=b.order.length-1}else if(b.i>0)b.i--;renderBuilder();return}
if(t.closest('#bSubmit')&&!t.closest('#bSubmit').disabled){run.logged[b.id]={ans:{...b.ans},opts:b.opts,at:elapsed()};run.order.push(b.id);closeBuilder();renderPips();renderPane();sfx('submit');toast('Finding filed · graded at debrief','flag');return}
});

/* ---------- grading ---------- */
function typeRule(want,got){
if(want==='bug')return got==='fr'?'The control exists and reacts but gives a wrong result. That is a Bug, not a missing feature.':got==='neither'?'It does not work as intended, so it is a finding.':'No FILTER gate applies here. Report it.';
if(want==='fr')return got==='bug'?'Nothing reacts and fails; the capability is absent compared with the real app. That is a Feature request.':got==='neither'?'The real app has this capability and the clone does not. That is a finding.':'No FILTER gate applies here. Report it.';
return'';
}
function gradeRun(){
const app=APP(),d=DIFFS[run.diff],R={items:[],misses:[],traps:[],ff:run.ff,ins:{},found:0};let pts=0,max=0;
const addIns=(g,txt)=>{(R.ins[g]=R.ins[g]||[]);if(!R.ins[g].includes(txt))R.ins[g].push(txt)};
for(const id of run.list){
const x=app.defects.find(y=>y.id===id);max+=100;const L=run.logged[id];
if(!L){R.misses.push(x);addIns('HUNT Guide','#'+x.hunt.join(', #')+' · Phase '+String(Math.ceil(x.hunt[0]/10)).padStart(2,'0')+': '+x.hint);continue}
R.found++;let p=20;const rows=[];
const tOk=L.ans.type===x.kind;rows.push({k:'type',ok:tOk,you:TYPES[L.ans.type].t,want:TYPES[x.kind].t,rule:tOk?'':typeRule(x.kind,L.ans.type)});if(tOk)p+=15;
if(L.ans.prio!==undefined){const ok=L.ans.prio===x.prio;rows.push({k:'prio',ok,you:L.ans.prio,want:x.prio,rule:ok?'':x.prio+': '+PR[x.prio].q});if(ok)p+=15}
else rows.push({k:'prio',ok:false,you:'—',want:x.prio,rule:'Not filed because the finding was dismissed.'});
for(const k of TEXTK){
if(L.ans[k]!==undefined){const o=L.opts[k][L.ans[k]],w=L.opts[k].find(z=>z.ok);rows.push({k,ok:o.ok,you:o.t,want:w.t,rule:o.r});if(o.ok)p+=10}
else rows.push({k,ok:false,you:'—',want:'',rule:'Not filed because the finding was dismissed.'});
}
rows.forEach(r=>{if(!r.ok)addIns(GUIDE_OF[r.k],r.rule)});
pts+=p;R.items.push({x,rows,p,at:L.at});
}
let trapPts=0;
for(const t of app.traps){const L=run.logged[t.id];if(!L)continue;const ok=L.ans.type==='skip'&&+L.ans.gate===t.gate;trapPts+=ok?25:-15;R.traps.push({t,ok,you:L.ans.type==='skip'?GATES[L.ans.gate]:'Reported as '+TYPES[L.ans.type].t});if(!ok)addIns('WALL 04 · FILTER',t.label+': '+t.why+' (Gate '+t.gate+')')}
const g=d.guard,ffPts=run.ff*g.pen+run.jams*g.pen*2;if(run.ff)addIns('WALL 02 · DECIDE','Flag only what you have seen misbehave on screen. '+run.ff+' miss'+(run.ff>1?'es':'')+' this run.');
if(run.blind||run.jams)addIns('HUNT Guide','Reproduce before you flag: '+run.blind+' blind guess'+(run.blind===1?'':'es')+(run.jams?' and '+run.jams+' scanner jam'+(run.jams>1?'s':''):'')+'. Each jam also costs '+(g.pen*2)+' points.');
R.jams=run.jams;R.blind=run.blind;R.hits=run.hits;R.facc=run.hits+run.ff?Math.round(100*run.hits/(run.hits+run.ff)):100;R.revoked=run.revoked;
const left=Math.round(remain()),timeB=R.found===run.list.length?Math.round(left/10):0;
R.pct=Math.max(0,Math.min(100,Math.round(100*(pts-ffPts)/max)));
R.grade=R.pct>=95?'S':R.pct>=85?'A':R.pct>=70?'B':R.pct>=55?'C':'D';
R.xp=Math.max(0,Math.round((pts+Math.max(0,trapPts)-ffPts+timeB)*d.mult));R.trapPts=trapPts;R.timeB=timeB;R.used=Math.round(run.mins*60-left);
return R;
}

/* ---------- results ---------- */
let LAST=null;
function endMission(){
if(!run||run.over)return;if(run.paused)togglePause(true);run.over=true;clearInterval(tick);if(!$('#builder').hidden)closeBuilder();setFlag(false,true);
const R=gradeRun(),app=APP(),d=DIFFS[run.diff],prevXP=STORE.xp;
STORE.xp+=R.xp;STORE.runs.unshift({app:app.name,appId:app.id,task:run.task,code:run.code,title:run.title,target:run.list.length,facc:R.facc,diff:d.t,tier:run.diff,mins:run.mins,grade:R.grade,pct:R.pct,xp:R.xp,found:R.found,trapsOk:R.traps.filter(t=>t.ok).length,date:new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})});STORE.runs=STORE.runs.slice(0,300);
const qd=[];QUESTS.forEach(q=>{if(!STORE.quests.includes(q.id)&&q.prog(STORE)>=q.goal){STORE.quests.push(q.id);STORE.xp+=q.xp;qd.push(q)}});
save();LAST={R,app,d,pausedMs:run.pausedMs,pauses:run.pauses,code:run.code,title:run.title,task:run.task,list:run.list,prevXP,mins:run.mins,n:run.n,quests:qd,gain:STORE.xp-prevXP};
renderRank();renderResults();show('results');sfx('SAB'.includes(R.grade)?'win':'lose');if(qd.length)setTimeout(()=>sfx('quest'),900);animXP();
}
function animXP(){
const {prevXP,gain}=LAST,el=$('#xpNum'),bar=$('#xpFill');if(!el)return;
const a=rankOf(prevXP),b=rankOf(STORE.xp),t0=performance.now(),dur=1000;
if(bar)bar.style.width=a.pct+'%';
const step=t=>{const k=Math.min(1,(t-t0)/dur);el.textContent='+'+Math.round(gain*k);if(k<1)requestAnimationFrame(step);else{if(bar)bar.style.width=(b.i>a.i?100:b.pct)+'%';if(b.i>a.i){const ru=$('#rankUp');if(ru){ru.hidden=false;ru.textContent='RANK UP · '+b.r.t.toUpperCase()}setTimeout(()=>showRankUp(a.i,b.i),700)}}};
requestAnimationFrame(step);
}
function showRankUp(from,to){
const tier=Object.values(DIFFS).find(v=>v.unlock===to);
$('#rankup').innerHTML='<div class="sheet" style="width:min(520px,100%);text-align:center"><div class="sh-body" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px"><span class="lab" style="color:var(--flag)">Rank up · Transformation</span><div class="tf"><span class="old">'+avatar(from,90)+'</span><span class="arr">→</span><span class="new">'+avatar(to,130)+'</span></div><h2 id="ruTitle" style="font-size:28px">'+esc(tName())+' is now '+RANKS[to].t+'</h2><p class="note" style="font-size:14px">'+(tier?tier.t+' reviews are unlocked: '+tier.l[0].toLowerCase()+'. Pick it in the hub when you\'re ready.':'Maximum rank reached. You are the trainer the validators call.')+'</p><button class="btn pri" id="ruClose">Continue</button></div></div>';
$('#rankup').hidden=false;sfx('rank');
}
function openAssess(){const A=assess();if(!A)return;
const rows=Object.values(APPS).map(a=>{const rs=A.rs.filter(r=>r.appId===a.id),done=new Set(rs.map(r=>r.task)).size,av=f=>rs.length?rs.reduce((x,r)=>x+f(r),0)/rs.length:0;return '<tr><td><b>'+a.name+'</b></td><td>'+done+'/'+a.tasks.length+'</td><td>'+(rs.length?av(r=>r.found).toFixed(1)+' / '+av(r=>r.target).toFixed(1):'—')+'</td><td>'+(rs.length?Math.round(av(r=>r.found/r.target)*100)+'%':'—')+'</td><td>'+(rs.length?Math.round(av(r=>r.pct))+'%':'—')+'</td></tr>'}).join('');
const trs=Object.values(APPS).map(a=>a.tasks.map(t=>{const s=taskStat(taskKey(a,t));return s?'<tr><td class="mono">'+t.code+'</td><td>'+t.t+'</td><td>'+s.att+'</td><td>'+s.found+'/'+s.target+'</td><td><b class="g'+s.best+'">'+s.best+'</b> · '+s.pct+'%</td></tr>':''}).join('')).join('');
$('#assessM').innerHTML='<div class="sheet" style="width:min(900px,100%)"><div class="sh-top"><div class="sheet-h"><div><span class="lab">Performance assessment</span><h2 style="margin-top:6px">'+esc(tName())+' · '+A.level+' · '+A.score+'/100</h2></div><button class="btn sm" id="assessClose">Close</button></div></div><div class="sh-body" style="display:flex;flex-direction:column;gap:14px">'+
'<div class="kpis"><div class="kpi"><b>'+A.tasks+'/'+TOTAL_TASKS+'</b><span>tasks completed</span></div><div class="kpi"><b>'+A.avgFound.toFixed(1)+'/'+A.avgTarget.toFixed(1)+'</b><span>avg findings per task</span></div><div class="kpi"><b>'+A.fr+'%</b><span>find rate</span></div><div class="kpi"><b>'+A.acc+'%</b><span>rubric accuracy</span></div><div class="kpi"><b>'+A.fa+'%</b><span>flag accuracy</span></div></div>'+
'<p class="note">Score = 50% find rate + 35% rubric accuracy + 15% flag accuracy, averaged over '+A.n+' graded task run'+(A.n===1?'':'s')+'. 90+ Validator-ready · 75+ Strong · 60+ Developing · below 60 Needs practice.</p>'+
'<span class="lab">By app</span><div class="awrap"><table class="atable"><tr><th>App</th><th>Tasks done</th><th>Avg findings</th><th>Find rate</th><th>Accuracy</th></tr>'+rows+'</table></div>'+
'<span class="lab">By task · best run</span><div class="awrap"><table class="atable"><tr><th>Task</th><th>Title</th><th>Runs</th><th>Found</th><th>Best</th></tr>'+trs+'</table></div></div></div>';
$('#assessM').hidden=false}
function npcReact(g){return g==='S'?'Validator-ready, '+tName()+'. I wouldn\'t change a word.':g==='A'?'Clean work, '+tName()+'. One or two details from perfect.':g==='B'?'Solid run. Tighten the wording and you\'ll hit an A.':g==='C'?'You found things, but the rubric slipped. Check the walls I flagged below.':'Rough shift. Read the misses below, then run it again. Everyone starts here.'}
function renderResults(){
const {R,app,d}=LAST,b=rankOf(STORE.xp);
const frow=r=>'<div class="frow"><span class="ic '+(r.ok?'y':'n')+'">'+(r.ok?'✓':'✗')+'</span><span class="fl">'+FIELDS[r.k].l+'</span><span class="why">'+(r.ok?'<span style="white-space:pre-line">'+esc(r.you)+'</span>':'<span><small>You chose</small><br><span style="white-space:pre-line">'+esc(r.you)+'</span></span>'+(r.want?'<span><small>Correct</small><br><span style="white-space:pre-line">'+esc(r.want)+'</span></span>':'')+'<span class="rule">'+esc(r.rule)+'</span>')+'</span></div>';
const head=R.found===LAST.list.length?'Mission complete':R.found?'Mission partial':'Mission failed';
const tabs=[['debrief','Debrief'],['found','Findings · '+R.items.length],['missed','Missed · '+R.misses.length],['traps','Traps · '+R.traps.length]];
$('#results').innerHTML='<div class="rs">'+
'<section class="rs-hero"><div class="grade g'+R.grade+'">'+R.grade+'</div><div class="rs-t"><span class="lab">'+app.name+' · '+LAST.code+' · '+esc(LAST.title)+' · '+d.t+' · '+LAST.mins+' min</span><h2>'+head+' · '+R.pct+'% accuracy</h2>'+
'<div class="xpgain"><b id="xpNum">+0</b><span class="lab">XP</span><div class="xpbar"><i id="xpFill"></i></div><span class="rank-x">'+b.r.t+' · tier ×'+d.mult+(LAST.quests.length?' · quests +'+LAST.quests.reduce((a,q)=>a+q.xp,0):'')+'</span><span class="rankup" id="rankUp" hidden></span></div>'+
'<div class="kpis"><div class="kpi"><b>'+R.found+'/'+LAST.list.length+'</b><span>findings found</span></div><div class="kpi"><b>'+fmtT(R.used)+'</b><span>time used of '+LAST.mins+':00'+(LAST.pauses?' · paused '+fmtT(LAST.pausedMs/1000):'')+'</span></div><div class="kpi"><b>'+R.facc+'%</b><span>flag accuracy · '+R.ff+' miss'+(R.ff===1?'':'es')+'</span></div><div class="kpi"><b>'+R.jams+(R.revoked?' · 🔒':'')+'</b><span>scanner jams</span></div><div class="kpi"><b>'+R.traps.filter(t=>t.ok).length+'/'+R.traps.length+'</b><span>traps handled</span></div></div></div></section>'+
'<div class="npcsay">'+npcArt(48)+'<div><span class="who">Vera · Lead Validator</span><p>'+esc((R.jams||R.revoked?'I saw your scanner jam. Prove it on screen first, then flag. ':'')+npcReact(R.grade))+'</p></div></div>'+
(()=>{const A=assess();return A?'<div class="fd"><div class="fd-h"><b>Assessment · '+A.level+' · '+A.score+'</b><span class="pp k">'+A.tasks+'/'+TOTAL_TASKS+' tasks</span></div><span class="note">This task: '+R.found+' of '+LAST.list.length+' findings. Your average across '+A.n+' task run'+(A.n===1?'':'s')+': '+A.avgFound.toFixed(1)+' of '+A.avgTarget.toFixed(1)+' findings per task ('+A.fr+'% find rate), '+A.acc+'% rubric accuracy, '+A.fa+'% flag accuracy.</span></div>':''})()+
(LAST.quests.length?'<div class="fd"><div class="fd-h"><b>Quest complete</b><span class="pp k" style="color:var(--flag)">+'+LAST.quests.reduce((a,q)=>a+q.xp,0)+' XP</span></div>'+LAST.quests.map(q=>'<span class="note">✓ '+esc(q.t)+' · '+esc(q.d)+'</span>').join('')+'</div>':'')+
'<div class="tabs rs-tabs" role="tablist">'+tabs.map(([k,l],i)=>'<button role="tab" data-rtab="'+k+'" aria-selected="'+(i===0)+'">'+l+'</button>').join('')+'</div>'+
'<div class="rs-pane" data-rpane="debrief">'+
'<section class="coach"><div class="coach-h"><div><span class="lab" style="color:var(--acc)">AI coach · Gemini</span><h3 style="margin-top:6px">Personal debrief, mapped to your guides</h3></div><span class="dstats"><button class="btn" id="copyRep">Copy report</button><button class="btn pri" id="coachBtn">Open coach</button></span></div><p class="note" id="coachNote">Open coach copies your mission report. Paste it into the chat for a graded debrief.</p><textarea id="repTxt" readonly hidden aria-label="Mission report"></textarea><div id="coachFrame"></div></section>'+
(Object.keys(R.ins).length?'<div class="ins">'+Object.entries(R.ins).map(([g,l])=>'<div class="insc"><b>'+g+'</b><ul>'+l.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>').join('')+'</div>':'<div class="fd"><b>Clean run.</b><span class="note">No rule misses. Try a longer shift or the next tier.</span></div>')+'</div>'+
'<div class="rs-pane" data-rpane="found" hidden>'+(R.items.length?R.items.map(it=>'<div class="fd"><div class="fd-h"><b>'+esc(it.x.control)+'</b><span class="dstats"><span class="pp k">'+TYPES[it.x.kind].t+'</span><span class="pp '+it.x.prio+'">'+it.x.prio+'</span><span class="pp k">'+it.p+'/100</span><span class="pp k">HUNT #'+it.x.hunt[0]+'</span><span class="pp k">'+fmtT(it.at)+'</span></span></div>'+it.rows.map(frow).join('')+'</div>').join(''):'<p class="note">No findings submitted.</p>')+'</div>'+
'<div class="rs-pane" data-rpane="missed" hidden>'+(R.misses.length?R.misses.map(x=>'<div class="fd"><div class="fd-h"><b>'+esc(x.page+': '+x.control+' '+(x.kind==='bug'?x.fail:'should '+x.should))+'</b><span class="dstats"><span class="pp k">'+TYPES[x.kind].t+'</span><span class="pp '+x.prio+'">'+x.prio+'</span></span></div><span class="note">'+esc(x.hint)+' · HUNT #'+x.hunt.join(', #')+' · Phase '+String(Math.ceil(x.hunt[0]/10)).padStart(2,'0')+' '+PHASES[Math.ceil(x.hunt[0]/10)-1]+'</span></div>').join(''):'<p class="note">Nothing missed. Every hidden finding was filed.</p>')+'</div>'+
'<div class="rs-pane" data-rpane="traps" hidden>'+(R.traps.length?R.traps.map(t=>'<div class="fd"><div class="fd-h"><b>'+esc(t.t.label)+'</b><span class="pp k" style="color:'+(t.ok?'var(--ok)':'var(--bad)')+'">'+(t.ok?'Handled':'Missed the gate')+'</span></div><span class="note">You: '+esc(t.you)+'. '+esc(t.t.why)+' Correct: Don\'t report, Gate '+t.t.gate+'.</span></div>').join(''):'<p class="note">You did not flag any FILTER traps. Each app hides 4: unavailable links, external sites, prerequisites and known limitations.</p>')+'</div>'+
'<div class="rs-actions"><span class="note">'+(STORE.queue.length?STORE.queue.length+' claimed task'+(STORE.queue.length>1?'s':'')+' left in your queue.':'Replay this task for a new mix, or claim more tasks in the hub.')+'</span><span class="dstats"><button class="btn" id="againBtn">Replay '+LAST.code+'</button><button class="btn'+(STORE.queue.length?'':' pri')+'" id="lobbyBtn">Back to hub</button>'+(STORE.queue.length?'<button class="btn pri" id="nextBtn">Next claimed · '+keyTask(STORE.queue[0]).t.code+'</button>':'')+'</span></div></div>';
wireCoach();
}
document.addEventListener('click',e=>{
const rt=e.target.closest('[data-rtab]');if(rt){const k=rt.dataset.rtab;document.querySelectorAll('[data-rtab]').forEach(b=>b.setAttribute('aria-selected',b===rt));document.querySelectorAll('[data-rpane]').forEach(p=>p.hidden=p.dataset.rpane!==k);return}
if(e.target.closest('#againBtn')){pickApp=LAST.app.id;pickTask=LAST.code;run=null;openBrief();return}
if(e.target.closest('#lobbyBtn')){run=null;renderLobby();show('lobby');return}
});
const COACH_URL='https://paymegpt.com/agents/99384876/embed';
function runData(){
const {R,app,d}=LAST;
return JSON.stringify({trainer:tName(),rank:rankOf(STORE.xp).r.t,app:app.name+' ('+app.cat+')',task:LAST.code+' · '+LAST.title,assessment:(()=>{const A=assess();return A&&{level:A.level,score:A.score,avgFindingsPerTask:+A.avgFound.toFixed(1),avgTargetPerTask:+A.avgTarget.toFixed(1),findRatePct:A.fr,rubricAccuracyPct:A.acc,tasksCompleted:A.tasks}})(),tier:d.t,minutesAllowed:LAST.mins,secondsUsed:R.used,secondsPaused:Math.round(LAST.pausedMs/1000),targetFindings:LAST.list.length,found:R.found,rubricAccuracyPct:R.pct,grade:R.grade,falseFlags:R.ff,flagAccuracyPct:R.facc,blindGuesses:R.blind,scannerJams:R.jams,scannerLocked:R.revoked,
findings:R.items.map(it=>({finding:it.x.page+': '+it.x.control,truth:{type:it.x.kind,priority:it.x.prio,hunt:it.x.hunt},points:it.p+'/100',fieldsMissed:it.rows.filter(r=>!r.ok).map(r=>({field:FIELDS[r.k].l,rule:r.rule}))})),
missed:R.misses.map(x=>({finding:x.page+': '+x.control,type:x.kind,priority:x.prio,hunt:x.hunt})),
traps:R.traps.map(t=>({trap:t.t.label,handledCorrectly:t.ok,correctGate:t.t.gate}))});
}
function reportText(){return 'MISSION REPORT\n'+runData()}
async function copyReport(note){const t=reportText();try{await navigator.clipboard.writeText(t);note.textContent='Report copied. Paste it into the coach chat.';toast('Mission report copied');return true}catch(e){const ta=$('#repTxt');ta.hidden=false;ta.value=t;ta.focus();ta.select();note.textContent='Copy the selected report, then paste it into the coach chat.';return false}}
function wireCoach(){
const note=$('#coachNote');
$('#copyRep').onclick=()=>copyReport(note);
$('#coachBtn').onclick=()=>{copyReport(note);const f=$('#coachFrame');if(!f.firstChild)f.innerHTML='<iframe src="'+COACH_URL+'" title="AI Trainer Defense Coach" style="width:100%;height:600px;border:0;border-radius:12px;background:#fff"></iframe>';f.scrollIntoView({behavior:'smooth',block:'start'})};
}
syncAudioBtns();renderRank();renderTitle();
})();

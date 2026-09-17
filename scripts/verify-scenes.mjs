import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try {
 await page.goto('http://localhost:5173');
 await page.locator('.loading-screen').waitFor({state:'hidden',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('canvas')?.width>300);
 assert.equal(await page.getByRole('button',{name:'Location',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Enquire now',exact:true}).count(),0);
 const canvas=await page.locator('canvas').elementHandle();
 const nav=name=>page.getByRole('navigation').getByRole('button',{name,exact:true});
 const settled=()=>page.waitForFunction(()=>document.querySelector('main').dataset.transitioning==='false'&&Number(getComputedStyle(document.querySelector('main')).getPropertyValue('--scene-opacity'))>.99);
 for(const name of ['Home','Amenities','Apartment','Home']) {
  await nav(name).click();
  await settled();
  assert.ok(await page.evaluate(original=>original===document.querySelector('canvas'),canvas),'Navigation recreated the canvas');
  await page.screenshot({path:`artifacts/smooth-${name.toLowerCase()}.png`});
 }
 // Interrupt both the outgoing and incoming halves of a scene transition.
 for(const name of ['Apartment','Home','Amenities','Apartment']) {await nav(name).click();await page.waitForTimeout(140);}
 await settled();
 await page.getByRole('button',{name:'3 BHK',exact:true}).click();
 await page.getByText('1,680',{exact:false}).waitFor();
 await nav('Amenities').click();await settled();
 await page.getByRole('button',{name:'Next amenity'}).click();
 await page.getByRole('button',{name:'Next amenity'}).click();
 await page.waitForTimeout(1300);
 await nav('Window View').click();await settled();
 await page.getByRole('button',{name:'14th floor night',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.loading-view'));
 await page.setViewportSize({width:390,height:844});
 await nav('Apartment').click();await settled();
 await page.screenshot({path:'artifacts/smooth-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await nav('Home').click();await settled();
 assert.deepEqual(errors,[]);
 console.log('PASS: persistent canvas, Home/Amenities/Apartment transitions, interrupted navigation, amenity focus, panorama return, mobile, reduced motion, and removed controls. No browser errors.');
} finally {await browser.close();}

(() => {
  'use strict';
  const KEY='__mePerformanceOptimizer', MODE='me.performance-optimizer.mode.v2';
  window.__meObserverOptimizer?.dispose?.();
  window[KEY]?.dispose?.();
  const host=typeof marinara!=='undefined'?marinara:null;
  const downstream=window.fetch, pending=new Map(), observers=[];
  const safe=new Set(['/api/tts/config','/api/app-settings/translator-defaults','/api/personal-extensions','/api/personal-extensions/policy','/api/personal-extensions/runtime/client']);
  let disposed=false, epoch=0, enabled=true;
  let options={observers:true,uiPolling:true,startup:true},controls=null;
  try{const saved=JSON.parse(localStorage.getItem('me.performance-optimizer.controls.v3')||'{}');for(const k of Object.keys(options))if(typeof saved[k]==='boolean')options[k]=saved[k];}catch{}
function installControls(options) {
  const nativeObserver=window.MutationObserver,nativeInterval=window.setInterval,nativeClear=window.clearInterval,runner=window.__marinaraRunFullPageExtension;
  const tracked=new Set(),polls=new Map(),queue=[];
  const stats={observerNotifications:0,observerDeliveries:0,pollTicks:0,pollRuns:0,initializers:0};
  let stopped=false,ticket=null;
  function externalCaller(){const caller=String(new Error().stack||'').split('\n')[3]||'';return /\/api\/personal-extensions\/[^/\s]+\/page-runtime\.js/.test(caller);}
  class ManagedObserver extends nativeObserver {
    constructor(callback){
      if(typeof callback!=='function')throw new TypeError('MutationObserver callback must be a function');
      let self;super(records=>self.deliver(records));self=this;
      this.callback=callback;this.eligible=externalCaller();this.targets=new Map();this.records=[];this.timer=null;
    }
    observe(target,config){
      super.observe(target,config);
      this.targets.set(target,(target===document||target===document.body||target===document.documentElement)&&config?.subtree===true&&config?.childList===true&&!config.attributes&&!config.characterData);
      if(this.eligible)tracked.add(this);
    }
    deliver(records){
      if(stopped||!this.eligible||!this.targets.size||[...this.targets.values()].some(x=>!x)){this.callback.call(this,records,this);return;}
      stats.observerNotifications++;this.records.push(...records);
      if(this.records.length>=2000){this.flush();return;}
      if(this.timer===null)this.timer=setTimeout(()=>{this.timer=null;this.flush();},document.hidden?1000:250);
    }
    flush(){if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}if(!this.records.length)return;const records=this.records.splice(0);stats.observerDeliveries++;this.callback.call(this,records,this);}
    takeRecords(){return this.records.splice(0).concat(super.takeRecords());}
    disconnect(){super.disconnect();if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.records.length=0;this.targets.clear();tracked.delete(this);}
  }
  function reviewedPoll(callback,delay){if(typeof callback!=='function')return false;const s=Function.prototype.toString.call(callback);return (delay===300&&callback.name==='discover'&&s.includes('inlineHistory()')&&s.includes('data-marinara-call-stage'))||(delay===900&&callback.name==='renderTick'&&s.includes('forceFineSliderSteps()')&&s.includes('ensureStockSliderSyncBindings()')&&s.includes('ensurePanelMounted()'));}
  function managedInterval(callback,delay,...args){
    if(!externalCaller()||!reviewedPoll(callback,delay))return nativeInterval.call(window,callback,delay,...args);
    const state={last:-Infinity};const id=nativeInterval.call(window,()=>{stats.pollTicks++;const time=performance.now();if(!stopped&&time-state.last<(document.hidden?10000:1500))return;state.last=time;stats.pollRuns++;callback.apply(window,args);},delay);polls.set(id,state);return id;
  }
  function managedClear(id){polls.delete(id);return nativeClear.call(window,id);}
  function invoke(job){
    const present=Array.from(document.querySelectorAll('script[data-personal-extension-full-page]')).some(s=>s.dataset.personalExtensionFullPage===job.identity?.id&&new URL(s.src,location.href).searchParams.get('hash')===job.identity?.contentHash);
    if(!present)return;
    try{stats.initializers++;runner(job.identity,job.main);}catch(error){window.dispatchEvent(new CustomEvent('marinara-personal-extension-error',{detail:{id:job.identity?.id,contentHash:job.identity?.contentHash,message:String(error.message||error)}}));}
  }
  function schedule(){if(stopped||ticket!==null||!queue.length)return;const run=()=>{ticket=null;if(stopped)return;invoke(queue.shift());schedule();};ticket=typeof window.requestIdleCallback==='function'?{type:'idle',id:window.requestIdleCallback(run,{timeout:500})}:{type:'timer',id:setTimeout(run,16)};}
  function managedRunner(identity,main){if(stopped)return runner(identity,main);queue.push({identity,main});schedule();}
  function resume(){if(document.hidden)return;for(const o of tracked){try{o.flush();}catch(error){console.error(error);}}for(const p of polls.values())p.last=-Infinity;}
  if(options.observers)window.MutationObserver=ManagedObserver;
  if(options.uiPolling){window.setInterval=managedInterval;window.clearInterval=managedClear;}
  if(options.startup&&typeof runner==='function')window.__marinaraRunFullPageExtension=managedRunner;
  if(options.observers||options.uiPolling)document.addEventListener('visibilitychange',resume);
  function dispose(){
    if(stopped)return;stopped=true;
    if(window.MutationObserver===ManagedObserver)window.MutationObserver=nativeObserver;
    if(window.setInterval===managedInterval)window.setInterval=nativeInterval;
    if(window.clearInterval===managedClear)window.clearInterval=nativeClear;
    if(window.__marinaraRunFullPageExtension===managedRunner)window.__marinaraRunFullPageExtension=runner;
    if(ticket!==null){if(ticket.type==='idle')window.cancelIdleCallback(ticket.id);else clearTimeout(ticket.id);ticket=null;}
    for(const job of queue.splice(0))invoke(job);
    for(const o of tracked){try{o.flush();}catch(error){console.error(error);}}tracked.clear();polls.clear();document.removeEventListener('visibilitychange',resume);
  }
  return {stats,dispose};
}

  try{enabled=localStorage.getItem(MODE)!=='measure';}catch{}
  const now=()=>performance.now(), limit=300;
  function session(){return {controls:{...options},mode:enabled?'optimize':'measure',startedAt:now(),requests:[],resources:[],longTasks:[],interactions:[],logical:0,upstream:0,joined:0,excluded:0};}
  let current=session();const runs=[];
  try{const raw=sessionStorage.getItem('me.performance-optimizer.runs.v2');if(raw&&raw.length<500000){const saved=JSON.parse(raw);if(Array.isArray(saved))for(const r of saved.slice(-3)){if(r&&['measure','optimize'].includes(r.mode)&&Array.isArray(r.requests)&&Array.isArray(r.resources)&&Array.isArray(r.longTasks)&&Array.isArray(r.interactions)){runs.push(r);}}}}catch{}
  function persist(){try{const snapshots=[...runs,{...current,navigation:navigation()}].slice(-3);sessionStorage.setItem('me.performance-optimizer.runs.v2',JSON.stringify(snapshots));}catch{}}
  window.addEventListener('pagehide',persist);
  function push(list,row){if(list.length===limit)list.shift();list.push(row);}
  function route(path){
    if(safe.has(path))return path;
    if(path==='/api/chats')return '/api/chats';
    if(/^\/api\/chats\/[^/]+\/messages$/.test(path))return '/api/chats/:id/messages';
    if(path.startsWith('/api/personal-extensions/'))return '/api/personal-extensions/:operation';
    if(path.startsWith('/api/'))return '/api/other';
    return 'asset';
  }
  function describe(input,init){
    const url=new URL(input instanceof Request?input.url:String(input),location.href);
    const method=String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    return {url,method,same:url.origin===location.origin};
  }
  function keyFor(input,init,d){
    // Preserve Request objects and unusual fetch options without reconstructing them.
    if(!enabled||input instanceof Request||!d.same||d.method!=='GET'||!safe.has(d.url.pathname)||d.url.search||init?.body!=null||pending.size>=128)return null;
    const supported=new Set(['method','headers','signal','credentials','cache','mode','redirect','referrerPolicy','referrer','integrity','keepalive','priority']);
    if(Object.keys(init||{}).some(k=>!supported.has(k)))return null;
    const headers=Array.from(new Headers(init?.headers).entries());
    // Keys live only while a request is pending; never include headers in reports or storage.
    return JSON.stringify([epoch,d.url.href,headers,init?.credentials??'same-origin',init?.cache??'default',init?.mode??'cors',init?.redirect??'follow',init?.referrerPolicy??'',init?.referrer??'about:client',init?.integrity??'',init?.keepalive??false,init?.priority??'auto']);
  }
  function abortError(signal){return signal?.reason||new DOMException('Aborted','AbortError');}
  function join(entry,signal){
    return new Promise((resolve,reject)=>{
      const sub={resolve,reject,signal,abort:null};
      sub.abort=()=>{
        if(!entry.subscribers.delete(sub))return;
        signal?.removeEventListener('abort',sub.abort);reject(abortError(signal));
        if(!entry.subscribers.size){if(pending.get(entry.key)===entry)pending.delete(entry.key);entry.controller.abort();}
      };
      entry.subscribers.add(sub);signal?.addEventListener('abort',sub.abort,{once:true});
      if(signal?.aborted)sub.abort();
    });
  }
  function settle(entry,response,error){
    if(pending.get(entry.key)===entry)pending.delete(entry.key);
    const subscribers=Array.from(entry.subscribers);entry.subscribers.clear();
    for(const sub of subscribers)sub.signal?.removeEventListener('abort',sub.abort);
    if(error){for(const sub of subscribers)sub.reject(error);return;}
    // Allocate all bodies before resolving any caller so every caller can read independently.
    try{const responses=subscribers.map((_,i)=>i===subscribers.length-1?response:response.clone());subscribers.forEach((sub,i)=>sub.resolve(responses[i]));}
    catch(error){for(const sub of subscribers)sub.reject(error);}
  }
  function fetchObserved(input,init){
    if(disposed)return downstream.call(window,input,init);
    let d;try{d=describe(input,init);}catch{return downstream.call(window,input,init);}
    if(!d.same||!d.url.pathname.startsWith('/api/'))return downstream.call(window,input,init);
    const record=current,start=now();record.logical++;
    if(d.method!=='GET'&&d.method!=='HEAD'){epoch++;pending.clear();}
    const finish=(status,error)=>push(record.requests,{route:route(d.url.pathname),method:d.method,ms:now()-start,status,error:!!error});
    let key;try{key=keyFor(input,init,d);}catch{key=null;}
    if(!key){record.upstream++;record.excluded++;return Promise.resolve().then(()=>downstream.call(window,input,init)).then(r=>{finish(r.status,false);return r;},e=>{finish(0,true);throw e;});}
    if(init?.signal?.aborted)return Promise.reject(abortError(init.signal));
    let entry=pending.get(key);
    if(entry&&entry.subscribers.size>=32)entry=null;
    if(entry){record.joined++;return join(entry,init?.signal).then(r=>{finish(r.status,false);return r;},e=>{finish(0,true);throw e;});}
    entry={key,controller:new AbortController(),subscribers:new Set()};pending.set(key,entry);record.upstream++;
    const result=join(entry,init?.signal);
    Promise.resolve().then(()=>downstream.call(window,input,{...init,signal:entry.controller.signal})).then(r=>settle(entry,r),e=>settle(entry,null,e));
    return result.then(r=>{finish(r.status,false);return r;},e=>{finish(0,true);throw e;});
  }
  window.fetch=fetchObserved;
  function watch(type,consume){
    try{if(!PerformanceObserver.supportedEntryTypes.includes(type))return;const o=new PerformanceObserver(list=>{if(!disposed)for(const e of list.getEntries())consume(e);});o.observe(type==='event'?{type,buffered:true,durationThreshold:40}:{type,buffered:true});observers.push(o);}catch{}
  }
  watch('resource',e=>{try{const url=new URL(e.name);if(url.origin!==location.origin)return;push(current.resources,{route:route(url.pathname),start:e.startTime,ms:e.duration,ttfbMs:Math.max(0,e.responseStart-e.requestStart),downloadMs:Math.max(0,e.responseEnd-e.responseStart),bytes:e.transferSize});}catch{}});
  watch('longtask',e=>push(current.longTasks,{start:e.startTime,ms:e.duration}));
  watch('event',e=>push(current.interactions,{event:e.name,ms:e.duration,inputDelayMs:e.processingStart-e.startTime,processingMs:e.processingEnd-e.processingStart}));
  function navigation(){const e=performance.getEntriesByType('navigation')[0];return e?{ttfbMs:Math.max(0,e.responseStart-e.requestStart),downloadMs:e.responseEnd-e.responseStart,domContentLoadedMs:e.domContentLoadedEventEnd,loadMs:e.loadEventEnd}:null;}
  function summary(run){
    const groups={};for(const r of run.requests){const k=r.method+' '+r.route;const g=groups[k]||(groups[k]={count:0,errors:0,values:[]});g.count++;if(r.error||r.status>=400)g.errors++;g.values.push(r.ms);}
    for(const g of Object.values(groups)){g.values.sort((a,b)=>a-b);g.medianMs=g.values[Math.floor(g.values.length/2)]||0;g.p95Ms=g.values[Math.max(0,Math.ceil(g.values.length*.95)-1)]||0;delete g.values;}
    return {mode:run.mode,logical:run.logical,upstream:run.upstream,joined:run.joined,longTaskCount:run.longTasks.length,longTaskMs:run.longTasks.reduce((n,e)=>n+e.ms,0),routes:groups};
  }
  function report(){return {version:'3.0.1',controls:{options:{...options},stats:controls?{...controls.stats}:null},sourceCommit:'c56501495a8baf76c258e76534c8728a9b7859bb',capturedFromMs:current.startedAt,navigation:navigation(),runs:[...runs,current],summaries:[...runs,current].map(summary),limitations:['Fetch capture begins after this extension loads. Buffered resources may precede it.','A/B runs must perform the same actions; server/network noise is not controlled.','No complete first-boot or production speed improvement is established.'],capabilities:{resource:globalThis.PerformanceObserver?.supportedEntryTypes?.includes('resource')||false,longtask:globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')||false,event:globalThis.PerformanceObserver?.supportedEntryTypes?.includes('event')||false}};}
  function updateControls(){if(controls){current.controlStats={...controls.stats};controls.dispose();controls=null;}if(enabled&&!disposed&&Object.values(options).some(Boolean))controls=installControls(options);}
  function configure(next){if(!next||typeof next!=='object')throw Error('Expected controls object');for(const [k,v] of Object.entries(next)){if(!(k in options)||typeof v!=='boolean')throw Error('Unknown control or non-boolean value');}for(const k of Object.keys(next))options[k]=next[k];try{localStorage.setItem('me.performance-optimizer.controls.v3',JSON.stringify(options));}catch{}updateControls();current.controls={...options};}
  function setMode(mode){if(mode!=='measure'&&mode!=='optimize')throw Error('Use measure or optimize');runs.push({...current,navigation:navigation()});if(runs.length>3)runs.shift();enabled=mode==='optimize';epoch++;pending.clear();try{localStorage.setItem(MODE,mode);}catch{}updateControls();current=session();persist();}
  function download(){const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ME-performance-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const hotkey=e=>{if(e.altKey&&e.shiftKey&&e.code==='KeyP'){e.preventDefault();download();}};
  document.addEventListener('keydown',hotkey);
  function dispose(){if(disposed)return;disposed=true;controls?.dispose();controls=null;if(window.fetch===fetchObserved)window.fetch=downstream;for(const o of observers)o.disconnect();document.removeEventListener('keydown',hotkey);window.removeEventListener('pagehide',persist);pending.clear();if(window[KEY]?.dispose===dispose)delete window[KEY];}
  window[KEY]={setMode,configure,report,download,dispose};updateControls();host?.onCleanup?.(dispose);
})();

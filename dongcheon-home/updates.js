export function setupUpdates({baseURL,revision,canRefresh,beforeReload,reload,notify}){
 let busy=false,stopped=false,pending=null;
 const button=document.querySelector('#refresh-home');
 async function refresh(automatic=false,expected=null){
  if(busy||stopped)return false;
  if(!canRefresh()){if(!automatic)notify('입력이나 드래그를 마친 뒤 새로고침해주세요.');return false;}
  busy=true;button.disabled=true;button.textContent='불러오는 중';
  try{const next=await beforeReload(expected);if(stopped)return false;if(!canRefresh())throw new Error('입력이나 드래그를 마친 뒤 새로고침해주세요.');stopped=true;clearInterval(timer);clearInterval(deferred);reload(next);return true;}
  catch(error){if(automatic)pending=null;else notify(error.message||'새로고침하지 못했습니다. 연결을 확인해주세요.');return false;}
  finally{busy=false;if(!stopped){button.disabled=false;button.textContent='새로고침';}}
 }
 async function check(){
  if(busy||stopped||document.hidden)return;
  try{const url=new URL('release.json',baseURL);url.searchParams.set('fresh',String(Date.now()));const response=await fetch(url,{cache:'no-store'});if(!response.ok)return;const latest=await response.json();if(latest.version!==1||!/^[a-f0-9]{64}$/.test(latest.revision)||latest.revision===revision)return;pending=latest.revision;await refresh(true,pending);}
  catch{/* Keep the current usable view during network/deployment failures. */}
 }
 button.onclick=()=>refresh();
 const timer=setInterval(check,60000),deferred=setInterval(()=>{if(pending&&!document.hidden)refresh(true,pending);},1000);
 window.addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 return {check,stop(){stopped=true;clearInterval(timer);clearInterval(deferred);}};
}

import {deriveKey, decryptText, encryptText, fromBase64, iterations} from './crypto.js?v=f7b62961ec91';
import {setupAppInstall} from './install.js?v=f7b62961ec91';
import {loadDeviceAuth,saveDeviceAuth,forgetDeviceAuth} from './device-auth.js?v=f7b62961ec91';
import {setupUpdates} from './updates.js?v=f7b62961ec91';
const form = document.querySelector('#unlock-form');
const input = document.querySelector('#password');
const status = document.querySelector('#status');
const submit = document.querySelector('#submit');
const baseURL = new URL('./', location.href);
const appInstall=setupAppInstall(baseURL);
let busy=false;
async function readPayload(){const url=new URL('home.encrypted.json',baseURL);url.searchParams.set('fresh',String(Date.now()));const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('공간 데이터를 불러오지 못했습니다. 연결을 확인해주세요.');const text=await response.text(),envelope=JSON.parse(text);if(envelope.version!==1||envelope.iterations!==iterations||fromBase64(envelope.salt).length!==24)throw new Error('공간 데이터 형식이 올바르지 않습니다.');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return {envelope,revision:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};}
function validateBundle(bundle){for(const name of ['html','css','app','model','settings','photo','tvPhoto','sunlight','noteTools','joystick','layoutTools'])if(typeof bundle[name]!=='string')throw new Error('공간 파일이 불완전합니다.');}
document.querySelector('#show-password').onclick = event => {
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  event.currentTarget.textContent = visible ? '숨기기' : '보기';
  event.currentTarget.setAttribute('aria-pressed', String(visible));
};
async function unlock(savedAuth){
  if(busy)return;busy=true;
  submit.disabled = true;
  status.textContent=savedAuth?'인증한 기기로 입장하고 있어요…':'초대 비밀번호를 확인하고 있어요…';
  let unlocked = false;
  try {
    if (!crypto.subtle) throw new Error('HTTPS 환경에서 다시 열어주세요.');
    const {envelope,revision}=await readPayload();
    if(savedAuth&&(savedAuth.salt!==envelope.salt||savedAuth.iterations!==envelope.iterations||savedAuth.key?.extractable!==false))throw Object.assign(new Error('저장된 기기 인증으로 입장할 수 없습니다. 비밀번호를 다시 입력해주세요.'),{deviceAuthInvalid:true});
    const key=savedAuth?savedAuth.key:await deriveKey(input.value,fromBase64(envelope.salt));
    let bundle;
    try { bundle = JSON.parse(await decryptText(envelope, key)); }
    catch { throw Object.assign(new Error('비밀번호가 맞지 않거나 데이터가 손상되었습니다. 다시 확인해주세요.'),{deviceAuthInvalid:!!savedAuth}); }
    validateBundle(bundle);
    let remembered=!!savedAuth;
    if(!remembered)try{await saveDeviceAuth(baseURL.href,{key,salt:envelope.salt,iterations:envelope.iterations});remembered=true;}catch{/* Successful entry remains usable if browser storage is unavailable. */}
    let refreshHooks=null;
    const settingsURL = URL.createObjectURL(new Blob([bundle.settings], {type:'text/javascript'}));
    const model = bundle.model.replace("'./scene-settings.js'", JSON.stringify(settingsURL));
    const modelURL = URL.createObjectURL(new Blob([model], {type:'text/javascript'}));
    const sunlight=bundle.sunlight.replace("'./assets/suncalc.js'",JSON.stringify(new URL('assets/suncalc.js',baseURL).href));
    const sunlightURL=URL.createObjectURL(new Blob([sunlight],{type:'text/javascript'}));
    const noteToolsURL=URL.createObjectURL(new Blob([bundle.noteTools],{type:'text/javascript'}));
    const joystickURL=URL.createObjectURL(new Blob([bundle.joystick],{type:'text/javascript'}));
    const layoutToolsURL=URL.createObjectURL(new Blob([bundle.layoutTools],{type:'text/javascript'}));
    const tvPhotoURL=URL.createObjectURL(new Blob([fromBase64(bundle.tvPhoto)],{type:'image/jpeg'}));
    const app = bundle.app.replace("'./model.js'", JSON.stringify(modelURL))
      .replace("'./sunlight.js'", JSON.stringify(sunlightURL))
      .replace("'./notes.js'", JSON.stringify(noteToolsURL))
      .replace("'./joystick.js'", JSON.stringify(joystickURL))
      .replace("'./layout-approval.js'", JSON.stringify(layoutToolsURL))
      .replace("'./assets/frame-photo.jpg'", JSON.stringify(tvPhotoURL))
      .replace("'./assets/OrbitControls.js'", JSON.stringify(new URL('assets/OrbitControls.js',baseURL).href))
      .replace("'./assets/RoundedBoxGeometry.js'", JSON.stringify(new URL('assets/RoundedBoxGeometry.js',baseURL).href))
      .replace("'./assets/realism.js'", JSON.stringify(new URL('assets/realism.js',baseURL).href));
    const appURL = URL.createObjectURL(new Blob([app], {type:'text/javascript'}));
    const photoURL = URL.createObjectURL(new Blob([fromBase64(bundle.photo)], {type:'image/jpeg'}));
    const storageKey = 'private-home-layout-v1';
    const connectionKey='private-home-memo-connection-v1',connectionAAD=new TextEncoder().encode('home-memo-connection-v1');
    const approvalKey='private-home-layout-approval-v1',approvalAAD=new TextEncoder().encode('home-layout-approval-state-v1');
    async function storedValue(name,aad){const saved=localStorage.getItem(name);if(!saved)return null;const data=JSON.parse(saved);try{return await decryptText(data,key,aad);}catch(error){for(const raw of bundle.previousLayoutKeys||[]){const previous=await crypto.subtle.importKey('raw',fromBase64(raw),{name:'AES-GCM'},false,['decrypt']);let value;try{value=await decryptText(data,previous,aad);}catch{continue;}localStorage.setItem(name,JSON.stringify(await encryptText(value,key,aad)));return value;}throw error;}}
    Object.defineProperty(window, '__homeVault', {value: {
      async load() {
        const saved=localStorage.getItem(storageKey);if(!saved)return null;
        const data=JSON.parse(saved);
        try{return await decryptText(data,key);}catch(error){
          for(const raw of bundle.previousLayoutKeys||[]){
            const previous=await crypto.subtle.importKey('raw',fromBase64(raw),{name:'AES-GCM'},false,['decrypt']);
            let value;
            try{value=await decryptText(data,previous);}catch{continue;}
            localStorage.setItem(storageKey,JSON.stringify(await encryptText(value,key)));
            return value;
          }
          throw error;
        }
      },
      async save(value) { localStorage.setItem(storageKey, JSON.stringify(await encryptText(value,key))); },
      layoutEndpoint:bundle.layoutEndpoint||null,
      loadApprovalState(){return storedValue(approvalKey,approvalAAD);},
      saveApprovalState(value){return encryptText(value,key,approvalAAD).then(encrypted=>localStorage.setItem(approvalKey,JSON.stringify(encrypted)));},
      async layoutRpc(path,payload){
        if(!bundle.layoutEndpoint||!['pair','read','initialize','propose','approve','reject'].includes(path))throw new Error('가구 공유 연결을 준비하고 있습니다. 수정안은 이 기기에 저장됩니다.');
        const aad=direction=>new TextEncoder().encode(`home-layout/${path}/${direction}-v1`),encrypted=await encryptText(JSON.stringify(payload),key,aad('request')),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
        try{const response=await fetch(new URL(path,bundle.layoutEndpoint),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(encrypted),signal:controller.signal});if(!response.ok)throw Object.assign(new Error(response.status===403?(['approve','reject','initialize'].includes(path)?'이 작업은 승인자 전용입니다.':'가구 공유 기기 연결 코드를 확인해주세요.'):response.status===409?'확정 배치가 바뀌었습니다. 수정안을 다시 검토해주세요.':'공유 요청을 완료하지 못했습니다. 수정안은 보존됩니다.'),{status:response.status});return JSON.parse(await decryptText(await response.json(),key,aad('response')));}
        catch(error){if(error.status)throw error;throw new Error('집 PC의 가구 공유 연결을 기다리고 있습니다. 수정안은 이 기기에 저장됩니다.');}finally{clearTimeout(timer);}
      },
      loadMemoConnection(){return storedValue(connectionKey,connectionAAD);},
      saveMemoConnection(value){return encryptText(value,key,connectionAAD).then(encrypted=>localStorage.setItem(connectionKey,JSON.stringify(encrypted)));},
      async memoRpc(path,payload){
        if(!bundle.memoEndpoint||!['pair','submit','status'].includes(path))throw new Error('메모 자동 연결을 준비하고 있습니다.');
        const aad=direction=>new TextEncoder().encode(`home-memos/${path}/${direction}-v1`),encrypted=await encryptText(JSON.stringify(payload),key,aad('request'));
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch(new URL(path,bundle.memoEndpoint),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(encrypted),signal:controller.signal});}catch{throw new Error('집 PC의 메모 수신 연결을 기다리고 있습니다. 메모는 이 기기에 저장돼요.');}finally{clearTimeout(timer);}
        if(!response.ok)throw Object.assign(new Error(response.status===403?'작성 기기 연결 코드를 확인해주세요.':'연결을 기다리고 있습니다. 메모는 이 기기에 저장됐어요.'),{status:response.status});
        return JSON.parse(await decryptText(await response.json(),key,aad('response')));
      },
      ready(hooks){refreshHooks=hooks;}
    }, configurable:false});
    let html = bundle.html.replace('<link rel="stylesheet" href="./style.css">', `<style>${bundle.css}</style>`)
      .replace('"./assets/three.module.js"', JSON.stringify(new URL('assets/three.module.js',baseURL).href))
      .replace('src="./assets/floorplan.jpg"', `src="${photoURL}"`)
      .replace('<script type="module" src="./app.js"></script>', `<script type="module" src="${appURL}"></script>`)
      .replace('<button id="save" class="primary">배치 저장</button>', '<div class="home-actions"><a id="install-app" href="#install-dialog" role="button">앱 받기</a><button id="refresh-home" type="button" title="최신 업데이트 불러오기">새로고침</button><button id="lock-home" title="기기 인증 지우고 잠그기">잠금</button><button id="save" class="primary">배치 저장</button></div>')
      .replace('</body>',`${appInstall.html}</body>`)
      .replace('<meta charset="UTF-8">', `<meta charset="UTF-8"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#28564b"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="욱봉 신혼집"><link rel="manifest" href="${new URL('manifest.webmanifest',baseURL).href}"><link rel="apple-touch-icon" href="${new URL('app-icons/apple-touch-icon.png',baseURL).href}"><link rel="stylesheet" href="${new URL('install.css?v=f7b62961ec91',baseURL).href}">`);
    input.value = '';
    unlocked = true;
    document.open(); document.write(html); document.close();
    appInstall.mount();
    const notify=message=>{if(refreshHooks?.notify)refreshHooks.notify(message);};
    const updates=setupUpdates({baseURL,revision,canRefresh:()=>!!refreshHooks&&refreshHooks.canRefresh(),notify,
      async beforeReload(expected){
        if(!remembered){await saveDeviceAuth(baseURL.href,{key,salt:envelope.salt,iterations:envelope.iterations});remembered=true;}
        const latest=await readPayload();if(expected&&expected!==latest.revision)throw new Error('업데이트 배포 중입니다. 잠시 후 다시 시도해주세요.');
        let expired=false,decoded;try{decoded=await decryptText(latest.envelope,key);}catch{expired=true;}if(!expired)validateBundle(JSON.parse(decoded));
        if(!refreshHooks.canRefresh())throw new Error('입력이나 드래그를 마친 뒤 새로고침해주세요.');
        await refreshHooks.save();
        if(expired)await forgetDeviceAuth(baseURL.href);
        return {revision:latest.revision,expired};
      },
      reload(next){const url=new URL(baseURL);url.searchParams.set('updated',next.revision.slice(0,16));if(next.expired)url.searchParams.set('auth','required');location.replace(url.href);}
    });
    document.querySelector('#lock-home').onclick=async()=>{updates.stop();try{if(refreshHooks)await refreshHooks.save();await forgetDeviceAuth(baseURL.href);location.replace(baseURL.href);}catch{notify('잠그지 못했습니다. 저장 공간을 확인해주세요.');}};
    if(!remembered){const timer=setInterval(()=>{if(refreshHooks){clearInterval(timer);notify('이 브라우저에서는 기기 인증을 저장하지 못했습니다.');}},100);}

  } catch (error) {
    if(savedAuth&&error.deviceAuthInvalid){try{await forgetDeviceAuth(baseURL.href);}catch{}status.textContent='저장된 인증으로 입장하지 못했습니다. 비밀번호를 다시 입력해주세요.';}else status.textContent=error.message||'열지 못했습니다. 네트워크 연결을 확인해주세요.';
  } finally {
    busy=false;if(!unlocked){submit.disabled=false;input.focus();document.documentElement.dataset.authReady='true';}
  }
}
form.addEventListener('submit',event=>{event.preventDefault();return unlock();});
submit.disabled=true;
try{const saved=await loadDeviceAuth(baseURL.href);if(saved)await unlock(saved);}catch{status.textContent='기기 인증을 확인하지 못했습니다. 비밀번호로 입장해주세요.';}
if(!document.querySelector('#placed-items')){submit.disabled=false;document.documentElement.dataset.authReady='true';}

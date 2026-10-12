import {deriveKey, decryptText, encryptText, fromBase64, iterations} from './crypto.js';
import {setupAppInstall} from './install.js';
const form = document.querySelector('#unlock-form');
const input = document.querySelector('#password');
const status = document.querySelector('#status');
const submit = document.querySelector('#submit');
const baseURL = new URL('./', location.href);
const mountInstall=setupAppInstall(baseURL);
document.querySelector('#show-password').onclick = event => {
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  event.currentTarget.textContent = visible ? '숨기기' : '보기';
  event.currentTarget.setAttribute('aria-pressed', String(visible));
};
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = '초대 비밀번호를 확인하고 있어요…';
  let unlocked = false;
  try {
    if (!crypto.subtle) throw new Error('HTTPS 환경에서 다시 열어주세요.');
    const payloadURL=new URL('home.encrypted.json',baseURL);payloadURL.searchParams.set('fresh',String(Date.now()));
    const response = await fetch(payloadURL, {cache:'no-store'});
    if (!response.ok) throw new Error('공간 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    const envelope = await response.json();
    if (envelope.version !== 1 || envelope.iterations !== iterations || fromBase64(envelope.salt).length !== 24) throw new Error('공간 데이터 형식이 올바르지 않습니다.');
    const key = await deriveKey(input.value, fromBase64(envelope.salt));
    let bundle;
    try { bundle = JSON.parse(await decryptText(envelope, key)); }
    catch { throw new Error('비밀번호가 맞지 않거나 데이터가 손상되었습니다. 다시 확인해주세요.'); }
    for (const name of ['html','css','app','model','settings','photo','sunlight','noteTools','joystick']) if (typeof bundle[name] !== 'string') throw new Error('공간 파일이 불완전합니다.');
    const settingsURL = URL.createObjectURL(new Blob([bundle.settings], {type:'text/javascript'}));
    const model = bundle.model.replace("'./scene-settings.js'", JSON.stringify(settingsURL));
    const modelURL = URL.createObjectURL(new Blob([model], {type:'text/javascript'}));
    const sunlight=bundle.sunlight.replace("'./assets/suncalc.js'",JSON.stringify(new URL('assets/suncalc.js',baseURL).href));
    const sunlightURL=URL.createObjectURL(new Blob([sunlight],{type:'text/javascript'}));
    const noteToolsURL=URL.createObjectURL(new Blob([bundle.noteTools],{type:'text/javascript'}));
    const joystickURL=URL.createObjectURL(new Blob([bundle.joystick],{type:'text/javascript'}));
    const app = bundle.app.replace("'./model.js'", JSON.stringify(modelURL))
      .replace("'./sunlight.js'", JSON.stringify(sunlightURL))
      .replace("'./notes.js'", JSON.stringify(noteToolsURL))
      .replace("'./joystick.js'", JSON.stringify(joystickURL))
      .replace("'./assets/OrbitControls.js'", JSON.stringify(new URL('assets/OrbitControls.js',baseURL).href))
      .replace("'./assets/RoundedBoxGeometry.js'", JSON.stringify(new URL('assets/RoundedBoxGeometry.js',baseURL).href))
      .replace("'./assets/realism.js'", JSON.stringify(new URL('assets/realism.js',baseURL).href));
    const appURL = URL.createObjectURL(new Blob([app], {type:'text/javascript'}));
    const photoURL = URL.createObjectURL(new Blob([fromBase64(bundle.photo)], {type:'image/jpeg'}));
    const storageKey = 'private-home-layout-v1';
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
      async save(value) { localStorage.setItem(storageKey, JSON.stringify(await encryptText(value,key))); }
    }, configurable:false});
    let html = bundle.html.replace('<link rel="stylesheet" href="./style.css">', `<style>${bundle.css}</style>`)
      .replace('"./assets/three.module.js"', JSON.stringify(new URL('assets/three.module.js',baseURL).href))
      .replace('src="./assets/floorplan.jpg"', `src="${photoURL}"`)
      .replace('<script type="module" src="./app.js"></script>', `<script type="module" src="${appURL}"></script>`)
      .replace('<button id="save" class="primary">배치 저장</button>', '<div class="home-actions"><button id="install-app" type="button">앱 받기</button><button id="lock-home" title="공간 잠그기">잠금</button><button id="save" class="primary">배치 저장</button></div>')
      .replace('<meta charset="UTF-8">', `<meta charset="UTF-8"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#28564b"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="욱봉 신혼집"><link rel="manifest" href="${new URL('manifest.webmanifest',baseURL).href}"><link rel="apple-touch-icon" href="${new URL('app-icons/apple-touch-icon.png',baseURL).href}"><link rel="stylesheet" href="${new URL('install.css',baseURL).href}">`);
    input.value = '';
    unlocked = true;
    document.open(); document.write(html); document.close();
    mountInstall();
  } catch (error) {
    status.textContent = error.message || '열지 못했습니다. 네트워크 연결을 확인해주세요.';
  } finally {
    if (!unlocked) { submit.disabled = false; input.focus(); }
  }
});

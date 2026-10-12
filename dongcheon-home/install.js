export function setupAppInstall(baseURL){
  let promptEvent;
  let button;
  let appInstalled=false;
  const installed=()=>appInstalled||window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function update(){
    if(button)button.hidden=installed()||ios;
  }
  function capturePrompt(event){event.preventDefault();promptEvent=event;update();}
  function didInstall(){appInstalled=true;promptEvent=null;update();const status=document.querySelector('#install-status');if(status)status.textContent='홈 화면에 욱봉 신혼집 앱을 추가했어요.';}
  function listen(){window.addEventListener('beforeinstallprompt',capturePrompt);window.addEventListener('appinstalled',didInstall);}
  listen();
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/.test(navigator.userAgent),samsung=/SamsungBrowser/.test(navigator.userAgent);
  const link=new URL('./',baseURL).href;
  const chromeURL=android?`intent://${link.replace(/^https?:\/\//,'')}#Intent;scheme=${new URL(link).protocol.slice(0,-1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(link)};end`:null;
  const chromeSteps='<p><strong>Chrome</strong>: 오른쪽 위 <strong>⋮</strong> → <strong>홈 화면에 추가</strong> → <strong>설치</strong>를 누르세요. 메뉴에 <strong>앱 설치</strong>가 보이면 바로 선택하세요.</p>';
  const samsungSteps='<p><strong>삼성 인터넷</strong>: <strong>☰ 메뉴</strong> → <strong>현재 페이지 추가</strong> 또는 <strong>페이지 추가</strong> → <strong>홈 화면</strong>을 선택하세요. 주소창의 <strong>＋</strong>로 추가할 수도 있어요.</p>';
  const manual=`<section id="manual-install" tabindex="-1"><h3>${android?'갤럭시 설치 방법':'브라우저 메뉴에서 설치'}</h3>${samsung?samsungSteps+chromeSteps:chromeSteps+samsungSteps}<p class="install-tip">카카오톡·인스타그램 안에서는 설치 창이 뜨지 않을 수 있어요. <strong>외부 브라우저로 열기</strong>로 Chrome이나 삼성 인터넷에서 다시 열어주세요. 메뉴가 없으면 아래 주소를 복사해 브라우저 주소창에 붙여넣으세요.</p>${android?`<p><a class="install-primary" href="${chromeURL}">Chrome에서 열기</a></p>`:''}</section>`;
  const steps=installed()?'<p>이미 홈 화면 앱으로 사용하고 있어요.</p>':ios?'<p>Safari에서 홈 화면에 추가하면 앱 아이콘이 생겨요.</p><ol><li>이 페이지를 <strong>Safari</strong>에서 열어주세요.</li><li>Safari의 메뉴에서 <strong>공유</strong>를 누르세요.</li><li><strong>홈 화면에 추가</strong>를 선택하세요.</li><li>표시된다면 <strong>웹 앱으로 열기</strong>를 켜고 <strong>추가</strong>를 누르세요.</li></ol><p class="install-tip">카카오톡·인스타그램 안에서 열었다면 메뉴의 <strong>Safari로 열기</strong> 또는 <strong>외부 브라우저로 열기</strong>를 선택하세요. 메뉴가 없으면 아래 주소를 복사해 Safari 주소창에 붙여넣으세요.</p>':`<p>앱 설치를 눌러주세요. 브라우저가 직접 설치를 지원하지 않으면 아래 메뉴로 추가할 수 있어요.</p>`;
  // The fragment link and CSS open this guide even if modal APIs or handlers fail.
  const html=`<section id="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title" tabindex="-1"><div class="install-panel"><div class="install-heading"><h2 id="install-title">${ios?'아이폰 앱 설치':'홈 화면에 욱봉 신혼집 추가'}</h2><a class="install-close" href="#" role="button" aria-label="설치 안내 닫기">닫기</a></div>${steps}<button id="native-install" class="install-primary" type="button"${ios||installed()?' hidden':''}>앱 설치</button><p id="install-status" role="status" aria-live="polite"></p>${!ios&&!installed()?manual:''}<p class="install-note">한 번 인증한 앱·브라우저는 바로 입장해요. 잠금을 누르면 기기 인증을 지웁니다. 새로고침으로 최신 내용을 불러오고, 사용 중 업데이트도 자동 반영됩니다. 가구 수정은 수정안으로 저장되고, 공유 연결 후 본인이 승인해야 확정 배치에 반영됩니다. 인터넷 연결이 필요해요.</p><section class="invite-section"><h3>다른 사람 초대하기</h3><p>링크를 보내고 초대 비밀번호를 따로 알려주세요. 초대받은 사람도 입장 후 앱을 설치할 수 있어요.</p><label for="invite-link">사이트 주소</label><input id="invite-link" type="url" readonly value="${link}"><div class="invite-actions"><button id="copy-invite" type="button">${ios?'Safari 주소 복사':'사이트 주소 복사'}</button><button id="share-invite" type="button" hidden>공유하기</button></div></section></div></section>`;
  function mount(){
    // Unlocking replaces the document and clears its window event listeners.
    listen();
    const dialog=document.querySelector('#install-dialog'),trigger=document.querySelector('#install-app');
    let wasOpen=false;
    function syncFocus(){
      const open=location.hash==='#install-dialog';
      for(const element of document.querySelectorAll('body > header,body > main'))element.inert=open;
      if(open)dialog.querySelector('.install-close').focus();else if(wasOpen)trigger.focus();
      wasOpen=open;
    }
    window.addEventListener('hashchange',syncFocus);
    syncFocus();
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.querySelector('.install-close').click();}
      if(event.key==='Tab'){
        const targets=[...dialog.querySelectorAll('a,button,input')].filter(element=>!element.hidden&&!element.disabled);
        const first=targets[0],last=targets.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    button=dialog.querySelector('#native-install');
    update();
    function showManual(){
      dialog.querySelector('#install-status').textContent='직접 설치 창을 열 수 없는 상태예요. 아래 브라우저 메뉴로 홈 화면에 추가해주세요.';
      const guide=dialog.querySelector('#manual-install');
      if(guide){guide.scrollIntoView({block:'nearest'});guide.focus({preventScroll:true});}
    }
    button.onclick=async()=>{
      if(!promptEvent){showManual();return;}
      const event=promptEvent;promptEvent=null;update();
      try{await event.prompt();const choice=await event.userChoice;if(choice?.outcome==='dismissed')showManual();}catch{showManual();}
    };
    const input=dialog.querySelector('#invite-link');
    input.value=link;
    dialog.querySelector('#copy-invite').onclick=async()=>{
      try{await navigator.clipboard.writeText(link);dialog.querySelector('#install-status').textContent='초대 링크를 복사했어요. 비밀번호는 따로 알려주세요.';}
      catch{input.focus();input.select();dialog.querySelector('#install-status').textContent='선택한 초대 링크를 복사해주세요.';}
    };
    const share=dialog.querySelector('#share-invite');
    share.hidden=!navigator.share;
    share.onclick=async()=>{
      try{await navigator.share({title:'욱봉 신혼집',text:'욱봉 신혼집 3D 공간에 초대해요. 비밀번호는 따로 알려드릴게요.',url:link});}
      catch(error){if(error.name!=='AbortError')dialog.querySelector('#install-status').textContent='초대 링크 복사 버튼을 이용해주세요.';}
    };
  }
  return {html,mount};
}

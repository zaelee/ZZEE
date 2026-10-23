/* Offline gallery controls and 3D playback for procedural enemy motions. */
(() => {
  'use strict';

  const motionKeys = ['move', 'hit', 'death'];
  const motionLabels = { move: '이동', hit: '피격', death: '쓰러짐' };

  function initialiseGallery() {
    const buttons = Array.from(document.querySelectorAll('[data-gallery-motion]'));
    if (!buttons.length) return;
    const cards = Array.from(document.querySelectorAll('.motion-card'));
    const overviewTitle = document.getElementById('overview-title');
    const overviewImage = document.getElementById('overview-image');

    function selectGalleryMotion(key) {
      if (!motionKeys.includes(key)) return;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryMotion === key)));
      cards.forEach(card => {
        const id = card.dataset.enemy;
        const name = card.dataset[`${key}Name`] || motionLabels[key];
        const description = card.dataset[`${key}Description`] || '';
        const picture = card.querySelector('picture');
        const source = picture && picture.querySelector('source');
        const image = picture && picture.querySelector('img');
        const posterLink = card.querySelector('.motion-poster');
        card.querySelector('[data-motion-name]').textContent = name;
        card.querySelector('[data-motion-description]').textContent = description;
        if (source) source.srcset = `previews/${id}-${key}.png`;
        if (image) {
          image.src = `previews/${id}-${key}.gif`;
          image.alt = `${card.querySelector('h2').textContent} ${name} 모션`;
        }
        card.querySelectorAll('[data-viewer-link]').forEach(link => { link.href = `viewer.html?enemy=${encodeURIComponent(id)}&motion=${key}`; });
        if (posterLink) posterLink.setAttribute('aria-label', `${card.querySelector('h2').textContent} ${name} 모션 3D 보기`);
      });
      if (overviewTitle) overviewTitle.textContent = `아홉 적의 ${motionLabels[key]} 한눈에 보기`;
      if (overviewImage) {
        overviewImage.src = `previews/all-${key}.gif`;
        overviewImage.alt = `아홉 적 캐릭터의 ${motionLabels[key]} 모션 모음`;
      }
    }

    buttons.forEach(button => button.addEventListener('click', () => selectGalleryMotion(button.dataset.galleryMotion)));
    selectGalleryMotion('move');
  }

  initialiseGallery();

  const stage = document.getElementById('motion-stage');
  if (!stage) return;

  const documents = window.PUPSTERS_MOTIONS || {};
  const ids = Object.keys(documents).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const enemySelect = document.getElementById('enemy-select');
  const fallback = stage.querySelector('.motion-fallback');
  const fallbackSource = fallback && fallback.querySelector('source');
  const fallbackImage = fallback && fallback.querySelector('img');
  const status = document.getElementById('renderer-status');
  const timeline = document.getElementById('motion-time');
  const timeOutput = document.getElementById('time-output');
  const phaseOutput = document.getElementById('phase-label');
  const endState = document.getElementById('end-state');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const playbackControls = Array.from(document.querySelectorAll('[data-playback], [data-speed], #motion-time'));

  let renderer = null;
  let scene = null;
  let camera = null;
  let canvas = null;
  let documentData = null;
  let clip = null;
  let motionKey = 'move';
  let meshes = [];
  let geometries = [];
  let materials = [];
  let currentTime = 0;
  let playing = false;
  let looping = false;
  let pendingLoopReset = false;
  let speed = 1;
  let lastNow = null;
  let yaw = 0.58;
  let pitch = 0.34;
  let zoom = 1;
  let drag = null;
  let frameRequest = 0;
  let quaternionA = null;
  let quaternionB = null;
  let target = { x: 0, y: 1.35, z: -0.9 };
  let viewWidth = 7;
  let contextLost = false;

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  function setControlsDisabled(disabled) {
    playbackControls.forEach(control => { control.disabled = disabled; });
    document.querySelectorAll('[data-view], [data-zoom]').forEach(control => { control.disabled = disabled; });
  }

  function disposeMeshes() {
    if (scene) meshes.forEach(mesh => scene.remove(mesh));
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    meshes = [];
    geometries = [];
    materials = [];
  }

  function colorFrom(value, fallbackColor) {
    const source = Array.isArray(value) && value.length >= 3 ? value : fallbackColor;
    return new THREE.Color(source[0], source[1], source[2]).convertSRGBToLinear();
  }

  function documentIsValid(candidate) {
    return Boolean(candidate && Array.isArray(candidate.parts) && candidate.parts.length && candidate.clips && typeof candidate.clips === 'object');
  }

  function clipIsValid(candidate, partCount) {
    if (!candidate || !Number.isFinite(candidate.duration) || candidate.duration <= 0 || !Array.isArray(candidate.frames) || !candidate.frames.length) return false;
    let previous = -Infinity;
    for (const frame of candidate.frames) {
      if (!Number.isFinite(frame.time) || frame.time < previous || !Array.isArray(frame.transforms) || frame.transforms.length !== partCount) return false;
      if (frame.transforms.some(transform => !Array.isArray(transform) || transform.length !== 11)) return false;
      previous = frame.time;
    }
    return true;
  }

  function buildMeshes(candidate) {
    disposeMeshes();
    for (const part of candidate.parts) {
      if (!Array.isArray(part.vertices) || !Array.isArray(part.faces)) throw new Error(`${part.name || 'part'} has no mesh geometry`);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
      geometry.setIndex(part.faces.flat());
      geometry.computeVertexNormals();
      const opacity = clamp(Number.isFinite(part.opacity) ? part.opacity : 1, 0, 1);
      const material = new THREE.MeshStandardMaterial({
        color: colorFrom(part.color, [0.5, 0.5, 0.5]),
        roughness: 0.86,
        metalness: 0,
        flatShading: true,
        transparent: opacity < 0.999,
        opacity,
        depthWrite: opacity >= 0.999
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = part.name || '';
      mesh.position.fromArray(part.position || [0, 0, 0]);
      mesh.quaternion.fromArray(part.quaternion || [0, 0, 0, 1]);
      scene.add(mesh);
      meshes.push(mesh);
      geometries.push(geometry);
      materials.push(material);
    }
  }

  function surroundingFrames(time) {
    const frames = clip.frames;
    if (time <= frames[0].time) return [frames[0], frames[0], 0];
    const last = frames[frames.length - 1];
    if (time >= last.time) return [last, last, 0];
    let low = 0;
    let high = frames.length - 1;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (frames[middle].time <= time) low = middle;
      else high = middle;
    }
    const lower = frames[low];
    const upper = frames[high];
    return [lower, upper, (time - lower.time) / Math.max(upper.time - lower.time, 1e-9)];
  }

  function applyTransform(mesh, lower, upper, alpha) {
    mesh.position.set(
      lower[0] + (upper[0] - lower[0]) * alpha,
      lower[1] + (upper[1] - lower[1]) * alpha,
      lower[2] + (upper[2] - lower[2]) * alpha
    );
    quaternionA.set(lower[3], lower[4], lower[5], lower[6]);
    quaternionB.set(upper[3], upper[4], upper[5], upper[6]);
    quaternionA.slerp(quaternionB, alpha);
    mesh.quaternion.copy(quaternionA);
    mesh.scale.set(
      lower[7] + (upper[7] - lower[7]) * alpha,
      lower[8] + (upper[8] - lower[8]) * alpha,
      lower[9] + (upper[9] - lower[9]) * alpha
    );
    mesh.visible = Boolean(lower[10]);
  }

  function phaseAt(time) {
    const progress = clip ? time / clip.duration : 0;
    if (motionKey === 'hit') {
      if (progress < 0.34) return ['IMPACT', '충돌', 'impact'];
      if (progress < 0.72) return ['RECOIL', '반동', 'impact'];
      return ['RECOVER', '회복', 'start'];
    }
    if (motionKey === 'death') {
      if (progress < 0.3) return ['STAGGER', '비틀거림', 'impact'];
      if (progress < 0.92) return ['FALL', '쓰러지는 중', 'fall'];
      return ['DEFEATED', '전투 불능', 'defeated'];
    }
    if (progress < 0.34) return ['PUSH', '딛기', 'start'];
    if (progress < 0.72) return ['PASS', '이동', 'start'];
    return ['RETURN', '다음 걸음', 'start'];
  }

  function updateReadout() {
    if (!clip) return;
    timeline.value = String(currentTime);
    timeOutput.textContent = `${currentTime.toFixed(2)} / ${clip.duration.toFixed(2)}초`;
    const phase = phaseAt(currentTime);
    phaseOutput.textContent = `${phase[0]} · ${phase[1]}`;
    phaseOutput.dataset.phase = phase[2];
    if (endState) endState.hidden = !(motionKey === 'death' && currentTime >= clip.duration - 0.001);
  }

  function applyCurrentTime() {
    if (!clip) return;
    if (meshes.length) {
      const [lowerFrame, upperFrame, alpha] = surroundingFrames(currentTime);
      meshes.forEach((mesh, index) => applyTransform(mesh, lowerFrame.transforms[index], upperFrame.transforms[index], alpha));
    }
    updateReadout();
  }

  function setPlayback(nextPlaying, nextLooping) {
    playing = nextPlaying;
    looping = nextLooping;
    pendingLoopReset = false;
    lastNow = null;
    document.querySelectorAll('[data-playback]').forEach(button => {
      const action = button.dataset.playback;
      const active = (action === 'repeat' && playing && looping) || (action === 'once' && playing && !looping) || (action === 'pause' && !playing);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateFallback(id, key) {
    if (!fallbackImage) return;
    const motionName = clip && clip.name ? clip.name : motionLabels[key];
    fallbackImage.src = `previews/${id}-${key}.gif`;
    fallbackImage.alt = `${documentData.displayName || id} ${motionName} 이미지 미리보기`;
    if (fallbackSource) fallbackSource.srcset = `previews/${id}-${key}.png`;
  }

  function updateLinks(id) {
    const roblox = document.getElementById('roblox-download');
    const glb = document.getElementById('glb-download');
    if (roblox) roblox.href = `roblox/${id}-motions.rbxmx`;
    if (glb) glb.href = `animations/${id}-motions.glb`;
  }

  function updateAddress() {
    if (!window.history || !history.replaceState || !documentData) return;
    try {
      history.replaceState(null, '', `viewer.html?enemy=${encodeURIComponent(documentData.id)}&motion=${motionKey}`);
    } catch (error) {
      console.warn('Could not update the local viewer address.', error);
    }
  }

  function updateCamera() {
    if (!camera) return;
    const radius = Math.max(viewWidth * 1.6, 8);
    const cosine = Math.cos(pitch);
    camera.position.set(
      target.x + Math.sin(yaw) * cosine * radius,
      target.y + Math.sin(pitch) * radius,
      target.z - Math.cos(yaw) * cosine * radius
    );
    camera.lookAt(target.x, target.y, target.z);
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setSize(width, height, false);
    const halfWidth = viewWidth / (2 * zoom);
    const halfHeight = halfWidth / (width / height);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  function syncRenderMode() {
    const showFallback = contextLost || !renderer || reducedMotion.matches;
    if (canvas) canvas.hidden = showFallback;
    if (fallback) fallback.hidden = !showFallback;
    setControlsDisabled(showFallback);
    if (reducedMotion.matches) {
      setPlayback(false, false);
      setStatus('동작 줄이기 설정에 따라 정지 포스터를 표시합니다.');
    } else if (contextLost) {
      setStatus('WebGL 연결이 끊겨 이미지 미리보기로 전환했습니다.', true);
    } else if (!renderer) {
      setStatus('WebGL을 사용할 수 없어 이미지 미리보기를 표시합니다.', true);
    } else {
      setStatus('로컬 절차식 파트 모션');
    }
  }

  function selectMotion(key, updateQuery = true) {
    if (!documentData || !motionKeys.includes(key)) return;
    const candidate = documentData.clips[key];
    motionKey = key;
    clip = candidate;
    document.querySelectorAll('[data-motion]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.motion === key)));
    document.getElementById('motion-title').textContent = candidate && candidate.name ? candidate.name : motionLabels[key];
    document.getElementById('motion-description').textContent = candidate && candidate.description ? candidate.description : '';
    document.title = `${documentData.displayName || documentData.id} · ${candidate && candidate.name ? candidate.name : motionLabels[key]}`;
    updateFallback(documentData.id, key);
    currentTime = 0;
    if (!clipIsValid(candidate, documentData.parts.length)) {
      setPlayback(false, false);
      setControlsDisabled(true);
      setStatus('선택한 모션 데이터 형식을 읽을 수 없습니다.', true);
      return;
    }
    timeline.max = String(candidate.duration);
    setPlayback(!reducedMotion.matches && Boolean(renderer), key === 'death' ? false : Boolean(candidate.loop));
    applyCurrentTime();
    syncRenderMode();
    if (updateQuery) updateAddress();
  }

  function selectEnemy(id, key = motionKey, updateQuery = true) {
    const candidate = documents[id];
    if (!candidate) return;
    documentData = candidate;
    enemySelect.value = id;
    document.getElementById('enemy-code').textContent = id;
    document.getElementById('enemy-title').textContent = candidate.displayName || candidate.name || id;
    updateLinks(id);
    const nextTarget = Array.isArray(candidate.target) && candidate.target.length >= 3 ? candidate.target : [0, 1.35, -0.9];
    target = { x: nextTarget[0], y: nextTarget[1], z: nextTarget[2] };
    viewWidth = Number.isFinite(candidate.viewWidth) && candidate.viewWidth > 0 ? candidate.viewWidth : 7;
    zoom = 1;
    if (!documentIsValid(candidate)) {
      disposeMeshes();
      setControlsDisabled(true);
      setStatus('적 캐릭터 데이터 형식을 읽을 수 없습니다.', true);
      return;
    }
    if (renderer) {
      try {
        buildMeshes(candidate);
      } catch (error) {
        console.warn('Could not build enemy meshes.', error);
        disposeMeshes();
        setControlsDisabled(true);
        setStatus('적 캐릭터 지오메트리를 읽을 수 없습니다.', true);
        return;
      }
    }
    resize();
    updateCamera();
    selectMotion(candidate.clips[key] ? key : 'move', updateQuery);
  }

  const query = new URLSearchParams(window.location.search);
  const requestedEnemy = query.get('enemy');
  const requestedMotion = query.get('motion');
  enemySelect.addEventListener('change', () => selectEnemy(enemySelect.value));

  if (!ids.length) {
    setControlsDisabled(true);
    setStatus('모션 데이터가 없습니다.', true);
    return;
  }

  if (window.THREE) {
    try {
      quaternionA = new THREE.Quaternion();
      quaternionB = new THREE.Quaternion();
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setClearColor(0xeaf0f1, 1);
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-3.5, 3.5, 2.5, -2.5, 0.1, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8b82, 1.0));
      const keyLight = new THREE.DirectionalLight(0xfff8e9, 0.94);
      keyLight.position.set(-4, 8, -6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x9eddf0, 0.34);
      rimLight.position.set(6, 4, 5);
      scene.add(rimLight);
      canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', '적 모션 3D 미리보기. 방향키나 드래그로 회전하고, 더하기·빼기 또는 휠로 확대합니다. 스페이스바로 재생과 일시정지를 전환합니다.');
      stage.appendChild(canvas);
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        contextLost = true;
        setPlayback(false, false);
        syncRenderMode();
      });
      canvas.addEventListener('pointerdown', event => {
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        yaw -= (event.clientX - drag.x) * 0.009;
        pitch = clamp(pitch + (event.clientY - drag.y) * 0.007, -0.2, 1.5);
        drag.x = event.clientX;
        drag.y = event.clientY;
      });
      const finishDrag = event => { if (drag && (!event || event.pointerId === drag.id)) drag = null; };
      canvas.addEventListener('pointerup', finishDrag);
      canvas.addEventListener('pointercancel', finishDrag);
      canvas.addEventListener('wheel', event => {
        event.preventDefault();
        zoom = clamp(zoom * Math.exp(-event.deltaY * 0.001), 0.65, 2.5);
        resize();
      }, { passive: false });
      canvas.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', ' ', 'Home'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') yaw -= 0.12;
        if (event.key === 'ArrowRight') yaw += 0.12;
        if (event.key === 'ArrowUp') pitch = clamp(pitch + 0.1, -0.2, 1.5);
        if (event.key === 'ArrowDown') pitch = clamp(pitch - 0.1, -0.2, 1.5);
        if (event.key === '+' || event.key === '=') zoom = clamp(zoom + 0.1, 0.65, 2.5);
        if (event.key === '-') zoom = clamp(zoom - 0.1, 0.65, 2.5);
        if (event.key === ' ') {
          if (playing) setPlayback(false, looping);
          else {
            if (currentTime >= clip.duration) currentTime = 0;
            setPlayback(true, false);
          }
        }
        if (event.key === 'Home') {
          currentTime = 0;
          setPlayback(false, false);
          applyCurrentTime();
        }
        resize();
      });
      if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
      else window.addEventListener('resize', resize);
    } catch (error) {
      console.warn('Enemy motion WebGL preview unavailable.', error);
      renderer = null;
      canvas = null;
    }
  }

  document.querySelectorAll('[data-motion]').forEach(button => button.addEventListener('click', () => selectMotion(button.dataset.motion)));
  document.querySelectorAll('[data-playback]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.playback;
    if (action === 'once') {
      currentTime = 0;
      setPlayback(true, false);
      applyCurrentTime();
    } else if (action === 'repeat') {
      if (currentTime >= clip.duration) currentTime = 0;
      setPlayback(true, true);
      applyCurrentTime();
    } else if (action === 'pause') {
      setPlayback(false, looping);
    } else if (action === 'reset') {
      setPlayback(false, false);
      currentTime = 0;
      applyCurrentTime();
    }
  }));
  document.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => {
    speed = Number(button.dataset.speed);
    document.querySelectorAll('[data-speed]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  timeline.addEventListener('input', () => {
    setPlayback(false, looping);
    currentTime = clamp(Number(timeline.value) || 0, 0, clip.duration);
    applyCurrentTime();
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    const views = { three: [0.58, 0.34], front: [0, 0], side: [Math.PI / 2, 0], top: [0, 1.48] };
    [yaw, pitch] = views[button.dataset.view];
    document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    updateCamera();
  }));
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.zoom;
    zoom = action === 'reset' ? 1 : clamp(zoom + (action === 'in' ? 0.15 : -0.15), 0.65, 2.5);
    resize();
  }));

  const motionPreferenceChanged = () => {
    syncRenderMode();
    if (!reducedMotion.matches && renderer && clip) setPlayback(true, motionKey === 'death' ? false : Boolean(clip.loop));
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionPreferenceChanged);
  else reducedMotion.addListener(motionPreferenceChanged);
  document.addEventListener('visibilitychange', () => { lastNow = null; });

  function animate(now) {
    frameRequest = requestAnimationFrame(animate);
    if (!renderer || !clip || contextLost || reducedMotion.matches) return;
    if (lastNow === null) lastNow = now;
    const delta = Math.min(Math.max((now - lastNow) / 1000, 0), 0.1);
    lastNow = now;
    if (playing && !document.hidden) {
      if (pendingLoopReset) {
        currentTime = 0;
        pendingLoopReset = false;
      } else {
        const nextTime = currentTime + delta * speed;
        if (nextTime >= clip.duration) {
          currentTime = clip.duration;
          if (looping) pendingLoopReset = true;
          else setPlayback(false, false);
        } else currentTime = nextTime;
      }
      applyCurrentTime();
    }
    updateCamera();
    renderer.render(scene, camera);
  }

  selectEnemy(documents[requestedEnemy] ? requestedEnemy : ids[0], motionKeys.includes(requestedMotion) ? requestedMotion : 'move', false);
  syncRenderMode();
  resize();
  updateCamera();
  if (renderer) frameRequest = requestAnimationFrame(animate);
  window.addEventListener('beforeunload', () => {
    if (frameRequest) cancelAnimationFrame(frameRequest);
    disposeMeshes();
    if (renderer) renderer.dispose();
  }, { once: true });
})();

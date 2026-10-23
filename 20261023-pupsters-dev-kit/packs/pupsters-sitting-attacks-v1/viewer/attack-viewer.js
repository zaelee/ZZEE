/* Offline attack playback for the procedural anchored-Part clips. */
(() => {
  'use strict';

  const clips = window.PUPSTERS_ATTACKS || {};
  const stage = document.getElementById('attack-stage');
  if (!stage) return;

  const ids = Object.keys(clips).sort();
  const select = document.getElementById('dog-select');
  const fallback = stage.querySelector('.attack-fallback');
  const fallbackSource = fallback && fallback.querySelector('source');
  const fallbackImage = fallback && fallback.querySelector('img');
  const status = document.getElementById('renderer-status');
  const timeline = document.getElementById('attack-time');
  const timeOutput = document.getElementById('time-output');
  const phaseOutput = document.getElementById('phase-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const target = { x: 0, y: 1.35, z: -0.9 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const playbackControls = Array.from(document.querySelectorAll('[data-playback], [data-speed], #attack-time'));

  let renderer = null;
  let scene = null;
  let camera = null;
  let clip = null;
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

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  function setControlsDisabled(disabled) {
    for (const control of playbackControls) control.disabled = disabled;
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

  function clipIsValid(candidate) {
    if (!candidate || !Array.isArray(candidate.parts) || !candidate.parts.length || !Array.isArray(candidate.frames) || !candidate.frames.length) return false;
    let previous = -Infinity;
    for (const frame of candidate.frames) {
      if (!Number.isFinite(frame.time) || frame.time < previous || !Array.isArray(frame.transforms) || frame.transforms.length !== candidate.parts.length) return false;
      if (frame.transforms.some(transform => !Array.isArray(transform) || transform.length < 11)) return false;
      previous = frame.time;
    }
    return Number.isFinite(candidate.duration) && candidate.duration > 0;
  }

  function buildMeshes(candidate) {
    disposeMeshes();
    for (const part of candidate.parts) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.vertices.flat(), 3));
      geometry.setIndex(part.faces.flat());
      geometry.computeVertexNormals();
      const baseColor = colorFrom(part.color, [0.5, 0.5, 0.5]);
      const hasEmission = Boolean(part.emissive);
      const emissiveColor = Array.isArray(part.emissive) ? colorFrom(part.emissive, part.color) : baseColor;
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: part.isEffect ? 0.48 : 0.88,
        metalness: 0,
        flatShading: true,
        emissive: hasEmission ? emissiveColor : 0x000000,
        emissiveIntensity: hasEmission ? 1.15 : 0
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = part.name;
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
    if (time < 0.6) return ['WINDUP', '준비'];
    if (time < 1.25) return ['FIRE', '발사'];
    return ['RECOVER', '회복'];
  }

  function updateReadout() {
    if (!clip) return;
    timeline.value = String(currentTime);
    timeOutput.textContent = `${currentTime.toFixed(2)} / ${clip.duration.toFixed(2)}초`;
    const phase = phaseAt(currentTime);
    phaseOutput.textContent = `${phase[0]} · ${phase[1]}`;
    phaseOutput.dataset.phase = phase[0].toLowerCase();
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
      const active = (button.dataset.playback === 'repeat' && playing && looping) || (button.dataset.playback === 'once' && playing && !looping) || (button.dataset.playback === 'pause' && !playing);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateFallback(id) {
    if (!fallbackImage) return;
    fallbackImage.src = `previews/${id}-attack.gif`;
    fallbackImage.alt = `${clips[id].displayName} ${clips[id].attackName} 공격 미리보기`;
    if (fallbackSource) fallbackSource.srcset = `previews/${id}-attack.png`;
  }

  function updateLinks(id) {
    const roblox = document.getElementById('roblox-download');
    const glb = document.getElementById('glb-download');
    if (roblox) roblox.href = `roblox/${id}-attack.rbxmx`;
    if (glb) glb.href = `animations/${id}-attack.glb`;
  }

  function updateCamera() {
    if (!camera) return;
    const radius = 10;
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
    const halfWidth = 3.5 / zoom;
    const halfHeight = halfWidth / (width / height);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  function selectClip(id, updateAddress = true) {
    const candidate = clips[id];
    if (!candidate) return;
    clip = candidate;
    select.value = id;
    document.getElementById('dog-code').textContent = id;
    document.getElementById('dog-title').textContent = candidate.displayName;
    document.getElementById('attack-title').textContent = candidate.attackName;
    document.getElementById('attack-description').textContent = candidate.description;
    document.title = `${candidate.displayName} · ${candidate.attackName}`;
    timeline.max = String(candidate.duration);
    updateFallback(id);
    updateLinks(id);
    currentTime = 0;
    pendingLoopReset = false;
    if (updateAddress && window.history && history.replaceState) {
      try {
        history.replaceState(null, '', `viewer.html?dog=${encodeURIComponent(id)}`);
      } catch (error) {
        console.warn('Could not update the local viewer address.', error);
      }
    }
    if (!clipIsValid(candidate)) {
      disposeMeshes();
      setControlsDisabled(true);
      setStatus('애니메이션 데이터 형식을 읽을 수 없습니다.', true);
      return;
    }
    if (renderer) {
      buildMeshes(candidate);
      fallback.hidden = true;
      setControlsDisabled(false);
      setStatus('절차식 Anchored Part 모션 · 피해 판정 없음');
    }
    setPlayback(!reducedMotion.matches && Boolean(renderer), true);
    applyCurrentTime();
  }

  const requested = new URLSearchParams(window.location.search).get('dog');
  select.addEventListener('change', () => selectClip(select.value));
  if (!ids.length) {
    setControlsDisabled(true);
    setStatus('공격 데이터가 없습니다.', true);
    return;
  }
  if (!window.THREE) {
    selectClip(clips[requested] ? requested : ids[0], false);
    setControlsDisabled(true);
    setStatus('로컬 Three.js를 불러오지 못해 이미지 미리보기를 표시합니다.', true);
    return;
  }

  try {
    quaternionA = new THREE.Quaternion();
    quaternionB = new THREE.Quaternion();
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0xf5f1e8);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-3.5, 3.5, 2.2, -2.2, 0.1, 60);
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb5a68d, 0.94));
    const keyLight = new THREE.DirectionalLight(0xfff9e9, 0.92);
    keyLight.position.set(-3, 7, -5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbfe8ff, 0.28);
    rimLight.position.set(5, 3, 4);
    scene.add(rimLight);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '공격 3D 미리보기. 드래그 또는 방향키로 회전하고 휠이나 더하기·빼기로 확대합니다.');
    stage.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      playing = false;
      canvas.hidden = true;
      fallback.hidden = false;
      setControlsDisabled(true);
      setStatus('WebGL 연결이 끊겨 이미지 미리보기로 전환했습니다.', true);
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
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') yaw -= 0.12;
      if (event.key === 'ArrowRight') yaw += 0.12;
      if (event.key === 'ArrowUp') pitch = clamp(pitch + 0.1, -0.2, 1.5);
      if (event.key === 'ArrowDown') pitch = clamp(pitch - 0.1, -0.2, 1.5);
      if (event.key === '+' || event.key === '=') zoom = clamp(zoom + 0.1, 0.65, 2.5);
      if (event.key === '-') zoom = clamp(zoom - 0.1, 0.65, 2.5);
      resize();
    });
    new ResizeObserver(resize).observe(stage);
  } catch (error) {
    console.warn('Attack WebGL preview unavailable.', error);
    renderer = null;
    setControlsDisabled(true);
    setStatus('WebGL을 사용할 수 없어 이미지 미리보기를 표시합니다.', true);
  }

  document.querySelectorAll('[data-playback]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.playback;
    if (action === 'once') {
      if (!clip || currentTime >= clip.duration) currentTime = 0;
      setPlayback(true, false);
    } else if (action === 'repeat') {
      if (!clip || currentTime >= clip.duration) currentTime = 0;
      setPlayback(true, true);
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
  }));

  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.zoom;
    zoom = action === 'reset' ? 1 : clamp(zoom + (action === 'in' ? 0.15 : -0.15), 0.65, 2.5);
    resize();
  }));

  const motionChanged = event => {
    if (event.matches) setPlayback(false, looping);
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChanged);
  else reducedMotion.addListener(motionChanged);
  document.addEventListener('visibilitychange', () => { lastNow = null; });

  function animate(now) {
    frameRequest = requestAnimationFrame(animate);
    if (!renderer || !clip) return;
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

  selectClip(clips[requested] ? requested : ids[0], false);
  resize();
  updateCamera();
  if (renderer) frameRequest = requestAnimationFrame(animate);
})();

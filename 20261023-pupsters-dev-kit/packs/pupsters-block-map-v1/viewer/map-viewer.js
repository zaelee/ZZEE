(function () {
  'use strict';

  var canvas = document.getElementById('map-canvas');
  var shell = document.getElementById('stage-shell');
  var status = document.getElementById('viewer-status');
  var markerLayer = document.getElementById('pad-markers');
  var slotSelect = document.getElementById('slot-select');
  var data = window.PUPSTERS_MAP;

  function showFallback(message) {
    shell.classList.add('is-fallback');
    status.textContent = message;
    document.querySelectorAll('.toolbar button, .toolbar input').forEach(function (control) {
      control.disabled = true;
    });
  }

  if (!data || !window.THREE || !canvas) {
    showFallback(data ? '이 브라우저에서는 정적 미리보기를 보여드려요.' : '3D 데이터가 없어 정적 미리보기를 보여드려요.');
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (error) {
    showFallback('3D 표시를 지원하지 않아 정적 미리보기를 보여드려요.');
    return;
  }

  var scene = new THREE.Scene();
  var world = new THREE.Group();
  var routeGroup = new THREE.Group();
  var padTargets = [];
  var markers = [];
  var parts = Array.isArray(data.parts) ? data.parts : [];
  var layout = data.layout || {};
  var slots = Array.isArray(layout.slots) ? layout.slots : [];
  var bounds = data.bounds || [[-38, 0, -26], [38, 14, 26]];
  var center = new THREE.Vector3(
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
    (bounds[0][2] + bounds[1][2]) / 2
  );
  var span = Math.max(bounds[1][0] - bounds[0][0], bounds[1][2] - bounds[0][2]);
  var aspect = 1;
  var viewSize = span * .48;
  var camera = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize, .1, span * 8);
  var cameraState = { azimuth: -Math.PI / 4, elevation: .72, zoom: 1 };
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var selectedSlot = null;
  var dragging = false;
  var moved = false;
  var lastX = 0;
  var lastY = 0;

  scene.add(world);
  scene.add(routeGroup);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9faeaa, .9));
  var sun = new THREE.DirectionalLight(0xffffff, .8);
  sun.position.set(-40, 70, 35);
  scene.add(sun);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xf0f3ec, 1);
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else renderer.outputEncoding = THREE.sRGBEncoding;

  function makePart(part) {
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    var faces = Array.isArray(part.faces) ? part.faces : [];
    var source = Array.isArray(part.vertices) ? part.vertices : [];
    if (source.length && typeof source[0] === 'number') vertices = source.slice();
    else source.forEach(function (vertex) {
      vertices.push(Number(vertex[0]) || 0, Number(vertex[1]) || 0, Number(vertex[2]) || 0);
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (faces.length) {
      var indices = [];
      if (typeof faces[0] === 'number') indices = faces.slice();
      else faces.forEach(function (face) {
        if (face.length === 3) indices.push(face[0], face[1], face[2]);
        if (face.length === 4) indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
      });
      geometry.setIndex(indices);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    var rgb = Array.isArray(part.color) ? part.color : [.72, .76, .72];
    var opacity = part.opacity == null ? 1 : part.opacity;
    var material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear(),
      flatShading: true,
      roughness: .78,
      metalness: .02,
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      opacity: opacity,
      depthWrite: opacity >= 1
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.name || '';
    mesh.userData.group = part.group || '';
    mesh.userData.kind = 'part';
    world.add(mesh);
  }

  parts.forEach(makePart);

  function makeRoute() {
    var waypoints = Array.isArray(layout.waypoints) ? layout.waypoints : [];
    if (waypoints.length < 2) return;
    var points = waypoints.map(function (waypoint) {
      return new THREE.Vector3(waypoint.position[0], Math.max(waypoint.position[1] || 0, .24), waypoint.position[2]);
    });
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x4f8fd3, transparent: true, opacity: .95, depthTest: false }));
    line.renderOrder = 20;
    routeGroup.add(line);
  }

  function makePads() {
    slots.forEach(function (slot, index) {
      var size = slot.size || [4.2, 4.2];
      var geometry = new THREE.PlaneGeometry(size[0], size[1]);
      var material = new THREE.MeshBasicMaterial({ color: 0x80d5bb, transparent: true, opacity: .01, side: THREE.DoubleSide, depthWrite: false });
      var pad = new THREE.Mesh(geometry, material);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = -(slot.yaw || 0);
      pad.position.set(slot.position[0], (slot.position[1] || .26) + .04, slot.position[2]);
      pad.userData.slot = slot;
      scene.add(pad);
      padTargets.push(pad);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pad-marker';
      button.textContent = slot.id || ('P' + String(index + 1).padStart(2, '0'));
      button.setAttribute('aria-label', button.textContent + ' 배치 패드 선택');
      button.addEventListener('click', function () { selectSlot(slot); });
      markerLayer.appendChild(button);
      markers.push({ slot: slot, element: button, position: pad.position.clone() });

      var option = document.createElement('option');
      option.value = slot.id;
      option.textContent = (slot.id || ('P' + String(index + 1).padStart(2, '0'))) + (slot.zone ? ' · ' + zoneName(slot.zone) : '');
      slotSelect.appendChild(option);
    });
  }

  function zoneName(zone) {
    var names = { entry: '입구', spawn: '입구', center: '중앙', play: '놀이 구역', side: '사이드', inner: '안쪽', outer: '바깥쪽', goal: '도착', exit: '도착' };
    return names[String(zone).toLowerCase()] || String(zone || '자유 배치');
  }

  function slotExplanation(slot) {
    var zone = String(slot.zone || '').toLowerCase();
    if (zone === 'inner') return '길 사이의 안쪽 자리입니다. 위아래로 지나가는 몹을 향해 강아지를 배치할 수 있어요. 칸 크기는 4.2 × 4.2 studs입니다.';
    return '길의 바깥쪽 자리입니다. 코너를 지나가는 몹을 겨냥하기 좋아요. 칸 크기는 4.2 × 4.2 studs입니다.';
  }

  function selectSlot(slot) {
    if (!slot) return;
    selectedSlot = slot;
    var id = slot.id || '패드';
    slotSelect.value = id;
    document.querySelector('.slot-card__id').textContent = id;
    document.querySelector('.slot-card h3').textContent = id + ' 배치 자리';
    document.getElementById('slot-description').textContent = slotExplanation(slot);
    document.getElementById('slot-position').textContent = slot.position.map(function (value) { return Number(value).toFixed(1); }).join(', ');
    document.getElementById('slot-zone').textContent = zoneName(slot.zone);
    markers.forEach(function (marker) { marker.element.classList.toggle('is-active', marker.slot === slot); });
  }

  function setGroupVisibility(prefix, visible) {
    world.children.forEach(function (child) {
      var group = child.userData.group || '';
      if (group.indexOf(prefix) === 0) child.visible = visible;
    });
  }

  function applyCamera() {
    var distance = span * 1.8;
    var horizontal = Math.cos(cameraState.elevation) * distance;
    camera.position.set(
      center.x + Math.sin(cameraState.azimuth) * horizontal,
      center.y + Math.sin(cameraState.elevation) * distance,
      center.z + Math.cos(cameraState.azimuth) * horizontal
    );
    camera.zoom = cameraState.zoom;
    camera.lookAt(center.x, center.y - 2, center.z);
    camera.updateProjectionMatrix();
  }

  function setView(name) {
    if (name === 'top') { cameraState.azimuth = 0; cameraState.elevation = Math.PI / 2 - .015; cameraState.zoom = 1.03; }
    else if (name === 'front') { cameraState.azimuth = 0; cameraState.elevation = .48; cameraState.zoom = 1; }
    else { cameraState.azimuth = -Math.PI / 4; cameraState.elevation = .72; cameraState.zoom = 1; }
    applyCamera();
    document.querySelectorAll('[data-view]').forEach(function (button) {
      var active = button.getAttribute('data-view') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function resize() {
    var width = shell.clientWidth;
    var height = shell.clientHeight;
    if (!width || !height) return;
    aspect = width / height;
    viewSize = Math.max(span * .48, span * .6 / aspect);
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function updateMarkers() {
    markers.forEach(function (marker) {
      var point = marker.position.clone().project(camera);
      var visible = point.z > -1 && point.z < 1;
      marker.element.style.display = visible ? '' : 'none';
      marker.element.style.left = ((point.x + 1) * .5 * shell.clientWidth) + 'px';
      marker.element.style.top = ((1 - point.y) * .5 * shell.clientHeight) + 'px';
    });
  }

  function render() {
    updateMarkers();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  function pickPad(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(padTargets, false);
    if (hits.length) selectSlot(hits[0].object.userData.slot);
  }

  canvas.addEventListener('pointerdown', function (event) {
    dragging = true; moved = false; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    cameraState.azimuth -= dx * .008;
    cameraState.elevation = Math.max(.22, Math.min(Math.PI / 2 - .015, cameraState.elevation + dy * .006));
    lastX = event.clientX; lastY = event.clientY;
    applyCamera();
  });
  canvas.addEventListener('pointerup', function (event) {
    dragging = false;
    if (!moved) pickPad(event);
  });
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    cameraState.zoom = Math.max(.62, Math.min(2.4, cameraState.zoom * (event.deltaY > 0 ? .9 : 1.1)));
    applyCamera();
  }, { passive: false });
  canvas.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') cameraState.azimuth -= .12;
    else if (event.key === 'ArrowRight') cameraState.azimuth += .12;
    else if (event.key === 'ArrowUp') cameraState.elevation = Math.min(Math.PI / 2 - .015, cameraState.elevation + .09);
    else if (event.key === 'ArrowDown') cameraState.elevation = Math.max(.22, cameraState.elevation - .09);
    else if (event.key === '+' || event.key === '=') cameraState.zoom = Math.min(2.4, cameraState.zoom * 1.1);
    else if (event.key === '-' || event.key === '_') cameraState.zoom = Math.max(.62, cameraState.zoom * .9);
    else if (event.key === 'Home') setView('iso');
    else return;
    event.preventDefault();
    applyCamera();
  });

  document.querySelectorAll('[data-view]').forEach(function (button) {
    button.addEventListener('click', function () { setView(button.getAttribute('data-view')); });
  });
  document.getElementById('toggle-actors').addEventListener('change', function (event) { setGroupVisibility('Actors_', event.target.checked); });
  document.getElementById('toggle-props').addEventListener('change', function (event) { setGroupVisibility('Props', event.target.checked); });
  document.getElementById('toggle-route').addEventListener('change', function (event) { routeGroup.visible = event.target.checked; });
  document.getElementById('toggle-labels').addEventListener('change', function (event) { markerLayer.classList.toggle('hide-labels', !event.target.checked); });
  slotSelect.addEventListener('change', function () {
    selectSlot(slots.find(function (slot) { return slot.id === slotSelect.value; }));
  });
  window.addEventListener('resize', resize);

  makeRoute();
  makePads();
  if (slots.length) selectSlot(slots[0]);
  resize();
  setView('iso');
  render();
  status.textContent = slots.length ? '민트색 패드를 선택해 보세요.' : '드래그해서 맵을 둘러보세요.';
  window.setTimeout(function () { status.classList.add('is-hidden'); }, 3200);
}());

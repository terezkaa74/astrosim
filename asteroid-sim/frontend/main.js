const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e27);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1e6, 1e13);
camera.position.set(2e10, 1.5e10, 2e10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("scene3d").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2);
sunLight.position.set(-5e10, 0, 0);
scene.add(sunLight);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(6.371e9, 64, 64),
  new THREE.MeshPhongMaterial({
    color: 0x2266ff,
    transparent: true,
    opacity: 0.85,
    emissive: 0x112244,
    emissiveIntensity: 0.2
  })
);
scene.add(earth);

const earthGlow = new THREE.Mesh(
  new THREE.SphereGeometry(6.8e9, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x3388ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  })
);
scene.add(earthGlow);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(7e9, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa00 })
);
sun.position.set(-5e10, 0, 0);
scene.add(sun);

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(9e9, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  })
);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

const stars = new THREE.Group();
for (let i = 0; i < 1000; i++) {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(2e8, 4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  star.position.set(
    (Math.random() - 0.5) * 2e12,
    (Math.random() - 0.5) * 2e12,
    (Math.random() - 0.5) * 2e12
  );
  stars.add(star);
}
scene.add(stars);

let trajectoryLine = null;

async function simulate() {
  const neoId = document.getElementById("neo-id").value;
  const diameter = parseFloat(document.getElementById("diameter").value);
  const velocity = parseFloat(document.getElementById("velocity").value);

  const orbitResp = await fetch(`/api/orbit/${neoId}`);
  const orbitData = await orbitResp.json();

  const simResp = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ r0: orbitData.r0, v0: orbitData.v0 })
  });
  const sim = await simResp.json();

  if (trajectoryLine) scene.remove(trajectoryLine);
  const points = sim.trajectory.map(p => new THREE.Vector3(p.x, p.y, p.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  trajectoryLine = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffaa00 }));
  scene.add(trajectoryLine);

  if (sim.impact) {
    const impactResp = await fetch("/api/impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diameter, velocity,
        location: { lat: 0, lon: 0 } // mock for now
      })
    });
    const effects = await impactResp.json();
    document.getElementById("output").innerText = JSON.stringify(effects, null, 2);
  }
}

document.getElementById("run").onclick = simulate;

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 6 };
const cameraDistance = 2.5e10;

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    cameraAngle.theta -= deltaX * 0.005;
    cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngle.phi - deltaY * 0.005));

    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
});

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  if (!isDragging) {
    cameraAngle.theta += 0.001;
  }

  camera.position.x = cameraDistance * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
  camera.position.y = cameraDistance * Math.cos(cameraAngle.phi);
  camera.position.z = cameraDistance * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
  camera.lookAt(0, 0, 0);

  earth.rotation.y += 0.001;
  earthGlow.rotation.y += 0.001;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1e7, 1e13);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("scene3d").appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1.2);
scene.add(light);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(6.371e9, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0x2266ff, transparent: true, opacity: 0.6 })
);
scene.add(earth);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(7e9, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd00 })
);
scene.add(sun);

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

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

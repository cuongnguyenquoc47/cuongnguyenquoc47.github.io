/*-----------------------------------*\
  #background.js
  Three.js animated constellation background.
  Floating gold particles with connecting lines
  and a subtle mouse-driven parallax, matching
  the portfolio's dark + orange-yellow theme.
\*-----------------------------------*/

(function () {
  "use strict";

  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  // Respect users who prefer reduced motion: render a static field.
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Theme colors (match CSS custom properties).
  const GOLD = 0xffd766; // orange-yellow-crayola
  const AMBER = 0xe0a63a; // vegas-gold

  // Scale the particle count to screen size / device for performance.
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const PARTICLE_COUNT = isMobile ? 55 : 110;
  const LINK_DISTANCE = isMobile ? 26 : 30; // max distance to draw a line
  const FIELD = { x: 120, y: 70, z: 60 }; // half-extents of the drift volume

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 130;

  // --- Particles ---------------------------------------------------------
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * FIELD.x;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD.y;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * FIELD.z;

    velocities.push({
      x: (Math.random() * 2 - 1) * 0.05,
      y: (Math.random() * 2 - 1) * 0.05,
      z: (Math.random() * 2 - 1) * 0.05,
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  // Soft round sprite for each point.
  const sprite = createGlowTexture();
  const particleMaterial = new THREE.PointsMaterial({
    size: 3.2,
    map: sprite,
    color: GOLD,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(points);

  // --- Connecting lines --------------------------------------------------
  const maxLineVerts = PARTICLE_COUNT * PARTICLE_COUNT;
  const linePositions = new Float32Array(maxLineVerts * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(linePositions, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    color: AMBER,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // --- Theme awareness ---------------------------------------------------
  // Dark mode: bright gold glowing on black (additive).
  // Light mode: deeper amber network on white (normal blending).
  const DARK_AMBER = 0xb9770e;

  function applyThemeColors(theme) {
    if (theme === "light") {
      particleMaterial.color.setHex(DARK_AMBER);
      particleMaterial.blending = THREE.NormalBlending;
      particleMaterial.opacity = 0.85;
      lineMaterial.color.setHex(DARK_AMBER);
      lineMaterial.blending = THREE.NormalBlending;
      lineMaterial.opacity = 0.22;
    } else {
      particleMaterial.color.setHex(GOLD);
      particleMaterial.blending = THREE.AdditiveBlending;
      particleMaterial.opacity = 0.9;
      lineMaterial.color.setHex(AMBER);
      lineMaterial.blending = THREE.AdditiveBlending;
      lineMaterial.opacity = 0.18;
    }
    particleMaterial.needsUpdate = true;
    lineMaterial.needsUpdate = true;
  }

  // Initial theme (script.js persists the choice in localStorage).
  let initialTheme = "dark";
  try {
    initialTheme = localStorage.getItem("theme") || "dark";
  } catch (e) {
    /* localStorage may be unavailable */
  }
  applyThemeColors(initialTheme);

  window.addEventListener("themechange", function (e) {
    applyThemeColors(e.detail && e.detail.theme);
  });

  // --- Interaction (mouse parallax) -------------------------------------
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener(
    "pointermove",
    function (e) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  // --- Resize ------------------------------------------------------------
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", resize);
  resize();

  // --- Animation loop ----------------------------------------------------
  const linkDistSq = LINK_DISTANCE * LINK_DISTANCE;

  function updateLines() {
    let vertexPos = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = ix - positions[j * 3];
        const dy = iy - positions[j * 3 + 1];
        const dz = iz - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < linkDistSq) {
          linePositions[vertexPos++] = ix;
          linePositions[vertexPos++] = iy;
          linePositions[vertexPos++] = iz;
          linePositions[vertexPos++] = positions[j * 3];
          linePositions[vertexPos++] = positions[j * 3 + 1];
          linePositions[vertexPos++] = positions[j * 3 + 2];
        }
      }
    }
    lineGeometry.setDrawRange(0, vertexPos / 3);
    lineGeometry.attributes.position.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!reduceMotion) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const v = velocities[i];
        positions[i * 3] += v.x;
        positions[i * 3 + 1] += v.y;
        positions[i * 3 + 2] += v.z;

        // Bounce softly at the edges of the drift volume.
        if (positions[i * 3] > FIELD.x || positions[i * 3] < -FIELD.x)
          v.x *= -1;
        if (positions[i * 3 + 1] > FIELD.y || positions[i * 3 + 1] < -FIELD.y)
          v.y *= -1;
        if (positions[i * 3 + 2] > FIELD.z || positions[i * 3 + 2] < -FIELD.z)
          v.z *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Ease the camera toward the mouse for a gentle parallax.
      mouse.x += (target.x - mouse.x) * 0.03;
      mouse.y += (target.y - mouse.y) * 0.03;
      camera.position.x = mouse.x * 18;
      camera.position.y = -mouse.y * 12;
      camera.lookAt(scene.position);

      // Slow overall rotation for extra life.
      points.rotation.y += 0.0006;
      lines.rotation.y = points.rotation.y;
    }

    updateLines();
    renderer.render(scene, camera);
  }
  animate();

  // Build a soft radial-gradient texture used as the point sprite.
  function createGlowTexture() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,215,102,0.9)");
    g.addColorStop(1, "rgba(255,215,102,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }
})();

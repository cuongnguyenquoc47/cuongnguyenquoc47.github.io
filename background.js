/*-----------------------------------*\
  #background.js
  Three.js animated constellation background.
  A layered, colour-graded particle field with
  distance-faded links, soft bokeh depth, and a
  living camera — themed to the portfolio's
  dark + orange-yellow palette.
\*-----------------------------------*/

(function () {
  "use strict";

  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  // Respect users who prefer reduced motion: render a static field.
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // --- Colour palettes (warm gold family) --------------------------------
  const DARK_PARTICLE_COLORS = [0xffe9a8, 0xffd766, 0xf0a83c, 0xfff4d6];
  const LIGHT_PARTICLE_COLORS = [0xc98a1e, 0xb9770e, 0xa8630a, 0x8a5412];

  // Line endpoints fade from the base colour toward the background colour,
  // so distant links melt away in both themes.
  const THEME = {
    dark: {
      particles: DARK_PARTICLE_COLORS,
      lineBase: 0xe0a63a,
      lineBg: 0x000000,
      lineBlend: THREE.AdditiveBlending,
      lineOpacity: 0.9,
      particleBlend: THREE.AdditiveBlending,
      particleOpacity: 0.95,
      bokehColor: 0xffcf6a,
      bokehOpacity: 0.09,
    },
    light: {
      particles: LIGHT_PARTICLE_COLORS,
      lineBase: 0xb9770e,
      lineBg: 0xededed,
      lineBlend: THREE.NormalBlending,
      lineOpacity: 0.55,
      particleBlend: THREE.NormalBlending,
      particleOpacity: 0.85,
      bokehColor: 0xd9a24a,
      bokehOpacity: 0.06,
    },
  };

  let initialTheme = "dark";
  try {
    initialTheme = localStorage.getItem("theme") || "dark";
  } catch (e) {
    /* localStorage may be unavailable */
  }
  let theme = THEME[initialTheme] || THEME.dark;

  // Scale the particle count to screen size / device for performance.
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const PARTICLE_COUNT = isMobile ? 60 : 120;
  const BOKEH_COUNT = isMobile ? 8 : 16;
  const LINK_DISTANCE = isMobile ? 28 : 32; // max distance to draw a line
  const FIELD = { x: 130, y: 78, z: 70 }; // half-extents of the drift volume

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
    1000,
  );
  camera.position.z = 135;

  // Soft round sprite (white core → transparent) so vertex colours own the hue.
  const sprite = createGlowTexture();

  // --- Main particles ----------------------------------------------------
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const pColors = new Float32Array(PARTICLE_COUNT * 3);
  const colorPick = new Uint8Array(PARTICLE_COUNT); // palette index per particle
  const velocities = [];
  const tmpColor = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * FIELD.x;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD.y;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * FIELD.z;

    colorPick[i] = (Math.random() * theme.particles.length) | 0;

    velocities.push({
      x: (Math.random() * 2 - 1) * 0.045,
      y: (Math.random() * 2 - 1) * 0.045,
      z: (Math.random() * 2 - 1) * 0.045,
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 3.4,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: theme.particleOpacity,
    depthWrite: false,
    sizeAttenuation: true,
    blending: theme.particleBlend,
  });
  const points = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(points);

  // --- Connecting lines (distance-faded vertex colours) ------------------
  const maxSegments = PARTICLE_COUNT * 8; // cap segments for performance
  const linePositions = new Float32Array(maxSegments * 6);
  const lineColors = new Float32Array(maxSegments * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(linePositions, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  lineGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage),
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: theme.lineOpacity,
    blending: theme.lineBlend,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // --- Bokeh depth layer -------------------------------------------------
  const bokehPositions = new Float32Array(BOKEH_COUNT * 3);
  const bokehVel = [];
  for (let i = 0; i < BOKEH_COUNT; i++) {
    bokehPositions[i * 3] = (Math.random() * 2 - 1) * FIELD.x * 1.3;
    bokehPositions[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD.y * 1.3;
    bokehPositions[i * 3 + 2] = -Math.random() * 120 - 20; // sit behind
    bokehVel.push({
      x: (Math.random() * 2 - 1) * 0.02,
      y: (Math.random() * 2 - 1) * 0.02,
    });
  }
  const bokehGeometry = new THREE.BufferGeometry();
  bokehGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(bokehPositions, 3),
  );
  const bokehMaterial = new THREE.PointsMaterial({
    size: 46,
    map: sprite,
    color: theme.bokehColor,
    transparent: true,
    opacity: theme.bokehOpacity,
    depthWrite: false,
    sizeAttenuation: true,
    blending: theme.particleBlend,
  });
  const bokeh = new THREE.Points(bokehGeometry, bokehMaterial);
  scene.add(bokeh);

  // --- Theme application -------------------------------------------------
  function paintParticleColors() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      tmpColor.setHex(theme.particles[colorPick[i]]);
      pColors[i * 3] = tmpColor.r;
      pColors[i * 3 + 1] = tmpColor.g;
      pColors[i * 3 + 2] = tmpColor.b;
    }
    particleGeometry.attributes.color.needsUpdate = true;
  }

  const lineBaseColor = new THREE.Color();
  const lineBgColor = new THREE.Color();

  function applyTheme(name) {
    theme = THEME[name] || THEME.dark;
    lineBaseColor.setHex(theme.lineBase);
    lineBgColor.setHex(theme.lineBg);

    particleMaterial.blending = theme.particleBlend;
    particleMaterial.opacity = theme.particleOpacity;
    particleMaterial.needsUpdate = true;

    lineMaterial.blending = theme.lineBlend;
    lineMaterial.opacity = theme.lineOpacity;
    lineMaterial.needsUpdate = true;

    bokehMaterial.color.setHex(theme.bokehColor);
    bokehMaterial.opacity = theme.bokehOpacity;
    bokehMaterial.blending = theme.particleBlend;
    bokehMaterial.needsUpdate = true;

    paintParticleColors();
  }
  applyTheme(initialTheme);

  window.addEventListener("themechange", function (e) {
    applyTheme(e.detail && e.detail.theme);
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
    { passive: true },
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
  const linkDist = LINK_DISTANCE;
  const linkDistSq = linkDist * linkDist;
  let clock = 0;

  function updateLines() {
    let seg = 0;
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
          if (seg >= maxSegments) break;
          // fade: 0 when touching, 1 at the link threshold
          const fade = Math.sqrt(distSq) / linkDist;
          const t = fade * fade; // ease so mid-range links stay visible
          const r = lineBaseColor.r + (lineBgColor.r - lineBaseColor.r) * t;
          const g = lineBaseColor.g + (lineBgColor.g - lineBaseColor.g) * t;
          const b = lineBaseColor.b + (lineBgColor.b - lineBaseColor.b) * t;

          const p = seg * 6;
          linePositions[p] = ix;
          linePositions[p + 1] = iy;
          linePositions[p + 2] = iz;
          linePositions[p + 3] = positions[j * 3];
          linePositions[p + 4] = positions[j * 3 + 1];
          linePositions[p + 5] = positions[j * 3 + 2];

          lineColors[p] = r;
          lineColors[p + 1] = g;
          lineColors[p + 2] = b;
          lineColors[p + 3] = r;
          lineColors[p + 4] = g;
          lineColors[p + 5] = b;
          seg++;
        }
      }
    }
    lineGeometry.setDrawRange(0, seg * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!reduceMotion) {
      clock += 0.005;

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

      // Drift the bokeh even more slowly for depth parallax.
      for (let i = 0; i < BOKEH_COUNT; i++) {
        const v = bokehVel[i];
        bokehPositions[i * 3] += v.x;
        bokehPositions[i * 3 + 1] += v.y;
        const bx = bokehPositions[i * 3];
        const by = bokehPositions[i * 3 + 1];
        if (bx > FIELD.x * 1.4 || bx < -FIELD.x * 1.4) v.x *= -1;
        if (by > FIELD.y * 1.4 || by < -FIELD.y * 1.4) v.y *= -1;
      }
      bokehGeometry.attributes.position.needsUpdate = true;

      // Camera: autonomous drift blended with eased mouse parallax.
      mouse.x += (target.x - mouse.x) * 0.03;
      mouse.y += (target.y - mouse.y) * 0.03;
      camera.position.x = mouse.x * 20 + Math.sin(clock * 0.6) * 6;
      camera.position.y = -mouse.y * 14 + Math.cos(clock * 0.5) * 4;
      camera.lookAt(scene.position);

      // Slow counter-rotation of the two layers for extra life.
      points.rotation.y += 0.0006;
      lines.rotation.y = points.rotation.y;
      bokeh.rotation.y -= 0.0003;
    }

    updateLines();
    renderer.render(scene, camera);
  }
  animate();

  // Build a soft radial-gradient sprite (grayscale → transparent).
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
      size / 2,
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }
})();

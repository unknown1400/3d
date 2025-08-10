import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// 1. Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3f4f99);

// 2. Camera setup
const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 0.5, 5);

// 3. PointerLockControls
const controls = new PointerLockControls(camera, document.body);

// Only lock pointer if dialog is NOT visible
document.addEventListener('click', () => {
  const dialogOverlay = document.getElementById('dialogOverlay');
  const navDialog = document.getElementById('navDialog');
  if (dialogOverlay && dialogOverlay.style.display === 'none' && 
      navDialog && navDialog.style.display === 'none') {
    controls.lock();
  }
});

controls.addEventListener('lock', () => console.log('Pointer locked'));
controls.addEventListener('unlock', () => console.log('Pointer unlocked'));

// 4. Movement flags and physics
const move = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const gravity = 9.8;
let canJump = false;
let modelFloorY = 0;

// 5. Handle keyboard input
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyS': move.forward = true; break;
    case 'KeyW': move.backward = true; break;
    case 'KeyA': move.left = true; break;
    case 'KeyD': move.right = true; break;
    case 'Space':
      if (canJump) {
        velocity.y = 5;
        canJump = false;
      }
      break;
  }
});
document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyS': move.forward = false; break;
    case 'KeyW': move.backward = false; break;
    case 'KeyA': move.left = false; break;
    case 'KeyD': move.right = false; break;
  }
});

// 6. Renderer setup
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('threeCanvas'),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 7. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 8. Interactive computers array
let computers = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// 9. Load the GLB model
const loader = new GLTFLoader();
loader.load('/lab.glb', (gltf) => {
  scene.add(gltf.scene);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = new THREE.Vector3();
  box.getCenter(center);
  gltf.scene.position.y -= center.y;

  modelFloorY = box.min.y - center.y;
  camera.position.set(0, modelFloorY + 0.6, 0);
  
  // Add interactive computers after model loads
  addInteractiveComputers();
}, undefined, (error) => {
  console.error('Failed to load model', error);
});

// Function to add interactive computers
function addInteractiveComputers() {
  // Computer 1 - Habits
  const computer1 = createComputer(-3, modelFloorY + 0.8, -2, 'Habits');
  computers.push(computer1);
  
  // Computer 2 - Tasks
  const computer2 = createComputer(3, modelFloorY + 0.8, -2, 'Tasks');
  computers.push(computer2);
  
  // Computer 3 - Progress
  const computer3 = createComputer(-3, modelFloorY + 0.8, 2, 'Progress');
  computers.push(computer3);
  
  // Computer 4 - Routine
  const computer4 = createComputer(3, modelFloorY + 0.8, 2, 'Routine');
  computers.push(computer4);
}

// Function to create a computer
function createComputer(x, y, z, section) {
  // Computer base
  const computerGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.4);
  const computerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.9,
    shininess: 100
  });
  const computer = new THREE.Mesh(computerGeometry, computerMaterial);
  computer.position.set(x, y, z);
  computer.userData = { section: section, type: 'computer' };
  
  // Computer screen with different colors for each section
  const screenGeometry = new THREE.PlaneGeometry(0.6, 0.4);
  let screenColor = 0x00ff00; // Default green
  
  switch(section) {
    case 'Habits': screenColor = 0xff6b6b; break; // Red
    case 'Tasks': screenColor = 0x4ecdc4; break;  // Cyan
    case 'Progress': screenColor = 0x45b7d1; break; // Blue
    case 'Routine': screenColor = 0x96ceb4; break; // Green
  }
  
  const screenMaterial = new THREE.MeshPhongMaterial({ 
    color: screenColor,
    transparent: true,
    opacity: 0.8,
    emissive: screenColor,
    emissiveIntensity: 0.2
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 0.1, 0.21);
  screen.userData = { section: section, type: 'screen' };
  computer.add(screen);
  
  // Computer stand
  const standGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
  const standMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x666666,
    shininess: 50
  });
  const stand = new THREE.Mesh(standGeometry, standMaterial);
  stand.position.set(0, -0.45, 0);
  computer.add(stand);
  
  // Add keyboard
  const keyboardGeometry = new THREE.BoxGeometry(0.7, 0.05, 0.3);
  const keyboardMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
  const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
  keyboard.position.set(0, -0.1, -0.35);
  computer.add(keyboard);
  
  // Add mouse
  const mouseGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.25);
  const mouseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  const mouse = new THREE.Mesh(mouseGeometry, mouseMaterial);
  mouse.position.set(0.3, -0.1, -0.35);
  computer.add(mouse);
  
  // Add section label
  const labelGeometry = new THREE.PlaneGeometry(0.5, 0.1);
  const labelMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    transparent: true,
    opacity: 0.8
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, -0.6, 0);
  computer.add(label);
  
  scene.add(computer);
  return computer;
}

// 10. Mouse click and hover handling for computers
let hoveredComputer = null;

document.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    if (object.userData && object.userData.type === 'computer') {
      showSectionDialog(object.userData.section.toLowerCase());
      break;
    }
  }
});

// Mouse move for hover effects
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let foundComputer = null;
  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object;
    if (object.userData && object.userData.type === 'computer') {
      foundComputer = object;
      break;
    }
  }
  
      // Update hover state
    if (foundComputer !== hoveredComputer) {
      if (hoveredComputer) {
        // Remove glow and reset scale from previous computer
        hoveredComputer.material.emissive.setHex(0x000000);
        hoveredComputer.scale.set(1, 1, 1);
        // Reset screen emissive
        hoveredComputer.children.forEach(child => {
          if (child.userData && child.userData.type === 'screen') {
            child.material.emissiveIntensity = 0.2;
          }
        });
      }
      if (foundComputer) {
        // Add glow and scale to new computer
        foundComputer.material.emissive.setHex(0x00ff00);
        foundComputer.scale.set(1.1, 1.1, 1.1);
        // Increase screen brightness
        foundComputer.children.forEach(child => {
          if (child.userData && child.userData.type === 'screen') {
            child.material.emissiveIntensity = 0.8;
          }
        });
        
        // Play hover sound
        if (window.playComputerHoverSound) {
          window.playComputerHoverSound();
        }
      }
      hoveredComputer = foundComputer;
    }
});

// Function to show navigation dialog
function showNavigationDialog(section) {
  const navDialog = document.getElementById('navDialog');
  const navTitle = document.getElementById('navTitle');
  const navButtons = document.getElementById('navButtons');
  
  // Section descriptions and icons
  const sectionInfo = {
    'Habits': {
      icon: '🎯',
      description: 'Track and build your daily habits. Create new habits, monitor your progress, and maintain consistency in your routine.'
    },
    'Tasks': {
      icon: '📋',
      description: 'Manage your to-do list with time tracking. Add tasks, set time estimates, and visualize your progress with charts.'
    },
    'Progress': {
      icon: '📊',
      description: 'View your overall progress and achievements. See detailed analytics and track your journey towards your goals.'
    },
    'Routine': {
      icon: '⏰',
      description: 'Plan and organize your daily routine. Set up schedules, timers, and manage your time effectively.'
    }
  };
  
  const info = sectionInfo[section] || { icon: '💻', description: 'Access this section of your routine tracker.' };
  
  navTitle.innerHTML = `${info.icon} Access ${section}`;
  
  // Add description if element exists
  const navDescription = document.getElementById('navDescription');
  if (navDescription) {
    navDescription.textContent = info.description;
  }
  
  navButtons.innerHTML = `
    <button onclick="openSection('${section.toLowerCase()}')" class="nav-btn">
      <span class="section-icon">🚀</span>Open ${section}
    </button>
    <button onclick="closeNavDialog()" class="nav-btn cancel">
      <span class="section-icon">❌</span>Cancel
    </button>
  `;
  
  navDialog.style.display = 'flex';
  controls.unlock();
  
  // Play click sound
  if (window.playComputerClickSound) {
    window.playComputerClickSound();
  }
}

// Function to open a section
function openSection(section) {
  const sectionUrls = {
    'habits': '../Habit.html',
    'tasks': '../Tasks.html',
    'progress': '../Progress.html',
    'routine': '../Routine.html'
  };
  
  if (sectionUrls[section]) {
    window.open(sectionUrls[section], '_blank');
  }
  
  closeNavDialog();
}

// Function to close navigation dialog
function closeNavDialog() {
  const navDialog = document.getElementById('navDialog');
  navDialog.style.display = 'none';
  controls.lock();
}

// 11. Create surrounding walls
const wallThickness = 0.5;
const wallHeight = 10;

const walls = [
  new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 10), new THREE.MeshBasicMaterial({ color: 0x888888 })),
  new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 10), new THREE.MeshBasicMaterial({ color: 0x888888 })),
  new THREE.Mesh(new THREE.BoxGeometry(10, wallHeight, wallThickness), new THREE.MeshBasicMaterial({ color: 0x888888 })),
  new THREE.Mesh(new THREE.BoxGeometry(10, wallHeight, wallThickness), new THREE.MeshBasicMaterial({ color: 0x888888 })),
];

walls[0].position.set(-5, wallHeight / 2, 0);
walls[1].position.set(5, wallHeight / 2, 0);
walls[2].position.set(0, wallHeight / 2, -5);
walls[3].position.set(0, wallHeight / 2, 5);

walls.forEach(wall => scene.add(wall));

// 12. Animate
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Gravity
  velocity.y -= gravity * delta;

  // Damping
  velocity.x -= velocity.x * 10 * delta;
  velocity.z -= velocity.z * 10 * delta;

  // Input direction
  direction.z = Number(move.forward) - Number(move.backward);
  direction.x = Number(move.right) - Number(move.left);
  direction.normalize();

  const speed = 25;
  if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
  if (move.left || move.right) velocity.x -= direction.x * speed * delta;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  const prevPosition = camera.position.clone();

  camera.position.addScaledVector(forward, velocity.z * delta);
  camera.position.addScaledVector(right, velocity.x * delta);
  camera.position.y += velocity.y * delta;

  // Floor collision
  if (camera.position.y < modelFloorY + 0.6) {
    velocity.y = 0;
    camera.position.y = modelFloorY + 0.6;
    canJump = true;
  }

  // Wall collision
  const box = new THREE.Box3().setFromCenterAndSize(
    camera.position.clone(),
    new THREE.Vector3(0.5, 1.8, 0.5)
  );

  walls.forEach(wall => {
    const wallBox = new THREE.Box3().setFromObject(wall);
    if (box.intersectsBox(wallBox)) {
      camera.position.copy(prevPosition);
    }
  });

  renderer.render(scene, camera);
}
animate();

// 13. Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Dialog functionality
const dialogLines = [
  "Welcome! I am the Professor of this world.",
  "People call me the 3D Master!",
  "Before we begin, may I know your name?",
  "Can you tell me how you look like ",
  "Thank you, {name}! Let's begin your journey!"
];

let currentLine = 0;
let playerName = '';
let typingIndex = 0;
let isTyping = false;

const dialogText = document.getElementById('dialogText');
const nameInput = document.getElementById('nameInput');
const nextButton = document.getElementById('nextButton');
const dialogOverlay = document.getElementById('dialogOverlay');

// Function to type out dialog text
function typeLine(text, callback) {
  isTyping = true;
  dialogText.innerText = '';
  typingIndex = 0;
  nextButton.disabled = true;

  function typeChar() {
    if (typingIndex < text.length) {
      const char = text.charAt(typingIndex++);
      dialogText.innerHTML += char === ' ' ? '&nbsp;' : char;

      const delay = char === ' ' ? 80 : 40;
      setTimeout(typeChar, delay);
    } else {
      isTyping = false;
      nextButton.disabled = false;
      if (callback) callback();
    }
  }

  typeChar();
}

// Function to show the next line of dialog
function showNextLine() {
  if (isTyping) return;

  if (currentLine === 2) {
    nameInput.style.display = 'block';
    if (!nameInput.value.trim()) return;
    playerName = nameInput.value.trim();
  }
  if (currentLine === 2) {
    const avatarSelect = document.getElementById('avatar');
    avatarSelect.style.display = 'block';
    const selectedAvatar = avatarSelect.value;
    console.log(`Selected Avatar: ${selectedAvatar}`);
  }

  currentLine++;

  if (currentLine >= dialogLines.length) {
    dialogOverlay.style.display = 'none';
    document.getElementById('threeCanvas').style.display = 'block';

    controls.lock(); // lock pointer only after dialog ends
    startGame();
    return;
  }

  nameInput.style.display = currentLine === 2 ? 'block' : 'none';
  const line = dialogLines[currentLine].replace('{name}', playerName);
  typeLine(line);
}

// Button and Enter key listener
nextButton.addEventListener('click', showNextLine);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') showNextLine();
});

// Initial dialog start
typeLine(dialogLines[0]);

function startGame() {
  console.log("Game started!");
  // Show instructions
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.style.display = 'block';
    // Hide instructions after 10 seconds
    setTimeout(() => {
      instructions.style.display = 'none';
    }, 10000);
  }
  
  // Show Pokemon Fire Red style dropdown arrow
  showRoutineTrackerArrow();
}

// Add Pokemon Fire Red style dropdown arrow functionality
function showRoutineTrackerArrow() {
  // Create dropdown arrow if it doesn't exist
  if (!document.getElementById('routineTrackerArrow')) {
    const arrow = document.createElement('div');
    arrow.id = 'routineTrackerArrow';
    arrow.innerHTML = `
      <div class="arrow-icon">▶</div>
      <div class="arrow-text">ROUTINE</div>
    `;
    arrow.onclick = toggleRoutineTracker;
    document.body.appendChild(arrow);
  }
  
  // Create routine tracker panel if it doesn't exist
  if (!document.getElementById('routineTrackerPanel')) {
    const panel = document.createElement('div');
    panel.id = 'routineTrackerPanel';
    panel.innerHTML = `
      <div class="routine-header">
        📱 ROUTINE TRACKER
        <div class="user-name">Welcome, ${playerName || 'Trainer'}!</div>
      </div>
      <div class="routine-content">
        <div class="routine-section" onclick="showSectionDialog('habits')">
          <div class="section-icon">🎯</div>
          <div class="section-info">
            <h4>Habits</h4>
            <p>Track daily habits</p>
          </div>
        </div>
        <div class="routine-section" onclick="showSectionDialog('tasks')">
          <div class="section-icon">📋</div>
          <div class="section-info">
            <h4>Tasks</h4>
            <p>Manage to-do list</p>
          </div>
        </div>
        <div class="routine-section" onclick="showSectionDialog('progress')">
          <div class="section-icon">📊</div>
          <div class="section-info">
            <h4>Progress</h4>
            <p>View achievements</p>
          </div>
        </div>
        <div class="routine-section" onclick="showSectionDialog('routine')">
          <div class="section-icon">⏰</div>
          <div class="section-info">
            <h4>Routine</h4>
            <p>Plan daily schedule</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  }
}



// Toggle routine tracker panel
function toggleRoutineTracker() {
  const arrow = document.getElementById('routineTrackerArrow');
  const panel = document.getElementById('routineTrackerPanel');
  
  if (arrow && panel) {
    arrow.classList.toggle('expanded');
    panel.classList.toggle('expanded');
  }
}

// Show section dialog overlay
function showSectionDialog(section) {
  const sectionUrls = {
    'habits': '../Habits.html',
    'tasks': '../Tasks.html',
    'progress': '../Progress.html',
    'routine': '../Routine.html'
  };
  
  const info = {
    'habits': {
      title: '🎯 Habits Tracker',
      description: 'Track and build your daily habits. Create new habits, monitor your progress, and maintain consistency in your routine.',
      features: ['Create new habits', 'Track daily progress', 'View habit streaks', 'Set reminders']
    },
    'tasks': {
      title: '📋 Task Manager',
      description: 'Manage your to-do list with time tracking. Add tasks, set time estimates, and visualize your progress with charts.',
      features: ['Add new tasks', 'Set time estimates', 'Track completion', 'View analytics']
    },
    'progress': {
      title: '📊 Progress Dashboard',
      description: 'View your overall progress and achievements. See detailed analytics and track your journey towards your goals.',
      features: ['View statistics', 'Track achievements', 'See trends', 'Export reports']
    },
    'routine': {
      title: '⏰ Routine Planner',
      description: 'Plan and organize your daily routine. Set up schedules, timers, and manage your time effectively.',
      features: ['Create schedules', 'Set timers', 'Manage time blocks', 'Track efficiency']
    }
  };
  
  const sectionInfo = info[section] || { title: 'Section', description: 'Access this section.', features: [] };
  
  // Create section dialog if it doesn't exist
  if (!document.getElementById('sectionDialog')) {
    const sectionDialog = document.createElement('div');
    sectionDialog.id = 'sectionDialog';
    sectionDialog.innerHTML = `
      <div class="section-dialog-overlay">
        <div class="section-dialog-content">
          <div class="section-dialog-header">
            <h2 id="sectionDialogTitle">${sectionInfo.title}</h2>
            <button class="section-dialog-close" onclick="closeSectionDialog()">✕</button>
          </div>
          <div class="section-dialog-body">
            <iframe id="sectionDialogIframe" src="" frameborder="0"></iframe>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sectionDialog);
  }
  
  // Update dialog content
  const sectionDialog = document.getElementById('sectionDialog');
  const sectionDialogTitle = document.getElementById('sectionDialogTitle');
  const sectionDialogIframe = document.getElementById('sectionDialogIframe');
  
  sectionDialogTitle.innerHTML = sectionInfo.title;
  sectionDialogIframe.src = sectionUrls[section];
  
  // Show the dialog
  sectionDialog.style.display = 'flex';
  controls.unlock();
  
  // Play click sound
  if (window.playComputerClickSound) {
    window.playComputerClickSound();
  }
  
  // Add click event listener to close button
  const closeButton = sectionDialog.querySelector('.section-dialog-close');
  if (closeButton) {
    closeButton.onclick = function() {
      closeSectionDialog();
    };
  }
  
  // Add click event listener to close dialog when clicking outside
  const overlay = sectionDialog.querySelector('.section-dialog-overlay');
  if (overlay) {
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        closeSectionDialog();
      }
    };
  }
  
  // Add escape key listener to close dialog
  const escapeListener = function(e) {
    if (e.key === 'Escape') {
      closeSectionDialog();
      document.removeEventListener('keydown', escapeListener);
    }
  };
  document.addEventListener('keydown', escapeListener);
}

// Close section dialog
function closeSectionDialog() {
  const sectionDialog = document.getElementById('sectionDialog');
  if (sectionDialog) {
    sectionDialog.style.display = 'none';
    controls.lock();
  }
  
  // Also close navigation dialog if it's open
  const navDialog = document.getElementById('navDialog');
  if (navDialog) {
    navDialog.style.display = 'none';
  }
}



// Make functions globally available
window.openSection = openSection;
window.closeNavDialog = closeNavDialog;
window.showSectionDialog = showSectionDialog;
window.openSectionInNewTab = openSectionInNewTab;
window.closeSectionDialog = closeSectionDialog;
window.toggleRoutineTracker = toggleRoutineTracker;
window.showRoutineTrackerArrow = showRoutineTrackerArrow;

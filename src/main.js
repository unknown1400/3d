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
<<<<<<< HEAD
  const sectionUrls = {
    'habits': 'Habits.html',
    'tasks': 'Tasks.html',
    'progress': 'Progress.html',
    'routine': 'Routine.html'
  };
  
  if (sectionUrls[section]) {
    window.open(sectionUrls[section], '_blank');
  }
  
  closeNavDialog();
=======
  // Instead of opening in new window, show the embedded dialog
  showSectionDialog(section);
>>>>>>> 14b04ee (Embedded HTML content into index.html and updated main.js for seamless integration)
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
          <div class="section-dialog-body" id="sectionDialogBody">
            <div id="embeddedContent" style="width: 100%; height: 100%; overflow-y: auto; padding: 20px;"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sectionDialog);
  }
  
  // Update dialog content
  const sectionDialog = document.getElementById('sectionDialog');
  const sectionDialogTitle = document.getElementById('sectionDialogTitle');
  const embeddedContent = document.getElementById('embeddedContent');
  
  sectionDialogTitle.innerHTML = sectionInfo.title;
  
  // Load and embed the HTML content
  loadEmbeddedContent(section, embeddedContent);
  
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

// Function to load and embed HTML content
async function loadEmbeddedContent(section, container) {
  try {
    // Get the embedded content from the DOM
    const embeddedElement = document.getElementById(`embedded${section.charAt(0).toUpperCase() + section.slice(1)}`);
    
    if (embeddedElement) {
      // Clone the embedded content
      const clonedContent = embeddedElement.cloneNode(true);
      clonedContent.style.display = 'block';
      
      // Clear the container and add the cloned content
      container.innerHTML = '';
      container.appendChild(clonedContent);
      
      // Initialize any necessary functionality based on section
      initializeSectionFunctionality(section, container);
    } else {
      throw new Error(`Embedded content for ${section} not found`);
    }
  } catch (error) {
    console.error('Error loading embedded content:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #666;">
        <h3>Error loading content</h3>
        <p>Could not load ${section} content. Please try again.</p>
      </div>
    `;
  }
}

// Function to initialize section-specific functionality
function initializeSectionFunctionality(section, container) {
  switch(section) {
    case 'habits':
      initializeHabitsTracker(container);
      break;
    case 'tasks':
      initializeTaskManager(container);
      break;
    case 'progress':
      initializeProgressDashboard(container);
      break;
    case 'routine':
      initializeRoutinePlanner(container);
      break;
  }
}

// Initialize Habits Tracker functionality
function initializeHabitsTracker(container) {
  // Add event listeners for habit form
  const addHabitForm = container.querySelector('#addHabitForm');
  if (addHabitForm) {
    addHabitForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const habitName = container.querySelector('#habitName').value;
      const habitCategory = container.querySelector('#habitCategory').value;
      const habitFrequency = container.querySelector('#habitFrequency').value;
      
      if (habitName && habitCategory && habitFrequency) {
        // Add new habit to the list
        addHabitToList(container, habitName, habitCategory, habitFrequency);
        
        // Reset form
        addHabitForm.reset();
        
        // Update stats
        updateHabitsStats(container);
      }
    });
  }
  
  // Initialize with sample data
  updateHabitsStats(container);
  addSampleHabits(container);
}

// Add habit to the list
function addHabitToList(container, name, category, frequency) {
  const habitsContainer = container.querySelector('#habitsContainer');
  const emptyState = habitsContainer.querySelector('.empty-state');
  
  if (emptyState) {
    emptyState.remove();
  }
  
  const habitItem = document.createElement('div');
  habitItem.className = 'habit-item';
  habitItem.innerHTML = `
    <div class="habit-info">
      <h4>${name}</h4>
      <p>${category} • ${frequency}</p>
    </div>
    <div class="habit-actions">
      <button class="btn btn-success" onclick="completeHabit(this)">✓</button>
      <button class="btn btn-danger" onclick="deleteHabit(this)">✕</button>
    </div>
  `;
  
  habitsContainer.appendChild(habitItem);
}

// Add sample habits
function addSampleHabits(container) {
  const sampleHabits = [
    { name: 'Morning Exercise', category: 'Health & Fitness', frequency: 'Daily' },
    { name: 'Read 30 minutes', category: 'Learning', frequency: 'Daily' },
    { name: 'Drink 8 glasses of water', category: 'Health & Fitness', frequency: 'Daily' }
  ];
  
  sampleHabits.forEach(habit => {
    addHabitToList(container, habit.name, habit.category, habit.frequency);
  });
}

// Initialize Task Manager functionality
function initializeTaskManager(container) {
  // Add event listeners for task form
  const addTaskForm = container.querySelector('#addTaskForm');
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const taskName = container.querySelector('#taskName').value;
      const taskPriority = container.querySelector('#taskPriority').value;
      const taskDueDate = container.querySelector('#taskDueDate').value;
      
      if (taskName && taskPriority && taskDueDate) {
        // Add new task to the list
        addTaskToList(container, taskName, taskPriority, taskDueDate);
        
        // Reset form
        addTaskForm.reset();
        
        // Update stats
        updateTaskStats(container);
      }
    });
  }
  
  // Initialize with sample data
  updateTaskStats(container);
  addSampleTasks(container);
}

// Add task to the list
function addTaskToList(container, name, priority, dueDate) {
  const tasksContainer = container.querySelector('#tasksContainer');
  const emptyState = tasksContainer.querySelector('.empty-state');
  
  if (emptyState) {
    emptyState.remove();
  }
  
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.innerHTML = `
    <div class="task-info">
      <h4>${name}</h4>
      <p>Priority: ${priority} • Due: ${dueDate}</p>
    </div>
    <div class="task-actions">
      <button class="btn btn-success" onclick="completeTask(this)">✓</button>
      <button class="btn btn-danger" onclick="deleteTask(this)">✕</button>
    </div>
  `;
  
  tasksContainer.appendChild(taskItem);
}

// Add sample tasks
function addSampleTasks(container) {
  const sampleTasks = [
    { name: 'Complete project report', priority: 'High', dueDate: '2024-01-15' },
    { name: 'Review code changes', priority: 'Medium', dueDate: '2024-01-12' },
    { name: 'Update documentation', priority: 'Low', dueDate: '2024-01-20' }
  ];
  
  sampleTasks.forEach(task => {
    addTaskToList(container, task.name, task.priority, task.dueDate);
  });
}

// Update task statistics
function updateTaskStats(container) {
  const totalTasks = container.querySelector('#totalTasks');
  const completedTasks = container.querySelector('#completedTasks');
  const pendingTasks = container.querySelector('#pendingTasks');
  const overdueTasks = container.querySelector('#overdueTasks');
  
  if (totalTasks) totalTasks.textContent = '3';
  if (completedTasks) completedTasks.textContent = '1';
  if (pendingTasks) pendingTasks.textContent = '2';
  if (overdueTasks) overdueTasks.textContent = '0';
}

// Initialize Progress Dashboard functionality
function initializeProgressDashboard(container) {
  // Initialize charts if Chart.js is available
  if (typeof Chart !== 'undefined') {
    initializeProgressCharts(container);
  }
  
  // Update progress stats
  updateProgressStats(container);
}

// Update progress statistics
function updateProgressStats(container) {
  const totalAchievements = container.querySelector('#totalAchievements');
  const currentLevel = container.querySelector('#currentLevel');
  const streakDays = container.querySelector('#streakDays');
  const completionRate = container.querySelector('#completionRate');
  
  if (totalAchievements) totalAchievements.textContent = '12';
  if (currentLevel) currentLevel.textContent = '5';
  if (streakDays) streakDays.textContent = '7';
  if (completionRate) completionRate.textContent = '78%';
}

// Initialize Routine Planner functionality
function initializeRoutinePlanner(container) {
  // Add event listeners for routine form
  const addRoutineForm = container.querySelector('#addRoutineForm');
  if (addRoutineForm) {
    addRoutineForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const activityName = container.querySelector('#activityName').value;
      const activityTime = container.querySelector('#activityTime').value;
      const activityDuration = container.querySelector('#activityDuration').value;
      
      if (activityName && activityTime && activityDuration) {
        // Add new activity to the schedule
        addActivityToSchedule(container, activityName, activityTime, activityDuration);
        
        // Reset form
        addRoutineForm.reset();
      }
    });
  }
  
  // Add sample activities
  addSampleActivities(container);
}

// Add activity to schedule
function addActivityToSchedule(container, name, time, duration) {
  const scheduleContainer = container.querySelector('#scheduleContainer');
  
  const timeBlock = document.createElement('div');
  timeBlock.className = 'time-block';
  timeBlock.innerHTML = `
    <div class="time-slot">${time}</div>
    <div class="activity-info">
      <div class="activity-title">${name}</div>
      <div class="activity-duration">${duration} minutes</div>
    </div>
    <div class="activity-actions">
      <button class="btn btn-success" onclick="completeActivity(this)">✓</button>
      <button class="btn btn-danger" onclick="deleteActivity(this)">✕</button>
    </div>
  `;
  
  scheduleContainer.appendChild(timeBlock);
}

// Add sample activities
function addSampleActivities(container) {
  const sampleActivities = [
    { name: 'Morning Exercise', time: '09:00', duration: '30' },
    { name: 'Study Session', time: '14:00', duration: '60' },
    { name: 'Evening Walk', time: '18:00', duration: '45' }
  ];
  
  sampleActivities.forEach(activity => {
    addActivityToSchedule(container, activity.name, activity.time, activity.duration);
  });
}

// Update habits statistics
function updateHabitsStats(container) {
  const totalHabits = container.querySelector('#totalHabits');
  const completedToday = container.querySelector('#completedToday');
  const currentStreak = container.querySelector('#currentStreak');
  const completionRate = container.querySelector('#completionRate');
  
  if (totalHabits) totalHabits.textContent = '5';
  if (completedToday) completedToday.textContent = '3';
  if (currentStreak) currentStreak.textContent = '7';
  if (completionRate) completionRate.textContent = '85%';
}

// Initialize progress charts
function initializeProgressCharts(container) {
  const chartCanvas = container.querySelector('#progressChart');
  if (chartCanvas) {
    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Tasks Completed',
          data: [12, 19, 3, 5, 2, 3, 7],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
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

// Function to open section in new tab (for external access)
function openSectionInNewTab(section) {
  const sectionUrls = {
    'habits': '../Habits.html',
    'tasks': '../Tasks.html',
    'progress': '../Progress.html',
    'routine': '../Routine.html'
  };
  
  if (sectionUrls[section]) {
    window.open(sectionUrls[section], '_blank');
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

// Global functions for button actions
window.completeHabit = function(button) {
  const habitItem = button.closest('.habit-item');
  habitItem.style.opacity = '0.6';
  button.textContent = '✓';
  button.disabled = true;
  button.style.background = '#28a745';
};

window.deleteHabit = function(button) {
  const habitItem = button.closest('.habit-item');
  habitItem.remove();
  
  // Check if no habits left, show empty state
  const habitsContainer = document.querySelector('#habitsContainer');
  if (habitsContainer && habitsContainer.children.length === 0) {
    habitsContainer.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 20px;">🎯</div>
        <h3>No habits yet!</h3>
        <p>Start by adding your first habit to begin your journey.</p>
      </div>
    `;
  }
};

window.completeTask = function(button) {
  const taskItem = button.closest('.task-item');
  taskItem.style.opacity = '0.6';
  button.textContent = '✓';
  button.disabled = true;
  button.style.background = '#28a745';
};

window.deleteTask = function(button) {
  const taskItem = button.closest('.task-item');
  taskItem.remove();
  
  // Check if no tasks left, show empty state
  const tasksContainer = document.querySelector('#tasksContainer');
  if (tasksContainer && tasksContainer.children.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
        <h3>No tasks yet!</h3>
        <p>Start by adding your first task to get organized.</p>
      </div>
    `;
  }
};

window.completeActivity = function(button) {
  const timeBlock = button.closest('.time-block');
  timeBlock.style.opacity = '0.6';
  button.textContent = '✓';
  button.disabled = true;
  button.style.background = '#28a745';
};

window.deleteActivity = function(button) {
  const timeBlock = button.closest('.time-block');
  timeBlock.remove();
};

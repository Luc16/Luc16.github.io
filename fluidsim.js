
// --- 1. Set up the Canvas and Mouse Tracking ---
const canvas = document.getElementById('glcanvas');
const uiX = document.getElementById('mouseX');
const uiY = document.getElementById('mouseY');
const uiState = document.getElementById('mouseState');
const info = document.getElementById('info');

const isMobilePhone = window.innerWidth <= 768; 

// Resize canvas to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
width = canvas.width;
height = canvas.height;

let isPressed = false;
let rotationAngle = 0;
let mouse = { x: 0, y: 0 };
let minDim = Math.min(width, height);
let s1 = 0.3*minDim;
let s2 = 0.2*minDim;
let acc = { x: 0, y: 0, z: 0 };
let prevAcc = { x: 0, y: 0, z: 0 };
let hasAccelerometer = false;


function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    let tempAcc = event.accelerationIncludingGravity;
    if (Math.abs(acc.x - tempAcc.x) > 1 || Math.abs(acc.y - tempAcc.y) > 1) {
      acc.x = event.accelerationIncludingGravity.x;
      acc.y = event.accelerationIncludingGravity.y;
    }
      // Significant change detected, you can handle it here if needed
  }
}

if (window.DeviceMotionEvent && isMobilePhone) {
  window.addEventListener('devicemotion', handleMotion);
  info.innerText = "Accelerometer supported. Move your device to control the triangle.";
  hasAccelerometer = true;
} else {
  console.log("Accelerometer not supported on this device.");
}

// Listen for mouse movement
window.addEventListener('mousemove', (e) => {
  uiX.innerText = e.clientX;
  uiY.innerText = e.clientY;
  mouse.x = e.clientX; // Normalize to [-1, 1]
  mouse.y = e.clientY; // Normalize to [-1, 1] and invert Y
});

// Listen for mouse click (down)
window.addEventListener('mousedown', () => {
  isPressed = true;
  uiState.innerText = 'Following!';
  uiState.style.color = '#00dc82';
});

// Listen for mouse release (up)
window.addEventListener('mouseup', () => {
  isPressed = false;
  uiState.innerText = 'Resting';
  uiState.style.color = '#fff';
});

// Handle window resizing smoothly
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = canvas.width;
  height = canvas.height;

  minDim = Math.min(width, height);
  // --- 4. Set up the Triangle Geometry ---

  s1 = 0.3*minDim;
  s2 = 0.2*minDim;
  gl.viewport(0, 0, canvas.width, canvas.height);
});




// --- 2. Initialize WebGL ---
const gl = canvas.getContext('webgl');
if (!gl) {
  alert('Your browser does not support WebGL.');
}

// --- 3. Create Shaders ---
const vsSource = `
    attribute vec2 a_position;
    uniform vec2 u_windowSize;

void main() {
    // Flip Y here to match WebGL's bottom-left origin
    vec2 normalized = vec2(a_position.x / u_windowSize.x, 1.0 - (a_position.y / u_windowSize.y));
    gl_Position = vec4(normalized * 2.0 - 1.0, 0.0, 1.0);
}
`;

const fsSource = `
    void main() {
        gl_FragColor = vec4(0.0, 0.86, 0.51, 1.0); 
    }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

console.log('WebGL program linked successfully. Window size:', width, height);

const vertices = new Float32Array([
  width/2             , height/2 + s1, 
  width/2 - s1, height/2 - s2, 
  width/2 + s1, height/2 - s2  
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const windoSizeLoc = gl.getUniformLocation(program, 'u_windowSize');

function handleMotion(event) {
  const accNow = event.accelerationIncludingGravity;
  if (!accNow) return;
  acc = accNow;
}

function updateTriangle(dir, center) {
  len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

  let unitDir = {
    x: dir.x/len,
    y: dir.y/len
  };

  vertices[0] = unitDir.x * s1 + center.x; 
  vertices[1] = unitDir.y * s1 + center.y;
  let perpDir = { x: -unitDir.y, y: unitDir.x };
  vertices[2] = perpDir.x * s1 - s2*unitDir.x + center.x; 
  vertices[3] = perpDir.y * s1 - s2*unitDir.y + center.y;
  vertices[4] = -perpDir.x * s1 - s2*unitDir.x + center.x; 
  vertices[5] = -perpDir.y * s1 - s2*unitDir.y + center.y;

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

// --- 5. The Render Loop ---
function render() {
  center = { x: width/2, y: height/2 };
  if (isPressed) {
    mouseAdjX = mouse.x - center.x;
    mouseAdjY = mouse.y - center.y;
    updateTriangle({ x: mouseAdjX, y: mouseAdjY }, center);
  } else if (hasAccelerometer) {

    updateTriangle({x: -acc.x, y: acc.y}, center);
  }

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(windoSizeLoc, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(render);
}

// Start the loop
render();

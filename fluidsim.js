// --- 1. Set up the Canvas and Mouse Tracking ---
const canvas = document.getElementById('glcanvas');
const uiX = document.getElementById('mouseX');
const uiY = document.getElementById('mouseY');
const uiState = document.getElementById('mouseState');

// Resize canvas to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isPressed = false;
let rotationAngle = 0;
let mouseX = 0;
let mouseY = 0;

// Listen for mouse movement
window.addEventListener('mousemove', (e) => {
  uiX.innerText = e.clientX;
  uiY.innerText = e.clientY;
  mouseX = e.clientX / window.innerWidth * 2 - 1; // Normalize to [-1, 1]
  mouseY = -(e.clientY / window.innerHeight * 2 - 1); // Normalize to [-1, 1] and invert Y
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
    uniform float u_rotation;

    void main() {
        float c = cos(u_rotation);
        float s = sin(u_rotation);

        mat2 rot = mat2(c, s, -s, c);

        gl_Position = vec4(rot * a_position, 0.0, 1.0);
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


// --- 4. Set up the Triangle Geometry ---
const vertices = new Float32Array([
  0.0,  0.4, 
  -0.4, -0.3, 
  0.4, -0.3  
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const rotationLocation = gl.getUniformLocation(program, 'u_rotation');


// --- 5. The Render Loop ---
function render() {
  if (isPressed) {
    let len = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    let unitX = mouseX / len;
    let unitY = mouseY / len;
    vertices[0] = unitX * 0.4;
    vertices[1] = unitY * 0.4;
    let perpX = -unitY;
    let perpY = unitX;
    vertices[2] = perpX * 0.4 - 0.3*unitX;
    vertices[3] = perpY * 0.4 - 0.3*unitY;
    vertices[4] = -perpX * 0.4 - 0.3*unitX;
    vertices[5] = -perpY * 0.4 - 0.3*unitY;
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform1f(rotationLocation, rotationAngle);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(render);
}

// Start the loop
render();

let debug = 0; // set to 1 to use primary colors, 0 for random colors

const resetButton = document.getElementById('reset-button');
const nextButton = document.getElementById('next-button');

const targetColorElement = document.getElementById("target-color");
const resultColorElement = document.getElementById("result");
var resultColor = null;

function Subcolor(color, count) {
  this.color = color;
  this.count = count;
  this.element = document.createElement("div");
  this.element.className = "color";
  this.element.style.backgroundColor = color;
  this.element.innerHTML = `<span>${0}</span>`;
	
	this.updateHeight = function() {
    const height = 120 + (this.count * 20);
    this.element.style.height = `${height}px`;
    this.element.style.lineHeight = `${height}px`;
		this.element.style.width = `${180-height/2}px`;
  };
	
	this.setColor = function(newColor) {
    this.color = newColor;
    this.element.style.backgroundColor = newColor;
  };
}

let subcolors = [];
var nCol = 4;

const nColSelect = document.getElementById('nCol-select');

nColSelect.addEventListener('change', () => {
  nCol = parseInt(nColSelect.value);
  removeColorElements();
  subcolors = [];
  defaultColorsDiv.innerHTML = ''; // clear the container
	
  for (let i = 0; i < nCol; i++) {
    subcolors.push(new Subcolor(`#FFFFFF`, 0));
  }
  subcolors.forEach((subcolor) => defaultColorsDiv.appendChild(subcolor.element));
	setupEventListeners();
	
  newMix();
});

window.onload = function() {
  nColSelect.value = 4;
	nColSelect.dispatchEvent(new Event('change'));
};

function removeColorElements() {
  const colorElements = document.querySelectorAll('.color');
  colorElements.forEach((element) => element.remove());
}

let existingHues = [];
let existingCols = [];

function rndColor() {
	let mindE = 40;
	let h;
	let rgb;
	do{
		let minHueDistance = 60;
		do {
			h = Math.floor(Math.random() * 360);
			minHueDistance--;
		} while (existingHues.some((existingHue) => {
			let hueDiff = Math.abs(h - existingHue);
			if (hueDiff > 180) hueDiff = 360 - hueDiff;
			return hueDiff < minHueDistance;
		}));

		const s = 100;
		const l = Math.floor(Math.random() * 90) + 10;
		const hsl = { h, s, l };
		rgb = hslToRgb(hsl);
		mindE -= 3;
	} while (existingCols.some((existingCol) => {
			return deltaE(rgb, existingCol) < mindE;
		}));

  existingHues.push(h);
	existingCols.push(rgb);
		
  const hex = rgbToHex(rgb);
  return hex;
}

// Add subcolors to DOM
const defaultColorsDiv = document.querySelector(".default-colors");
subcolors.forEach((subcolor) => defaultColorsDiv.appendChild(subcolor.element));



// Mix subcolors subtractively in CMYK
function mixSubcolors(subcolors) {
  const cmyk = [0, 0, 0, 0];
	let n = 0;
  subcolors.forEach((subcolor) => {
    const rgb = hexToRgb(subcolor.color);
    const cmykComponent = rgbToCmyk(rgb);
    if (subcolor.count > 0) {
			cmyk[0] += cmykComponent[0] * subcolor.count;
			cmyk[1] += cmykComponent[1] * subcolor.count;
			cmyk[2] += cmykComponent[2] * subcolor.count;
			cmyk[3] += cmykComponent[3] * subcolor.count;
			n += subcolor.count;
		}
  });
	if (n == 0) return "#FFFFFF"
  const mixedCmyk = cmyk.map((component) => component / n);
  return cmykToHex(mixedCmyk);
}

function showDifference() {
	let a = hexToRgb(targetColor);
	let b = hexToRgb(resultColor)
	let dE = deltaE(a, b);
	document.getElementById("difference-result").textContent = dE < 10 ? `${dE.toFixed(2)}` : ``;
}

function setupEventListeners() {
  subcolors.forEach((subcolor) => {
    let touchStartY;
    
    subcolor.element.addEventListener("mousedown", (e) => {
      handleMouseInteraction(e, subcolor);
    });

    subcolor.element.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    subcolor.element.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling
    });

    subcolor.element.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchEndY - touchStartY;

      if (deltaY > 25) { // Threshold for downward swipe
        subcolor.count = 0;
        subcolor.element.querySelector("span").textContent = subcolor.count;
        subcolor.updateHeight();
        updateResultColor();
      } else {
        handleMouseInteraction(e, subcolor);
      }
    });

    subcolor.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  });
}

function handleMouseInteraction(e, subcolor) {
  const countElement = subcolor.element.querySelector("span");
  if (e.button === 0 || e.type === 'touchend') {
    subcolor.count++;
    if (subcolor.count > 2) subcolor.count = 2;
  } else if (e.button === 2) {
    subcolor.count--;
    if (subcolor.count < 0) subcolor.count = 0;
  }
  countElement.textContent = subcolor.count;
  subcolor.updateHeight();
  updateResultColor();
}



function updateResultColor() {
	resultColor = mixSubcolors(subcolors);
	resultColorElement.style.backgroundColor = resultColor;
	showDifference();
}

function newMix() {
  const numActiveColors = Math.random() < 0.5 ? 2 : 3;
  const activeSubcolors = shuffle(subcolors).slice(0, numActiveColors);
	existingHues = [];
	existingCols = [];
	
  subcolors.forEach((subcolor) => {
    subcolor.setColor(rndColor());
    subcolor.element.innerHTML = `<span>${0}</span>`;
		
		if (activeSubcolors.includes(subcolor)) {
      subcolor.count = Math.floor(Math.random() * 2) + 1;
    } else {
      subcolor.count = 0;
    }
		
  });
		
	targetColor = mixSubcolors(subcolors);
	targetColorElement.style.backgroundColor = targetColor;
	resultColorElement.style.backgroundColor = '#FFFFFF';
	document.getElementById("difference-result").textContent = ``;
	
	subcolors.forEach((subcolor) => {
		subcolor.count = 0;
		subcolor.updateHeight();
	});
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


resetButton.addEventListener('click', () => {
	subcolors.forEach((subcolor) => {
		subcolor.count = 0;
		subcolor.updateHeight();
		subcolor.element.innerHTML = `<span>${0}</span>`;
	});
	updateResultColor()
});

nextButton.addEventListener('click', () => {
	newMix();
});





//***************************************************
// Helper functions
function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

function rgbToCmyk(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const k = 1 - Math.max(r, g, b);
	if (k == 1)return [0, 0, 0, 1];
	
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [c, m, y, k];
}

function cmykToRgb(cmyk) {
  const c = cmyk[0];
  const m = cmyk[1];
  const y = cmyk[2];
  const k = cmyk[3];
  const r = Math.floor(255 * (1 - c) * (1 - k));
  const g = Math.floor(255 * (1 - m) * (1 - k));
  const b = Math.floor(255 * (1 - y) * (1 - k));
	return [r, g, b]
}

function cmykToHex(cmyk) {
	return rgbToHex(cmykToRgb(cmyk));
}

function hslToRgb(hsl) {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.max(0, Math.min(255, Math.round(255 * hueToRgb(p, q, h + 1/3))));
  const g = Math.max(0, Math.min(255, Math.round(255 * hueToRgb(p, q, h))));
  const b = Math.max(0, Math.min(255, Math.round(255 * hueToRgb(p, q, h - 1/3))));
  return [r, g, b];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function rgbToHex(rgb) {
  return `#${rgbToHexComponent(rgb[0])}${rgbToHexComponent(rgb[1])}${rgbToHexComponent(rgb[2])}`;
}

function rgbToHexComponent(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}


/*  Colors similarity
deltaE([128, 0, 255], [128, 0, 255]); // 0
deltaE([128, 0, 255], [128, 0, 230]); // 3.175
deltaE([128, 0, 255], [128, 0, 230]); // 21.434
deltaE([0, 0, 255], [255, 0, 0]); // 61.24

deltaE < 1    - not perceptable by human eye
deltaE = 100  - colors are exact opposite
*/
function deltaE(rgbA, rgbB) {
  let labA = rgb2lab(rgbA);
  let labB = rgb2lab(rgbB);
  let deltaL = labA[0] - labB[0];
  let deltaA = labA[1] - labB[1];
  let deltaB = labA[2] - labB[2];
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  let deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  let sc = 1.0 + 0.045 * c1;
  let sh = 1.0 + 0.015 * c1;
  let deltaLKlsl = deltaL / (1.0);
  let deltaCkcsc = deltaC / (sc);
  let deltaHkhsh = deltaH / (sh);
  let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb){
  let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}


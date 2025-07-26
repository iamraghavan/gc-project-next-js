// A simple, pure-JS CAPTCHA generator.
// This avoids native dependencies that can cause installation issues.

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FONT_FAMILY = `sans-serif`;

function getRandomChars(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function getRandomColor(): string {
  const r = Math.floor(Math.random() * 150);
  const g = Math.floor(Math.random() * 150);
  const b = Math.floor(Math.random() * 150);
  return `rgb(${r}, ${g}, ${b})`;
}

interface SvgCaptcha {
  text: string;
  data: string;
}

export function createCaptcha(options: {
  size?: number;
  noise?: number;
  width?: number;
  height?: number;
  background?: string;
  color?: boolean;
  ignoreChars?: string;
} = {}): SvgCaptcha {
  const {
    size = 4,
    noise = 2,
    width = 150,
    height = 50,
    background = '#ffffff',
  } = options;

  const text = getRandomChars(size);
  const C = -0.5 + Math.random() * 1;
  const A = 1 + Math.random() * 4;
  const F = 15 + Math.random() * 5;
  const T = 10 + Math.random() * 5;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0,0,${width},${height}">`;
  svg += `<rect width="100%" height="100%" fill="${background}"/>`;

  // Draw noise lines
  for (let i = 0; i < noise; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${getRandomColor()}" stroke-width="1"/>`;
  }

  // Draw text
  const textX = (width - (size * 25)) / 2; // Rough centering
  const textY = height / 2;
  
  let textPath = '';
  for (let i = 0; i < text.length; i++) {
    const charX = textX + 20 + (i * 25);
    const charY = textY + (Math.random() * 20 - 10);
    const rotate = Math.random() * 40 - 20;
    const color = options.color ? getRandomColor() : '#555555';
    textPath += `<text x="${charX}" y="${charY}" transform="rotate(${rotate}, ${charX}, ${charY})" font-family="${FONT_FAMILY}" font-size="30" fill="${color}">${text[i]}</text>`;
  }

  svg += textPath;
  svg += `</svg>`;

  return { text, data: svg };
}

// A simple, pure-JS CAPTCHA generator.
// This avoids native dependencies that can cause installation issues.

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FONT_FAMILY = `'Segment', 'Inter', 'sans-serif'`;

function getRandomChars(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function getRandomColor(): string {
  // Generate darker colors for better contrast
  const r = Math.floor(Math.random() * 128);
  const g = Math.floor(Math.random() * 128);
  const b = Math.floor(Math.random() * 128);
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
    noise = 4, // Increased noise lines
    width = 150,
    height = 50,
    background = '#ffffff',
  } = options;

  const text = getRandomChars(size);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0,0,${width},${height}">`;
  svg += `<rect width="100%" height="100%" fill="${background}"/>`;

  // Draw text first
  const textX = (width - (size * 35)) / 2 + 10; // Centering with more spacing
  const textY = height / 2 + 10;
  
  let textPath = '';
  for (let i = 0; i < text.length; i++) {
    const charX = textX + (i * 35); // Increased spacing
    const charY = textY + (Math.random() * 8 - 4); // Reduced vertical variation
    const rotate = Math.random() * 20 - 10; // Reduced rotation
    const color = options.color ? getRandomColor() : '#333333';
    textPath += `<text x="${charX}" y="${charY}" transform="rotate(${rotate}, ${charX}, ${charY})" font-family="${FONT_FAMILY}" font-size="36" font-weight="bold" fill="${color}">${text[i]}</text>`; // Increased font size and weight
  }
  svg += textPath;
  
  // Draw noise lines over the text
  for (let i = 0; i < noise; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const strokeColor = getRandomColor();
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="1.5"/>`;
  }


  svg += `</svg>`;

  return { text, data: svg };
}

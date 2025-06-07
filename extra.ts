export function splitTextSegments(input: string): string[] {
  
  return input
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.length);
}

interface OverlayOpts {
  text: string;
  box: DOMRect;
  video: DOMRect;
  fontSize: string;
  rotation: string;
  alignment: string;
}
export function createOverlaySVG(opts: OverlayOpts): string {
  const { text, box, video, fontSize, rotation, alignment } = opts;
  // ai did this part
  const scale = video.width / video.width;
  const x = box.left - video.left;
  const y = box.top - video.top;
  const w = box.width;
  const h = box.height;
  return `
<svg width="${video.width}" height="${video.height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .txt { 
      font-family: 'Roboto', sans-serif; 
      font-size: ${fontSize}px; 
      fill: white; 
      stroke: black; 
      stroke-width: 2px; 
      white-space: pre-wrap;
      text-anchor: ${alignment === 'center' ? 'middle' : alignment === 'right' ? 'end' : 'start'};
    }
  </style>
  <foreignObject x="${x}" y="${y}" width="${w}" height="${h}" transform="rotate(${rotation}, ${x + w/2}, ${y + h/2})">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="width:${w}px; height:${h}px; display:flex; align-items:${alignment}; justify-content:${alignment};">
      <p class="txt">${text.replace(/\n/g, '<br/>')}</p>
    </div>
  </foreignObject>
</svg>`;
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

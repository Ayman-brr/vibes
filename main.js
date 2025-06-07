import { splitTextSegments, createOverlaySVG, downloadBlob } from './extra.js';

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const videoUpload = document.getElementById('video-upload');
const videoPreview = document.getElementById('video-preview');
const textInput = document.getElementById('text-input');
const textBox = document.getElementById('text-box');
const textContent = document.getElementById('text-content');
const fontSizeInput = document.getElementById('font-size');
const rotationInput = document.getElementById('rotation');
const alignmentSelect = document.getElementById('alignment');
const generateBtn = document.getElementById('generate-btn');
const progressDiv = document.getElementById('progress');
const countDisplay = document.getElementById('count-display');
const clipSelector = document.getElementById('clip-selector');
const downloadsDiv = document.getElementById('downloads');

// PREVIEW UPLOAD & ASPECT RATIO
videoUpload.addEventListener('change', () => {
  const file = videoUpload.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  videoPreview.src = url;
  videoPreview.onloadedmetadata = () => {
    const ar = videoPreview.videoWidth / videoPreview.videoHeight;
    videoPreview.style.height = `${Math.min(400, 400/ar)}px`;
  };
});

// DRAG & TEXT CONTROLS
importDraggable(textBox);
fontSizeInput.addEventListener('input', () => {
  textContent.style.fontSize = fontSizeInput.value + 'px';
});
rotationInput.addEventListener('input', () => {
  textBox.style.transform = `rotate(${rotationInput.value}deg)`;
});
alignmentSelect.addEventListener('change', () => {
  textContent.style.textAlign = alignmentSelect.value;
});

// GENERATE MULTI-CLIP EXPORT
generateBtn.addEventListener('click', async () => {
  const segments = splitTextSegments(textInput.value);
  countDisplay.textContent = `Will create ${segments.length} video(s).`;
  clipSelector.innerHTML = '';
  segments.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.text = `Clip ${i+1}`;
    clipSelector.add(opt);
  });

  if (!ffmpeg.isLoaded()) {
    progressDiv.textContent = 'Loading FFmpeg.wasm…';
    await ffmpeg.load();
  }

  const file = videoUpload.files[0];
  if (!file) return alert('Upload a video first!');
  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

  downloadsDiv.innerHTML = '';
  for (let i = 0; i < segments.length; i++) {
    progressDiv.textContent = `Processing clip ${i+1}/${segments.length}…`;

    // Create SVG overlay
    const svg = createOverlaySVG({
      text: segments[i],
      box: textBox.getBoundingClientRect(),
      video: videoPreview.getBoundingClientRect(),
      fontSize: fontSizeInput.value,
      rotation: rotationInput.value,
      alignment: alignmentSelect.value
    });
    ffmpeg.FS('writeFile', `overlay${i}.svg`, new TextEncoder().encode(svg));

    await ffmpeg.run(
      '-i', 'input.mp4',
      '-i', `overlay${i}.svg`,
      '-filter_complex', '[1]format=rgba,scale=iw:ih[wm];[0][wm]overlay=(W-w)/2:(H-h)/2',
      `output${i}.mp4`
    );
    const data = ffmpeg.FS('readFile', `output${i}.mp4`);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clip${i+1}.mp4`;
    link.textContent = `Download clip ${i+1}`;
    downloadsDiv.appendChild(link);
  }
  progressDiv.textContent = 'Done!';
});

// Simple draggable
function importDraggable(el) {
  let isDown = false, startX, startY, origX, origY;
  el.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.clientX; startY = e.clientY;
    const r = el.getBoundingClientRect();
    origX = r.left; origY = r.top;
    document.body.style.userSelect = 'none';
  });
  window.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = origX + dx + 'px';
    el.style.top = origY + dy + 'px';
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    document.body.style.userSelect = '';
  });
}

// Digital Place - File Manager State & Logic
(function () {
  let files = [];
  let currentFilter = 'all';
  let activeFileId = null;

  // DOM Elements
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const fileGrid = document.getElementById('fileGrid');
  const emptyState = document.getElementById('emptyState');
  const tabs = document.querySelectorAll('.tab');

  const viewerModal = document.getElementById('viewerModal');
  const closeModalBtn = document.getElementById('closeModal');
  const viewerContainer = document.getElementById('viewerContainer');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const deleteFileBtn = document.getElementById('deleteFileBtn');

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Detect file category
  function getFileCategory(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }

  // Render file card
  function createFileCard(fileItem) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = fileItem.id;
    card.dataset.type = fileItem.category;

    let thumbHtml = '';
    if (fileItem.category === 'image') {
      thumbHtml = `
        <div class="file-thumbnail">
          <img src="${fileItem.url}" alt="${fileItem.name}" loading="lazy">
          <span class="file-badge">Photo</span>
        </div>`;
    } else if (fileItem.category === 'video') {
      thumbHtml = `
        <div class="file-thumbnail">
          <video src="${fileItem.url}#t=0.5" preload="metadata" muted playsinline></video>
          <div class="play-overlay">
            <svg viewBox="0 0 24 24" fill="white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <span class="file-badge">Video</span>
        </div>`;
    } else {
      thumbHtml = `
        <div class="file-thumbnail">
          <div class="doc-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span class="file-badge">Doc</span>
        </div>`;
    }

    card.innerHTML = `
      ${thumbHtml}
      <div class="file-info">
        <span class="file-name" title="${fileItem.name}">${fileItem.name}</span>
        <span class="file-size">${formatFileSize(fileItem.size)}</span>
      </div>
    `;

    card.addEventListener('click', () => openViewer(fileItem.id));
    return card;
  }

  // Render all files
  function renderFiles() {
    fileGrid.innerHTML = '';
    const filtered = files.filter(f => currentFilter === 'all' || f.category === currentFilter);

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      fileGrid.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      fileGrid.style.display = 'grid';
      filtered.forEach(fileItem => {
        fileGrid.appendChild(createFileCard(fileItem));
      });
    }
  }

  // Add files
  function addFiles(newFileList) {
    Array.from(newFileList).forEach(file => {
      const category = getFileCategory(file);
      const url = URL.createObjectURL(file);
      files.unshift({
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        category: category,
        url: url,
        rawFile: file
      });
    });
    renderFiles();
  }

  // Open modal viewer
  function openViewer(id) {
    const fileItem = files.find(f => f.id === id);
    if (!fileItem) return;

    activeFileId = id;
    fileNameDisplay.textContent = fileItem.name;
    viewerContainer.innerHTML = '';

    if (fileItem.category === 'video') {
      const video = document.createElement('video');
      video.src = fileItem.url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      viewerContainer.appendChild(video);
    } else if (fileItem.category === 'image') {
      const img = document.createElement('img');
      img.src = fileItem.url;
      img.alt = fileItem.name;
      viewerContainer.appendChild(img);
    } else {
      const docBox = document.createElement('div');
      docBox.className = 'doc-viewer-preview';
      docBox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <p><strong>${fileItem.name}</strong></p>
        <p style="font-size: 14px;">Size: ${formatFileSize(fileItem.size)}</p>
        <a href="${fileItem.url}" download="${fileItem.name}" class="btn primary-btn" style="text-decoration:none; margin-top:8px;">Download Document</a>
      `;
      viewerContainer.appendChild(docBox);
    }

    viewerModal.classList.add('active');
  }

  // Close modal viewer
  function closeViewer() {
    const video = viewerContainer.querySelector('video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    viewerContainer.innerHTML = '';
    viewerModal.classList.remove('active');
    activeFileId = null;
  }

  // Delete active file
  function deleteActiveFile() {
    if (!activeFileId) return;
    const index = files.findIndex(f => f.id === activeFileId);
    if (index !== -1) {
      if (files[index].url && files[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(files[index].url);
      }
      files.splice(index, 1);
      closeViewer();
      renderFiles();
    }
  }

  // Event Listeners
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      fileInput.value = '';
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderFiles();
    });
  });

  closeModalBtn.addEventListener('click', closeViewer);

  viewerModal.addEventListener('click', (e) => {
    if (e.target === viewerModal) {
      closeViewer();
    }
  });

  deleteFileBtn.addEventListener('click', () => {
    if (confirm('Delete this file from Digital Place?')) {
      deleteActiveFile();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewerModal.classList.contains('active')) {
      closeViewer();
    }
  });

  // Create demo files so user has instant testable sample photo, video, and doc
  function createSampleFiles() {
    // 1. Sample Photo (SVG Data URI Blob)
    const svgPhoto = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#grad)" />
      <circle cx="300" cy="180" r="70" fill="#60a5fa" opacity="0.8"/>
      <path d="M50 350 L200 220 L320 310 L450 180 L560 350 Z" fill="#0f172a" opacity="0.9"/>
      <text x="300" y="375" fill="#f8fafc" font-size="20" font-family="sans-serif" text-anchor="middle" font-weight="bold">Mountain Horizon (Sample)</text>
    </svg>`;
    const photoBlob = new Blob([svgPhoto], { type: 'image/svg+xml' });
    const photoUrl = URL.createObjectURL(photoBlob);

    // 2. Sample Video generated via Canvas MediaRecorder (animated glowing digital orb)
    generateSampleVideoBlob(function (videoBlob) {
      const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : null;
      
      // 3. Sample Doc
      const docText = "Digital Place Personal Vault\n\nWelcome to your private space.\nYou can securely store and preview photos, videos, and documents right on your device.";
      const docBlob = new Blob([docText], { type: 'text/plain' });
      const docUrl = URL.createObjectURL(docBlob);

      files = [
        {
          id: 'demo_photo',
          name: 'Mountain_Sunrise.svg',
          size: photoBlob.size,
          type: 'image/svg+xml',
          category: 'image',
          url: photoUrl
        },
        {
          id: 'demo_doc',
          name: 'Welcome_Notes.txt',
          size: docBlob.size,
          type: 'text/plain',
          category: 'document',
          url: docUrl
        }
      ];

      if (videoUrl) {
        files.splice(1, 0, {
          id: 'demo_video',
          name: 'Motion_Orb_Sample.webm',
          size: videoBlob.size,
          type: 'video/webm',
          category: 'video',
          url: videoUrl
        });
      }

      renderFiles();
    });
  }

  // Generate a valid short animated WebM video blob right in the browser
  function generateSampleVideoBlob(callback) {
    if (typeof MediaRecorder === 'undefined') {
      callback(null);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      
      let options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        options = {};
      }
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        callback(blob);
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 60; // 2 seconds animation
      function draw() {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }

        // Dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated neon circles
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const angle = (frame / totalFrames) * Math.PI * 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX + Math.cos(angle) * 50, centerY + Math.sin(angle) * 30, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.restore();

        // Counter circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX - Math.cos(angle) * 50, centerY - Math.sin(angle) * 30, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();

        // Text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Digital Place Video Player', centerX, centerY + 110);

        frame++;
        requestAnimationFrame(draw);
      }

      draw();
    } catch (err) {
      console.warn('Canvas video generation skipped:', err);
      callback(null);
    }
  }

  // Initialize
  createSampleFiles();
})();

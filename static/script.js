const downloadBtn = document.getElementById('download-btn');
const tiktokInput = document.getElementById('tiktok-url');
const resultSection = document.getElementById('result');

downloadBtn.onclick = function() {
  const url = tiktokInput.value;
  if (!url) {
    alert('Vui lòng nhập link TikTok!');
    return;
  }
  downloadBtn.disabled = true;
  downloadBtn.innerText = 'Đang xử lý...';
  resultSection.classList.remove('show');
  resultSection.innerHTML = '<p>Đang xử lý...</p>';
  fetch('/download', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'url=' + encodeURIComponent(url)
  })
  .then(res => res.json())
  .then(data => {
    downloadBtn.disabled = false;
    downloadBtn.innerText = 'Tải video';
    if (data.success) {
      if (data.media_type === 'image' && Array.isArray(data.media_urls)) {
        let html = '<div class="image-gallery">';
        data.media_urls.forEach((img, idx) => {
          html += `<div class="img-wrap" style="display:inline-block;margin:8px;position:relative;">
            <img src="${img}" class="media-img selectable-img" data-img="${img}" alt="TikTok Image ${idx+1}" style="cursor:pointer;max-width:120px;max-height:120px;object-fit:cover;border:2px solid #eee;border-radius:10px;">
            <div class="img-status" style="text-align:center;font-size:13px;margin-top:4px;min-height:18px;" id="img-status-${idx}"></div>
          </div>`;
        });
        html += '</div>';
        if (data.media_urls.length > 1) {
          html += '<button id="download-all-btn" class="download-btn" style="margin-top:18px;display:block;width:100%;"><svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4\'/></svg>Tải tất cả ảnh (.zip)</button>';
          html += '<div id="download-all-status" style="margin-top:10px;"></div>';
        }
        html += '<div style="margin-top:10px;font-size:17px;color:#fff;">Nhấn vào ảnh bạn muốn tải để tải về hoặc chọn tất cả như trên</div>';
        resultSection.innerHTML = html;
        resultSection.classList.add('show');
        document.querySelectorAll('.selectable-img').forEach((imgEl, idx) => {
          imgEl.onclick = function() {
            const url = imgEl.getAttribute('data-img');
            const status = document.getElementById('img-status-' + idx);
            autoDownload(url, `tiktok-image-${idx+1}.jpg`, status);
          };
        });
        if (data.media_urls.length > 1) {
          document.getElementById('download-all-btn').onclick = function() {
            downloadAllImagesAsZip(data.media_urls);
          };
        }
      } else if (data.media_type === 'image') {
        resultSection.innerHTML = `
          <img src="${data.media_url}" class="media-img" alt="TikTok Image" />
          <button id="auto-download-btn" class="download-btn"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4'/></svg>Tải ảnh</button>
          <div id="download-status" style="margin-top:10px;"></div>
        `;
        resultSection.classList.add('show');
        document.getElementById('auto-download-btn').onclick = function() {
          autoDownload(data.media_url, 'tiktok-image.jpg', document.getElementById('download-status'));
        };
      } else {
        resultSection.innerHTML = `
          <video src="${data.media_url}" controls style="width:100%"></video>
          <button id="auto-download-btn" class="download-btn"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4'/></svg>Tải video</button>
          <div id="download-status" style="margin-top:10px;"></div>
        `;
        resultSection.classList.add('show');
        document.getElementById('auto-download-btn').onclick = function() {
          autoDownload(data.media_url, 'tiktok-video.mp4', document.getElementById('download-status'));
        };
      }
    } else {
      downloadBtn.disabled = false;
      downloadBtn.innerText = 'Tải video';
      resultSection.innerHTML = `<p style=\"color:red\">${data.message}</p>`;
      resultSection.classList.add('show');
    }
  })
  .catch(() => {
    downloadBtn.disabled = false;
    downloadBtn.innerText = 'Tải video';
    resultSection.innerHTML = '<p style="color:red">Có lỗi xảy ra, vui lòng thử lại!</p>';
    resultSection.classList.add('show');
  });
};

function autoDownload(url, filename, statusEl) {
  const status = statusEl || document.getElementById('download-status');
  if (status) status.innerHTML = '<span>Đang tải...</span>';
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onprogress = function(e) {
    if (status) {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        status.innerHTML = `<span>Đang tải: ${percent}%</span>`;
      } else {
        status.innerHTML = '<span>Đang tải...</span>';
      }
    }
  };
  xhr.onload = function() {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 100);
      if (status) status.innerHTML = '<span style="color:green">Tải xong!</span>';
    } else {
      if (status) status.innerHTML = '<span style="color:red">Tải thất bại!</span>';
    }
  };
  xhr.onerror = function() {
    if (status) status.innerHTML = '<span style="color:red">Tải thất bại!</span>';
  };
  xhr.send();
}

function downloadAllImagesAsZip(urls) {
  const status = document.getElementById('download-all-status');
  status.innerHTML = '<span>Đang tải và nén ảnh...</span>';
  const zip = new JSZip();
  let count = 0;
  let failed = 0;
  urls.forEach((url, idx) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        zip.file(`tiktok-image-${idx+1}.jpg`, blob);
        count++;
        status.innerHTML = `<span>Đã tải ${count}/${urls.length} ảnh...</span>`;
        if (count + failed === urls.length) {
          zip.generateAsync({type:"blob"}, (metadata) => {
            status.innerHTML = `<span>Nén: ${Math.round(metadata.percent)}%</span>`;
          }).then(function(content) {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(content);
            link.download = 'tiktok-images.zip';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              window.URL.revokeObjectURL(link.href);
              document.body.removeChild(link);
            }, 100);
            status.innerHTML = '<span style="color:green">Tải xong tất cả ảnh!</span>';
          });
        }
      })
      .catch(() => {
        failed++;
        status.innerHTML = `<span style="color:red">Lỗi tải ảnh ${idx+1}</span>`;
        if (count + failed === urls.length) {
          zip.generateAsync({type:"blob"}, (metadata) => {
            status.innerHTML = `<span>Nén: ${Math.round(metadata.percent)}%</span>`;
          }).then(function(content) {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(content);
            link.download = 'tiktok-images.zip';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              window.URL.revokeObjectURL(link.href);
              document.body.removeChild(link);
            }, 100);
            status.innerHTML = '<span style="color:green">Tải xong tất cả ảnh (một số ảnh có thể bị lỗi)!</span>';
          });
        }
      });
  });
} 
(function() {
    const SUPABASE_URL = 'https://apxelbabvviuwqpfivtr.supabase.co';
    const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFweGVsYmFidnZpdXdxcGZpdnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjEyOTYsImV4cCI6MjA5OTIzNzI5Nn0.EWt2FRAkJH86Is9P_uDjKDXnJ0O1J2qdg_BuctQavvY';

    function h() { return { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }; }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // Global content (phone, hours, footer)
    fetch(`${SUPABASE_URL}/rest/v1/site_content?page=eq.global&select=content_key,content_type,value`, { headers: h() })
        .then(function(res) { return res.json(); })
        .then(function(rows) {
            if (!Array.isArray(rows)) return;
            rows.forEach(function(row) {
                if (!row.value) return;
                document.querySelectorAll('[data-ck="' + row.content_key + '"]').forEach(function(el) {
                    el.textContent = row.value;
                });
            });
        });

    if (!id) {
        window.location.href = 'outdoor.html';
        return;
    }

    fetch(`${SUPABASE_URL}/rest/v1/outdoor_products?id=eq.${id}&select=*`, { headers: h() })
        .then(function(res) { return res.json(); })
        .then(function(rows) {
            const p = rows && rows[0];
            if (!p) {
                document.getElementById('detail-content').innerHTML = '<p style="padding:60px;text-align:center;color:#888">Product not found. <a href="outdoor.html">Back to Outdoor Living</a></p>';
                return;
            }

            document.title = `${p.name} | Central Home Good`;
            document.querySelectorAll('[data-ck="page-title"]').forEach(function(el) { el.textContent = p.name; });
            document.querySelectorAll('[data-ck="breadcrumb-name"]').forEach(function(el) { el.textContent = p.name; });

            const img = document.querySelector('[data-ck="product-image"]');
            if (img && p.image_url) img.src = p.image_url;

            const rowsToShow = [
                ['Category', p.category || 'Outdoor Furniture'],
                ['SKU', p.sku],
                ['Color Options', p.color_options],
            ];
            const features = (p.description || '').split(/\r?\n/).map(function(feature) { return feature.trim(); }).filter(Boolean);

            const specsList = document.getElementById('product-specs-list');
            const detailRows = rowsToShow
                .filter(function(r) { return r[1]; })
                .map(function(r) { return `<li><strong>${r[0]}:</strong> ${r[1]}</li>`; })
                .join('');
            const featureRows = features.map(function(feature) { return `<li>${feature}</li>`; }).join('');
            specsList.innerHTML = detailRows + featureRows;

            const galleryPrefix = `product-gallery-${id}-`;
            fetch(`${SUPABASE_URL}/rest/v1/outdoor_images?slug=like.${encodeURIComponent(galleryPrefix + '*')}&order=sort_order&select=id,image_url,label`, { headers: h() })
                .then(function(res) { return res.ok ? res.json() : []; })
                .then(function(photos) {
                    if (!Array.isArray(photos) || !photos.length) return;
                    const gallery = document.getElementById('product-gallery');
                    photos.forEach(function(photo) {
                        const image = document.createElement('img');
                        image.src = photo.image_url;
                        image.alt = photo.label || `${p.name} additional photo`;
                        image.loading = 'lazy';
                        image.onclick = function() { openLightbox(image.src); };
                        gallery.appendChild(image);
                    });
                    document.getElementById('product-gallery-section').style.display = 'block';
                });
        })
        .catch(function(err) { console.error('Outdoor product load error:', err); });
})();

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

            const manufacturerPhotos = String(p.category || '').toLowerCase().includes('outdoor kitchen') ? [
                { image_url: 'images/modular-grill-islands/modular-grill-island-hero.jpg', label: 'Complete modular outdoor kitchen' },
                { image_url: 'images/modular-grill-islands/modular-grill-island-sink.jpg', label: 'Sink and storage module details' },
                { image_url: 'images/modular-grill-islands/modular-grill-island-grill.jpg', label: 'Five-burner grill module details' },
                { image_url: 'images/modular-grill-islands/modular-grill-island-refrigerator.jpg', label: 'Refrigerator and drawer module details' },
                { image_url: 'images/modular-grill-islands/modular-grill-island-corner-cart.jpg', label: 'Corner cart and ice bucket details' },
                { image_url: 'images/modular-grill-islands/modular-grill-island-table.jpg', label: 'Teak table module details' }
            ] : [];

            const galleryPrefix = `product-gallery-${id}-`;
            fetch(`${SUPABASE_URL}/rest/v1/outdoor_images?slug=like.${encodeURIComponent(galleryPrefix + '*')}&order=sort_order&select=id,image_url,label`, { headers: h() })
                .then(function(res) { return res.ok ? res.json() : []; })
                .then(function(photos) {
                    const uploadedPhotos = Array.isArray(photos) ? photos : [];
                    const galleryPhotos = manufacturerPhotos.concat(uploadedPhotos).filter(function(photo, index, all) {
                        return photo.image_url && all.findIndex(function(item) { return item.image_url === photo.image_url; }) === index;
                    });
                    if (!galleryPhotos.length) return;

                    const gallery = document.getElementById('product-gallery');
                    const mainImage = document.getElementById('product-gallery-main');

                    function selectPhoto(photo, button) {
                        mainImage.src = photo.image_url;
                        mainImage.alt = photo.label || `${p.name} product photo`;
                        gallery.querySelectorAll('.op-gallery-thumb').forEach(function(thumb) {
                            thumb.classList.toggle('active', thumb === button);
                            thumb.setAttribute('aria-pressed', thumb === button ? 'true' : 'false');
                        });
                    }

                    galleryPhotos.forEach(function(photo, index) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'op-gallery-thumb';
                        button.setAttribute('aria-label', `Show ${photo.label || `${p.name} photo ${index + 1}`}`);
                        button.setAttribute('aria-pressed', 'false');

                        const image = document.createElement('img');
                        image.src = photo.image_url;
                        image.alt = photo.label || `${p.name} thumbnail ${index + 1}`;
                        image.loading = index === 0 ? 'eager' : 'lazy';
                        button.appendChild(image);
                        button.onclick = function() { selectPhoto(photo, button); };
                        gallery.appendChild(button);

                        if (index === 0) selectPhoto(photo, button);
                    });

                    document.getElementById('product-gallery-section').style.display = 'block';
                });
        })
        .catch(function(err) { console.error('Outdoor product load error:', err); });
})();

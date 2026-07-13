(function() {
    const SUPABASE_URL = 'https://apxelbabvviuwqpfivtr.supabase.co';
    const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFweGVsYmFidnZpdXdxcGZpdnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjEyOTYsImV4cCI6MjA5OTIzNzI5Nn0.EWt2FRAkJH86Is9P_uDjKDXnJ0O1J2qdg_BuctQavvY';

    const page = document.body.getAttribute('data-page');
    if (!page) return;

    fetch(`${SUPABASE_URL}/rest/v1/site_content?page=in.(global,${page})&select=content_key,content_type,value`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
    })
    .then(function(res) { return res.json(); })
    .then(function(rows) {
        if (!Array.isArray(rows)) return;
        rows.forEach(function(row) {
            if (row.value === null || row.value === undefined || row.value === '') return;
            document.querySelectorAll('[data-ck="' + row.content_key + '"]').forEach(function(el) {
                if (row.content_type === 'image') {
                    if (el.tagName === 'IMG') el.src = row.value;
                    else el.style.backgroundImage = "url('" + row.value + "')";
                } else {
                    // Prevent overwriting with the old incorrect email
                    if ((row.content_key === 'footer-email' || row.content_key === 'showroom-email') && row.value.includes('centralhomegood.com')) {
                        return;
                    }
                    el.textContent = row.value;
                }
            });
        });
    })
    .catch(function(err) { console.error('Site content load error:', err); });
})();

<?php
/**
 * Dynamic XML Sitemap Generator for STORIUM
 * Generates valid sitemap.xml with live products from Supabase + core pages.
 */
header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex, follow');

$baseUrl = 'https://storium.online';
$today = date('Y-m-d');

// Static core routes
$corePages = array(
    array('loc' => '/',                 'changefreq' => 'daily',   'priority' => '1.0'),
    array('loc' => '/watches',          'changefreq' => 'daily',   'priority' => '0.9'),
    array('loc' => '/accessories',      'changefreq' => 'weekly',  'priority' => '0.8'),
    array('loc' => '/shop',             'changefreq' => 'daily',   'priority' => '0.9'),
    array('loc' => '/about',            'changefreq' => 'monthly', 'priority' => '0.6'),
    array('loc' => '/contact',          'changefreq' => 'monthly', 'priority' => '0.6'),
    array('loc' => '/shipping-policy',  'changefreq' => 'monthly', 'priority' => '0.4'),
    array('loc' => '/return-policy',    'changefreq' => 'monthly', 'priority' => '0.4'),
    array('loc' => '/terms',            'changefreq' => 'monthly', 'priority' => '0.4'),
);

// Fallback products if database query fails
$products = array(
    array('slug' => 'storium-chrono-obsidian-stealth',        'name' => 'STORIUM Chrono Obsidian Stealth',        'image' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200'),
    array('slug' => 'storium-astral-automatic-champagne-gold', 'name' => 'STORIUM Astral Automatic Champagne Gold', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200'),
    array('slug' => 'storium-quantum-skeleton-titanium',       'name' => 'STORIUM Quantum Skeleton Titanium',       'image' => 'https://images.unsplash.com/photo-1547996160-71dfa63582b9?q=80&w=1200'),
    array('slug' => 'storium-eclipse-minimalist-noir',         'name' => 'STORIUM Eclipse Minimalist Noir',         'image' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200'),
    array('slug' => 'storium-vanguard-diver-300m',             'name' => 'STORIUM Vanguard Diver 300M',             'image' => 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200'),
    array('slug' => 'storium-monolith-gmt-dual-time',          'name' => 'STORIUM Monolith GMT Dual-Time',          'image' => 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200'),
);

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<?php foreach ($corePages as $page): ?>
  <url>
    <loc><?php echo htmlspecialchars($baseUrl . $page['loc'], ENT_QUOTES, 'UTF-8'); ?></loc>
    <lastmod><?php echo $today; ?></lastmod>
    <changefreq><?php echo $page['changefreq']; ?></changefreq>
    <priority><?php echo $page['priority']; ?></priority>
  </url>
<?php endforeach; ?>
<?php foreach ($products as $p): ?>
  <url>
    <loc><?php echo htmlspecialchars($baseUrl . '/product/' . $p['slug'], ENT_QUOTES, 'UTF-8'); ?></loc>
    <lastmod><?php echo $today; ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <?php if (!empty($p['image'])): ?>
    <image:image>
      <image:loc><?php echo htmlspecialchars($p['image'], ENT_QUOTES, 'UTF-8'); ?></image:loc>
      <image:title><?php echo htmlspecialchars($p['name'], ENT_QUOTES, 'UTF-8'); ?></image:title>
    </image:image>
    <?php endif; ?>
  </url>
<?php endforeach; ?>
</urlset>

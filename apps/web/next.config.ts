// next.config.ts
// Config Next.js 16 du template.
//
// cacheComponents: true → active le Partial Pre-rendering (PPR) par défaut.
// Conséquence architecturale : toute page qui lit des données non cachées
// SANS accès direct aux cookies (via getUserInfo → Supabase) doit appeler
// `await connection()` (next/server) en tête de fonction, sinon Next lève
// "Uncached data was accessed outside of <Suspense>".
module.exports = {
  // Packages workspace partagés — nécessaire pour que Next.js transpile leurs sources
  transpilePackages: ['@attendancy/types', '@attendancy/planning'],
  experimental: {
    // Transforme les imports barrel en imports directs au build (bundle size)
    optimizePackageImports: ['lucide-react'],
  },
  cacheComponents: true, 
  images: {
    remotePatterns: [
      // ⚠ À ÉTENDRE PAR PROJET — ajouter les hosts d'images du projet
      // (ex : le domaine de stockage Supabase du projet)
      // { protocol: 'https', hostname: '<project>.supabase.co' },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

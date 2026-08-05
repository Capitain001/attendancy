"use server"

import { clearCacheServer } from "@/modules/user/usage/cache-action"
import { CacheInvalidation } from "@/modules/user/usage/cache_invalidation"

export async function  CacheStats() {
  const stats = CacheInvalidation.getStats()
  
  return (
    <div>
      <h1>Cache Utilisateur</h1>
      <div>
        <p>Utilisation: {stats.usage}</p>
        <p>Total: {stats.total}/{stats.maxSize}</p>
      </div>
      
      <h2>Par Organisation</h2>
      <table>
        <tbody>
          {Object.entries(stats.byOrganization).map(([slug, count]) => (
            <tr key={slug}>
              <td>{slug}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <form action={clearCacheServer}>
        
        <button type="submit" className="cursor-pointer ">Vider le cache</button>
      </form>
   
    </div>
  )
}
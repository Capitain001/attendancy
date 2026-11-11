// src/modules/user/usage/cache-action.ts
"use server"
import { clearCache } from "../lru-cache";
export async function clearCacheServer (){

    clearCache()
    console.log('Cache vide compltement petit')
}

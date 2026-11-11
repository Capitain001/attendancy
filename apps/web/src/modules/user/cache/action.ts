// src/modules/user/cache/action.ts
"use server"
import { clearCache } from "../lru-cache";
export async function clearCacheServer (){

    clearCache()
    console.log('Cache vide compltement petit')
}

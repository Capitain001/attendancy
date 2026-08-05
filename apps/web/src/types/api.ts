// types/api.ts

// Statuts HTTP courants pour autocomplétion
export type HttpStatus = 
  | 200 // OK
  | 201 // Created
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 500 // Internal Server Error
  | number; // ← Permet d'autres valeurs

export type ApiResponse<T = any, S extends HttpStatus = HttpStatus> = 
  | { data: T; status?: S }           // ← Partial : status optionnel
  | { error: string; status?: S };     // ← Partial : status optionnel

// Helper types pour plus de précision (optionnel)
export type ApiSuccess<T = any, S extends HttpStatus = 200> = { 
  data: T; 
  status?: S;
};

export type ApiError<E = string, S extends HttpStatus = 400> = { 
  error: E; 
  status?: S;
};
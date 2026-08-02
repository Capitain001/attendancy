
"use server";

export interface ErrorResult {
  success: false;
  error: string;
}

export function supabaseInvitationError(error: any): ErrorResult {
  const errorMessage = error.message?.toLowerCase() || '';

  if (errorMessage.includes('already exists') || errorMessage.includes('already invited')) {
    return { 
      success: false, 
      error: "Cet utilisateur a déjà été invité ou existe déjà dans le système" 
    };
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return { 
      success: false, 
      error: "Trop de tentatives d'invitation, veuillez réessayer dans quelques minutes" 
    };
  }

  if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
    return { 
      success: false, 
      error: "L'adresse email est invalide" 
    };
  }

  if (errorMessage.includes('user not found')) {
    return { 
      success: false, 
      error: "Utilisateur non trouvé" 
    };
  }

  // Erreur générique avec logging détaillé
  console.error('Supabase error details:', {
    message: error.message,
    code: error.code,
    status: error.status
  });

  return { 
    success: false, 
    error: `Erreur lors de l'envoi de l'invitation: ${error.message || 'Erreur inconnue'}` 
  };
}
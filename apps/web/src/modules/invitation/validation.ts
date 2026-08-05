//src/services/invitation
import * as v from 'valibot';

const EmailSchema = v.pipe(
  v.string(), // Ensures the input is a string
  v.email()   // Validates the string as a common email format
);

// Example usage with a valid email
const validEmailResult = v.safeParse(EmailSchema, 'test@example.com');
console.log(validEmailResult); 
// Output: { typed: true, success: true, output: "test@example.com", issues: undefined }

// Example usage with an invalid email
const invalidEmailResult = v.safeParse(EmailSchema, 'invalid-email');
console.log(invalidEmailResult);
// Output will show 'success: false' and an 'issues' array detailing the validation error.


// Ajouter dans user.ts avant l'appel principal
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Dans inviteUser
// if (!validateEmail(params.email)) {
//   return { success: false, error: "Format d'email invalide" };
// }
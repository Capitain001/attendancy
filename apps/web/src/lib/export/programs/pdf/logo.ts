// Récupère le logo de l'organisation en base64 pour l'intégrer au PDF.
// Retourne null si absent ou si le fetch échoue — le PDF est alors généré
// sans logo plutôt que de bloquer l'export.
//
// Fix par rapport à l'original : reader.onerror n'était pas branché, donc
// une erreur de lecture du blob laissait la Promise indéfiniment en attente
// au lieu de tomber dans le catch.
export async function loadLogoAsBase64(logoUrl?: string | null): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

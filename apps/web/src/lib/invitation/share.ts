// lib/invitation/share.ts

const DEFAULT_TEXT = "Invitation";

export type NativeShareOutcome = "shared" | "cancelled" | "unsupported";

export const share = {
  /**
   * Copie le lien dans le presse-papiers.
   * @returns `{ copied: true }` si l'API clipboard a réussi, `{ copied: false }` sinon
   *   (permissions navigateur, contexte non sécurisé...) — à l'appelant de décider du fallback
   *   (toast avec description, affichage inline, etc.)
   */
  async clipboard(link: string): Promise<{ copied: boolean }> {
    try {
      await navigator.clipboard.writeText(link);
      return { copied: true };
    } catch {
      return { copied: false };
    }
  },

  /** Ouvre l'app SMS avec le lien pré-rempli dans le corps du message. */
  sms(link: string, text = DEFAULT_TEXT) {
    const body = encodeURIComponent(`${text}\n${link}`);
    window.open(`sms:?body=${body}`, "_blank", "noopener,noreferrer");
  },

  /** Ouvre WhatsApp (web ou app) avec le lien pré-rempli. */
  whatsapp(link: string, text = DEFAULT_TEXT) {
    const message = encodeURIComponent(`${text}\n${link}`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  },

  /**
   * Partage via la Web Share API si disponible.
   * @returns "shared" | "cancelled" (utilisateur a fermé la feuille) | "unsupported"
   *   (navigator.share absent — à l'appelant de proposer un fallback, ex. clipboard)
   * @throws toute erreur autre qu'un AbortError (ex. permission refusée)
   */
  async native(
    link: string,
    opts?: { title?: string; text?: string }
  ): Promise<NativeShareOutcome> {
    if (typeof navigator === "undefined" || !navigator.share) {
      return "unsupported";
    }
    const title = opts?.title ?? DEFAULT_TEXT;
    const text = opts?.text ?? DEFAULT_TEXT;
    try {
      await navigator.share({ title, text: `${text}\n${link}`, url: link });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
      throw e;
    }
  },
};
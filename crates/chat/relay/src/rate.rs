//crates\chat\relay\src\rate.rs
use tokio::time::Instant;

/// Seau à jetons : `burst` messages d'un coup, puis `per_sec` par seconde.
/// Pur (l'heure est passée en argument) : testable sans attendre.
pub struct Bucket {
    tokens: f64,
    burst: f64,
    per_sec: f64,
    last: Instant,
}

impl Bucket {
    pub fn new(burst: u32, per_sec: f64, now: Instant) -> Self {
        let burst = f64::from(burst.max(1));
        Self {
            tokens: burst,
            burst,
            // Un débit nul ou négatif ferait diviser par zéro plus bas
            per_sec: per_sec.max(0.001),
            last: now,
        }
    }

    /// Ok si un jeton est disponible ; sinon Err(millisecondes avant le prochain).
    pub fn take(&mut self, now: Instant) -> Result<(), u64> {
        let elapsed = now.saturating_duration_since(self.last).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.per_sec).min(self.burst);
        self.last = now;

        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            Ok(())
        } else {
            let wait_s = (1.0 - self.tokens) / self.per_sec;
            Err((wait_s * 1000.0).ceil().max(1.0) as u64)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn la_rafale_passe_puis_le_debit_s_applique() {
        let t0 = Instant::now();
        let mut b = Bucket::new(3, 2.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_ok());
        let wait = b.take(t0).unwrap_err();
        assert_eq!(wait, 500); // 1 jeton à 2/s = 500 ms
    }

    #[test]
    fn les_jetons_reviennent_avec_le_temps() {
        let t0 = Instant::now();
        let mut b = Bucket::new(1, 2.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).is_err());
        assert!(b.take(t0 + Duration::from_millis(499)).is_err());
        assert!(b.take(t0 + Duration::from_millis(500)).is_ok());
    }

    #[test]
    fn le_stock_ne_depasse_pas_la_rafale() {
        let t0 = Instant::now();
        let mut b = Bucket::new(2, 10.0, t0);
        let later = t0 + Duration::from_secs(3600);
        assert!(b.take(later).is_ok());
        assert!(b.take(later).is_ok());
        assert!(b.take(later).is_err());
    }

    #[test]
    fn debit_nul_ne_panique_pas() {
        let t0 = Instant::now();
        let mut b = Bucket::new(1, 0.0, t0);
        assert!(b.take(t0).is_ok());
        assert!(b.take(t0).unwrap_err() > 0);
    }
}

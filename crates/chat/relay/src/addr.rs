//crates\chat\relay\src\addr.rs
use std::collections::HashSet;
use std::net::Ipv4Addr;

use serde::Serialize;

/// Interface réseau vue de l'appareil. La liste réelle vient de la couche native (if-addrs) ;
/// ce module reste pur pour être testé sur des listes écrites à la main.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Iface {
    pub name: String,
    pub ip: Ipv4Addr,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AddrKind {
    /// Point d'accès / partage de connexion (adresses fixes des systèmes)
    Hotspot,
    Lan,
    LinkLocal,
    Virtual,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Candidate {
    pub ip: Ipv4Addr,
    pub name: String,
    pub kind: AddrKind,
}

const HOTSPOTS: [Ipv4Addr; 3] = [
    Ipv4Addr::new(192, 168, 43, 1),  // Android
    Ipv4Addr::new(172, 20, 10, 1),   // iOS
    Ipv4Addr::new(192, 168, 137, 1), // Windows
];

/// Adresses que le lien d'appairage accepte (sous-ensemble de `isLocalHost` côté TypeScript :
/// 10/8, 172.16/12, 192.168/16, 169.254/16). Le loopback est exclu : inutile à publier.
pub fn is_pairable(ip: Ipv4Addr) -> bool {
    let [a, b, ..] = ip.octets();
    a == 10 || (a == 172 && (16..=31).contains(&b)) || (a == 192 && b == 168) || (a == 169 && b == 254)
}

fn is_virtual(name: &str) -> bool {
    let n = name.to_lowercase();
    ["tun", "tap", "utun", "wg", "veth"].iter().any(|p| n.starts_with(p))
        || ["docker", "vmware", "virtualbox", "vpn"].iter().any(|p| n.contains(p))
}

/// Candidats à publier, du meilleur au moins bon :
/// 1. points d'accès, puis réseaux locaux (interfaces réelles) ;
/// 2. à défaut, link-local (pairing sans DHCP) ;
/// 3. à défaut, interfaces virtuelles (dernier recours).
/// Une interface virtuelle n'est jamais un point d'accès. Doublons d'IP éliminés.
pub fn pick_addresses(ifaces: &[Iface]) -> Vec<Candidate> {
    let mut seen = HashSet::new();
    let (mut hotspot, mut lan, mut link_local, mut virtuals) = (vec![], vec![], vec![], vec![]);

    for i in ifaces {
        if !is_pairable(i.ip) || !seen.insert(i.ip) {
            continue;
        }
        let (kind, bucket) = if is_virtual(&i.name) {
            (AddrKind::Virtual, &mut virtuals)
        } else if HOTSPOTS.contains(&i.ip) {
            (AddrKind::Hotspot, &mut hotspot)
        } else if i.ip.is_link_local() {
            (AddrKind::LinkLocal, &mut link_local)
        } else {
            (AddrKind::Lan, &mut lan)
        };
        bucket.push(Candidate {
            ip: i.ip,
            name: i.name.clone(),
            kind,
        });
    }

    let mut out = hotspot;
    out.extend(lan);
    if out.is_empty() {
        out = link_local;
    }
    if out.is_empty() {
        out = virtuals;
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn i(name: &str, ip: [u8; 4]) -> Iface {
        Iface {
            name: name.into(),
            ip: Ipv4Addr::from(ip),
        }
    }

    fn ips(v: &[Candidate]) -> Vec<String> {
        v.iter().map(|c| c.ip.to_string()).collect()
    }

    #[test]
    fn ignore_loopback_public_cgnat_et_non_specifiee() {
        let r = pick_addresses(&[
            i("lo", [127, 0, 0, 1]),
            i("Ethernet", [8, 8, 8, 8]),
            i("Tailscale", [100, 101, 2, 3]),
            i("x", [0, 0, 0, 0]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
    }

    #[test]
    fn bornes_de_172_16_12() {
        for (ip, ok) in [
            ([172, 15, 0, 1], false),
            ([172, 16, 0, 1], true),
            ([172, 31, 255, 254], true),
            ([172, 32, 0, 1], false),
            ([169, 254, 1, 1], true),
            ([127, 0, 0, 1], false),
        ] {
            assert_eq!(is_pairable(Ipv4Addr::from(ip)), ok, "{ip:?}");
        }
    }

    #[test]
    fn interfaces_virtuelles_ecartees_si_un_vrai_reseau_existe() {
        let r = pick_addresses(&[
            i("docker0", [172, 17, 0, 1]),
            i("vEthernet (WSL)", [172, 28, 0, 1]),
            i("VMware Network Adapter VMnet8", [192, 168, 52, 1]),
            i("VirtualBox Host-Only Ethernet Adapter", [192, 168, 56, 1]),
            i("tun0", [10, 8, 0, 2]),
            i("utun3", [10, 9, 0, 2]),
            i("wg0", [10, 7, 0, 2]),
            i("TAP-Windows Adapter V9", [10, 6, 0, 2]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
        assert_eq!(r[0].kind, AddrKind::Lan);
    }

    #[test]
    fn les_virtuelles_ne_servent_que_de_dernier_recours() {
        let r = pick_addresses(&[i("docker0", [172, 17, 0, 1])]);
        assert_eq!(ips(&r), vec!["172.17.0.1"]);
        assert_eq!(r[0].kind, AddrKind::Virtual);
    }

    #[test]
    fn points_d_acces_en_tete_puis_reseaux_locaux() {
        let r = pick_addresses(&[
            i("Ethernet", [192, 168, 1, 20]),
            i("Local Area Connection* 10", [192, 168, 137, 1]),
            i("wlan0", [192, 168, 43, 1]),
            i("en0", [172, 20, 10, 1]),
        ]);
        assert_eq!(
            ips(&r),
            vec!["192.168.137.1", "192.168.43.1", "172.20.10.1", "192.168.1.20"]
        );
        assert_eq!(r[0].kind, AddrKind::Hotspot);
        assert_eq!(r[3].kind, AddrKind::Lan);
    }

    #[test]
    fn une_interface_virtuelle_n_est_jamais_un_point_d_acces() {
        let r = pick_addresses(&[
            i("vEthernet (Default Switch)", [192, 168, 137, 1]),
            i("Wi-Fi", [192, 168, 1, 20]),
        ]);
        assert_eq!(ips(&r), vec!["192.168.1.20"]);
    }

    #[test]
    fn link_local_seulement_sans_autre_reseau() {
        let seul = pick_addresses(&[i("Ethernet", [169, 254, 3, 4])]);
        assert_eq!(seul[0].kind, AddrKind::LinkLocal);

        let avec_wifi = pick_addresses(&[i("Ethernet", [169, 254, 3, 4]), i("Wi-Fi", [192, 168, 1, 20])]);
        assert_eq!(ips(&avec_wifi), vec!["192.168.1.20"]);
    }

    #[test]
    fn doublons_et_liste_vide() {
        let r = pick_addresses(&[i("Wi-Fi", [192, 168, 1, 20]), i("Wi-Fi 2", [192, 168, 1, 20])]);
        assert_eq!(r.len(), 1);
        assert!(pick_addresses(&[]).is_empty());
    }
}

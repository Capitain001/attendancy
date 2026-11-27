Étape C : point 9, battement et file bornée

Délai d'inactivité de 60 s sans aucune trame (idle_timeout dans HubConfig).
File de sortie bornée avec try_send. Si elle est pleine, le client lent reçoit une trame Close et est déconnecté. Il rattrapera ce qu'il a manqué par known à sa reconnexion.
Pour envoyer ce Close, il faut un signal d'éviction par client, parce qu'une file pleine ne peut plus recevoir de Close.
Un write_timeout sur les envois, pour le point signalé plus haut.
Un test et une mutation par ajout : file pleine, inactivité et délai d'écritur

Voici le plan détaillé de l'étape C, sans code. Il se base sur la lecture de hub.rs (vu) ; les comportements réseau notés « supposé » restent à confirmer à l'exécution.

dans hub.rs
Chaque client a une file mpsc::unbounded_channel. store_and_fan_out fait client.tx.send(...) sous le verrou, donc sans limite de mémoire.
Dans la boucle de handle, chaque sink.send(...).await est sans délai. Si le client ne lit plus et que ses tampons TCP sont pleins, la tâche reste bloquée à cet endroit.
Conséquence : la tâche ne regarde plus ni le signal d'arrêt, ni les trames entrantes, ni la file. Une file bornée seule ne suffit donc pas, il faut aussi un délai d'écriture.
Nouveaux champs de HubConfig
Champ	Défaut proposé	Rôle
idle_timeout	60 s	Aucune trame reçue (texte, binaire, ping, pong) : on ferme.
write_timeout	10 s	Plafond de chaque écriture vers un client.
out_queue_capacity	256	Messages en attente par client.

Pas de nouveau flag CLI, donc KNOWN_OPTIONS ne change pas.

Conception
Inactivité : un Sleep repoussé à chaque trame reçue. À l'échéance, le relais envoie un Close (code 1008, raison idle_timeout) puis ferme. Seules les trames reçues comptent, pas celles qu'on envoie. Elle ne s'applique qu'après le hello, qui a déjà son délai.
File bornée : mpsc::channel(capacité) et try_send. Sur Full, le client est retiré de clients immédiatement, ce qui borne la mémoire et corrige peer_count. Un signal Notify réveille sa tâche pour qu'elle envoie un Close (code 1013, raison slow_consumer). Il est traité en priorité par rapport à la file (biased). Les messages déjà en file sont abandonnés. Le client rattrape par known à sa reconnexion.
Délai d'écriture : une fonction qui enveloppe chaque sink.send et sink.close dans un timeout. Si le délai est dépassé, la tâche s'arrête et le socket est abandonné.
Écart avec ce que tu avais décidé

Tu avais écrit « file pleine = on ferme le client lent par une trame Close ». Ce n'est garanti que si le socket du client accepte encore une écriture. Quand ses tampons TCP sont pleins, le Close ne peut pas partir. Ce client est alors déconnecté par le délai d'écriture, sans Close.

Je documente donc le Close comme au mieux (best-effort).
La garantie qui compte est que le client soit retiré, que la mémoire soit bornée et que la tâche soit libérée.
Tests Rust (à ajouter à tests/hub.rs)
Test	Vérifie
inactif_est_coupe_avec_close	Avec idle_timeout = 300 ms, un client silencieux reçoit un Close idle_timeout en moins d'une seconde et peer_count retombe.
les_pings_gardent_la_connexion	Des pings toutes les 100 ms pendant 1 s ne coupent pas la connexion, et chaque ping reçoit son pong.
lecteur_lent_est_evince	Un client ne lit plus et l'hôte publie environ 30 Mo via post_as_host : peer_count retombe avant le write_timeout, et un autre client reçoit tout.
lecteur_evince_recoit_close_puis_rattrape	Le lecteur reprend sa lecture avant le write_timeout : il reçoit un Close slow_consumer. Reconnecté avec known, il récupère exactement le reste.
ecriture_bloquee_ne_retient_pas_l_arret	Le lecteur ne reprend jamais sa lecture : stop() rend la main en moins de 1,5 s, alors que stop_grace vaut 3 s.

Pour remplir les tampons, le client est un TcpSocket avec un petit tampon de réception, puis la poignée de main WebSocket. Le volume est élevé pour que le test ne dépende pas de la taille des tampons de l'OS (supposé : Linux le supporte, Windows et macOS à confirmer).

Mutations (une par ajout, le test doit échouer)
Mutation	Test qui doit échouer
Plus de remise à zéro du délai d'inactivité	les_pings_gardent_la_connexion
Plus d'échéance d'inactivité	inactif_est_coupe_avec_close
File quasi illimitée (capacité énorme)	lecteur_lent_est_evince
Éviction sans retrait de clients	lecteur_lent_est_evince
Plus d'envoi du Close	lecteur_evince_recoit_close_puis_rattrape
Plus de délai d'écriture	ecriture_bloquee_ne_retient_pas_l_arret
Livraison


Points à trancher
Défauts : 60 s, 10 s et 256 . Le profil métier pourra les surcharger, comme pour max_connections.
Navigateur : un onglet en arrière-plan peut ralentir ses minuteurs à environ une fois par minute. Le client peut donc dépasser 60 s sans ping, être coupé et se reconnecter. Il rattrape par known, donc c'est sans perte. 
pr éviter ces coupures, 120 s. Ma recommandation : garder 60 s.
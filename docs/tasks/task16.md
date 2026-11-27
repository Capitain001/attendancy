Constats brique 6
Le transport ignore omitted (aucune occurrence dans lan-transport.ts). Quand le welcome est tronqué, le relais compte sur une reconnexion pour envoyer la suite, mais rien ne la déclenche : sur une connexion stable, l'historique omis n'arrive jamais. L'écran afficherait « Connecté » alors que l'historique est partiel. Il faut trancher avant l'interface (question 1).

Cause possible de scintillement : confirm() retire les entrées de l'inbox, donc known rétrécit, donc le relais renvoie ces messages à la reconnexion. Ils réapparaissent comme « non confirmés » jusqu'au prochain confirm. Le compteur de l'écran doit exclure les ids déjà persistés.
Collision de noms : index.ts exporte ChatMessage et MessageStatus du package, deux types de formes différentes de ceux de hooks/chat/types. À renommer ou à importer avec soin.
Détail : un commentaire de relay-host.ts parle de « sidecar Tauri », or la décision actée est la bibliothèque. Il vaut mieux le corriger.
Plan de la brique 6
#	Étape	Critère de fin
6.0	Audit du provider réel : canaux passés au hello, connectLan sans paramètre de canaux, effacement de la reprise après refus définitif, état exposé	Liste d'écarts validée, aucun code
6.1	lan-status (états, raisons de refus en français, pluriels) dans packages/ui	Tests unitaires (fonctions pures)
6.2	JoinLan et QrScanner, contrôlés : props onSubmit(raw) → message d'erreur ou null, canScan, scanner injectable	Se rend sans importer le moteur
6.3	LanPanel (colle, apps/web) : appelle decodePairing, connectLan, lit lan, compteurs, avis « identité déclarée » + route /local côté « rejoindre »	Un lien collé connecte, un code périmé affiche la raison
6.4	HostLan, contrôlé (lien, occupé, erreur, onStart/onStop) : en attente du LanHost natif de la brique 7	Se rend avec un faux hôte
6.5	Essai manuel PC ↔ téléphone via l'écran	Les trois scénarios : lien valide, mauvais jeton, relais arrêté

Étapes 6.1 à 6.3 indépendantes des décisions ci-dessous sauf la question 1 pour le libellé « connecté ».

Décisions à prendre
omitted. Recommandation : le transport se reconnecte une fois le backlog reçu, avec known à jour, jusqu'à omitted = 0 (borné à une dizaine de tours). Il faut attendre que les écritures de l'inbox soient terminées avant de relire known, sinon le relais renvoie les mêmes messages. Test e2e à prévoir ; il demande une option --max-welcome-bytes dans KNOWN_OPTIONS du binaire. Alternative : afficher « historique partiel » sans le rattraper.
Canaux au hello. Recommandation : connectLan(pairing, { channels? }), le profil métier impose les canaux, la liste du provider sert de repli. À confirmer aussi : route.tsx passe-t-il toujours [] ?
QR de l'hôte. Recommandation : HostLan reçoit une fonction renderQr(lien), pour ne pas ajouter une bibliothèque de QR au bundle des élèves. Seule l'application hôte en dépend.
Essai iPhone de la brique 3. Page web ou app ? C'est ce qui décide si QrScanner (sans BarcodeDetector sur Safari) ne sert qu'au collage du lien, et si le message « page sécurisée » doit apparaître.
Identité déclarée à l'écran. Recommandation : un avis dans LanPanel et une info-bulle sur les messages non confirmés (« nom annoncé par l'appareil, non vérifié »). Ça touche MessageBubble (fichier de l'interface du fil).
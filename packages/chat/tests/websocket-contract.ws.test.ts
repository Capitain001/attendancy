//packages\chat\tests\websocket-contract.ws.test.ts
import { webSocketCtorContract } from './testing/websocket-contract'
import { wsTarget } from './testing/ws-server'

// La référence d'abord : si `ws` échoue ici, c'est la suite qui est fausse, pas l'adaptateur
webSocketCtorContract('ws (référence)', wsTarget)

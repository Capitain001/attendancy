import { describe, expect, it } from 'vitest'
import { describeLan, describeOmitted } from '@attendancy/ui'

describe('lan-status', () => {
  it('describeOmitted : null si 0 ou négatif, singulier et pluriel sinon', () => {
    expect(describeOmitted(0)).toBeNull()
    expect(describeOmitted(-3)).toBeNull()
    expect(describeOmitted(1)).toBe(
      "Historique incomplet sur cet appareil : 1 message plus ancien non reçu. Le serveur les restituera au retour d'Internet.",
    )
    expect(describeOmitted(5)).toBe(
      "Historique incomplet sur cet appareil : 5 messages plus anciens non reçus. Le serveur les restituera au retour d'Internet.",
    )
  })

  it('describeLan : gère author_reserved et les états de transport', () => {
    const reserved = describeLan('closed', 'author_reserved')
    expect(reserved.tone).toBe('error')
    expect(reserved.label).toBe('Connexion refusée')
    expect(reserved.detail).toContain('réservé à l')

    const noChannels = describeLan('closed', 'no_channels')
    expect(noChannels.tone).toBe('wait')
    expect(noChannels.label).toBe('En attente des canaux')
    expect(noChannels.detail).toContain('Aucun canal')

    expect(describeLan('connected', null)).toEqual({ label: 'Connecté au réseau local', tone: 'on' })
    expect(describeLan('connecting', null)).toEqual({ label: 'Connexion en cours…', tone: 'wait' })
    expect(describeLan('idle', null)).toEqual({ label: 'Non connecté', tone: 'off' })
  })
})

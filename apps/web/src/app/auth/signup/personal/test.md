// // signup-personal-form.test.tsx
// import { render, screen } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { expect, it, vi } from 'vitest'
// import { SignupPersonalForm } from './signup-personal-form'

// it("affiche l'erreur renvoyée par l'action", async () => {
//   const action = vi.fn().mockResolvedValue({ error: 'Email déjà utilisé' })
//   render(<SignupPersonalForm action={action} />)

//   await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
//   await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse123')
//   await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

//   expect(await screen.findByRole('alert')).toHaveTextContent('Email déjà utilisé')
//   expect(action).toHaveBeenCalledWith(null, expect.any(FormData))
// })
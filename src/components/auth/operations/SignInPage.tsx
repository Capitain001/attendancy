import { login } from "@/modules/auth/actions";
import { GlassInputWrapper, GoogleIcon } from "../ui/components";
import { PasswordInput } from "../ui/PasswordInput";



interface SignInPageProps {
  searchParams?: { error?: string };
}

export function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              Connexion
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              Connectez-vous à votre compte
            </p>

            {/* Affichage des erreurs */}
            {searchParams?.error && (
              <div className="animate-element animate-delay-250 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {searchParams.error}
              </div>
            )}

            {/* Formulaire avec action serveur */}
            <form className="space-y-5" action={login}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                  />
                </GlassInputWrapper>
              </div>

              <PasswordInput 
                name="password"
                label="Password"
                placeholder="Enter your password"
                delay="animate-delay-400"
              />

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <a href="/auth/reset" className="hover:underline text-violet-400 transition-colors">
                  Reset password
                </a>
              </div>

              <button 
                type="submit" 
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                Or continue with
              </span>
            </div>

            <button 
              type="button"
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              New to our platform?{" "}
              <a href="/auth/signup" className="text-violet-400 hover:underline transition-colors">
                Create Account
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
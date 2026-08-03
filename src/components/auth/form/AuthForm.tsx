
import LoginForm from "../operations/LoginForm";
import AuthBar from "../ui/authBar";
import FormCard from "../ui/FormCard";
import Image from "next/image";
import { InfoCard } from "../ui/InfoCard";
import GoogleSignInButton from "../ui/GoogleSignInButton";




export default function AuthForm() {
  return (
    <div className="relative flex h-full min-h-screen items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10 block h-full w-full rounded-md">
        <Image
          src="/attendancy.jpeg"
          alt="Attendancy Background"
          fill
          priority
          className="object-cover opacity-20"
        />
      </div>

      {/* Content (form on right, layout reversed on large screens) */}
      <div className="z-10 flex h-full w-full flex-col rounded-md lg:flex-row-reverse">
        {/* Right side (Form section) */}
        <div className="flex w-full flex-col items-center justify-center rounded-md p-6 backdrop-blur-sm lg:w-1/2">
          <div className="mb-8 flex w-full max-w-md flex-col">
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex aspect-square shrink-0 items-center justify-center rounded-full border-2"
                aria-hidden="true"
              >
                {/* <Logo className="w-24" /> */}
                <div className="float-animation relative -right-2 -z-20 flex">
                  <InfoCard note={10} />
                </div>
              </div>

              <AuthBar title="Connexion" />
            </div>

            <FormCard>
              <LoginForm />
            </FormCard>

            <div className="my-4 flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              <span className="text-xs text-muted-foreground">Or</span>
            </div>

            {/* <Button variant="outline">Continue with Google</Button> */}
            <GoogleSignInButton className="w-full rounded-md border-2"/>
            <div className="mt-4 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <a
                  href="/auth/signup"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Créez votre établissement
                </a>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Si vous n'avez pas reçu d'invitation, contactez votre
                établissement ou{" "}
                <a
                  className="underline hover:no-underline"
                  href="mailto:capitainstuart@gmail.com"
                >
                  laissez-nous un message
                </a>
                .
              </p>
            </div>

            {/* <AuthBar lightPosition="right" /> */}
          </div>
        </div>

        {/* Left side (empty placeholder for balance on desktop) */}
        <div className="hidden lg:block lg:w-1/2" />
      </div>
    </div>
  );
}

export function useParams<T = Record<string, string>>(): T {
  return {} as T;
}

export function useRouter() {
  return {
    push: (url: string) => {},
    replace: (url: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  };
}

export function usePathname(): string {
  return window.location.pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

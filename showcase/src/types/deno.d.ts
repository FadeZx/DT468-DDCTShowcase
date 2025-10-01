// Type declarations for Deno environment (Supabase Edge Functions)
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

// Hono framework types for Edge Functions
declare module 'npm:hono' {
  export class Hono {
    constructor();
    use(...args: any[]): void;
    get(path: string, handler: (c: any) => any): void;
    post(path: string, handler: (c: any) => any): void;
    put(path: string, handler: (c: any) => any): void;
    delete(path: string, handler: (c: any) => any): void;
    onError(handler: (err: any, c: any) => any): void;
    fetch(request: Request): Response | Promise<Response>;
    fire(): void;
  }
}

declare module 'npm:hono/cors' {
  export function cors(options?: any): any;
}

declare module 'npm:hono/logger' {
  export function logger(fn?: (message: string, ...args: any[]) => void): any;
}

declare module 'npm:@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}
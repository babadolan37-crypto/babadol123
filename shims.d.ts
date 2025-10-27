// Minimal module shims to quiet TypeScript missing-module diagnostics until dependencies are installed

// Core React runtime
declare module 'react' {
  export function useState<T>(initialState: T): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
  export function createContext<T>(defaultValue: T): any;
  export function useContext(context: any): any;
  export function forwardRef<T, P = {}>(component: (props: P, ref: any) => any): any;
  export function useId(): string;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export type ReactNode = any;
  export type ComponentType<P = {}> = any;
  export type ElementRef<T = any> = any;
  export type ComponentPropsWithoutRef<T> = any;
  export interface CSSProperties {
    [key: string]: any;
  }
  export interface KeyboardEvent<T = Element> {
    key: string;
    preventDefault(): void;
  }
  export interface FormEvent<T = Element> {
    preventDefault(): void;
  }
  export interface ImgHTMLAttributes<T> {
    src?: string;
    alt?: string;
    className?: string;
    style?: any;
    onError?: () => void;
    [key: string]: any;
  }
  export namespace React {
    export type ComponentProps<T extends keyof JSX.IntrinsicElements> = {
      className?: string;
      children?: ReactNode;
      [key: string]: any;
    }
    export type ComponentPropsWithoutRef<T extends keyof JSX.IntrinsicElements> = {
      className?: string;
      children?: ReactNode;
      [key: string]: any;
    }
    export interface HTMLAttributes<T> {
      className?: string;
      children?: ReactNode;
      [key: string]: any;
    }
    export type ReactNode = any;
  }
}
declare module 'react/jsx-runtime';
declare module 'react-dom';

// UI/Libs
declare module 'lucide-react';
declare module '@radix-ui/react-tooltip';
declare module '@radix-ui/react-toggle';
declare module '@radix-ui/react-toggle-group';
declare module '@radix-ui/react-tabs';
declare module '@radix-ui/react-switch';
declare module '@radix-ui/react-slot';
declare module '@radix-ui/react-slider';
declare module '@radix-ui/react-separator';
declare module '@radix-ui/react-select';
declare module '@radix-ui/react-scroll-area';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-progress';
declare module '@radix-ui/react-popover';
declare module '@radix-ui/react-navigation-menu';
declare module '@radix-ui/react-menubar';
declare module '@radix-ui/react-label';
declare module '@radix-ui/react-hover-card';
declare module '@radix-ui/react-dropdown-menu';
declare module '@radix-ui/react-dialog';
declare module '@radix-ui/react-context-menu';
declare module '@radix-ui/react-collapsible';
declare module '@radix-ui/react-checkbox';
declare module '@radix-ui/react-avatar';
declare module '@radix-ui/react-aspect-ratio';
declare module '@radix-ui/react-alert-dialog';
declare module '@radix-ui/react-accordion';

declare module 'class-variance-authority' {
  export function cva(...args: any[]): any;
  export type VariantProps<T> = any;
}
declare module 'clsx';
declare module 'cmdk';
declare module 'date-fns';
declare module 'embla-carousel-react';
declare module 'hono';
declare module 'hono/cors';
declare module 'hono/logger';
declare module 'input-otp';
declare module 'next-themes';
declare module 'react-day-picker';
declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): any;
}
declare module 'react-hook-form' {
  export type FieldValues = any;
  export type FieldPath<T> = string;
  export type ControllerProps<T, TName> = any;
  export function Controller(props: any): any;
  export const FormProvider: any;
  export function useFormContext(): any;
  export function useFormState(options: any): any;
}
declare module 'react-resizable-panels';
declare module 'recharts';
declare module 'sonner';
declare module 'tailwind-merge';
declare module 'vaul';

declare module '@jsr/supabase__supabase-js';
declare module '@supabase/supabase-js';

// Build tools and Node core shims
declare module 'vite';
declare module '@vitejs/plugin-react-swc';
declare module 'path';

declare const process: any;

// Deno global used in server-side files; declared here to quiet TS in editor
declare const Deno: any;


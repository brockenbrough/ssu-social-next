'use client';
 
import { montserrat } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { useSearchParams } from 'next/navigation';
import {useEffect, useState } from 'react'; 
 
export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/portal/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const stored = typeof window !== 'undefined' ?localStorage.getItem('theme') : null;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldDark);
    if(shouldDark){
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }  
  }, []);

  const toggleTheme = () =>{
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    

  };
 
  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8 dark:bg-gray-900">

<div className="mb-2 flex justify-end">
  <button
    type="button"
    onClick={toggleTheme}
    aria-pressed={isDark}
    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-700"
  >
    {isDark ? (
      <>
        <SunIcon className="h-4 w-4" />
        Light
      </>
    ) : (
      <>
        <MoonIcon className="h-4 w-4" />
        Dark
      </>
    )}
  </button>
</div>

        <h1 className={`${montserrat.className} mb-3 text-2xl dark:text-gray-100`}>
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="email"
            >
              electronic correspondence address
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                id="email"
                type="email"
                name="email"
                placeholder="give me your email address, I probably wont fill your inbox with spam..."
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:text-gray-400 dark:peer-focus:text-gray-100" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900 dark:text-gray-200"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:text-gray-400 dark:peer-focus:text-gray-100" />
            </div>
          </div>
        </div>
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button className="mt-4 w-full" aria-disabled={isPending}>
          This Log In is brought to you by the Malevolent Being Transit Authority <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <a href="/portal/register" className="block mt-2">
          <Button className="w-full" type="button">
            New User? Good luck... <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
        </a>
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
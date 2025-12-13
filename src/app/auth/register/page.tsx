import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: 'Register | Project 500 Pages',
  description: 'Create a new account to start your journey.',
};

/**
 * The main registration page component.
 * It wraps the RegisterForm in a centered card layout.
 */
export default function RegisterPage() {
  return (
    <Shell className="max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to register for Project 500 Pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 
            Suspense boundary is used here in case the RegisterForm 
            or its dependencies (like hooks using search params) need it.
          */}
          <Suspense fallback={<div>Loading form...</div>}>
            <RegisterForm />
          </Suspense>

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              aria-label="Sign in"
              href="/auth/login"
              className="text-primary underline-offset-4 transition-colors hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
import type { ReactNode } from 'react';

type PageAtmosphereProps = {
  image?: string;
  alt?: string;
  align?: 'left' | 'right' | 'center';
  intensity?: 'soft' | 'medium' | 'strong';
  glow?: 'orange' | 'gold' | 'mixed' | 'none';
  className?: string;
  children: ReactNode;
};

export default function PageAtmosphere({ className = '', children }: PageAtmosphereProps) {
  return (
    <section className={`site-background-soft relative isolate overflow-hidden ${className}`.trim()}>
      {children}
    </section>
  );
}

export function SectionAtmosphere({
  className = '',
  children,
}: {
  image?: string;
  alt?: string;
  position?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`site-background-soft relative isolate overflow-hidden ${className}`.trim()}>
      {children}
    </section>
  );
}

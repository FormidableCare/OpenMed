'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { OpenMedIcon } from '@/components/OpenMedIcon';

function isActive(pathname: string, match: (pathname: string) => boolean) {
  return match(pathname);
}

export function Navigation() {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Medications',
      href: '/',
      match: (path: string) =>
        path === '/' ||
        path === '/medications' ||
        /^\/medications(\/[^\/]+)?$/.test(path),
    },
    {
      name: 'Statistics',
      href: '/statistics',
      match: (path: string) =>
        path === '/statistics', 
    },
  ];

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className="flex items-center justify-between h-16">
          {/* Left: OpenMed logo and name */}
          <div className="flex items-center">
            <Link href='/' className='flex items-center space-x-2'>
              <OpenMedIcon className='text-cyan-600' size={30} />
              <span className='text-xl font-bold text-cyan-600'>OpenMed</span>
            </Link>
          </div>
          {/* Right: Navigation */}
          <div className='hidden sm:flex sm:space-x-3'>
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                  isActive(pathname, item.match)
                    ? 'bg-pink-50 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

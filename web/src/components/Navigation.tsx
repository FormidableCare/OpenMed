'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { OpenMedIcon } from '@/components/OpenMedIcon';

export function Navigation() {
  const pathname = usePathname();

  const navigation = [{ name: 'Statistics', href: '/statistics' }];

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <Link href='/' className='flex items-center space-x-3'>
                <div className=''>
                  <OpenMedIcon className='text-cyan-600' size={32} />
                </div>
                <span className='text-xl font-bold text-gray-900'>OpenMed</span>
              </Link>
            </div>
            <div className='hidden sm:ml-6 sm:flex sm:space-x-6'>
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

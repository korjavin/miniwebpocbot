'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="bg-white shadow-sm mb-6">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            
            <Link 
              href="/admin" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/admin' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Admin
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{user.name}</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                {user.balance} points
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

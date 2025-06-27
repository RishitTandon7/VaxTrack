import React from 'react';
import { LogOut, User, Stethoscope, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout, isDoctor } = useAuth();

  if (!user) return null;

  return (
    <header className={`${
      isDoctor 
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600' 
        : 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600'
    } shadow-lg relative overflow-hidden`}>
      {/* Background decorations */}
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
              <div className="relative p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                {isDoctor ? (
                  <Stethoscope className="h-8 w-8 text-white" />
                ) : (
                  <Heart className="h-8 w-8 text-white animate-pulse" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white">
                  {isDoctor ? 'Medical Dashboard' : 'My Vaccination Records'}
                </h1>
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-white/80 text-sm">
                {isDoctor ? 'Professional Care Management' : 'Stay healthy, stay strong! 🌟'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-white/80 capitalize">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="group flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 text-white"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
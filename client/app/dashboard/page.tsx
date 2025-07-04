"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { shouldRedirect, isLoading } = useRequireAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-amber-900 mb-2">
                Ciao {user.firstName}! ☕
              </h1>
              <p className="text-amber-700 text-lg">
                Benvenuto nella tua dashboard Caffis
              </p>
            </div>
            
            {/* User Avatar */}
            <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
          
          {/* User Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900">Profilo</h3>
              <p className="text-sm text-amber-700">@{user.username}</p>
              <p className="text-sm text-amber-700">{user.email || user.phoneNumber}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Verifica</h3>
              <div className="space-y-1">
                {user.isEmailVerified && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    ✓ Email verificata
                  </span>
                )}
                {user.isPhoneVerified && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    ✓ Telefono verificato
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Onboarding</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                user.onboardingCompleted 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-yellow-200 text-yellow-800'
              }`}>
                {user.onboardingCompleted ? '✓ Completato' : '⏳ In corso'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">☕</div>
              <h3 className="font-bold text-gray-900 mb-2">Trova Caffè</h3>
              <p className="text-gray-600 text-sm">Scopri eventi caffè vicino a te</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="font-bold text-gray-900 mb-2">Crea Evento</h3>
              <p className="text-gray-600 text-sm">Organizza un incontro caffè</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-bold text-gray-900 mb-2">I Miei Incontri</h3>
              <p className="text-gray-600 text-sm">Gestisci i tuoi eventi</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Attività Recente
          </h2>
          
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Benvenuto in Caffis!
            </h3>
            <p className="text-gray-600 mb-6">
              Sei pronto per iniziare la tua avventura social-caffè?
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/onboarding')}
                className="block w-full md:w-auto md:inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition mx-auto"
              >
                🤖 Rivedi Onboarding
              </button>
              
              <button className="block w-full md:w-auto md:inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition mx-auto md:ml-4">
                ☕ Trova Eventi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LoginPage } from '../pages/Auth/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ParticipantsPage } from '../pages/Participants/ParticipantsPage';
import { EventsPage } from '../pages/Events/EventsPage';
import { PairFormationPage } from '../pages/PairFormation/PairFormationPage';
import { HistoryPage } from '../pages/History/HistoryPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="participantes" element={<ParticipantsPage />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="duplas" element={<PairFormationPage />} />
        <Route path="historico" element={<HistoryPage />} />
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

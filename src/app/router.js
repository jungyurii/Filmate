import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import MovieDetailPage from "../pages/MovieDetailPage";
import BookingPage from "../pages/BookingPage";
import TicketsPage from "../pages/TicketsPage";
import SearchPage from "../pages/SearchPage";
import WishlistPage from "../pages/WishlistPage";
import ComingSoonPage from "../pages/ComingSoonPage";
import SeriesPage from "../pages/SeriesPage";
import SeriesDetailPage from "../pages/SeriesDetailPage";
import NotFoundPage from "../pages/NotFoundPage";
import Layout from "../components/Layout";
import LoginPage from "../pages/LoginPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/shows" element={<SeriesPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/shows/:id" element={<SeriesDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:id" element={<BookingPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

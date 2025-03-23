
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClubsList from "@/components/clubs/ClubsList";
import ClubDetail from "@/components/clubs/ClubDetail";
import { ClubProvider } from "@/contexts/ClubContext";

const Clubs = () => {
  return (
    <div className="min-h-screen bg-white">
      <ClubProvider>
        <Header />
        <Routes>
          <Route path="/" element={
            <main className="pt-24 pb-16">
              <div className="container-narrow max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                  <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Campus Clubs & Activities</h1>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Discover and join student clubs, attend events, and engage with the SFU community.
                  </p>
                </div>
                <ClubsList />
              </div>
            </main>
          } />
          <Route path=":id" element={<ClubDetail />} />
        </Routes>
        <Footer />
      </ClubProvider>
    </div>
  );
};

export default Clubs;

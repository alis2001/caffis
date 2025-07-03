"use client";

import React from "react";
import ReactFullpage from "@fullpage/react-fullpage";
import SplitCardsSection from "@/components/SplitCardsSection";
import Footer from "@/components/Footer";

export default function LandingSections() {
  return (
    <ReactFullpage
      licenseKey={"gplv3-license"}
      scrollingSpeed={900}
      navigation
      anchors={["hero", "splitcards", "footer"]}
      scrollOverflow={true}
      render={() => {
        return (
          <ReactFullpage.Wrapper>
            {/* Hero Section */}
            <div className="section h-screen w-screen relative flex items-stretch justify-center">
              <img
                src="/hero.png"
                alt="Caffis Hero"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
              />
              <div
                className="absolute inset-0 bg-black/30"
                style={{ zIndex: 1 }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
                <h1 className="text-5xl md:text-7xl font-extrabold drop-shadow-lg tracking-tight">
                  Caffis
                </h1>
                <p className="mt-4 text-xl md:text-2xl font-medium max-w-xl drop-shadow-sm">
                  Spontaneous coffee meetups. One tap away.
                </p>
                <button
                  className="mt-8 px-8 py-3 bg-[#6BBF59] text-white font-semibold rounded-full shadow-xl hover:scale-105 transition duration-300"
                  onClick={() => window.fullpage_api?.moveSectionDown()}
                >
                  Join Now
                </button>
              </div>
            </div>

            {/* Split Cards Section */}
            <div className="section h-screen w-screen bg-brand-cream flex items-stretch justify-center">
              <SplitCardsSection />
            </div>

            {/* Footer Section */}
            <div className="section h-screen w-screen bg-[#FDF8F3] flex items-center justify-center">
                <div className="w-full max-w-7xl px-6">
                    <Footer />
                </div>
            </div>

          </ReactFullpage.Wrapper>
        );
      }}
    />
  );
}

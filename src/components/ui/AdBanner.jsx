// src/components/ui/AdBanner.jsx
import React, { useEffect, useRef } from 'react'

export default function AdBanner({ isPremium, dataAdSlot }) {
  // 1. If Premium, render nothing
  if (isPremium) return null

  // YOUR SPECIFIC GOOGLE ADSENSE IDS
  const AD_CLIENT_ID = "ca-pub-4296401310188622" 
  const DEFAULT_SLOT_ID = "5285433846" // Your Dashboard Banner ID
  
  // Use prop if provided, otherwise fallback to default
  const slotId = dataAdSlot || DEFAULT_SLOT_ID

  const adRef = useRef(null)

  useEffect(() => {
    // Safety check: prevent double-pushing ads in React Strict Mode
    // We check if the ad element exists and is empty before pushing
    if (adRef.current && adRef.current.innerHTML === "") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error("AdSense Error:", err)
      }
    }
  }, [])

  return (
    <div className="w-full my-6 flex flex-col items-center gap-2 overflow-hidden">
      <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        Advertisement
      </span>
      
      {/* Ad Container */}
      <div className="w-full max-w-[728px] min-h-[90px] bg-slate-800/30 rounded-lg flex justify-center items-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={AD_CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
          ref={adRef} 
        />
      </div>
    </div>
  )
}
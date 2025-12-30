// src/components/ui/AdBanner.jsx
import React, { useEffect } from 'react'

export default function AdBanner({ isPremium }) {
  // If user is premium, render nothing
  if (isPremium) return null

  useEffect(() => {
    // This is where you would initialize the Google AdSense push
    // try {
    //   (window.adsbygoogle = window.adsbygoogle || []).push({});
    // } catch (err) { console.error(err) }
  }, [])

  return (
    <div className="w-full my-6 flex justify-center">
      {/* Google AdSense Placeholder container */}
      <div className="bg-slate-800/50 border border-slate-700 w-full max-w-[728px] h-[90px] flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest rounded-lg">
        Google Ad Banner (728x90)
      </div>
      
      {/* Example AdSense Code Structure (Commented out until you have your ID) */}
      {/* <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-YOUR_ID_HERE"
           data-ad-slot="YOUR_SLOT_ID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins> 
      */}
    </div>
  )
}
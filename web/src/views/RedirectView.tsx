import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface RedirectViewProps {
  shortCode: string;
}

export const RedirectView: React.FC<RedirectViewProps> = ({ shortCode }) => {
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        const doc = await db.collection('tracking_links').doc(shortCode).get();

        if (!doc.exists) {
          setError('Link not found');
          return;
        }

        const data = doc.data();
        const originalUrl = data?.originalUrl;

        if (!originalUrl) {
          setError('Invalid link');
          return;
        }

        // Increment click count
        await db.collection('tracking_links').doc(shortCode).update({
          clicks: firebase.firestore.FieldValue.increment(1),
          lastClickAt: new Date().toISOString()
        });

        // Also update user's link collection
        if (data?.userId && data?.linkId) {
          await db.collection('users').doc(data.userId).collection('links').doc(data.linkId).update({
            clicks: firebase.firestore.FieldValue.increment(1)
          }).catch(() => {}); // Ignore errors here
        }

        setRedirectUrl(originalUrl);

        // Redirect after a brief moment
        setTimeout(() => {
          window.location.href = originalUrl;
        }, 500);

      } catch (err) {
        console.error('Redirect error:', err);
        setError('Error processing link');
      }
    };

    if (shortCode) {
      trackAndRedirect();
    }
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Error</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <ExternalLink size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Redirecting...</h1>
        <p className="text-slate-500 text-sm">
          {redirectUrl ? `To: ${redirectUrl.substring(0, 40)}...` : 'Please wait...'}
        </p>
      </div>
    </div>
  );
};

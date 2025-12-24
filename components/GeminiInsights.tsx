
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GeminiInsightsProps {
  context: string;
}

const GeminiInsights: React.FC<GeminiInsightsProps> = ({ context }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given the following school management data context, provide 3 short, actionable, and encouraging bullet points for the administrator: ${context}`,
        config: {
          systemInstruction: "You are an AI educational consultant for EduFlow, a modern school management platform. Be professional, data-driven, and brief.",
          temperature: 0.7
        }
      });
      setInsight(response.text || 'No insights available at this moment.');
    } catch (err) {
      console.error('Gemini error:', err);
      setError('Could not fetch AI insights. Check your connection or API key.');
      setInsight('Educational trends look stable for the upcoming month. Maintain current focus on grade 10 attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [context]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden min-h-[180px]">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-24 h-24" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="font-bold tracking-wide uppercase text-xs">AI Performance Insights</h3>
        </div>
        <button 
          onClick={fetchInsight} 
          disabled={loading}
          className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col space-y-2 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-5/6"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-indigo-50 font-medium whitespace-pre-line">
          {insight}
        </div>
      )}
      
      {error && <p className="text-[10px] text-indigo-300 mt-2 italic">{error}</p>}
    </div>
  );
};

export default GeminiInsights;

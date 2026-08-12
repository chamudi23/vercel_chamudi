import { createContext, useContext, useState, useCallback } from 'react';

const AnalysisContext = createContext(null);

/**
 * Generate a unique, meaningful Case ID.
 * Format: KGC-YYYYMMDD-XXXX
 *   KGC   = Kgc module prefix
 *   YYYYMMDD = today's date
 *   XXXX  = 4-digit random number (0001–9999)
 */
function generateCaseId() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const seqPart = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `KGC-${datePart}-${seqPart}`;
}

export function AnalysisProvider({ children }) {
  const [analysisData, setAnalysisData] = useState({
    basicInfo: {},
    measurements: {},
    predictions: {},
  });

  // Generate a case ID once when a new analysis starts
  const [currentCaseId, setCurrentCaseId] = useState(() => generateCaseId());

  const startNewAnalysis = useCallback(() => {
    setCurrentCaseId(generateCaseId());
    setAnalysisData({ basicInfo: {}, measurements: {}, predictions: {} });
  }, []);

  const setBasicInfo = (data) => {
    // Always attach the auto-generated caseId
    setAnalysisData((prev) => ({ ...prev, basicInfo: { ...data, caseId: currentCaseId } }));
  };

  const setMeasurements = (bonesType, data) => {
    setAnalysisData((prev) => ({
      ...prev,
      measurements: { bonesType, ...data },
    }));
  };

  const setPredictions = (data) => {
    setAnalysisData((prev) => ({ ...prev, predictions: data }));
  };

  const resetAnalysis = () => {
    setAnalysisData({ basicInfo: {}, measurements: {}, predictions: {} });
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysisData,
        currentCaseId,
        setBasicInfo,
        setMeasurements,
        setPredictions,
        resetAnalysis,
        startNewAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}

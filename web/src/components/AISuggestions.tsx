import { Sparkles } from 'lucide-react';

interface AISuggestion {
  value: string;
  confidence: number;
}

interface AISuggestionsProps {
  field: string;
  suggestions: Record<string, AISuggestion[]>;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function AISuggestions({ 
  field, 
  suggestions, 
  onSuggestionClick, 
  className = ''
}: AISuggestionsProps) {
  const fieldSuggestions = suggestions[field] || [];

  if (fieldSuggestions.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-300';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">AI Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {fieldSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.value)}
            className={`px-3 py-1 text-xs border rounded-full transition-colors duration-200 shadow-sm ${getConfidenceColor(suggestion.confidence)} hover:opacity-80`}
          >
            <div className="flex items-center gap-1">
              <span>{suggestion.value}</span>
              <span className={`text-xs px-1 py-0.5 rounded-full ${suggestion.confidence >= 0.8 ? 'bg-green-200' : suggestion.confidence >= 0.6 ? 'bg-yellow-200' : 'bg-red-200'}`}>
                {getConfidenceText(suggestion.confidence)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 
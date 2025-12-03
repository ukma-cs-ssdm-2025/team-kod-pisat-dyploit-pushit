import { useState, useMemo } from 'react';

export default function MultiSelect({ options, selectedIds, onChange, label, placeholder }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const toggleOption = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-blue-400 mb-2 font-medium cursor-default">{label}</label>
      
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors mb-2 cursor-text"
      />

      <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700/20 p-2 custom-scrollbar">
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isSelected = selectedIds.includes(option.id);
            return (
              <div 
                key={option.id} 
                onClick={() => toggleOption(option.id)}
                className={`flex items-center p-2 cursor-pointer rounded transition-colors ${
                  isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-gray-600/40 border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={isSelected ? 'text-blue-100' : 'text-gray-300'}>
                  {option.label}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm text-center py-2 cursor-default">Nothing found</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          return (
            <span key={id} className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center cursor-default">
              {option.label}
              <button 
                type="button"
                onClick={() => toggleOption(id)}
                className="ml-2 text-blue-200 hover:text-white font-bold cursor-pointer"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
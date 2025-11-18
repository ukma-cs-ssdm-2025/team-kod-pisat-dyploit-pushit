import { useState, useMemo } from 'react';

export default function MultiSelect({ options, selectedIds, onChange, label, placeholder }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Фільтруємо опції за пошуковим запитом
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
      <label className="block text-amber-400 mb-2">{label}</label>
      
      {/* Поле пошуку */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder || "Пошук..."}
        className="w-full p-2 mb-2 bg-transparent border-2 border-amber-500/30 rounded-lg text-white focus:outline-none focus:border-amber-400 text-sm"
      />

      {/* Список опцій (з прокруткою) */}
      <div className="max-h-48 overflow-y-auto border border-amber-500/20 rounded-lg bg-purple-900/20 p-2">
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isSelected = selectedIds.includes(option.id);
            return (
              <div 
                key={option.id} 
                onClick={() => toggleOption(option.id)}
                className={`flex items-center p-2 cursor-pointer rounded transition-colors ${isSelected ? 'bg-amber-500/20' : 'hover:bg-purple-800/40'}`}
              >
                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-400'}`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={isSelected ? 'text-amber-100' : 'text-gray-300'}>
                  {option.label}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm text-center py-2">Нічого не знайдено</p>
        )}
      </div>

      {/* Обрані елементи (теги) */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          return (
            <span key={id} className="bg-amber-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
              {option.label}
              <button 
                type="button"
                onClick={() => toggleOption(id)}
                className="ml-2 text-amber-200 hover:text-white font-bold"
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
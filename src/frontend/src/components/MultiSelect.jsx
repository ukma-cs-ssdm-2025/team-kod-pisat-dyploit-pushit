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
      {label && (
        <label className="block text-[#d6cecf] mb-2 font-extrabold tracking-[0.12em] uppercase cursor-default">
          {label}
        </label>
      )}
      
      {/* SEARCH MOVIE — напівпрозорий фіолетовий */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="
          w-full
          bg-[#606aa2]/40        /* напівпрозорий фіолетовий */
          text-[#d6cecf]
          rounded-[12px]
          px-4 py-2
          focus:outline-none
          border-none
          placeholder:text-[#d6cecf]
          placeholder:opacity-50
          mb-2
        "
      />

      {/* СПИСОК — без border, темний, але виділення фіолетове */}
      <div
        className="
          max-h-48
          overflow-y-auto
          rounded-[12px]
          bg-[#0f0f0f]/70
          p-2
        "
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isSelected = selectedIds.includes(option.id);

            return (
              <div 
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`
                  flex items-center p-2 cursor-pointer rounded-[10px] transition-colors 
                  ${isSelected 
                    ? "bg-[#606aa2]/40"                 /* фіолетовий виділений */
                    : "hover:bg-[#606aa2]/20"
                  }
                `}
              >
                {/* ЧЕКБОКС — фіолетовий */}
                <div
                  className={`
                    w-5 h-5 rounded-[6px] border mr-3 flex items-center justify-center transition-colors
                    ${isSelected
                      ? "bg-[#606aa2] border-[#606aa2]"
                      : "border-[#929292]"
                    }
                  `}
                >
                  {isSelected && (
                    <span className="text-black text-xs font-bold">✓</span>
                  )}
                </div>

                {/* Текст */}
                <span className={`text-sm ${isSelected ? "text-[#e3e0e3]" : "text-[#d6cecf]"}`}>
                  {option.label}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm text-center py-2">Nothing found</p>
        )}
      </div>

      {/* ВИБРАНІ ТЕГИ — фіолетові, хрестик червоний */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;

          return (
            <span
              key={id}
              className="
                bg-[#606aa2]/70
                text-white
                text-xs
                px-3 py-1
                rounded-full
                flex items-center
              "
            >
              {option.label}

              <button
                type="button"
                onClick={() => toggleOption(id)}
                className="
                  ml-2
                  text-[#830707]
                  hover:text-[#900909]
                  font-bold
                  cursor-pointer
                "
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
